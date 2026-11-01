import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { usePopover } from './Popover'
import Icon from './Icon'

const Metal = lazy(() => import('./ReactiveMetal'))
export default function CreateMenu() {
  const pop = usePopover(202, true),
    navigate = useNavigate(),
    host = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  useLayoutEffect(() => {
    if (pop.open) {
      setRendered(true)
      return
    }
    const timer = setTimeout(
      () => setRendered(false),
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220,
    )
    return () => clearTimeout(timer)
  }, [pop.open])
  const [active, setActive] = useState(false),
    [visible, setVisible] = useState(true),
    [hidden, setHidden] = useState(document.hidden)
  const [reduced, setReduced] = useState(
    matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [webgl, setWebgl] = useState(false)
  useEffect(() => {
    const canvas = document.createElement('canvas'),
      gl = canvas.getContext('webgl2')
    setWebgl(Boolean(gl))
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    const mq = matchMedia('(prefers-reduced-motion: reduce)'),
      motion = () => setReduced(mq.matches),
      visibility = () => setHidden(document.hidden)
    mq.addEventListener('change', motion)
    document.addEventListener('visibilitychange', visibility)
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    )
    if (host.current) observer.observe(host.current)
    return () => {
      observer.disconnect()
      mq.removeEventListener('change', motion)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  useEffect(() => {
    if (pop.open)
      requestAnimationFrame(() =>
        pop.panel.current
          ?.querySelector<HTMLButtonElement>('[role=menuitem]')
          ?.focus(),
      )
  }, [pop.open])
  const trigger = (
    <button
      ref={pop.trigger}
      className="pd-create-pill"
      type="button"
      aria-label="Create"
      aria-haspopup="menu"
      aria-expanded={pop.open}
      aria-controls={pop.open ? pop.id : undefined}
      onClick={() => pop.setOpen(!pop.open)}
      onKeyDown={(e) => {
        if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
          e.preventDefault()
          pop.setOpen(true)
        }
      }}
    >
      <Icon name="plus" />
      <span>Create</span>
      <Icon name="chevron" />
    </button>
  )
  return (
    <div
      ref={host}
      className={`pd-create ${pop.open || rendered ? 'is-open' : ''}`}
      data-metal={webgl && !reduced ? 'webgl' : 'static'}
      data-paused={!active || !visible || hidden || reduced}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setActive(false)
      }}
    >
      {trigger}
      {webgl && !reduced && (
        <span className="pd-create-metal-host" aria-hidden="true">
          <Suspense fallback={null}>
            <Metal paused={!active || !visible || hidden}>
              <span className="pd-create-metal-surface" />
            </Metal>
          </Suspense>
        </span>
      )}
      {(pop.open || rendered) &&
        createPortal(
          <div
            ref={pop.panel}
            style={
              {
                ...pop.style,
                '--create-start-width': `${pop.trigger.current?.getBoundingClientRect().width || 180}px`,
                '--create-start-height': '38px',
                '--create-shift-x': `${(pop.trigger.current?.getBoundingClientRect().left || 0) - Number(pop.style.left || 0)}px`,
                '--create-shift-y': `${(pop.trigger.current?.getBoundingClientRect().top || 0) - Number(pop.style.top || 0)}px`,
              } as import('react').CSSProperties
            }
            className={`pd-ui pd-create-panel ${!pop.open ? 'is-closing' : ''}`}
            aria-hidden={!pop.open || undefined}
            onKeyDown={(e) => {
              const buttons = [
                  ...e.currentTarget.querySelectorAll<HTMLButtonElement>(
                    '[role=menuitem]',
                  ),
                ],
                current = buttons.indexOf(
                  document.activeElement as HTMLButtonElement,
                )
              if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
                e.preventDefault()
                buttons[
                  e.key === 'Home'
                    ? 0
                    : e.key === 'End'
                      ? buttons.length - 1
                      : (current +
                          (e.key === 'ArrowDown' ? 1 : -1) +
                          buttons.length) %
                        buttons.length
                ]?.focus()
              }
              if (e.key === 'Tab') {
                e.preventDefault()
                pop.tab(e.shiftKey)
              }
            }}
          >
            <div role="menu" id={pop.id} aria-label="Create">
              {[
                ['file', 'New Call Sheet', '/callsheets/new'],
                ['shots', 'New Shot List', '/shotlists/new'],
                ['grid', 'New Storyboard', '/storyboards/new'],
              ].map(([icon, label, path]) => (
                <button
                  type="button"
                  role="menuitem"
                  disabled={!pop.open}
                  key={path}
                  onClick={() => {
                    pop.close()
                    navigate(path)
                  }}
                >
                  <Icon name={icon as 'file'} />
                  <span>{label}</span>
                  <Icon name="arrow" />
                </button>
              ))}
            </div>
          </div>,
          pop.target,
        )}
    </div>
  )
}
