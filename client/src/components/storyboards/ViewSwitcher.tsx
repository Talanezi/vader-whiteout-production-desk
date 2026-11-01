import { useRef, type CSSProperties } from 'react'
import Icon, { type IconName } from '../whiteout/Icon'
const modes = [
  { id: 'grid', label: 'Grid', icon: 'grid' },
  { id: 'split', label: 'Split', icon: 'columns' },
  { id: 'present', label: 'Present', icon: 'play' },
] as const
export default function ViewSwitcher({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null),
    index = Math.max(
      0,
      modes.findIndex((m) => m.id === value),
    )
  return (
    <div
      ref={ref}
      className="sb-view-switch"
      role="radiogroup"
      aria-label="Storyboard view"
      style={{ '--view-index': index } as CSSProperties}
      onKeyDown={(e) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
        e.preventDefault()
        const next =
          e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? 2
              : (index + (e.key === 'ArrowRight' ? 1 : 2)) % 3
        onChange(modes[next].id)
        ref.current?.querySelectorAll<HTMLButtonElement>('button')[next].focus()
      }}
    >
      <span className="sb-view-active" aria-hidden="true" />
      {modes.map((m) => (
        <button
          role="radio"
          aria-checked={value === m.id}
          tabIndex={value === m.id ? 0 : -1}
          key={m.id}
          onClick={() => onChange(m.id)}
        >
          <Icon name={m.icon as IconName} />
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  )
}
