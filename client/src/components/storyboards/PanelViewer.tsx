import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import CollaborativeText from '../shots/CollaborativeText'
import { panelNotes } from '../../lib/storyboards/model'
import { Link } from 'react-router-dom'
import Menu from '../whiteout/Menu'
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
import Studio from './Studio'
import { StoryboardIllustration } from './StoryboardIdentity'
import { StudioIcon } from './StudioControls'
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
    if (
      document.fullscreenElement &&
      dialog.current?.contains(document.fullscreenElement)
    )
      void document.exitFullscreen().catch(() => {})
    setClosing(true)
    closeTimer.current = setTimeout(onClose, 140)
  }
  useEffect(() => () => clearTimeout(closeTimer.current), [])
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    if (!present) return
    let timer: ReturnType<typeof setTimeout>
    const active = () => {
      setIdle(false)
      clearTimeout(timer)
      timer = setTimeout(() => setIdle(true), 2500)
    }
    window.addEventListener('pointermove', active)
    window.addEventListener('keydown', active)
    active()
    return () => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', active)
      window.removeEventListener('keydown', active)
    }
  }, [present])
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
  const [annotating, setAnnotating] = useState(
      !present && panel.activeRevision?.startsWith('native-'),
    ),
    [show, setShow] = useState(true),
    [picker, setPicker] = useState(false),
    [history, setHistory] = useState(false),
    [viewRevision, setViewRevision] = useState(''),
    [showNotes, setShowNotes] = useState(false),
    [inspector, setInspector] = useState(false),
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
    setAnnotating(!present && revision?.kind === 'native')
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
      className={`sb-viewer ${present ? 'sb-present' : ''} ${closing ? 'is-closing' : ''} ${idle ? 'is-idle' : ''}`}
      aria-label={present ? 'Present storyboard' : 'Panel viewer'}
    >
      <div className="sb-viewer-frame">
        <header>
          <StudioIcon name="previous" label="Back" onClick={requestClose} />
          <h2>{panel.label || `Panel ${index + 1}`}</h2>
          <span>
            {index + 1} / {all.length}
          </span>
          <StudioIcon
            name="previous"
            label="Previous panel"
            disabled={index === 0}
            onClick={() => onSelect(all[index - 1].id)}
          />
          <StudioIcon
            name="next"
            label="Next panel"
            disabled={index === all.length - 1}
            onClick={() => onSelect(all[index + 1].id)}
          />
          {!present && (
            <>
              <Button
                icon="edit"
                variant={annotating ? 'primary' : 'secondary'}
                aria-pressed={annotating}
                disabled={
                  !revision ||
                  (!!viewRevision && viewRevision !== panel.activeRevision)
                }
                onClick={() => setAnnotating((v) => !v)}
              >
                Studio
              </Button>
              <StudioIcon
                name="layers"
                label="Artwork history"
                active={history}
                onClick={() => {
                  setHistory((v) => !v)
                  setInspector(true)
                }}
              />
              <StudioIcon
                name="settings"
                label={inspector ? 'Hide details' : 'Details'}
                active={inspector}
                onClick={() => setInspector((v) => !v)}
              />
            </>
          )}
          {!present && revision?.kind === 'native' && (
            <Menu
              label={
                (revision.height || 562.5) === 562.5
                  ? '16:9 frame'
                  : revision.height === 750
                    ? '4:3 frame'
                    : revision.height === 1000
                      ? 'Square frame'
                      : 'Scope frame'
              }
              icon="columns"
              ariaLabel="Drawing frame"
              disabled={objects.length > 0}
              value={String(revision.height || 562.5)}
              items={[
                { value: '562.5', label: 'Widescreen · 16:9' },
                { value: '750', label: 'Classic · 4:3' },
                { value: '1000', label: 'Square · 1:1' },
                { value: '418.41', label: 'Scope · 2.39:1' },
              ]}
              onChange={(v) =>
                put(doc, 'revisions', revision.id, { height: Number(v) })
              }
            />
          )}
          <StudioIcon
            name="fullscreen"
            label="Full screen"
            disabled={!document.fullscreenEnabled}
            onClick={() => {
              const frame =
                dialog.current?.querySelector<HTMLElement>('.sb-viewer-frame')
              void (
                document.fullscreenElement
                  ? document.exitFullscreen()
                  : frame?.requestFullscreen()
              )?.catch(() => {})
            }}
          />
          {present && (
            <>
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
              <div className="sb-connect">
                <StoryboardIllustration />
                <h3 role="alert">Artwork unavailable</h3>
                <p>Check your connection or access, then retry.</p>
                <Button icon="retry" onClick={media.retry}>
                  Retry artwork
                </Button>
              </div>
            ) : media.url || revision?.kind === 'native' ? (
              <Studio
                key={revision?.id}
                url={media.url}
                nativeHeight={revision?.height || 562.5}
                objects={objects}
                visible={show || revision?.kind === 'native'}
                annotating={
                  annotating &&
                  !present &&
                  (!viewRevision || viewRevision === panel.activeRevision)
                }
                onCommit={(a, continuous = false) => {
                  if (!continuous) undo.stopCapturing()
                  if (revision)
                    put(doc, 'annotations', a.id, {
                      ...a,
                      revisionId: revision.id,
                    })
                  if (!continuous) undo.stopCapturing()
                }}
                onZoomChange={setViewerZoom}
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
              <div className="sb-connect">
                <StoryboardIllustration />
                <h3>A frame for the next idea.</h3>
                <div className="sb-empty-choices">
                  <Button
                    icon="edit"
                    variant="primary"
                    onClick={() => {
                      const id = 'native-' + crypto.randomUUID()
                      doc.transact(() => {
                        put(doc, 'revisions', id, {
                          id,
                          panelId: panel.id,
                          kind: 'native',
                          width: 1000,
                          height: 562.5,
                          uploader: user.id,
                          uploaderName: user.name,
                          createdAt: new Date().toISOString(),
                        })
                        put(doc, 'panels', panel.id, { activeRevision: id })
                      })
                      setAnnotating(true)
                    }}
                  >
                    Start drawing
                  </Button>
                  <Button icon="import" onClick={onReplace}>
                    Import image
                  </Button>
                </div>
              </div>
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
