import { DragDropProvider } from '@dnd-kit/react'
import { useSortable, isSortable } from '@dnd-kit/react/sortable'
import { shotSensors } from '../shots/ShotDrag'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import type { Department } from '../../lib/flow/model'
function Row({
  department,
  index,
  checked,
  onToggle,
}: {
  department: Department
  index: number
  checked: boolean
  onToggle: () => void
}) {
  const d = useSortable({
    id: department.id,
    index,
    group: 'print-departments',
    type: 'print-departments',
    accept: 'print-departments',
    transition: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? null
      : { duration: 160 },
  })
  return (
    <div ref={d.ref} className="flow-print-department">
      <button
        ref={d.handleRef as never}
        className="flow-grip"
        aria-label={'Move ' + department.name + ' in print order'}
      >
        ⠿
      </button>
      <label className="flow-check">
        <DrawCheckbox checked={checked} onChange={onToggle} />
        {department.name}
      </label>
    </div>
  )
}
export default function PrintDepartments({
  departments,
  scope,
  onChange,
}: {
  departments: Department[]
  scope: string[]
  onChange: (v: string[]) => void
}) {
  const order = [
    ...scope,
    ...departments.filter((d) => !scope.includes(d.id)).map((d) => d.id),
  ]
  return (
    <DragDropProvider
      sensors={shotSensors}
      onDragEnd={(e) => {
        const s = e.operation.source
        if (e.canceled || !isSortable(s)) return
        const n = [...order],
          i = n.indexOf(String(s.id)),
          v = n.splice(i, 1)[0]
        n.splice(s.index, 0, v)
        onChange(n.filter((id) => scope.includes(id)))
      }}
    >
      {order.map((id, i) => {
        const d = departments.find((d) => d.id === id)
        return d ? (
          <Row
            key={id}
            department={d}
            index={i}
            checked={scope.includes(id)}
            onToggle={() =>
              onChange(
                scope.includes(id)
                  ? scope.filter((x) => x !== id)
                  : [...scope, id],
              )
            }
          />
        ) : null
      })}
    </DragDropProvider>
  )
}
