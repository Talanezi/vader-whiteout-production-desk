import { useState } from 'react'
import Icon from './Icon'

export default function QuantityInput({
  label,
  value,
  onChange,
  onFocus,
  integer = false,
  steppers = false,
}: {
  label: string
  value: string
  onChange: (s: string) => void
  onFocus: () => void
  integer?: boolean
  steppers?: boolean
}) {
  const [error, setError] = useState('')
  const adjust = (amount: number) => {
    const current = Number(value)
    if (!Number.isFinite(current)) return
    onChange(String(Math.max(0, Number((current + amount).toFixed(3)))))
    setError('')
  }
  return (
    <div className="pd-quantity">
      <input
        aria-label={label}
        aria-invalid={Boolean(error)}
        value={value}
        inputMode={integer ? 'numeric' : 'decimal'}
        placeholder="—"
        onFocus={onFocus}
        onChange={(e) => {
          onChange(e.target.value)
          setError('')
        }}
        onBlur={() => {
          if (
            value.trim() &&
            (!Number.isFinite(Number(value)) ||
              Number(value) < 0 ||
              (integer && !Number.isInteger(Number(value))))
          )
            setError(
              integer
                ? 'Enter a whole number of takes.'
                : 'Enter a non-negative duration.',
            )
        }}
        onKeyDown={(e) => {
          if (
            !e.altKey &&
            !e.ctrlKey &&
            !e.metaKey &&
            (e.key === 'ArrowUp' || e.key === 'ArrowDown')
          ) {
            e.preventDefault()
            adjust((e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 5 : 1))
          }
        }}
      />
      {steppers && (
        <span>
          <button
            type="button"
            aria-label={`Decrease ${label.toLowerCase()}`}
            onClick={() => adjust(-1)}
          >
            <Icon name="down" />
          </button>
          <button
            type="button"
            aria-label={`Increase ${label.toLowerCase()}`}
            onClick={() => adjust(1)}
          >
            <Icon name="up" />
          </button>
        </span>
      )}
      {error && <small role="alert">{error}</small>}
    </div>
  )
}
