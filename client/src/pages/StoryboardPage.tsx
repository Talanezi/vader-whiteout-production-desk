import VisualDescription from '../components/storyboards/VisualDescription'
import CommentIndicator from '../components/storyboards/CommentIndicator'
import { activeCommentCounts } from '../lib/storyboards/comments'
import InlineDelete from '../components/whiteout/InlineDelete'
import { waitForStoryboardSaved } from '../lib/storyboards/waitForSaved'
import { panelIdentity } from '../lib/storyboards/panelIdentity'
import ViewSwitcher from '../components/storyboards/ViewSwitcher'
import { downloadOriginal } from '../components/storyboards/OriginalViewer'
import ShotPane from '../components/storyboards/ShotPane'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { shotSensors } from '../components/shots/ShotDrag'
import SortablePanel from '../components/storyboards/SortablePanel'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../components/whiteout/Button'
import { PageHeader, SearchField } from '../components/whiteout/Workspace'
import Menu from '../components/whiteout/Menu'
import Icon from '../components/whiteout/Icon'
import DrawCheckbox from '../components/whiteout/DrawCheckbox'
import NameTooltip from '../components/whiteout/NameTooltip'
import { Overlay } from '../components/whiteout/Overlay'
import {
  EmptyState,
  ErrorNotice,
  LoadingRows,
  SessionState,
  useToast,
} from '../components/whiteout/Feedback'
import { useStoryboardCollaboration } from '../lib/storyboards/useStoryboardCollaboration'
import {
  panels,
  values,
  put,
  type Panel,
  type Annotation,
  type ArtworkRevision,
} from '../lib/storyboards/model'
import { boardRequest, type MediaAsset } from '../lib/storyboards/api'
import { StoryboardIllustration } from '../components/storyboards/StoryboardIdentity'
import Artwork from '../components/storyboards/Artwork'
import ArtworkImport from '../components/storyboards/ArtworkImport'
import OriginalViewer from '../components/storyboards/OriginalViewer'
import PanelViewer from '../components/storyboards/PanelViewer'
import StoryboardPdf from '../components/storyboards/StoryboardPdf'
import { shotRequest } from '../lib/shotApi'
import type { LinkedSnapshot } from '../components/storyboards/ShotPicker'
import ShotPicker from '../components/storyboards/ShotPicker'
import '../components/storyboards/storyboards.css'

