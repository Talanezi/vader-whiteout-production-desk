import * as Y from 'yjs'
/** Account/document scoped CRDT deltas, never a competing snapshot database.
 * Recovery is called only after a fresh authorized server synchronization. */
export function pendingDocument(
  doc: Y.Doc,
  collection: string,
  id: string,
  user: number,
  onError: (message: string) => void,
) {
  const key = `whiteout:pending-yjs:${user}:${collection}:${id}`
  let started = false,
    delta: Uint8Array | undefined
  const encode = (b: Uint8Array) => {
    let v = ''
    for (let i = 0; i < b.length; i += 8192)
      v += String.fromCharCode(...b.subarray(i, i + 8192))
    return btoa(v)
  }
  const store = () => {
    if (!delta) return
    try {
      if (delta.byteLength > 2 * 1024 * 1024) throw Error('limit')
      localStorage.setItem(key, encode(delta))
    } catch {
      onError(
        'Changes remain in this window, but device recovery storage is full. Keep it open until Saved is confirmed.',
      )
    }
  }
  const update = (bytes: Uint8Array, origin: unknown) => {
    if (
      !started ||
      origin === 'pending-recovery' ||
      (origin as any)?.configuration?.document === doc
    )
      return
    delta = delta ? Y.mergeUpdates([delta, bytes]) : bytes
    store()
  }
  doc.on('update', update)
  return {
    recover() {
      if (started) return
      started = true
      const stored = localStorage.getItem(key)
      if (!stored) return
      try {
        delta = Uint8Array.from(atob(stored), (v) => v.charCodeAt(0))
        if (delta.length > 2 * 1024 * 1024) throw Error('limit')
        Y.applyUpdate(doc, delta, 'pending-recovery')
      } catch {
        onError(
          'A local recovery record could not be applied. Keep this window open and contact the production owner.',
        )
      }
    },
    confirm() {
      delta = undefined
      localStorage.removeItem(key)
    },
    destroy() {
      doc.off('update', update)
    },
  }
}
