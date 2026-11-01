import DrawCheckbox from '../whiteout/DrawCheckbox'
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
  displayShot,
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
import { Overlay } from '../whiteout/Overlay'
import Menu from '../whiteout/Menu'
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
          aria-label={`Reorder assignment ${displayShot(doc, shot)}`}
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
            aria-label={`Inspect scheduled shot ${displayShot(doc, shot)}`}
          >
            {displayShot(doc, shot)}
          </button>
        ) : (
          <strong>{displayShot(doc, shot)}</strong>
        )}
        {record.get('pickup') === true && <small>Pickup</small>}
      </td>
      <td>{str(scenes(doc).get(str(shot, 'sceneId')), 'number')}</td>
      <td className="pd-day-coverage">{str(shot, 'coverage')}</td>
      <td>{str(shot, 'camera')}</td>
      <td>
        <QuantityInput
          label={`Estimate for ${displayShot(doc, shot)}`}
          value={
            str(record, 'estimatedMinutes') || str(shot, 'estimatedMinutes')
          }
          onFocus={() => {}}
          onChange={(value) => change(doc, record, 'estimatedMinutes', value)}
        />
      </td>
      <td>
        <input
          aria-label={`Schedule notes for ${displayShot(doc, shot)}`}
          value={str(record, 'notes')}
          onChange={(e) => change(doc, record, 'notes', e.target.value)}
        />
      </td>
      <td>
        <Combobox
          label={`Status for ${displayShot(doc, shot)}`}
          value={str(record, 'status')}
          options={['planned', 'ready', 'completed', 'held']}
          custom={false}
          clearable={false}
          onChange={(v) => change(doc, record, 'status', v)}
        />
      </td>
      <td>
        <Combobox
          label={`Move ${displayShot(doc, shot)} to day`}
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
            aria-label={`Move assignment ${displayShot(doc, shot)} earlier`}
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
            aria-label={`Move assignment ${displayShot(doc, shot)} later`}
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
            label={`assignment ${displayShot(doc, shot)}`}
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
  const [deletingDay, setDeletingDay] = useState(false)
  const [editing, setEditing] = useState<'new' | 'edit' | null>(null),
    [picker, setPicker] = useState(false),
    [search, setSearch] = useState(''),
    [sceneFilter, setSceneFilter] = useState(''),
    [note, setNote] = useState('')
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
      (s) =>
        (!unscheduled || !scheduled.has(str(s, 'id'))) &&
        (!sceneFilter || str(s, 'sceneId') === sceneFilter) &&
        `${displayShot(doc, s)} ${str(s, 'coverage')}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ),
    options = all.map((d) => ({
      value: str(d, 'id'),
      label: `${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(str(d, 'date') + 'T12:00:00Z'))}${str(d, 'title') ? ' · ' + str(d, 'title') : ''}`,
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
      setPicker(false)
    } catch (e) {
      onError((e as Error).message)
    }
  }
  return (
    <div className="pd-shoot-days">
      <div className="pd-day-tools">
        {all.length > 0 && (
          <Combobox
            label="Change day"
            options={options}
            value={id}
            onChange={setDay}
            clearable={false}
            custom={false}
          />
        )}
        {current && (
          <Menu
            label="Day actions"
            compact
            items={[
              {
                value: 'new',
                label: 'Add day',
                onSelect: () => setEditing('new'),
              },
              {
                value: 'edit',
                label: 'Edit day',
                disabled: !current,
                onSelect: () => setEditing('edit'),
              },
              {
                value: 'delete',
                label: 'Delete day',
                danger: true,
                disabled: !current,
                onSelect: () => setDeletingDay(true),
              },
            ]}
          />
        )}
        {deletingDay && current && (
          <InlineDelete
            initialConfirm
            label="shoot day and its assignments (master shots are retained)"
            onConfirm={async () => {
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
              setDeletingDay(false)
            }}
          />
        )}
        {current ? (
          <Button
            disabled={!current}
            onClick={() => {
              setChecked(new Set(selected))
              setPicker(true)
            }}
          >
            Assign Shots
          </Button>
        ) : (
          <Button onClick={() => setEditing('new')}>Add day</Button>
        )}
      </div>
      {editing === 'new' && (
        <Overlay title="Add shooting day" onClose={() => setEditing(null)}>
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
                const added = addDay(doc, date, title)
                change(doc, days(doc).get(added)!, 'note', note)
                setDay(added)
                setEditing(null)
                setDate('')
                setNote('')
                setTitle('')
              } catch (e) {
                onError((e as Error).message)
              }
            }}
          >
            Add day
          </Button>
          <label className="pd-field">
            Production note (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
        </Overlay>
      )}
      {current && (
        <>
          {editing === 'edit' && (
            <Overlay title="Edit shooting day" onClose={() => setEditing(null)}>
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
                placeholder="Day label (optional)"
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
            </Overlay>
          )}
          {picker && (
            <Overlay
              title="Assign shots"
              onClose={() => setPicker(false)}
              footer={
                <Button
                  disabled={!checked.size}
                  onClick={() => assign([...checked])}
                >
                  Assign {checked.size} shots
                </Button>
              }
            >
              <input
                aria-label="Search assignment shots"
                placeholder="Search shots…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Combobox
                label="Filter assignment scene"
                value={sceneFilter}
                options={[
                  { value: '', label: 'All scenes' },
                  ...ordered(scenes(doc)).map((s) => ({
                    value: str(s, 'id'),
                    label: `Scene ${str(s, 'number')}`,
                  })),
                ]}
                custom={false}
                onChange={setSceneFilter}
              />
              <label>
                <DrawCheckbox
                  checked={unscheduled}
                  onChange={(e) => setUnscheduled(e.target.checked)}
                />
                Unscheduled only
              </label>
              <label>
                <DrawCheckbox
                  checked={pickup}
                  onChange={(e) => setPickup(e.target.checked)}
                />
                Pickup / repeat assignment
              </label>
              <div className="pd-day-shot-picker">
                {available.map((s) => (
                  <label key={str(s, 'id')}>
                    <DrawCheckbox
                      checked={checked.has(str(s, 'id'))}
                      onChange={(e) => {
                        const next = new Set(checked)
                        e.target.checked
                          ? next.add(str(s, 'id'))
                          : next.delete(str(s, 'id'))
                        setChecked(next)
                      }}
                    />
                    <strong>{displayShot(doc, s)}</strong>
                    <span>{str(s, 'coverage')}</span>
                  </label>
                ))}
              </div>
            </Overlay>
          )}
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
      {!current && <p className="pd-muted">No shooting days yet.</p>}
    </div>
  )
}
