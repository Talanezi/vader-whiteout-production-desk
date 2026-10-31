import { useCallback, useRef, type ReactNode } from 'react'
import { MetalFx, useMetalBend, BEND_DEFAULTS } from 'metal-fx'

export default function ReactiveMetal({
  children,
  paused,
}: {
  children: ReactNode
  paused: boolean
}) {
  const ref = useRef<HTMLDivElement>(null),
    pausedRef = useRef(paused)
  pausedRef.current = paused
  const config = useCallback(
    () => ({
      ...BEND_DEFAULTS,
      enabled: !pausedRef.current,
      applyTo: 'ring' as const,
      maxDisp: 5,
      strength: 0.65,
    }),
    [],
  )
  useMetalBend(ref, config)
  return (
    <MetalFx
      ref={ref}
      preset="silver"
      theme="dark"
      strength={0.95}
      innerShadow={{ alpha: 0.55, blur: 0.6 }}
      ringCssPx={1.6}
      shaderScale={1.35}
      disableGlow
      normalizeHostStyles={false}
      paused={paused}
    >
      {children}
    </MetalFx>
  )
}
