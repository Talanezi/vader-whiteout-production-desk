import { useRef, useState, useLayoutEffect } from 'react'
import InlineDelete from '../whiteout/InlineDelete'
import { StudioIcon } from './StudioControls'
import { Button } from '../whiteout/Button'
import { clampRect, type Rect } from '../../lib/storyboards/model'
export type CropRegion = Rect & { id: string; label: string }
export default function CropEditor({
  image,
  width,
  height,
  regions,
  onChange,
  selectedId,
  onSelect,
}: {
  image: string
  width: number
  height: number
  regions: CropRegion[]
  onChange: (r: CropRegion[]) => void
  selectedId?: string
  onSelect?: (id:string)=>void
}) {
  const [viewportWidth, setViewportWidth] = useState(width)
  const [localSelected, setLocalSelected] = useState(''),
    [zoom, setZoom] = useState(1),
    [mode, setMode] = useState<'crop' | 'pan'>('crop')
  const [draft, setDraft] = useState<CropRegion[]>(),
    [undo, setUndo] = useState<CropRegion[][]>([]),
    [redo, setRedo] = useState<CropRegion[][]>([])
  const selected = selectedId === undefined ? localSelected : selectedId
  const setSelected = (id:string) => {setLocalSelected(id);onSelect?.(id)}
  const svg = useRef<SVGSVGElement>(null),
    scroll = useRef<HTMLDivElement>(null)
  const drag = useRef<
    | {
        x: number
        y: number
        id: string
        kind: string
        before: CropRegion[]
        clientX: number
        clientY: number
        scrollX: number
        scrollY: number
      }
    | undefined
  >(undefined)
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setViewportWidth(entry.contentRect.width),
    )
    if (scroll.current) observer.observe(scroll.current)
    return () => observer.disconnect()
  }, [])
  const unit = width / (Math.max(1, viewportWidth) * zoom)
  const current = draft || regions
  function commit(next: CropRegion[]) {
    setUndo((v) => [...v, regions])
    setRedo([])
    onChange(next)
    setDraft(undefined)
  }
  const point = (e: React.PointerEvent) => {
    const rect = svg.current!.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    }
  }
  function down(e: React.PointerEvent, kind: string, id = '') {
    if (e.button !== 0) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = point(e)
    drag.current = {
      ...p,
      id,
      kind: mode === 'pan' ? 'pan' : kind,
      before: regions,
      clientX: e.clientX,
      clientY: e.clientY,
      scrollX: scroll.current!.scrollLeft,
      scrollY: scroll.current!.scrollTop,
    }
    if (mode === 'pan') return
    if (kind === 'new') {
      const id = crypto.randomUUID()
      drag.current.id = id
      setSelected(id)
      setDraft([
        ...regions,
        { id, label: '', x: p.x, y: p.y, width: 0.001, height: 0.001 },
      ])
    } else setSelected(id)
  }
  function move(e: React.PointerEvent) {
    const d = drag.current
    if (!d) return
    if (d.kind === 'pan') {
      scroll.current!.scrollLeft = d.scrollX + d.clientX - e.clientX
      scroll.current!.scrollTop = d.scrollY + d.clientY - e.clientY
      return
    }
    const p = point(e),
      dx = p.x - d.x,
      dy = p.y - d.y
    let rect: Rect
    if (d.kind === 'new')
      rect = {
        x: Math.min(p.x, d.x),
        y: Math.min(p.y, d.y),
        width: Math.abs(dx),
        height: Math.abs(dy),
      }
    else {
      const r = d.before.find((r) => r.id === d.id)!
      if (d.kind === 'move')
        rect = {
          ...r,
          x: Math.max(0, Math.min(1 - r.width, r.x + dx)),
          y: Math.max(0, Math.min(1 - r.height, r.y + dy)),
        }
      else {
        const left = d.kind.includes('w')
            ? Math.min(p.x, r.x + r.width - 0.005)
            : r.x,
          top = d.kind.includes('n')
            ? Math.min(p.y, r.y + r.height - 0.005)
            : r.y,
          right = d.kind.includes('e')
            ? Math.max(p.x, r.x + 0.005)
            : r.x + r.width,
          bottom = d.kind.includes('s')
            ? Math.max(p.y, r.y + 0.005)
            : r.y + r.height
        rect = { x: left, y: top, width: right - left, height: bottom - top }
      }
    }
    setDraft((v) =>
      (v || regions).map((r) =>
        r.id === d.id ? { ...r, ...clampRect(rect) } : r,
      ),
    )
  }
  function end() {
    if (!drag.current) return
    if (draft)
      commit(draft.filter((r) => r.width >= 0.005 && r.height >= 0.005))
    drag.current = undefined
  }
  const active = current.find((r) => r.id === selected)
  return (
    <div className="sb-crop-editor">
      <div className="sb-toolstrip sb-crop-tools" role="toolbar" aria-label="Crop tools">
        <StudioIcon name="fit" label="Fit page" onClick={()=>{const box=scroll.current!;setZoom(Math.min(1,box.clientHeight/((box.clientWidth*height)/width)))}}/>
        <StudioIcon name="rectangle" label="Draw regions" active={mode==='crop'} onClick={()=>setMode('crop')}/><StudioIcon name="hand" label="Pan page" active={mode==='pan'} onClick={()=>setMode('pan')}/>
        <span className="sb-dock-divider"/><StudioIcon name="minus" label="Zoom out" onClick={()=>setZoom(z=>Math.max(.25,z-.25))}/><output>{Math.round(zoom*100)}%</output><StudioIcon name="plus" label="Zoom in" onClick={()=>setZoom(z=>Math.min(4,z+.25))}/>
        <span className="sb-dock-divider"/><StudioIcon name="undo" label="Undo crop" disabled={!undo.length} onClick={()=>{const prev=undo[undo.length-1];setRedo(r=>[...r,regions]);setUndo(u=>u.slice(0,-1));onChange(prev)}}/><StudioIcon name="redo" label="Redo crop" disabled={!redo.length} onClick={()=>{const next=redo[redo.length-1];setUndo(u=>[...u,regions]);setRedo(r=>r.slice(0,-1));onChange(next)}}/>
      </div>
      <div className="sb-crop-scroll" ref={scroll}>
        <svg
          ref={svg}
          role="img"
          aria-label="Source page crop regions"
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: `${zoom * 100}%`, touchAction: 'none' }}
          onPointerDown={(e) => down(e, 'new')}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={() => {
            drag.current = undefined
            setDraft(undefined)
          }}
        >
          <image href={image} width={width} height={height} />
          {current.map((r, i) => (
            <g key={r.id}>
              <rect
                x={r.x * width}
                y={r.y * height}
                width={r.width * width}
                height={r.height * height}
                fill="#87d8ff18"
                stroke={r.id === selected ? '#139aca' : '#657c8c'}
                strokeWidth={2 * unit}
                onPointerDown={(e) => down(e, 'move', r.id)}
              />
              <text
                x={r.x * width + 5}
                y={r.y * height + 19}
                fill="#042b43"
                fontSize={13 * unit}
                pointerEvents="none"
              >
                {i + 1}
              </text>
              {r.id === selected &&
                [
                  ['nw', r.x, r.y],
                  ['ne', r.x + r.width, r.y],
                  ['sw', r.x, r.y + r.height],
                  ['se', r.x + r.width, r.y + r.height],
                ].map(([name, x, y]) => (
                  <g key={name}>
                    <rect
                      x={Number(x) * width - 14 * unit}
                      y={Number(y) * height - 14 * unit}
                      width={28 * unit}
                      height={28 * unit}
                      fill="transparent"
                      onPointerDown={(e) => down(e, String(name), r.id)}
                    />
                    <rect
                      x={Number(x) * width - 4 * unit}
                      y={Number(y) * height - 4 * unit}
                      width={8 * unit}
                      height={8 * unit}
                      fill="white"
                      stroke="#139aca"
                      strokeWidth={unit}
                      pointerEvents="none"
                    />
                  </g>
                ))}
            </g>
          ))}
        </svg>
      </div>
      {onSelect ? <div className="sb-crop-properties">{active?<><input aria-label={`Region ${current.findIndex(r=>r.id===active.id)+1} original label`} placeholder="Original label" value={active.label} onChange={e=>onChange(regions.map(r=>r.id===active.id?{...r,label:e.target.value}:r))}/><StudioIcon name="duplicate" label="Duplicate crop" onClick={()=>{const id=crypto.randomUUID();commit([...regions,{...active,id,x:Math.min(1-active.width,active.x+.015),y:Math.min(1-active.height,active.y+.015)}]);setSelected(id)}}/><InlineDelete label="crop" onConfirm={async()=>{commit(regions.filter(r=>r.id!==active.id));setSelected('')}}/></>:<span>Select a frame to adjust its label.</span>}</div> : (      <div className="sb-crop-review">
        {current.map((r, i) => (
          <div className={r.id === selected ? 'is-selected' : ''} key={r.id}>
            <button
              onClick={() => setSelected(r.id)}
              aria-label={`Select region ${i + 1}`}
            >
              <svg
                viewBox={`${r.x * width} ${r.y * height} ${r.width * width} ${r.height * height}`}
              >
                <image href={image} width={width} height={height} />
              </svg>
            </button>
            <input
              aria-label={`Region ${i + 1} original label`}
              placeholder={`Panel ${i + 1}`}
              value={r.label}
              onChange={(e) =>
                onChange(
                  regions.map((v) =>
                    v.id === r.id ? { ...v, label: e.target.value } : v,
                  ),
                )
              }
            />
            <Button
              disabled={i === 0}
              onClick={() => {
                const next = [...regions]
                ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                commit(next)
              }}
            >
              Earlier
            </Button>
            <Button
              disabled={i === regions.length - 1}
              onClick={() => {
                const next = [...regions]
                ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
                commit(next)
              }}
            >
              Later
            </Button>
          </div>
        ))}
      </div>)}

    </div>
  )
}
