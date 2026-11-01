import { useEffect, useRef, useState } from 'react'
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type RenderTask,
} from 'pdfjs-dist/legacy/build/pdf.mjs'
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import { Button } from '../whiteout/Button'
import Combobox from '../whiteout/Combobox'
import { ErrorNotice } from '../whiteout/Feedback'
GlobalWorkerOptions.workerSrc = workerUrl
/** Renders the exact immutable PDF bytes also used by the download link. */
export default function PdfPages({ bytes }: { bytes: Uint8Array }) {
  const [pdf, setPdf] = useState<PDFDocumentProxy>(),
    [page, setPage] = useState(1),
    [zoom, setZoom] = useState('fit'),
    [error, setError] = useState(''),
    [dimensions, setDimensions] = useState(''),
    [rendering, setRendering] = useState(false),
    [available, setAvailable] = useState(0),
    canvas = useRef<HTMLCanvasElement>(null),
    viewport = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let active = true
    setError('')
    setPdf(undefined)
    setPage(1)
    const task = getDocument({ data: bytes.slice(), useSystemFonts: false })
    task.promise
      .then((document) => {
        if (active) setPdf(document)
      })
      .catch((e) => {
        if (active) setError(e.message || 'PDF preview is unavailable.')
      })
    return () => {
      active = false
      void task.destroy()
    }
  }, [bytes])
  useEffect(() => {
    if (!viewport.current) return
    const observer = new ResizeObserver((entries) =>
      setAvailable(Math.round(entries[0].contentRect.width)),
    )
    observer.observe(viewport.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!pdf || !canvas.current || !viewport.current) return
    let active = true,
      task: RenderTask | undefined
    setRendering(true)
    const render = async () => {
      try {
        const sheet = await pdf.getPage(page)
        if (!active) return
        const natural = sheet.getViewport({ scale: 1 }),
          fit = (viewport.current!.clientWidth - 24) / natural.width,
          scale = zoom === 'fit' ? fit : ((Number(zoom) / 100) * 96) / 72,
          view = sheet.getViewport({ scale }),
          element = canvas.current!,
          ratio = Math.min(devicePixelRatio || 1, 2)
        element.width = Math.ceil(view.width * ratio)
        element.height = Math.ceil(view.height * ratio)
        element.style.width = Math.ceil(view.width) + 'px'
        element.style.height = Math.ceil(view.height) + 'px'
        setDimensions(
          `${((natural.width * 25.4) / 72).toFixed(0)} × ${((natural.height * 25.4) / 72).toFixed(0)} mm · ${natural.width > natural.height ? 'landscape' : 'portrait'}`,
        )
        task = sheet.render({
          canvas: element,
          viewport: view,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        })
        await task.promise
        if (active) setRendering(false)
      } catch (e) {
        if (active && (e as Error).name !== 'RenderingCancelledException') {
          setError((e as Error).message)
          setRendering(false)
        }
      }
    }
    void render()
    return () => {
      active = false
      task?.cancel()
    }
  }, [pdf, page, zoom, available])
  return (
    <section className="pd-pdf-pages" aria-label="Actual PDF preview">
      <div className="pd-pdf-page-toolbar">
        <Button
          disabled={!pdf || page <= 1}
          onClick={() => setPage((n) => n - 1)}
          aria-label="Previous PDF page"
        >
          ←
        </Button>
        <span role="status">
          {pdf ? `Page ${page} of ${pdf.numPages}` : 'Loading PDF…'}
        </span>
        <Button
          disabled={!pdf || page >= pdf.numPages}
          onClick={() => setPage((n) => n + 1)}
          aria-label="Next PDF page"
        >
          →
        </Button>
        <Combobox
          label="Preview zoom"
          value={zoom}
          labels={{
            fit: 'Fit width',
            '100': '100%',
            '150': '150%',
            '200': '200%',
          }}
          options={['fit', '100', '150', '200']}
          custom={false}
          clearable={false}
          onChange={setZoom}
        />
      </div>
      <small className="pd-muted">
        {dimensions}
        {rendering ? ' · Rendering…' : ''}
      </small>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      <div className="pd-pdf-canvas-scroll" ref={viewport}>
        <canvas
          data-rendered={
            pdf && !rendering && dimensions && !error ? 'true' : undefined
          }
          ref={canvas}
          aria-label={`PDF page ${page}`}
          role="img"
        />
      </div>
    </section>
  )
}
