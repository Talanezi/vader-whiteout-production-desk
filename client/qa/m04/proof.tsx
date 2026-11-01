// Local-only QA entry. Not referenced by application routes or production build.
import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import * as Y from 'yjs'
import CropEditor,{type CropRegion} from '../../src/components/storyboards/CropEditor'
import AnnotationCanvas from '../../src/components/storyboards/AnnotationCanvas'
import {openPdf,renderPage,cropBlob} from '../../src/lib/storyboards/pdfSource'
import {suggestRegions} from '../../src/lib/storyboards/detection'
import {type Annotation,put,values} from '../../src/lib/storyboards/model'
import '../../src/styles/whiteout.css'
import '../../src/components/storyboards/storyboards.css'
const doc=new Y.Doc(),undo=new Y.UndoManager(doc.getMap('annotations'),{captureTimeout:0})
const saved=localStorage.getItem('m04-proof');if(saved)Y.applyUpdate(doc,Uint8Array.from(JSON.parse(saved)))
function App(){
 const [pdf,setPdf]=useState<Awaited<ReturnType<typeof openPdf>>>(),[page,setPage]=useState(0),[canvas,setCanvas]=useState<HTMLCanvasElement>(),[url,setUrl]=useState(''),[regions,setRegions]=useState<CropRegion[]>([]),[art,setArt]=useState(''),[revision,update]=useState(0),[show,setShow]=useState(true),[error,setError]=useState('')
 React.useEffect(()=>{const changed=()=>{update(v=>v+1);localStorage.setItem('m04-proof',JSON.stringify([...Y.encodeStateAsUpdate(doc)]))};doc.on('update',changed);return()=>doc.off('update',changed)},[])
 async function load(p:NonNullable<typeof pdf>,i:number){const {canvas}=await renderPage(p,i,1600);setCanvas(canvas);setUrl(canvas.toDataURL());setRegions([]);setPage(i)}
 return <main className="pd-ui" style={{padding:24,background:'#0d151f',minHeight:'100vh',color:'#e5edf5'}}><h1>Storyboards · quality gate</h1><input aria-label="Production PDF" type="file" accept="application/pdf" onChange={async e=>{try{const p=await openPdf(await e.target.files![0].arrayBuffer());setPdf(p);await load(p,0)}catch(e){setError(String(e))}}}/>{error&&<p role="alert">{error}</p>}{pdf&&<div><button onClick={()=>load(pdf,Math.max(0,page-1))}>Previous page</button><span>Page {page+1} of {pdf.numPages}</span><button onClick={()=>load(pdf,Math.min(pdf.numPages-1,page+1))}>Next page</button><button onClick={()=>{if(canvas)setRegions(suggestRegions(canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height)).map(r=>({...r,id:crypto.randomUUID(),label:''})))}}>Suggest frames</button></div>}{canvas&&<CropEditor image={url} width={canvas.width} height={canvas.height} regions={regions} onChange={setRegions}/>}{regions.length>0&&canvas&&<button onClick={async()=>{const {canvas:hi}=await renderPage(pdf!,page,3200);const blob=await cropBlob(hi,regions[0]);setArt(URL.createObjectURL(blob));hi.width=hi.height=0}}>Annotate first crop</button>}{art&&<><label><input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)}/>Show annotations</label><AnnotationCanvas onReady={stage=>{(window as any).m04Stage=stage}} url={art} annotating visible={show} objects={values<Annotation>(doc,'annotations')} onCommit={a=>put(doc,'annotations',a.id,a as unknown as Record<string,unknown>)} onRemove={id=>doc.getMap('annotations').delete(id)} canUndo={!!undo.undoStack.length} canRedo={!!undo.redoStack.length} onUndo={()=>undo.undo()} onRedo={()=>undo.redo()}/></>}<output data-testid="objects">{JSON.stringify(values(doc,'annotations'))}</output><span data-testid="revision">{revision}</span></main>
}
createRoot(document.getElementById('root')!).render(<App/>);
