import {
  useState,
  useRef,
  useLayoutEffect,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
export default function NameTooltip({
  name,
  color,
  children,
}: {
  name: string
  color: string
  children: ReactNode
}) {
  const ref = useRef<HTMLSpanElement>(null),
    [open, setOpen] = useState(false),
    [position, setPosition] = useState<CSSProperties>({ visibility: 'hidden' })
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const a = ref.current!.getBoundingClientRect(),
        width = Math.min(
          window.innerWidth - 24,
          Math.max(100, name.length * 7 + 24),
        )
      setPosition({
        position: 'fixed',
        top: a.bottom + 7,
        left: Math.max(
          12,
          Math.min(
            a.left + a.width / 2 - width / 2,
            window.innerWidth - width - 12,
          ),
        ),
        width,
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, name])
  return (
    <>
      <span
        ref={ref}
        className="pd-avatar"
        style={{ '--peer-color': color } as CSSProperties}
        aria-label={name}
        tabIndex={0}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
      >
        {children}
      </span>
      {open &&
        createPortal(
          <span className="pd-name-tooltip" role="tooltip" style={position}>
            {name}
          </span>,
          document.body,
        )}
    </>
  )
}