export default function StoryboardPage() {
  const { id = '' } = useParams(),
    [query, setQuery] = useSearchParams(),
    c = useStoryboardCollaboration(id),
    notify = useToast()
  const [commentPanel, setCommentPanel] = useState('')
  const commentCounts = activeCommentCounts(c.doc)
  const [dropped, setDropped] = useState<File[]>()
  const [mobileSplit, setMobileSplit] = useState('art')
  const [pdfOpen, setPdfOpen] = useState(false),
    [linkedData, setLinkedData] = useState<Record<string, LinkedSnapshot>>({})
  const [search, setSearch] = useState(''),
    [mode, setMode] = useState('grid'),
    [scene, setScene] = useState(''),
    [selected, setSelected] = useState(query.get('panel') || ''),
    [multi, setMulti] = useState(new Set<string>()),
    [importing, setImporting] = useState(query.has('import')),
    [replace, setReplace] = useState<Panel>(),
    [assets, setAssets] = useState<MediaAsset[]>([]),
    [original, setOriginal] = useState<MediaAsset>(),
    [extract, setExtract] = useState<MediaAsset>(),
    [picker, setPicker] = useState<Panel>(),
    [deleting, setDeleting] = useState<Panel[]>(),
    [copied, setCopied] = useState(false),
    [sort, setSort] = useState('storyboard'),
    [shot, setShot] = useState(''),
    [ratio, setRatio] = useState(
      () => Number(localStorage.getItem('whiteout:storyboard:split')) || 40,
    )
  const splitRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (mode !== 'split') return
    const element = splitRef.current
    if (!element) return
    const measure = () => {
      const top = element.getBoundingClientRect().top + window.scrollY
      const content = element.closest('.pd-content')
      const bottom = content
        ? Math.max(24, parseFloat(getComputedStyle(content).paddingBottom) || 0)
        : 24
      const value = `${Math.max(160, window.innerHeight - top - bottom)}px`
      if (element.style.height !== value) element.style.height = value
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (element.parentElement) observer.observe(element.parentElement)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [mode, c.synced])
  const dragOrder = useRef<string[]>([]),
    [dragging, setDragging] = useState(''),
    name = String(
      c.doc.getMap('meta').get('name') || c.session?.name || 'Storyboard',
    ),
    all = panels(c.doc),
    revisions = values<ArtworkRevision & { panelId: string }>(
      c.doc,
      'revisions',
    ),
    current = all.find((p) => p.id === selected),
    origin = c.doc.getMap('meta').has('originatingList')
      ? String(c.doc.getMap('meta').get('originatingList') || '')
      : String(all.flatMap((p) => p.links)[0]?.listId || '')
  const [inlineDeleting, setInlineDeleting] = useState(''),
    [disconnecting, setDisconnecting] = useState(false),
    [duplicateState, setDuplicateState] = useState<
      'idle' | 'pending' | 'success'
    >('idle'),
    [duplicateId, setDuplicateId] = useState('')
  const duplicatePending = useRef(false),
    duplicateTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    )
  useEffect(() => () => clearTimeout(duplicateTimer.current), [])
  const assetRequest = useRef(0)
  useEffect(() => {
    assetRequest.current++
    setCommentPanel('')
    setSelected(query.get('panel') || '')
    setImporting(query.has('import'))
    setMode('grid')
    setScene('')
    setSearch('')
    setMulti(new Set())
    setAssets([])
    setOriginal(undefined)
    setExtract(undefined)
    setReplace(undefined)
    setPicker(undefined)
    setDeleting(undefined)
    setPdfOpen(false)
  }, [id])
  const requestedPanel = query.get('panel')
  useEffect(() => {
    if (requestedPanel) setSelected(requestedPanel)
  }, [id, requestedPanel])
  function refreshAssets() {
    const request = ++assetRequest.current
    void boardRequest<{ items: MediaAsset[] }>(`/${id}/assets`)
      .then((r) => {
        if (request === assetRequest.current) setAssets(r.items)
      })
      .catch((e) => {
        if (request === assetRequest.current)
          notify(e.message, { state: 'error' })
      })
  }
  useEffect(() => {
    if (c.session) refreshAssets()
  }, [c.session])
  const linkLists = [
    ...new Set(all.flatMap((p) => p.links.map((l) => l.listId))),
  ]
  useEffect(() => {
    let alive = true
    const load = () =>
      Promise.all(
        linkLists.map(async (listId) => {
          try {
            const data = await shotRequest<LinkedSnapshot>(`/${listId}/export`)
            if (alive) setLinkedData((old) => ({ ...old, [listId]: data }))
          } catch {}
        }),
      )
    void load()
    const timer = setInterval(() => void load(), 3000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [JSON.stringify(linkLists)])
  const filtered = all
    .filter(
      (p) =>
        (!search ||
          [
            panelIdentity(p, all.indexOf(p), linkedData),
            p.label,
            p.title,
            p.notes,
          ]
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase())) &&
        (!scene ||
          p.links.some((l) => {
            const s = linkedData[l.listId]?.shots[l.shotId]
            return `${l.listId}:${s?.sceneId}` === scene
          })),
    )
    .filter(
      (p) =>
        mode !== 'split' || !shot || p.links.some((l) => l.shotId === shot),
    )
  const rank = (p: Panel) =>
    p.links
      .map((l) => {
        const s = linkedData[l.listId]?.shots[l.shotId],
          sc = linkedData[l.listId]?.scenes[String(s?.sceneId)]
        return [
          l.listId,
          Number(sc?.order || 0),
          Number(s?.order || 0),
          l.shotId,
        ] as const
      })
      .sort(
        (a, b) =>
          a[0].localeCompare(b[0]) ||
          a[1] - b[1] ||
          a[2] - b[2] ||
          a[3].localeCompare(b[3]),
      )[0]
  if (sort === 'shot')
    filtered.sort((a, b) => {
      const x = rank(a),
        y = rank(b)
      return x && y
        ? x[0].localeCompare(y[0]) ||
            x[1] - y[1] ||
            x[2] - y[2] ||
            a.order - b.order
        : x
          ? -1
          : y
            ? 1
            : a.order - b.order
    })
  function addPanel(
    afterId = selected || (multi.size === 1 ? [...multi][0] : ''),
  ) {
    const panelId = crypto.randomUUID()
    const revisionId = 'native-' + crypto.randomUUID()
    const position = all.findIndex((p) => p.id === afterId)
    const previous = position >= 0 ? all[position] : all[all.length - 1]
    const next = position >= 0 ? all[position + 1] : undefined
    put(c.doc, 'revisions', revisionId, {
      id: revisionId,
      panelId,
      kind: 'native',
      width: 1000,
      height: 562.5,
      uploader: c.session?.user.id,
      uploaderName: c.session?.user.name,
      createdAt: new Date().toISOString(),
    })
    put(c.doc, 'panels', panelId, {
      id: panelId,
      label: '',
      notes: '',
      activeRevision: revisionId,
      order: next
        ? ((previous?.order || 0) + next.order) / 2
        : (previous?.order || 0) + 1024,
      links:
        mode === 'split' && shot && origin
          ? [{ listId: origin, shotId: shot }]
          : [],
    })
    setSelected(panelId)
  }
  const drawingStarted = useRef('')
  useEffect(() => {
    if (query.get('draw') && c.synced && drawingStarted.current !== id) {
      drawingStarted.current = id
      if (all.length) setSelected(all[0].id)
      else addPanel()
    }
  }, [c.synced, query, all.length])
  function reorder(from: string, to: string) {
    if (from === to) return
    const order = all.map((p) => p.id),
      i = order.indexOf(from),
      j = order.indexOf(to)
    if (i < 0 || j < 0) return
    order.splice(i, 1)
    order.splice(j, 0, from)
    const index = order.indexOf(from),
      before = all.find((p) => p.id === order[index - 1])?.order,
      after = all.find((p) => p.id === order[index + 1])?.order
    const rank =
      before === undefined
        ? (after ?? 1024) - 1024
        : after === undefined
          ? before + 1024
          : (before + after) / 2
    if (Number.isFinite(rank) && rank !== before && rank !== after)
      put(c.doc, 'panels', from, { order: rank })
    else
      c.doc.transact(() =>
        order.forEach((id, i) =>
          put(c.doc, 'panels', id, { order: (i + 1) * 1024 }),
        ),
      )
  }
  function duplicate(p: Panel) {
    const panelId = crypto.randomUUID()
    c.doc.transact(() => {
      const revisionMap = new Map<string, string>()
      revisions
        .filter((r) => r.panelId === p.id)
        .forEach((r) => {
          const next = crypto.randomUUID()
          revisionMap.set(r.id, next)
          put(c.doc, 'revisions', next, { ...r, id: next, panelId })
        })
      put(c.doc, 'panels', panelId, {
        ...p,
        id: panelId,
        order: (() => {
          const next = all[all.findIndex((item) => item.id === p.id) + 1]?.order
          return next === undefined ? p.order + 1024 : (p.order + next) / 2
        })(),
        ...(p.activeRevision
          ? { activeRevision: revisionMap.get(p.activeRevision) }
          : {}),
      })
      for (const a of values<Record<string, unknown>>(c.doc, 'annotations'))
        if (revisionMap.has(String(a.revisionId))) {
          const next = crypto.randomUUID()
          put(c.doc, 'annotations', next, {
            ...a,
            id: next,
            revisionId: revisionMap.get(String(a.revisionId)),
          })
        }
    })
  }
  const panelDeletionPending = useRef(new Set<string>())
  async function remove(chosen: Panel[] = deleting || []) {
    if (!c.connected)
      throw Error('Reconnect before deleting. Panels are retained.')
    const active = new Set(panels(c.doc).map((p) => p.id)),
      records = chosen.filter(
        (p) => active.has(p.id) && !panelDeletionPending.current.has(p.id),
      ),
      stamp = new Date().toISOString()
    if (!records.length) return
    records.forEach((p) => panelDeletionPending.current.add(p.id))
    c.undo.stopCapturing()
    c.doc.transact(() =>
      records.forEach((p) => put(c.doc, 'panels', p.id, { deletedAt: stamp })),
    )
    c.undo.stopCapturing()
    try {
      await waitForStoryboardSaved(c.doc, c.provider)
      setDeleting(undefined)
      setInlineDeleting('')
      setMulti(new Set())
      setSelected('')
      notify(
        `${records.length} panel${records.length === 1 ? '' : 's'} deleted.`,
        {
          action: {
            label: 'Restore',
            run: () => {
              c.undo.stopCapturing()
              c.doc.transact(() =>
                records.forEach((p) => {
                  if (
                    c.doc
                      .getMap<import('yjs').Map<unknown>>('panels')
                      .get(p.id)
                      ?.get('deletedAt') === stamp
                  )
                    put(c.doc, 'panels', p.id, { deletedAt: null })
                }),
              )
              c.undo.stopCapturing()
              void waitForStoryboardSaved(c.doc, c.provider).catch((e) =>
                notify((e as Error).message, { state: 'error' }),
              )
            },
          },
        },
      )
    } catch (e) {
      c.doc.transact(() =>
        records.forEach((p) => {
          if (
            c.doc
              .getMap<import('yjs').Map<unknown>>('panels')
              .get(p.id)
              ?.get('deletedAt') === stamp
          )
            put(c.doc, 'panels', p.id, { deletedAt: null })
        }),
      )
      notify('Deletion was not confirmed. Panels retained.', { state: 'error' })
      throw e
    } finally {
      records.forEach((p) => panelDeletionPending.current.delete(p.id))
    }
  }
  async function duplicatePanels(records: Panel[]) {
    if (duplicatePending.current) return
    duplicatePending.current = true
    setDuplicateState('pending')
    try {
      c.undo.stopCapturing()
      c.doc.transact(() => records.forEach(duplicate))
      c.undo.stopCapturing()
      await waitForStoryboardSaved(c.doc, c.provider)
      setDuplicateState('success')
      setDuplicateId(records.length === 1 ? records[0].id : '')
      clearTimeout(duplicateTimer.current)
      duplicateTimer.current = setTimeout(() => {
        setDuplicateState('idle')
        setDuplicateId('')
      }, 1800)
    } catch (e) {
      setDuplicateState('idle')
      notify((e as Error).message, { state: 'error' })
    } finally {
      duplicatePending.current = false
    }
  }
  function disconnect() {
    const listId = origin,
      links = all.map((p) => ({
        id: p.id,
        links: p.links.filter((l) => l.listId === listId),
      }))
    c.doc.transact(() => {
      c.doc.getMap('meta').set('originatingList', null)
      all.forEach((p) =>
        put(c.doc, 'panels', p.id, {
          links: p.links.filter((l) => l.listId !== listId),
        }),
      )
    })
    setShot('')
    setSelected('')
    setDisconnecting(false)
    notify('Shot List disconnected.', {
      action: {
        label: 'Restore',
        run: () => {
          if (c.doc.getMap('meta').get('originatingList')) {
            notify(
              'Disconnect the new Shot List before restoring this connection.',
              { state: 'error' },
            )
            return
          }
          c.doc.transact(() => {
            c.doc.getMap('meta').set('originatingList', listId)
            links.forEach((p) => {
              const current = panels(c.doc).find((v) => v.id === p.id)
              if (current)
                put(c.doc, 'panels', p.id, {
                  links: [
                    ...current.links.filter((l) => l.listId !== listId),
                    ...p.links,
                  ],
                })
            })
          })
        },
      },
    })
  }
  if (c.error === 'UNAUTHORIZED') return <SessionState />
  if (!c.synced)
    return (
      <div className="pd-page">
        {c.error ? (
          <ErrorNotice>{c.error}</ErrorNotice>
        ) : (
          <LoadingRows label="Loading storyboard…" />
        )}
      </div>
    )
  const gallery = (
    <DragDropProvider
      sensors={shotSensors}
      onDragStart={(e) => {
        dragOrder.current = filtered.map((p) => p.id)
        setDragging(String(e.operation.source?.id || ''))
      }}
      onDragEnd={(e) => {
        setDragging('')
        const source = e.operation.source
        if (e.canceled || !isSortable(source) || !e.operation.target) return
        const target = dragOrder.current[source.index]
        if (target) reorder(String(source.id), target)
      }}
    >
      <div className="sb-gallery">
        {filtered.map((p, i) => (
          <SortablePanel
            id={p.id}
            index={i}
            scope={`storyboard:${id}`}
            disabled={
              sort !== 'storyboard' || !!search || !!scene || mode === 'split'
            }
            selected={multi.has(p.id) || p.id === selected}
            key={p.id}
          >
            {(handle) => (
              <>
                <div className="sb-card-controls">
                  <button
                    ref={handle}
                    className="sb-drag"
                    aria-label={`Move ${p.label || `panel ${i + 1}`}`}
                    disabled={
                      sort !== 'storyboard' ||
                      !!search ||
                      !!scene ||
                      mode === 'split'
                    }
                  >
                    ⠿
                  </button>
                  <DrawCheckbox
                    aria-label={`Select ${p.label || `panel ${i + 1}`}`}
                    checked={multi.has(p.id)}
                    onChange={(e) =>
                      setMulti((old) => {
                        const next = new Set(old)
                        e.target.checked ? next.add(p.id) : next.delete(p.id)
                        return next
                      })
                    }
                  />
                  {inlineDeleting === p.id ? (
                    <InlineDelete
                      key={p.id}
                      initialConfirm
                      label={panelIdentity(p, i, linkedData)}
                      onCancel={() => setInlineDeleting('')}
                      onConfirm={async () => {
                        await remove([p])
                      }}
                    />
                  ) : (
                    <Menu
                      compact
                      label={`Actions for ${p.label || `panel ${i + 1}`}`}
                      items={[
                        {
                          value: 'draw-after',
                          label: 'Draw panel after',
                          icon: 'edit',
                          onSelect: () => addPanel(p.id),
                        },
                        {
                          value: 'replace',
                          label: 'Replace artwork',
                          icon: 'import',
                          onSelect: () => setReplace(p),
                        },
                        {
                          value: 'duplicate',
                          label: 'Duplicate',
                          icon: 'copy',
                          onSelect: () => void duplicatePanels([p]),
                        },
                        {
                          value: 'link',
                          label: 'Link / unlink shots',
                          icon: 'share',
                          onSelect: () => setPicker(p),
                        },
                        {
                          value: 'delete',
                          label: 'Delete',
                          danger: true,
                          icon: 'trash',
                          onSelect: () => setInlineDeleting(p.id),
                        },
                      ]}
                    />
                  )}
                  {duplicateId === p.id && (
                    <span className="sb-card-duplicated">
                      <Icon name="check" />
                      Duplicated
                    </span>
                  )}
                </div>
                <button
                  className="sb-card-art"
                  onClick={() => {
                    setCommentPanel('')
                    setSelected(p.id)
                    if (mode === 'split') setShot(p.links[0]?.shotId || '')
                  }}
                >
                  <Artwork
                    documentId={id}
                    assetId={
                      revisions.find((r) => r.id === p.activeRevision)?.assetId
                    }
                    frame={
                      revisions.find((r) => r.id === p.activeRevision)?.frame
                    }
                    drawingHeight={
                      revisions.find((r) => r.id === p.activeRevision)
                        ?.height || 562.5
                    }
                    drawing={
                      !!p.activeRevision
                        ? values<Annotation & { revisionId: string }>(
                            c.doc,
                            'annotations',
                          ).filter((a) => a.revisionId === p.activeRevision)
                        : undefined
                    }
                    label={p.label || `Panel ${i + 1}`}
                  />
                </button>
                <footer>
                  <strong>
                    {panelIdentity(p, all.indexOf(p), linkedData)}
                  </strong>
                  {(() => {
                    const r = revisions.find((r) => r.id === p.activeRevision)
                    return r?.source &&
                      r.source.crop.width >= 0.999 &&
                      r.source.crop.height >= 0.999 ? (
                      <small>Original sheet</small>
                    ) : null
                  })()}
                  {p.links.length > 0 && (
                    <small
                      title={p.links
                        .map(
                          (l) =>
                            `${linkedData[l.listId]?.shots[l.shotId]?.number || 'Unavailable shot'} · ${l.shotId.slice(0, 8)}`,
                        )
                        .join(' / ')}
                    >
                      {p.links
                        .slice(0, 2)
                        .map((l) =>
                          String(
                            linkedData[l.listId]?.shots[l.shotId]?.number ||
                              'Unavailable shot',
                          ),
                        )
                        .join(' · ')}
                      {p.links.length > 2 ? ` +${p.links.length - 2}` : ''}
                    </small>
                  )}
                  <CommentIndicator
                    count={commentCounts.get(p.id) || 0}
                    label={panelIdentity(p, all.indexOf(p), linkedData)}
                    onOpen={() => {
                      setCommentPanel(p.id)
                      setSelected(p.id)
                      if (mode === 'split') setMode('grid')
                    }}
                  />
                  <VisualDescription doc={c.doc} id={p.id} provider={c.provider!} undo={c.undo}/>
                  {p.notes && <p className="sb-description-preview">{p.notes}</p>}
                </footer>
              </>
            )}
          </SortablePanel>
        ))}
      </div>
      <DragOverlay
        dropAnimation={
          matchMedia('(prefers-reduced-motion: reduce)').matches
            ? null
            : { duration: 120 }
        }
      >
        {dragging && (
          <div className="sb-art-drag">
            <Artwork
              documentId={id}
              assetId={
                revisions.find(
                  (r) =>
                    r.id === all.find((p) => p.id === dragging)?.activeRevision,
                )?.assetId
              }
              label="Dragged storyboard panel"
              drawing={
                revisions.find(
                  (r) =>
                    r.id === all.find((p) => p.id === dragging)?.activeRevision,
                )?.kind === 'native'
                  ? values<Annotation & { revisionId: string }>(
                      c.doc,
                      'annotations',
                    ).filter(
                      (a) =>
                        a.revisionId ===
                        all.find((p) => p.id === dragging)?.activeRevision,
                    )
                  : undefined
              }
            />
          </div>
        )}
      </DragOverlay>
    </DragDropProvider>
  )
  return (
    <div
      className="pd-page sb-workspace"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) e.preventDefault()
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length) {
          e.preventDefault()
          setDropped([...e.dataTransfer.files])
          setImporting(true)
        }
      }}
    >
      <Link className="pd-text-link" to="/storyboards">
        ← Storyboards
      </Link>
      <PageHeader title={name}>
        <span
          role="status"
          className={`pd-sync-state ${c.connected && c.saved ? 'is-saved' : ''}`}
          data-sync={
            c.error
              ? 'error'
              : !c.connected
                ? 'disconnected'
                : c.saved
                  ? 'saved'
                  : 'syncing'
          }
        >
          <i />
          {c.error
            ? 'Save interrupted'
            : !c.connected
              ? 'Reconnecting'
              : c.saved
                ? 'Saved'
                : 'Syncing'}
        </span>
        <div className="pd-collaborators">
          {c.peers
            .filter(
              (p, i, all) =>
                p.user &&
                all.findIndex((other) => other.user?.id === p.user?.id) === i,
            )
            .map((p) => (
              <NameTooltip
                key={p.clientId}
                name={p.user!.name}
                color={p.user!.color}
              >
                {p
                  .user!.name.split(' ')
                  .map((x) => x[0])
                  .slice(0, 2)
                  .join('')}
              </NameTooltip>
            ))}
        </div>
        <button
          className={`pd-button pd-share ${copied ? 'is-copied' : ''}`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(location.href)
              setCopied(true)
              setTimeout(() => setCopied(false), 2200)
            } catch {
              notify('Could not copy the link.', { state: 'error' })
            }
          }}
        >
          <Icon name={copied ? 'check' : 'share'} />
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <Button icon="download" onClick={() => setPdfOpen(true)}>
          Download
        </Button>
      </PageHeader>
      {c.error && <ErrorNotice>{c.error}</ErrorNotice>}
      <div className="sb-toolbar-container">
        <div className="sb-workspace-toolbar">
          <div className="sb-toolbar-find">
            <SearchField
              label="Search panels"
              placeholder="Search panels..."
              value={search}
              onChange={setSearch}
            />
            <Menu
              icon="shots"
              label={
                scene
                  ? `Scene ${
                      Object.entries(linkedData)
                        .flatMap(([listId, data]) =>
                          Object.entries(data.scenes).map(([sceneId, s]) => ({
                            id: `${listId}:${sceneId}`,
                            number: s.number,
                          })),
                        )
                        .find((s) => s.id === scene)?.number || 'selected'
                    }`
                  : 'All scenes'
              }
              value={scene}
              onChange={setScene}
              items={[
                { value: '', label: 'All scenes' },
                ...Object.entries(linkedData).flatMap(([listId, data]) =>
                  Object.entries(data.scenes)
                    .filter(([, s]) => !s.deletedAt)
                    .map(([sceneId, s]) => ({
                      value: `${listId}:${sceneId}`,
                      label: `Scene ${s.number}`,
                    })),
                ),
              ]}
            />
          </div>
          <ViewSwitcher
            value={mode}
            onChange={(m) => {
              setMode(m)
              if (m === 'present' && !selected)
                setSelected(filtered[0]?.id || '')
            }}
          />
          <div className="sb-toolbar-actions">
            {origin && (
              <Menu
                compact
                icon="share"
                label="Connected Shot List"
                items={[
                  {
                    value: 'open',
                    label: 'Open Shot List',
                    icon: 'shots',
                    onSelect: () => {
                      window.location.hash = `/shotlists/${origin}`
                    },
                  },
                  {
                    value: 'disconnect',
                    label: 'Disconnect Shot List',
                    icon: 'close',
                    onSelect: () => setDisconnecting(true),
                  },
                ]}
              />
            )}

            <Menu
              compact
              icon="sort"
              label="Display order"
              value={sort}
              onChange={setSort}
              items={[
                {
                  value: 'storyboard',
                  label: 'Storyboard order',
                  icon: 'grid',
                },
                { value: 'shot', label: 'Shot List order', icon: 'shots' },
              ]}
            />
            <Button icon="plus" variant="primary" onClick={() => addPanel()}>
              Add panel
            </Button>
            <Button icon="import" onClick={() => setImporting(true)}>
              Import artwork
            </Button>
            {assets.some(
              (a) => !revisions.some((r) => r.assetId === a.id && r.source),
            ) && (
              <Menu
                icon="file"
                label="Sources"
                items={[
                  ...assets
                    .filter(
                      (a) =>
                        !revisions.some((r) => r.assetId === a.id && r.source),
                    )
                    .flatMap((a) => [
                      ...(a.mime === 'application/pdf'
                        ? [
                            {
                              value: `organize:${a.id}`,
                              label: `Organize panels · ${a.filename}`,
                              icon: 'grid' as const,
                              onSelect: () => setExtract(a),
                            },
                          ]
                        : []),
                      {
                        value: `view:${a.id}`,
                        label: `View original · ${a.filename}`,
                        icon: 'file' as const,
                        onSelect: () => setOriginal(a),
                      },
                      {
                        value: `download:${a.id}`,
                        label: `Download original · ${a.filename}`,
                        icon: 'download' as const,
                        onSelect: () => {
                          void downloadOriginal(id, a).catch((e) =>
                            notify(e.message, { state: 'error' }),
                          )
                        },
                      },
                    ]),
                ]}
              />
            )}
          </div>
        </div>
      </div>
      {multi.size > 0 && (
        <div className="pd-shot-selection sb-selected-actions">
          <span>{multi.size} selected</span>
          <Button variant="quiet" onClick={() => setMulti(new Set())}>
            Clear selection
          </Button>
          <div>
            <Button
              aria-label="Duplicate selected"
              icon="copy"
              state={duplicateState}
              pendingLabel="Duplicating…"
              successLabel="Duplicated"
              className={`pd-selection-feedback ${duplicateState === 'success' ? 'is-duplicated' : ''}`}
              onClick={() =>
                void duplicatePanels(all.filter((p) => multi.has(p.id)))
              }
            >
              Duplicate selected
            </Button>
            <InlineDelete
              triggerLabel="Delete selected"
              label={`${deleting?.length || multi.size} selected panels`}
              onStart={() => setDeleting(all.filter((p) => multi.has(p.id)))}
              onCancel={() => setDeleting(undefined)}
              onConfirm={async () => {
                remove()
                await waitForStoryboardSaved(c.doc, c.provider)
              }}
            />
          </div>
        </div>
      )}
      {!all.length ? (
        <div className="sb-connect">
          <StoryboardIllustration />
          <h3>
            {assets.some((a) => a.mime === 'application/pdf')
              ? 'Original sheets ready'
              : 'A sequence starts with an image.'}
          </h3>
          <div className="sb-empty-choices">
            {assets.some((a) => a.mime === 'application/pdf') ? (
              <Button
                icon="grid"
                variant="primary"
                onClick={() =>
                  setExtract(assets.find((a) => a.mime === 'application/pdf'))
                }
              >
                Organize panels
              </Button>
            ) : (
              <Button icon="edit" variant="primary" onClick={() => addPanel()}>
                Start drawing
              </Button>
            )}
            <Button icon="import" onClick={() => setImporting(true)}>
              Import artwork
            </Button>
          </div>
        </div>
      ) : mode === 'split' ? (
        <>
          <div className="sb-split-tabs">
            <Button
              aria-pressed={mobileSplit === 'shots'}
              onClick={() => setMobileSplit('shots')}
            >
              Shot List
            </Button>
            <Button
              aria-pressed={mobileSplit === 'art'}
              onClick={() => setMobileSplit('art')}
            >
              Storyboard
            </Button>
          </div>
          <div
            ref={splitRef}
            className="sb-split"
            data-mobile-pane={mobileSplit}
            style={{ gridTemplateColumns: `${ratio}% 8px minmax(0,1fr)` }}
          >
            <div className="sb-split-shots">
              {origin ? (
                <ShotPane
                  listId={origin}
                  selected={
                    current?.links
                      .filter((l) => l.listId === origin)
                      .map((l) => l.shotId) || [shot]
                  }
                  onSelect={(id) => {
                    setShot(id)
                    setSelected('')
                  }}
                />
              ) : (
                <div className="sb-connect">
                  <StoryboardIllustration />
                  <h3>Connect a Shot List</h3>
                  <p>Bring the technical plan beside the artwork.</p>
                  <Button
                    icon="share"
                    onClick={() => {
                      const panel = current || all[0]
                      if (panel) setPicker(panel)
                      else addPanel()
                    }}
                  >
                    Connect shots
                  </Button>
                </div>
              )}
            </div>
            <div
              className="sb-split-divider"
              role="separator"
              tabIndex={0}
              aria-label="Resize Split view"
              aria-valuenow={ratio}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  const next = Math.max(
                    25,
                    Math.min(70, ratio + (e.key === 'ArrowRight' ? 2 : -2)),
                  )
                  setRatio(next)
                  localStorage.setItem(
                    'whiteout:storyboard:split',
                    String(next),
                  )
                }
              }}
              onPointerDown={(e) => {
                const divider = e.currentTarget
                const start = e.clientX,
                  parent =
                    e.currentTarget.parentElement!.getBoundingClientRect()
                divider.setPointerCapture(e.pointerId)
                divider.onpointermove = (ev) =>
                  setRatio(
                    Math.max(
                      25,
                      Math.min(
                        70,
                        ratio + ((ev.clientX - start) / parent.width) * 100,
                      ),
                    ),
                  )
                divider.onpointerup = () => {
                  divider.onpointermove = null
                  setRatio((r) => {
                    localStorage.setItem('whiteout:storyboard:split', String(r))
                    return r
                  })
                }
              }}
            />
            <div className="sb-split-art">
              {current && !current.links.length && (
                <Button icon="share" onClick={() => setPicker(current)}>
                  Link shots
                </Button>
              )}
              {filtered.length ? (
                gallery
              ) : (
                <div className="sb-connect">
                  <StoryboardIllustration />
                  <h3>No linked panels</h3>
                  <Button icon="edit" onClick={() => addPanel()}>
                    Start drawing
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : filtered.length ? (
        gallery
      ) : (
        <EmptyState kind="search" title="No matching panels" />
      )}
      {current && mode !== 'split' && (
        <PanelViewer
          documentId={id}
          doc={c.doc}
          panel={current}
          all={filtered}
          user={c.session!.user}
          undo={c.undo}
          provider={c.provider!}
          onClose={() => {
            setCommentPanel('')
            setSelected('')
            if (query.has('draw') || query.has('panel')) {
              const next = new URLSearchParams(query)
              next.delete('draw')
              next.delete('panel')
              setQuery(next, { replace: true })
            }
            if (mode === 'present') setMode('grid')
          }}
          onSelect={(panelId) => {
            setCommentPanel('')
            setSelected(panelId)
          }}
          onReplace={() => setReplace(current)}
          present={mode === 'present'}
          commentsRequested={commentPanel === current.id}
        />
      )}
      {(importing || replace || extract) && (
        <ArtworkImport
          documentId={id}
          doc={c.doc}
          userId={c.session!.user.id}
          userName={c.session!.user.name}
          replacePanel={replace}
          existingSource={extract}
          initialFiles={dropped}
          onWaitForSaved={() => waitForStoryboardSaved(c.doc, c.provider)}
          onImported={refreshAssets}
          onClose={() => {
            setDropped(undefined)
            setImporting(false)
            setReplace(undefined)
            setExtract(undefined)
            if (query.has('import')) {
              query.delete('import')
              setQuery(query, { replace: true })
            }
            refreshAssets()
          }}
        />
      )}
      {original && (
        <OriginalViewer
          documentId={id}
          asset={original}
          related={all.flatMap((p) => {
            const r = revisions.find((r) => r.id === p.activeRevision)
            return r?.source?.assetId === original.id ||
              r?.assetId === original.id
              ? [{ id: p.id, label: p.label, source: r?.source }]
              : []
          })}
          onPanel={(panelId) => {
            setOriginal(undefined)
            setSelected(panelId)
          }}
          onClose={() => setOriginal(undefined)}
          onExtract={() => {
            setExtract(original)
            setOriginal(undefined)
          }}
        />
      )}
      {picker && (
        <ShotPicker
          connectedListId={origin || undefined}
          initial={picker.links}
          onClose={() => setPicker(undefined)}
          onConfirm={(links) => {
            c.doc.transact(() => {
              if (links.length && !origin)
                c.doc.getMap('meta').set('originatingList', links[0].listId)
              put(c.doc, 'panels', picker.id, { links })
            })
            setPicker(undefined)
          }}
        />
      )}
      {pdfOpen && (
        <StoryboardPdf
          saved={c.saved}
          connected={c.connected}
          documentId={id}
          selected={[...multi]}
          scenes={Object.entries(linkedData).flatMap(([listId, data]) =>
            Object.entries(data.scenes)
              .filter(([, s]) => !s.deletedAt)
              .map(([sceneId, s]) => ({
                id: `${listId}:${sceneId}`,
                label: `Scene ${s.number}`,
                panels: all
                  .filter((p) =>
                    p.links.some(
                      (l) =>
                        l.listId === listId &&
                        data.shots[l.shotId]?.sceneId === sceneId,
                    ),
                  )
                  .map((p) => p.id),
              })),
          )}
          onClose={() => setPdfOpen(false)}
        />
      )}
      {disconnecting && (
        <Overlay
          title="Disconnect Shot List?"
          onClose={() => setDisconnecting(false)}
          footer={
            <>
              <Button onClick={() => setDisconnecting(false)}>Cancel</Button>
              <Button icon="close" onClick={disconnect}>
                Disconnect
              </Button>
            </>
          }
        >
          <p>
            This removes{' '}
            {all.reduce(
              (n, p) => n + p.links.filter((l) => l.listId === origin).length,
              0,
            )}{' '}
            panel links. Artwork, comments and the Shot List remain.
          </p>
        </Overlay>
      )}
    </div>
  )
}
