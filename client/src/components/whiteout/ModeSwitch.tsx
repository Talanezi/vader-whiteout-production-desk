import { useId } from 'react'
import Menu from './Menu'

/** Compact original SVG fusion treatment, informed by EasyUI Gooey Menu. */
export default function ModeSwitch({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const id = useId().replace(/:/g, '')
  return (
    <div className="pd-mode-switch" data-mode={value}>
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <filter id={id}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
            <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
            <feComposite in="SourceGraphic" operator="atop" />
          </filter>
        </defs>
      </svg>
      <span
        className="pd-mode-fusion"
        style={{ filter: `url(#${id})` }}
        aria-hidden="true"
      >
        <i />
        <i />
      </span>
      <Menu
        label={
          value === 'all'
            ? 'All Shots'
            : value === 'scene'
              ? 'Scene View'
              : value === 'shooting'
                ? 'Shooting Order'
                : 'Planning Order'
        }
        value={value}
        width={204}
        onChange={onChange}
        items={[
          { value: 'all', label: 'All Shots', icon: 'shots' },
          { value: 'scene', label: 'Scene View', icon: 'file' },
          {
            value: 'planning',
            label: 'Planning Order',
            icon: 'sort',
          },
          { value: 'shooting', label: 'Shooting Order', icon: 'calendar' },
        ]}
      />
    </div>
  )
}
