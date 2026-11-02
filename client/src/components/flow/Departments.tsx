import { useState } from 'react'
import type * as Y from 'yjs'
import { Overlay } from '../whiteout/Overlay'
import { Button, IconButton } from '../whiteout/Button'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import { departments, put, type Department } from '../../lib/flow/model'
export default function Departments({
  doc,
  hidden,
  onHidden,
  onClose,
}: {
  doc: Y.Doc
  hidden: string[]
  onHidden: (v: string[]) => void
  onClose: () => void
}) {
  const [name, setName] = useState(''),
    [removing, setRemoving] = useState<Department>()
  const all = departments(doc)
  function move(d: Department, i: number, step: number) {
    const target = all[i + step]
    if (target)
      doc.transact(() => {
        put(doc, 'departments', d.id, { order: target.order })
        put(doc, 'departments', target.id, { order: d.order })
      })
  }
  return (
    <Overlay
      title="Departments and layout"
      onClose={onClose}
      className="flow-departments"
    >
      <div className="flow-department-list">
        {all.map((d, i) => (
          <div key={d.id} className="flow-department-edit">
            <label className="flow-check">
              <DrawCheckbox
                aria-label={`Show ${d.name}`}
                checked={!hidden.includes(d.id)}
                onChange={(e) =>
                  onHidden(
                    e.target.checked
                      ? hidden.filter((k) => k !== d.id)
                      : [...hidden, d.id],
                  )
                }
              />
              <span className="pd-sr-only">Visible</span>
            </label>
            <div>
              <input
                aria-label={`Department ${i + 1} name`}
                value={d.name}
                maxLength={100}
                onChange={(e) =>
                  put(doc, 'departments', d.id, { name: e.target.value })
                }
              />
              <input
                aria-label={`${d.name} personnel`}
                placeholder="Personnel"
                value={d.personnel || ''}
                maxLength={500}
                onChange={(e) =>
                  put(doc, 'departments', d.id, { personnel: e.target.value })
                }
              />
              <input
                aria-label={`${d.name} group`}
                placeholder="Group · optional"
                value={d.group || ''}
                maxLength={100}
                onChange={(e) =>
                  put(doc, 'departments', d.id, { group: e.target.value })
                }
              />
            </div>
            <div>
              <IconButton
                name="up"
                label={`Move ${d.name} up`}
                disabled={!i}
                onClick={() => move(d, i, -1)}
              />
              <IconButton
                name="down"
                label={`Move ${d.name} down`}
                disabled={i === all.length - 1}
                onClick={() => move(d, i, 1)}
              />
              <IconButton
                name="trash"
                label={`Remove ${d.name}`}
                onClick={() => setRemoving(d)}
              />
            </div>
          </div>
        ))}
      </div>
      <form
        className="flow-add-department"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) {
            put(doc, 'departments', crypto.randomUUID(), {
              name: name.trim(),
              personnel: '',
              group: '',
              order: Math.max(0, ...all.map((d) => d.order)) + 1024,
            })
            setName('')
          }
        }}
      >
        <input
          aria-label="New department name"
          placeholder="New department"
          value={name}
          maxLength={100}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" icon="plus" disabled={!name.trim()}>
          Add department
        </Button>
      </form>
      <Button variant="quiet" onClick={() => onHidden([])}>
        Show all departments
      </Button>
      {[...doc.getMap<Y.Map<unknown>>('departments').values()]
        .filter((d) => d.get('removedAt'))
        .map((d) => (
          <Button
            key={String(d.get('id'))}
            icon="undo"
            onClick={() =>
              put(doc, 'departments', String(d.get('id')), { removedAt: null })
            }
          >
            Restore {String(d.get('name'))}
          </Button>
        ))}
      {removing && (
        <Overlay
          title={`Remove ${removing.name}?`}
          onClose={() => setRemoving(undefined)}
          footer={
            <Button
              variant="danger"
              onClick={() => {
                put(doc, 'departments', removing.id, {
                  removedAt: new Date().toISOString(),
                })
                setRemoving(undefined)
              }}
            >
              Remove department
            </Button>
          }
        >
          <p>
            Existing instructions are retained and return if this department is
            restored. Hiding it from your view is also available without
            affecting collaborators.
          </p>
        </Overlay>
      )}
    </Overlay>
  )
}
