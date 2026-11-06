import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePopover } from '../whiteout/Popover'
import Menu from '../whiteout/Menu'
import Icon from '../whiteout/Icon'
import { Button } from '../whiteout/Button'
import {
  clockText,
  parseClock,
} from '../../../../server/src/flows/scheduling'
export default function TimestampEntry({
  label,
  value,
  planned,
  onSave,
  pending = false,
  precondition,
}: {
  label: string
  value: number | null
  planned: number | null
  precondition: {
    expectedStartedAt: number | null
    expectedEndedAt: number | null
  }
  onSave: (
    minute: number | null,
    useCurrent?: boolean,
    guard?: any,
  ) => void
  pending?: boolean
}) {
  const p = usePopover(280),
    [draft, setDraft] = useState(value == null ? '' : clockText(value)),
    [edit, setEdit] = useState<number | null>(value),
    [error, setError] = useState(''),
    focused = useRef(false),
    baseline = useRef(precondition),
    lastCommitted = useRef<string | null>(null),
    input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!focused.current) setDraft(value == null ? '' : clockText(value))
  }, [value])
  function commit(text: string, next = false) {
    try {
      if (lastCommitted.current === text) return
      const minute = parseClock(text),
        day = Math.floor((value ?? edit ?? 0) / 1440)
      if (minute == null ? value != null : minute + day * 1440 !== value) {
        lastCommitted.current = text
        onSave(
          minute == null ? null : minute + day * 1440,
          false,
          baseline.current,
        )
      }
      setError('')
      if (next) {
        const entries = Array.from(
            document.querySelectorAll<HTMLInputElement>(
              '[data-actual-entry]',
            ),
          ).filter((n) => n.offsetParent !== null),
          i = entries.indexOf(input.current!)
        entries[i + 1]?.focus()
        entries[i + 1]?.select()
      }
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const open = (event?: React.MouseEvent<HTMLButtonElement>) => {
      if (event) p.trigger.current = event.currentTarget
      baseline.current = precondition
      setEdit(value)
      setError('')
      p.setOpen(true)
    },
    m = (((edit ?? 0) % 1440) + 1440) % 1440,
    h = Math.floor(m / 60),
    day = Math.floor((edit ?? 0) / 1440)
  const choose = (hour: number, minute: number, pm: boolean) =>
    setEdit(((hour % 12) + (pm ? 12 : 0)) * 60 + minute + day * 1440)
  return (
    <div className={`shoot-time-entry ${pending ? 'is-pending' : ''}`}>
      <div className="shoot-time-desktop">
        <input
          ref={input}
          data-actual-entry
          aria-label={label}
          aria-invalid={!!error}
          value={draft}
          placeholder="—"
          disabled={pending}
          onFocus={() => {
            focused.current = true
            baseline.current = precondition
            lastCommitted.current = null
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            focused.current = false
            commit(draft)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit(draft, true)
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              open()
            }
          }}
        />
        <button
          ref={p.trigger}
          type="button"
          tabIndex={-1}
          aria-label={'Choose ' + label.toLowerCase()}
          aria-expanded={p.open}
          onClick={open}
          disabled={pending}
        >
          <Icon name="calendar" />
        </button>
      </div>
      <button
        className="shoot-time-mobile"
        type="button"
        aria-label={label}
        onClick={open}
        disabled={pending}
      >
        <Icon name="calendar" />
        {value == null ? 'Record actual start' : clockText(value)}
      </button>
      {value != null && value >= 1440 && (
        <small>
          Next day{value >= 2880 ? ' +' + Math.floor(value / 1440) : ''}
        </small>
      )}
      {pending && <small>Pending confirmation</small>}
      {error && <small role="alert">{error}</small>}
      {p.open && (
        <>
          {createPortal(
            <div
              ref={p.panel}
              style={p.style}
              className="pd-ui shoot-time-popover"
              role="dialog"
              aria-label={label}
            >
              <header>
                <strong>{label}</strong>
                <button
                  aria-label="Close time entry"
                  onClick={() => p.close()}
                >
                  <Icon name="close" />
                </button>
              </header>
              <small>Planned · {clockText(planned)}</small>
              <div className="flow-clock-dials">
                <label>
                  Hour
                  <input
                    aria-label="Hour"
                    inputMode="numeric"
                    type="number"
                    min="1"
                    max="12"
                    value={edit == null ? '' : h % 12 || 12}
                    placeholder="9"
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (n >= 1 && n <= 12) choose(n, m % 60, h >= 12)
                    }}
                  />
                </label>
                <label>
                  Minute
                  <input
                    aria-label="Minute"
                    inputMode="numeric"
                    type="number"
                    min="0"
                    max="59"
                    value={edit == null ? '' : m % 60}
                    placeholder="04"
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (n >= 0 && n < 60)
                        choose(h % 12 || 12, n, h >= 12)
                    }}
                  />
                </label>
                <Menu
                  portal={false}
                  label={h >= 12 ? 'PM' : 'AM'}
                  ariaLabel="AM or PM"
                  value={h >= 12 ? 'PM' : 'AM'}
                  items={['AM', 'PM'].map((v) => ({ value: v, label: v }))}
                  onChange={(v) =>
                    choose(h % 12 || 12, m % 60, v === 'PM')
                  }
                />
              </div>
              <Menu
                portal={false}
                label={
                  day
                    ? 'Next day' + (day > 1 ? ' +' + day : '')
                    : 'Shoot day'
                }
                value={String(day)}
                items={Array.from({ length: 7 }, (_, i) => ({
                  value: String(i),
                  label: i
                    ? 'Next day' + (i > 1 ? ' +' + i : '')
                    : 'Shoot day',
                }))}
                onChange={(v) => setEdit(m + Number(v) * 1440)}
              />
              <div className="shoot-time-shortcuts">
                <Button
                  icon="calendar"
                  onClick={() => {
                    try {
                      onSave(null, true, baseline.current)
                      p.close()
                    } catch (e) {
                      setError((e as Error).message)
                    }
                  }}
                >
                  Use current time
                </Button>
                {value != null && (
                  <Button
                    onClick={() => {
                      try {
                        onSave(null, false, baseline.current)
                        p.close()
                      } catch (e) {
                        setError((e as Error).message)
                      }
                    }}
                  >
                    Clear time
                  </Button>
                )}
              </div>
              {error && <small role="alert">{error}</small>}
              <Button
                variant="primary"
                icon="check"
                disabled={edit == null}
                onClick={() => {
                  try {
                    onSave(edit, false, baseline.current)
                    p.close()
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              >
                Record time
              </Button>
            </div>,
            p.target,
          )}
        </>
      )}
    </div>
  )
}
