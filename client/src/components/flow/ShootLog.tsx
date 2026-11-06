import { useState } from 'react'
import type * as Y from 'yjs'
import {
  actualMinute,
  ledgerMetrics,
} from '../../../../server/src/flows/live'
import { clockText, type FlowEvent } from '../../lib/flow/model'
import type { ProductionLog } from '../../lib/flow/useShootLog'
import { Button, IconButton } from '../whiteout/Button'
import Icon from '../whiteout/Icon'
import Menu from '../whiteout/Menu'
import { ErrorNotice } from '../whiteout/Feedback'
import PreferredTake from '../shots/PreferredTake'
import TimestampEntry from './TimestampEntry'
function Variance({ points }: { points: any[] }) {
  if (!points.length)
    return (
      <p className="shoot-log-empty">
        Record an actual timestamp to see production variance.
      </p>
    )
  const min = Math.min(0, ...points.map((p) => p.variance / 60)),
    max = Math.max(1, ...points.map((p) => p.variance / 60)),
    y = (v: number) => 85 - ((v - min) / (max - min)) * 65,
    x = (i: number) => 25 + (i * 550) / Math.max(1, points.length - 1)
  return (
    <svg
      viewBox="0 0 600 110"
      role="img"
      aria-label="Recorded schedule variance across actual checkpoints"
    >
      <line
        x1="25"
        x2="575"
        y1={y(0)}
        y2={y(0)}
        stroke="#526b7b"
        strokeDasharray="3 4"
      />
      <polyline
        points={points
          .map((p, i) => `${x(i)},${y(p.variance / 60)}`)
          .join(' ')}
        fill="none"
        stroke="#85d4f5"
        strokeWidth="2"
      />
      {points.map((p, i) => (
        <g key={p.id}>
          <circle cx={x(i)} cy={y(p.variance / 60)} r="3" fill="#a2e4ff">
            <title>
              {p.label} · {Math.abs(p.variance / 60).toFixed(1)} min{' '}
              {p.variance > 0 ? 'behind' : 'ahead'}
            </title>
          </circle>
          {(i === 0 || i === points.length - 1) && (
            <text
              x={x(i)}
              y="105"
              textAnchor={i ? 'end' : 'start'}
              fill="#92adbd"
              fontSize="9"
            >
              {p.label}
            </text>
          )}
        </g>
      ))}
      <text x="3" y="12" fill="#92adbd" fontSize="9">
        {Math.round(max)} min behind
      </text>
    </svg>
  )
}
const variance = (n: number | null, target: string) =>
  n == null
    ? 'Not calculated'
    : `${Math.abs(n / 60).toFixed(Math.abs(n) < 60 ? 1 : 0)} min ${n === 0 ? 'on ' + target : n > 0 ? 'over ' + target : 'saved against ' + target}`
