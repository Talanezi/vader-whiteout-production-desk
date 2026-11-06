import VisualDescription from './VisualDescription'
import { initialStudioPalette } from './StudioControls'
import useDocumentScrollLock from '../../lib/useDocumentScrollLock'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import Menu from '../whiteout/Menu'
import { Button } from '../whiteout/Button'
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
import PanelInspector, { type InspectorTab } from './PanelInspector'
import CommentIndicator from './CommentIndicator'
import { activeCommentCounts } from '../../lib/storyboards/comments'
import { panelIdentity } from '../../lib/storyboards/panelIdentity'
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
  commentsRequested = false,
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
  commentsRequested?: boolean
}) {
  useDocumentScrollLock()
  const [closing, setClosing] = useState(false),
    closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    )
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
    [picker, setPicker] = useState(false),
    [viewRevision, setViewRevision] = useState(''),
    [showNotes, setShowNotes] = useState(false),
    [inspector, setInspector] = useState(commentsRequested),
    [inspectorTab, setInspectorTab] = useState<InspectorTab>(
      commentsRequested ? 'comments' : 'details',
    ),
    [snapshots, setSnapshots] = useState<Record<string, LinkedSnapshot>>(
      {},
    )
  const revisions = values<ArtworkRevision & { panelId: string }>(
      doc,
      'revisions',
    )
      .filter((r) => r.panelId === panel.id)
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) ||
          a.id.localeCompare(b.id),
      ),
    revision = revisions.find(
      (r) => r.id === (viewRevision || panel.activeRevision),
    )
  const media = useMedia(documentId, revision?.assetId),
    objects = values<Annotation & { revisionId: string }>(
      doc,
      'annotations',
    ).filter((a) => a.revisionId === revision?.id),
    index = all.findIndex((p) => p.id === panel.id),
    commentCount = activeCommentCounts(doc).get(panel.id) || 0,
    showCommentIndicator =
      commentCount > 0 &&
      !((present ? showNotes : inspector) && inspectorTab === 'comments')
  useEffect(() => {
    setViewRevision('')
    setInspectorTab(commentsRequested ? 'comments' : 'details')
    if (commentsRequested) setInspector(true)
    setAnnotating(!present && revision?.kind === 'native')
  }, [panel.id, commentsRequested])
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
    doc.transact(() => {
      if (links.length && !doc.getMap('meta').get('originatingList'))
        doc.getMap('meta').set('originatingList', links[0].listId)
      put(doc, 'panels', panel.id, { links })
    })
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
          swipe.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          }
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
          <StudioIcon
            name="previous"
            label="Back"
            onClick={requestClose}
          />
          <h2>{panelIdentity(panel, index, snapshots)}</h2>
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
          <div className={`sb-panel-tools ${present ? 'is-present' : ''}`}>
            {!present && (
              <>
                <Button
                  icon="edit"
                  variant={annotating ? 'primary' : 'secondary'}
                  aria-pressed={annotating}
                  disabled={
                    !revision ||
                    (!!viewRevision &&
                      viewRevision !== panel.activeRevision)
                  }
                  onClick={() => setAnnotating((v) => !v)}
                >
                  Studio
                </Button>
                <StudioIcon
                  name="panel"
                  label={inspector ? 'Hide details' : 'Details'}
                  active={inspector}
                  onClick={() => {
                    if (!inspector) setInspectorTab('details')
                    setInspector((v) => !v)
                  }}
                />
              </>
            )}
            {!present && (
              <Menu
                ariaLabel="Drawing frame"
                icon="columns"
                label={
                  revision?.frame?.height === 562.5
                    ? '16:9 frame'
                    : revision?.frame?.height === 750
                      ? '4:3 frame'
                      : revision?.frame?.height === 1000
                        ? 'Square frame'
                        : revision?.frame?.height === 418.41
                          ? 'Scope frame'
                          : 'Original frame'
                }
                value={String(revision?.frame?.height || 'original')}
                items={[
                  { value: 'original', label: 'Original' },
                  { value: '562.5', label: 'Widescreen · 16:9' },
                  { value: '750', label: 'Classic · 4:3' },
                  { value: '1000', label: 'Square · 1:1' },
                  { value: '418.41', label: 'Scope · 2.39:1' },
                  {
                    value: 'fit:contain',
                    label: 'Fit with padding',
                    disabled: !revision?.frame,
                  },
                  {
                    value: 'fit:crop',
                    label: 'Crop to frame',
                    disabled: !revision?.frame,
                  },
                ]}
                disabled={!revision || !!viewRevision}
                onChange={(v) =>
                  revision &&
                  put(doc, 'revisions', revision.id, {
                    frame:
                      v.startsWith('fit:') && revision.frame
                        ? { ...revision.frame, fit: v.slice(4) }
                        : v === 'original'
                          ? null
                          : {
                              height: Number(v),
                              fit: revision.frame?.fit || 'contain',
                            },
                  })
                }
              />
            )}
            <StudioIcon
              name="fullscreen"
              label="Full screen"
              disabled={!document.fullscreenEnabled}
              onClick={() => {
                const frame =
                  dialog.current?.querySelector<HTMLElement>(
                    '.sb-viewer-frame',
                  )
                void (
                  document.fullscreenElement
                    ? document.exitFullscreen()
                    : frame?.requestFullscreen()
                )?.catch(() => {})
              }}
            />
            {present && (
              <StudioIcon
                name="panel"
                label="Notes & shots"
                active={showNotes}
                onClick={() => {
                  if (!showNotes) setInspectorTab('details')
                  setShowNotes((v) => !v)
                }}
              />
            )}
          </div>
        </header>
        <div
          className={`sb-viewer-body ${showCommentIndicator ? 'has-comment-rail' : ''}`}
        >
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
                palette={initialStudioPalette().map((fallback, i) => {
                  const meta = doc.getMap('meta'),
                    base = meta.get('studioPaletteBase')
                  const color =
                    meta.get('studioPalette' + i) ||
                    (Array.isArray(base) ? base[i] : fallback)
                  return typeof color === 'string' &&
                    /^#[0-9a-f]{6}$/i.test(color)
                    ? color
                    : fallback
                })}
                onPaletteChange={(index, color) =>
                  doc.transact(() => {
                    const meta = doc.getMap('meta')
                    if (!meta.has('studioPaletteBase'))
                      meta.set('studioPaletteBase', initialStudioPalette())
                    meta.set('studioPalette' + index, color)
                  })
                }
                key={revision?.id}
                url={media.url}
                nativeHeight={revision?.height || 562.5}
                objects={objects}
                frame={revision?.frame || undefined}
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
                onBatch={(remove, add) => {
                  undo.stopCapturing()
                  doc.transact(() => {
                    remove.forEach((id) =>
                      doc.getMap('annotations').delete(id),
                    )
                    add.forEach((a) =>
                      put(doc, 'annotations', a.id, {
                        ...a,
                        revisionId: revision!.id,
                      }),
                    )
                  })
                  undo.stopCapturing()
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
                        put(doc, 'panels', panel.id, {
                          activeRevision: id,
                        })
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
          {!present && (
            <div className="sb-viewer-description">
              <VisualDescription
                doc={doc}
                id={panel.id}
                provider={provider}
                undo={undo}
              />
            </div>
          )}
          {showCommentIndicator && (
            <div className="sb-viewer-comment-rail">
              <CommentIndicator
                floating
                count={commentCount}
                label={panelIdentity(panel, index, snapshots)}
                onOpen={() => {
                  setViewRevision('')
                  setInspectorTab('comments')
                  if (present) setShowNotes(true)
                  else setInspector(true)
                }}
              />
            </div>
          )}
          {((!present && inspector) || (present && showNotes)) && (
            <PanelInspector
              documentId={documentId}
              doc={doc}
              panel={panel}
              index={index}
              user={user}
              provider={provider}
              undo={undo}
              snapshots={snapshots}
              revisions={revisions}
              viewRevision={viewRevision}
              onPreview={setViewRevision}
              onLink={() => setPicker(true)}
              onReplace={onReplace}
              present={present}
              tab={inspectorTab}
              onTabChange={setInspectorTab}
            />
          )}
        </div>
      </div>
      {picker && (
        <ShotPicker
          connectedListId={
            String(
              doc.getMap('meta').get('originatingList') ||
                panel.links[0]?.listId ||
                '',
            ) || undefined
          }
          initial={panel.links}
          onClose={() => setPicker(false)}
          onConfirm={link}
        />
      )}
    </dialog>
  )
}
