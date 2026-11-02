import { useSortable } from '@dnd-kit/react/sortable'
import type { ReactNode } from 'react'
export default function SortableFile({
  id,
  index,
  children,
}: {
  id: string
  index: number
  children: ReactNode
}) {
  const s = useSortable({
    id,
    index,
    group: 'import-files',
    transition: matchMedia('(prefers-reduced-motion:reduce)').matches
      ? null
      : { duration: 180 },
  })
  return (
    <li ref={s.ref}>
      <button
        ref={s.handleRef as never}
        className="sb-sequence-grip"
        aria-label={`Move file ${index + 1}`}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path d="M6 4h2v2H6zM12 4h2v2h-2zM6 9h2v2H6zM12 9h2v2h-2zM6 14h2v2H6zM12 14h2v2h-2z" />
        </svg>
      </button>
      {children}
    </li>
  )
}
