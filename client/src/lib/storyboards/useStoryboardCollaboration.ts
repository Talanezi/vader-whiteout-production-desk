import { useEffect, useMemo, useState } from 'react'
import * as Y from 'yjs'
import { HocuspocusProvider } from '@hocuspocus/provider'
import { getAuthToken } from '../api'
import { shotApiBase, type ShotSession } from '../shotApi'
import { boardRequest } from './api'
const createStoryboardUndo = (doc: Y.Doc) =>
  new Y.UndoManager(
    ['panels', 'annotations', 'comments'].map((k) => doc.getMap(k)),
    { captureTimeout: 350 },
  )

export type Peer = {
  clientId: number
  user?: { id: number; name: string; color: string; colorLight: string }
  cell?: { shotId: string; field: string }
}
export function useStoryboardCollaboration(id: string) {
  const doc = useMemo(() => new Y.Doc(), [id])
  const undo = useMemo(() => createStoryboardUndo(doc), [doc])
  const [session, setSession] = useState<ShotSession>()
  const [provider, setProvider] = useState<HocuspocusProvider>()
  const [connected, setConnected] = useState(false),
    [synced, setSynced] = useState(false)
  const [saved, setSaved] = useState(false),
    [error, setError] = useState('')
  const [peers, setPeers] = useState<Peer[]>([]),
    [revision, setRevision] = useState(0)
  useEffect(() => {
    let alive = true,
      p: HocuspocusProvider | undefined,
      persisted = '',
      sequence = 0
    setSession(undefined)
    setError('')
    setSaved(false)
    setSynced(false)
    if (!getAuthToken()) {
      setError('UNAUTHORIZED')
      return
    }
    const digest = async () => {
      const current = ++sequence
      const data = Y.encodeSnapshot(Y.snapshot(doc))
      const hash = await crypto.subtle.digest('SHA-256', data as BufferSource)
      const hex = [...new Uint8Array(hash)]
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      if (alive && current === sequence) setSaved(hex === persisted)
    }
    const update = () => {
      setRevision((x) => x + 1)
      setSaved(false)
      void digest()
    }
    doc.on('update', update)
    boardRequest<ShotSession>(`/${id}/session`)
      .then((data) => {
        if (!alive) return
        setSession(data)
        const url = new URL(
          `${shotApiBase}/storyboards/collaboration`,
          window.location.href,
        )
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
        p = new HocuspocusProvider({
          url: url.toString(),
          name: id,
          document: doc,
          broadcast: false,
          connect: navigator.onLine,
          token: () => getAuthToken() || '',
          onStatus: ({ status }) => {
            if (alive) {
              setConnected(status === 'connected' && navigator.onLine)
              if (status !== 'connected') setSaved(false)
            }
          },
          onSynced: ({ state }) => {
            if (alive) {
              setSynced(state)
              if (state) p?.sendStateless('persistence-status')
            }
          },
          onAuthenticationFailed: () => {
            if (alive)
              setError(
                'Your session or storyboard access is no longer valid. Sign in again or contact the production owner.',
              )
          },
          onAwarenessUpdate: ({ states }) => {
            if (alive) setPeers(states as Peer[])
          },
          onStateless: ({ payload }) => {
            if (!alive) return
            try {
              const message = JSON.parse(payload)
              if (message.type === 'persisted') {
                persisted = message.digest
                setError('')
                void digest()
              }
              if (message.type === 'persistence-error') {
                setSaved(false)
                setError(
                  'Changes are not saved. Database connection interrupted; keep this window open and reconnect.',
                )
              }
            } catch {
              /* Ignore unknown extension messages. */
            }
          },
        })
        p.setAwarenessField('user', {
          ...data.user,
          colorLight: data.user.color + '22',
        })
        setProvider(p)
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
    const offline = () => {
      setConnected(false)
      setSaved(false)
      p?.disconnect()
    }
    const online = () => {
      void p?.connect().catch(() => {})
    }
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    const heartbeat = window.setInterval(() => {
      if (p?.isConnected) p.sendStateless('persistence-status')
    }, 5000)
    return () => {
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
      clearInterval(heartbeat)
      alive = false
      doc.off('update', update)
      p?.destroy()
      setProvider(undefined)
    }
  }, [doc, id])
  useEffect(() => {
    const prevent = (e: BeforeUnloadEvent) => {
      if (synced && (!connected || !saved)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', prevent)
    return () => window.removeEventListener('beforeunload', prevent)
  }, [synced, connected, saved])
  return {
    doc,
    undo,
    session,
    provider,
    connected,
    synced,
    saved,
    error,
    peers,
    revision,
  }
}
