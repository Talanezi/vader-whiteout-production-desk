import { StudioGlyph } from './StudioControls'

export default function CommentIndicator({
  count,
  label,
  onOpen,
  floating = false,
}: {
  count: number
  label: string
  onOpen: () => void
  floating?: boolean
}) {
  if (!count) return null
  const description = `${count} active comment${count === 1 ? '' : 's'}`
  return (
    <button
      type="button"
      className={`sb-comment-indicator ${floating ? 'is-floating' : ''}`}
      aria-label={`Open ${description} for ${label}`}
      title={description}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
    >
      <StudioGlyph name="comment" />
      <span className="sb-comment-count">{count}</span>
      <span className="sb-comment-tip" aria-hidden="true">
        {description}
      </span>
    </button>
  )
}
