import { scheduleState, clockText, put } from '../../lib/flow/model'
import { useState, useRef, useEffect } from 'react'
import type * as Y from 'yjs'
import { Button, IconButton } from '../whiteout/Button'
import { hasShotNumberConflict } from '../../lib/shotDocument'
import {
  duration,
  type FlowEvent,
  type Department,
} from '../../lib/flow/model'
export default function TimeMap({
  doc,
  events,
  departments,
  zone,
  shots,
  onMove,
  onInspect,
  selected,
  onSelect,
  onShowInFlow,
  onDepartmentTime,
}: {
  onDepartmentTime: (event: FlowEvent, departmentId: string) => void
  doc: Y.Doc
  events: FlowEvent[]
  departments: Department[]
  zone: string
  shots?: Y.Map<Y.Map<unknown>>
  onMove: (
    e: FlowEvent,
    start: string,
    duration: number | null | undefined,
  ) => void
  onInspect: (e: FlowEvent) => void
  selected: Set<string>
  onSelect: (e: FlowEvent) => void
  onShowInFlow: (e: FlowEvent) => void
}) {
  const host = useRef<HTMLDivElement>(null),
    [available, setAvailable] = useState(900)
  useEffect(() => {
    const node = host.current
    if (!node) return
    const o = new ResizeObserver(() =>
      setAvailable(Math.max(200, node.clientWidth - 150)),
    )
    o.observe(node)
    return () => o.disconnect()
  }, [])
  const [zoom, setZoom] = useState(4),
    [drag, setDrag] = useState<{
      id: string
      delta: number
      resize: boolean
    }>()
  function moveBlock(
    e: FlowEvent,
    start: string,
    duration: number | null | undefined,
  ) {
    const i = (e as any).instructionKey
    if (!i) return onMove(e, start, duration)
    const record = doc.getMap<Y.Map<unknown>>('instructions').get(i)!,
      delta = (Date.parse(start) - Date.parse(e.start!)) / 60000
    put(
      doc,
      'instructions',
      i,
      duration !== undefined
        ? { duration }
        : record.get('timing') === 'relative'
        ? {
            offsetMinutes:
              Number(record.get('offsetMinutes') || 0) + delta,
          }
        : { timing: 'anchor', clockStart: (e.minute || 0) + delta },
    )
  }
  function inspectBlock(e: FlowEvent) {
    const k = e as any
    k.instructionKey
      ? onDepartmentTime(
          events.find((v) => v.id === k.parentId)!,
          k.departmentId,
        )
      : onInspect(e)
  }
  function blockLabel(e: FlowEvent) {
    if (e.type !== 'shot')
      return e.description || e.reference || 'Department activity'
    const shot = shots?.get(e.shotId || ''),
      conflict = shot?.doc && hasShotNumberConflict(shot.doc, shot)
    return [
      e.label || e.reference || 'Shot unavailable',
      conflict ? '[' + e.shotId?.slice(0, 8) + ']' : '',
      e.description,
    ]
      .filter(Boolean)
      .join(' · ')
  }
  const resolved = scheduleState(doc, shots?.doc || undefined),
    parentById = new Map(events.map((e) => [e.id, e])),
    baseTime = Date.parse(resolved.base + 'T00:00:00Z'),
    timed = events.filter((e) => e.start),
    ranges = [
      ...timed.map((e) => ({
        minute: (Date.parse(e.start!) - baseTime) / 60000,
        duration: duration(e, shots?.get(e.shotId || '')),
      })),
      ...resolved.instructions.filter(
        (i: any) => i.minute != null && parentById.has(i.eventId),
      ),
    ],
    first = ranges.length
      ? baseTime +
        Math.floor(Math.min(...ranges.map((e: any) => e.minute)) / 60) *
          3600000
      : baseTime,
    last = ranges.length
      ? baseTime +
        Math.max(...ranges.map((e: any) => e.minute + (e.duration || 0))) *
          60000 +
        1800000
      : first + 3600000,
    width = Math.max(700, ((last - first) / 60000) * zoom),
    lanes = [{ id: 'production', name: 'Production' }, ...departments]
  return (
    <div ref={host} className="flow-time-map">
      <div className="flow-map-controls flow-map-toolbar">
        <div className="flow-map-zoom">
          <IconButton
            name="plus"
            label="Zoom in"
            onClick={() => setZoom((v) => Math.min(12, v * 1.25))}
          />
          <small>{Math.round(zoom * 30)} px / 30 min</small>
          <IconButton
            name="minus"
            label="Zoom out"
            onClick={() => setZoom((v) => Math.max(0.15, v / 1.25))}
          />
        </div>
        <Button
          icon="expand"
          onClick={() =>
            setZoom(
              Math.max(
                0.15,
                available / Math.max(60, (last - first) / 60000),
              ),
            )
          }
        >
          Fit day
        </Button>
        {selected.size === 1 && events.some((e) => selected.has(e.id)) && (
          <>
            <Button
              icon="edit"
              onClick={() =>
                onInspect(events.find((e) => selected.has(e.id))!)
              }
            >
              Edit timing
            </Button>
            <Button
              icon="columns"
              onClick={() =>
                onShowInFlow(events.find((e) => selected.has(e.id))!)
              }
            >
              Show in Department Flow
            </Button>
          </>
        )}
      </div>
      <div className="flow-map-scroll">
        <div
          className="flow-map-inner"
          style={{
            width: Math.max(width, available) + 150,
            minWidth: '100%',
          }}
        >
          <div className="flow-time-ruler">
            <span>Production local time</span>
            <div style={{ width: Math.max(width, available) }}>
              {Array.from(
                { length: Math.ceil((last - first) / 3600000) },
                (_, i) => (
                  <time key={i} style={{ left: i * 60 * zoom }}>
                    {clockText(
                      (first +
                        i * 3600000 -
                        Date.parse(
                          scheduleState(doc, shots?.doc || undefined)
                            .base + 'T00:00:00Z',
                        )) /
                        60000,
                    )}
                  </time>
                ),
              )}
            </div>
          </div>
          {lanes.map((l) => {
            const lane: any[] =
              l.id === 'production'
                ? timed.filter((e) => e.type !== 'department')
                : [
                    ...timed.filter(
                      (e) =>
                        e.type === 'department' &&
                        doc
                          .getMap<Y.Map<unknown>>('events')
                          .get(e.id)
                          ?.get('departmentId') === l.id,
                    ),
                    ...resolved.instructions
                      .filter(
                        (i: any) =>
                          i.departmentId === l.id &&
                          i.minute != null &&
                          parentById.has(i.eventId),
                      )
                      .map((i: any): any => ({
                        ...parentById.get(i.eventId)!,
                        id: i.id,
                        description: i.text,
                        minute: i.minute,
                        start: new Date(
                          Date.parse(resolved.base + 'T00:00:00Z') +
                            i.minute * 60000,
                        ).toISOString(),
                        duration: i.duration ?? null,
                        effectiveDuration: i.duration ?? null,
                        type: 'department' as const,
                        instructionKey: i.id,
                        parentId: i.eventId,
                        departmentId: l.id,
                      })),
                  ]
            const notes =
              l.id === 'production'
                ? []
                : resolved.instructions.filter(
                    (i: any) =>
                      i.departmentId === l.id &&
                      i.minute == null &&
                      String(i.text || '').trim() &&
                      parentById.has(i.eventId),
                  )
            const ends: number[] = []
            const positioned = lane.map((e) => {
              const start = Date.parse(e.start!),
                end =
                  start +
                  ((e.instructionKey
                    ? e.duration
                    : duration(e, shots?.get(e.shotId || ''))) || 0) *
                    60000
              let track = ends.findIndex((v) => v <= start)
              if (track < 0) track = ends.length
              ends[track] = end
              return { e, track }
            })
            return (
              <div
                className="flow-lane"
                key={l.id}
                style={{ height: Math.max(70, ends.length * 55 + 12) }}
              >
                <h3>
                  {l.name}
                  {notes.length > 0 && (
                    <small className="flow-map-note-list">
                      {notes.map((i: any) => (
                        <button
                          key={i.id}
                          title={i.text}
                          onClick={() =>
                            onDepartmentTime(
                              parentById.get(i.eventId)!,
                              l.id,
                            )
                          }
                        >
                          {parentById.get(i.eventId)?.label || 'Activity'}{' '}
                          · Note
                        </button>
                      ))}
                    </small>
                  )}
                </h3>
                <div
                  className="flow-lane-track"
                  style={{ width: Math.max(width, available) }}
                >
                  {positioned.map(({ e, track }) => {
                    const delta = drag?.id === e.id ? drag!.delta : 0,
                      resize = drag?.id === e.id && drag!.resize,
                      base = (e as any).instructionKey
                        ? e.duration
                        : duration(e, shots?.get(e.shotId || '')),
                      left =
                        ((Date.parse(e.start!) - first) / 60000) * zoom +
                        (resize ? 0 : delta * zoom),
                      w = Math.max(
                        base == null ? 12 : 2,
                        ((base || 0) + (resize ? delta : 0)) * zoom,
                      )
                    function pointer(
                      event: React.PointerEvent,
                      resize: boolean,
                    ) {
                      if (event.button !== 0) return
                      event.preventDefault()
                      event.stopPropagation()
                      const el = event.currentTarget as HTMLElement,
                        start = event.clientX
                      el.setPointerCapture(event.pointerId)
                      let delta = 0
                      el.onpointermove = (v) => {
                        delta =
                          Math.round((v.clientX - start) / zoom / 5) * 5
                        if (resize) delta = Math.max(-(base || 0), delta)
                        setDrag({ id: e.id, delta, resize })
                      }
                      el.onpointercancel = () => {
                        el.onpointermove = null
                        el.onpointerup = null
                        setDrag(undefined)
                      }
                      el.onpointerup = () => {
                        el.onpointermove = null
                        el.onpointerup = null
                        setDrag(undefined)
                        if (delta)
                          moveBlock(
                            e,
                            resize
                              ? e.start!
                              : new Date(
                                  Date.parse(e.start!) + delta * 60000,
                                ).toISOString(),
                            resize ? (base || 0) + delta : undefined,
                          )
                      }
                    }
                    return (
                      <div
                        key={e.id}
                        title={`${blockLabel(e)} · ${clockText(
                          e.minute,
                        )} · ${
                          base == null ? 'Duration unknown' : base + ' min'
                        }`}
                        className={`flow-time-block ${
                          selected.has(e.id) ? 'is-selected' : ''
                        } ${base == null ? 'is-point' : ''} ${
                          e.type === 'milestone' ? 'is-milestone' : ''
                        } ${drag?.id === e.id ? 'is-moving' : ''}`}
                        style={{ left, width: w, top: track * 55 + 6 }}
                      >
                        <button
                          onPointerDown={(v) => pointer(v, false)}
                          onClick={() => onSelect(e)}
                          onDoubleClick={() => inspectBlock(e)}
                          aria-label={`Move ${blockLabel(e)}`}
                          onKeyDown={(v) => {
                            if (
                              v.key === 'ArrowLeft' ||
                              v.key === 'ArrowRight'
                            ) {
                              v.preventDefault()
                              moveBlock(
                                e,
                                new Date(
                                  Date.parse(e.start!) +
                                    (v.key === 'ArrowRight' ? 5 : -5) *
                                      60000,
                                ).toISOString(),
                                undefined,
                              )
                            } else if (v.key === 'Enter') inspectBlock(e)
                          }}
                        >
                          {blockLabel(e)}
                          <small>
                            {clockText(
                              (e.minute || 0) + (resize ? 0 : delta),
                            )}
                            {e.fixed ? ' · fixed' : ''}
                          </small>
                        </button>
                        <button
                          className="flow-resize-duration"
                          aria-label={`Resize duration of ${blockLabel(
                            e,
                          )}`}
                          onPointerDown={(v) => pointer(v, true)}
                          onKeyDown={(v) => {
                            if (
                              v.key === 'ArrowLeft' ||
                              v.key === 'ArrowRight'
                            ) {
                              v.preventDefault()
                              moveBlock(
                                e,
                                e.start!,
                                Math.max(
                                  0,
                                  (base || 0) +
                                    (v.key === 'ArrowRight' ? 5 : -5),
                                ),
                              )
                            }
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {events.some((e) => !e.start) && (
        <details className="flow-unscheduled">
          <summary>
            Needs scheduling · {events.filter((e) => !e.start).length}
          </summary>
          {events
            .filter((e) => !e.start)
            .map((e) => (
              <Button
                key={e.id}
                icon="calendar"
                onClick={() => onInspect(e)}
              >
                {blockLabel(e)}
              </Button>
            ))}
          {!timed.length && (
            <p className="flow-muted">
              Set planned times to place activities on the Time Map.
            </p>
          )}
        </details>
      )}
    </div>
  )
}
