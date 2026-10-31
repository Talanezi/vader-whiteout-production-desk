import type { SVGProps } from 'react'

// Original Production Desk folio. The open diagonal gutter is carved into
// each offset sheet; its negative space exposes the depth between documents.
const folio =
  'M3.8 19.5 23 8.3Q23.5 8 24 8.3L42.2 18.8Q43 19.3 42.2 19.8L23.8 30.7Q23.3 31 22.8 30.7L16.3 27 34 16.6 26.2 12.1 8.3 22.5 3.8 20Q3.3 19.7 3.8 19.5Z'

export default function DeskEmblem(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
      className={`pd-emblem ${props.className || ''}`}
    >
      <g className="pd-emblem-back">
        <path d={folio} fillRule="evenodd" />
      </g>
      <g className="pd-emblem-middle">
        <path d={folio} fillRule="evenodd" />
      </g>
      <g className="pd-emblem-front">
        <path d={folio} fillRule="evenodd" />
        <path className="pd-emblem-crease" d="m24 10.8 14.4 8.3-14.9 8.8" />
        <path className="pd-emblem-edge" d="m23.5 30 18.2-10.7" />
      </g>
    </svg>
  )
}
