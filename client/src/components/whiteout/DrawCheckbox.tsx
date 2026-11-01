import { forwardRef, type InputHTMLAttributes } from 'react'
/** EasyUI DrawCheckbox (MIT, Suraj Maurya), adapted to native semantics and CSS motion. */
const DrawCheckbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
    indeterminate?: boolean
  }
>(function DrawCheckbox(
  { indeterminate = false, className = '', ...props },
  ref,
) {
  return (
    <span className={`pd-draw-checkbox ${className}`}>
      <input
        {...props}
        type="checkbox"
        ref={(el) => {
          if (el) el.indeterminate = indeterminate
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
      />
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
        <path className="pd-draw-tick" d="M3.5 8.5 6.5 11.5 12.5 4.5" />
        <path className="pd-draw-bar" d="M4 8h8" />
      </svg>
    </span>
  )
})
export default DrawCheckbox
