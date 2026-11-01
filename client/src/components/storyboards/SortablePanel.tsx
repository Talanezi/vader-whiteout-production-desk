import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
export default function SortablePanel({
  id,
  index,
  scope,
  selected,
  disabled,
  children,
}: {
  id: string
  index: number
  scope: string
  selected: boolean
  disabled: boolean
  children: (handle: (el: Element | null) => void) => ReactNode
}) {
  const s = useSortable({
    id,
    index,
    group: 'storyboard-panels',
    type: scope,
    accept: scope,
    disabled,
    transition: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? null
      : { duration: 120 },
  })
  return (
    <article
      ref={s.ref}
      data-panel={id}
      data-dragging={s.isDragging || undefined}
      className={`sb-panel-card ${selected ? 'is-selected' : ''} ${s.isDropTarget ? 'is-drop-target' : ''}`}
    >
      {children(s.handleRef)}
    </article>
  )
}
