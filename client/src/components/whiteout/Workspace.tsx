import { useId, type ReactNode } from 'react'
import { IconButton } from './Button'
import Icon from './Icon'
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="pd-page-header">
      <div>
        <h1 tabIndex={-1}>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="pd-page-actions">{children}</div>}
    </div>
  )
}
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}) {
  const id = useId()
  return (
    <div className="pd-search">
      <label htmlFor={id} className="pd-sr-only">
        {label}
      </label>
      <Icon name="search" />
      <input
        id={id}
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <IconButton
          name="close"
          label={`Clear ${label.toLowerCase()}`}
          onClick={() => {
            onChange('')
            document.getElementById(id)?.focus()
          }}
        />
      )}
    </div>
  )
}
export function Status({
  value,
  children,
}: {
  value: string
  children: ReactNode
}) {
  return (
    <span className={`pd-status pd-status-${value}`}>
      <span aria-hidden="true" />
      {children}
    </span>
  )
}
