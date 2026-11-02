import { useLayoutEffect, useRef, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button, IconButton } from './Button'
import Icon from './Icon'
import useDocumentScrollLock from '../../lib/useDocumentScrollLock'
type Props = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  busy?: boolean
  kind?: 'drawer' | 'dialog'
  className?: string
}
/** Native modal dialog supplies inert background, focus containment and stacking. */
export function Overlay({
  title,
  description,
  children,
  footer,
  onClose,
  busy,
  kind = 'dialog',
  className = '',
}: Props) {
  useDocumentScrollLock()
  const ref = useRef<HTMLDialogElement>(null),
    menuEscape = useRef(false),
    titleId = useId(),
    descriptionId = useId()
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      dialog = ref.current!
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus()
    return () => {
      dialog.close()
      if (
        previous?.isConnected &&
        (!previous.closest('dialog') || previous.closest('dialog')?.open)
      )
        previous.focus()
      else if (!previous?.isConnected)
        document.querySelector<HTMLElement>('#workspace h1')?.focus()
    }
  }, [])
  return createPortal(
    <dialog
      ref={ref}
      className={`pd-ui pd-overlay pd-${kind} ${className}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={busy || undefined}
      onKeyDownCapture={(event) => {
        menuEscape.current =
          event.key === 'Escape' &&
          !!(event.target as HTMLElement).closest('[role="menu"]')
      }}
      onCancel={(event) => {
        event.preventDefault()
        if (menuEscape.current) {
          menuEscape.current = false
          return
        }
        if (!busy) onClose()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || busy) return
        const b = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < b.left ||
          event.clientX > b.right ||
          event.clientY < b.top ||
          event.clientY > b.bottom
        )
          onClose()
      }}
    >
      <div className="pd-overlay-header">
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        <IconButton
          name="close"
          label={`Close ${title}`}
          onClick={onClose}
          disabled={busy}
        />
      </div>
      <div className="pd-overlay-body">{children}</div>
      {footer && <div className="pd-overlay-footer">{footer}</div>}
    </dialog>,
    document.body,
  )
}
export function Confirm({
  title,
  description,
  confirmLabel = 'Delete',
  pending = false,
  error,
  onConfirm,
  onCancel,
  destructive = true,
}: {
  title: string
  description: string
  confirmLabel?: string
  pending?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
}) {
  return (
    <Overlay
      title={title}
      description={description}
      onClose={onCancel}
      busy={pending}
      footer={
        <>
          <Button data-initial-focus onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            icon={destructive ? 'trash' : 'check'}
            state={pending ? 'pending' : 'idle'}
            pendingLabel={destructive ? 'Deleting…' : 'Working…'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="pd-confirm-detail">
        <Icon name={destructive ? 'trash' : 'alert'} />
        <p>
          {destructive
            ? 'This action cannot be undone. Other records will stay in place.'
            : 'Your changes have not been saved yet.'}
        </p>
      </div>
      {error && (
        <p className="pd-alert" role="alert">
          {error}
        </p>
      )}
    </Overlay>
  )
}
