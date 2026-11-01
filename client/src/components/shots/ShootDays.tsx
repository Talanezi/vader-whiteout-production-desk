import { useState, useEffect } from 'react'
import * as Y from 'yjs'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { useSortable, isSortable } from '@dnd-kit/react/sortable'
import { shootingColumns, type PrintView } from '../../lib/shotPrint'
import { shotSensors } from './ShotDrag'
import {
  days,
  assignments,
  addDay,
  assignShots,
  validAssignments,
  moveRecords,
  validDate,
} from '../../lib/shotSchedule'
import {
  ordered,
  shotOperation,
  shots,
  scenes,
  str,
  change,
  type RecordMap,
} from '../../lib/shotDocument'
import { Button } from '../whiteout/Button'
import DatePicker from '../whiteout/DatePicker'
import Combobox from '../whiteout/Combobox'
import InlineDelete from '../whiteout/InlineDelete'
import QuantityInput from '../whiteout/QuantityInput'
function AssignmentRow({
  doc,
  record,
  index,
  list,
  dayOptions,
  onSelect,
}: {
  doc: Y.Doc
  record: RecordMap
  index: number
  list: RecordMap[]
  dayOptions: { value: string; label: string }[]
  onSelect?: (id: string) => void
}) {
  const shot = shots(doc).get(str(record, 'shotId'))!,
    sortable = useSortable({
      id: str(record, 'id'),
      index,
      group: str(record, 'dayId'),
      transition: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? null
        : { duration: 120 },
    })
  return (
    <tr
      ref={sortable.ref}
      className={sortable.isDropTarget ? 'is-drop-target' : ''}
      data-assignment={str(record, 'id')}
    >
      <td>
        <button
          ref={sortable.handleRef}
          className="pd-row-grip"
          aria-label={`Reorder assignment ${str(shot, 'number')}`}
        >
          ⠿
        </button>
        <small>{index + 1}</small>
      </td>
      <td>
        {onSelect ? (
          <button
            className="pd-day-shot-link"
            onClick={() => onSelect(str(shot, 'id'))}
            aria-label={`Inspect scheduled shot ${str(shot, 'number')}`}
          >
            {str(shot, 'number')}
          </button>
        ) : (
          <strong>{str(shot, 'number')}</strong>
        )}
        {record.get('pickup') === true && <small>Pickup</small>}
      </td>
      <td>{str(scenes(doc).get(str(shot, 'sceneId')), 'number')}</td>
      <td className="pd-day-coverage">{str(shot, 'coverage')}</td>
      <td>{str(shot, 'camera')}</td>
      <td>
        <QuantityInput
          label={`Estimate for ${str(shot, 'number')}`}
          value={str(record, 'estimatedMinutes')}
          onFocus={() => {}}
          onChange={(value) => change(doc, record, 'estimatedMinutes', value)}
        />
      </td>
      <td>
        <input
          aria-label={`Schedule notes for ${str(shot, 'number')}`}
          value={str(record, 'notes')}
          onChange={(e) => change(doc, record, 'notes', e.target.value)}
        />
      </td>
      <td>
        <Combobox
          label={`Status for ${str(shot, 'number')}`}
          value={str(record, 'status')}
          options={['planned', 'ready', 'completed', 'held']}
          custom={false}
          clearable={false}
          onChange={(v) => change(doc, record, 'status', v)}
        />
      </td>
      <td>
        <Combobox
          label={`Move ${str(shot, 'number')} to day`}
          value={str(record, 'dayId')}
          options={dayOptions}
          custom={false}
          clearable={false}
          onChange={(v) =>
            shotOperation(
              doc,
              () => {
                record.set('dayId', v)
                record.set(
                  'order',
                  Math.max(
                    0,
                    ...validAssignments(doc, v).map(
                      (a) => Number(a.get('order')) || 0,
                    ),
                  ) + 1024,
                )
              },
              'local',
            )
          }
        />
        <div className="pd-assignment-actions">
          <button
            aria-label={`Move assignment ${str(shot, 'number')} earlier`}
            disabled={!index}
            onClick={() =>
              moveRecords(
                doc,
                list,
                [str(record, 'id')],
                str(list[index - 1], 'id'),
              )
            }
          >
            ↑
          </button>
          <button
            aria-label={`Move assignment ${str(shot, 'number')} later`}
            disabled={index === list.length - 1}
            onClick={() =>
              moveRecords(
                doc,
                list,
                [str(record, 'id')],
                str(list[index + 1], 'id'),
              )
            }
          >
            ↓
          </button>
          <InlineDelete
            label={`assignment ${str(shot, 'number')}`}
            onConfirm={async () => {
              change(doc, record, 'deleted', true)
            }}
          />
        </div>
      </td>
    </tr>
  )
}
export default function ShootDays({
  doc,
  selected,
  onError,
  onPrintView,
  onSelect,
}: {
  doc: Y.Doc
  onPrintView?: (view: PrintView) => void
  onSelect?: (id: string) => void
  selected: string[]
  onError: (message: string) => void
}) {
  const all = ordered(days(doc)),
    [dayId, setDay] = useState(str(all[0], 'id')),
    [date, setDate] = useState(''),
    [newDateValid, setNewDateValid] = useState(true),
    [title, setTitle] = useState(''),
    [pickup, setPickup] = useState(false),
    [unscheduled, setUnscheduled] = useState(false),
    [checked, setChecked] = useState<Set<string>>(new Set())
  const candidate = days(doc).get(dayId)
  const current = candidate && !candidate.get('deleted') ? candidate : all[0],
    id = str(current, 'id'),
    list = validAssignments(doc, id),
    allShots = ordered(shots(doc)),
    scheduled = new Set(validAssignments(doc).map((a) => str(a, 'shotId'))),
    available = allShots.filter(
      (s) => !unscheduled || !scheduled.has(str(s, 'id')),
    ),
    options = all.map((d) => ({
      value: str(d, 'id'),
      label: `${str(d, 'date')}${str(d, 'title') ? ' · ' + str(d, 'title') : ''}`,
    }))
  const total = list.reduce(
    (n, a) =>
      n +
      (Number(
        str(a, 'estimatedMinutes') ||
          str(shots(doc).get(str(a, 'shotId')), 'estimatedMinutes'),
      ) || 0),
    0,
  )
  useEffect(() => {
    onPrintView?.({
      label: `Shooting Order · ${str(current, 'date')}`,
      rows: list.map((record) => ({
        shotId: str(record, 'shotId'),
        assignmentId: str(record, 'id'),
      })),
      columns: shootingColumns,
      dayId: id,
      groupScenes: false,
    })
  }, [
    id,
    list.map((record) => str(record, 'id')).join(','),
    current && str(current, 'date'),
  ])
  function assign(ids: string[]) {
    try {
      if (!ids.length) throw Error('Select shots to assign.')
      assignShots(doc, id, ids, pickup)
      setChecked(new Set())
    } catch (e) {
      onError((e as Error).message)
    }
  }
  return (
    <div className="pd-shoot-days">
      <div className="pd-day-tools">
        {all.length > 0 && (
          <Combobox
            label="Shoot day"
            options={options}
            value={id}
            onChange={setDay}
            clearable={false}
            custom={false}
          />
        )}
        <DatePicker
          label="New shoot date"
          value={date}
          onValidityChange={setNewDateValid}
          onChange={setDate}
        />
        <input
          aria-label="New day label"
          placeholder="Day label (optional)"
          maxLength={180}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button
          disabled={!validDate(date) || !newDateValid}
          onClick={() => {
            try {
              setDay(addDay(doc, date, title))
              setDate('')
              setTitle('')
            } catch (e) {
              onError((e as Error).message)
            }
          }}
        >
          Add day
        </Button>
      </div>
      {current && (
        <>
          <div className="pd-day-tools pd-day-details">
            <DatePicker
              label="Planned date"
              required
              value={str(current, 'date')}
              onChange={(v) => {
                if (validDate(v))
                  shotOperation(doc, () => change(doc, current, 'date', v))
              }}
            />
            <input
              aria-label="Day label"
              value={str(current, 'title')}
              maxLength={180}
              onChange={(e) => change(doc, current, 'title', e.target.value)}
            />
            <input
              aria-label="Day location / production note"
              placeholder="Location / production note"
              value={str(current, 'note')}
              onChange={(e) => change(doc, current, 'note', e.target.value)}
            />
            <InlineDelete
              label="shoot day and its assignments (master shots are retained)"
              onConfirm={async () =>
                shotOperation(
                  doc,
                  () => {
                    current.set('deleted', true)
                    validAssignments(doc, id).forEach((a) =>
                      a.set('deleted', true),
                    )
                  },
                  'local',
                )
              }
            />
          </div>
          <div className="pd-day-assign">
            <label>
              <input
                type="checkbox"
                checked={pickup}
                onChange={(e) => setPickup(e.target.checked)}
              />{' '}
              Pickup / repeat assignment
            </label>
            <Button
              disabled={!selected.length}
              onClick={() => assign(selected)}
            >
              Assign {selected.length || 'selected'} shot
              {selected.length === 1 ? '' : 's'}
            </Button>
            <details>
              <summary>
                Choose shots · {allShots.length - scheduled.size} unscheduled
              </summary>
              <label>
                <input
                  type="checkbox"
                  checked={unscheduled}
                  onChange={(e) => setUnscheduled(e.target.checked)}
                />{' '}
                Unscheduled only
              </label>
              <div className="pd-day-shot-picker">
                {available.map((s) => (
                  <label key={str(s, 'id')}>
                    <input
                      type="checkbox"
                      checked={checked.has(str(s, 'id'))}
                      onChange={(e) => {
                        const next = new Set(checked)
                        e.target.checked
                          ? next.add(str(s, 'id'))
                          : next.delete(str(s, 'id'))
                        setChecked(next)
                      }}
                    />
                    <strong>{str(s, 'number')}</strong>
                    <span>{str(s, 'coverage')}</span>
                  </label>
                ))}
              </div>
              <Button
                disabled={!checked.size}
                onClick={() => assign([...checked])}
              >
                Assign {checked.size} shots
              </Button>
            </details>
          </div>
          <DragDropProvider
            sensors={shotSensors}
            onDragEnd={(e) => {
              const source = e.operation.source
              if (
                !e.canceled &&
                isSortable(source) &&
                e.operation.target &&
                source.initialIndex !== source.index &&
                list[source.index]
              )
                moveRecords(
                  doc,
                  list,
                  [String(source.id)],
                  str(list[source.index], 'id'),
                )
            }}
          >
            <div className="pd-day-table-scroll">
              <table className="pd-day-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Shot</th>
                    <th>Scene</th>
                    <th>Coverage</th>
                    <th>Camera</th>
                    <th>Est. min</th>
                    <th>Schedule notes</th>
                    <th>Status</th>
                    <th>Day / actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a, i) => (
                    <AssignmentRow
                      key={str(a, 'id')}
                      doc={doc}
                      record={a}
                      index={i}
                      list={list}
                      dayOptions={options}
                      onSelect={onSelect}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <DragOverlay>
              <div className="pd-drag-preview">Moving shoot-day assignment</div>
            </DragOverlay>
          </DragDropProvider>
          <footer className="pd-shot-table-footer">
            {list.length} assignments ·{' '}
            {total.toLocaleString('en-US', { maximumFractionDigits: 1 })} min
            estimated
          </footer>
          {!list.length && (
            <p className="pd-muted">No shots assigned to this day.</p>
          )}
        </>
      )}
      {!current && (
        <p className="pd-muted">
          Add a shooting date to plan a day. Creative and planning order remain
          independent.
        </p>
      )}
    </div>
  )
}
