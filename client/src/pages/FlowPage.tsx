import {useShootLog} from '../lib/flow/useShootLog'
import FlowLayout from '../components/flow/FlowLayout'
import type {CastPerson} from '../../../server/src/flows/talent'
import ShootLog from '../components/flow/ShootLog'
import ViewSwitcher from '../components/storyboards/ViewSwitcher'
import DatePicker from '../components/whiteout/DatePicker'
import InstructionTiming from '../components/flow/InstructionTiming'
import { change, displayShot } from '../lib/shotDocument'
import { scheduleState, clockText } from '../lib/flow/model'
import { useEffect, useRef, useState } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
  useBlocker,
} from 'react-router-dom'
import * as Y from 'yjs'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { useFlowCollaboration } from '../lib/flow/useFlowCollaboration'
import { useShotCollaboration } from '../lib/useShotCollaboration'
import { flowRequest, flowFetch } from '../lib/flow/api'
import { getAuthToken } from '../lib/api'
import {
  put,
  addEvent,
  departments,
  records,
  moveEvent,
  duration,
  localParts,
  type FlowEvent,
} from '../lib/flow/model'
import { shots, str } from '../lib/shotDocument'
import { Button, IconButton } from '../components/whiteout/Button'
import Menu from '../components/whiteout/Menu'
import { Overlay } from '../components/whiteout/Overlay'
import {
  LoadingRows,
  SessionState,
  ErrorNotice,
  useToast,
} from '../components/whiteout/Feedback'
import { SearchField } from '../components/whiteout/Workspace'
import NameTooltip from '../components/whiteout/NameTooltip'
import DotsLoader from '../components/whiteout/DotsLoader'
import Icon from '../components/whiteout/Icon'
import { shotSensors } from '../components/shots/ShotDrag'
import ShotPicker from '../components/storyboards/ShotPicker'
import FlowGrid from '../components/flow/FlowGrid'
import TimeMap from '../components/flow/TimeMap'
import ShotRail from '../components/flow/ShotRail'
import TimeEditor from '../components/flow/TimeEditor'
import EventInspector from '../components/flow/EventInspector'
import FlowPrint from '../components/flow/FlowPrint'
import FlowHistory from '../components/flow/FlowHistory'
import FlowImport from '../components/flow/FlowImport'
import '../components/storyboards/storyboards.css'
import '../components/flow/flow.css'
type Collab = ReturnType<typeof useFlowCollaboration>
function Connected({
  c,
  id,
  listId,
}: {
  c: Collab
  id: string
  listId: string
}) {
  const source = useShotCollaboration(listId)
  return <Workspace c={c} id={id} source={source} />
}
export default function FlowPage() {
  const { id = '' } = useParams(),
    c = useFlowCollaboration(id)
  if (!getAuthToken() || c.error === 'UNAUTHORIZED')
    return <SessionState />
  if (!c.synced || !c.provider || !c.session || c.session.id !== id)
    return (
      <div className="pd-page">
        {c.error ? (
          <ErrorNotice>{c.error}</ErrorNotice>
        ) : (
          <LoadingRows label="Loading production Flow…" />
        )}
      </div>
    )
  const listId = String(c.doc.getMap('meta').get('listId') || '')
  return listId ? (
    <Connected key={id+':'+listId} c={c} id={id} listId={listId} />
  ) : (
    <Workspace key={id} c={c} id={id} />
  )
}
function Workspace({
  c,
  id,
  source,
}: {
  c: Collab
  id: string
  source?: ReturnType<typeof useShotCollaboration>
}) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      c.synced &&
      (!c.connected || !c.saved || Boolean(localStorage.getItem(`whiteout:shoot-log-pending:${c.session?.user.id}:${id}`))) &&
      currentLocation.pathname !== nextLocation.pathname,
  )
  const doc = c.doc,
    meta = doc.getMap('meta'),
    listId = String(meta.get('listId') || ''),
    zone = 'UTC',
    date = String(meta.get('date') || ''),
    scheduleView = scheduleState(
      doc,
      source?.synced ? source.doc : undefined,
    ),
    events = scheduleView.events as FlowEvent[],
    deps = departments(doc),
    toast = useToast(),
    navigate = useNavigate(),
    location = useLocation()
  const [cast,setCast]=useState<CastPerson[]>([])
  useEffect(()=>{flowRequest<CastPerson[]>(`/${id}/cast`).then(setCast).catch(()=>{})},[id])
  const modeKey=`whiteout:flow:${id}:user:${c.session!.user.id}:view`
  const [mode, setMode] = useState(()=>{const saved=localStorage.getItem(modeKey);return saved&&['flow','map','log'].includes(saved)?saved:'flow'}),
    [rail, setRail] = useState(true),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState(new Set<string>()),
    [inspector, setInspector] = useState<{ id: string; tab: string }>(),
    [time, setTime] = useState<string>(),
    [timeSuggestion, setTimeSuggestion] = useState<number>(),
    [newDepartment, setNewDepartment] = useState(false),
    [departmentName, setDepartmentName] = useState(''),
    [instructionTime, setInstructionTime] = useState<{
      event: FlowEvent
      departmentId: string
    }>(),
    [print, setPrint] = useState(false),
    [history, setHistory] = useState(false),
    [importing, setImporting] = useState(
      new URLSearchParams(location.search).has('import'),
    ),
    [picker, setPicker] = useState(false),
    [relink, setRelink] = useState(''),
    [deleting, setDeleting] = useState<string[]>([]),
    [disconnect, setDisconnect] = useState(false),
    [settings, setSettings] = useState(false),
    [copied, setCopied] = useState(false),
    [error, setError] = useState(''),
    [dragging, setDragging] = useState(''),
    [move, setMove] = useState<{
      event: FlowEvent
      target?: FlowEvent
      start?: string
      duration?: number | null
    }>(),
    [durationBusy, setDurationBusy] = useState(false),
    [conflict, setConflict] = useState<{
      eventId: string
      anchorId: string
    }>()
  useEffect(()=>localStorage.setItem(modeKey,mode),[mode,modeKey])
  const shootLog=useShootLog(id,doc,c.session!.user.id,c.connected)
  const allSaved =
    shootLog.queue.length===0 &&
    c.saved &&
    !durationBusy &&
    (!source || source.saved || Boolean(source.error))
  const key = `whiteout:flow:${id}:user:${c.session!.user.id}:layout`,
    [layout, setLayout] = useState<{
      hidden: string[]
      widths: Record<string, number>
    }>(() => {
      try {
        return (
          JSON.parse(localStorage.getItem(key) || 'null') || {
            hidden: [],
            widths: {},
          }
        )
      } catch {
        return { hidden: [], widths: {} }
      }
    }),
    dragStart = useRef<string[]>([]),
    dropTarget = useRef('')
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(layout))
    } catch {}
  }, [layout, key])
  useEffect(() => {
    setSelected(
      (v) =>
        new Set([...v].filter((id) => events.some((e) => e.id === id))),
    )
  }, [c.revision])
  const filter = events.filter((e) =>
      [
        e.description,
        e.reference,
        e.shotId
          ? source?.doc
              .getMap<Y.Map<unknown>>('shots')
              .get(e.shotId)
              ?.get('subject')
          : '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
    visible = deps.filter((d) => !layout.hidden.includes(d.id)),
    sourceShots = source?.synced ? shots(source.doc) : undefined,
    scope = `flow:${id}`
  function inspect(e: FlowEvent, tab = 'details') {
    setInspector({ id: e.id, tab })
    c.provider?.setAwarenessField('cell', { shotId: e.id, field: tab })
  }
  function add(
    type: FlowEvent['type'],
    after?: FlowEvent,
    where = 'after',
  ) {
    const id = addEvent(doc, {
      type,
      description: type === 'milestone' ? 'Shared milestone' : '',
      start: null,
      timing: type === 'department' ? 'unscheduled' : 'sequence',
      order: after
        ? after.order + (where === 'before' ? -1 : 1)
        : Math.max(0, ...events.map((e) => e.order)) + 1024,
    })
    setSelected(new Set([id]))
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(
          `[data-event="${id}"] .flow-action-cell .pd-text-preview`,
        )
        ?.click(),
    )
  }
  function schedule(s: Y.Map<unknown>, target?: FlowEvent) {
    const sid = str(s, 'id'),
      id = addEvent(doc, {
        type: 'shot',
        shotId: sid,
        sourceListId: listId,
        reference: s?.doc ? displayShot(s.doc, s) : str(s, 'number'),
        description: '',
        start: null,
        timing: 'sequence',
        order: target
          ? target.order - 0.5
          : Math.max(0, ...events.map((e) => e.order)) + 1024,
      })
    setSelected(new Set([id]))
  }
  async function remove() {
    const active=(meta.get('liveState') as any)?.activeId;
    if(active&&deleting.includes(active)){toast('Finish the active production block before removing it.',{state:'error'});return}
    try {
      await flowRequest(`/${id}/manage`, {
        action: 'checkpoint',
        summary: 'Before deleting activities',
      })
    } catch (e) {
      setError((e as Error).message)
      return
    }
    const ids = deleting.filter((id) => events.some((e) => e.id === id))
    doc.transact(() =>
      ids.forEach((id) =>
        put(doc, 'events', id, { deletedAt: new Date().toISOString() }),
      ),
    )
    setDeleting([])
    setSelected(new Set())
    toast(`${ids.length} event${ids.length === 1 ? '' : 's'} deleted.`, {
      action: {
        label: 'Restore',
        run: () =>
          doc.transact(() =>
            ids.forEach((id) =>
              put(doc, 'events', id, { deletedAt: null }),
            ),
          ),
      },
    })
  }
  function duplicate() {
    const ids = [...selected]
    doc.transact(() =>
      ids.forEach((id) => {
        const e = events.find((e) => e.id === id)
        if (!e) return
        const newId = addEvent(doc, {
          ...e,
          id: undefined,
          order: e.order + 0.5,
          actualStart: null,
          actualEnd: null,
          status: 'planned',
        })
        records<any>(doc, 'instructions')
          .filter((i) => i.eventId === e.id)
          .forEach((i) =>
            put(doc, 'instructions', newId + ':' + i.departmentId, {
              eventId: newId,
              departmentId: i.departmentId,
              text: new Y.Text(String(i.text || '')),
            }),
          )
      }),
    )
    toast(`${ids.length} event${ids.length === 1 ? '' : 's'} duplicated.`)
  }
  async function downloadSource(hash: string, filename: string) {
    try {
      const r = await flowFetch(`/${id}/sources/${hash}`),
        url = URL.createObjectURL(await r.blob()),
        a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const proposedStart = move?.target?.start || move?.start
  const overlap =
    move && proposedStart
      ? events.filter(
          (other) =>
            other.id !== move.event.id &&
            other.start &&
            duration(other, sourceShots?.get(other.shotId || '')) !=
              null &&
            Date.parse(other.start) <
              Date.parse(proposedStart) +
                (move.duration ??
                  duration(
                    move.event,
                    sourceShots?.get(move.event.shotId || ''),
                  ) ??
                  0) *
                  60000 &&
            Date.parse(other.start) +
              (duration(other, sourceShots?.get(other.shotId || '')) ||
                0) *
                60000 >
              Date.parse(proposedStart) &&
            deps.some(
              (d) =>
                String(
                  doc
                    .getMap<Y.Map<unknown>>('instructions')
                    .get(move.event.id + ':' + d.id)
                    ?.get('text') || '',
                ).trim() &&
                String(
                  doc
                    .getMap<Y.Map<unknown>>('instructions')
                    .get(other.id + ':' + d.id)
                    ?.get('text') || '',
                ).trim(),
            ),
        )
      : []
  const crossingFixed =
    move && proposedStart
      ? events.filter(
          (anchor) =>
            anchor.id !== move.event.id &&
            anchor.fixed &&
            anchor.start &&
            Date.parse(anchor.start) >= Date.parse(proposedStart) &&
            Date.parse(anchor.start) <
              Date.parse(proposedStart) +
                (move.duration ??
                  duration(
                    move.event,
                    sourceShots?.get(move.event.shotId || ''),
                  ) ??
                  0) *
                  60000,
        )
      : []
  const changing = move?.event
  return (
    <div className="flow-workspace">
      <header className="flow-document-header">
        <div>
          <div className="flow-breadcrumb">
            <button onClick={() => navigate('/flows')}>
              Flow of the Day
            </button>
            <span>{date || 'Set Shoot date'}</span>
          </div>
          <h1>{String(meta.get('name'))}</h1>
        </div>
        <div className="flow-document-actions">
          <span className="flow-save" role="status">
            {!allSaved && !c.error && !source?.error && (
              <DotsLoader small />
            )}
            {c.error
              ? 'Save interrupted'
              : source?.error && c.saved
              ? 'Flow saved · source unavailable'
              : !c.connected || Boolean(source && !source.connected)
              ? 'Reconnecting'
              : allSaved
              ? 'Saved'
              : 'Syncing'}
          </span>
          <div className="pd-collaborators">
            {c.peers
              .filter(
                (p, i, a) =>
                  p.user &&
                  a.findIndex((v) => v.user?.id === p.user?.id) === i,
              )
              .map((p) => (
                <NameTooltip
                  key={p.clientId}
                  name={p.user!.name}
                  color={p.user!.color}
                >
                  {p
                    .user!.name.split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </NameTooltip>
              ))}
          </div>
          <Button
            icon={copied ? 'check' : 'share'}
            className={copied ? 'flow-copy-success' : ''}
            onClick={() => {
              void navigator.clipboard
                .writeText(locationLink(id))
                .then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                })
                .catch(() => setError('Could not copy the link.'))
            }}
          >
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
          <Button
            icon="download"
            variant="primary"
            onClick={() => setPrint(true)}
          >
            Print Studio
          </Button>
          <Menu
            compact
            label="Flow options"
            items={[
              {
                value: 'settings',
                label: 'Shoot date',
                onSelect: () => setSettings(true),
              },
              {
                value: 'history',
                label: 'Revision history',
                onSelect: () => setHistory(true),
              },
              {
                value: 'import',
                label: 'Import workbook',
                onSelect: () => setImporting(true),
              },
              ...records<any>(doc, 'imports').map((v) => ({
                value: v.id,
                label: 'Original · ' + v.filename,
                onSelect: () => void downloadSource(v.sha256, v.filename),
              })),
            ]}
          />
        </div>
      </header>
      {(c.error || error) && <ErrorNotice>{c.error || error}</ErrorNotice>}
      {source?.error && (
        <ErrorNotice>
          Connected Shot List: {source.error}. Flow entries remain intact.
        </ErrorNotice>
      )}
      {scheduleView.conflicts.length > 0 && (
        <div className="flow-conflicts" role="status">
          {scheduleView.conflicts.map((x: any) => (
            <div key={x.eventId + ':' + x.anchorId}>
              <span>
                {events.find((e) => e.id === x.eventId)?.label ||
                  events.find((e) => e.id === x.eventId)?.description}{' '}
                overlaps{' '}
                {events.find((e) => e.id === x.anchorId)?.description ||
                  'a fixed activity'}{' '}
                by {x.overlap} min.
              </span>
              <Button icon="calendar" onClick={() => setConflict(x)}>
                Resolve timing
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flow-toolbar">
        <SearchField
          label="Search events"
          placeholder="Search the day…"
          value={search}
          onChange={setSearch}
        />
        <ViewSwitcher label="Flow view" value={mode} onChange={setMode} items={[{id:'flow',label:'Department Flow',icon:'columns'},{id:'map',label:'Time Map',icon:'calendar'},{id:'log',label:'Shoot Log',icon:'check'}]}/>
        {mode!=='log'&&<div className="flow-toolbar-actions">
          <IconButton
            name="undo"
            label="Undo"
            onClick={() => c.undo.undo()}
            disabled={!c.undo.canUndo()}
          />
          <IconButton
            name="redo"
            label="Redo"
            onClick={() => c.undo.redo()}
            disabled={!c.undo.canRedo()}
          />
          <Button icon="plus" onClick={() => add('custom')}>
            Add activity
          </Button>
          <FlowLayout deps={deps} hidden={layout.hidden} onHidden={hidden=>setLayout(l=>({...l,hidden}))} onAdd={()=>setNewDepartment(true)} onOrder={ids=>doc.transact(()=>ids.forEach((id,i)=>doc.getMap<Y.Map<unknown>>('departments').get(id)?.set('order',(i+1)*1024)),'local')}/>
          <Button
            icon={rail ? 'collapse' : 'shots'}
            aria-pressed={rail}
            onClick={() => setRail((v) => !v)}
          >
            Shot Rail
          </Button>
        </div>}
      </div>
      {selected.size > 0 && mode!=='log' && (
        <div className="flow-selection">
          <strong>{selected.size} selected</strong>
          <Button
            icon={copied ? 'check' : 'copy'}
            className={copied ? 'flow-copy-success' : ''}
            onClick={() => {
              const rows = events
                .filter((e) => selected.has(e.id))
                .map((e) =>
                  [
                    e.start ? localParts(e.start, zone) : '',
                    e.description || e.reference || '',
                    ...deps.map((d) =>
                      String(
                        doc
                          .getMap<Y.Map<unknown>>('instructions')
                          .get(e.id + ':' + d.id)
                          ?.get('text') || '',
                      ),
                    ),
                  ]
                    .map((v) => v.replace(/\t/g, ' ').replace(/\n/g, ' '))
                    .join('\t'),
                )
                .join('\n')
              void navigator.clipboard
                .writeText(rows)
                .then(() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1800)
                })
                .catch(() =>
                  setError('Could not copy the selected events.'),
                )
            }}
          >
            Copy selected
          </Button>
          <Button icon="copy" onClick={duplicate}>
            Duplicate selected
          </Button>
          <Button onClick={() => setSelected(new Set())}>
            Clear selection
          </Button>
          <Button
            icon="trash"
            variant="danger"
            onClick={() => setDeleting([...selected])}
          >
            Delete selected
          </Button>
        </div>
      )}
      <DragDropProvider
        sensors={shotSensors}
        onDragStart={(e) => {
          dropTarget.current = ''
          dragStart.current = filter.map((e) => e.id)
          setDragging(
            String(e.operation.source?.id || '').startsWith('department:')
              ? ''
              : String(e.operation.source?.id || ''),
          )
        }}
        onDragOver={(e) => {
          const target = String(e.operation.target?.id || '')
          if (
            events.some((v) => v.id === target) &&
            target !== e.operation.source?.id
          )
            dropTarget.current = target
        }}
        onDragEnd={(e) => {
          if (
            String(e.operation.source?.id || '').startsWith('department:')
          ) {
            const source = e.operation.source
            if (!e.canceled && isSortable(source)) {
              const id = String(source.id).slice(11),
                target = visible[source.index]
              if (target && id !== target.id) {
                const from = deps.findIndex((d) => d.id === id),
                  to = deps.findIndex((d) => d.id === target.id),
                  all = deps.filter((d) => d.id !== id),
                  at = all.findIndex((d) => d.id === target.id)
                all.splice(at + (from < to ? 1 : 0), 0, deps[from])
                doc.transact(() =>
                  all.forEach((d, i) =>
                    put(doc, 'departments', d.id, {
                      order: (i + 1) * 1024,
                    }),
                  ),
                )
              }
            }
            return
          }
          const from = String(e.operation.source?.id || ''),
            to = String(e.operation.target?.id || '')
          setDragging('')
          if (e.canceled) return
          if (from.startsWith('rail:') && to === 'flow:end') {
            const shot = sourceShots?.get(from.slice(5))
            if (shot) schedule(shot)
            return
          }
          const sortable = e.operation.source
          const targetId =
            !from.startsWith('rail:') && isSortable(sortable)
              ? dragStart.current[sortable.index]
              : dropTarget.current || to
          if (!targetId || targetId === from) return
          const target = events.find((v) => v.id === targetId)
          if (!target) return
          if (from.startsWith('rail:')) {
            const shot = sourceShots?.get(from.slice(5))
            if (shot) schedule(shot, target)
            return
          }
          const event = events.find((v) => v.id === from)
          if (!event) return
          moveEvent(doc, event, target)
        }}
      >
        <div className={`flow-content ${rail&&mode!=='log' ? 'has-rail' : ''}`}>
          <main className="flow-editor">
            {mode === 'log' ? <ShootLog log={shootLog} id={id} doc={doc} source={source?.synced?source.doc:undefined} user={c.session!.user} connected={c.connected} search={search} onInspect={inspect} onTiming={e=>setTime(e.id)}/> : mode === 'flow' ? (
              <FlowGrid
                cast={cast}
                doc={doc}
                provider={c.provider!}
                undo={c.undo}
                events={filter}
                departments={visible}
                zone={zone}
                date={date}
                scope={scope}
                listId={listId}
                shots={sourceShots}
                selected={selected}
                widths={layout.widths}
                onWidth={(id, v) =>
                  setLayout((l) => ({
                    ...l,
                    widths: { ...l.widths, [id]: v },
                  }))
                }
                onSelect={(id, v) =>
                  setSelected((s) => {
                    const next = new Set(s)
                    if (v) next.add(id)
                    else next.delete(id)
                    return next
                  })
                }
                onAll={(v) =>
                  setSelected(
                    v ? new Set(filter.map((e) => e.id)) : new Set(),
                  )
                }
                onDepartmentInsert={(event, departmentId) => {
                  const id = addEvent(doc, {
                    type: 'department',
                    departmentId,
                    order: event.order + 0.5,
                    timing: 'unscheduled',
                  } as Partial<FlowEvent>)
                  requestAnimationFrame(() =>
                    document
                      .querySelector<HTMLElement>(
                        `[data-event="${id}"] [data-department="${departmentId}"] .pd-text-preview`,
                      )
                      ?.click(),
                  )
                }}
                onDepartmentTime={(event, departmentId) =>
                  setInstructionTime({ event, departmentId })
                }
                onHideDepartment={(id) =>
                  setLayout((l) => ({ ...l, hidden: [...l.hidden, id] }))
                }
                onTime={(e) => setTime(e.id)}
                onInspect={inspect}
                onDelete={setDeleting}
                onInsert={(e, w) => add('custom', e, w)}
              />
            ) : (
              <TimeMap
                onDepartmentTime={(event, departmentId) =>
                  setInstructionTime({ event, departmentId })
                }
                selected={selected}
                onSelect={(e) => setSelected(new Set([e.id]))}
                onShowInFlow={(e) => {
                  setMode('flow')
                  setSelected(new Set([e.id]))
                  requestAnimationFrame(() =>
                    document
                      .querySelector(`[data-event="${e.id}"]`)
                      ?.scrollIntoView({ block: 'nearest' }),
                  )
                }}
                doc={doc}
                events={filter}
                departments={visible}
                zone={zone}
                shots={sourceShots}
                onMove={(event, start, duration) => {
                  if (duration !== undefined && duration !== null) {
                    setTimeSuggestion(duration)
                    setTime(event.id)
                    return
                  }
                  setMove({ event, start })
                }}
                onInspect={(e) => setTime(e.id)}
              />
            )}
          </main>
          {rail && mode!=='log' && (
            <ShotRail
              onAttention={(e) =>
                e.sourceMissing ? inspect(e) : setTime(e.id)
              }
              source={source?.synced ? source.doc : undefined}
              listId={listId}
              events={events}
              scope={scope}
              onClose={() => setRail(false)}
              onConnect={() => setPicker(true)}
              onDisconnect={() => setDisconnect(true)}
              onAdd={(s) => schedule(s)}
              onSelect={(s) => {
                const event = events.find(
                  (e) =>
                    e.shotId === str(s, 'id') && e.sourceListId === listId,
                )
                if (event) {
                  setSelected(new Set([event.id]))
                  document
                    .querySelector(`[data-event="${event.id}"]`)
                    ?.scrollIntoView({
                      block: 'nearest',
                      behavior: 'smooth',
                    })
                }
              }}
            />
          )}
        </div>
        <DragOverlay>
          {dragging && (
            <div className="flow-drag-preview">
              <strong>
                {events.find((e) => e.id === dragging)?.description ||
                  events.find((e) => e.id === dragging)?.reference ||
                  str(
                    sourceShots?.get(dragging.replace('rail:', '')),
                    'number',
                  )}
              </strong>
              <p>
                {events.find((e) => e.id === dragging)?.notes ||
                  str(
                    sourceShots?.get(dragging.replace('rail:', '')),
                    'coverage',
                  )}
              </p>
              {deps.slice(0, 3).map((d) => (
                <span key={d.id}>
                  {String(
                    doc
                      .getMap<Y.Map<unknown>>('instructions')
                      .get(dragging + ':' + d.id)
                      ?.get('text') || '',
                  )}
                </span>
              ))}
            </div>
          )}
        </DragOverlay>
      </DragDropProvider>
      {blocker.state === 'blocked' && (
        <Overlay
          title="Changes are not saved yet"
          onClose={() => blocker.reset()}
          footer={
            <>
              <Button variant="primary" onClick={() => blocker.reset()}>
                Keep editing
              </Button>
              <Button variant="danger" onClick={() => blocker.proceed()}>
                Leave without saving
              </Button>
            </>
          }
        >
          <p>
            Keep this document open to reconnect and save your changes.
          </p>
        </Overlay>
      )}
      {time && events.find((e) => e.id === time) && (
        <TimeEditor
          suggestedDuration={timeSuggestion}
          event={events.find((e) => e.id === time)!}
          zone={zone}
          date={date}
          inherited={duration(
            { ...events.find((e) => e.id === time)!, duration: null, allottedMinutes:null },
            sourceShots?.get(
              events.find((e) => e.id === time)?.shotId || '',
            ),
          )}
          onSharedDuration={
            source
              ? async (value) => {
                  const shot = sourceShots?.get(
                    events.find((e) => e.id === time)?.shotId || '',
                  )
                  if (
                    !shot ||
                    !source.connected ||
                    source.error ||
                    !source.provider
                  )
                    throw Error(
                      'Reconnect the Shot List before changing its shared estimate.',
                    )
                  setDurationBusy(true)
                  try {
                    await new Promise<void>((resolve, reject) => {
                      const p = source.provider!
                      let expected = ''
                      const timer = setTimeout(
                        () =>
                          done(
                            Error(
                              'The source estimate has not been acknowledged. Keep this window open and reconnect.',
                            ),
                          ),
                        15000,
                      )
                      function done(error?: Error) {
                        clearTimeout(timer)
                        p.off('stateless', ack)
                        error ? reject(error) : resolve()
                      }
                      function ack({ payload }: { payload: string }) {
                        void (async () => {
                          const m = JSON.parse(payload)
                          if (m.type === 'persistence-error')
                            return done(
                              Error(
                                'The Shot List could not save this estimate.',
                              ),
                            )
                          if (m.type === 'persisted' && expected) {
                            const current = await crypto.subtle.digest(
                                'SHA-256',
                                Y.encodeSnapshot(
                                  Y.snapshot(source!.doc),
                                ) as BufferSource,
                              ),
                              hash = Array.from(new Uint8Array(current))
                                .map((x) =>
                                  x.toString(16).padStart(2, '0'),
                                )
                                .join('')
                            if (
                              m.digest === expected ||
                              (m.digest === hash &&
                                String(shot!.get('estimatedMinutes')) ===
                                  (value == null ? '' : String(value)))
                            )
                              done()
                          }
                        })().catch(() => {})
                      }
                      p.on('stateless', ack)
                      change(
                        source.doc,
                        shot,
                        'estimatedMinutes',
                        value == null ? '' : String(value),
                        c.session!.user.id,
                      )
                      void crypto.subtle
                        .digest(
                          'SHA-256',
                          Y.encodeSnapshot(
                            Y.snapshot(source!.doc),
                          ) as BufferSource,
                        )
                        .then((b) => {
                          expected = Array.from(new Uint8Array(b))
                            .map((x) => x.toString(16).padStart(2, '0'))
                            .join('')
                          p.sendStateless('persistence-status')
                        })
                        .catch((e) => done(e))
                    })
                  } finally {
                    setDurationBusy(false)
                  }
                }
              : undefined
          }
          onSave={(v) => {
            const e = events.find((e) => e.id === time)!
            if (
              e.type === 'shot' &&
              e.id === events.find((x) => x.type === 'shot')?.id &&
              !v.fixed &&
              v.timing === 'anchor'
            ) {
              doc.transact(() => {
                meta.set('filmingStart', v.clockStart)
                put(doc, 'events', time, {
                  ...v,
                  timing: 'sequence',
                  clockStart: null,
                })
              })
              return
            }
            if (e.type === 'milestone' && v.clockStart != null) {
              const next = events.find(
                  (other) =>
                    other.id !== e.id &&
                    other.minute != null &&
                    other.minute >= v.clockStart!,
                ),
                before = next
                  ? events
                      .filter((x) => x.id !== e.id && x.order < next.order)
                      .slice(-1)[0]
                  : undefined
              v.order = next
                ? ((before?.order ?? next.order - 2048) + next.order) / 2
                : e.order
            }
            put(doc, 'events', time, v)
          }}
          onClose={() => {
            setTime(undefined)
            setTimeSuggestion(undefined)
          }}
        />
      )}
      {inspector && events.find((e) => e.id === inspector.id) && (
        <EventInspector
          key={inspector.id + inspector.tab}
          doc={doc}
          event={events.find((e) => e.id === inspector.id)!}
          provider={c.provider!}
          undo={c.undo}
          user={c.session!.user}
          source={sourceShots?.get(
            events.find((e) => e.id === inspector.id)?.shotId || '',
          )}
          flowId={id}
          sourceDoc={source?.doc}
          cast={cast}
          listId={listId}
          zone={zone}
          initialTab={inspector.tab}
          onClose={() => setInspector(undefined)}
          onRelink={() => {
            setRelink(inspector.id)
            setPicker(true)
          }}
        />
      )}
      {conflict && (
        <Overlay
          title="Resolve fixed-time conflict"
          className="flow-time-dialog"
          onClose={() => setConflict(undefined)}
          footer={
            <>
              <Button onClick={() => setConflict(undefined)}>
                Keep current timing
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const event = events.find(
                      (e) => e.id === conflict.eventId,
                    )!,
                    anchor = events.find(
                      (e) => e.id === conflict.anchorId,
                    )!,
                    next = events.find(
                      (e) => e.order > anchor.order && e.id !== event.id,
                    )
                  put(doc, 'events', event.id, {
                    order:
                      (anchor.order +
                        (next?.order ?? anchor.order + 1024)) /
                      2,
                    timing: 'sequence',
                    clockStart: null,
                    fixed: false,
                  })
                  setConflict(undefined)
                }}
              >
                Move shot after fixed activity
              </Button>
            </>
          }
        >
          <p>
            The fixed activity keeps its clock time. The shot keeps its
            full duration and moves after it; following flexible shots
            recalculate.
          </p>
        </Overlay>
      )}
      {instructionTime && (
        <InstructionTiming
          doc={doc}
          event={instructionTime.event}
          department={
            deps.find((d) => d.id === instructionTime.departmentId)!
          }
          onClose={() => setInstructionTime(undefined)}
        />
      )}
      {newDepartment && (
        <Overlay
          title="Add department"
          onClose={() => setNewDepartment(false)}
          footer={
            <Button
              variant="primary"
              disabled={!departmentName.trim()}
              onClick={() => {
                const id = crypto.randomUUID()
                doc.transact(() => {
                  put(doc, 'departments', id, {
                    name: departmentName.trim(),
                    order: Math.max(0, ...deps.map((d) => d.order)) + 1024,
                    personnel: '',
                  })
                  for (const e of events)
                    put(doc, 'instructions', e.id + ':' + id, {
                      eventId: e.id,
                      departmentId: id,
                      text: '',
                    })
                })
                setNewDepartment(false)
                setDepartmentName('')
              }}
            >
              Add department
            </Button>
          }
        >
          <label className="flow-field">
            Department name
            <input
              data-initial-focus
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              maxLength={100}
            />
          </label>
        </Overlay>
      )}
      {print && (
        <FlowPrint
          title={String(meta.get('name'))}
          date={date}
          onDateChange={(value) => {
            doc.transact(() => {
              for (const e of events) {
                if (
                  e.minute != null &&
                  e.timing === 'anchor' &&
                  doc
                    .getMap<Y.Map<unknown>>('events')
                    .get(e.id)
                    ?.get('clockStart') === undefined
                )
                  put(doc, 'events', e.id, {
                    clockStart: e.minute,
                    timing: 'anchor',
                  })
              }
              meta.set('date', value)
            })
          }}
          id={id}
          departments={deps}
          onClose={() => setPrint(false)}
        />
      )}
      {history && (
        <FlowHistory
          id={id}
          source={source?.doc.toJSON()}
          onClose={() => setHistory(false)}
        />
      )}
      {importing && (
        <FlowImport
          id={id}
          doc={doc}
          date={date}
          zone={zone}
          onClose={() => {
            setImporting(false)
            navigate(`/flows/${id}`, { replace: true })
          }}
        />
      )}
      {picker && (
        <ShotPicker
          selectionLimit={relink ? 1 : undefined}
          onConnectList={
            !listId && !relink
              ? (value) => {
                  meta.set('listId', value)
                  setPicker(false)
                }
              : undefined
          }
          flowContext
          connectedListId={listId || undefined}
          onClose={() => {
            setPicker(false)
            setRelink('')
          }}
          onConfirm={(links) => {
            if (!links.length) {
              setPicker(false)
              return
            }
            if (links.some((l) => l.listId !== links[0].listId)) {
              setError('Choose shots from one Shot List.')
              return
            }
            doc.transact(() => {
              meta.set('listId', links[0].listId)
              if (relink) {
                put(doc, 'events', relink, {
                  shotId: links[0].shotId,
                  sourceListId: links[0].listId,
                  reference: sourceShots?.get(links[0].shotId)?.doc
                    ? displayShot(
                        sourceShots.get(links[0].shotId)!.doc!,
                        sourceShots.get(links[0].shotId)!,
                      )
                    : '',
                  type: 'shot',
                })
              } else
                links.forEach((l) =>
                  addEvent(doc, {
                    type: 'shot',
                    shotId: l.shotId,
                    sourceListId: l.listId,
                    description: '',
                  }),
                )
            })
            setPicker(false)
            setRelink('')
          }}
        />
      )}
      {deleting.length > 0 && (
        <Overlay
          title={`Delete ${deleting.length} selected event${
            deleting.length === 1 ? '' : 's'
          }?`}
          onClose={() => setDeleting([])}
          footer={
            <>
              <Button onClick={() => setDeleting([])}>Cancel</Button>
              <Button icon="trash" variant="danger" onClick={remove}>
                Delete selected
              </Button>
            </>
          }
        >
          <p>
            Only these Flow occurrences are removed. You can restore them
            using the notification. Source shots are unchanged.
          </p>
        </Overlay>
      )}
      {disconnect && (
        <Overlay
          title="Disconnect Shot List?"
          onClose={() => setDisconnect(false)}
          footer={
            <Button
              onClick={() => {
                doc.transact(() => {
                  for (const event of events) {
                    if (event.sourceListId === listId && event.shotId) {
                      const shot = sourceShots?.get(event.shotId)
                      if (shot)
                        put(doc, 'events', event.id, {
                          reference: displayShot(shot.doc!, shot),
                        })
                    }
                  }
                  meta.set('listId', '')
                })
                setDisconnect(false)
              }}
            >
              Disconnect
            </Button>
          }
        >
          <p>
            All Flow events, instructions and historical references remain.
            No source shots are deleted.
          </p>
        </Overlay>
      )}
      {settings && (
        <Overlay
          title="Shoot date"
          onClose={() => setSettings(false)}
          className="flow-time-dialog"
        >
          <DatePicker
            label="Shoot date"
            value={date}
            onChange={(value) => {
              doc.transact(() => {
                for (const e of events) {
                  if (
                    e.minute != null &&
                    e.timing === 'anchor' &&
                    doc
                      .getMap<Y.Map<unknown>>('events')
                      .get(e.id)
                      ?.get('clockStart') === undefined
                  )
                    put(doc, 'events', e.id, {
                      clockStart: e.minute,
                      timing: 'anchor',
                    })
                }
                meta.set('date', value)
              })
            }}
          />
        </Overlay>
      )}
      {move && (
        <Overlay
          title="Preview timing change"
          onClose={() => setMove(undefined)}
          footer={
            <Button
              variant="primary"
              onClick={() => {
                if (move.target) moveEvent(doc, move.event, move.target)
                else
                  put(doc, 'events', move.event.id, {
                    clockStart:
                      (move.event.minute || 0) +
                      (move.start && move.event.start
                        ? (Date.parse(move.start) -
                            Date.parse(move.event.start)) /
                          60000
                        : 0),
                    timing: 'anchor',
                  })
                setMove(undefined)
              }}
            >
              Apply move
            </Button>
          }
        >
          <div className="flow-change-preview">
            {crossingFixed.length > 0 && (
              <p className="flow-warning">
                This interval crosses fixed milestones:{' '}
                {crossingFixed
                  .map(
                    (e) => e.description || e.reference || 'Fixed event',
                  )
                  .join(', ')}
                .
              </p>
            )}
            {overlap.length > 0 && (
              <p className="flow-warning">
                Shared department work overlaps{' '}
                {overlap
                  .map(
                    (e) =>
                      e.description || e.reference || 'another activity',
                  )
                  .join(', ')}
                . Parallel work may be intended; review before applying.
              </p>
            )}
            {move.duration !== undefined && (
              <p>
                Duration:{' '}
                {duration(
                  move.event,
                  sourceShots?.get(move.event.shotId || ''),
                ) ?? 'Unknown'}{' '}
                → {move.duration ?? 'Unknown'} min
              </p>
            )}
            <strong>
              {changing?.description ||
                changing?.reference ||
                'Production event'}
            </strong>
            <p>
              {changing?.start
                ? clockText(changing.minute)
                : 'Unscheduled'}{' '}
              →{' '}
              {move.target?.start || move.start
                ? clockText(
                    (Date.parse((move.target?.start || move.start)!) -
                      Date.parse(scheduleView.base + 'T00:00:00Z')) /
                      60000,
                  )
                : 'Unscheduled'}
            </p>
            {changing?.fixed && (
              <p className="flow-warning">
                This event is fixed. Applying this explicit move changes
                its anchor.
              </p>
            )}
            <p>
              Following flexible activities recalculate. Fixed times and
              the master shot order remain anchored.
            </p>
          </div>
        </Overlay>
      )}
    </div>
  )
}
function locationLink(id: string) {
  const url = new URL(window.location.href)
  url.hash = `/flows/${id}`
  return url.toString()
}
