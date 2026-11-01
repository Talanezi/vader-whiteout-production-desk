import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, useBlocker, useParams, useSearchParams } from 'react-router-dom'
import * as Y from 'yjs'
import { Button, IconButton } from '../components/whiteout/Button'
import Icon from '../components/whiteout/Icon'
import NameTooltip from '../components/whiteout/NameTooltip'
import Menu from '../components/whiteout/Menu'
import ModeSwitch from '../components/whiteout/ModeSwitch'
import Combobox from '../components/whiteout/Combobox'
import InlineDelete from '../components/whiteout/InlineDelete'
import QuantityInput from '../components/whiteout/QuantityInput'
import {
  ErrorNotice,
  LoadingRows,
  SessionState,
  useToast,
} from '../components/whiteout/Feedback'
import { Overlay } from '../components/whiteout/Overlay'
import { SearchField } from '../components/whiteout/Workspace'
import CollaborativeText from '../components/shots/CollaborativeText'
import ShotImport from '../components/shots/ShotImport'
import type { PrintView } from '../lib/shotPrint'
import ShotGrid from '../components/shots/ShotGrid'
import ShootDays from '../components/shots/ShootDays'
import ShotPdf from '../components/shots/ShotPdf'
import {
  displayShot,
  addScene,
  addShot,
  change,
  choices,
  fields,
  narrativeFields,
  ordered,
  reorder,
  scenes,
  shots,
  str,
  type RecordMap,
  type ShotField,
} from '../lib/shotDocument'
import { useShotCollaboration } from '../lib/useShotCollaboration'
import { getAuthToken } from '../lib/api'

