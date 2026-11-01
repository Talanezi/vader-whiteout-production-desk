import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from 'pdfjs-dist/legacy/build/pdf.mjs'
import worker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import type { Rect } from './model'
GlobalWorkerOptions.workerSrc = worker
export async function openPdf(bytes: ArrayBuffer) {
  return getDocument({ data: new Uint8Array(bytes) }).promise
}
/** Render one page at a time. The caller releases canvases/page resources. */
export async function renderPage(
  pdf: PDFDocumentProxy,
  index: number,
  maxEdge = 1800,
  rotation?: number,
) {
  const page = await pdf.getPage(index + 1),
    original = page.getViewport({
      scale: 1,
      rotation: rotation ?? page.rotate,
    })
  const viewport = page.getViewport({
    scale: maxEdge / Math.max(original.width, original.height),
    rotation: rotation ?? page.rotate,
  })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  await page.render({
    canvas,
    canvasContext: canvas.getContext('2d')!,
    viewport,
    background: 'white',
  }).promise
  page.cleanup()
  return { canvas, rotation: viewport.rotation }
}
export async function cropBlob(canvas: HTMLCanvasElement, crop: Rect) {
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(canvas.width * crop.width))
  out.height = Math.max(1, Math.round(canvas.height * crop.height))
  out
    .getContext('2d')!
    .drawImage(
      canvas,
      canvas.width * crop.x,
      canvas.height * crop.y,
      canvas.width * crop.width,
      canvas.height * crop.height,
      0,
      0,
      out.width,
      out.height,
    )
  const blob = await new Promise<Blob>((resolve, reject) =>
    out.toBlob(
      (b) => (b ? resolve(b) : reject(Error('Could not render crop.'))),
      'image/png',
    ),
  )
  out.width = out.height = 0
  return blob
}
