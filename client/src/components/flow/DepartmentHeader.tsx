import { useState } from 'react'
import type * as Y from 'yjs'
import { useSortable } from '@dnd-kit/react/sortable'
import { put, orderedEvents, type Department } from '../../lib/flow/model'
import Menu from '../whiteout/Menu'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
export default function DepartmentHeader({
  doc,
  department: d,
  index,
  width,
  onWidth,
  onHide,
}: {
  doc: Y.Doc
  department: Department
  index: number
  width: number
  onWidth: (n: number) => void
  onHide: () => void
}) {
  const drag = useSortable({
      id: 'department:' + d.id,
      index,
      group: 'flow-departments',
      type: 'flow-departments',
      accept: 'flow-departments',
      transition: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? null
        : { duration: 180 },
    }),
    [split, setSplit] = useState(false),
    [name, setName] = useState(''),
    [group, setGroup] = useState(false)
  return (
    <th
      ref={drag.ref}
      data-dragging={drag.isDragging || undefined}
      className="flow-department-heading"
    >
      <div className="flow-heading-top">
        <button
          ref={drag.handleRef as never}
          className="flow-grip"
          aria-label={'Move ' + d.name}
        >
          ⠿
        </button>
        <input
          key={d.name}
          aria-label={'Rename ' + d.name}
          defaultValue={d.name}
          maxLength={100}
          onBlur={(e) => {
            if (e.target.value.trim())
              put(doc, 'departments', d.id, {
                name: e.target.value.trim(),
              })
            else e.target.value = d.name
          }}
        />
        <Menu
          compact
          label={'Actions for ' + d.name}
          items={[
            { value: 'hide', label: 'Hide column', onSelect: onHide },
            {
              value: 'group',
              label: 'Group',
              onSelect: () => setGroup(true),
            },
            {
              value: 'split',
              label: 'Split department',
              onSelect: () => setSplit(true),
            },
          ]}
        />
      </div>
      <input
        aria-label={d.name + ' personnel'}
        placeholder="Add personnel"
        value={d.personnel || ''}
        maxLength={1000}
        onChange={(e) =>
          put(doc, 'departments', d.id, { personnel: e.target.value })
        }
      />
      {d.group && <small className="flow-dept-group">{d.group}</small>}
      <button
        className="flow-col-resize"
        aria-label={'Resize ' + d.name}
        onPointerDown={(e) => {
          const t = e.currentTarget,
            x = e.clientX
          t.setPointerCapture(e.pointerId)
          t.onpointermove = (v) =>
            onWidth(Math.max(160, Math.min(600, width + v.clientX - x)))
          t.onpointerup = t.onpointercancel = () => {
            t.onpointermove = null
            t.onpointerup = null
            t.onpointercancel = null
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            onWidth(
              Math.max(
                160,
                Math.min(600, width + (e.key === 'ArrowRight' ? 10 : -10)),
              ),
            )
          }
        }}
      />
      {group && (
        <Overlay
          title={'Group ' + d.name}
          className="flow-time-dialog"
          onClose={() => setGroup(false)}
        >
          <label className="flow-field">
            Group name
            <input
              defaultValue={d.group || ''}
              maxLength={100}
              onBlur={(e) =>
                put(doc, 'departments', d.id, {
                  group: e.target.value.trim(),
                })
              }
            />
          </label>
        </Overlay>
      )}
      {split && (
        <Overlay
          title={'Split ' + d.name}
          className="flow-time-dialog"
          onClose={() => setSplit(false)}
          footer={
            <Button
              disabled={!name.trim()}
              variant="primary"
              onClick={() => {
                const id = crypto.randomUUID()
                doc.transact(() => {
                  put(doc, 'departments', id, {
                    name: name.trim(),
                    personnel: '',
                    order: d.order + 0.5,
                    group: d.group || d.name,
                  })
                  for (const e of orderedEvents(doc)) {
                    const old = doc
                      .getMap<Y.Map<unknown>>('instructions')
                      .get(e.id + ':' + d.id)
                    put(doc, 'instructions', e.id + ':' + id, {
                      ...(old?.toJSON() || {}),
                      id: e.id + ':' + id,
                      eventId: e.id,
                      departmentId: id,
                      text: String(old?.get('text') || ''),
                    })
                  }
                })
                setSplit(false)
              }}
            >
              Add separate department
            </Button>
          }
        >
          <label className="flow-field">
            New department
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </label>
          <p className="flow-muted">
            Existing instructions are retained and copied for review in the
            new column.
          </p>
        </Overlay>
      )}
    </th>
  )
}
