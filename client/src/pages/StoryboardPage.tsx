import ViewSwitcher from '../components/storyboards/ViewSwitcher'
import { downloadOriginal } from '../components/storyboards/OriginalViewer'
import ShotPane from '../components/storyboards/ShotPane'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { shotSensors } from '../components/shots/ShotDrag'
import SortablePanel from '../components/storyboards/SortablePanel'
import { useEffect, useRef, useState } from 'react'
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
  type ArtworkRevision,
} from '../lib/storyboards/model'
import { boardRequest, type MediaAsset } from '../lib/storyboards/api'
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
    origin = String(
      c.doc.getMap('meta').get('originatingList') ||
        all.flatMap((p) => p.links)[0]?.listId ||
        '',
    )
  function refreshAssets() {
    void boardRequest<{ items: MediaAsset[] }>(`/${id}/assets`)
      .then((r) => setAssets(r.items))
      .catch((e) => notify(e.message, { state: 'error' }))
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
          [p.label, p.notes]
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
  function addPanel() {
    const panelId = crypto.randomUUID()
    put(c.doc, 'panels', panelId, {
      id: panelId,
      label: '',
      notes: '',
      order: (all[all.length - 1]?.order || 0) + 1024,
      links:
        mode === 'split' && shot && origin
          ? [{ listId: origin, shotId: shot }]
          : [],
    })
  }
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
  function remove() {
    const active=new Set(panels(c.doc).map(p=>p.id)),records=(deleting||[]).filter(p=>active.has(p.id)),stamp=new Date().toISOString()
    c.doc.transact(() =>
      records.forEach((p) =>
        put(c.doc, 'panels', p.id, { deletedAt: stamp }),
      ),
    )
    setDeleting(undefined)
    setMulti(new Set())
    setSelected('')
    if(!records.length)return
    notify(
      `${records.length} panel${records.length === 1 ? '' : 's'} deleted.`,
      {
        action: {
          label: 'Restore',
          run: () =>
            c.doc.transact(() =>
              records.forEach(p=>{if(c.doc.getMap<import('yjs').Map<unknown>>('panels').get(p.id)?.get('deletedAt')===stamp)put(c.doc,'panels',p.id,{deletedAt:null})}),
            ),
        },
      },
    )
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
                  <Menu
                    compact
                    label={`Actions for ${p.label || `panel ${i + 1}`}`}
                    items={[
                      {
                        value: 'replace',
                        label: 'Replace artwork',
                        onSelect: () => setReplace(p),
                      },
                      {
                        value: 'duplicate',
                        label: 'Duplicate',
                        onSelect: () => duplicate(p),
                      },
                      {
                        value: 'link',
                        label: 'Link / unlink shots',
                        onSelect: () => setPicker(p),
                      },
                      {
                        value: 'delete',
                        label: 'Delete',
                        danger: true,
                        onSelect: () => setDeleting([p]),
                      },
                    ]}
                  />
                </div>
                <button
                  className="sb-card-art"
                  onClick={() => {
                    setSelected(p.id)
                    if (mode === 'split') setShot(p.links[0]?.shotId || '')
                  }}
                >
                  <Artwork
                    documentId={id}
                    assetId={
                      revisions.find((r) => r.id === p.activeRevision)?.assetId
                    }
                    label={p.label || `Panel ${i + 1}`}
                  />
                </button>
                <footer>
                  <strong>{p.label || `Panel ${i + 1}`}</strong>
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
                  {p.notes && <p>{p.notes}</p>}
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
        <div className="pd-drag-preview">
          Moving {all.find((p) => p.id === dragging)?.label || 'panel'}
        </div>
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
        <span role="status">
          {c.saved ? 'Saved' : c.connected ? 'Synchronizing…' : 'Reconnecting…'}
        </span>
        <div className="pd-collaborators">
          {c.peers
            .filter((p) => p.user)
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
            <Button icon="plus" variant="primary" onClick={addPanel}>
              Add panel
            </Button>
            <Button icon="import" onClick={() => setImporting(true)}>
              Import artwork
            </Button>
            {assets.some((a) => a.mime === 'application/pdf') && (
              <Menu
                icon="file"
                label="Sources"
                items={[
                  ...assets
                    .filter((a) => a.mime === 'application/pdf')
                    .flatMap((a) => [
                      {
                        value: `organize:${a.id}`,
                        label: `Organize panels · ${a.filename}`,
                        icon: 'grid' as const,
                        onSelect: () => setExtract(a),
                      },
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
        <div className="sb-bulk">
          <span>{multi.size} selected</span>
          <Button
            onClick={() =>
              all.filter((p) => multi.has(p.id)).forEach(duplicate)
            }
          >
            Duplicate
          </Button>
          <Button onClick={() => setMulti(new Set())}>Clear selection</Button>
          <Button
            variant="danger"
            onClick={() => setDeleting(all.filter((p) => multi.has(p.id)))}
          >
            Delete selected
          </Button>
        </div>
      )}
      {!all.length ? (
        <EmptyState
          title={
            assets.some((a) => a.mime === 'application/pdf')
              ? 'Original sheets ready'
              : 'Your storyboard starts here'
          }
          action={
            <>
              <Button
                icon="grid"
                variant="primary"
                onClick={() => {
                  const pdf = assets.find((a) => a.mime === 'application/pdf')
                  pdf ? setExtract(pdf) : setImporting(true)
                }}
              >
                {assets.some((a) => a.mime === 'application/pdf')
                  ? 'Organize panels'
                  : 'Import artwork'}
              </Button>
              <Button onClick={addPanel}>Add panel</Button>
            </>
          }
        />
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
                <p>Link a panel to a Shot List to use Split view.</p>
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
                <EmptyState
                  title="No linked panels"
                  action={
                    <Button icon="plus" onClick={addPanel}>
                      Add panel
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </>
      ) : (
        gallery
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
            setSelected('')
            if (mode === 'present') setMode('grid')
          }}
          onSelect={setSelected}
          onReplace={() => setReplace(current)}
          present={mode === 'present'}
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
          onClose={() => setOriginal(undefined)}
          onExtract={() => {
            setExtract(original)
            setOriginal(undefined)
          }}
        />
      )}
      {picker && (
        <ShotPicker
          initial={picker.links}
          onClose={() => setPicker(undefined)}
          onConfirm={(links) => {
            put(c.doc, 'panels', picker.id, { links })
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
      {deleting && (
        <Overlay
          title={`Delete ${deleting.length} panel${deleting.length === 1 ? '' : 's'}?`}
          onClose={() => setDeleting(undefined)}
          footer={
            <>
              <Button onClick={() => setDeleting(undefined)}>Cancel</Button>
              <Button variant="danger" onClick={remove}>
                Delete panels
              </Button>
            </>
          }
        >
          <p>
            Artwork and shot records remain preserved. Restore is available in
            the notification.
          </p>
        </Overlay>
      )}
    </div>
  )
}
