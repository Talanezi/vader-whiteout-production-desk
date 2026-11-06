/** Shared request deadlines and safe-read recovery. Mutations are never blindly replayed. */
export class RequestFailure extends Error {
  constructor(
    message: string,
    public status = 0,
    public kind = 'network',
    public requestId = '',
  ) {
    super(message)
    this.name = 'RequestFailure'
  }
}
const sleep = (ms: number, signal?: AbortSignal | null) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(done, ms)
    function done() {
      signal?.removeEventListener('abort', abort)
      resolve()
    }
    function abort() {
      clearTimeout(timer)
      reject(new RequestFailure('Request cancelled.', 0, 'cancelled'))
    }
    signal?.addEventListener('abort', abort, { once: true })
    if (signal?.aborted) abort()
  })
export async function networkFetch(
  input: string,
  init: RequestInit = {},
  policy: { timeout?: number; retries?: number } = {},
) {
  const read = ['GET', 'HEAD'].includes(
    (init.method || 'GET').toUpperCase(),
  )
  const timeout =
      policy.timeout ??
      (/\/assets\//.test(input)
        ? input.includes('thumbnail=1')
          ? 30000
          : 900000
        : /\/sources\//.test(input)
          ? 120000
          : /\/pdf(?:\?|$)|\/department-pack(?:\?|$)/.test(input)
            ? 120000
            : 20000),
    retries = read ? (policy.retries ?? 2) : 0
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController()
    let timedOut = false,
      handedOff = false
    const timer = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, timeout),
      abort = () => controller.abort()
    init.signal?.addEventListener('abort', abort, { once: true })
    if (init.signal?.aborted) abort()
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
        cache: read ? 'no-store' : init.cache,
      })
      if (
        read &&
        attempt < retries &&
        [429, 502, 503, 504].includes(response.status)
      ) {
        await response.body?.cancel()
        clearTimeout(timer)
        const delay =
          Math.min(
            5000,
            Math.max(
              350 * 2 ** attempt,
              Number(response.headers.get('Retry-After') || 0) * 1000,
            ),
          ) +
          Math.random() * 200
        await sleep(delay, init.signal)
        continue
      }
      // Keep the deadline through body consumption; release it on completion/cancel.
      if (!response.body) {
        clearTimeout(timer)
        return response
      }
      const reader = response.body.getReader()
      const body = new ReadableStream<Uint8Array>({
        async pull(c) {
          try {
            const v = await reader.read()
            if (v.done) {
              clearTimeout(timer)
              init.signal?.removeEventListener('abort', abort)
              c.close()
            } else c.enqueue(v.value)
          } catch (e) {
            clearTimeout(timer)
            c.error(
              timedOut
                ? new RequestFailure(
                    'The service took too long to respond. Please retry.',
                    408,
                    'timeout',
                  )
                : e,
            )
          }
        },
        cancel(reason) {
          clearTimeout(timer)
          init.signal?.removeEventListener('abort', abort)
          return reader.cancel(reason)
        },
      })
      handedOff = true
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    } catch (e) {
      clearTimeout(timer)
      if (init.signal?.aborted)
        throw new RequestFailure('Request cancelled.', 0, 'cancelled')
      if (read && attempt < retries) {
        await sleep(350 * 2 ** attempt + Math.random() * 200, init.signal)
        continue
      }
      throw new RequestFailure(
        timedOut
          ? 'The service took too long to respond. Please retry.'
          : 'Unable to reach the service. Check your connection, then retry.',
        timedOut ? 408 : 0,
        timedOut ? 'timeout' : 'network',
      )
    } finally {
      if (!handedOff) init.signal?.removeEventListener('abort', abort)
    }
  }
}
export async function responseFailure(response: Response) {
  if (response.status === 401)
    return new RequestFailure('UNAUTHORIZED', 401, 'authentication')
  const defaults: Record<number, string> = {
    403: 'Your account does not have access to this production content.',
    408: 'The service took too long to respond. Please retry.',
    409: 'This record changed. Review the latest version before retrying.',
    429: 'Too many requests. Please wait a moment, then retry.',
    500: 'The service encountered a problem. Please retry.',
    502: 'The service is temporarily unavailable. Please retry.',
    503: 'The service is temporarily unavailable. Your session has been preserved; please retry.',
    504: 'The service took too long to respond. Please retry.',
  }
  const data = await response.json().catch(() => null),
    message =
      response.status < 500 && typeof data?.message === 'string'
        ? data.message.slice(0, 500)
        : defaults[response.status] ||
          'Could not complete the request. Please retry.'
  return new RequestFailure(
    message,
    response.status,
    response.status === 403
      ? 'authorization'
      : response.status === 429
        ? 'rate-limit'
        : response.status >= 500
          ? 'service'
          : 'request',
    response.headers.get('x-request-id') || '',
  )
}
