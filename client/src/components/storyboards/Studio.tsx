import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { Annotation } from '../../lib/storyboards/model'
import {
  loadStudioEngine,
  type StudioEngine,
} from '../../lib/storyboards/studioEngine'
import { legacyPath, objectTransform } from '../../lib/storyboards/drawing'
import { StudioIcon, StudioColor, StudioGlyph, initialStudioPalette } from './StudioControls'
import DotsLoader from '../whiteout/DotsLoader'
import InlineDelete from '../whiteout/InlineDelete'
import Menu from '../whiteout/Menu'
import { Button } from '../whiteout/Button'
import {
  strokeIntersects,
  trimStroke,
  recognizeShape,
} from '../../lib/storyboards/creativeGeometry'
import { compositionPixels } from '../../lib/storyboards/sampleComposition'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import './studio.css'
type Tool =
  | 'select'
  | 'brush'
  | 'pen'
  | 'arrow'
  | 'highlight'
  | 'text'
  | 'erase'
  | 'hand'
  | 'rectangle'
  | 'ellipse'
  | 'line'
  | 'callout'
const tools: [Tool, string, string][] = [
  ['select', 'Select', 'V'],
  ['brush', 'Brush', 'B'],
  ['pen', 'Vector pen', 'P'],
  ['arrow', 'Arrow', 'A'],
  ['highlight', 'Highlight', 'I'],
  ['rectangle', 'Rectangle', 'R'],
  ['ellipse', 'Ellipse', 'O'],
  ['line', 'Line', 'L'],
  ['callout', 'Callout', 'C'],
  ['text', 'Text', 'T'],
  ['erase', 'Eraser', 'E'],
  ['hand', 'Hand', 'H'],
]
export function DrawingObjects({
  objects,
  height = 562.5,
  visible = true,
}: {
  objects: Annotation[]
  height?: number
  visible?: boolean
}) {
  return visible ? (
    <>
      {objects.map((a) => (
        <DrawingObject key={a.id} a={a} height={height} />
      ))}
    </>
  ) : null
}
function DrawingObject({ a, height }: { a: Annotation; height: number }) {
  const marker = 'arrow-' + a.id
  return (
    <g
      transform={objectTransform(a, height)}
      opacity={a.opacity ?? (a.type === 'highlight' ? 0.32 : 1)}
      data-object={a.id}
    >
      {a.type === 'text' ? (
        <text
          x="0"
          y="0"
          dominantBaseline="hanging"
          fontFamily="Arial, sans-serif"
          fontSize={a.fontSize || Math.max(18, a.width * 5000)}
          fill={a.color}
          style={{ whiteSpace: 'pre' }}
        >
          {a.text?.split('\n').map((text, i) => (
            <tspan key={i} x="0" dy={i ? '1.25em' : 0}>
              {text || ' '}
            </tspan>
          ))}
        </text>
      ) : (
        <>
          <defs>
            <marker
              id={marker}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerUnits="userSpaceOnUse"
              markerWidth={Math.max(10, a.width * 3000)}
              markerHeight={Math.max(10, a.width * 2500)}
              orient="auto-start-reverse"
            >
              <path d="M0 0L10 5L0 10z" fill={a.color} />
            </marker>
          </defs>
          <path
            d={legacyPath(a, height)}
            fill={
              a.filled ||
              (a.type === 'pen' && !a.path) ||
              a.type === 'highlight'
                ? a.color
                : 'none'
            }
            stroke={
              a.filled ||
              (a.type === 'pen' && !a.path) ||
              a.type === 'highlight'
                ? 'none'
                : a.color
            }
            strokeWidth={a.width * 1000}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="all"
            markerEnd={a.type === 'arrow' ? `url(#${marker})` : undefined}
          />
        </>
      )}
    </g>
  )
}
export default function Studio({
  url,
  objects,
  onCommit,
  onRemove,
  onBatch,
  annotating = false,
  visible = true,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onZoomChange,
  nativeHeight = 562.5,
  frame,
  palette,
  onPaletteChange,
}: {
  palette?:string[]
  onPaletteChange?:(slot:number,color:string)=>void
  url?: string
  objects: Annotation[]
  onCommit: (a: Annotation, continuous?: boolean) => void
  onRemove: (id: string) => void
  onBatch?: (remove: string[], add: Annotation[]) => void
  annotating?: boolean
  visible?: boolean
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onZoomChange?: (z: number) => void
  nativeHeight?: number
  frame?: { height: number; fit: 'contain' | 'crop' }
}) {
  const host = useRef<HTMLDivElement>(null),
    svg = useRef<SVGSVGElement>(null),
    textInput = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 900, height: 600 }),
    [height, setHeight] = useState(nativeHeight),
    [engine, setEngine] = useState<StudioEngine>(),
    [engineError, setEngineError] = useState(''),
    [loadKey, setLoadKey] = useState(0)
  const [tool, setTool] = useState<Tool>('brush'),
    [selected, setSelected] = useState(''),
    [draft, setDraft] = useState<Annotation>(),
    [text, setText] = useState<Annotation>(),
    [properties, setProperties] = useState(false),
    [color, setColor] = useState('#172536'),
    [paletteSlot,setPaletteSlot]=useState(0),
    [widths, setWidths] = useState<Record<string, number>>({
      brush: 4,
      pen: 3,
      arrow: 3,
      rectangle: 2,
      ellipse: 2,
      line: 2,
      callout: 2,
      text: 24,
      highlight: 18,
    }),
    [opacity, setOpacity] = useState(1),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [error, setError] = useState('')
  const gesture = useRef<
      | {
          kind: string
          start: number[]
          object?: Annotation
          handle?: number
          pan: { x: number; y: number }
          client: number[]
        }
      | undefined
    >(undefined),
    pointers = useRef(
      new Map<number, { x: number; y: number; type: string }>(),
    ),
    pinch = useRef<
      | {
          distance: number
          zoom: number
          x: number
          y: number
          pan: { x: number; y: number }
        }
      | undefined
    >(undefined)
  const [inputMode, setInputMode] = useState(
      () => localStorage.getItem('whiteout:studio-input') || 'auto',
    ),
    [assist, setAssist] = useState(
      () => localStorage.getItem('whiteout:studio-shapes') !== 'false',
    ),
    [settings, setSettings] = useState(false),
    [eraseMode, setEraseMode] = useState('whole'),
    [radius, setRadius] = useState(18),
    [cursor, setCursor] = useState<number[]>(),
    [eraseView, setEraseView] = useState<{
      remove: string[]
      add: Annotation[]
    }>(),
    [sampling, setSampling] = useState(false),
    [sampleColor, setSampleColor] = useState('#ffffff')
  const lastPen = useRef(0),
    hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    recognized = useRef<Annotation | undefined>(undefined),
    sampler = useRef<Awaited<ReturnType<typeof compositionPixels>> | undefined>(
      undefined,
    ),
    erasing = useRef<
      | {
          last: number[]
          remove: Set<string>
          parts: Map<string, Annotation[]>
          paths: Map<string, number[][]>
          bounds: Map<string, number[]>
        }
      | undefined
    >(undefined)
  useEffect(() => () => clearTimeout(hold.current), [])
  useEffect(() => {
    if (!annotating) {
      clearTimeout(hold.current)
      erasing.current = undefined
      setEraseView(undefined)
      gesture.current = undefined
      current.current = undefined
      pointers.current.clear()
      pinch.current = undefined
      cancelPreview()
      setDraft(undefined)
    }
  }, [annotating])
  const width = widths[tool] || 4,
    setWidth = (n: number) => setWidths((old) => ({ ...old, [tool]: n }))
  const penPath = useRef<Annotation | undefined>(undefined),
    penOut = useRef<number[] | undefined>(undefined),
    [buildingPath, setBuildingPath] = useState(false)
  const previewFrame = useRef(0),
    latestPreview = useRef<Annotation | undefined>(undefined)
  const current = useRef<Annotation | undefined>(undefined)
  useEffect(() => () => cancelAnimationFrame(previewFrame.current), [])
  function cancelPreview() {
    cancelAnimationFrame(previewFrame.current)
    previewFrame.current = 0
    latestPreview.current = undefined
  }
  const active = objects.find((a) => a.id === selected)
  const [legacyBounds, setLegacyBounds] = useState<number[]>()
  useLayoutEffect(() => {
    if (!selected || active?.bounds) {
      setLegacyBounds(undefined)
      return
    }
    const node = svg.current?.querySelector<SVGGElement>(
      `[data-object="${selected}"]`,
    )
    if (node) {
      const b = node.getBBox()
      setLegacyBounds([b.x, b.y, b.x + b.width, b.y + b.height])
    }
  }, [selected, objects, height])
  const frameHeight = frame?.height || height,
    inner =
      frame?.fit === 'crop'
        ? Math.max(1, frameHeight / height)
        : Math.min(1, frameHeight / height),
    frameScale =
      Math.min(size.width / 1000, size.height / frameHeight) * 0.93 * zoom,
    scale = frameScale * inner,
    inset = {
      x: (1000 - 1000 * inner) / 2,
      y: (frameHeight - height * inner) / 2,
    },
    offset = {
      x: (size.width - 1000 * frameScale) / 2 + pan.x + inset.x * frameScale,
      y:
        (size.height - frameHeight * frameScale) / 2 +
        pan.y +
        inset.y * frameScale,
    },
    frameBox = {
      x: -inset.x / inner,
      y: -inset.y / inner,
      width: 1000 / inner,
      height: frameHeight / inner,
    }
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([e]) =>
      setSize({ width: e.contentRect.width, height: e.contentRect.height }),
    )
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!url) {
      setHeight(nativeHeight)
      return
    }
    const image = new Image()
    let alive = true
    image.onload = () => alive && setHeight((1000 * image.height) / image.width)
    image.src = url
    return () => {
      alive = false
    }
  }, [url, nativeHeight])
  useEffect(() => {
    onZoomChange?.(zoom)
  }, [zoom, onZoomChange])
  useEffect(() => {
    if (!annotating) return
    let alive = true
    setEngineError('')
    loadStudioEngine()
      .then((e) => alive && setEngine(e))
      .catch((e) => alive && setEngineError(e.message))
    return () => {
      alive = false
    }
  }, [annotating, loadKey])
  useEffect(() => {
    if (text) {
      textInput.current?.focus()
    }
  }, [text?.id])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        !annotating ||
        (e.target as HTMLElement).closest(
          'input,textarea,[contenteditable=true]',
        )
      )
        return
      if (tool === 'pen' && e.key === 'Enter' && penPath.current) {
        e.preventDefault()
        finishPen()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (penPath.current) {
          const complete = penPath.current.points.length >= 4
          finishPen()
          if (complete && !e.shiftKey) onUndo?.()
          return
        }
        if (e.shiftKey) onRedo?.()
        else onUndo?.()
        return
      }
      const t = tools.find((x) => x[2].toLowerCase() === e.key.toLowerCase())
      if (t) {
        clearTimeout(hold.current)
        if (gesture.current) {
          gesture.current = undefined
          current.current = undefined
          cancelPreview()
          setDraft(undefined)
          erasing.current = undefined
          setEraseView(undefined)
        }
        e.preventDefault()
        if (penPath.current) finishPen()
        setTool(t[0])
        setSelected('')
      }
      if (e.key === 'Escape') {
        clearTimeout(hold.current)
        setSampling(false)
        sampler.current = undefined
        erasing.current = undefined
        setEraseView(undefined)
        cancelPreview()
        setSelected('')
        setText(undefined)
        penPath.current = undefined
        penOut.current = undefined
        setBuildingPath(false)
        current.current = undefined
        gesture.current = undefined
        setDraft(undefined)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [annotating, onUndo, onRedo, tool, engine])
  useEffect(() => {
    if (!properties && !settings) return
    const outside = (e: PointerEvent) => {
      const portal = (e.target as Element).closest(
        '[role="menu"],[role="listbox"]',
      )
      const target =
        (portal?.id &&
          host.current?.querySelector(
            `[aria-controls="${CSS.escape(portal.id)}"]`,
          )) ||
        (e.target as Node)
      if (
        !host.current?.querySelector('.sb-properties-anchor')?.contains(target)
      )
        setProperties(false)
      if (!host.current?.querySelector('.sb-input-settings')?.contains(target))
        setSettings(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setProperties(false)
        setSettings(false)
      }
    }
    document.addEventListener('pointerdown', outside)
    window.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      window.removeEventListener('keydown', escape)
    }
  }, [properties, settings])
  function point(e: { clientX: number; clientY: number }) {
    const b = svg.current!.getBoundingClientRect()
    return [
      (e.clientX - b.left - offset.x) / scale,
      (e.clientY - b.top - offset.y) / scale,
    ]
  }
  function local(p: number[], a: Annotation) {
    const x = (p[0] - a.x * 1000) / (a.scale || 1),
      y = (p[1] - a.y * height) / (a.scale || 1),
      r = (-(a.rotation || 0) * Math.PI) / 180
    return [
      x * Math.cos(r) - y * Math.sin(r),
      x * Math.sin(r) + y * Math.cos(r),
    ]
  }
  useEffect(() => {
    const element = svg.current
    if (!element) return
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey)
        setZoom((z) =>
          Math.max(0.25, Math.min(8, z * Math.exp(-e.deltaY * 0.005))),
        )
      else setPan((v) => ({ x: v.x - e.deltaX, y: v.y - e.deltaY }))
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [])
  function calculate(a: Annotation): Annotation {
    if (!engine) return a
    if (a.type === 'text') return a
    // Legacy objects retain their original editable parameters and exact geometry algorithm.
    // All newly authored objects are explicitly tagged for the actual VectorCraft path.
    if (!a.engine) return a
    if (a.engine.includes('fragment')) {
      const points = a.points.map((p) => [p[0] * 1000, p[1] * height])
      return {
        ...a,
        path: points.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' '),
        bounds: [
          Math.min(...points.map((p) => p[0])),
          Math.min(...points.map((p) => p[1])),
          Math.max(...points.map((p) => p[0])),
          Math.max(...points.map((p) => p[1])),
        ],
      }
    }
    const op =
      a.type === 'pen' ? 'brush' : a.type === 'path' ? 'bezier' : a.type
    const geometry = engine.geometry({
      op,
      points: a.points.map((p) => [p[0] * 1000, p[1] * height, p[2] ?? 0.5]),
      width: a.width * 1000,
    })
    return { ...a, ...geometry, filled: geometry.fill }
  }
  function finishPen() {
    cancelPreview()
    const a = penPath.current
    penPath.current = undefined
    penOut.current = undefined
    setBuildingPath(false)
    gesture.current = undefined
    current.current = undefined
    setDraft(undefined)
    if (a && a.points.length >= 4) {
      try {
        const complete = calculate(a)
        onCommit(complete)
        setSelected(a.id)
      } catch (e) {
        setError((e as Error).message)
      }
    }
  }
  function preview(a: Annotation) {
    current.current = a
    latestPreview.current = a
    if (!previewFrame.current)
      previewFrame.current = requestAnimationFrame(() => {
        previewFrame.current = 0
        const next = latestPreview.current
        if (!next) return
        try {
          setDraft(calculate(next))
          setError('')
        } catch (e) {
          setError((e as Error).message)
        }
      })
  }
  function world(p: number[], a: Annotation) {
    const angle = ((a.rotation || 0) * Math.PI) / 180,
      x = p[0] * (a.scale || 1),
      y = p[1] * (a.scale || 1)
    return [
      a.x * 1000 + x * Math.cos(angle) - y * Math.sin(angle),
      a.y * height + x * Math.sin(angle) + y * Math.cos(angle),
      p[2] ?? 0.5,
    ]
  }
  function trace(a: Annotation) {
    if (['pen', 'highlight'].includes(a.type) || a.engine?.includes('fragment'))
      return a.points.map((p) =>
        world([p[0] * 1000, p[1] * height, p[2] ?? 0.5], a),
      )
    const group = svg.current?.querySelector<SVGGElement>(
        `[data-object="${a.id}"]`,
      ),
      path = group?.querySelector<SVGPathElement>(':scope > path')
    if (path) {
      const length = path.getTotalLength(),
        count = Math.max(2, Math.min(2048, Math.ceil(length / 2)))
      return Array.from({ length: count + 1 }, (_, i) => {
        const p = path.getPointAtLength((length * i) / count)
        return world([p.x, p.y], a)
      })
    }
    if (group) {
      const b = group.getBBox()
      return [
        [b.x, b.y],
        [b.x + b.width, b.y],
        [b.x + b.width, b.y + b.height],
        [b.x, b.y + b.height],
        [b.x, b.y],
      ].map((p) => world(p, a))
    }
    return []
  }
  function eraseTo(p: number[]) {
    const state = erasing.current
    if (!state) return
    const sweep = [state.last, p],
      r = eraseMode === 'partial' ? radius : Math.max(5 / scale, 3)
    for (const original of objects) {
      const paths = state.parts.get(original.id) || [original]
      if (eraseMode === 'whole') {
        if (state.remove.has(original.id)) continue
        const points = state.paths.get(original.id) || trace(original)
        state.paths.set(original.id, points)
        let bounds = state.bounds.get(original.id)
        if (!bounds && points.length) {
          bounds = [
            Math.min(...points.map((p) => p[0])),
            Math.min(...points.map((p) => p[1])),
            Math.max(...points.map((p) => p[0])),
            Math.max(...points.map((p) => p[1])),
          ]
          state.bounds.set(original.id, bounds)
        }
        const tolerance =
          r + (original.width * 1000 * (original.scale || 1)) / 2
        if (
          bounds &&
          (Math.max(sweep[0][0], p[0]) + tolerance < bounds[0] ||
            Math.min(sweep[0][0], p[0]) - tolerance > bounds[2] ||
            Math.max(sweep[0][1], p[1]) + tolerance < bounds[1] ||
            Math.min(sweep[0][1], p[1]) - tolerance > bounds[3])
        )
          continue
        if (
          strokeIntersects(
            points,
            sweep,
            r + (original.width * 1000 * (original.scale || 1)) / 2,
          )
        )
          state.remove.add(original.id)
      } else {
        if (!['pen', 'highlight', 'path', 'line'].includes(original.type))
          continue
        const next: Annotation[] = []
        let changed = false
        for (const a of paths) {
          const points = trace(a),
            rr = r + (a.width * 1000 * (a.scale || 1)) / 2
          if (!strokeIntersects(points, sweep, rr)) {
            next.push(a)
            continue
          }
          changed = true
          const fragments = trimStroke(points, sweep, rr)
          fragments.forEach((points, i) => {
            const id = i === 0 ? a.id : crypto.randomUUID()
            if (['pen', 'highlight'].includes(a.type))
              next.push(
                calculate({
                  ...a,
                  id,
                  x: 0,
                  y: 0,
                  scale: 1,
                  rotation: 0,
                  points: points.map((p) => [
                    p[0] / 1000,
                    p[1] / height,
                    p[2] ?? 0.5,
                  ]),
                  width: a.width * (a.scale || 1),
                }),
              )
            else {
              const path = points
                  .map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`)
                  .join(' '),
                xs = points.map((p) => p[0]),
                ys = points.map((p) => p[1])
              next.push({
                ...a,
                id,
                engine: 'vectorcraft-fragment-v1',
                path,
                filled: false,
                x: 0,
                y: 0,
                scale: 1,
                rotation: 0,
                width: a.width * (a.scale || 1),
                points: points.map((p) => [p[0] / 1000, p[1] / height, 0.5]),
                bounds: [
                  Math.min(...xs),
                  Math.min(...ys),
                  Math.max(...xs),
                  Math.max(...ys),
                ],
              })
            }
          })
        }
        if (changed) {
          state.remove.add(original.id)
          state.parts.set(original.id, next)
        }
      }
    }
    state.last = p
    setEraseView({
      remove: [...state.remove],
      add: eraseMode === 'partial' ? [...state.parts.values()].flat() : [],
    })
  }
  function armHold(a: Annotation) {
    clearTimeout(hold.current)
    recognized.current = undefined
    if (!assist || tool !== 'brush' || a.points.length < 5) return
    hold.current = setTimeout(() => {
      const candidate = recognizeShape(
        a.points.map((p) => [p[0] * 1000, p[1] * height, p[2] ?? 0.5]),
      )
      if (!candidate) return
      try {
        const corrected = calculate({
          ...a,
          type: candidate.type,
          points: candidate.points.map((p) => [
            p[0] / 1000,
            p[1] / height,
            0.5,
          ]),
        })
        recognized.current = corrected
        setDraft(corrected)
      } catch {}
    }, 800)
  }
  const sampleReplacement=useRef<((v:string)=>void)|undefined>(undefined);
  function applyPickedColor(value: string) {
    if(sampleReplacement.current){const replace=sampleReplacement.current;sampleReplacement.current=undefined;replace(value);return}
    if (tool === 'select' && active)
      onCommit(calculate({ ...active, color: value }))
    else setColor(value)
  }
  async function pickColor() {
    const System = (
      window as unknown as {
        EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> }
      }
    ).EyeDropper
    if (System) {
      try {
        const result = await new System().open()
        applyPickedColor(result.sRGBHex)
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') {sampleReplacement.current=undefined;return}
      }
    }
    try {
      const group = svg.current?.querySelector<SVGGElement>(
        '.sb-studio-composition',
      )
      if (!group) {sampleReplacement.current=undefined;return}
      sampler.current = await compositionPixels(
        group,
        height,
        frameBox,
        frameBox.width * scale * window.devicePixelRatio,
      )
      setProperties(false)
      setSampling(true)
    } catch (e) {
      setError((e as Error).message)
    }
  }
  function down(e: ReactPointerEvent<SVGSVGElement>) {
    if (e.button !== 0) return
    e.preventDefault()
    if (sampling) {
      const p = point(e)
      if (
        sampler.current &&
        p[0] >= frameBox.x &&
        p[0] <= frameBox.x + frameBox.width &&
        p[1] >= frameBox.y &&
        p[1] <= frameBox.y + frameBox.height
      )
        applyPickedColor(sampler.current.sample(p[0], p[1]))
      setSampling(false)
      return
    }
    clearTimeout(hold.current)
    recognized.current = undefined
    if (e.pointerType === 'pen') lastPen.current = Date.now()
    const penActive = [...pointers.current.values()].some(
      (p) => p.type === 'pen',
    )
    if (e.pointerType === 'touch' && penActive) return
    if (
      e.pointerType === 'pen' &&
      [...pointers.current.values()].some((p) => p.type === 'touch')
    ) {
      cancelPreview()
      pointers.current.clear()
      pinch.current = undefined
      gesture.current = undefined
      current.current = undefined
      setDraft(undefined)
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* A cancelled or synthetic pointer may already be inactive. */
    }
    pointers.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      type: e.pointerType,
    })
    if (pointers.current.size === 2) {
      clearTimeout(hold.current)
      erasing.current = undefined
      setEraseView(undefined)
      cancelPreview()
      const [a, b] = [...pointers.current.values()]
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        zoom,
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2,
        pan,
      }
      current.current = undefined
      gesture.current = undefined
      setDraft(undefined)
      return
    }
    const p = point(e),
      target = (e.target as Element).closest(
        '[data-edit-object]',
      ) as SVGElement | null,
      object = objects.find((a) => a.id === target?.dataset.editObject),
      handle = (e.target as Element).closest(
        '[data-handle]',
      ) as SVGElement | null
    if (
      !annotating ||
      tool === 'hand' ||
      e.altKey ||
      (e.pointerType === 'touch' &&
        (inputMode === 'navigate' ||
          (inputMode === 'auto' && lastPen.current > 0)))
    ) {
      gesture.current = {
        kind: 'pan',
        start: p,
        client: [e.clientX, e.clientY],
        pan,
      }
      return
    }
    if (!engine) {
      setError('Drawing engine is not ready.')
      return
    }
    if (tool === 'erase') {
      erasing.current = {
        last: p,
        remove: new Set(),
        parts: new Map(),
        paths: new Map(),
        bounds: new Map(),
      }
      gesture.current = {
        kind: 'erase',
        start: p,
        client: [e.clientX, e.clientY],
        pan,
      }
      if (eraseMode === 'whole' && object?.type === 'text')
        erasing.current.remove.add(object.id)
      eraseTo(p)
      return
    }
    if (tool === 'text' && object?.type === 'text') {
      setText(object)
      setSelected(object.id)
      return
    }
    if (tool === 'select') {
      if (object) {
        setSelected(object.id)
        gesture.current = {
          kind: handle?.dataset.handle || 'move',
          handle: handle?.dataset.index ? Number(handle.dataset.index) : 0,
          start: p,
          object,
          client: [e.clientX, e.clientY],
          pan,
        }
      } else setSelected('')
      return
    }
    if (
      p[0] < frameBox.x ||
      p[0] > frameBox.x + frameBox.width ||
      p[1] < frameBox.y ||
      p[1] > frameBox.y + frameBox.height
    )
      return
    setSelected('')
    const a: Annotation = {
      id: crypto.randomUUID(),
      engine: 'vectorcraft-639c9d6-v1',
      type:
        tool === 'brush'
          ? 'pen'
          : tool === 'pen'
            ? 'path'
            : (tool as Annotation['type']),
      color,
      width: width / 1000,
      opacity: tool === 'highlight' ? 0.32 : opacity,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      points: [
        [
          p[0] / 1000,
          p[1] / height,
          e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5,
        ],
      ],
    }
    if (tool === 'pen') {
      const q = [p[0] / 1000, p[1] / height, 0.5]
      const previous = penPath.current
      if (previous) {
        const last = previous.points[previous.points.length - 1]
        if (Math.hypot((last[0] - q[0]) * 1000, (last[1] - q[1]) * height) < 2)
          return
        const next = {
          ...previous,
          points: [...previous.points, penOut.current || last, q, q],
        }
        penPath.current = next
        preview(next)
      } else {
        penPath.current = { ...a, type: 'path', points: [q] }
        penOut.current = q
        preview(penPath.current)
        setBuildingPath(true)
      }
      gesture.current = {
        kind: 'pen-anchor',
        start: p,
        client: [e.clientX, e.clientY],
        pan,
      }
      return
    }
    if (tool === 'text') {
      setText({
        ...a,
        x: p[0] / 1000,
        y: p[1] / height,
        text: '',
        points: [],
        fontSize: width,
      })
      return
    }
    if (['arrow', 'path'].includes(a.type))
      a.points = Array.from({ length: a.type === 'path' ? 4 : 3 }, () => [
        ...a.points[0],
      ])
    gesture.current = {
      kind: 'draw',
      start: p,
      client: [e.clientX, e.clientY],
      pan,
    }
    preview(a)
  }
  function move(e: ReactPointerEvent<SVGSVGElement>) {
    if (sampling || tool === 'erase') {
      const p = point(e)
      setCursor(p)
      if (sampling && sampler.current)
        setSampleColor(sampler.current.sample(p[0], p[1]))
    }
    if (gesture.current?.kind === 'erase') {
      const samples = e.nativeEvent.getCoalescedEvents?.() || []
      for (const sample of samples.length ? samples : [e.nativeEvent])
        eraseTo(point(sample))
      return
    }
    if (pointers.current.has(e.pointerId))
      pointers.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        type: e.pointerType,
      })
    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()],
        g = pinch.current
      setZoom(
        Math.max(
          0.25,
          Math.min(8, (g.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / g.distance),
        ),
      )
      setPan({
        x: g.pan.x + (a.x + b.x) / 2 - g.x,
        y: g.pan.y + (a.y + b.y) / 2 - g.y,
      })
      return
    }
    const g = gesture.current
    if (!g) {
      if (tool === 'pen' && penPath.current && engine) {
        const a = penPath.current,
          q = point(e),
          p = [q[0] / 1000, q[1] / height, 0.5]
        try {
          setDraft(
            calculate({
              ...a,
              points: [
                ...a.points,
                penOut.current || a.points[a.points.length - 1],
                p,
                p,
              ],
            }),
          )
        } catch {}
      }
      return
    }
    if (g.kind === 'pan') {
      setPan({
        x: g.pan.x + e.clientX - g.client[0],
        y: g.pan.y + e.clientY - g.client[1],
      })
      return
    }
    const p = point(e)
    if (g.kind === 'pen-anchor' && penPath.current) {
      const a = penPath.current,
        anchor = a.points[a.points.length - 1],
        out = [p[0] / 1000, p[1] / height, 0.5],
        points = [...a.points]
      penOut.current = out
      if (points.length >= 4)
        points[points.length - 2] = [
          2 * anchor[0] - out[0],
          2 * anchor[1] - out[1],
          0.5,
        ]
      const next = { ...a, points }
      penPath.current = next
      preview(next)
      return
    }
    if (g.object) {
      const a = g.object
      if (g.kind === 'move') {
        preview({
          ...a,
          x: a.x + (p[0] - g.start[0]) / 1000,
          y: a.y + (p[1] - g.start[1]) / height,
        })
        return
      }
      if (g.kind === 'scale') {
        const origin = [a.x * 1000, a.y * height],
          base = Math.hypot(g.start[0] - origin[0], g.start[1] - origin[1]) || 1
        preview({
          ...a,
          scale: Math.max(
            0.05,
            Math.min(
              20,
              (a.scale * Math.hypot(p[0] - origin[0], p[1] - origin[1])) / base,
            ),
          ),
        })
        return
      }
      if (g.kind === 'rotate') {
        preview({
          ...a,
          rotation:
            (a.rotation || 0) +
            ((Math.atan2(p[1] - a.y * height, p[0] - a.x * 1000) -
              Math.atan2(g.start[1] - a.y * height, g.start[0] - a.x * 1000)) *
              180) /
              Math.PI,
        })
        return
      }
      if (g.kind === 'point') {
        const q = local(p, a),
          points = a.points.map((v, i) =>
            i === g.handle ? [q[0] / 1000, q[1] / height, v[2] ?? 0.5] : v,
          )
        preview({ ...a, points })
        return
      }
    }
    const a = current.current
    if (!a) return
    let points = a.points
    if (a.type === 'pen' || a.type === 'highlight') {
      const coalesced = e.nativeEvent.getCoalescedEvents?.() || []
      const samples = coalesced.length ? coalesced : [e.nativeEvent]
      points = [
        ...points,
        ...samples.map((s) => {
          const q = point(s)
          return [
            q[0] / 1000,
            q[1] / height,
            s.pointerType === 'pen' && s.pressure > 0 ? s.pressure : 0.5,
          ]
        }),
      ]
      // Bounded local samples; only completed geometry is committed to collaboration.
      if (points.length > 2048)
        points = points.filter((_, i) => i % 2 === 0 || i === points.length - 1)
    } else if (a.type === 'arrow') {
      const start = points[0]
      points = [
        start,
        [(start[0] + p[0] / 1000) / 2, (start[1] + p[1] / height) / 2, 0.5],
        [p[0] / 1000, p[1] / height, 0.5],
      ]
    } else if (a.type === 'path') {
      const s = points[0],
        x = p[0] / 1000,
        y = p[1] / height
      points = [
        s,
        [s[0] + (x - s[0]) / 3, s[1] - (y - s[1]) / 2, 0.5],
        [s[0] + ((x - s[0]) * 2) / 3, y + (y - s[1]) / 2, 0.5],
        [x, y, 0.5],
      ]
    } else points = [points[0], [p[0] / 1000, p[1] / height, 0.5]]
    const next = { ...a, points }
    preview(next)
    armHold(next)
  }
  function finish(e: ReactPointerEvent<SVGSVGElement>, cancel = false) {
    clearTimeout(hold.current)
    pointers.current.delete(e.pointerId)
    if (gesture.current?.kind === 'erase') {
      if (!cancel) eraseTo(point(e))
      const state = erasing.current
      erasing.current = undefined
      gesture.current = undefined
      setEraseView(undefined)
      if (!cancel && state && state.remove.size) {
        const remove = [...state.remove],
          add = eraseMode === 'partial' ? [...state.parts.values()].flat() : []
        if (onBatch) onBatch(remove, add)
        else {
          remove.forEach(onRemove)
          add.forEach((a) => onCommit(a))
        }
      }
      return
    }
    if (pinch.current) {
      if (!pointers.current.size) pinch.current = undefined
      return
    }
    if (gesture.current?.kind === 'pan') {
      gesture.current = undefined
      return
    }
    if (gesture.current?.kind === 'pen-anchor') {
      gesture.current = undefined
      if (cancel) {
        cancelPreview()
        penPath.current = undefined
        penOut.current = undefined
        setBuildingPath(false)
        current.current = undefined
        setDraft(undefined)
      }
      return
    }
    cancelPreview()
    const a = current.current
    gesture.current = undefined
    current.current = undefined
    setDraft(undefined)
    if (!cancel && a) {
      try {
        const value = a.engine ? a : calculate(a)
        onCommit(calculate(value))
        if (recognized.current) onCommit(recognized.current)
        recognized.current = undefined
        setSelected(value.id)
      } catch (err) {
        setError((err as Error).message)
      }
    }
  }
  function style(changes: Partial<Annotation>) {
    if (tool === 'select' && active) {
      try {
        onCommit(calculate({ ...active, ...changes }), true)
      } catch (e) {
        setError((e as Error).message)
      }
    }
  }
  function saveText() {
    if (!text) return
    const content = textInput.current?.innerText.replace(/\r\n/g, '\n') || ''
    if (content.trim()) onCommit({ ...text, text: content })
    setText(undefined)
  }
  const display = objects
    .filter((a) => !eraseView?.remove.includes(a.id))
    .map((a) => (draft?.id === a.id ? draft : a))
  if (eraseView) display.push(...eraseView.add)
  if (draft && !display.some((a) => a.id === draft.id)) display.push(draft)
  const selectedObject = display.find((a) => a.id === selected),
    bounds =
      selectedObject?.bounds ||
      legacyBounds ||
      (selectedObject?.type === 'text'
        ? [
            0,
            0,
            Math.max(
              80,
              (selectedObject.text?.length || 1) *
                (selectedObject.fontSize || 20) *
                0.6,
            ),
            selectedObject.fontSize || 24,
          ]
        : undefined)
  const shownWidth =
      tool === 'select' && active
        ? active.type === 'text'
          ? active.fontSize || 24
          : active.width * 1000
        : width,
    shownColor = tool === 'select' && active ? active.color : color,
    shownOpacity = tool === 'select' && active ? (active.opacity ?? 1) : opacity
  const toolbarPosition =
    selectedObject && bounds
      ? {
          left: Math.max(
            80,
            Math.min(
              size.width - 80,
              offset.x +
                (selectedObject.x * 1000 +
                  ((bounds[0] + bounds[2]) / 2) * (selectedObject.scale || 1)) *
                  scale,
            ),
          ),
          top: Math.max(
            14,
            Math.min(
              size.height - 100,
              offset.y +
                (selectedObject.y * height +
                  bounds[1] * (selectedObject.scale || 1)) *
                  scale -
                48,
            ),
          ),
        }
      : undefined
  return (
    <div
      className={`sb-studio ${annotating ? 'is-editing' : ''}`}
      ref={host}
      onBlurCapture={(e) => {
        if (
          penPath.current &&
          !(
            e.relatedTarget instanceof Node &&
            e.currentTarget.contains(e.relatedTarget)
          )
        )
          finishPen()
      }}
      data-drawing-engine={
        engine ? 'vectorcraft-639c9d6' : annotating ? 'loading' : 'view'
      }
    >
      <svg
        ref={svg}
        className="sb-studio-canvas"
        style={{
          cursor: sampling
            ? 'crosshair'
            : tool === 'erase'
              ? 'none'
              : undefined,
        }}
        onContextMenu={(e) => {
          if (annotating) e.preventDefault()
        }}
        aria-label={
          annotating ? 'Storyboard drawing canvas' : 'Storyboard artwork'
        }
        width={size.width}
        height={size.height}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={(e) => finish(e)}
        onPointerCancel={(e) => finish(e, true)}
        onLostPointerCapture={(e) => {
          if (pointers.current.has(e.pointerId)) finish(e, true)
        }}
        onDoubleClick={(e) => {
          if (tool === 'pen' && penPath.current) {
            finishPen()
            return
          }
          const id = (e.target as Element)
              .closest('[data-edit-object]')
              ?.getAttribute('data-edit-object'),
            a = objects.find((a) => a.id === id)
          if (annotating && a?.type === 'text') {
            setText(a)
            setSelected(a.id)
          }
        }}
      >
        <g transform={`translate(${offset.x} ${offset.y}) scale(${scale})`}>
          <defs>
            <clipPath id="studio-frame">
              <rect {...frameBox} />
            </clipPath>
          </defs>
          <g className="sb-studio-composition" clipPath="url(#studio-frame)">
            <rect {...frameBox} fill="#fff" />
            {url && (
              <image
                href={url}
                width="1000"
                height={height}
                preserveAspectRatio="none"
              />
            )}
            {visible &&
              display.map((a) => (
                <g
                  key={a.id}
                  data-edit-object={a.id}
                  style={{
                    cursor:
                      annotating && tool === 'select' ? 'move' : undefined,
                  }}
                >
                  <DrawingObject a={a} height={height} />
                </g>
              ))}
          </g>
          {annotating && cursor && (tool === 'erase' || sampling) && (
            <g pointerEvents="none">
              <circle
                cx={cursor[0]}
                cy={cursor[1]}
                r={
                  sampling
                    ? 8 / scale
                    : eraseMode === 'partial'
                      ? radius
                      : 6 / scale
                }
                fill={sampling ? sampleColor : 'rgba(130,210,250,.1)'}
                stroke="#318bbc"
                strokeWidth={1.5 / scale}
              />
              {sampling && (
                <rect
                  x={cursor[0] + 14 / scale}
                  y={cursor[1] - 35 / scale}
                  width={32 / scale}
                  height={24 / scale}
                  rx={4 / scale}
                  fill={sampleColor}
                  stroke="#fff"
                  strokeWidth={2 / scale}
                />
              )}
            </g>
          )}
          {annotating && tool === 'select' && selectedObject && bounds && (
            <g
              data-edit-object={selectedObject.id}
              transform={objectTransform(selectedObject, height)}
              className="sb-object-handles"
            >
              <rect
                x={bounds[0] - 3}
                y={bounds[1] - 3}
                width={Math.max(8, bounds[2] - bounds[0] + 6)}
                height={Math.max(8, bounds[3] - bounds[1] + 6)}
                fill="none"
                stroke="#278bc0"
                strokeWidth={1 / scale}
                pointerEvents="none"
              />
              <circle
                data-handle="scale"
                cx={bounds[2]}
                cy={bounds[3]}
                r={6 / scale}
                fill="#fff"
                stroke="#278bc0"
                strokeWidth={1 / scale}
              />
              <circle
                data-handle="rotate"
                cx={(bounds[0] + bounds[2]) / 2}
                cy={bounds[1] - 22 / scale}
                r={6 / scale}
                fill="#fff"
                stroke="#278bc0"
                strokeWidth={1 / scale}
              />
              {['arrow', 'path'].includes(selectedObject.type) &&
                selectedObject.points.map((p, i) =>
                  selectedObject.engine?.includes('fragment') &&
                  i > 0 &&
                  i < selectedObject.points.length - 1 ? null : (
                    <circle
                      key={i}
                      data-handle="point"
                      data-index={i}
                      cx={p[0] * 1000}
                      cy={p[1] * height}
                      r={6 / scale}
                      fill={
                        i === 0 || i === selectedObject.points.length - 1
                          ? '#fff'
                          : '#87d8ff'
                      }
                      stroke="#278bc0"
                      strokeWidth={1 / scale}
                    />
                  ),
                )}
            </g>
          )}
          {buildingPath && penPath.current && (
            <g>
              {penPath.current.points
                .filter((_, i) => i % 3 === 0)
                .map((p, i) => (
                  <circle
                    key={i}
                    cx={p[0] * 1000}
                    cy={p[1] * height}
                    r={4 / scale}
                    fill="#fff"
                    stroke="#278bc0"
                    strokeWidth={1 / scale}
                  />
                ))}
            </g>
          )}
          {text && (
            <foreignObject
              transform={objectTransform(text, height)}
              x="0"
              y="0"
              width="600"
              height="300"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div
                ref={textInput}
                className="sb-live-text"
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label="Artwork text"
                style={{ fontSize: text.fontSize || 20, color: text.color }}
                onBlur={saveText}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    setText(undefined)
                  }
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault()
                    saveText()
                  }
                }}
              >
                {text.text}
              </div>
            </foreignObject>
          )}
        </g>
      </svg>
      {annotating && !engine && (
        <div className="sb-engine-state">
          {engineError ? (
            <>
              <StudioGlyph name="pen" />
              <p role="alert">{engineError}</p>
              <Button onClick={() => setLoadKey((k) => k + 1)}>
                Retry drawing engine
              </Button>
            </>
          ) : (
            <>
              <DotsLoader />
              <span>Opening Studio…</span>
            </>
          )}
        </div>
      )}
      {buildingPath && (
        <div className="sb-pen-complete">
          <Button icon="check" variant="primary" onClick={finishPen}>
            Finish path
          </Button>
          <StudioIcon
            name="close"
            label="Cancel path"
            onClick={() => {
              cancelPreview()
              penPath.current = undefined
              penOut.current = undefined
              current.current = undefined
              gesture.current = undefined
              setBuildingPath(false)
              setDraft(undefined)
            }}
          />
        </div>
      )}
      {error && (
        <div className="sb-studio-error" role="alert">
          {error}
          <StudioIcon
            name="close"
            label="Dismiss drawing error"
            onClick={() => setError('')}
          />
        </div>
      )}
      {annotating && (
        <div
          className="sb-creative-dock"
          role="toolbar"
          aria-label="Creative tools"
        >
          {tools.map(([id, label, key]) => (
            <StudioIcon
              key={id}
              name={id === 'brush' ? 'brush' : id === 'pen' ? 'pen' : id}
              label={`${label} (${key})`}
              active={tool === id}
              onClick={() => {
                clearTimeout(hold.current)
                cancelPreview()
                gesture.current = undefined
                current.current = undefined
                erasing.current = undefined
                setEraseView(undefined)
                setDraft(undefined)
                setSampling(false)
                if (penPath.current) finishPen()
                setTool(id)
                setProperties(false)
                setSettings(false)
              }}
            />
          ))}
          <span className="sb-dock-divider" />
          <StudioIcon
            name="undo"
            label="Undo"
            disabled={!canUndo && !buildingPath}
            onClick={() => {
              if (penPath.current) {
                const complete = penPath.current.points.length >= 4
                finishPen()
                if (complete) onUndo?.()
              } else onUndo?.()
            }}
          />
          <StudioIcon
            name="redo"
            label="Redo"
            disabled={!canRedo}
            onClick={onRedo}
          />
          <span className="sb-dock-divider" />
          <div className="sb-input-settings">
            <StudioIcon
              name="gear"
              label="Studio settings"
              active={settings}
              aria-expanded={settings}
              aria-haspopup="dialog"
              onClick={() => setSettings((v) => !v)}
            />
            {settings && (
              <div
                className="sb-tool-properties"
                role="dialog"
                aria-label="Studio settings"
              >
                <strong>Studio settings</strong>
                <span className="sb-settings-label">Drawing input</span>
                <Menu
                  ariaLabel="Drawing input"
                  label={
                    inputMode === 'auto'
                      ? 'Auto'
                      : inputMode === 'touch'
                        ? 'Touch Drawing'
                        : 'Navigation Only'
                  }
                  value={inputMode}
                  onChange={(v) => {
                    setInputMode(v)
                    localStorage.setItem('whiteout:studio-input', v)
                  }}
                  items={[
                    { value: 'auto', label: 'Auto' },
                    { value: 'touch', label: 'Touch Drawing' },
                    { value: 'navigate', label: 'Navigation Only' },
                  ]}
                />
                <label className="sb-assist-toggle">
                  <DrawCheckbox
                    checked={assist}
                    onChange={(e) => {
                      setAssist(e.target.checked)
                      localStorage.setItem(
                        'whiteout:studio-shapes',
                        String(e.target.checked),
                      )
                    }}
                  />
                  Shape Assistance
                </label>
              </div>
            )}
          </div>
        </div>
      )}
      {annotating && (
        <div className="sb-properties-anchor">
          <button
            className="sb-property-trigger"
            aria-expanded={properties}
            onClick={() => setProperties((v) => !v)}
          >
            <span style={{ background: shownColor }} />
            <span>
              {tool === 'select' && active
                ? 'Object'
                : tool === 'text'
                  ? 'Text'
                  : tool === 'erase'
                    ? 'Eraser'
                    : 'Brush'}
            </span>
            <small>
              {tool === 'erase'
                ? eraseMode === 'partial'
                  ? `${radius} px radius`
                  : 'Whole stroke'
                : `${Math.round(shownWidth)} px`}
            </small>
            <StudioGlyph name="settings" />
          </button>
          {properties && (
            <div className="sb-tool-properties">
              <strong>
                {tool === 'select' && active ? 'Selected object' : 'Next mark'}
              </strong>
              {tool === 'brush' && (
                <Menu
                  ariaLabel="Brush preset"
                  label={
                    width === 2
                      ? 'Fine brush'
                      : width === 4
                        ? 'Round brush'
                        : width === 12
                          ? 'Broad brush'
                          : 'Custom brush'
                  }
                  value={String(width)}
                  items={[
                    { value: '2', label: 'Fine · 2 px' },
                    { value: '4', label: 'Round · 4 px' },
                    { value: '12', label: 'Broad · 12 px' },
                  ]}
                  onChange={(v) => {
                    setWidth(Number(v))
                    setOpacity(v === '12' ? 0.75 : 1)
                  }}
                />
              )}
              {tool === 'erase' ? (
                <>
                  <Menu
                    ariaLabel="Eraser mode"
                    label={eraseMode === 'partial' ? 'Partial' : 'Whole stroke'}
                    value={eraseMode}
                    items={[
                      { value: 'partial', label: 'Partial' },
                      { value: 'whole', label: 'Whole stroke' },
                    ]}
                    onChange={setEraseMode}
                  />
                  {eraseMode === 'partial' && (
                    <>
                      <label>
                        Radius <output>{radius} px</output>
                        <input
                          aria-label="Eraser radius"
                          type="range"
                          min="3"
                          max="80"
                          value={radius}
                          onChange={(e) => setRadius(Number(e.target.value))}
                        />
                      </label>
                      <small>
                        Trims strokes and paths; use Whole stroke for shapes and
                        text.
                      </small>
                    </>
                  )}
                </>
              ) : (
                <>
                  <StudioColor
                    palette={palette}
                    onPaletteChange={onPaletteChange}
                    selectedSlot={paletteSlot}
                    onSelectSlot={setPaletteSlot}
                    onSample={(replace)=>{sampleReplacement.current=replace;void pickColor()}}
                    value={shownColor}
                    onChange={(v) => {
                      if (tool === 'select' && active) style({ color: v })
                      else setColor(v)
                    }}
                  />
                  <label>
                    {tool === 'text' ||
                    (tool === 'select' && active?.type === 'text')
                      ? 'Text size'
                      : 'Width'}{' '}
                    <output>{Math.round(shownWidth)} px</output>
                    <input
                      aria-label={
                        tool === 'select' && active
                          ? active.type === 'text'
                            ? 'Object font size'
                            : 'Object width'
                          : tool === 'text'
                            ? 'Text size'
                            : 'Brush width'
                      }
                      type="range"
                      min="1"
                      max={
                        tool === 'text' || active?.type === 'text' ? 100 : 48
                      }
                      value={shownWidth}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        if (tool === 'select' && active)
                          style(
                            active.type === 'text'
                              ? { fontSize: n }
                              : { width: n / 1000 },
                          )
                        else setWidth(n)
                      }}
                    />
                  </label>
                  <label>
                    Opacity <output>{Math.round(shownOpacity * 100)}%</output>
                    <input
                      aria-label="Drawing opacity"
                      type="range"
                      min=".05"
                      max="1"
                      step=".05"
                      value={shownOpacity}
                      onChange={(e) => {
                        const n = Number(e.target.value)
                        if (tool === 'select' && active) style({ opacity: n })
                        else setOpacity(n)
                      }}
                    />
                  </label>
                </>
              )}
            </div>
          )}
        </div>
      )}
      {sampling && (
        <div className="sb-sampling-status" role="status">
          Sample artwork · Escape to cancel
        </div>
      )}
      {annotating && tool === 'select' && active && (
        <div className="sb-object-actions" style={toolbarPosition}>
          <StudioIcon
            name="settings"
            label="Object properties"
            onClick={() => setProperties((v) => !v)}
          />
          {active.type === 'text' && (
            <StudioIcon
              name="text"
              label="Edit text"
              onClick={() => setText(active)}
            />
          )}
          <StudioIcon
            name="duplicate"
            label="Duplicate object"
            onClick={() =>
              onCommit({
                ...active,
                id: crypto.randomUUID(),
                x: active.x + 0.02,
                y: active.y + 0.02,
              })
            }
          />
          <InlineDelete
            label="drawing object"
            onConfirm={async () => {
              onRemove(active.id)
              setSelected('')
            }}
          />
        </div>
      )}
      <div className="sb-studio-navigation">
        <StudioIcon
          name="minus"
          label="Zoom out"
          onClick={() => setZoom((v) => Math.max(0.25, v / 1.2))}
        />
        <output>{Math.round(zoom * 100)}%</output>
        <StudioIcon
          name="plus"
          label="Zoom in"
          onClick={() => setZoom((v) => Math.min(8, v * 1.2))}
        />
        <StudioIcon
          name="fit"
          label="Fit artwork"
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
        />
      </div>
    </div>
  )
}
