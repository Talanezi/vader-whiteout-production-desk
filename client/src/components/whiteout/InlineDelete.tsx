import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
export default function InlineDelete({
  label,
  onConfirm,
}: {
  label: string
  onConfirm: () => Promise<void>
}) {
  const [state, setState] = useState<'idle' | 'confirm' | 'pending' | 'error'>(
      'idle',
    ),
    [error, setError] = useState('')
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLSpanElement>(null)
  const close = () => {
    setState('idle')
    trigger.current?.focus()
  }
  useEffect(() => {
    if (state === 'confirm')
      panel.current?.querySelector<HTMLButtonElement>('[data-confirm]')?.focus()
  }, [state])
  return (
    <span
      ref={panel}
      className={`pd-inline-delete is-${state}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && state !== 'pending') {
          e.preventDefault()
          e.stopPropagation()
          close()
        }
      }}
    >
      <button
        ref={trigger}
        className="pd-icon-button"
        type="button"
        aria-label={`Delete ${label}`}
        aria-expanded={state !== 'idle'}
        disabled={state === 'pending'}
        onClick={() => (state === 'idle' ? setState('confirm') : close())}
      >
        <Icon name="trash" />
      </button>
      {state !== 'idle' && (
        <span className="pd-delete-confirm">
          <span>{state === 'pending' ? 'Deleting…' : 'Delete?'}</span>
          <button
            data-confirm
            type="button"
            aria-label={`Confirm delete ${label}`}
            disabled={state === 'pending'}
            onClick={async () => {
              setState('pending')
              setError('')
              try {
                await onConfirm()
                setState('idle')
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Deletion failed.')
                setState('error')
              }
            }}
          >
            <Icon name="check" />
          </button>
          <button
            type="button"
            aria-label="Cancel deletion"
            disabled={state === 'pending'}
            onClick={close}
          >
            <Icon name="close" />
          </button>
          {error && (
            <span role="alert" className="pd-delete-error">
              {error}
            </span>
          )}
        </span>
      )}
    </span>
  )
}
