import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import Icon, { type IconName } from './Icon'
export type MenuItem = {
  value: string
  label: string
  icon?: IconName
  danger?: boolean
  disabled?: boolean
  onSelect?: () => void
}
type Props = {
  label: string
  ariaLabel?: string
  items: MenuItem[]
  value?: string
  icon?: IconName
  compact?: boolean
  disabled?: boolean
  onChange?: (value: string) => void
  width?: number
  portal?: boolean
}
/** Independent origin-aware menu, with collision handling and full keyboard input. */
export default function Menu({
  label,
  ariaLabel,
  items,
  value,
  icon,
  compact,
  disabled,
  onChange,
  portal = true,
  width: desiredWidth,
}: Props) {
  const [phase, setPhase] = useState<'closed' | 'open' | 'leaving'>('closed')
  const [position, setPosition] = useState<CSSProperties>({
    visibility: 'hidden',
  })
  const [origin, setOrigin] = useState('top right')
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null),
    id = useId()
  const initial = useRef(0),
    pendingFocus = useRef(false),
    buffer = useRef(''),
    lastKey = useRef(0)
  const mounted = phase !== 'closed'
  const available = () =>
    Array.from(
      panel.current?.querySelectorAll<HTMLButtonElement>(
        '[role^="menuitem"]:not(:disabled)',
      ) || [],
    )
  function close(restore = true) {
    setPhase('leaving')
    if (restore) trigger.current?.focus()
  }
  useEffect(() => {
    if (phase === 'leaving') {
      const timer = window.setTimeout(
        () => setPhase('closed'),
        matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150,
      )
      return () => clearTimeout(timer)
    }
  }, [phase])
  useLayoutEffect(() => {
    if (!mounted) return
    function place() {
      const a = trigger.current?.getBoundingClientRect(),
        p = panel.current
      if (!a || !p) return
      const height = Math.min(p.scrollHeight, window.innerHeight - 24),
        width = Math.min(
          desiredWidth || (compact ? 208 : items.length > 4 ? 228 : 208),
          window.innerWidth - 24,
        )
      const above =
        window.innerHeight - a.bottom < height + 12 && a.top > height + 12
      const left = Math.max(
        12,
        Math.min(
          window.innerWidth - width - 12,
          compact ? a.right - width : a.left,
        ),
      )
      const top = Math.max(
        12,
        Math.min(
          window.innerHeight - height - 12,
          above ? a.top - height - 7 : a.bottom + 7,
        ),
      )
      if (portal)
        setPosition({
          position: 'fixed',
          left,
          top,
          width,
          maxHeight: window.innerHeight - 24,
        })
      else
        setPosition({
          position: 'absolute',
          left: 0,
          top: 'calc(100% + 6px)',
          width: '100%',
          maxHeight: 220,
        })
      setOrigin(`${above ? 'bottom' : 'top'} ${compact ? 'right' : 'left'}`)
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [mounted, phase, portal, compact, desiredWidth, items.length])
  // Position first, then focus: hidden elements cannot receive focus on the
  // first opening. This also keeps focus inside a native modal's top layer.
  useLayoutEffect(() => {
    if (
      phase === 'open' &&
      pendingFocus.current &&
      position.visibility !== 'hidden'
    ) {
      available()[initial.current]?.focus()
      pendingFocus.current = false
    }
  }, [phase, position])
  useEffect(() => {
    if (phase !== 'open') return
    const outside = (e: PointerEvent) => {
      if (
        !panel.current?.contains(e.target as Node) &&
        !trigger.current?.contains(e.target as Node)
      )
        close(false)
    }
    const focusOut = (e: FocusEvent) => {
      if (
        !panel.current?.contains(e.target as Node) &&
        !trigger.current?.contains(e.target as Node)
      )
        close(false)
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', focusOut)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', focusOut)
    }
  }, [phase])
  function open(last = false) {
    pendingFocus.current = true
    buffer.current = ''
    lastKey.current = 0
    initial.current = last
      ? items.filter((x) => !x.disabled).length - 1
      : Math.max(
          0,
          items.filter((x) => !x.disabled).findIndex((x) => x.value === value),
        )
    setPhase('open')
  }
  const content = (
    <div
      ref={panel}
      id={id}
      className={`pd-ui pd-menu pd-menu-${phase}`}
      style={
        {
          ...position,
          transformOrigin: origin,
          '--pd-menu-offset': origin.startsWith('bottom') ? '5px' : '-5px',
        } as CSSProperties
      }
      role="menu"
      aria-hidden={phase !== 'open' || undefined}
      aria-label={label}
      onKeyDown={(e) => {
        const controls = available(),
          index = controls.indexOf(document.activeElement as HTMLButtonElement)
        if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          close()
          return
        }
        if (e.key === 'Tab') {
          e.preventDefault()
          close()
          const all = Array.from(
            (
              trigger.current?.closest('dialog') || document
            ).querySelectorAll<HTMLElement>(
              'a[href],button,input,textarea,select,[tabindex="0"]',
            ),
          ).filter(
            (n) =>
              n.getClientRects().length &&
              !panel.current?.contains(n) &&
              !n.hasAttribute('disabled'),
          )
          const next = all.indexOf(trigger.current!) + (e.shiftKey ? -1 : 1)
          all[next]?.focus()
          return
        }
        let next = index
        if (e.key === 'ArrowDown') next = (index + 1) % controls.length
        else if (e.key === 'ArrowUp')
          next = (index - 1 + controls.length) % controls.length
        else if (e.key === 'Home') next = 0
        else if (e.key === 'End') next = controls.length - 1
        else if (e.key.length === 1 && !e.altKey && !e.metaKey && !e.ctrlKey) {
          const now = performance.now()
          buffer.current =
            (now - lastKey.current > 650 ? '' : buffer.current) +
            e.key.toLowerCase()
          lastKey.current = now
          next = controls.findIndex((n) =>
            n.textContent?.trim().toLowerCase().startsWith(buffer.current),
          )
        } else return
        e.preventDefault()
        controls[next]?.focus()
      }}
    >
      {items.map((item, index) => (
        <button
          type="button"
          key={item.value}
          role={value === undefined ? 'menuitem' : 'menuitemradio'}
          aria-checked={value === undefined ? undefined : value === item.value}
          disabled={item.disabled || phase !== 'open'}
          className={`pd-menu-item ${item.danger ? 'pd-menu-danger' : ''} ${index > 0 && item.danger ? 'pd-menu-separated' : ''}`}
          onClick={() => {
            close()
            onChange?.(item.value)
            item.onSelect?.()
          }}
        >
          <Icon
            name={item.icon || (value === item.value ? 'check' : 'file')}
            className={!item.icon && value !== item.value ? 'pd-invisible' : ''}
          />
          <span>{item.label}</span>
          {value === item.value && item.icon && <Icon name="check" />}
        </button>
      ))}
    </div>
  )
  return (
    <span className="pd-menu-anchor">
      <button
        ref={trigger}
        type="button"
        aria-label={ariaLabel || (compact ? label : undefined)}
        title={compact ? label : undefined}
        aria-haspopup="menu"
        aria-expanded={phase === 'open'}
        aria-controls={mounted ? id : undefined}
        disabled={disabled}
        className={compact ? 'pd-icon-button' : 'pd-button pd-menu-trigger'}
        onClick={() => (phase === 'open' ? close() : open())}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && phase === 'open') {
            e.preventDefault()
            e.stopPropagation()
            close()
            return
          }
          if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault()
            open(e.key === 'ArrowUp')
          }
        }}
      >
        {icon && <Icon name={icon} />}{' '}
        {!compact && (
          <>
            <span>{label}</span>
            <Icon
              name="chevron"
              className={phase === 'open' ? 'pd-rotated' : ''}
            />
          </>
        )}
      </button>
      {mounted &&
        (portal
          ? createPortal(
              content,
              trigger.current?.closest('dialog') || document.body,
            )
          : content)}
    </span>
  )
}
