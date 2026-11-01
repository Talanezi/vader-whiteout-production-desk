/** EasyUI Loader/Dots (MIT Suraj Maurya), CSS adaptation with bounded geometry. */
export default function DotsLoader({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`pd-dots-loader ${small ? 'is-small' : ''}`}
      aria-hidden="true"
    >
      <i />
      <i />
      <i />
    </span>
  )
}
