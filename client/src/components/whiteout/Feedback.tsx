import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { IconButton, Button } from './Button'
import Icon, { type IconName } from './Icon'
import DotsLoader from './DotsLoader'
type ToastOptions = {
  state?: 'pending' | 'success' | 'error'
  action?: { label: string; run: () => void }
  id?: number
}
type Toast = ToastOptions & { id: number; text: string }
type Notify = ((text: string, options?: ToastOptions) => number) & {
  promise: <T>(
    operation: Promise<T>,
    labels: {
      pending: string
      success: string | ((result: T) => string)
      error: string
    },
  ) => Promise<T>
}
const ToastContext = createContext<Notify>(
  Object.assign(() => 0, { promise: async <T,>(p: Promise<T>) => p }),
)
function ToastItem({
  item,
  dismiss,
}: {
  item: Toast
  dismiss: () => void
}) {
  const timer = useRef<number | undefined>(undefined)
  const stop = () => clearTimeout(timer.current)
  const resume = () => {
    stop()
    if (item.state !== 'pending')
      timer.current = window.setTimeout(
        dismiss,
        item.state === 'error' || item.action ? 10000 : 6000,
      )
  }
  useEffect(() => {
    resume()
    return stop
  }, [item.state, item.text])
  return (
    <div
      className={`pd-toast pd-toast-${item.state || 'success'}`}
      data-state={item.state || 'success'}
      onMouseEnter={stop}
      onMouseLeave={resume}
      onFocus={stop}
      onBlur={resume}
    >
      {item.state === 'pending' ? (
        <DotsLoader />
      ) : (
        <Icon name={item.state === 'error' ? 'alert' : 'check'} />
      )}
      <span>{item.text}</span>
      {item.action && (
        <button
          type="button"
          className="pd-toast-action"
          onClick={() => {
            item.action!.run()
            dismiss()
          }}
        >
          {item.action.label}
        </button>
      )}
      <IconButton
        name="close"
        label="Dismiss notification"
        onClick={dismiss}
      />
    </div>
  )
}
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]),
    sequence = useRef(0)
  const notify = useCallback(
    (text: string, options: ToastOptions = {}) => {
      const id = options.id || ++sequence.current
      setItems((old) =>
        old.some((x) => x.id === id)
          ? old.map((x) => (x.id === id ? { ...options, id, text } : x))
          : [...old.slice(-2), { ...options, id, text }],
      )
      return id
    },
    [],
  )
  const value = Object.assign(notify, {
    promise: async <T,>(
      operation: Promise<T>,
      labels: {
        pending: string
        success: string | ((result: T) => string)
        error: string
      },
    ) => {
      const id = notify(labels.pending, { state: 'pending' })
      try {
        const result = await operation
        notify(
          typeof labels.success === 'function'
            ? labels.success(result)
            : labels.success,
          { id, state: 'success' },
        )
        return result
      } catch (e) {
        notify(labels.error, { id, state: 'error' })
        throw e
      }
    },
  })
  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="pd-ui pd-toasts"
          role="status"
          aria-live="polite"
          aria-atomic="false"
        >
          {items.map((item) => (
            <ToastItem
              key={item.id}
              item={item}
              dismiss={() =>
                setItems((old) => old.filter((x) => x.id !== item.id))
              }
            />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
export const useToast = () => useContext(ToastContext)
export function ErrorNotice({
  children,
  onDismiss,
}: {
  children: ReactNode
  onDismiss?: () => void
}) {
  return (
    <div className="pd-alert" role="alert">
      <Icon name="alert" />
      <div>
        {children}
        {typeof children === 'string' &&
          children.includes('session has expired') && (
            <a
              className="pd-session-link"
              href={`/scheduler/#/login?returnTo=${encodeURIComponent('/productiondesk/' + window.location.hash)}`}
            >
              Sign in
              <Icon name="arrow" />
            </a>
          )}
      </div>
      {onDismiss && (
        <IconButton
          name="close"
          label="Dismiss error"
          onClick={onDismiss}
        />
      )}
    </div>
  )
}
export function LoadingRows({ label }: { label: string }) {
  const [delayed, setDelayed] = useState(false)
  useEffect(() => {
    setDelayed(false)
    const timer = setTimeout(() => setDelayed(true), 8000)
    return () => clearTimeout(timer)
  }, [label])
  return (
    <div className="pd-loading" role="status" aria-live="polite">
      <span className="pd-loading-caption">
        <DotsLoader />
        {delayed
          ? 'Taking longer than usual. Checking the connection…'
          : label}
      </span>
      {[0, 1, 2, 3].map((i) => (
        <div className="pd-skeleton-row" key={i}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  )
}
export function EmptyState({
  kind = 'empty',
  icon = 'file',
  title,
  children,
  action,
}: {
  icon?: IconName
  kind?: 'empty' | 'search' | 'error' | 'auth'
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="pd-empty">
      <div className="pd-empty-mark">
        <Icon
          name={
            kind === 'auth'
              ? 'lock'
              : kind === 'error'
                ? 'alert'
                : kind === 'search'
                  ? 'search'
                  : icon
          }
        />
      </div>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {action && <div className="pd-empty-action">{action}</div>}
    </div>
  )
}
export function SessionState() {
  // Scheduler already validates this allowlisted returnTo path. Token storage is unchanged.
  const destination = '/productiondesk/' + window.location.hash
  return (
    <section className="pd-session" aria-labelledby="pd-session-title">
      <h1 id="pd-session-title">Sign in to Production Desk</h1>
      <a
        className="pd-button pd-button-primary"
        href={`/scheduler/#/login?returnTo=${encodeURIComponent(destination)}`}
      >
        Sign in
        <Icon name="arrow" />
      </a>
    </section>
  )
}
export function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button icon="retry" onClick={onClick}>
      Try again
    </Button>
  )
}
