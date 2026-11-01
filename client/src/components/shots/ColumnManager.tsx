import DrawCheckbox from '../whiteout/DrawCheckbox'
import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { ColumnSizingState } from '@tanstack/react-table'
import { fields } from '../../lib/shotDocument'
import { presets, label, type GridField } from '../../lib/shotColumns'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import Menu from '../whiteout/Menu'
import { SearchField } from '../whiteout/Workspace'
type Props = {
  defaultPreset: string
  preset: string
  applyPreset: (name: string) => void
  visible: GridField[]
  setVisible: Dispatch<SetStateAction<GridField[]>>
  order: string[]
  setOrder: Dispatch<SetStateAction<string[]>>
  setPreset: (name: string) => void
  setSizes: Dispatch<SetStateAction<ColumnSizingState>>
  onClose: () => void
}
export default function ColumnManager(p: Props) {
  const [search, setSearch] = useState(''),
    dragged = useRef(''),
    all = [
      ...new Set([
        ...p.order,
        'scene',
        'shootDates',
        'assignmentCount',
        'scheduleStatus',
        ...Object.keys(fields).filter((f) => f !== 'number'),
      ]),
    ]
  function move(field: string, delta: number) {
    const next = [...all],
      index = next.indexOf(field),
      to = index + delta
    if (to < 0 || to >= next.length) return
    ;[next[index], next[to]] = [next[to], next[index]]
    p.setOrder(next)
    p.setPreset('Custom')
  }
  return (
    <Overlay
      title="Columns and layout"
      className="pd-column-manager"
      onClose={p.onClose}
      footer={
        <div className="pd-column-manager-footer">
          <Button onClick={() => p.setSizes({})}>Reset column widths</Button>
          <Button
            onClick={() => {
              p.setSizes({})
              p.applyPreset(p.defaultPreset)
            }}
          >
            Restore default layout
          </Button>
        </div>
      }
    >
      <Menu
        label={p.preset}
        ariaLabel="View preset"
        value={p.preset}
        items={[...Object.keys(presets), 'Custom'].map((value) => ({
          value,
          label: value,
        }))}
        onChange={p.applyPreset}
      />
      <SearchField
        label="Search columns"
        placeholder="Find a field…"
        value={search}
        onChange={setSearch}
      />
      {all
        .filter((f) => label(f).toLowerCase().includes(search.toLowerCase()))
        .map((f) => (
          <div
            className="pd-column-manager-row"
            key={f}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!all.includes(dragged.current) || dragged.current === f)
                return
              const next = all.filter((x) => x !== dragged.current)
              next.splice(next.indexOf(f), 0, dragged.current)
              p.setOrder(next)
              p.setPreset('Custom')
            }}
          >
            <button
              className="pd-column-drag"
              aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
              draggable
              aria-label={`Drag ${label(f)} column`}
              onDragStart={() => (dragged.current = f)}
              onKeyDown={(e) => {
                if (e.altKey && ['ArrowUp', 'ArrowDown'].includes(e.key)) {
                  e.preventDefault()
                  move(f, e.key === 'ArrowUp' ? -1 : 1)
                }
              }}
            >
              ⠿
            </button>
            <DrawCheckbox
              aria-label={`Show ${label(f)}`}
              checked={p.visible.includes(f as GridField)}
              onChange={(e) => {
                p.setVisible((old) =>
                  e.target.checked
                    ? [...old, f as GridField]
                    : old.filter((x) => x !== f),
                )
                p.setPreset('Custom')
              }}
            />
            <span>{label(f)}</span>
            <button
              aria-label={`Move ${label(f)} column earlier`}
              disabled={all[0] === f}
              onClick={() => move(f, -1)}
            >
              ↑
            </button>
            <button
              aria-label={`Move ${label(f)} column later`}
              disabled={all[all.length - 1] === f}
              onClick={() => move(f, 1)}
            >
              ↓
            </button>
          </div>
        ))}
    </Overlay>
  )
}
