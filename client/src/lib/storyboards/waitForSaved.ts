import * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
/** Same durable acknowledgement contract as the accepted M03 actions. */
export function waitForStoryboardSaved(
  doc: Y.Doc,
  provider?: HocuspocusProvider,
) {
  if (!provider)
    return Promise.reject(
      Error('Connection unavailable. Keep this window open.'),
    )
  return new Promise<void>((resolve, reject) => {
    const stop = () => {
      clearTimeout(timer)
      provider.off('stateless', ack)
    }
    const timer = setTimeout(() => {
      stop()
      reject(
        Error(
          'Server save is not confirmed. Keep this window open and reconnect.',
        ),
      )
    }, 10000)
    const ack = async ({ payload }: { payload: string }) => {
      try {
        const message = JSON.parse(payload)
        if (message.type === 'persistence-error') {
          stop()
          reject(Error('Database save failed.'))
          return
        }
        if (message.type !== 'persisted') return
        const hash = await crypto.subtle.digest(
            'SHA-256',
            Y.encodeSnapshot(Y.snapshot(doc)) as BufferSource,
          ),
          digest = [...new Uint8Array(hash)]
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
        if (message.digest === digest) {
          stop()
          resolve()
        }
      } catch {}
    }
    provider.on('stateless', ack)
    provider.sendStateless('persistence-status')
  })
}
