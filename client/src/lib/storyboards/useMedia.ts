import { useEffect, useState } from 'react'
import { boardFetch } from './api'
/** Authenticated, keyed media URLs. Revision changes never briefly display the
 * previous artwork under a new annotation layer. URLs are revoked on release. */
export function useMedia(
  documentId: string,
  assetId?: string,
  thumbnail = false,
) {
  const key = `${documentId}:${assetId || ''}:${thumbnail}`
  const [attempt, setAttempt] = useState(0)
  const retry = () => setAttempt((n) => n + 1)
  const [state, setState] = useState({ key: '', url: '', error: '' })
  useEffect(() => {
    let alive = true,
      object = ''
    const abort = new AbortController()
    setState({ key, url: '', error: '' })
    if (!assetId) return
    boardFetch(
      `/${documentId}/assets/${assetId}${thumbnail ? '?thumbnail=1' : ''}`,
      { signal: abort.signal },
    )
      .then((r) => r.blob())
      .then((blob) => {
        if (alive) {
          object = URL.createObjectURL(blob)
          setState({ key, url: object, error: '' })
        }
      })
      .catch((e) => {
        if (alive && e.name !== 'AbortError')
          setState({ key, url: '', error: e.message })
      })
    return () => {
      alive = false
      abort.abort()
      if (object) URL.revokeObjectURL(object)
    }
  }, [documentId, assetId, thumbnail, key, attempt])
  return state.key === key
    ? { url: state.url, error: state.error, retry }
    : { url: '', error: '', retry }
}
