import { useEffect, useState, type ButtonHTMLAttributes } from 'react'
export const glyphs: Record<string, string> = {
  comment: 'M4 4h16v12H9l-5 4V4zM8 8h8M8 12h5',
  send: 'M3 3l19 9-19 9 4-9zM7 12h15',
  reply: 'M10 5l-7 7 7 7M3 12h10c5 0 7 2 8 6',
  pipette: 'M14 3l7 7-3 3-2-2-8 8-5 2 2-5 8-8-2-2z',
  select: 'M5 3l13 9-6 1-3 6z',
  brush: 'M14 4l6 6M4 20c0-5 5-3 6-6l8-11 3 3-11 8c-3 1-1 6-6 6z',
  pen: 'M4 20l4-12 9-5 4 4-5 9-12 4zM4 20l9-9M11 9l4 4',
  arrow: 'M4 18Q7 4 19 6M14 2l6 4-5 5',
  highlight: 'M5 17l8-13 6 4-8 13M4 20h9',
  rectangle: 'M4 5h16v14H4z',
  ellipse: 'M20 12a8 6 0 1 1-16 0 8 6 0 1 1 16 0',
  line: 'M4 19L20 5',
  callout: 'M4 4h16v12H10l-5 4v-4H4z',
  text: 'M4 5h16M12 5v15M8 20h8',
  erase: 'M3 14l10-11 8 7-10 11H9zM8 9l8 7M11 21h10',
  hand: 'M8 11V5a2 2 0 0 1 3 0v5-7a2 2 0 0 1 3 0v7-5a2 2 0 0 1 3 0v6-3a2 2 0 0 1 3 0v7c0 5-4 7-8 7-3 0-5-4-8-7-2-2 0-4 2-2l2 1',
  undo: 'M8 4L3 9l5 5M3 9h11a6 6 0 0 1 0 12',
  redo: 'M16 4l5 5-5 5M21 9H10a6 6 0 0 0 0 12',
  close: 'M6 6l12 12M6 18L18 6',
  fullscreen: 'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',
  fit: 'M3 8V3h5M16 3h5v5M3 16v5h5M21 16v5h-5M8 8h8v8H8z',
  previous: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  settings: 'M4 7h16M4 17h16M8 4v6M16 14v6',
  panel: 'M3 4h18v16H3zM15 4v16',
  gear: 'M9.5 3h5l.5 2.4 1.9 1.1 2.3-.8 2.5 4.3-1.8 1.6v2.2l1.8 1.6-2.5 4.3-2.3-.8-1.9 1.1-.5 1.4h-5L9 20l-1.9-1.1-2.3.8-2.5-4.3 1.8-1.6v-2.2L2.3 10l2.5-4.3 2.3.8L9 5.4zM15 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0',
  trash: 'M4 6h16M8 6V3h8v3M6 6l1 15h10l1-15M10 10v7M14 10v7',
  layers: 'M12 3L2 8l10 5 10-5zM2 12l10 5 10-5M2 16l10 5 10-5',
  check: 'M4 12l5 5L20 6',
  image: 'M3 4h18v16H3zM3 16l6-6 5 5 3-3 4 4M16 8h1',
  duplicate: 'M8 8h13v13H8zM16 8V3H3v13h5',
  rotate: 'M4 10a8 8 0 1 1 1 8M4 4v6h6',
  plus: 'M12 4v16M4 12h16',
  minus: 'M4 12h16',
  link: 'M10 14l4-4M8 15l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0M16 9l2-2a3 3 0 0 1 4 4l-5 5a3 3 0 0 1-4 0',
}
export function StudioGlyph({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={glyphs[name] || glyphs.settings} />
    </svg>
  )
}
export function StudioIcon({
  name,
  label,
  active,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  name: string
  label: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`sb-studio-icon ${active ? 'is-active' : ''} ${className}`}
      {...props}
    >
      <StudioGlyph name={name} />
      <span className="sb-tool-tip">{label}</span>
    </button>
  )
}
export const DEFAULT_STUDIO_PALETTE=['#121923','#ffffff','#77d7ff','#ef665e','#f2b851','#83bc91','#b79cda','#4c71a8','#48ad96','#d88dba','#9caa61','#b78159']
export function initialStudioPalette(){
 try{const stored=JSON.parse(localStorage.getItem('whiteout:studio-palette.v2')||'null');if(Array.isArray(stored)&&stored.length===12&&stored.every(c=>/^#[0-9a-f]{6}$/i.test(c)))return stored;
 const old=JSON.parse(localStorage.getItem('whiteout:studio-colors')||'[]');return [...new Set([...DEFAULT_STUDIO_PALETTE.slice(0,7),...(Array.isArray(old)?old.filter(c=>/^#[0-9a-f]{6}$/i.test(c)):[]),...DEFAULT_STUDIO_PALETTE])].slice(0,12)
 }catch{return DEFAULT_STUDIO_PALETTE}
}
export function StudioColor({value,onChange,onSample,palette,onPaletteChange,selectedSlot,onSelectSlot}: {
 value:string;onChange:(color:string)=>void;onSample?:(replace:(v:string)=>void)=>void;
 palette?:string[];onPaletteChange?:(slot:number,color:string)=>void;selectedSlot?:number;onSelectSlot?:(slot:number)=>void;
}) {
 const [hex,setHex]=useState(value),[localPalette,setLocalPalette]=useState(initialStudioPalette),[localSlot,setLocalSlot]=useState(0);
 const colors=palette||localPalette,slot=selectedSlot??localSlot;
 useEffect(()=>setHex(value),[value]);
 const choose=(color:string)=>{
  setHex(color);onChange(color);
  if(onPaletteChange)onPaletteChange(slot,color);else{const next=colors.map((v,i)=>i===slot?color:v);setLocalPalette(next);localStorage.setItem('whiteout:studio-palette.v2',JSON.stringify(next))}
 }
  const [hueValue, setHueValue] = useState(0)
  const chooseHue = (n: number) => {
    const h = Math.max(0, Math.min(360, n))
    setHueValue(h)
    choose(hue(h))
  }
  return (
    <div className="sb-color-picker">
      <div className="sb-swatches">
        {colors.map((c,i)=>(<button key={i} type="button" style={{background:c}} aria-label={`Palette color ${i+1}: ${c}`} aria-pressed={slot===i} onClick={()=>{onSelectSlot?.(i);setLocalSlot(i);setHex(c);onChange(c)}}/>))}
      </div>
      <label className="sb-hex">
        HEX{' '}
        <input
          aria-label="Custom color HEX"
          value={hex}
          maxLength={7}
          onChange={(e) => {
            setHex(e.target.value)
            if (/^#[0-9a-f]{6}$/i.test(e.target.value)) choose(e.target.value)
          }}
        />
        {onSample && (
          <StudioIcon name="pipette" label="Sample color" onClick={()=>onSample?.(choose)} />
        )}
      </label>
      <div
        className="sb-color-spectrum"
        role="slider"
        aria-label="Color hue"
        tabIndex={0}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={hueValue}
        onKeyDown={(e) => {
          if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
            e.preventDefault()
            chooseHue(
              e.key === 'Home'
                ? 0
                : e.key === 'End'
                  ? 360
                  : hueValue + (e.key === 'ArrowRight' ? 5 : -5),
            )
          }
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          chooseHue(
            ((e.clientX - e.currentTarget.getBoundingClientRect().left) /
              e.currentTarget.clientWidth) *
              360,
          )
        }}
        onPointerMove={(e) => {
          if (e.buttons)
            chooseHue(
              ((e.clientX - e.currentTarget.getBoundingClientRect().left) /
                e.currentTarget.clientWidth) *
                360,
            )
        }}
      />
    </div>
  )
}
function hue(h: number) {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return Math.round(255 * (1 - Math.max(0, Math.min(k, 4 - k, 1))))
      .toString(16)
      .padStart(2, '0')
  }
  return '#' + f(5) + f(3) + f(1)
}
