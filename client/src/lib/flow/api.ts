import { getAuthToken } from '../api'
import { shotApiBase } from '../shotApi'
export const flowBase = shotApiBase + '/flows'
export async function flowFetch(path: string, init: RequestInit = {}) {
  const response = await fetch(flowBase + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${getAuthToken() || ''}`,
      ...init.headers,
    },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw Error(
      response.status === 401
        ? 'UNAUTHORIZED'
        : error.message || 'Could not complete the Flow request.',
    )
  }
  return response
}
export async function flowRequest<T>(
  path: string,
  payload?: unknown,
): Promise<T> {
  return (
    await flowFetch(
      path,
      payload === undefined
        ? {}
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
    )
  ).json()
}
