export default function FlowIdentity() {
  return (
    <svg viewBox="0 0 280 150" className="flow-illustration" aria-hidden="true">
      <defs>
        <linearGradient id="flow-light">
          <stop stopColor="#88d6f4" />
          <stop offset="1" stopColor="#395365" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#flow-light)" strokeWidth="1">
        <path d="M24 28h232v100H24zM24 51h232M82 28v100M140 28v100M198 28v100" />
        <path d="M24 76h232M24 101h232" opacity=".35" />
        <path d="M36 41h30M93 64h32M150 88h33M207 113h35" strokeWidth="3" />
        <path d="m68 12 8 8-8 8M75 20h122" opacity=".7" />
      </g>
      <circle cx="33" cy="64" r="3" fill="#88d6f4" />
    </svg>
  )
}
