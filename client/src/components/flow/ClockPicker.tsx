import {useEffect,useState} from 'react'
import {createPortal} from 'react-dom'
import {usePopover} from '../whiteout/Popover'
import Icon from '../whiteout/Icon'
import Menu from '../whiteout/Menu'
import {clockText,parseClock} from '../../../../server/src/flows/scheduling'
/** Set clock, never converted through the viewer's device timezone. */
export default function ClockPicker({label,value,onChange}:{label:string;value:number|null;onChange:(n:number|null)=>void}) {
 const p=usePopover(264),[draft,setDraft]=useState(value==null?'':clockText(value)),[error,setError]=useState('')
 useEffect(()=>setDraft(value==null?'':clockText(value)),[value])
 const m=((value||0)%1440+1440)%1440,h=Math.floor(m/60)
 function apply(s:string){try{const n=parseClock(s);const next=n==null?null:n+Math.floor((value||0)/1440)*1440;if(next!==value)onChange(next);setError('')}catch(e){setError((e as Error).message)}}
 return <div className="flow-clock-field"><label htmlFor={p.id+'-clock'}>{label}</label><div className="flow-clock-entry"><input id={p.id+'-clock'} value={draft} placeholder="9:00 AM" onChange={e=>setDraft(e.target.value)} onBlur={()=>apply(draft)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();apply(draft)}}}/><button ref={p.trigger} type="button" aria-label={'Choose '+label.toLowerCase()} aria-expanded={p.open} onClick={()=>p.setOpen(!p.open)}><Icon name="calendar"/></button></div>{value!=null&&<button className="flow-next-day" type="button" aria-pressed={value>=1440} onClick={()=>onChange(m+(value>=1440?0:1440))}>{value>=1440?'Next day':'Same day'}</button>}{error&&<small role="alert">{error}</small>}{p.open&&createPortal(<div ref={p.panel} style={p.style} className="pd-ui flow-clock-pop" role="dialog" aria-label="Choose set time"><div className="flow-clock-dials"><Menu label={String(h%12||12)} value={String(h%12||12)} items={Array.from({length:12},(_,i)=>({value:String(i+1),label:String(i+1)}))} onChange={v=>onChange((Number(v)%12+(h>=12?12:0))*60+m%60+Math.floor((value||0)/1440)*1440)}/><input aria-label="Minute" type="number" min="0" max="59" value={m%60} onChange={e=>{const v=Number(e.target.value);if(v>=0&&v<60)onChange(h*60+v+Math.floor((value||0)/1440)*1440)}}/><Menu label={h>=12?'PM':'AM'} value={h>=12?'PM':'AM'} items={['AM','PM'].map(v=>({value:v,label:v}))} onChange={v=>onChange((h%12+(v==='PM'?12:0))*60+m%60+Math.floor((value||0)/1440)*1440)}/></div><div className="flow-clock-increments">{[0,15,30,45].map(n=><button key={n} type="button" onClick={()=>{onChange(h*60+n+Math.floor((value||0)/1440)*1440);p.close()}}>:{String(n).padStart(2,'0')}</button>)}</div></div>,p.target)}</div>
}
