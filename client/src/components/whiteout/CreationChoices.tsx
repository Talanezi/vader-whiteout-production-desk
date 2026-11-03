import './CreationChoices.css'
import Icon, {type IconName} from './Icon'
export default function CreationChoices({value,choices,onChange}:{value:string;choices:{id:string;label:string;icon:IconName;description?:string}[];onChange:(id:string)=>void}) {
 return <div className="pd-creation-choices" role="group" aria-label="Creation method">{choices.map(c=><button key={c.id} type="button" aria-pressed={value===c.id} onClick={()=>onChange(c.id)}><Icon name={c.icon}/><span><strong>{c.label}</strong>{c.description&&<small>{c.description}</small>}</span><Icon name={value===c.id?'check':'arrow'}/></button>)}</div>
}
