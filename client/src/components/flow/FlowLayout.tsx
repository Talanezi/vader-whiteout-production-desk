import { createPortal } from 'react-dom'
import { usePopover } from '../whiteout/Popover'
import Icon from '../whiteout/Icon'
import { Button } from '../whiteout/Button'
import { DragDropProvider } from '@dnd-kit/react'
import { useSortable, isSortable } from '@dnd-kit/react/sortable'
import { shotSensors } from '../shots/ShotDrag'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import type { Department } from '../../lib/flow/model'
function Row({
  d,
  index,
  checked,
  toggle,
}: {
  d: Department
  index: number
  checked: boolean
  toggle: () => void
}) {
  const s = useSortable({
    id: d.id,
    index,
    group: 'layout',
    type: 'layout',
    accept: 'layout',
    transition: { duration: 160 },
  })
  return (
    <div ref={s.ref} className="flow-layout-row">
      <button
        className="flow-grip"
        ref={s.handleRef as never}
        aria-label={'Move ' + d.name}
      >
        ⠿
      </button>
      <label className="flow-check">
        <DrawCheckbox checked={checked} onChange={toggle} />
        {d.name}
      </label>
    </div>
  )
}
export default function FlowLayout({
  deps,
  hidden,
  onHidden,
  onOrder,
  onAdd,
}: {
  deps: Department[]
  hidden: string[]
  onHidden: (ids: string[]) => void
  onOrder: (ids: string[]) => void
  onAdd: () => void
}) {
  const p = usePopover(292)
  return (
    <>
      <button
        ref={p.trigger}
        className="pd-button"
        aria-expanded={p.open}
        aria-controls={p.id}
        onClick={() => p.setOpen(!p.open)}
      >
        <Icon name="columns" />
        Layout
        <Icon name="chevron" />
      </button>
      {p.open &&
        createPortal(
          <div
            ref={p.panel}
            id={p.id}
            role="dialog"
            aria-label="Flow layout"
            className="pd-ui flow-layout-popover"
            style={p.style}
          >
            <div className="flow-layout-presets">
              <Button
                onClick={() =>
                  onHidden(
                    deps
                      .filter(
                        (d) =>
                          !/camera|grip|electric|talent|actor|sound|director|production|producer/i.test(
                            d.name,
                          ),
                      )
                      .map((d) => d.id),
                  )
                }
              >
                Core Crew
              </Button>
              <Button onClick={() => onHidden([])}>All Departments</Button>
            </div>
            <Button
              icon="plus"
              onClick={() => {
                p.close()
                onAdd()
              }}
            >
              Add department
            </Button>
            <small>Customize</small>
            <DragDropProvider
              sensors={shotSensors}
              onDragEnd={(e) => {
                const s = e.operation.source
                if (e.canceled || !isSortable(s)) return
                const ids = deps.map((d) => d.id),
                  item = ids.splice(ids.indexOf(String(s.id)), 1)[0]
                ids.splice(s.index, 0, item)
                onOrder(ids)
              }}
            >
              {deps.map((d, i) => (
                <Row
                  key={d.id}
                  d={d}
                  index={i}
                  checked={!hidden.includes(d.id)}
                  toggle={() =>
                    onHidden(
                      hidden.includes(d.id)
                        ? hidden.filter((x) => x !== d.id)
                        : [...hidden, d.id],
                    )
                  }
                />
              ))}
            </DragDropProvider>
          </div>,
          p.target,
        )}
    </>
  )
}
