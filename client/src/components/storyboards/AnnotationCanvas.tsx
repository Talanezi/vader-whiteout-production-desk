import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Stage,
  Layer,
  Image as CanvasImage,
  Group,
  Path,
  Arrow,
  Text,
  Circle,
  Transformer,
} from 'react-konva'
import Konva from 'konva'
import { getStroke } from 'perfect-freehand'
import { Button } from '../whiteout/Button'
import type { Annotation } from '../../lib/storyboards/model'
import './storyboards.css'
export function strokePath(
  points: number[][],
  width: number,
  highlight = false,
) {
  const polygon = getStroke(points, {
    size: width,
    thinning: highlight ? 0 : 0.45,
    smoothing: 0.65,
    streamline: 0.6,
    simulatePressure: points.every((p) => p[2] === 0.5),
    last: true,
  })
  if (polygon.length < 3) return ''
  return 'M' + polygon.map(([x, y]) => `${x},${y}`).join(' L') + ' Z'
}
export default function AnnotationCanvas({
  url,
  objects,
  onCommit,
  onRemove,
  annotating = false,
  visible = true,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onReady,
  onZoomChange,
}: {
  url: string
  objects: Annotation[]
  onCommit: (v: Annotation, continuous?: boolean) => void
  onRemove: (id: string) => void
  annotating?: boolean
  visible?: boolean
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onZoomChange?: (zoom: number) => void
  onReady?: (stage: Konva.Stage) => void
}) {
  const box = useRef<HTMLDivElement>(null),
    stage = useRef<Konva.Stage>(null),
    transform = useRef<Konva.Transformer>(null)
  const [size, setSize] = useState({ width: 800, height: 500 }),
    [image, setImage] = useState<HTMLImageElement>(),
    [imageError, setImageError] = useState('')
  const [tool, setTool] = useState<
      'select' | 'pan' | Annotation['type'] | 'erase'
    >('select'),
    [color, setColor] = useState('#77d7ff'),
    [lineWidth, setLineWidth] = useState(4),
    [selected, setSelected] = useState('')
  const [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [draft, setDraft] = useState<Annotation>(),
    [textEdit, setTextEdit] = useState<Annotation>()
  const pending = useRef<Annotation | undefined>(undefined),
    panning = useRef<
      { x: number; y: number; pan: { x: number; y: number } } | undefined
    >(undefined)
  const worldHeight = image ? (1000 * image.height) / image.width : 625,
    fit = Math.min(size.width / 1000, size.height / worldHeight) * 0.96,
    scale = fit * zoom
  useEffect(() => {
    onZoomChange?.(zoom)
  }, [zoom, onZoomChange])
  const offset = {
    x: (size.width - 1000 * scale) / 2 + pan.x,
    y: (size.height - worldHeight * scale) / 2 + pan.y,
  }
  useLayoutEffect(() => {
    const element = box.current!
    const ro = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    )
    ro.observe(element)
    return () => ro.disconnect()
  }, [])
  useEffect(() => {
    let alive = true
    const img = new window.Image()
    setImage(undefined)
    setImageError('')
    img.onload = () => {
      if (alive) {
        setImage(img)
        setZoom(1)
        setPan({ x: 0, y: 0 })
      }
    }
    img.onerror = () => alive && setImageError('Artwork could not be loaded.')
    img.src = url
    return () => {
      alive = false
    }
  }, [url])
  useEffect(() => {
    if (stage.current) onReady?.(stage.current)
  }, [image, onReady])
  useEffect(() => {
    const target = stage.current?.findOne('#annotation-' + selected)
    transform.current?.nodes(target && tool === 'select' ? [target] : [])
  }, [selected, tool, objects, visible])
  function point() {
    const p = stage.current!.getPointerPosition()!
    return [
      (p.x - offset.x) / scale / 1000,
      (p.y - offset.y) / scale / worldHeight,
    ]
  }
  function down(e: Konva.KonvaEventObject<PointerEvent>) {
    if (e.evt.button !== 0) return
    const p = point()
    if (!annotating || tool === 'pan') {
      panning.current = { x: e.evt.clientX, y: e.evt.clientY, pan }
      return
    }
    if (tool === 'select') {
      if (e.target === e.target.getStage() || e.target.name() === 'artwork')
        setSelected('')
      return
    }
    if (tool === 'erase') return
    const a: Annotation = {
      id: crypto.randomUUID(),
      type: tool,
      color,
      width: lineWidth / 1000,
      points: [[...p, e.evt.pressure || 0.5]],
      x: 0,
      y: 0,
      scale: 1,
    }
    if (tool === 'text') {
      setTextEdit({ ...a, text: '', x: p[0], y: p[1], points: [] })
      return
    }
    if (tool === 'arrow') a.points = [p, p, p]
    pending.current = a
    setDraft(a)
  }
  function move(e: Konva.KonvaEventObject<PointerEvent>) {
    if (panning.current) {
      setPan({
        x: panning.current.pan.x + e.evt.clientX - panning.current.x,
        y: panning.current.pan.y + e.evt.clientY - panning.current.y,
      })
      return
    }
    const a = pending.current
    if (!a) return
    const p = point()
    const next = {
      ...a,
      points:
        a.type === 'arrow'
          ? [
              a.points[0],
              [(a.points[0][0] + p[0]) / 2, (a.points[0][1] + p[1]) / 2],
              p,
            ]
          : [...a.points, [...p, e.evt.pressure || 0.5]],
    }
    pending.current = next
    setDraft(next)
  }
  function end() {
    panning.current = undefined
    const a = pending.current
    pending.current = undefined
    if (a) setDraft(undefined)
    if (a && a.points.length > 1) {
      onCommit(a)
      setSelected(a.id)
    }
  }
  function shape(a: Annotation) {
    const isSelected = a.id === selected && annotating && tool === 'select',
      points = a.points.map((p) => [
        p[0] * 1000,
        p[1] * worldHeight,
        p[2] ?? 0.5,
      ]),
      w = a.width * 1000
    return (
      <Group
        id={'annotation-' + a.id}
        key={a.id}
        x={a.x * 1000}
        y={a.y * worldHeight}
        scaleX={a.scale}
        scaleY={a.scale}
        draggable={annotating && tool === 'select'}
        onClick={(e) => {
          e.cancelBubble = true
          if (tool === 'erase') onRemove(a.id)
          else if (tool === 'select') setSelected(a.id)
        }}
        onTap={() => {
          if (tool === 'erase') onRemove(a.id)
          else if (tool === 'select') setSelected(a.id)
        }}
        onPointerDown={(e) => {
          if (tool === 'select' || tool === 'erase') e.cancelBubble = true
        }}
        onDragEnd={(e) => {
          if (e.target !== e.currentTarget) return
          onCommit({
            ...a,
            x: e.target.x() / 1000,
            y: e.target.y() / worldHeight,
          })
        }}
        onTransformEnd={(e) => {
          const node = e.target
          onCommit({
            ...a,
            x: node.x() / 1000,
            y: node.y() / worldHeight,
            scale: node.scaleX(),
          })
        }}
      >
        {a.type === 'text' ? (
          <Text
            text={a.text}
            fontSize={Math.max(18, w * 5)}
            fill={a.color}
            fontFamily="Arial"
            padding={3}
            onDblClick={() => annotating && setTextEdit(a)}
          />
        ) : a.type === 'arrow' ? (
          <Arrow
            points={points.flatMap((p) => p.slice(0, 2))}
            tension={0.5}
            stroke={a.color}
            fill={a.color}
            strokeWidth={w}
            pointerLength={Math.max(10, w * 3)}
            pointerWidth={Math.max(8, w * 2.5)}
            lineCap="round"
            lineJoin="round"
            hitStrokeWidth={Math.max(14, w)}
          />
        ) : (
          <Path
            data={strokePath(points, w, a.type === 'highlight')}
            fill={a.color}
            opacity={a.type === 'highlight' ? 0.32 : 1}
          />
        )}
        {isSelected &&
          a.type === 'arrow' &&
          points.map((p, i) => (
            <Circle
              key={i}
              x={p[0]}
              y={p[1]}
              radius={5 / (scale * a.scale)}
              hitStrokeWidth={20 / (scale * a.scale)}
              fill="white"
              stroke="#2b9fca"
              strokeWidth={1 / (scale * a.scale)}
              draggable
              onPointerDown={(e) => (e.cancelBubble = true)}
              onDragMove={(e) => {
                e.cancelBubble = true
                const next = a.points.map((p, j) =>
                  j === i
                    ? [e.target.x() / 1000, e.target.y() / worldHeight]
                    : p,
                )
                setDraft({ ...a, points: next })
              }}
              onDragEnd={(e) => {
                e.cancelBubble = true
                onCommit({
                  ...a,
                  points: a.points.map((p, j) =>
                    j === i
                      ? [e.target.x() / 1000, e.target.y() / worldHeight]
                      : p,
                  ),
                })
                setDraft(undefined)
              }}
            />
          ))}
      </Group>
    )
  }
  const active = objects.find((a) => a.id === selected),
    rendered = draft
      ? [...objects.filter((a) => a.id !== draft.id), draft]
      : objects
  return (
    <div className="sb-annotation">
      <div className="sb-annotation-tools">
        {annotating &&
          (
            [
              'select',
              'pen',
              'arrow',
              'highlight',
              'text',
              'erase',
              'pan',
            ] as const
          ).map((t) => (
            <Button
              key={t}
              aria-pressed={t === tool}
              onClick={() => {
                setTool(t)
                pending.current = undefined
                setDraft(undefined)
              }}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </Button>
          ))}
        {annotating && (
          <>
            <input
              aria-label="Annotation color"
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value)
                if (active) onCommit({ ...active, color: e.target.value }, true)
              }}
            />
            <input
              aria-label="Stroke thickness"
              type="range"
              min="2"
              max="18"
              value={lineWidth}
              onChange={(e) => {
                setLineWidth(+e.target.value)
                if (active)
                  onCommit({ ...active, width: +e.target.value / 1000 }, true)
              }}
            />
            <Button disabled={!canUndo} onClick={onUndo}>
              Undo
            </Button>
            <Button disabled={!canRedo} onClick={onRedo}>
              Redo
            </Button>
            {active && (
              <>
                <Button onClick={() => onRemove(active.id)}>
                  Erase selected
                </Button>
                {active.type === 'text' && (
                  <Button onClick={() => setTextEdit(active)}>Edit text</Button>
                )}
              </>
            )}
          </>
        )}
        <Button
          onClick={() => {
            setZoom(1)
            setPan({ x: 0, y: 0 })
          }}
        >
          Fit
        </Button>
        <Button
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))}
        >
          −
        </Button>
        <span>{Math.round(zoom * 100)}%</span>
        <Button
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(8, z * 1.25))}
        >
          +
        </Button>
      </div>
      <div
        ref={box}
        className="sb-canvas"
        style={{ height: 'min(65vh,720px)' }}
        tabIndex={0}
        aria-label="Artwork canvas"
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault()
            e.shiftKey ? onRedo?.() : onUndo?.()
          }
          if (e.key === 'Escape') {
            setTool('select')
            setSelected('')
          }
        }}
      >
        {imageError && <p role="alert">{imageError}</p>}
        <Stage
          ref={stage}
          width={size.width}
          height={size.height}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={() => {
            pending.current = undefined
            setDraft(undefined)
            panning.current = undefined
          }}
          onWheel={(e) => {
            e.evt.preventDefault()
            const p = stage.current!.getPointerPosition()!,
              next = Math.max(
                0.5,
                Math.min(8, zoom * Math.exp(-e.evt.deltaY * 0.002)),
              ),
              ratio = next / zoom
            setPan({
              x: (p.x - size.width / 2) * (1 - ratio) + pan.x * ratio,
              y: (p.y - size.height / 2) * (1 - ratio) + pan.y * ratio,
            })
            setZoom(next)
          }}
        >
          <Layer>
            <Group x={offset.x} y={offset.y} scaleX={scale} scaleY={scale}>
              <CanvasImage
                name="artwork"
                image={image}
                width={1000}
                height={worldHeight}
              />
              {visible && rendered.map(shape)}
              {visible &&
                annotating &&
                tool === 'select' &&
                active?.type !== 'arrow' && (
                  <Transformer
                    ref={transform}
                    rotateEnabled={false}
                    flipEnabled={false}
                    keepRatio
                    enabledAnchors={[
                      'top-left',
                      'top-right',
                      'bottom-left',
                      'bottom-right',
                    ]}
                    anchorSize={7}
                    borderStroke="#87d8ff"
                    anchorStroke="#87d8ff"
                    boundBoxFunc={(old, b) =>
                      b.width < 10 || b.height < 10 ? old : b
                    }
                  />
                )}
            </Group>
          </Layer>
        </Stage>
        {textEdit && (
          <div className="sb-annotation-text">
            <textarea
              aria-label="Annotation text"
              autoFocus
              value={textEdit.text}
              onChange={(e) =>
                setTextEdit({ ...textEdit, text: e.target.value })
              }
            />
            <Button
              onClick={() => {
                if (textEdit.text?.trim()) {
                  onCommit(textEdit)
                  setSelected(textEdit.id)
                }
                setTextEdit(undefined)
              }}
            >
              Apply
            </Button>
            <Button onClick={() => setTextEdit(undefined)}>Cancel</Button>
          </div>
        )}
      </div>
    </div>
  )
}