export default function ShootLog({
  id,
  doc,
  source,
  user,
  connected,
  log,
  search,
  onInspect,
  onTiming,
}: {
  id: string
  doc: Y.Doc
  source?: Y.Doc
  user: { id: number; name: string }
  log: ProductionLog
  connected: boolean
  search: string
  onInspect: (e: FlowEvent, tab?: string) => void
  onTiming: (e: FlowEvent) => void
}) {
  const state = {
      ...doc.toJSON(),
      meta: { ...doc.getMap('meta').toJSON(), liveState: log.live },
    },
    metrics = ledgerMetrics(state, source?.toJSON()),
    [finish, setFinish] = useState(''),
    [localError, setLocalError] = useState('')
  const rows = metrics.rows.filter((r: any) =>
    [r.event.label, r.coverage, r.event.description]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase()),
  )
  function stamp(
    r: any,
    field: 'start' | 'end',
    minute: number | null,
    useCurrent = false,
    guard?: any,
  ) {
    try {
      log.enqueue('stamp', r.event.id, {
        field,
        minute,
        useCurrent,
        ...(guard || {
          expectedStartedAt: r.block?.startedAt ?? null,
          expectedEndedAt: r.block?.endedAt ?? null,
        }),
      })
      setLocalError('')
    } catch (e) {
      setLocalError((e as Error).message)
      throw e
    }
  }
  function entry(r: any, field: 'start' | 'end' = 'start') {
    const action = log.queue.find((a) => a.eventId === r.event.id),
      pending = !!action
    return (
      <TimestampEntry
        key={r.event.id + field}
        label={`${field === 'start' ? 'Actual start' : 'Confirmed finish'} ${r.event.label || r.event.description || 'activity'}`}
        planned={
          field === 'start'
            ? r.event.minute
            : (r.block?.plannedEnd ?? null)
        }
        value={
          field === 'start'
            ? (r.block?.startMinute ?? null)
            : (r.block?.endMinute ?? null)
        }
        pending={pending}
        precondition={{
          expectedStartedAt: r.block?.startedAt ?? null,
          expectedEndedAt: r.block?.endedAt ?? null,
        }}
        onSave={(minute, now, guard) =>
          stamp(r, field, minute, now, guard)
        }
      />
    )
  }
  function take(r: any) {
    const shot = source
      ?.getMap<Y.Map<unknown>>('shots')
      .get(r.event.shotId)
    return shot && !shot.get('deleted') ? (
      <PreferredTake
        shot={shot}
        user={user}
        context={{
          flowId: id,
          eventId: r.event.id,
          date: String(doc.getMap('meta').get('date') || ''),
        }}
      />
    ) : (
      <span className="shoot-muted">—</span>
    )
  }
  function actions(r: any) {
    return (
      <Menu
        compact
        icon="more"
        label={'Log actions for ' + (r.event.label || r.event.description)}
        items={[
          {
            value: 'finish',
            label: 'Confirm actual finish',
            disabled: r.block?.startedAt == null,
            onSelect: () =>
              setFinish(finish === r.event.id ? '' : r.event.id),
          },
          {
            value: 'skip',
            label: 'Mark skipped',
            disabled:
              r.block?.startedAt != null || r.block?.status === 'skipped',
            onSelect: () => {
              try {
                log.enqueue('skip', r.event.id)
              } catch (e) {
                setLocalError((e as Error).message)
              }
            },
          },
          {
            value: 'details',
            label: 'Details and correction history',
            onSelect: () => onInspect(r.event, 'log'),
          },
        ]}
      />
    )
  }
  return (
    <section className="shoot-log" aria-label="Shoot Log">
      <div className="shoot-log-summary">
        <div>
          <Icon name="check" />
          <strong>
            {metrics.recorded} / {metrics.total}
          </strong>
          <small>shot starts recorded</small>
        </div>
        <div>
          <strong>
            {metrics.scheduleSeconds == null
              ? 'No actual checkpoint'
              : `${Math.abs(metrics.scheduleSeconds / 60).toFixed(Math.abs(metrics.scheduleSeconds) < 60 ? 1 : 0)} min ${metrics.scheduleSeconds === 0 ? 'on schedule' : metrics.scheduleSeconds > 0 ? 'behind schedule' : 'ahead of schedule'}`}
          </strong>
          <small>Schedule clock</small>
        </div>
        <div>
          <strong>
            {variance(metrics.budgetSeconds, 'shot budgets')}
          </strong>
          <small>
            {metrics.inferred
              ? `${metrics.inferred} start-to-start · ${metrics.confirmed} confirmed`
              : 'Confirmed shot budgets'}
          </small>
        </div>
        <div className={metrics.review ? 'shoot-review' : ''}>
          <strong>
            {metrics.review
              ? metrics.review + ' need review'
              : 'No inconsistencies'}
          </strong>
          <small>
            {log.queue.length
              ? `${log.queue.length} pending ${connected ? 'confirmation' : 'offline'}`
              : connected
                ? 'Saved'
                : 'Offline · saved records'}
          </small>
        </div>
        <IconButton
          name="undo"
          label="Undo last log entry"
          disabled={!log.live?.audit.length || !!log.queue.length}
          onClick={() => {
            try {
              log.enqueue('undo')
            } catch (e) {
              setLocalError((e as Error).message)
            }
          }}
        />
      </div>
      <details className="shoot-variance">
        <summary>
          <Icon name="sort" />
          Planned versus actual
        </summary>
        <Variance points={metrics.checkpoints} />
      </details>
      {(log.error || localError) && (
        <ErrorNotice>{localError || log.error}</ErrorNotice>
      )}
      {log.queue.length > 0 && (
        <div className="shoot-log-pending" role="status">
          <Icon name={connected ? 'retry' : 'alert'} />
          {log.queue.length} {log.queue.length === 1 ? 'entry' : 'entries'}{' '}
          {connected
            ? 'awaiting durable confirmation'
            : 'stored on this device · pending reconnection'}
          {log.error && (
            <>
              <Button onClick={log.retry}>Retry pending entries</Button>
              <Button disabled={log.busy} onClick={log.discard}>
                Discard pending entries
              </Button>
            </>
          )}
        </div>
      )}
      <div className="shoot-log-table-scroll">
        <table
          className="shoot-log-table"
          aria-label="Actual production timestamp ledger"
        >
          <colgroup>
            {[265, 95, 80, 80, 150, 155, 165, 155, 40].map((w, i) => (
              <col key={i} style={{ width: w }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {[
                'Shot / Action',
                'Planned start',
                'DP est.',
                'AD allotted',
                'Actual start',
                'Interval',
                'Performance',
                'Preferred take',
                '',
              ].map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr
                key={r.event.id}
                data-log-event={r.event.id}
                className={r.event.type === 'shot' ? '' : 'shoot-special'}
              >
                <td>
                  <button
                    className="shoot-shot-link"
                    onClick={() => onInspect(r.event, 'log')}
                  >
                    {r.event.label ||
                      r.event.description ||
                      r.event.category ||
                      'Activity'}
                  </button>
                  <p>{r.coverage || r.event.description}</p>
                </td>
                <td>
                  <time>{clockText(r.event.minute)}</time>
                  {r.event.minute >= 1440 && <small>Next day</small>}
                </td>
                <td>{r.estimate == null ? '—' : r.estimate + ' min'}</td>
                <td>
                  <button
                    className="shoot-budget"
                    onClick={() => onTiming(r.event)}
                  >
                    {r.allotted == null ? '—' : r.allotted + ' min'}
                  </button>
                </td>
                <td>{entry(r)}</td>
                <td>
                  {r.seconds == null
                    ? '—'
                    : (r.seconds / 60).toFixed(1) + ' min'}
                  <small>{r.kind || 'Uncalculated'}</small>
                  {finish === r.event.id && entry(r, 'end')}
                </td>
                <td>
                  <span
                    className={`shoot-performance is-${r.performance.zone}`}
                  >
                    <i />
                    {r.performance.label}
                  </span>
                  {r.issue && (
                    <small className="shoot-review">{r.issue}</small>
                  )}
                  {r.performance.zone === 'inconsistent' && (
                    <button
                      className="shoot-subtle"
                      onClick={() => onTiming(r.event)}
                    >
                      Adjust allotment
                    </button>
                  )}
                </td>
                <td>{r.event.type === 'shot' ? take(r) : '—'}</td>
                <td>{actions(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="shoot-log-cards">
        {rows.map((r: any) => (
          <article
            key={r.event.id}
            data-log-card={r.event.id}
            className={`shoot-log-card ${r.event.type === 'shot' ? '' : 'shoot-special'}`}
          >
            <header>
              <button
                className="shoot-shot-link"
                onClick={() => onInspect(r.event, 'log')}
              >
                {r.event.label ||
                  r.event.description ||
                  r.event.category ||
                  'Activity'}
              </button>
              {actions(r)}
            </header>
            <p>{r.coverage || r.event.description}</p>
            <div className="shoot-card-plan">
              <span>
                Planned <strong>{clockText(r.event.minute)}</strong>
              </span>
              <span>
                DP <strong>{r.estimate ?? '—'} min</strong>
              </span>
              <span>
                AD{' '}
                <button
                  className="shoot-budget"
                  onClick={() => onTiming(r.event)}
                >
                  {r.allotted ?? '—'} min
                </button>
              </span>
            </div>
            {entry(r)}
            <div className="shoot-card-performance">
              <span
                className={`shoot-performance is-${r.performance.zone}`}
              >
                <i />
                {r.performance.label}
              </span>
              {r.seconds != null && (
                <small>
                  {(r.seconds / 60).toFixed(1)} min · {r.kind}
                </small>
              )}
            </div>
            {r.issue && <small className="shoot-review">{r.issue}</small>}
            {r.performance.zone === 'inconsistent' && (
              <button
                className="shoot-subtle"
                onClick={() => onTiming(r.event)}
              >
                Adjust allotment
              </button>
            )}
            {finish === r.event.id && entry(r, 'end')}
            {r.event.type === 'shot' && <footer>{take(r)}</footer>}
          </article>
        ))}
      </div>
      {!rows.length && (
        <p className="shoot-log-empty">
          {search
            ? 'No matching activities'
            : 'Add shots or activities in Department Flow to build the Shoot Log.'}
        </p>
      )}
    </section>
  )
}
