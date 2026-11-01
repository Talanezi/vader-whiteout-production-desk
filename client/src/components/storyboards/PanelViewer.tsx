import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import CollaborativeText from '../shots/CollaborativeText'
import { panelNotes } from '../../lib/storyboards/model'
import { Link } from 'react-router-dom'
import { Button } from '../whiteout/Button'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import DotsLoader from '../whiteout/DotsLoader'
import {
  put,
  values,
  type Panel,
  type ArtworkRevision,
  type Annotation,
  type ShotLink,
} from '../../lib/storyboards/model'
import { useMedia } from '../../lib/storyboards/useMedia'
import { shotRequest } from '../../lib/shotApi'
import AnnotationCanvas from './AnnotationCanvas'
import PanelDiscussion from './PanelDiscussion'
import ShotPicker, { type LinkedSnapshot } from './ShotPicker'
export default function PanelViewer({
  documentId,
  doc,
  panel,
  all,
  user,
  undo,
  provider,
  onClose,
  onSelect,
  onReplace,
  present = false,
}: {
  documentId: string
  doc: Y.Doc
  panel: Panel
  all: Panel[]
  user: { id: number; name: string }
  provider: HocuspocusProvider
  undo: Y.UndoManager
  onClose: () => void
  onSelect: (id: string) => void
  onReplace: () => void
  present?: boolean
}) {
  const [closing, setClosing] = useState(false),
    closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const requestClose = () => {
    if (closeTimer.current) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    setClosing(true)
    closeTimer.current = setTimeout(onClose, 140)
  }
  useEffect(() => () => clearTimeout(closeTimer.current), [])
  const [viewerZoom, setViewerZoom] = useState(1)
  const swipe = useRef<{ x: number; y: number } | undefined>(undefined)
  const [noteText, setNoteText] = useState<Y.Text>()
  useEffect(() => {
    setNoteText(panelNotes(doc, panel.id))
  }, [doc, panel.id])
  const dialog = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.showModal()
    return () => {
      dialog.current?.close()
      previous?.isConnected && previous.focus()
    }
  }, [])
  const [annotating, setAnnotating] = useState(false),
    [show, setShow] = useState(true),
    [picker, setPicker] = useState(false),
    [history, setHistory] = useState(false),
    [viewRevision, setViewRevision] = useState(''),
    [showNotes, setShowNotes] = useState(false),
    [inspector, setInspector] = useState(
      () => matchMedia('(min-width:1000px)').matches,
    ),
    [snapshots, setSnapshots] = useState<Record<string, LinkedSnapshot>>({})
  const revisions = values<ArtworkRevision & { panelId: string }>(
      doc,
      'revisions',
    )
      .filter((r) => r.panelId === panel.id)
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
      ),
    revision = revisions.find(
      (r) => r.id === (viewRevision || panel.activeRevision),
    )
  const media = useMedia(documentId, revision?.assetId),
    objects = values<Annotation & { revisionId: string }>(
      doc,
      'annotations',
    ).filter((a) => a.revisionId === revision?.id),
    index = all.findIndex((p) => p.id === panel.id)
  useEffect(() => {
    setViewRevision('')
    setAnnotating(false)
  }, [panel.id])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          'input,textarea,[contenteditable=true]',
        ) ||
        annotating
      )
        return
      if (e.key === 'ArrowRight' && index < all.length - 1)
        onSelect(all[index + 1].id)
      if (e.key === 'ArrowLeft' && index > 0) onSelect(all[index - 1].id)
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [all, index, annotating])
  useEffect(() => {
    let alive = true
    const load = () =>
      Promise.all(
        [...new Set(panel.links.map((l) => l.listId))].map(async (id) => {
          try {
            const data = await shotRequest<LinkedSnapshot>(`/${id}/export`)
            if (alive) setSnapshots((old) => ({ ...old, [id]: data }))
          } catch {}
        }),
      )
    void load()
    const timer = setInterval(() => void load(), 3000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [JSON.stringify(panel.links)])
  function link(links: ShotLink[]) {
    put(doc, 'panels', panel.id, { links })
    setPicker(false)
  }
  return (
    <dialog
      ref={dialog}
      onTouchStart={(e) => {
        if (e.touches.length !== 1) {
          swipe.current = undefined
          return
        }
        if (present && viewerZoom <= 1)
          swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }}
      onTouchEnd={(e) => {
        const start = swipe.current
        swipe.current = undefined
        if (!start || !present || !e.changedTouches.length) return
        const dx = e.changedTouches[0].clientX - start.x,
          dy = e.changedTouches[0].clientY - start.y
        if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) {
          const next = index + (dx < 0 ? 1 : -1)
          if (next >= 0 && next < all.length) onSelect(all[next].id)
        }
      }}
      onCancel={(e) => {
        e.preventDefault()
        requestClose()
      }}
      className={`sb-viewer ${present ? 'sb-present' : ''} ${closing ? 'is-closing' : ''}`}
      aria-label={present ? 'Present storyboard' : 'Panel viewer'}
    >
      <div className="sb-viewer-frame">
        <header>
          <Button icon="back" onClick={requestClose}>
            Back
          </Button>
          <h2>{panel.label || `Panel ${index + 1}`}</h2>
          <span>
            {index + 1} / {all.length}
          </span>
          <Button
            disabled={index === 0}
            onClick={() => onSelect(all[index - 1].id)}
          >
            Previous
          </Button>
          <Button
            disabled={index === all.length - 1}
            onClick={() => onSelect(all[index + 1].id)}
          >
            Next
          </Button>
          {!present && (
            <>
              <Button
                aria-pressed={annotating}
                disabled={
                  !revision ||
                  (!!viewRevision && viewRevision !== panel.activeRevision)
                }
                onClick={() => setAnnotating((v) => !v)}
              >
                Annotate
              </Button>
              <Button onClick={() => setHistory((v) => !v)}>
                Artwork history
              </Button>
              <Button onClick={() => setInspector((v) => !v)}>
                {inspector ? 'Hide details' : 'Details'}
              </Button>
            </>
          )}
          {present && (
            <>
              <Button
                disabled={!document.fullscreenEnabled}
                onClick={() => {
                  const frame =
                    dialog.current?.querySelector<HTMLElement>(
                      '.sb-viewer-frame',
                    )
                  void frame?.requestFullscreen().catch(() => {})
                }}
              >
                Full screen
              </Button>
              <Button onClick={() => setShowNotes((v) => !v)}>
                Notes & shots
              </Button>
            </>
          )}
          <label>
            <DrawCheckbox
              aria-label="Show annotations"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            Annotations
          </label>
        </header>
        <div className="sb-viewer-body">
          <div className="sb-viewer-art">
            {media.error ? (
              <p role="alert">{media.error}</p>
            ) : media.url ? (
              <AnnotationCanvas
                key={revision?.id}
                url={media.url}
                objects={objects}
                visible={show}
                annotating={annotating}
                onCommit={(a, continuous = false) => {
                  if (!continuous) undo.stopCapturing()
                  if (revision)
                    put(doc, 'annotations', a.id, {
                      ...a,
                      revisionId: revision.id,
                    })
                  if (!continuous) undo.stopCapturing()
                }}
                onRemove={(id) => {
                  undo.stopCapturing()
                  doc.getMap('annotations').delete(id)
                  undo.stopCapturing()
                }}
                onUndo={() => undo.undo()}
                onRedo={() => undo.redo()}
                canUndo={!!undo.undoStack.length}
                canRedo={!!undo.redoStack.length}
              />
            ) : revision ? (
              <DotsLoader />
            ) : present ? (
              <span>No artwork</span>
            ) : (
              <Button onClick={onReplace}>Add image</Button>
            )}
          </div>
          {((!present && inspector) || (present && showNotes)) && (
            <aside className="sb-panel-inspector">
              {!present && (
                <label className="pd-field">
                  Original label
                  <input
                    value={panel.label}
                    onChange={(e) =>
                      put(doc, 'panels', panel.id, { label: e.target.value })
                    }
                  />
                </label>
              )}
              <h3>Linked shots</h3>
              {panel.links.map((l) => {
                const s = snapshots[l.listId]?.shots[l.shotId]
                return (
                  <div className="sb-linked-shot" key={l.listId + l.shotId}>
                    {s && !s.deletedAt ? (
                      <>
                        <Link
                          to={`/shotlists/${l.listId}?shot=${l.shotId}&scene=${s.sceneId}`}
                        >
                          {String(s.number)} · {l.shotId.slice(0, 8)}
                        </Link>
                        <p>{String(s.coverage || '')}</p>
                        <small>
                          {[
                            'camera',
                            'framing',
                            'lens',
                            'angle',
                            'equipment',
                            'movement',
                          ]
                            .map((k) => s[k])
                            .filter(Boolean)
                            .join(' · ')}
                        </small>
                      </>
                    ) : (
                      <span>
                        Linked shot unavailable · {l.shotId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                )
              })}
              {!present && (
                <Button onClick={() => setPicker(true)}>Link shots</Button>
              )}
              <h3>Visual notes</h3>
              {present ? (
                <p>{panel.notes}</p>
              ) : noteText ? (
                <div className="sb-visual-notes">
                  <CollaborativeText
                    key={panel.id}
                    text={noteText}
                    provider={provider}
                    undo={undo}
                    label="Visual notes"
                  />
                </div>
              ) : null}
              {!present && (
                <>
                  <Button onClick={onReplace}>Replace artwork</Button>
                  {history && (
                    <section>
                      <h3>Artwork history</h3>
                      {revisions.map((r, i) => (
                        <div key={r.id}>
                          <Button onClick={() => setViewRevision(r.id)}>
                            {r.uploaderName || `User ${r.uploader}`} · Revision{' '}
                            {revisions.length - i} ·{' '}
                            {new Date(r.createdAt).toLocaleDateString()}
                          </Button>
                          {r.id !== panel.activeRevision && (
                            <>
                              <Button
                                onClick={() => {
                                  put(doc, 'panels', panel.id, {
                                    activeRevision: r.id,
                                  })
                                  setViewRevision('')
                                }}
                              >
                                Restore
                              </Button>
                              <Button
                                disabled={!panel.activeRevision}
                                onClick={() => {
                                  doc.transact(() =>
                                    values<Annotation & { revisionId: string }>(
                                      doc,
                                      'annotations',
                                    )
                                      .filter((a) => a.revisionId === r.id)
                                      .forEach((a) => {
                                        const id = crypto.randomUUID()
                                        put(doc, 'annotations', id, {
                                          ...a,
                                          id,
                                          revisionId: panel.activeRevision,
                                        })
                                      }),
                                  )
                                }}
                              >
                                Copy annotations to active artwork
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                    </section>
                  )}
                  <PanelDiscussion doc={doc} panelId={panel.id} user={user} />
                </>
              )}
            </aside>
          )}
        </div>
      </div>
      {picker && (
        <ShotPicker
          initial={panel.links}
          onClose={() => setPicker(false)}
          onConfirm={link}
        />
      )}
    </dialog>
  )
}
