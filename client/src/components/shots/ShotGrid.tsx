import { useVirtualizer, defaultRangeExtractor } from '@tanstack/react-virtual'
import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type ColumnSizingState,
} from '@tanstack/react-table'
import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { useSortable, isSortable } from '@dnd-kit/react/sortable'
import { shotSensors } from './ShotDrag'
import * as Y from 'yjs'
import {
  fields,
  ordered,
  shotOperation,
  str,
  shots,
  scenes,
  addShot,
  narrativeFields,
  type ShotField,
  type RecordMap,
} from '../../lib/shotDocument'
import type { PrintView } from '../../lib/shotPrint'
import { moveRecords, validAssignments, days } from '../../lib/shotSchedule'
import {
  formatMatrix,
  parseMatrix,
  validateValue,
} from '../../lib/shotClipboard'
import {
  widths,
  presets,
  label,
  preferenceKey,
  readColumnPreferences,
  type GridField,
} from '../../lib/shotColumns'
import ColumnManager from './ColumnManager'
import { Button } from '../whiteout/Button'
import Combobox from '../whiteout/Combobox'

type Props = {
  undo: Y.UndoManager
  onPrintView: (view: PrintView) => void
  doc: Y.Doc
  rows: RecordMap[]
  cell: (s: RecordMap, f: ShotField) => ReactNode
  actions: (s: RecordMap, index: number) => ReactNode
  selected: string
  onSelect: (id: string) => void
  multi: Set<string>
  onMulti: (ids: Set<string>) => void
  planning: boolean
  filtered: boolean
  columnOpen: boolean
  onCloseColumns: () => void
  tableRef: RefObject<HTMLTableElement | null>
  onError: (message: string) => void
  user: number
  onAssign: () => void
}
function Row({
  record,
  index,
  disabled,
  children,
  selected,
  checked,
  onClick,
  measure,
  scope,
}: {
  record: RecordMap
  scope: string
  measure?: (node: HTMLTableRowElement | null) => void
  index: number
  disabled: boolean
  children: (handle: (el: Element | null) => void) => ReactNode
  selected: boolean
  checked: boolean
  onClick: (e: React.MouseEvent) => void
}) {
  const s = useSortable({
    id: str(record, 'id'),
    index,
    disabled,
    group: 'shots',
    type: scope,
    accept: scope,
    transition: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? null
      : { duration: 120 },
  })
  return (
    <tr
      ref={(node) => {
        s.ref(node)
        measure?.(node)
      }}
      data-index={index}
      aria-rowindex={index + 2}
      data-shot={str(record, 'id')}
      data-dragging={s.isDragging || undefined}
      data-settling={s.isDropping || undefined}
      className={`${selected ? 'is-selected' : ''} ${checked ? 'is-checked' : ''} ${s.isDropTarget ? 'is-drop-target' : ''}`}
      onClick={onClick}
    >
      {children(s.handleRef)}
    </tr>
  )
}
export default function ShotGrid(p: Props) {
  const storageKey = preferenceKey + '.' + p.user
  const initial = useMemo(() => readColumnPreferences(storageKey), [storageKey])
  const [preset, setPreset] = useState(initial?.preset || 'Essentials'),
    [visible, setVisible] = useState<GridField[]>(
      initial?.visible || presets.Essentials,
    ),
    [sizes, setSizes] = useState<ColumnSizingState>(initial?.sizes || {}),
    [order, setOrder] = useState<string[]>(
      initial?.order || [
        ...presets.Essentials,
        ...Object.keys(fields).filter(
          (f) => f !== 'number' && !presets.Essentials.includes(f as GridField),
        ),
      ],
    ),
    [dragged, setDragged] = useState(''),
    [bulkField, setBulkField] = useState<ShotField>('camera'),
    [bulkValue, setBulkValue] = useState('')
  const [active, setActive] = useState({ row: 0, col: 0 }),
    [anchor, setAnchor] = useState<{ row: number; col: number } | null>(null),
    [extent, setExtent] = useState<{ row: number; col: number } | null>(null)
  const dragIds = useRef<string[]>([])
  const [dragRevision, setDragRevision] = useState(0)
  const rows = dragged
    ? dragIds.current
        .map((id) => shots(p.doc).get(id))
        .filter(
          (record): record is RecordMap => !!record && !record.get('deleted'),
        )
    : p.rows
  const scroller = useRef<HTMLDivElement>(null),
    selectionAnchor = useRef<string>('')
  const windowed = rows.length > 250
  const virtual = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    enabled: windowed,
    getScrollElement: () => scroller.current,
    estimateSize: () => 80,
    overscan: 8,
    getItemKey: (index) => str(rows[index], 'id'),
    rangeExtractor: (range) => {
      const indices = defaultRangeExtractor(range),
        source = rows.findIndex((row) => str(row, 'id') === dragged)
      if (source >= 0) indices.push(source)
      if (active.row < rows.length) indices.push(active.row)
      return [...new Set(indices)].sort((a, b) => a - b)
    },
  })
  const windowRows = windowed
    ? virtual.getVirtualItems()
    : rows.map((row, index) => ({
        index,
        key: str(row, 'id'),
        start: 0,
        end: 0,
      }))
  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const wheel = (event: WheelEvent) => {
      if (event.shiftKey && !event.deltaX) {
        event.preventDefault()
        element.scrollLeft +=
          event.deltaY *
          (event.deltaMode === 1
            ? 16
            : event.deltaMode === 2
              ? element.clientWidth
              : 1)
      }
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [])
  const shown: GridField[] = [
    'number',
    ...(order.filter((f) => visible.includes(f as GridField)) as GridField[]),
    ...visible.filter((f) => !order.includes(f)),
  ]
  const defs = useMemo<ColumnDef<RecordMap>[]>(
    () =>
      Object.keys(widths).map((id) => ({
        id,
        accessorFn: (r) => str(r, id),
        size: widths[id as GridField],
        minSize: id === 'coverage' || /Notes|notes/.test(id) ? 180 : 80,
        maxSize: id === 'coverage' || /Notes|notes/.test(id) ? 760 : 400,
      })),
    [],
  )
  const table = useReactTable({
    data: rows,
    columns: defs,
    getCoreRowModel: getCoreRowModel(),
    state: {
      columnSizing: sizes,
      columnOrder: ['number', ...order],
      columnPinning: { left: ['number'] },
      columnVisibility: Object.fromEntries(
        Object.keys(widths).map((f) => [f, shown.includes(f as GridField)]),
      ),
    },
    columnResizeMode: 'onChange',
    onColumnSizingChange: setSizes,
  })
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ preset, visible, sizes, order }),
      )
    } catch {}
  }, [preset, visible, sizes, order])
  const size = (f: GridField) => table.getColumn(f)!.getSize()
  function applyPreset(name: string) {
    setPreset(name)
    if (presets[name]) {
      setVisible(presets[name])
      setOrder([
        ...presets[name],
        ...Object.keys(fields).filter(
          (f) => f !== 'number' && !presets[name].includes(f as GridField),
        ),
      ])
    }
    setAnchor(null)
    setExtent(null)
  }
  function selectedRecords() {
    const records = ordered(
      shots(p.doc),
      p.planning ? 'planningOrder' : 'order',
    ).filter((record) => p.multi.has(str(record, 'id')))
    if (!p.planning) {
      const positions = new Map(
        ordered(scenes(p.doc)).map((scene, index) => [str(scene, 'id'), index]),
      )
      records.sort(
        (a, b) =>
          (positions.get(str(a, 'sceneId')) || 0) -
            (positions.get(str(b, 'sceneId')) || 0) ||
          Number(a.get('order')) - Number(b.get('order')) ||
          str(a, 'id').localeCompare(str(b, 'id')),
      )
    }
    return records
  }
  const scheduleIndex = useMemo(() => {
    const result = new Map<
      string,
      { dates: Set<string>; count: number; statuses: Set<string> }
    >()
    for (const assignment of validAssignments(p.doc)) {
      const id = str(assignment, 'shotId'),
        summary = result.get(id) || {
          dates: new Set<string>(),
          count: 0,
          statuses: new Set<string>(),
        }
      summary.count++
      summary.dates.add(str(days(p.doc).get(str(assignment, 'dayId')), 'date'))
      summary.statuses.add(str(assignment, 'status'))
      result.set(id, summary)
    }
    return result
  }, [p.rows])
  const valueFor = (record: RecordMap, field: GridField) => {
    const summary = scheduleIndex.get(str(record, 'id'))
    return field === 'scene'
      ? str(scenes(p.doc).get(str(record, 'sceneId')), 'number')
      : field === 'shootDates'
        ? summary
          ? [...summary.dates].sort().join(', ')
          : 'Not scheduled'
        : field === 'assignmentCount'
          ? String(summary?.count || 0)
          : field === 'scheduleStatus'
            ? [...(summary?.statuses || [])].filter(Boolean).join(', ')
            : str(record, field)
  }
  useEffect(() => {
    setActive((old) => ({
      row: Math.max(0, Math.min(old.row, rows.length - 1)),
      col: Math.max(0, Math.min(old.col, shown.length - 1)),
    }))
    if (
      (anchor && (anchor.row >= rows.length || anchor.col >= shown.length)) ||
      (extent && (extent.row >= rows.length || extent.col >= shown.length))
    ) {
      setAnchor(null)
      setExtent(null)
    }
    const valid = new Set(
      [...p.multi].filter(
        (id) => shots(p.doc).has(id) && !shots(p.doc).get(id)?.get('deleted'),
      ),
    )
    if (valid.size !== p.multi.size) p.onMulti(valid)
  }, [rows.length, shown.length])
  function edit(record: RecordMap, field: ShotField, value: string) {
    if (narrativeFields.includes(field)) {
      const text = record.get(field) as Y.Text
      text.delete(0, text.length)
      text.insert(0, value)
    } else record.set(field, value)
  }
  function selectRow(e: React.MouseEvent, record: RecordMap) {
    const id = str(record, 'id')
    p.onSelect(id)
    if (
      (e.target as HTMLElement).closest(
        'input,button,textarea,[contenteditable=true]',
      )
    )
      return
    if (
      (e.target as HTMLElement).closest('[data-grid-col]') &&
      !e.metaKey &&
      !e.ctrlKey
    )
      return
    let next = new Set(p.multi)
    if (e.shiftKey && selectionAnchor.current) {
      const a = rows.findIndex((s) => str(s, 'id') === selectionAnchor.current),
        b = rows.indexOf(record)
      rows
        .slice(Math.min(a, b), Math.max(a, b) + 1)
        .forEach((s) => next.add(str(s, 'id')))
    } else if (e.metaKey || e.ctrlKey) {
      next.has(id) ? next.delete(id) : next.add(id)
    } else {
      next = new Set([id])
      selectionAnchor.current = id
    }
    p.onMulti(next)
  }
  function focus(row: number, col: number) {
    const next = {
      row: Math.max(0, Math.min(rows.length - 1, row)),
      col: Math.max(0, Math.min(shown.length - 1, col)),
    }
    setActive(next)
    if (windowed) virtual.scrollToIndex(next.row, { align: 'auto' })
    requestAnimationFrame(() => {
      const target = p.tableRef.current?.querySelector<HTMLElement>(
        `[data-grid-row="${next.row}"][data-grid-col="${next.col}"]`,
      )
      target?.focus()
      target?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
  }
  function matrix() {
    const a = anchor || active,
      b = extent || active
    return rows
      .slice(Math.min(a.row, b.row), Math.max(a.row, b.row) + 1)
      .map((s) =>
        shown
          .slice(Math.min(a.col, b.col), Math.max(a.col, b.col) + 1)
          .map((f) => valueFor(s, f)),
      )
  }
  function paste(text: string, start = active) {
    const values = parseMatrix(text),
      changes: { record: RecordMap; field: ShotField; value: string }[] = []
    for (let y = 0; y < values.length; y++)
      for (let x = 0; x < values[y].length; x++) {
        const record = rows[start.row + y],
          field = shown[start.col + x],
          value = values[y][x]
        if (!record || !field)
          throw Error(
            'Paste exceeds the visible table. Add rows/columns first.',
          )
        if (!Object.prototype.hasOwnProperty.call(fields, field))
          throw Error(
            'This field is derived. Use the inspector or Shoot days to change it.',
          )
        try {
          validateValue(field as ShotField, value)
        } catch (e) {
          throw Error(
            `Row ${start.row + y + 1}, ${label(field)}: ${(e as Error).message}`,
          )
        }
        changes.push({ record, field: field as ShotField, value })
      }
    if (
      changes.reduce(
        (size, c) => size + new TextEncoder().encode(c.value).byteLength + 128,
        0,
      ) > 1_500_000
    )
      throw Error(
        'This paste exceeds the collaboration message budget. Paste fewer rows at a time.',
      )
    shotOperation(
      p.doc,
      () => changes.forEach((c) => edit(c.record, c.field, c.value)),
      'local',
    )
  }
  function key(e: React.KeyboardEvent) {
    const target = e.target as HTMLElement,
      editing =
        target.matches('input,textarea,[contenteditable=true]') ||
        !!target.closest(
          '[role=combobox],[role=menu],[role=listbox],.cm-editor',
        )
    if (editing) {
      if (
        e.key === 'Enter' &&
        target.matches('input') &&
        !target.closest('[role=combobox],.cm-editor')
      ) {
        e.preventDefault()
        focus(active.row + (e.shiftKey ? -1 : 1), active.col)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        focus(active.row, active.col)
      }
      return
    }
    if (!target.matches('[data-grid-col]')) return
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      e.preventDefault()
      navigator.clipboard
        .writeText(formatMatrix(matrix()))
        .catch(() => p.onError('Clipboard unavailable.'))
      return
    }
    if ((e.ctrlKey || e.metaKey) && ['z', 'y'].includes(e.key.toLowerCase())) {
      e.preventDefault()
      if (e.key.toLowerCase() === 'y' || e.shiftKey) p.undo.redo()
      else p.undo.undo()
      return
    }
    let { row, col } = active
    if (e.key === 'ArrowDown') row++
    else if (e.key === 'ArrowUp') row--
    else if (e.key === 'ArrowLeft') col--
    else if (e.key === 'ArrowRight') col++
    else if (e.key === 'Tab') {
      col += e.shiftKey ? -1 : 1
      if (col >= shown.length) {
        col = 0
        row++
      }
      if (col < 0) {
        col = shown.length - 1
        row--
      }
      while (!Object.prototype.hasOwnProperty.call(fields, shown[col])) {
        col += e.shiftKey ? -1 : 1
        if (col >= shown.length) {
          col = 0
          row++
        }
        if (col < 0) {
          col = shown.length - 1
          row--
        }
      }
      if (row < 0 || row >= rows.length) {
        e.preventDefault()
        const root = scroller.current!,
          outside = [
            ...document.querySelectorAll<HTMLElement>(
              'a[href],button,input:not([type=hidden]),textarea,select,[tabindex]',
            ),
          ].filter(
            (element) =>
              !root.contains(element) &&
              !element.matches(':disabled,[tabindex="-1"]') &&
              !element.closest('[inert]') &&
              element.getClientRects().length > 0,
          ),
          next = e.shiftKey
            ? [...outside]
                .reverse()
                .find(
                  (element) =>
                    root.compareDocumentPosition(element) &
                    Node.DOCUMENT_POSITION_PRECEDING,
                )
            : outside.find(
                (element) =>
                  root.compareDocumentPosition(element) &
                  Node.DOCUMENT_POSITION_FOLLOWING,
              )
        ;(
          next || (e.shiftKey ? outside[outside.length - 1] : outside[0])
        )?.focus()
        return
      }
    } else if (e.key === 'Home') {
      col = 0
      if (e.ctrlKey || e.metaKey) row = 0
    } else if (e.key === 'End') {
      col = shown.length - 1
      if (e.ctrlKey || e.metaKey) row = rows.length - 1
    } else if (e.key === 'PageDown') row += 10
    else if (e.key === 'PageUp') row -= 10
    else if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault()
      target
        .querySelector<HTMLElement>('input,button,[contenteditable=true]')
        ?.focus()
      return
    } else if (e.key === 'Escape') {
      setAnchor(null)
      setExtent(null)
      return
    } else return
    e.preventDefault()
    if (e.shiftKey && e.key !== 'Tab') {
      if (!anchor) setAnchor(active)
      setExtent({
        row: Math.max(0, Math.min(row, rows.length - 1)),
        col: Math.max(0, Math.min(col, shown.length - 1)),
      })
    } else {
      setAnchor(null)
      setExtent(null)
    }
    focus(row, col)
  }
  useEffect(() => {
    const area =
      anchor && extent
        ? {
            rows: rows
              .slice(
                Math.min(anchor.row, extent.row),
                Math.max(anchor.row, extent.row) + 1,
              )
              .map((row) => ({ shotId: str(row, 'id') })),
            columns: shown
              .slice(
                Math.min(anchor.col, extent.col),
                Math.max(anchor.col, extent.col) + 1,
              )
              .map((field) => ({ field, width: size(field) })),
            label: `Rows ${Math.min(anchor.row, extent.row) + 1}–${Math.max(anchor.row, extent.row) + 1} · ${label(shown[Math.min(anchor.col, extent.col)])} → ${label(shown[Math.max(anchor.col, extent.col)])}`,
          }
        : undefined
    p.onPrintView({
      label: p.planning ? 'Planning Order' : 'Shot List view',
      rows: rows.map((row) => ({ shotId: str(row, 'id') })),
      columns: shown.map((field) => ({ field, width: size(field) })),
      area,
      groupScenes: !p.planning,
    })
  }, [rows, shown.join(','), sizes, anchor, extent, p.planning])
  const total = 52 + 100 + shown.reduce((sum, f) => sum + size(f), 0)
  return (
    <>
      <div className="pd-grid-layout-tools">
        <Combobox
          label="Grid preset"
          value={preset}
          options={[...Object.keys(presets), 'Custom']}
          custom={false}
          clearable={false}
          onChange={applyPreset}
        />
        <span>Scroll horizontally for more fields ↔</span>
      </div>
      {p.multi.size > 0 && (
        <div className="pd-shot-selection">
          <span>{p.multi.size} selected</span>
          <Button
            onClick={() =>
              navigator.clipboard
                .writeText(
                  formatMatrix(
                    selectedRecords().map((s) =>
                      shown.map((f) => valueFor(s, f)),
                    ),
                  ),
                )
                .catch(() => p.onError('Clipboard unavailable.'))
            }
          >
            Copy selected
          </Button>
          <Button
            onClick={() =>
              shotOperation(
                p.doc,
                () =>
                  selectedRecords().forEach((s) =>
                    addShot(p.doc, str(s, 'sceneId'), p.user, s),
                  ),
                'local',
              )
            }
          >
            Duplicate selected
          </Button>
          <Combobox
            label="Bulk field"
            labels={fields}
            value={bulkField}
            options={Object.keys(fields)}
            onChange={(v) => setBulkField(v as ShotField)}
            custom={false}
          />
          <input
            aria-label="Bulk value"
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
          />
          <Button
            onClick={() => {
              try {
                validateValue(bulkField, bulkValue)
                if (
                  bulkValue === '' &&
                  !confirm('Clear the selected field on all selected shots?')
                )
                  return
                shotOperation(
                  p.doc,
                  () =>
                    selectedRecords().forEach((s) =>
                      edit(s, bulkField, bulkValue),
                    ),
                  'local',
                )
              } catch (e) {
                p.onError((e as Error).message)
              }
            }}
          >
            Apply
          </Button>
          <Button onClick={p.onAssign}>Assign day</Button>
          <Button onClick={() => p.onMulti(new Set())}>Clear</Button>
        </div>
      )}
      <div
        ref={scroller}
        className="pd-shot-table-scroll pd-pro-grid"
        onKeyDown={key}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text/plain'),
            target = e.target as HTMLElement,
            td = target.closest<HTMLElement>('[data-grid-col]')
          if (
            !td ||
            (!target.matches('[data-grid-col]') && !text.includes('\t'))
          )
            return
          e.preventDefault()
          try {
            paste(text, {
              row: Number(td.dataset.gridRow),
              col: Number(td.dataset.gridCol),
            })
          } catch (error) {
            p.onError((error as Error).message)
          }
        }}
      >
        <DragDropProvider
          sensors={shotSensors}
          onDragStart={(e) => {
            dragIds.current = rows.map((row) => str(row, 'id'))
            setDragged(String(e.operation.source?.id || ''))
          }}
          onDragEnd={(e) => {
            const operation = e.operation,
              sortable = operation.source
            setDragged('')
            const reset = () => {
              setDragRevision((value) => value + 1)
            }
            if (e.canceled) return
            if (!isSortable(sortable) || !operation.target) {
              reset()
              return
            }
            if (!(operation.activatorEvent instanceof KeyboardEvent)) {
              const rect = scroller.current?.getBoundingClientRect(),
                point = operation.position.current
              if (
                rect &&
                (point.x < rect.left ||
                  point.x > rect.right ||
                  point.y < rect.top ||
                  point.y > rect.bottom)
              ) {
                reset()
                return
              }
            }
            const source = shots(p.doc).get(String(sortable.id)),
              target = shots(p.doc).get(dragIds.current[sortable.index])
            if (
              !source ||
              !target ||
              p.filtered ||
              sortable.index === sortable.initialIndex
            ) {
              reset()
              return
            }
            const scope = p.planning
              ? p.rows
              : p.rows.filter(
                  (row) => str(row, 'sceneId') === str(source, 'sceneId'),
                )
            if (!scope.includes(target)) {
              p.onError('Use Move to scene to change a shot’s scene.')
              reset()
              return
            }
            const moving = p.multi.has(str(source, 'id'))
              ? scope
                  .filter((row) => p.multi.has(str(row, 'id')))
                  .map((row) => str(row, 'id'))
              : [str(source, 'id')]
            if (
              p.multi.has(str(source, 'id')) &&
              moving.length !== p.multi.size
            ) {
              p.onError(
                'Select shots in one scene, or switch to Planning Order to move them together.',
              )
              reset()
              return
            }
            moveRecords(
              p.doc,
              scope,
              moving,
              str(target, 'id'),
              p.planning ? 'planningOrder' : 'order',
              str(source, 'id'),
            )
          }}
        >
          <table
            ref={p.tableRef}
            className="pd-shot-table pd-pro-table"
            style={{ width: total, minWidth: total, tableLayout: 'fixed' }}
            role="grid"
            aria-label="Shot list grid"
            aria-rowcount={rows.length + 1}
          >
            <colgroup>
              <col style={{ width: 52 }} />
              {shown.map((f) => (
                <col key={f} style={{ width: size(f) }} />
              ))}
              <col style={{ width: 100 }} />
            </colgroup>
            <thead>
              <tr>
                <th className="pd-pin-grip">
                  <input
                    type="checkbox"
                    aria-label="Select all visible shots"
                    checked={
                      rows.length > 0 &&
                      rows.every((s) => p.multi.has(str(s, 'id')))
                    }
                    onChange={(e) =>
                      p.onMulti(
                        new Set(
                          e.target.checked ? rows.map((s) => str(s, 'id')) : [],
                        ),
                      )
                    }
                  />
                </th>
                {shown.map((f) => (
                  <th key={f} className={f === 'number' ? 'pd-pin-number' : ''}>
                    <span>{label(f)}</span>
                    <button
                      className="pd-column-resize"
                      aria-label={`Resize ${label(f)}`}
                      role="separator"
                      aria-orientation="vertical"
                      aria-valuenow={size(f)}
                      tabIndex={0}
                      onPointerDown={(e) => {
                        const start = e.clientX,
                          base = size(f),
                          el = e.currentTarget
                        el.setPointerCapture(e.pointerId)
                        const move = (event: PointerEvent) => {
                          setPreset('Custom')
                          setSizes((old) => ({
                            ...old,
                            [f]: Math.max(
                              table.getColumn(f)!.columnDef.minSize!,
                              Math.min(760, base + event.clientX - start),
                            ),
                          }))
                        }
                        const end = () => {
                          el.removeEventListener('pointermove', move)
                          el.removeEventListener('pointerup', end)
                        }
                        el.addEventListener('pointermove', move)
                        el.addEventListener('pointerup', end)
                      }}
                      onKeyDown={(e) => {
                        if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
                          e.preventDefault()
                          setSizes((old) => ({
                            ...old,
                            [f]: Math.max(
                              80,
                              Math.min(
                                760,
                                size(f) + (e.key === 'ArrowRight' ? 16 : -16),
                              ),
                            ),
                          }))
                        }
                      }}
                      onDoubleClick={() => {
                        const canvas = document.createElement('canvas'),
                          ctx = canvas.getContext('2d')!
                        ctx.font = '12px Inter, sans-serif'
                        const measure = Math.max(
                          ctx.measureText(label(f)).width,
                          ...rows.slice(0, 500).map((s) =>
                            Math.max(
                              ...str(s, f)
                                .split('\n')
                                .map((line) => ctx.measureText(line).width),
                            ),
                          ),
                        )
                        setSizes((old) => ({
                          ...old,
                          [f]: Math.max(
                            widths[f] * 0.7,
                            Math.min(
                              f === 'coverage' || f === 'notes' ? 640 : 360,
                              measure + 48,
                            ),
                          ),
                        }))
                      }}
                      title="Drag to resize · double-click to fit"
                    />
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody key={dragRevision}>
              {windowRows.map((item, windowIndex) => {
                const index = item.index,
                  record = rows[index],
                  previous = windowRows[windowIndex - 1],
                  gap = windowed ? item.start - (previous?.end || 0) : 0
                return (
                  <Fragment key={str(record, 'id')}>
                    {gap > 0 && (
                      <tr aria-hidden="true" className="pd-grid-spacer">
                        <td
                          colSpan={shown.length + 2}
                          style={{ height: gap, padding: 0, border: 0 }}
                        />
                      </tr>
                    )}
                    <Row
                      scope={p.planning ? 'planning' : str(record, 'sceneId')}
                      measure={windowed ? virtual.measureElement : undefined}
                      key={str(record, 'id')}
                      record={record}
                      index={index}
                      disabled={p.filtered}
                      selected={p.selected === str(record, 'id')}
                      checked={p.multi.has(str(record, 'id'))}
                      onClick={(e) => selectRow(e, record)}
                    >
                      {(handle) => (
                        <>
                          <td className="pd-pin-grip">
                            <button
                              ref={handle}
                              className="pd-row-grip"
                              aria-label={`Reorder shot ${str(record, 'number')}`}
                              disabled={p.filtered}
                              title={
                                p.filtered
                                  ? 'Clear search before dragging'
                                  : 'Drag to reorder; Space and arrows for keyboard'
                              }
                            >
                              ⠿
                            </button>
                            <input
                              type="checkbox"
                              aria-label={`Select shot ${str(record, 'number')}`}
                              checked={p.multi.has(str(record, 'id'))}
                              onChange={(e) => {
                                const next = new Set(p.multi)
                                if (
                                  (e.nativeEvent as MouseEvent).shiftKey &&
                                  selectionAnchor.current
                                ) {
                                  const start = rows.findIndex(
                                      (row) =>
                                        str(row, 'id') ===
                                        selectionAnchor.current,
                                    ),
                                    end = rows.indexOf(record)
                                  rows
                                    .slice(
                                      Math.min(start, end),
                                      Math.max(start, end) + 1,
                                    )
                                    .forEach((row) => next.add(str(row, 'id')))
                                  p.onMulti(next)
                                  return
                                }
                                selectionAnchor.current = str(record, 'id')
                                e.target.checked
                                  ? next.add(str(record, 'id'))
                                  : next.delete(str(record, 'id'))
                                p.onMulti(next)
                              }}
                            />
                          </td>
                          {shown.map((f, col) => {
                            const range =
                              anchor &&
                              extent &&
                              index >= Math.min(anchor.row, extent.row) &&
                              index <= Math.max(anchor.row, extent.row) &&
                              col >= Math.min(anchor.col, extent.col) &&
                              col <= Math.max(anchor.col, extent.col)
                            return (
                              <td
                                key={f}
                                data-grid-row={index}
                                data-grid-col={col}
                                role="gridcell"
                                tabIndex={
                                  active.row === index && active.col === col
                                    ? 0
                                    : -1
                                }
                                className={`${f === 'number' ? 'pd-pin-number' : ''} ${range ? 'is-cell-range' : ''}`}
                                onFocus={() => setActive({ row: index, col })}
                                onClick={(e) => {
                                  if (e.target === e.currentTarget) {
                                    setActive({ row: index, col })
                                    e.currentTarget.focus()
                                  }
                                }}
                                onMouseDown={(e) => {
                                  if (e.shiftKey) {
                                    e.preventDefault()
                                    if (!anchor) setAnchor(active)
                                    setExtent({ row: index, col })
                                    focus(index, col)
                                  }
                                }}
                                onDoubleClick={(e) =>
                                  e.currentTarget
                                    .querySelector<HTMLElement>(
                                      'input,button,[contenteditable=true]',
                                    )
                                    ?.focus()
                                }
                              >
                                {Object.prototype.hasOwnProperty.call(
                                  fields,
                                  f,
                                ) ? (
                                  p.cell(record, f as ShotField)
                                ) : (
                                  <span className="pd-derived-cell">
                                    {valueFor(record, f) || '—'}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                          <td className="pd-shot-actions">
                            {p.actions(record, index)}
                          </td>
                        </>
                      )}
                    </Row>
                  </Fragment>
                )
              })}
              {windowed && windowRows.length > 0 && (
                <tr aria-hidden="true" className="pd-grid-spacer">
                  <td
                    colSpan={shown.length + 2}
                    style={{
                      height: Math.max(
                        0,
                        virtual.getTotalSize() -
                          (windowRows[windowRows.length - 1]?.end || 0),
                      ),
                      padding: 0,
                      border: 0,
                    }}
                  />
                </tr>
              )}
            </tbody>
          </table>
          <DragOverlay
            dropAnimation={
              matchMedia('(prefers-reduced-motion: reduce)').matches
                ? null
                : { duration: 120 }
            }
          >
            <div className="pd-drag-preview">
              Moving {p.multi.has(dragged) ? p.multi.size : 1} shot
              {p.multi.has(dragged) && p.multi.size > 1 ? 's' : ''} ·{' '}
              {str(shots(p.doc).get(dragged), 'number')}
            </div>
          </DragOverlay>
        </DragDropProvider>
      </div>
      {p.columnOpen && (
        <ColumnManager
          preset={preset}
          applyPreset={applyPreset}
          visible={visible}
          setVisible={setVisible}
          order={order}
          setOrder={setOrder}
          setPreset={setPreset}
          setSizes={setSizes}
          onClose={p.onCloseColumns}
        />
      )}
    </>
  )
}
