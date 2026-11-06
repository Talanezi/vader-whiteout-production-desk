import { useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import { flowRequest } from '../../lib/flow/api'
import { clockText, type FlowEvent } from '../../lib/flow/model'
import {
  liveMetrics,
  timingZone,
  type LiveState,
} from '../../../../server/src/flows/live'
import { Button, IconButton } from '../whiteout/Button'
import Menu from '../whiteout/Menu'
import { Overlay } from '../whiteout/Overlay'
import { ErrorNotice } from '../whiteout/Feedback'
import ClockPicker from './ClockPicker'
import PreferredTake from '../shots/PreferredTake'
export default function LiveProgress({
  id,
  doc,
  events,
  shots,
  user,
  connected,
}: {
  id: string
  doc: Y.Doc
  events: FlowEvent[]
  shots?: Y.Map<Y.Map<unknown>>
  user: { id: number; name: string }
  connected: boolean
}) {
  const queueKey = `whiteout:live-pending:${user.id}:${id}`,
    [pending, setPending] = useState<any>(() => {
      try {
        return JSON.parse(localStorage.getItem(queueKey) || 'null')
      } catch {
        return null
      }
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [now, setNow] = useState(Date.now()),
    [collapsed, setCollapsed] = useState(false),
    [choice, setChoice] = useState(''),
    [correction, setCorrection] = useState<any>(),
    [start, setStart] = useState<number | null>(null),
    [end, setEnd] = useState<number | null>(null),
    [reason, setReason] = useState('')
  const calibration = useRef({
      server: Date.now(),
      perf: performance.now(),
    }),
    sending = useRef(false),
    [live, setLive] = useState<LiveState | undefined>(
      doc.getMap('meta').get('liveState') as LiveState,
    )
  const accept = (r: any) => {
    calibration.current = { server: r.serverNow, perf: performance.now() }
    setLive(r.live)
    setNow(r.serverNow)
  }
  useEffect(() => {
    const update = () =>
      setLive(doc.getMap('meta').get('liveState') as LiveState)
    doc.getMap('meta').observe(update)
    const t = setInterval(
      () =>
        setNow(
          calibration.current.server +
            performance.now() -
            calibration.current.perf,
        ),
      1000,
    )
    return () => {
      doc.getMap('meta').unobserve(update)
      clearInterval(t)
    }
  }, [doc])
  async function send(action: any) {
    if (sending.current) return
    sending.current = true
    setBusy(true)
    setError('')
    try {
      const r = await flowRequest(`/${id}/live`, action)
      accept(r)
      localStorage.removeItem(queueKey)
      setPending(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      sending.current = false
      setBusy(false)
    }
  }
  useEffect(() => {
    if (connected)
      flowRequest(`/${id}/live`)
        .then(accept)
        .catch((e) => setError(e.message))
  }, [id, connected])
  // Pending actions keep their stable ID/version and original clock; never silently rebase a conflict.
  useEffect(() => {
    if (connected && pending && !error) void send(pending)
  }, [connected, pending?.id])
  function act(type: string, eventId?: string, extra: any = {}) {
    if (pending) return
    const action = {
      id: crypto.randomUUID(),
      revision: live?.revision || 0,
      type,
      eventId,
      occurredAt:
        calibration.current.server +
        performance.now() -
        calibration.current.perf,
      ...extra,
    }
    localStorage.setItem(queueKey, JSON.stringify(action))
    setPending(action)
    if (connected) void send(action)
  }
  const metrics = liveMetrics(live, now),
    active = metrics.active,
    next = events.find((e) => e.type === 'shot' && !live?.blocks[e.id]),
    target = events.find((e) => e.id === choice) || next,
    zone = timingZone(
      metrics.elapsedSeconds,
      active?.estimate ?? null,
      active?.allotted ?? null,
    ),
    completed = Object.values(live?.blocks || {}),
    variance = (n: number | null, label: string) =>
      n == null
        ? `${label} unavailable`
        : `${Math.round(Math.abs(n) / 60)} min ${n > 0 ? 'behind' : 'ahead'} ${label}`
  return (
    <section
      className={`flow-live-strip live-${zone.zone}`}
      aria-label="Live Progress"
    >
      <div className="flow-live-heading">
        <button
          className="flow-live-title"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((v) => !v)}
        >
          <span className={active ? 'flow-live-dot' : ''} />
          <strong>{active ? active.label : 'Live Progress'}</strong>
          {active && (
            <time>
              {Math.floor((metrics.elapsedSeconds || 0) / 60)}:
              {String(
                Math.floor((metrics.elapsedSeconds || 0) % 60),
              ).padStart(2, '0')}
            </time>
          )}
        </button>
        <small>
          {variance(metrics.scheduleSeconds, 'schedule')} ·{' '}
          {metrics.completedBudgeted
            ? `${Math.round(Math.abs(metrics.budgetSeconds) / 60)} min ${metrics.budgetSeconds > 0 ? 'over' : 'saved against'} shot budgets`
            : 'No completed shot budgets'}
        </small>
        <IconButton
          name={collapsed ? 'down' : 'up'}
          label={
            collapsed ? 'Expand Live Progress' : 'Collapse Live Progress'
          }
          onClick={() => setCollapsed((v) => !v)}
        />
      </div>
      {!collapsed && (
        <>
          <div className="flow-live-controls">
            {active ? (
              <>
                <span>
                  <small>Actual start</small>
                  {clockText(active.startMinute)}
                </span>
                <span>
                  <small>DP estimate</small>
                  {active.estimate ?? '—'} min
                </span>
                <span>
                  <small>AD allotted</small>
                  {active.allotted ?? '—'} min
                </span>
                <span className="flow-live-zone">
                  {zone.label}
                  {active.allotted != null && (
                    <small>
                      {Math.ceil(
                        Math.abs(
                          active.allotted * 60 -
                            (metrics.elapsedSeconds || 0),
                        ) / 60,
                      )}{' '}
                      min{' '}
                      {(metrics.elapsedSeconds || 0) > active.allotted * 60
                        ? 'over'
                        : 'remaining'}
                    </small>
                  )}
                </span>
                <Button
                  icon="check"
                  disabled={!!pending || busy}
                  onClick={() => act('finish', active.eventId)}
                >
                  Finish
                </Button>
                {next && (
                  <Button
                    variant="primary"
                    icon="play"
                    disabled={!!pending || busy}
                    onClick={() => act('advance', next.id)}
                  >
                    Start next shot
                  </Button>
                )}
              </>
            ) : (
              <>
                <Menu
                  label={
                    target?.label ||
                    target?.description ||
                    'Choose activity'
                  }
                  ariaLabel="Live activity"
                  value={target?.id}
                  onChange={setChoice}
                  items={events
                    .filter(
                      (e) =>
                        !live?.blocks[e.id] && e.type !== 'department',
                    )
                    .map((e) => ({
                      value: e.id,
                      label:
                        e.label ||
                        e.description ||
                        e.category ||
                        'Activity',
                    }))}
                />
                <Button
                  variant="primary"
                  icon="play"
                  disabled={!target || !!pending || busy}
                  onClick={() => act('start', target!.id)}
                >
                  Start
                </Button>
                <Button
                  disabled={!target || !!pending || busy}
                  onClick={() => act('skip', target!.id)}
                >
                  Skip
                </Button>
              </>
            )}
            {completed.length > 0 && (
              <Menu
                compact
                icon="more"
                label="Production log actions"
                items={[
                  ...completed
                    .filter((b) => b.status !== 'skipped')
                    .map((b) => ({
                      value: b.eventId,
                      label: 'Correct ' + b.label,
                      onSelect: () => {
                        setCorrection(b)
                        setStart(b.startMinute ?? null)
                        setEnd(b.endMinute ?? null)
                        setReason('')
                      },
                    })),
                  {
                    value: 'undo',
                    label: 'Undo last production action',
                    disabled: !!pending,
                    onSelect: () => act('undo'),
                  },
                ]}
              />
            )}
            {active &&
              shots?.get(
                events.find((e) => e.id === active.eventId)?.shotId || '',
              ) && (
                <PreferredTake
                  shot={shots.get(
                    events.find((e) => e.id === active.eventId)!.shotId!,
                  )!}
                  user={user}
                  context={{
                    flowId: id,
                    eventId: active.eventId,
                    date: String(doc.getMap('meta').get('date') || ''),
                  }}
                />
              )}
          </div>
          {pending && (
            <div className="flow-live-pending" role="status">
              {connected
                ? 'Awaiting durable confirmation'
                : 'Pending offline · recorded on this device'}
              {error && (
                <>
                  <Button onClick={() => void send(pending)}>
                    Retry same action
                  </Button>
                  <Button
                    onClick={() => {
                      localStorage.removeItem(queueKey)
                      setPending(null)
                      setError('')
                      void flowRequest(`/${id}/live`).then(accept)
                    }}
                  >
                    Review latest state
                  </Button>
                </>
              )}
            </div>
          )}
          {error && <ErrorNotice>{error}</ErrorNotice>}
        </>
      )}
      {correction && (
        <Overlay
          title={`Correct ${correction.label}`}
          onClose={() => setCorrection(undefined)}
          footer={
            <Button
              variant="primary"
              disabled={!reason.trim() || start == null}
              onClick={() => {
                act('correct', correction.eventId, {
                  startMinute: start,
                  ...(end == null ? {} : { endMinute: end }),
                  reason,
                })
                setCorrection(undefined)
              }}
            >
              Save correction
            </Button>
          }
        >
          <div className="flow-form">
            <ClockPicker
              label="Actual start"
              value={start}
              onChange={setStart}
            />
            {correction.status === 'completed' && (
              <ClockPicker
                label="Actual finish"
                value={end}
                onChange={setEnd}
              />
            )}
            <label>
              Reason
              <input
                aria-label="Correction reason"
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          </div>
        </Overlay>
      )}
    </section>
  )
}
