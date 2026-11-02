import { getStroke } from 'perfect-freehand'
import type { Annotation } from './model'
export function legacyPath(a:Annotation,height:number){
 if(a.path)return a.path
 const points=a.points.map(p=>[p[0]*1000,p[1]*height,p[2]??.5])
 if(a.type==='arrow'){
  const [p,c,q]=points;if(!p||!q)return ''
  const d01=Math.hypot(c[0]-p[0],c[1]-p[1]),d12=Math.hypot(q[0]-c[0],q[1]-c[1]),sum=d01+d12||1,fa=.5*d01/sum,fb=.5*d12/sum
  return `M${p[0]} ${p[1]} Q${c[0]-fa*(q[0]-p[0])} ${c[1]-fa*(q[1]-p[1])} ${c[0]} ${c[1]} Q${c[0]+fb*(q[0]-p[0])} ${c[1]+fb*(q[1]-p[1])} ${q[0]} ${q[1]}`
 }
 const polygon=getStroke(points,{size:a.width*1000,thinning:a.type==='highlight'?0:.45,smoothing:.65,streamline:.6,simulatePressure:points.every(p=>p[2]===.5),last:true})
 return polygon.length?'M'+polygon.map(p=>p.join(',')).join(' L')+' Z':''
}
export function objectTransform(a:Annotation,height:number){return `translate(${a.x*1000} ${a.y*height}) rotate(${a.rotation||0}) scale(${a.scale||1})`}
