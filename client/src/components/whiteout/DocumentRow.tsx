import type { HTMLAttributes } from 'react'
import { useHref, useNavigate } from 'react-router-dom'
/** Native title links supply keyboard/link semantics; only inert row space delegates. */
export default function DocumentRow({
  to,
  className = '',
  onClick,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { to: string }) {
  const navigate = useNavigate(),
    href = useHref(to)
  return (
    <tr
      {...props}
      className={`pd-document-row ${className}`}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          (event.target as Element).closest(
            'a,button,input,textarea,select,details,[role="button"],[role="combobox"],[role="menu"],[contenteditable="true"]',
          )
        )
          return
        if (event.metaKey || event.ctrlKey || event.shiftKey)
          window.open(href, '_blank', 'noopener')
        else navigate(to)
      }}
    />
  )
}
