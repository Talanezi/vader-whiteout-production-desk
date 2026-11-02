import { useDroppable } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import type * as Y from 'yjs'
import { activeCommentCounts } from '../../lib/storyboards/comments'
import { useToast } from '../whiteout/Feedback'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import CollaborativeText from '../shots/CollaborativeText'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import Menu from '../whiteout/Menu'
import { IconButton } from '../whiteout/Button'
import { StudioGlyph } from '../storyboards/StudioControls'
import {
  instruction,
  text,
  localParts,
  duration,
  type FlowEvent,
  type Department,
} from '../../lib/flow/model'
function Row({
  event,
  index,
  ...p
}: GridProps & { event: FlowEvent; index: number }) {
  const s = useSortable({
      id: event.id,
      index,
      group: 'flow-rows',
      type: p.scope,
      accept: p.scope,
      transition: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? null
        : { duration: 160 },
    }),
    source =
      event.sourceListId === p.listId
        ? p.shots?.get(event.shotId || '')
        : undefined,
    valid = source && !source.get('deleted'),
    label = valid ? String(source.get('number')) : event.reference || '',
    estimate = duration(event, valid ? source : undefined),
    comments = activeCommentCounts(p.doc).get(event.id) || 0

  return (
    <tr
      ref={s.ref}
      data-event={event.id}
      data-dragging={s.isDragging || undefined}
      className={`${event.type === 'milestone' ? 'flow-milestone' : ''} ${p.selected.has(event.id) ? 'is-selected' : ''} ${s.isDropTarget ? 'is-drop-target' : ''}`}
    >
      <td className="flow-time-cell" tabIndex={0} data-grid-cell>
        <div className="flow-time-content">
          <div className="flow-row-tools">
            <button
              ref={s.handleRef as never}
              aria-label={`Move ${event.description || label || 'event'}`}
              className="flow-grip"
            >
              ⠿
            </button>
            <DrawCheckbox
              aria-label={`Select ${event.description || label || 'event'}`}
              checked={p.selected.has(event.id)}
              onChange={(e) => p.onSelect(event.id, e.target.checked)}
            />
          </div>
          <button className="flow-time" onClick={() => p.onTime(event)}>
            {event.start ? localParts(event.start, p.zone).slice(11) : '—'}
            {event.start &&
              localParts(event.start, p.zone).slice(0, 10) !== p.date && (
                <small>{localParts(event.start, p.zone).slice(0, 10)}</small>
              )}
            {estimate != null && (
              <small>
                {estimate} min{event.duration == null ? ' ↗' : ''}
                {event.fixed ? ' · fixed' : ''}
              </small>
            )}
            {event.actualStart && (
              <small>
                Actual {localParts(event.actualStart, p.zone).slice(11)}
                {event.actualEnd ? ' · done' : ''}
              </small>
            )}
          </button>
        </div>
      </td>
      <td className="flow-action-cell" tabIndex={0} data-grid-cell>
        {event.type === 'shot' && (
          <button
            className={`flow-shot-ref ${!valid ? 'is-missing' : ''}`}
            onClick={() => p.onInspect(event)}
          >
            {label || 'Shot'}
            {p.events.filter(
              (e) =>
                e.shotId === event.shotId &&
                e.sourceListId === event.sourceListId,
            ).length > 1 && (
              <small>
                Occurrence{' '}
                {p.events
                  .filter(
                    (e) =>
                      e.shotId === event.shotId &&
                      e.sourceListId === event.sourceListId,
                  )
                  .findIndex((e) => e.id === event.id) + 1}{' '}
                of{' '}
                {
                  p.events.filter(
                    (e) =>
                      e.shotId === event.shotId &&
                      e.sourceListId === event.sourceListId,
                  ).length
                }
              </small>
            )}
            {!valid && <small>Source unavailable · relink</small>}
          </button>
        )}
        <CollaborativeText
          text={text(p.doc, 'events', event.id, 'description')}
          provider={p.provider}
          undo={p.undo}
          compact
          label={`Action ${label || index + 1}`}
        />
        {valid && (
          <p className="flow-shot-context">
            {String(source.get('subject') || '')}
            {source.get('coverage')
              ? ' · ' + String(source.get('coverage'))
              : ''}
          </p>
        )}
        <div className="flow-row-actions">
          {comments > 0 && (
            <button
              className="flow-comment"
              onClick={() => p.onInspect(event, 'comments')}
              aria-label={`${comments} active comment threads`}
            >
              <StudioGlyph name="comment" />
              {comments}
            </button>
          )}
          <Menu
            compact
            label={`Actions for event ${index + 1}`}
            items={[
              {
                value: 'inspect',
                label: 'Notes and details',
                onSelect: () => p.onInspect(event),
              },
              {
                value: 'time',
                label: 'Edit timing',
                onSelect: () => p.onTime(event),
              },
              {
                value: 'before',
                label: 'Insert before',
                onSelect: () => p.onInsert(event, 'before'),
              },
              {
                value: 'after',
                label: 'Insert after',
                onSelect: () => p.onInsert(event, 'after'),
              },
              {
                value: 'comment',
                label: 'Comments',
                onSelect: () => p.onInspect(event, 'comments'),
              },
              {
                value: 'delete',
                label: 'Delete',
                danger: true,
                onSelect: () => p.onDelete([event.id]),
              },
            ]}
          />
        </div>
      </td>
      {p.departments.map((d) => (
        <td key={d.id} tabIndex={0} data-grid-cell>
          <CollaborativeText
            text={instruction(p.doc, event.id, d.id)}
            provider={p.provider}
            undo={p.undo}
            compact
            label={`${d.name} · ${event.description || label || index + 1}`}
          />
        </td>
      ))}
    </tr>
  )
}
type GridProps = {
  doc: Y.Doc
  provider: HocuspocusProvider
  undo: Y.UndoManager
  events: FlowEvent[]
  departments: Department[]
  zone: string
  date: string
  scope: string
  listId: string
  shots?: Y.Map<Y.Map<unknown>>
  selected: Set<string>
  widths: Record<string, number>
  onWidth: (id: string, v: number) => void
  onSelect: (id: string, v: boolean) => void
  onAll: (v: boolean) => void
  onTime: (e: FlowEvent) => void
  onInspect: (e: FlowEvent, tab?: string) => void
  onDelete: (ids: string[]) => void
  onInsert: (e: FlowEvent, where: string) => void
}
export default function FlowGrid(p: GridProps) {
  const toast = useToast(),
    emptyDrop = useDroppable({
      id: 'flow:end',
      accept: p.scope,
      disabled: p.events.length > 0,
    })
  return (
    <div
      ref={emptyDrop.ref}
      className="flow-grid-scroll"
      onKeyDown={(e) => {
        const target = e.target as HTMLElement,
          cell = target.closest<HTMLTableCellElement>('td[data-grid-cell]')
        if (!cell) return
        const row = cell.parentElement as HTMLTableRowElement,
          body = row.parentElement!,
          ri = Array.from(body.children).indexOf(row),
          ci = cell.cellIndex,
          editing = !!target.closest('.cm-content')
        if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !editing) {
          e.preventDefault()
          e.shiftKey ? p.undo.redo() : p.undo.undo()
          return
        }
        if (e.key === 'Escape' && editing) {
          e.preventDefault()
          cell.focus()
          return
        }
        if (
          (editing && e.key === 'Tab') ||
          (!editing &&
            ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab'].includes(
              e.key,
            ))
        ) {
          if (target.closest('button,input') && !editing && e.key !== 'Tab')
            return
          let r = ri,
            c = ci
          if (e.key === 'ArrowUp') r--
          else if (e.key === 'ArrowDown') r++
          else c += e.key === 'ArrowLeft' || e.shiftKey ? -1 : 1
          if (c < 0) {
            r--
            c = p.departments.length + 1
          }
          if (c > p.departments.length + 1) {
            r++
            c = 0
          }
          const next = body.children[r]?.children[c] as HTMLElement | undefined
          if (next) {
            e.preventDefault()
            next.focus()
            next.scrollIntoView({ block: 'nearest', inline: 'nearest' })
          }
        }
        if (e.key === 'Enter' && !editing && target === cell) {
          e.preventDefault()
          cell
            .querySelector<HTMLButtonElement>('.pd-text-preview,.flow-time')
            ?.click()
        }
      }}
      onPaste={(e) => {
        const target = e.target as HTMLElement,
          cell = target.closest<HTMLTableCellElement>('td[data-grid-cell]')
        if (!cell) return
        const value = e.clipboardData.getData('text/plain')
        if (target.closest('.cm-content') && !value.includes('\t')) return
        const values = value
          .replace(/\r\n?/g, '\n')
          .replace(/\n$/, '')
          .split('\n')
          .map((r) => r.split('\t'))
        if (cell.cellIndex === 0) {
          toast(
            'Paste text into Current Action or a department cell. Use Event timing for schedule changes.',
            { state: 'error' },
          )
          return
        }
        const ri = Array.from(
            cell.parentElement!.parentElement!.children,
          ).indexOf(cell.parentElement!),
          ci = cell.cellIndex
        if (
          ri + values.length > p.events.length ||
          values.some((r) => ci + r.length > p.departments.length + 2) ||
          values.flat().some((v) => v.length > 30000)
        ) {
          e.preventDefault()
          toast(
            'The pasted area exceeds the available Flow cells or text limit.',
            { state: 'error' },
          )
          return
        }
        e.preventDefault()
        p.doc.transact(() =>
          values.forEach((row, r) =>
            row.forEach((value, c) => {
              const event = p.events[ri + r],
                index = ci + c,
                t =
                  index === 1
                    ? text(p.doc, 'events', event.id, 'description')
                    : instruction(p.doc, event.id, p.departments[index - 2].id)
              t.delete(0, t.length)
              t.insert(0, value)
            }),
          ),
        )
      }}
    >
      <table className="flow-grid" aria-label="Department Flow">
        <colgroup>
          <col style={{ width: 148 }} />
          <col style={{ width: 300 }} />
          {p.departments.map((d) => (
            <col key={d.id} style={{ width: p.widths[d.id] || 210 }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className="flow-time-cell">
              <div className="flow-time-content">
                <div className="flow-row-tools">
                  <span
                    className="flow-grip"
                    aria-hidden="true"
                    style={{ visibility: 'hidden' }}
                  >
                    ⠿
                  </span>
                  <DrawCheckbox
                    aria-label="Select all events"
                    checked={
                      p.events.length > 0 &&
                      p.events.every((e) => p.selected.has(e.id))
                    }
                    indeterminate={
                      p.events.some((e) => p.selected.has(e.id)) &&
                      !p.events.every((e) => p.selected.has(e.id))
                    }
                    onChange={(e) => p.onAll(e.target.checked)}
                  />
                </div>
                <span>Time</span>
              </div>
            </th>
            <th className="flow-action-cell">Current Action</th>
            {p.departments.map((d) => (
              <th key={d.id}>
                {d.group && (
                  <small className="flow-dept-group">{d.group}</small>
                )}
                <span>{d.name}</span>
                {d.personnel && <small>{d.personnel}</small>}
                <button
                  className="flow-col-resize"
                  aria-label={`Resize ${d.name}`}
                  onPointerDown={(e) => {
                    const target = e.currentTarget
                    target.setPointerCapture(e.pointerId)
                    const start = e.clientX,
                      initial = p.widths[d.id] || 210
                    target.onpointermove = (v) =>
                      p.onWidth(
                        d.id,
                        Math.max(
                          140,
                          Math.min(600, initial + v.clientX - start),
                        ),
                      )
                    target.onpointerup = () => {
                      target.onpointermove = null
                      target.onpointerup = null
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                      e.preventDefault()
                      p.onWidth(
                        d.id,
                        Math.max(
                          140,
                          Math.min(
                            600,
                            (p.widths[d.id] || 210) +
                              (e.key === 'ArrowRight' ? 10 : -10),
                          ),
                        ),
                      )
                    }
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {p.events.map((e, i) => (
            <Row key={e.id} {...p} event={e} index={i} />
          ))}
        </tbody>
      </table>
      {!p.events.length && (
        <div className="flow-empty">
          <StudioGlyph name="layers" />
          <h2>A clear start to the day</h2>
          <p>
            Add a production event or schedule shots from the connected rail.
          </p>
        </div>
      )}
    </div>
  )
}
