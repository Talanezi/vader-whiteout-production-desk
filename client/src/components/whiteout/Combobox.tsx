import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopover } from './Popover'
import Icon from './Icon'

/** Independent compact adaptation of EasyUI's searchable active-option pattern. */
export default function Combobox({
  label,
  value,
  options,
  onChange,
  custom = true,
  clearable = true,
  labels = {},
  onFocus,
}: {
  label: string
  value: string
  options: string[]
  onChange: (s: string) => void
  custom?: boolean
  clearable?: boolean
  labels?: Record<string, string>
  onFocus?: () => void
}) {
  const pop = usePopover(232),
    input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(''),
    [active, setActive] = useState(0)
  const filtered = [...new Set([...(value ? [value] : []), ...options])].filter(
    (s) => (labels[s] || s).toLowerCase().includes(query.toLowerCase()),
  )
  const values =
    custom &&
    query.trim() &&
    !filtered.some((s) => s.toLowerCase() === query.trim().toLowerCase())
      ? [...filtered, query.trim()]
      : filtered
  useEffect(() => {
    if (pop.open) {
      setQuery('')
      setActive(0)
      requestAnimationFrame(() => input.current?.focus())
    }
  }, [pop.open])
  useEffect(() => {
    if (pop.open)
      document
        .getElementById(
          active === -1 && clearable
            ? `${pop.id}-clear`
            : `${pop.id}-${active}`,
        )
        ?.scrollIntoView({ block: 'nearest' })
  }, [active, pop.open, query])
  const select = (next: string) => {
    onChange(next)
    pop.close()
  }
  return (
    <>
      <button
        type="button"
        className="pd-combo-trigger"
        ref={pop.trigger}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={pop.open}
        aria-controls={pop.open ? pop.id : undefined}
        onFocus={onFocus}
        onClick={() => pop.setOpen(!pop.open)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            pop.setOpen(true)
          }
        }}
      >
        <span>{labels[value] || value || '—'}</span>
        <Icon name="chevron" />
      </button>
      {pop.open &&
        createPortal(
          <div
            ref={pop.panel}
            className="pd-ui pd-combo-panel"
            style={pop.style}
          >
            <div className="pd-combo-search">
              <Icon name="search" />
              <input
                ref={input}
                role="combobox"
                aria-label={`Search ${label.toLowerCase()}`}
                aria-expanded="true"
                aria-controls={pop.id}
                aria-autocomplete="list"
                aria-activedescendant={
                  active === -1 && clearable
                    ? `${pop.id}-clear`
                    : values[active]
                      ? `${pop.id}-${active}`
                      : undefined
                }
                value={query}
                placeholder="Search or type a value…"
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActive(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault()
                    setActive((i) => {
                      const first = clearable ? -1 : 0
                      const next = i + (e.key === 'ArrowDown' ? 1 : -1)
                      return next < first
                        ? Math.max(first, values.length - 1)
                        : next >= values.length
                          ? first
                          : next
                    })
                  }
                  if (e.key === 'Home' || e.key === 'End') {
                    e.preventDefault()
                    setActive(
                      e.key === 'Home'
                        ? clearable
                          ? -1
                          : 0
                        : Math.max(0, values.length - 1),
                    )
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (active === -1 && clearable) select('')
                    else if (values[active]) select(values[active])
                  }
                  if (e.key === 'Tab') {
                    e.preventDefault()
                    pop.tab(e.shiftKey)
                  }
                }}
              />
            </div>
            <div
              id={pop.id}
              role="listbox"
              aria-label={label}
              className="pd-combo-options"
            >
              {clearable && (
                <button
                  id={`${pop.id}-clear`}
                  onMouseEnter={() => setActive(-1)}
                  role="option"
                  aria-selected={!value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select('')}
                  className={`pd-combo-clear ${active === -1 ? 'is-active' : ''}`}
                >
                  Clear value
                </button>
              )}
              {values.map((v, i) => (
                <button
                  id={`${pop.id}-${i}`}
                  key={v}
                  role="option"
                  aria-selected={v === value}
                  className={active === i ? 'is-active' : ''}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => select(v)}
                >
                  <span>
                    {!options.includes(v) && v !== value
                      ? `Use “${v}”`
                      : labels[v] || v}
                  </span>
                  {v === value && <Icon name="check" />}
                </button>
              ))}
              {!values.length && <p>No matches</p>}
            </div>
          </div>,
          pop.target,
        )}
    </>
  )
}
