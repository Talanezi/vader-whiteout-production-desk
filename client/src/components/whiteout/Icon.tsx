import type { SVGProps } from 'react'
export type IconName =
  | 'file'
  | 'people'
  | 'plus'
  | 'search'
  | 'close'
  | 'chevron'
  | 'arrow'
  | 'back'
  | 'grid'
  | 'collapse'
  | 'expand'
  | 'menu'
  | 'more'
  | 'copy'
  | 'download'
  | 'trash'
  | 'edit'
  | 'check'
  | 'alert'
  | 'import'
  | 'mail'
  | 'phone'
  | 'sort'
  | 'lock'
  | 'retry'
  | 'calendar'
const paths: Record<IconName, string> = {
  file: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
  people:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M18 8a3 3 0 0 1 0 6 M22 21v-2a4 4 0 0 0-3-3.9',
  plus: 'M12 5v14 M5 12h14',
  search: 'M21 21l-5-5 M18 10a8 8 0 1 0-16 0 8 8 0 0 0 16 0',
  close: 'M6 6l12 12 M6 18 18 6',
  chevron: 'm7 10 5 5 5-5',
  arrow: 'M5 12h14 m-6-6 6 6-6 6',
  back: 'M19 12H5 m6-6-6 6 6 6',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  collapse: 'M3 4h18v16H3z M9 4v16 m7-11-3 3 3 3',
  expand: 'M3 4h18v16H3z M9 4v16 m4-11 3 3-3 3',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  more: 'M5 12h.01 M12 12h.01 M19 12h.01',
  copy: 'M9 8h12v13H9z M15 8V3H3v13h6',
  download: 'M12 3v12 m-5-5 5 5 5-5 M4 16v5h16v-5',
  trash: 'M3 6h18 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
  edit: 'm15 4 5 5 M4 20l5-1L21 7l-5-5L4 14z',
  check: 'm5 12 4 4L19 6',
  alert: 'M12 3 2 21h20z M12 9v5 M12 17h.01',
  import: 'M12 3v12 m-5-5 5 5 5-5 M3 17v4h18v-4',
  mail: 'M3 5h18v14H3z m0 0 9 7 9-7',
  phone: 'M7 3H3c0 10 8 18 18 18v-4l-5-2-3 3-7-7 3-3z',
  sort: 'M4 6h16 M4 12h11 M4 18h6',
  lock: 'M5 10h14v11H5z M8 10V7a4 4 0 0 1 8 0v3 M12 14v3',
  retry: 'M20 7v5h-5 M20 12a8 8 0 1 0-2 5',
  calendar: 'M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18 M7 14h3 M14 14h3',
}
export default function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === 'more' ? 3 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  )
}
