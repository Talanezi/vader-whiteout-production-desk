import { DragDropProvider, DragOverlay } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { useRef, useState } from 'react'
import { shotSensors } from '../shots/ShotDrag'
import { StudioIcon } from './StudioControls'
import type { CropRegion } from './CropEditor'
export type ExtractionEntry={page:number;crop:CropRegion;preview:{url:string;width:number;height:number}}
function Thumbnail({entry,index,selected,onSelect}:{entry:ExtractionEntry;index:number;selected:boolean;onSelect:()=>void}){
 const s=useSortable({id:entry.crop.id,index,group:'crop-sequence',transition:matchMedia('(prefers-reduced-motion:reduce)').matches?null:{duration:180}})
 return <li ref={s.ref} className={selected?'is-selected':''} data-crop={entry.crop.id}><button ref={s.handleRef as never} className="sb-sequence-grip" aria-label={`Move extracted panel ${index+1}`}><svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M6 4h2v2H6zM12 4h2v2h-2zM6 9h2v2H6zM12 9h2v2h-2zM6 14h2v2H6zM12 14h2v2h-2z"/></svg></button><button className="sb-sequence-art" onClick={onSelect}><CropThumb entry={entry}/><span><strong>{entry.crop.label||`Panel ${index+1}`}</strong><small>Page {entry.page+1}</small></span></button></li>
}
function CropThumb({entry:{crop:r,preview:p}}:{entry:ExtractionEntry}){return <svg viewBox={`${r.x*p.width} ${r.y*p.height} ${r.width*p.width} ${r.height*p.height}`} role="img" aria-label={r.label||'Extracted artwork'}><defs><clipPath id={'crop-'+r.id}><rect x={r.x*p.width} y={r.y*p.height} width={r.width*p.width} height={r.height*p.height}/></clipPath></defs><image clipPath={`url(#crop-${r.id})`} href={p.url} width={p.width} height={p.height}/></svg>}
export default function ExtractionReview({entries,onReorder,selected,onSelect}:{entries:ExtractionEntry[];onReorder:(ids:string[])=>void;selected?:string;onSelect?:(entry:ExtractionEntry)=>void}){
 const order=useRef<string[]>([]),[dragging,setDragging]=useState('')
 return <div className="sb-extraction-review"><header><strong>Panel sequence</strong><span>{entries.length}</span></header><DragDropProvider sensors={shotSensors} onDragStart={e=>{order.current=entries.map(e=>e.crop.id);setDragging(String(e.operation.source?.id||''))}} onDragEnd={e=>{setDragging('');const source=e.operation.source;if(e.canceled||!isSortable(source)||!e.operation.target)return;const ids=[...order.current],from=ids.indexOf(String(source.id));ids.splice(from,1);ids.splice(source.index,0,String(source.id));onReorder(ids)}}><ol>{entries.map((entry,index)=><Thumbnail key={entry.crop.id} entry={entry} index={index} selected={selected===entry.crop.id} onSelect={()=>onSelect?.(entry)}/>)}</ol><DragOverlay>{entries.find(e=>e.crop.id===dragging)&&<div className="sb-crop-drag"><CropThumb entry={entries.find(e=>e.crop.id===dragging)!}/></div>}</DragOverlay></DragDropProvider></div>
}
