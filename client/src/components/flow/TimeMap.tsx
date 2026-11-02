import { useState } from 'react'
import type * as Y from 'yjs'
import { Button } from '../whiteout/Button'
import {
  localParts,
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
}: {
  doc: Y.Doc
  events: FlowEvent[]
  departments: Department[]
  zone: string
  shots?: Y.Map<Y.Map<unknown>>
  onMove: (e: FlowEvent, start: string, duration: number | null) => void
  onInspect: (e: FlowEvent) => void
}) {
  const [zoom, setZoom] = useState(2),
    [drag, setDrag] = useState<{ id: string; delta: number; resize: boolean }>()
  const timed = events.filter((e) => e.start),
    first = timed.length
      ? Math.floor(
          Math.min(...timed.map((e) => Date.parse(e.start!))) / 3600000,
        ) * 3600000
      : 0,
    last = timed.length
      ? Math.max(
          ...timed.map(
            (e) =>
              Date.parse(e.start!) +
              (duration(e, shots?.get(e.shotId || '')) || 0) * 60000,
          ),
        ) + 3600000
      : first + 8 * 3600000,
    width = Math.max(700, ((last - first) / 60000) * zoom),
    lanes = [{ id: 'production', name: 'Production' }, ...departments]
  return (
    <div className="flow-time-map">
      <div className="flow-map-controls">
        <Button
          icon="plus"
          onClick={() => setZoom((v) => Math.min(6, v + 0.5))}
        >
          Zoom in
        </Button>
        <Button onClick={() => setZoom((v) => Math.max(0.5, v - 0.5))}>
          Zoom out
        </Button>
        <small>{zoom * 30}px / 30 min</small>
      </div>
      <div className="flow-map-scroll">
        <div className="flow-map-inner" style={{ width: width + 150 }}>
          <div className="flow-time-ruler">
            <span>Production local time</span>
            <div style={{ width }}>
              {Array.from(
                { length: Math.ceil((last - first) / 3600000) },
                (_, i) => (
                  <time key={i} style={{ left: i * 60 * zoom }}>
                    {localParts(
                      new Date(first + i * 3600000).toISOString(),
                      zone,
                    ).slice(5)}
                  </time>
                ),
              )}
            </div>
          </div>
          {lanes.map((l) => {
            const lane = timed.filter((e) =>
              l.id === 'production'
                ? e.type !== 'department'
                : e.type === 'milestone' ||
                  !!doc
                    .getMap<Y.Map<unknown>>('instructions')
                    .get(e.id + ':' + l.id)
                    ?.get('text')
                    ?.toString()
                    .trim(),
            )
            const ends: number[] = []
            const positioned = lane.map((e) => {
              const start = Date.parse(e.start!),
                end =
                  start + (duration(e, shots?.get(e.shotId || '')) || 5) * 60000
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
                <h3>{l.name}</h3>
                <div className="flow-lane-track" style={{ width }}>
                  {positioned.map(({ e, track }) => {
                    const delta = drag?.id === e.id ? drag.delta : 0,
                      resize = drag?.id === e.id && drag.resize,
                      base = duration(e, shots?.get(e.shotId || '')),
                      left =
                        ((Date.parse(e.start!) - first) / 60000) * zoom +
                        (resize ? 0 : delta * zoom),
                      w = Math.max(
                        42,
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
                        delta = Math.round((v.clientX - start) / zoom / 5) * 5
                        if (resize) delta = Math.max(-(base || 0), delta)
                        setDrag({ id: e.id, delta, resize })
                      }
                      el.onpointerup = () => {
                        el.onpointermove = null
                        el.onpointerup = null
                        setDrag(undefined)
                        if (delta)
                          onMove(
                            e,
                            resize
                              ? e.start!
                              : new Date(
                                  Date.parse(e.start!) + delta * 60000,
                                ).toISOString(),
                            resize ? (base || 0) + delta : base,
                          )
                      }
                    }
                    return (
                      <div
                        key={e.id}
                        className={`flow-time-block ${e.type === 'milestone' ? 'is-milestone' : ''} ${drag?.id === e.id ? 'is-moving' : ''}`}
                        style={{ left, width: w, top: track * 55 + 6 }}
                      >
                        <button
                          onPointerDown={(v) => pointer(v, false)}
                          onDoubleClick={() => onInspect(e)}
                          aria-label={`Move ${e.description || e.reference || 'event'}`}
                          onKeyDown={(v) => {
                            if (
                              v.key === 'ArrowLeft' ||
                              v.key === 'ArrowRight'
                            ) {
                              v.preventDefault()
                              onMove(
                                e,
                                new Date(
                                  Date.parse(e.start!) +
                                    (v.key === 'ArrowRight' ? 5 : -5) * 60000,
                                ).toISOString(),
                                base,
                              )
                            } else if (v.key === 'Enter') onInspect(e)
                          }}
                        >
                          {e.description ||
                            e.reference ||
                            'Department activity'}
                          <small>
                            {localParts(
                              new Date(
                                Date.parse(e.start!) +
                                  (resize ? 0 : delta * 60000),
                              ).toISOString(),
                              zone,
                            ).slice(11)}
                            {e.fixed ? ' · fixed' : ''}
                          </small>
                        </button>
                        <button
                          className="flow-resize-duration"
                          aria-label={`Resize duration of ${e.description || e.reference || 'event'}`}
                          onPointerDown={(v) => pointer(v, true)}
                          onKeyDown={(v) => {
                            if (
                              v.key === 'ArrowLeft' ||
                              v.key === 'ArrowRight'
                            ) {
                              v.preventDefault()
                              onMove(
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
      <section className="flow-unscheduled">
        <h3>Unscheduled</h3>
        {events
          .filter((e) => !e.start)
          .map((e) => (
            <Button key={e.id} icon="calendar" onClick={() => onInspect(e)}>
              {e.description || e.reference || 'Department activity'}
            </Button>
          ))}
        {!timed.length && (
          <p className="flow-muted">
            Set planned times to place activities on the Time Map.
          </p>
        )}
      </section>
    </div>
  )
}