export default function ShotListPage() {
  const { id = '' } = useParams(),
    [query, setQuery] = useSearchParams()
  const c = useShotCollaboration(id),
    notify = useToast()
  const [mode, setMode] = useState('all'),
    [search, setSearch] = useState(''),
    [sceneSearch, setSceneSearch] = useState('')
  const sceneId = query.get('scene') || ''
  const [selected, setSelected] = useState(''),
    [inspector, setInspector] = useState(false),
    [mobileScenes, setMobileScenes] = useState(false)
  const [width, setWidth] = useState(304),
    [columnOpen, setColumnOpen] = useState(false)
  const [railCollapsed, setRailCollapsed] = useState(false),
    [focused, setFocused] = useState(false),
    [dayOpen, setDayOpen] = useState(false),
    [pdfOpen, setPdfOpen] = useState(false)
  const printView = useRef<PrintView | undefined>(undefined),
    previousLayout = useRef({ rail: false, inspector: false })
  const [printContext, setPrintContext] = useState<PrintView>()
  const [importBusy, setImportBusy] = useState(false)
  const [importing, setImporting] = useState(false),
    [sceneDialog, setSceneDialog] = useState<'new' | RecordMap | null>(null)
  const [sceneNumber, setSceneNumber] = useState(''),
    [sceneTitle, setSceneTitle] = useState(''),
    [sceneError, setSceneError] = useState('')
  const [deleting, setDeleting] = useState<Set<string>>(new Set())
  const [multi, setMulti] = useState<Set<string>>(new Set()),
    [copied, setCopied] = useState(false)
  const grid = useRef<HTMLTableElement>(null),
    connectedBefore = useRef(false),
    connectionToast = useRef<number | undefined>(undefined)
  const allScenes = ordered(scenes(c.doc)),
    allShots = ordered(
      shots(c.doc),
      mode === 'planning' ? 'planningOrder' : 'order',
      deleting,
    )
  const selectedScene = scenes(c.doc).has(sceneId)
    ? sceneId
    : str(allScenes[0], 'id')
  const visible = allShots.filter(
    (s) =>
      (mode !== 'scene' || str(s, 'sceneId') === selectedScene) &&
      Object.keys(fields).some((key) =>
        str(s, key).toLowerCase().includes(search.trim().toLowerCase()),
      ),
  )
  if (mode !== 'planning')
    visible.sort((a, b) => {
      const ai = allScenes.findIndex((s) => str(s, 'id') === str(a, 'sceneId')),
        bi = allScenes.findIndex((s) => str(s, 'id') === str(b, 'sceneId'))
      return (
        ai - bi ||
        Number(a.get('order')) - Number(b.get('order')) ||
        str(a, 'id').localeCompare(str(b, 'id'))
      )
    })
  const shot = shots(c.doc).get(selected),
    current = shot && !shot.get('deleted') ? shot : undefined
  const block = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname &&
      c.synced &&
      (!c.connected || !c.saved || importing),
  )
  useEffect(() => {
    if (c.connected) {
      if (connectedBefore.current && connectionToast.current) {
        notify('Connection restored. Synchronizing…', {
          id: connectionToast.current,
          state: 'pending',
        })
      }
      connectedBefore.current = true
    } else if (connectedBefore.current) {
      connectionToast.current = notify(
        'Connection interrupted. Keep this window open; edits remain in memory.',
        { state: 'error' },
      )
    }
  }, [c.connected])
  useEffect(() => {
    if (c.saved && c.connected && connectionToast.current) {
      notify('Connection restored. All changes saved.', {
        id: connectionToast.current,
        state: 'success',
      })
      connectionToast.current = undefined
    }
  }, [c.saved, c.connected])
  useEffect(() => {
    if (sceneId) setMode('scene')
  }, [sceneId])
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (importing) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [importing])
  const selectCell = (s: RecordMap, field: string) => {
    setSelected(str(s, 'id'))
    c.provider?.setAwarenessField('cell', { shotId: str(s, 'id'), field })
  }
  const peers = c.peers.filter((p) => p.clientId !== c.doc.clientID && p.user)
  const remote = (s: RecordMap, field: string) =>
    peers.find((p) => p.cell?.shotId === str(s, 'id') && p.cell.field === field)
  function focusNewShot(shotId: string) {
    requestAnimationFrame(() => {
      const input = grid.current?.querySelector<HTMLInputElement>(
        `[data-shot="${shotId}"] [data-field="number"] input`,
      )
      input?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      input?.focus()
    })
  }
  function selectScene(sid: string) {
    setQuery({ scene: sid }, { replace: true })
    setMode('scene')
    setMobileScenes(false)
  }
  function openScene(scene: 'new' | RecordMap) {
    setSceneNumber(scene === 'new' ? '' : str(scene, 'number'))
    setSceneTitle(scene === 'new' ? '' : str(scene, 'title'))
    setSceneDialog(scene)
    setSceneError('')
  }
  function saveScene() {
    if (!sceneNumber.trim()) {
      setSceneError('A scene number is required.')
      return
    }
    if (sceneDialog === 'new') {
      const sid = addScene(c.doc, sceneNumber.trim(), sceneTitle)
      selectScene(sid)
    } else if (sceneDialog) {
      c.doc.transact(() => {
        sceneDialog.set('number', sceneNumber.trim())
        sceneDialog.set('title', sceneTitle)
      }, 'local')
    }
    setSceneDialog(null)
  }
  async function waitForSaved() {
    // Confirmation is durable: await an ACK whose digest includes this mutation.
    const provider = c.provider
    if (!provider)
      throw new Error('Connection unavailable. The shot is retained.')
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        provider.off('stateless', ack)
        reject(
          new Error(
            'Server save is not confirmed. Keep this window open and reconnect.',
          ),
        )
      }, 10000)
      const ack = async ({ payload }: { payload: string }) => {
        try {
          const message = JSON.parse(payload)
          if (message.type === 'persisted') {
            const hash = await crypto.subtle.digest(
              'SHA-256',
              Y.encodeSnapshot(Y.snapshot(c.doc)) as BufferSource,
            )
            const digest = [...new Uint8Array(hash)]
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
            if (digest === message.digest) {
              clearTimeout(timer)
              provider.off('stateless', ack)
              resolve()
            }
          }
          if (message.type === 'persistence-error') {
            clearTimeout(timer)
            provider.off('stateless', ack)
            reject(new Error('Database save failed.'))
          }
        } catch {}
      }
      provider.on('stateless', ack)
    })
  }
  async function remove(s: RecordMap) {
    if (!c.connected)
      throw new Error('Reconnect before deleting. The shot is retained.')
    const toast = notify('Deleting shot…', { state: 'pending' })
    setDeleting((old) => new Set(old).add(str(s, 'id')))
    change(c.doc, s, 'deleted', true, c.session?.user.id)
    try {
      await waitForSaved()
      notify('Shot deleted.', {
        id: toast,
        state: 'success',
        action: {
          label: 'Restore',
          run: () => {
            change(c.doc, s, 'deleted', false, c.session?.user.id)
            void notify
              .promise(waitForSaved(), {
                pending: 'Restoring shot…',
                success: 'Shot restored.',
                error: 'Restoration is not saved yet. Keep this window open.',
              })
              .catch(() => {})
          },
        },
      })
    } catch (e) {
      change(c.doc, s, 'deleted', false, c.session?.user.id)
      notify('Deletion failed. Shot retained.', { id: toast, state: 'error' })
      throw e
    } finally {
      setDeleting((old) => {
        const next = new Set(old)
        next.delete(str(s, 'id'))
        return next
      })
    }
  }
  function edit(s: RecordMap, field: ShotField, value: string) {
    if (narrativeFields.includes(field)) {
      const text = s.get(field) as Y.Text
      c.doc.transact(() => {
        text.delete(0, text.length)
        text.insert(0, value)
      }, 'local')
    } else change(c.doc, s, field, value, c.session?.user.id)
  }
  function cell(s: RecordMap, field: ShotField, detail = false) {
    const peer = remote(s, field),
      label = `${fields[field]} · ${str(s, 'number') || 'unnumbered shot'}`
    return (
      <div
        className={`pd-shot-cell ${peer ? 'has-remote' : ''}`}
        style={
          peer
            ? ({ '--peer-color': peer.user!.color } as CSSProperties)
            : undefined
        }
        data-field={field}
        data-shot-id={str(s, 'id')}
        data-remote={peer?.user?.name}
      >
        {field === 'number' ? (
          <ShotNumberInput
            label={label}
            value={str(s, field)}
            display={displayShot(c.doc, s)}
            onFocus={() => selectCell(s, field)}
            onChange={(v) => edit(s, field, v)}
          />
        ) : narrativeFields.includes(field) && c.provider ? (
          <CollaborativeText
            text={s.get(field) as Y.Text}
            provider={c.provider}
            undo={c.undo}
            label={label}
            compact={!detail}
            onFocus={() => selectCell(s, field)}
          />
        ) : choices[field] ? (
          <Combobox
            label={label}
            value={str(s, field)}
            options={choices[field]!}
            onChange={(v) => edit(s, field, v)}
            onFocus={() => selectCell(s, field)}
          />
        ) : [
            'scriptSeconds',
            'setupMinutes',
            'estimatedMinutes',
            'plannedTakes',
          ].includes(field) ? (
          <QuantityInput
            label={label}
            value={str(s, field)}
            onChange={(v) => edit(s, field, v)}
            onFocus={() => selectCell(s, field)}
            integer={field === 'plannedTakes'}
            steppers={detail}
          />
        ) : (
          <input
            aria-label={label}
            value={str(s, field)}
            placeholder="—"
            inputMode={
              /Seconds|Minutes|Takes/.test(field) && field !== 'actualTakes'
                ? 'decimal'
                : undefined
            }
            onFocus={() => selectCell(s, field)}
            onChange={(e) => edit(s, field, e.target.value)}
          />
        )}
        {peer && !narrativeFields.includes(field) && (
          <span className="pd-remote-label">
            {peer.user!.name.split(' ')[0]}
          </span>
        )}
      </div>
    )
  }
  const sceneRail = (
    <aside className="pd-scene-rail">
      <div className="pd-scene-heading">
        <span>Scenes</span>
        <IconButton
          name="collapse"
          label="Collapse scenes"
          onClick={() => setRailCollapsed(true)}
        />
        <IconButton
          name="plus"
          label="Add scene"
          onClick={() => openScene('new')}
        />
      </div>
      <SearchField
        label="Find scene"
        placeholder="Find scene…"
        value={sceneSearch}
        onChange={setSceneSearch}
      />
      <nav aria-label="Scenes">
        {allScenes
          .filter((s) =>
            `${str(s, 'number')} ${str(s, 'title')}`
              .toLowerCase()
              .includes(sceneSearch.toLowerCase()),
          )
          .map((s) => (
            <button
              type="button"
              key={str(s, 'id')}
              className={
                mode === 'scene' && selectedScene === str(s, 'id')
                  ? 'is-selected'
                  : ''
              }
              onClick={() => selectScene(str(s, 'id'))}
            >
              <span className="pd-scene-number">{str(s, 'number')}</span>
              <span>
                <strong>{str(s, 'title') || 'Untitled scene'}</strong>
                <small>
                  {
                    allShots.filter(
                      (shot) => str(shot, 'sceneId') === str(s, 'id'),
                    ).length
                  }{' '}
                  shots
                </small>
              </span>
            </button>
          ))}
      </nav>
    </aside>
  )
  const inspectorContent = current ? (
    <>
      <div className="pd-inspector-heading">
        <div>
          <span>Shot</span>
          <h2>{str(current, 'number') || 'Unnumbered'}</h2>
        </div>
        <IconButton
          name="close"
          label="Collapse inspector"
          onClick={() => setInspector(false)}
        />
      </div>
      <div className="pd-inspector-body">
        <div className="pd-inspector-scene">
          <span>Scene</span>
          <Combobox
            label="Move shot to scene"
            custom={false}
            clearable={false}
            value={str(current, 'sceneId')}
            options={allScenes.map((s) => str(s, 'id'))}
            labels={Object.fromEntries(
              allScenes.map((s) => [
                str(s, 'id'),
                `${str(s, 'number')}${str(s, 'title') ? ' · ' + str(s, 'title') : ''}`,
              ]),
            )}
            onChange={(sid) => {
              if (scenes(c.doc).has(sid))
                change(c.doc, current, 'sceneId', sid, c.session?.user.id)
            }}
          />
        </div>
        <section>
          <h3>Coverage</h3>
          {(['number', 'subject', 'coverage'] as ShotField[]).map((f) => (
            <div className="pd-inspector-field" key={f}>
              <label>{fields[f]}</label>
              {cell(current, f, true)}
            </div>
          ))}
        </section>
        <section>
          <h3>Camera</h3>
          <div className="pd-inspector-technical">
            {(
              [
                'camera',
                'framing',
                'angle',
                'lens',
                'equipment',
                'movement',
              ] as ShotField[]
            ).map((f) => (
              <div className="pd-inspector-field" key={f}>
                <label>{fields[f]}</label>
                {cell(current, f, true)}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>Timing & takes</h3>
          <div className="pd-inspector-technical">
            {(
              [
                'scriptSeconds',
                'setupMinutes',
                'plannedTakes',
                'estimatedMinutes',
                'actualTakes',
              ] as ShotField[]
            ).map((f) => (
              <div className="pd-inspector-field" key={f}>
                <label>{fields[f]}</label>
                {cell(current, f, true)}
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>Notes</h3>
          {(['notes', 'focusNotes', 'lightingNotes'] as ShotField[]).map(
            (f) => (
              <div className="pd-inspector-field" key={f}>
                <label>{fields[f]}</label>
                {cell(current, f, true)}
              </div>
            ),
          )}
        </section>
        {current.get('source') ? (
          <details className="pd-shot-source">
            <summary>Workbook source</summary>
            <pre>{String(current.get('source'))}</pre>
          </details>
        ) : null}
        <p className="pd-shot-meta">
          Created{' '}
          {str(current, 'createdAt')
            ? new Date(str(current, 'createdAt')).toLocaleDateString()
            : '—'}
          {str(current, 'updatedAt')
            ? ` · edited ${new Date(str(current, 'updatedAt')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : ''}
        </p>
      </div>
    </>
  ) : null
  if (!getAuthToken() || c.error === 'UNAUTHORIZED') return <SessionState />
  if (c.error && !c.session) return <ErrorNotice>{c.error}</ErrorNotice>
  return (
    <div
      className="pd-shot-workspace"
      style={{ '--inspector-width': `${width}px` } as CSSProperties}
    >
      <header className="pd-shot-header">
        <div className="pd-shot-heading">
          <Link to="/shotlists" aria-label="Back to shot lists">
            <Icon name="back" />
          </Link>
          <h1>
            {str(c.doc.getMap('meta'), 'name') ||
              c.session?.name ||
              'Shot list'}
          </h1>
        </div>
        <div className="pd-shot-header-actions">
          <span
            className={`pd-sync-state ${c.connected && c.saved ? 'is-saved' : ''}`}
            role="status"
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
          <div className="pd-collaborators" aria-label="Active collaborators">
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
                    .user!.name.split(/\s+/)
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </NameTooltip>
              ))}
          </div>
          <button
            type="button"
            className={`pd-button pd-share ${copied ? 'is-copied' : ''}`}
            onClick={async () => {
              try {
                const link = new URL(window.location.href)
                link.hash = `/shotlists/${id}${mode === 'scene' && selectedScene ? `?scene=${selectedScene}` : ''}`
                await navigator.clipboard.writeText(link.toString())
                setCopied(true)
                setTimeout(() => setCopied(false), 2200)
              } catch {
                notify(
                  'Could not copy the link. Copy the address from your browser.',
                  { state: 'error' },
                )
              }
            }}
          >
            <Icon name={copied ? 'check' : 'share'} />
            <span>{copied ? 'Copied' : 'Copy link'}</span>
          </button>
          <Button
            icon="download"
            onClick={() => {
              setPrintContext(printView.current)
              setPdfOpen(true)
            }}
          >
            Download
          </Button>
        </div>
      </header>
      {c.error && <ErrorNotice>{c.error}</ErrorNotice>}
      {!c.synced ? (
        <LoadingRows label="Connecting to the shot list…" />
      ) : (
        <>
          <div className="pd-shot-toolbar">
            <div className="pd-shot-tools-left">
              <ModeSwitch
                value={mode}
                onChange={(v) => {
                  setMode(v)
                  if (v !== 'scene') setQuery({}, { replace: true })
                }}
              />
              <button
                type="button"
                className="pd-button pd-show-scenes"
                onClick={() => setMobileScenes(true)}
              >
                <Icon name="file" />
                Scenes
              </button>
              <SearchField
                label="Search shots"
                placeholder="Search shots…"
                value={search}
                onChange={setSearch}
              />
            </div>
            <div className="pd-shot-tools-right">
              <div className="pd-shot-history">
                <IconButton
                  name="undo"
                  label="Undo"
                  disabled={!c.undo.canUndo()}
                  onClick={() => c.undo.undo()}
                />
                <IconButton
                  name="redo"
                  label="Redo"
                  disabled={!c.undo.canRedo()}
                  onClick={() => c.undo.redo()}
                />
              </div>

              <Button
                aria-pressed={focused}
                onClick={() => {
                  if (!focused) {
                    previousLayout.current = { rail: railCollapsed, inspector }
                    setRailCollapsed(true)
                    setInspector(false)
                  } else {
                    setRailCollapsed(previousLayout.current.rail)
                    setInspector(previousLayout.current.inspector)
                  }
                  setFocused(!focused)
                }}
              >
                {focused ? 'Restore layout' : 'Focus'}
              </Button>
              <IconButton
                name="columns"
                disabled={mode === 'shooting'}
                title={
                  mode === 'shooting'
                    ? 'Choose editing columns in a creative view'
                    : 'Choose columns'
                }
                label="Choose columns"
                onClick={() => setColumnOpen(true)}
              />
              <Menu
                label="Workspace actions"
                compact
                items={[
                  {
                    value: 'import',
                    label: 'Import',
                    onSelect: () => setImporting(true),
                  },
                  {
                    value: 'days',
                    label: 'Shooting days',
                    onSelect: () => setMode('shooting'),
                  },
                ]}
              />
              <Button
                icon="plus"
                onClick={() => {
                  if (!selectedScene) {
                    openScene('new')
                    return
                  }
                  if (mode === 'shooting') {
                    setMode('scene')
                    setQuery({ scene: selectedScene }, { replace: true })
                  }
                  const sid = addShot(c.doc, selectedScene, c.session!.user.id)
                  setSelected(sid)
                  focusNewShot(sid)
                  notify('Shot added.')
                }}
              >
                Add shot
              </Button>
            </div>
          </div>
          <div
            className={`pd-shot-layout ${inspector && current ? 'with-inspector' : ''} ${railCollapsed || mode === 'shooting' ? 'without-scenes' : ''}`}
          >
            {!railCollapsed && mode !== 'shooting' && sceneRail}
            <section className="pd-shot-center" aria-label="Shot table">
              <div className="pd-shot-context">
                {railCollapsed && mode !== 'shooting' && (
                  <IconButton
                    name="expand"
                    label="Show scenes"
                    onClick={() => setRailCollapsed(false)}
                  />
                )}
                <span>
                  {mode === 'scene'
                    ? `Scene ${str(scenes(c.doc).get(selectedScene), 'number')}`
                    : mode === 'planning'
                      ? 'Creative planning order'
                      : 'All scenes'}
                  <small>{visible.length} shots</small>
                </span>
                <div>
                  {mode === 'scene' && scenes(c.doc).get(selectedScene) && (
                    <IconButton
                      name="edit"
                      label="Edit scene details"
                      onClick={() =>
                        openScene(scenes(c.doc).get(selectedScene)!)
                      }
                    />
                  )}
                  <IconButton
                    name="expand"
                    label="Open shot inspector"
                    disabled={!current}
                    onClick={() => setInspector(!inspector)}
                  />
                </div>
              </div>
              {mode === 'shooting' ? (
                <ShootDays
                  onPrintView={(view) => {
                    printView.current = view
                  }}
                  onSelect={(id) => {
                    setSelected(id)
                    setInspector(true)
                  }}
                  doc={c.doc}
                  selected={
                    multi.size ? [...multi] : selected ? [selected] : []
                  }
                  onError={(message) => notify(message, { state: 'error' })}
                />
              ) : (
                <ShotGrid
                  undo={c.undo}
                  onPrintView={(view) => {
                    printView.current = {
                      ...view,
                      label:
                        mode === 'scene'
                          ? `Scene ${str(scenes(c.doc).get(selectedScene), 'number')}`
                          : mode === 'planning'
                            ? 'Planning Order'
                            : 'All scenes',
                    }
                  }}
                  doc={c.doc}
                  rows={visible}
                  cell={cell}
                  selected={selected}
                  onSelect={setSelected}
                  multi={multi}
                  onMulti={setMulti}
                  planning={mode === 'planning'}
                  filtered={Boolean(search.trim())}
                  columnOpen={columnOpen}
                  onCloseColumns={() => setColumnOpen(false)}
                  tableRef={grid}
                  onError={(message) => notify(message, { state: 'error' })}
                  user={c.session!.user.id}
                  onAssign={() => setDayOpen(true)}
                  actions={(s, index) => (
                    <div>
                      <IconButton
                        name="expand"
                        label={`Inspect shot ${str(s, 'number')}`}
                        onClick={() => {
                          setSelected(str(s, 'id'))
                          setInspector(true)
                        }}
                      />
                      <Menu
                        compact
                        icon="more"
                        label={`Actions for shot ${str(s, 'number')}`}
                        items={[
                          {
                            value: 'duplicate',
                            label: 'Duplicate shot',
                            icon: 'copy',
                            onSelect: () => {
                              const sid = addShot(
                                c.doc,
                                str(s, 'sceneId'),
                                c.session!.user.id,
                                s,
                              )
                              setSelected(sid)
                              focusNewShot(sid)
                              notify('Shot duplicated.')
                            },
                          },
                          {
                            value: 'up',
                            label: 'Move earlier',
                            icon: 'up',
                            disabled:
                              !!search.trim() ||
                              index === 0 ||
                              (mode !== 'planning' &&
                                str(visible[index - 1], 'sceneId') !==
                                  str(s, 'sceneId')),
                            onSelect: () =>
                              reorder(
                                c.doc,
                                visible,
                                index,
                                -1,
                                mode === 'planning',
                              ),
                          },
                          {
                            value: 'down',
                            label: 'Move later',
                            icon: 'down',
                            disabled:
                              !!search.trim() ||
                              index === visible.length - 1 ||
                              (mode !== 'planning' &&
                                str(visible[index + 1], 'sceneId') !==
                                  str(s, 'sceneId')),
                            onSelect: () =>
                              reorder(
                                c.doc,
                                visible,
                                index,
                                1,
                                mode === 'planning',
                              ),
                          },
                        ]}
                      />
                      <InlineDelete
                        label={`shot ${str(s, 'number') || 'unnumbered'}`}
                        onConfirm={() => remove(s)}
                      />
                    </div>
                  )}
                />
              )}
              <div>
                {!visible.length && (
                  <div className="pd-shot-empty">
                    <Icon name="shots" />
                    <h2>
                      {search
                        ? 'No matching shots'
                        : allScenes.length
                          ? 'No shots in this view'
                          : 'Create the first scene'}
                    </h2>
                    {!allScenes.length && (
                      <Button icon="plus" onClick={() => openScene('new')}>
                        Add scene
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <footer className="pd-shot-table-footer">
                <span>
                  {allScenes.length} scenes · {allShots.length} shots
                </span>

                <span>
                  {visible
                    .reduce(
                      (total, s) =>
                        total + (Number(str(s, 'estimatedMinutes')) || 0),
                      0,
                    )
                    .toLocaleString('en-US', { maximumFractionDigits: 1 })}{' '}
                  min estimated
                </span>
              </footer>
            </section>
            {inspector && current && (
              <aside className="pd-shot-inspector-desktop">
                <div
                  className="pd-inspector-resizer"
                  role="separator"
                  aria-label="Inspector width"
                  aria-valuemin={264}
                  aria-valuemax={480}
                  aria-valuenow={width}
                  aria-orientation="vertical"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault()
                      setWidth((w) =>
                        Math.max(
                          264,
                          Math.min(480, w + (e.key === 'ArrowLeft' ? 16 : -16)),
                        ),
                      )
                    }
                  }}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId)
                  }}
                  onPointerMove={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                      const right =
                        e.currentTarget.parentElement!.getBoundingClientRect()
                          .right
                      setWidth(Math.max(264, Math.min(480, right - e.clientX)))
                    }
                  }}
                />
                {inspectorContent}
              </aside>
            )}
          </div>
          {inspector && current && (
            <div className="pd-shot-inspector-mobile">
              <MobileInspector onClose={() => setInspector(false)}>
                {inspectorContent}
              </MobileInspector>
            </div>
          )}
        </>
      )}
      {mobileScenes && (
        <Overlay
          title="Scenes"
          kind="drawer"
          className="pd-scenes-drawer"
          onClose={() => setMobileScenes(false)}
        >
          {sceneRail}
        </Overlay>
      )}
      {sceneDialog && (
        <Overlay
          title={sceneDialog === 'new' ? 'New scene' : 'Edit scene'}
          onClose={() => setSceneDialog(null)}
          footer={
            <>
              <Button onClick={() => setSceneDialog(null)}>Cancel</Button>
              <Button variant="primary" icon="check" onClick={saveScene}>
                Save scene
              </Button>
            </>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              saveScene()
            }}
          >
            <label className="pd-field">
              <span>Scene number</span>
              <input
                data-initial-focus
                maxLength={80}
                value={sceneNumber}
                onChange={(e) => setSceneNumber(e.target.value)}
                placeholder="e.g. 09"
              />
            </label>
            <label className="pd-field">
              <span>Title / location</span>
              <input
                maxLength={500}
                value={sceneTitle}
                onChange={(e) => setSceneTitle(e.target.value)}
              />
            </label>
            {sceneError && <ErrorNotice>{sceneError}</ErrorNotice>}
          </form>
        </Overlay>
      )}
      {pdfOpen && (
        <ShotPdf
          id={id}
          doc={c.doc}
          view={printContext}
          selected={[...multi]}
          entire={(mode === 'planning'
            ? allShots
            : allScenes.flatMap((scene) =>
                allShots.filter(
                  (shot) => str(shot, 'sceneId') === str(scene, 'id'),
                ),
              )
          ).map((shot) => ({ shotId: str(shot, 'id') }))}
          saved={c.saved && c.connected}
          onClose={() => setPdfOpen(false)}
        />
      )}
      {dayOpen && (
        <Overlay
          title="Shooting days"
          onClose={() => setDayOpen(false)}
          className="pd-days-dialog"
        >
          <ShootDays
            doc={c.doc}
            selected={multi.size ? [...multi] : selected ? [selected] : []}
            onError={(message) => notify(message, { state: 'error' })}
          />
        </Overlay>
      )}
      {importing && (
        <ShotImport
          id={id}
          onBusyChange={setImportBusy}
          onClose={() => setImporting(false)}
        />
      )}
      {block.state === 'blocked' && (
        <Overlay
          title={importing ? 'Import review is open' : 'Changes are not saved'}
          onClose={() => block.reset()}
          footer={
            <>
              <Button onClick={() => block.reset()}>Keep editing</Button>
              <Button
                variant="danger"
                disabled={importBusy}
                onClick={() => block.proceed()}
              >
                Leave without waiting
              </Button>
            </>
          }
        >
          <p>
            Server synchronization is not confirmed. Leaving may lose
            unsynchronized edits.
          </p>
        </Overlay>
      )}
    </div>
  )
}
function MobileInspector({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  const [mobile, setMobile] = useState(
    matchMedia('(max-width: 1359px)').matches,
  )
  useEffect(() => {
    const mq = matchMedia('(max-width: 1359px)'),
      update = () => setMobile(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return mobile ? (
    <Overlay
      title="Shot inspector"
      kind="drawer"
      className="pd-shot-inspector-drawer"
      onClose={onClose}
    >
      {children}
    </Overlay>
  ) : null
}

function ShotNumberInput({
  label,
  value,
  display,
  onFocus,
  onChange,
}: {
  label: string
  value: string
  display: string
  onFocus: () => void
  onChange: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  return (
    <input
      aria-label={label}
      value={editing ? value : display}
      onFocus={() => {
        setEditing(true)
        onFocus()
      }}
      onBlur={() => setEditing(false)}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
