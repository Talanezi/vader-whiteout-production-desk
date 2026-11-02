import { useLayoutEffect } from 'react'
let locks = 0
let restore: (() => void) | undefined
/** Shared by nested dialogs; iOS background scrolling is restored only after the last closes. */
export default function useDocumentScrollLock() {
  useLayoutEffect(() => {
    if (locks++ === 0) {
      const body = document.body,
        html = document.documentElement,
        x = scrollX,
        y = scrollY
      const before = {
        overflow: body.style.overflow,
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
        html: html.style.overflow,
        overscroll: html.style.overscrollBehavior,
      }
      Object.assign(body.style, {
        overflow: 'hidden',
        position: 'fixed',
        top: `${-y}px`,
        width: '100%',
      })
      html.style.overflow = 'hidden'
      html.style.overscrollBehavior = 'none'
      restore = () => {
        Object.assign(body.style, {
          overflow: before.overflow,
          position: before.position,
          top: before.top,
          width: before.width,
        })
        html.style.overflow = before.html
        html.style.overscrollBehavior = before.overscroll
        window.scrollTo(x, y)
      }
    }
    return () => {
      if (--locks === 0) {
        restore?.()
        restore = undefined
      }
    }
  }, [])
}
