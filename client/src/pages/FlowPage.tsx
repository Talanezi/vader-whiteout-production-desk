import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import * as Y from 'yjs'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { useFlowCollaboration } from '../lib/flow/useFlowCollaboration'
import { useShotCollaboration } from '../lib/useShotCollaboration'
import { flowRequest, flowFetch } from '../lib/flow/api'
import { getAuthToken } from '../lib/api'
import {
  put,
  addEvent,
  orderedEvents,
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
import Departments from '../components/flow/Departments'
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
  if (!getAuthToken() || c.error === 'UNAUTHORIZED') return <SessionState />
  if (!c.synced || !c.provider || !c.session)
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
    <Connected key={listId} c={c} id={id} listId={listId} />
  ) : (
    <Workspace c={c} id={id} />
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
  const doc = c.doc,
    meta = doc.getMap('meta'),
    listId = String(meta.get('listId') || ''),
    zone = String(meta.get('zone') || 'America/Los_Angeles'),
    date = String(meta.get('date') || ''),
    events = orderedEvents(doc),
    deps = departments(doc),
    toast = useToast(),
    navigate = useNavigate(),
    location = useLocation()
  const [mode, setMode] = useState('flow'),
    [rail, setRail] = useState(true),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState(new Set<string>()),
    [inspector, setInspector] = useState<{ id: string; tab: string }>(),
    [time, setTime] = useState<string>(),
    [config, setConfig] = useState(false),
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
    [shift, setShift] = useState(false),
    [shiftMinutes, setShiftMinutes] = useState('15')
  const key = `whiteout:flow:${id}:layout`,
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
    dragStart = useRef<string[]>([])
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(layout))
    } catch {}
  }, [layout, key])
  useEffect(() => {
    setSelected(
      (v) => new Set([...v].filter((id) => events.some((e) => e.id === id))),
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
  function add(type: FlowEvent['type'], after?: FlowEvent, where = 'after') {
    const id = addEvent(doc, {
      type,
      description: type === 'milestone' ? 'Shared milestone' : '',
      start: after?.start || null,
      order: after
        ? after.order + (where === 'before' ? -1 : 1)
        : Math.max(0, ...events.map((e) => e.order)) + 1024,
    })
    setInspector({ id, tab: 'details' })
  }
  function schedule(s: Y.Map<unknown>, target?: FlowEvent) {
    const sid = str(s, 'id'),
      id = addEvent(doc, {
        type: 'shot',
        shotId: sid,
        sourceListId: listId,
        reference: str(s, 'number'),
        description: '',
        start: target?.start || null,
        order: target
          ? target.order - 0.5
          : Math.max(0, ...events.map((e) => e.order)) + 1024,
      })
    setSelected(new Set([id]))
  }
  function remove() {
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
            ids.forEach((id) => put(doc, 'events', id, { deletedAt: null })),
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
  const changing = move?.event,
    shiftBase =
      events.find((e) => selected.has(e.id) && e.start) ||
      events.find((e) => e.start),
    shiftAmount = Number(shiftMinutes),
    shifted = shiftBase
      ? events.filter(
          (e) =>
            e.start &&
            Date.parse(e.start) >= Date.parse(shiftBase.start!) &&
            !e.fixed,
        )
      : []
  return (
    <div className="flow-workspace">
      <header className="flow-document-header">
        <div>
          <div className="flow-breadcrumb">
            <button onClick={() => navigate('/flows')}>Flow of the Day</button>
            <span>{date || 'Date unconfirmed'}</span>
          </div>
          <h1>{String(meta.get('name'))}</h1>
        </div>
        <div className="flow-document-actions">
          <span className="flow-save" role="status">
            {!c.saved && <DotsLoader small />}
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
                (p, i, a) =>
                  p.user && a.findIndex((v) => v.user?.id === p.user?.id) === i,
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
                label: 'Production date and timezone',
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
      <div className="flow-toolbar">
        <SearchField
          label="Search events"
          placeholder="Search the day…"
          value={search}
          onChange={setSearch}
        />
        <div className="flow-segments" aria-label="Flow view">
          <button
            aria-pressed={mode === 'flow'}
            onClick={() => setMode('flow')}
          >
            <Icon name="columns" />
            Department Flow
          </button>
          <button aria-pressed={mode === 'map'} onClick={() => setMode('map')}>
            <Icon name="calendar" />
            Time Map
          </button>
        </div>
        <div className="flow-toolbar-actions">
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
          <Menu
            label="Add event"
            icon="plus"
            items={[
              {
                value: 'shot',
                label: 'Schedule shots',
                onSelect: () => {
                  setRail(true)
                  if (!listId) setPicker(true)
                },
              },
              {
                value: 'milestone',
                label: 'Shared milestone',
                onSelect: () => add('milestone'),
              },
              {
                value: 'department',
                label: 'Department activity',
                onSelect: () => add('department'),
              },
              {
                value: 'custom',
                label: 'Custom action',
                onSelect: () => add('custom'),
              },
            ]}
          />
          <Menu
            label="Layout"
            icon="columns"
            items={[
              {
                value: 'departments',
                label: 'Departments and layout',
                onSelect: () => setConfig(true),
              },
              {
                value: 'shift',
                label: 'Shift following activities',
                onSelect: () => setShift(true),
              },
            ]}
          />
          <Button
            icon={rail ? 'collapse' : 'shots'}
            aria-pressed={rail}
            onClick={() => setRail((v) => !v)}
          >
            Shot Rail
          </Button>
        </div>
      </div>
      {selected.size > 0 && (
        <div className="flow-selection">
          <strong>{selected.size} selected</strong>
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
          dragStart.current = filter.map((e) => e.id)
          setDragging(String(e.operation.source?.id || ''))
        }}
        onDragEnd={(e) => {
          const from = String(e.operation.source?.id || ''),
            to = String(e.operation.target?.id || '')
          setDragging('')
          if (e.canceled || from === to || !to) return
          const target = events.find((v) => v.id === to)
          if (!target) return
          if (from.startsWith('rail:')) {
            const shot = sourceShots?.get(from.slice(5))
            if (shot) schedule(shot, target)
            return
          }
          const event = events.find((v) => v.id === from)
          if (!event) return
          if (event.start || target.start) setMove({ event, target })
          else moveEvent(doc, event, target)
        }}
      >
        <div className={`flow-content ${rail ? 'has-rail' : ''}`}>
          <main className="flow-editor">
            {mode === 'flow' ? (
              <FlowGrid
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
                  setLayout((l) => ({ ...l, widths: { ...l.widths, [id]: v } }))
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
                  setSelected(v ? new Set(filter.map((e) => e.id)) : new Set())
                }
                onTime={(e) => setTime(e.id)}
                onInspect={inspect}
                onDelete={setDeleting}
                onInsert={(e, w) => add('custom', e, w)}
              />
            ) : (
              <TimeMap
                doc={doc}
                events={filter}
                departments={visible}
                zone={zone}
                shots={sourceShots}
                onMove={(event, start, duration) =>
                  setMove({ event, start, duration })
                }
                onInspect={(e) => setTime(e.id)}
              />
            )}
          </main>
          {rail && (
            <ShotRail
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
                  (e) => e.shotId === str(s, 'id') && e.sourceListId === listId,
                )
                if (event) {
                  setSelected(new Set([event.id]))
                  document
                    .querySelector(`[data-event="${event.id}"]`)
                    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
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
      {time && events.find((e) => e.id === time) && (
        <TimeEditor
          event={events.find((e) => e.id === time)!}
          zone={zone}
          date={date}
          inherited={duration(
            { ...events.find((e) => e.id === time)!, duration: null },
            sourceShots?.get(events.find((e) => e.id === time)?.shotId || ''),
          )}
          onSave={(v) => put(doc, 'events', time, v)}
          onClose={() => setTime(undefined)}
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
          sourceDoc={source?.doc}
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
      {config && (
        <Departments
          doc={doc}
          hidden={layout.hidden}
          onHidden={(hidden) => setLayout((l) => ({ ...l, hidden }))}
          onClose={() => setConfig(false)}
        />
      )}
      {print && (
        <FlowPrint id={id} departments={deps} onClose={() => setPrint(false)} />
      )}
      {history && <FlowHistory id={id} onClose={() => setHistory(false)} />}
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
          title={`Delete ${deleting.length} selected event${deleting.length === 1 ? '' : 's'}?`}
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
            Only these Flow occurrences are removed. You can restore them using
            the notification. Source shots are unchanged.
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
                meta.set('listId', '')
                setDisconnect(false)
              }}
            >
              Disconnect
            </Button>
          }
        >
          <p>
            All Flow events, instructions and historical references remain. No
            source shots are deleted.
          </p>
        </Overlay>
      )}
      {settings && (
        <Overlay
          title="Production day"
          onClose={() => setSettings(false)}
          className="flow-settings"
        >
          <div className="flow-form">
            <label>
              Production date
              <input
                type="date"
                value={date}
                onChange={(e) => meta.set('date', e.target.value)}
              />
            </label>
            <label>
              Production timezone
              <input
                defaultValue={zone}
                onBlur={(e) => {
                  try {
                    new Intl.DateTimeFormat('en', {
                      timeZone: e.target.value,
                    }).format()
                    meta.set('zone', e.target.value)
                  } catch {
                    setError('Choose a valid named timezone.')
                  }
                }}
              />
            </label>
            <label>
              Status
              <Menu
                label={String(meta.get('status') || 'draft')}
                value={String(meta.get('status') || 'draft')}
                onChange={(v) => meta.set('status', v)}
                items={['draft', 'ready', 'issued'].map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </label>
            <p className="flow-muted">
              Changing the timezone changes display only; scheduled instants
              remain intact. Issued status does not send or publish a document.
            </p>
          </div>
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
                    start: move.start,
                    duration: move.duration,
                  })
                setMove(undefined)
              }}
            >
              Apply move
            </Button>
          }
        >
          <div className="flow-change-preview">
            <strong>
              {changing?.description ||
                changing?.reference ||
                'Production event'}
            </strong>
            <p>
              {changing?.start
                ? localParts(changing.start, zone)
                : 'Unscheduled'}{' '}
              →{' '}
              {move.target?.start || move.start
                ? localParts((move.target?.start || move.start)!, zone)
                : 'Unscheduled'}
            </p>
            {changing?.fixed && (
              <p className="flow-warning">
                This event is fixed. Applying this explicit move changes its
                anchor.
              </p>
            )}
            <p>
              Only this occurrence changes. Other activities and the master shot
              order are preserved.
            </p>
          </div>
        </Overlay>
      )}
      {shift && (
        <Overlay
          title="Shift following activities"
          onClose={() => setShift(false)}
          footer={
            <Button
              variant="primary"
              disabled={
                !Number.isFinite(shiftAmount) ||
                Math.abs(shiftAmount) > 1440 ||
                !shifted.length
              }
              onClick={() => {
                doc.transact(() =>
                  shifted.forEach((e) =>
                    put(doc, 'events', e.id, {
                      start: new Date(
                        Date.parse(e.start!) + shiftAmount * 60000,
                      ).toISOString(),
                    }),
                  ),
                )
                setShift(false)
              }}
            >
              Shift {shifted.length} activities
            </Button>
          }
        >
          <label className="flow-field">
            Minutes · positive or negative
            <input
              value={shiftMinutes}
              onChange={(e) => setShiftMinutes(e.target.value)}
            />
          </label>
          <p className="flow-muted">
            From the first selected timed event, or the first timed event. Fixed
            milestones stay anchored.
          </p>
          <div className="flow-shift-preview">
            {shifted.map((e) => (
              <p key={e.id}>
                <strong>
                  {e.description || e.reference || 'Department activity'}
                </strong>
                <span>
                  {localParts(e.start!, zone)} →{' '}
                  {Number.isFinite(shiftAmount)
                    ? localParts(
                        new Date(
                          Date.parse(e.start!) + shiftAmount * 60000,
                        ).toISOString(),
                        zone,
                      )
                    : 'Invalid offset'}
                </span>
              </p>
            ))}
            {events
              .filter((e) => e.fixed && e.start)
              .map((e) => (
                <p key={e.id}>
                  <strong>{e.description}</strong>
                  <span>Fixed · {localParts(e.start!, zone)}</span>
                </p>
              ))}
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
