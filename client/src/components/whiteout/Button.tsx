import type { ButtonHTMLAttributes, ReactNode } from 'react'
import Icon, { type IconName } from './Icon'
export type ActionState = 'idle' | 'pending' | 'success' | 'error'
type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
  icon?: IconName
  state?: ActionState
  pendingLabel?: string
  successLabel?: string
  errorLabel?: string
  children?: ReactNode
}
export function Button({
  variant = 'secondary',
  icon,
  state = 'idle',
  pendingLabel = 'Saving…',
  successLabel = 'Saved',
  errorLabel = 'Try again',
  className = '',
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || state === 'pending'}
      aria-busy={state === 'pending' || undefined}
      className={`pd-button pd-button-${variant} ${state !== 'idle' ? `pd-button-${state}` : ''} ${className}`}
    >
      {state === 'pending' ? (
        <span className="pd-spinner" aria-hidden="true" />
      ) : (
        <Icon
          name={
            state === 'success'
              ? 'check'
              : state === 'error'
                ? 'alert'
                : icon || 'plus'
          }
          className={!icon && state === 'idle' ? 'pd-hidden' : ''}
        />
      )}
      <span aria-live="polite">
        {state === 'pending'
          ? pendingLabel
          : state === 'success'
            ? successLabel
            : state === 'error'
              ? errorLabel
              : children}
      </span>
    </button>
  )
}
export function IconButton({
  name,
  label,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  name: IconName
  label: string
}) {
  return (
    <button
      type="button"
      {...props}
      aria-label={label}
      title={label}
      className={`pd-icon-button ${className}`}
    >
      <Icon name={name} />
    </button>
  )
}
