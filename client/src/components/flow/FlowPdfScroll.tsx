import { useEffect, useRef, useState } from 'react'
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import Menu from '../whiteout/Menu'
import { ErrorNotice } from '../whiteout/Feedback'
GlobalWorkerOptions.workerSrc = workerUrl
function Page({
  pdf,
  index,
  width,
  root,
  onReady,
}: {
  pdf: PDFDocumentProxy
  index: number
  width: number
  root: HTMLDivElement | null
  onReady: () => void
}) {
  const host = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    [active, setActive] = useState(index === 1),
    [ratio, setRatio] = useState(1.414),
    [error, setError] = useState('')
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        setActive(entries.some((e) => e.isIntersecting))
      },
      { root, rootMargin: '700px' },
    )
    if (host.current) io.observe(host.current)
    return () => io.disconnect()
  }, [root])
  useEffect(() => {
    if (!active && canvas.current) {
      canvas.current.width = 0
      canvas.current.height = 0
      delete canvas.current.dataset.rendered
    }
    let alive = true,
      task:
        | ReturnType<
            Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']
          >
        | undefined
    void pdf
      .getPage(index)
      .then(async (page) => {
        const base = page.getViewport({ scale: 1 })
        if (alive) setRatio(base.height / base.width)
        if (!active || !canvas.current || !alive) return
        const scale = width / base.width,
          dpr = Math.min(devicePixelRatio || 1, 2),
          v = page.getViewport({ scale: scale * dpr }),
          c = canvas.current
        c.width = v.width
        c.height = v.height
        c.style.width = width + 'px'
        c.style.height = (width * base.height) / base.width + 'px'
        task = page.render({
          canvas: c,
          canvasContext: c.getContext('2d')!,
          viewport: v,
        })
        await task.promise
        if (alive) {
          c.dataset.rendered = 'true'
          if (index === 1) onReady()
        }
      })
      .catch((e) => {
        if (alive && e.name !== 'RenderingCancelledException')
          setError(e.message)
      })
    return () => {
      alive = false
      task?.cancel()
    }
  }, [pdf, index, width, active])
  return (
    <div
      ref={host}
      className="flow-pdf-sheet"
      style={{ width, minHeight: width * ratio }}
      data-page={index}
    >
      {error ? (
        <ErrorNotice>{error}</ErrorNotice>
      ) : (
        <canvas ref={canvas} aria-label={'PDF page ' + index} />
      )}
    </div>
  )
}
export default function FlowPdfScroll({
  bytes,
  onReady,
}: {
  bytes: Uint8Array
  onReady: (b: Uint8Array) => void
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy>(),
    [width, setWidth] = useState(700),
    [zoom, setZoom] = useState('fit'),
    [error, setError] = useState(''),
    root = useRef<HTMLDivElement>(null),
    ready = useRef(onReady)
  ready.current = onReady
  useEffect(() => {
    let alive = true
    setPdf(undefined)
    setError('')
    const task = getDocument({
      data: bytes.slice(),
      useSystemFonts: false,
    })
    void task.promise
      .then((p) => {
        if (alive) setPdf(p)
      })
      .catch((e) => {
        if (alive) setError(e.message)
      })
    return () => {
      alive = false
      void task.destroy()
    }
  }, [bytes])
  useEffect(() => {
    const node = root.current
    if (!node) return
    const ob = new ResizeObserver(() =>
      setWidth(Math.max(220, node.clientWidth - 40)),
    )
    ob.observe(node)
    return () => ob.disconnect()
  }, [])
  const display =
    zoom === 'fit' ? width : Math.max(220, Number(zoom) * 720)
  function change(v: string) {
    const node = root.current,
      fraction = node
        ? node.scrollTop /
          Math.max(1, node.scrollHeight - node.clientHeight)
        : 0
    setZoom(v)
    requestAnimationFrame(() => {
      if (node)
        node.scrollTop = fraction * (node.scrollHeight - node.clientHeight)
    })
  }
  return (
    <div className="flow-pdf-continuous">
      <div className="flow-pdf-tools">
        <span>{pdf ? pdf.numPages + ' pages' : 'Preparing pages…'}</span>
        <Menu
          label={
            zoom === 'fit'
              ? 'Fit width'
              : Math.round(Number(zoom) * 100) + '%'
          }
          value={zoom}
          onChange={change}
          items={[
            { value: 'fit', label: 'Fit width' },
            ...['0.75', '1', '1.25', '1.5', '2'].map((v) => ({
              value: v,
              label: Math.round(Number(v) * 100) + '%',
            })),
          ]}
        />
      </div>
      <div ref={root} className="flow-pdf-pages-scroll">
        {error && <ErrorNotice>{error}</ErrorNotice>}
        {pdf &&
          Array.from({ length: pdf.numPages }, (_, i) => (
            <Page
              key={i}
              pdf={pdf}
              index={i + 1}
              width={display}
              root={root.current}
              onReady={() => ready.current(bytes)}
            />
          ))}
      </div>
    </div>
  )
}
