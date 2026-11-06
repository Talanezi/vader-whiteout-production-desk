import { useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import { flowRequest } from './api'
import type { LiveState } from '../../../../server/src/flows/live'
/** Existing production-log endpoint; durable FIFO requests survive disconnection
 * and reload. Per-entry preconditions let unrelated timestamps merge safely. */
export function useShootLog(
  id: string,
  doc: Y.Doc,
  user: number,
  connected: boolean,
) {
  const key = `whiteout:shoot-log-pending:${user}:${id}`
  const [queue, setQueue] = useState<any[]>(() => {
      try {
        const v = JSON.parse(localStorage.getItem(key) || '[]')
        return Array.isArray(v) ? v : []
      } catch {
        return []
      }
    }),
    [live, setLive] = useState<LiveState | undefined>(
      doc.getMap('meta').get('liveState') as LiveState,
    ),
    [error, setError] = useState(''),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false)
  const q = useRef(queue),
    state = useRef(live),
    sending = useRef(false),
    online = useRef(connected),
    calibration = useRef({ server: Date.now(), perf: performance.now() })
  online.current = connected
  state.current = live
  const saveQueue = (v: any[]) => {
    q.current = v
    setQueue(v)
    if (v.length) localStorage.setItem(key, JSON.stringify(v))
    else localStorage.removeItem(key)
  }
  const accept = (r: any) => {
    calibration.current = { server: r.serverNow, perf: performance.now() }
    setLive((old) =>
      old && old.revision > r.live.revision ? old : r.live,
    )
    state.current = r.live
  }
  async function flush() {
    if (sending.current || !online.current || !q.current.length || review)
      return
    sending.current = true
    setBusy(true)
    setError('')
    try {
      while (online.current && q.current.length) {
        const action = q.current[0]
        const r = await flowRequest(`/${id}/live`, action)
        accept(r)
        saveQueue(q.current.filter((a) => a.id !== action.id))
      }
    } catch (e) {
      setReview(Number((e as any).status) >= 400)
      setError((e as Error).message)
    } finally {
      sending.current = false
      setBusy(false)
    }
  }
  useEffect(() => {
    const update = () => {
      const v = doc.getMap('meta').get('liveState') as LiveState
      setLive(v)
      state.current = v
    }
    doc.getMap('meta').observe(update)
    return () => doc.getMap('meta').unobserve(update)
  }, [doc])
  useEffect(() => {
    if (connected) {
      void flowRequest(`/${id}/live`)
        .then(accept)
        .catch((e) => setError(e.message))
      if (!review) void flush()
    }
  }, [id, connected])
  function enqueue(type: string, eventId?: string, extra: any = {}) {
    if (review)
      throw Error(
        'Review the pending timestamp before recording more changes.',
      )
    if (eventId && q.current.some((a) => a.eventId === eventId))
      throw Error('This entry is pending. Reconnect before correcting it.')
    if (q.current.length >= 200)
      throw Error(
        'Reconnect to save the pending entries before recording more.',
      )
    const last = q.current[q.current.length - 1]
    const action = {
      id: crypto.randomUUID(),
      revision: last ? last.revision + 1 : state.current?.revision || 0,
      type,
      eventId,
      occurredAt:
        calibration.current.server +
        performance.now() -
        calibration.current.perf,
      ...extra,
    }
    saveQueue([...q.current, action])
    void flush()
  }
  return {
    live,
    queue,
    busy,
    error,
    review,
    enqueue,
    retry: () => {
      setReview(false)
      setError('')
      sending.current = false
      void flush()
    },
    discard: () => {
      if (busy) return
      saveQueue([])
      setReview(false)
      setError('')
      void flowRequest(`/${id}/live`).then(accept)
    },
    now: () =>
      calibration.current.server +
      performance.now() -
      calibration.current.perf,
  }
}
