import { useState } from 'react'
import type * as Y from 'yjs'
import { Overlay } from '../whiteout/Overlay'
import Menu from '../whiteout/Menu'
import { Button } from '../whiteout/Button'
import ClockPicker from './ClockPicker'
import { put, type Department, type FlowEvent } from '../../lib/flow/model'
export default function InstructionTiming({
  doc,
  event,
  department,
  onClose,
}: {
  doc: Y.Doc
  event: FlowEvent
  department: Department
  onClose: () => void
}) {
  const id = event.id + ':' + department.id,
    record = doc.getMap<Y.Map<unknown>>('instructions').get(id),
    [mode, setMode] = useState(
      String(record?.get('timing') || 'associated'),
    ),
    [clockValid, setClockValid] = useState(true),
    [offset, setOffset] = useState(
      String(record?.get('offsetMinutes') || 0),
    ),
    [edge, setEdge] = useState(
      String(record?.get('relativeEdge') || 'start'),
    ),
    [start, setStart] = useState<number | null>(
      (record?.get('clockStart') as number) ?? null,
    ),
    [duration, setDuration] = useState(
      String(record?.get('duration') ?? ''),
    )
  const valid =
    Number.isFinite(Number(offset)) &&
    Math.abs(Number(offset)) <= 10080 &&
    (duration === '' ||
      (Number(duration) >= 0 && Number(duration) <= 10080))
  return (
    <Overlay
      title={department.name + ' timing'}
      className="flow-time-dialog"
      onClose={onClose}
      footer={
        <Button
          variant="primary"
          disabled={!valid || (mode === 'anchor' && !clockValid)}
          onClick={() => {
            put(doc, 'instructions', id, {
              eventId: event.id,
              departmentId: department.id,
              timing: mode,
              offsetMinutes: Number(offset),
              relativeEdge: edge,
              clockStart: start,
              duration: duration === '' ? null : Number(duration),
            })
            onClose()
          }}
        >
          Apply timing
        </Button>
      }
    >
      <div className="flow-form">
        <Menu
          label={
            {
              associated: 'With this activity',
              relative: 'Relative to this activity',
              anchor: 'At a set time',
              unscheduled: 'Unscheduled',
            }[mode] || mode
          }
          value={mode}
          onChange={setMode}
          items={[
            ['associated', 'With this activity'],
            ['relative', 'Relative to this activity'],
            ['anchor', 'At a set time'],
            ['unscheduled', 'Unscheduled'],
          ].map(([value, label]) => ({ value, label }))}
        />
        {mode === 'relative' && (
          <>
            <label>
              Minutes · negative for before
              <input
                type="number"
                value={offset}
                onChange={(e) => setOffset(e.target.value)}
              />
            </label>
            <Menu
              label={
                edge === 'start'
                  ? 'From activity start'
                  : 'From activity end'
              }
              value={edge}
              onChange={setEdge}
              items={[
                { value: 'start', label: 'From activity start' },
                { value: 'end', label: 'From activity end' },
              ]}
            />
          </>
        )}
        {mode === 'anchor' && (
          <ClockPicker
            onValidityChange={setClockValid}
            label="Start time"
            value={start}
            onChange={setStart}
          />
        )}
        <label>
          Duration · optional minutes
          <input
            type="number"
            min="0"
            value={duration}
            placeholder="Unknown"
            onChange={(e) => setDuration(e.target.value)}
          />
        </label>
      </div>
    </Overlay>
  )
}
