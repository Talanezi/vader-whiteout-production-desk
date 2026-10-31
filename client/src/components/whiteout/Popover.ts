import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

/** Shared portalled geometry for fast controls. Native-dialog top layer aware. */
export function usePopover(width = 224, overlapTrigger = false) {
  const [open, setOpen] = useState(false),
    [style, setStyle] = useState<CSSProperties>({ visibility: 'hidden' })
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null),
    id = useId()
  const close = (restore = true) => {
    setOpen(false)
    if (restore) trigger.current?.focus()
  }
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const a = trigger.current?.getBoundingClientRect(),
        p = panel.current
      if (!a || !p) return
      const w = Math.min(width, innerWidth - 24),
        h = Math.min(p.scrollHeight, innerHeight - 24)
      const above =
        innerHeight - (overlapTrigger ? a.top : a.bottom) < h + 10 &&
        a.top > h + 10
      setStyle({
        position: 'fixed',
        width: w,
        maxHeight: innerHeight - 24,
        left: Math.max(12, Math.min(a.left, innerWidth - w - 12)),
        top: Math.max(
          12,
          Math.min(
            above ? a.top - h - 7 : overlapTrigger ? a.top : a.bottom + 7,
            innerHeight - h - 12,
          ),
        ),
        transformOrigin: above ? 'bottom left' : 'top left',
      })
    }
    place()
    const observer = new ResizeObserver(place)
    if (panel.current) observer.observe(panel.current)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, width, overlapTrigger])
  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent | FocusEvent) => {
      if (
        !panel.current?.contains(e.target as Node) &&
        !trigger.current?.contains(e.target as Node)
      )
        close(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        close()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape, true)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape, true)
    }
  }, [open])
  function tab(reverse: boolean) {
    const scope = trigger.current?.closest('dialog') || document
    const controls = Array.from(
      scope.querySelectorAll<HTMLElement>(
        'a[href],button,input,textarea,select,[tabindex="0"],[contenteditable="true"]',
      ),
    ).filter(
      (node) =>
        node.getClientRects().length &&
        !node.hasAttribute('disabled') &&
        !panel.current?.contains(node),
    )
    const index = controls.indexOf(trigger.current!)
    close(false)
    ;(controls[index + (reverse ? -1 : 1)] || trigger.current)?.focus()
  }
  return {
    open,
    setOpen,
    style,
    trigger,
    panel,
    id,
    close,
    tab,
    target: trigger.current?.closest('dialog') || document.body,
  }
}
