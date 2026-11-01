import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopover } from './Popover'
import Icon from './Icon'

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [y, m, d] = value.split('-').map(Number),
    date = new Date(y, m - 1, d, 12)
  return iso(date) === value ? date : null
}
/** Date-only local calendar arithmetic, never UTC conversion or native popup. */
export default function DatePicker({
  label,
  value,
  onChange,
  onValidityChange,
  required = false,
}: {
  label: string
  value: string
  onChange: (s: string) => void
  onValidityChange?: (valid: boolean) => void
  required?: boolean
}) {
  const pop = usePopover(292),
    initial = parseDateOnly(value) || new Date()
  const [month, setMonth] = useState(
    new Date(initial.getFullYear(), initial.getMonth(), 1, 12),
  )
  const [focused, setFocused] = useState(iso(initial)),
    [draft, setDraft] = useState(value),
    [error, setError] = useState('')
  const days = useRef<HTMLDivElement>(null),
    pendingFocus = useRef(false)
  useEffect(() => setDraft(value), [value])
  useLayoutEffect(() => {
    if (pop.open && pendingFocus.current) {
      days.current
        ?.querySelector<HTMLButtonElement>(`[data-date="${focused}"]`)
        ?.focus()
      pendingFocus.current = false
    }
  }, [pop.open, focused, month])
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12)
  const start = new Date(first)
  start.setDate(1 - ((first.getDay() + 6) % 7))
  const dates = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    return date
  })
  const pick = (date: Date) => {
    onValidityChange?.(true)
    onChange(iso(date))
    setError('')
    pop.close()
  }
  const move = (delta: number) => {
    const next = parseDateOnly(focused) || first
    next.setDate(next.getDate() + delta)
    setFocused(iso(next))
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1, 12))
    pendingFocus.current = true
  }
  function moveMonth(delta: number, focusGrid = false) {
    const base = parseDateOnly(focused) || first
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1, 12)
    const last = new Date(
      next.getFullYear(),
      next.getMonth() + 1,
      0,
      12,
    ).getDate()
    next.setDate(Math.min(base.getDate(), last))
    pendingFocus.current = focusGrid
    setFocused(iso(next))
    setMonth(new Date(next.getFullYear(), next.getMonth(), 1, 12))
  }

  return (
    <div className="pd-date-field">
      <label htmlFor={`${pop.id}-entry`}>{label}</label>
      <div className="pd-date-entry">
        <input
          id={`${pop.id}-entry`}
          value={draft}
          placeholder="YYYY-MM-DD"
          inputMode="numeric"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${pop.id}-error` : undefined}
          onChange={(e) => {
            setDraft(e.target.value)
            onValidityChange?.(
              Boolean(
                parseDateOnly(e.target.value) || (!required && !e.target.value),
              ),
            )
          }}
          onBlur={() => {
            if ((!required && !draft) || parseDateOnly(draft)) {
              onChange(draft)
              onValidityChange?.(true)
              setError('')
            } else {
              onValidityChange?.(false)
              setError('Enter a valid date as YYYY-MM-DD.')
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (parseDateOnly(draft)) {
                onChange(draft)
                setError('')
              } else {
                onValidityChange?.(false)
                setError('Enter a valid date as YYYY-MM-DD.')
              }
            }
          }}
        />
        <button
          ref={pop.trigger}
          type="button"
          aria-label={`Choose ${label.toLowerCase()}`}
          aria-haspopup="dialog"
          aria-controls={pop.open ? pop.id : undefined}
          aria-expanded={pop.open}
          onClick={() => {
            const d = parseDateOnly(value) || new Date()
            setMonth(new Date(d.getFullYear(), d.getMonth(), 1, 12))
            setFocused(iso(d))
            pendingFocus.current = true
            pop.setOpen(!pop.open)
          }}
        >
          <Icon name="calendar" />
        </button>
      </div>
      {error && (
        <small id={`${pop.id}-error`} role="alert">
          {error}
        </small>
      )}
      {pop.open &&
        createPortal(
          <div
            ref={pop.panel}
            className="pd-ui pd-calendar"
            style={pop.style}
            role="dialog"
            id={pop.id}
            aria-label={`Choose ${label.toLowerCase()}`}
          >
            <header>
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => moveMonth(-1)}
              >
                <Icon name="back" />
              </button>
              <strong aria-live="polite">
                {month.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => moveMonth(1)}
              >
                <Icon name="arrow" />
              </button>
            </header>
            <div className="pd-calendar-week" aria-hidden="true">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div
              ref={days}
              role="grid"
              aria-label={month.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
              className="pd-calendar-grid"
              onKeyDown={(e) => {
                let delta = {
                  ArrowLeft: -1,
                  ArrowRight: 1,
                  ArrowUp: -7,
                  ArrowDown: 7,
                }[e.key]
                if (e.key === 'Home')
                  delta = -((parseDateOnly(focused)!.getDay() + 6) % 7)
                if (e.key === 'End')
                  delta = 6 - ((parseDateOnly(focused)!.getDay() + 6) % 7)
                if (delta !== undefined) {
                  e.preventDefault()
                  move(delta)
                }
                if (e.key === 'PageDown' || e.key === 'PageUp') {
                  e.preventDefault()
                  moveMonth(e.key === 'PageDown' ? 1 : -1, true)
                }
              }}
            >
              {Array.from({ length: 6 }, (_, week) => (
                <div role="row" key={week}>
                  {dates.slice(week * 7, week * 7 + 7).map((date) => (
                    <button
                      key={iso(date)}
                      role="gridcell"
                      type="button"
                      data-date={iso(date)}
                      aria-label={date.toLocaleDateString('en-US', {
                        dateStyle: 'full',
                      })}
                      aria-selected={iso(date) === value}
                      aria-current={
                        iso(date) === iso(new Date()) ? 'date' : undefined
                      }
                      tabIndex={iso(date) === focused ? 0 : -1}
                      className={
                        date.getMonth() !== month.getMonth() ? 'is-outside' : ''
                      }
                      onFocus={() => setFocused(iso(date))}
                      onClick={() => pick(date)}
                    >
                      {date.getDate()}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <footer>
              <button type="button" onClick={() => pick(new Date())}>
                Today
              </button>
              {!required && (
                <button
                  type="button"
                  onClick={() => {
                    onValidityChange?.(true)
                    onChange('')
                    pop.close()
                  }}
                >
                  Clear
                </button>
              )}
            </footer>
          </div>,
          pop.target,
        )}
    </div>
  )
}
