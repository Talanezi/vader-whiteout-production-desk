import { useEffect, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import DotsLoader from '../whiteout/DotsLoader'
import { boardFetch, type MediaAsset } from '../../lib/storyboards/api'
import { openPdf, renderPage } from '../../lib/storyboards/pdfSource'
export async function downloadOriginal(documentId: string, asset: MediaAsset) {
  const blob = await (
      await boardFetch(`/${documentId}/assets/${asset.id}`)
    ).blob(),
    url = URL.createObjectURL(blob),
    a = document.createElement('a')
  a.href = url
  a.download = asset.filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 30000)
}
export default function OriginalViewer({
  documentId,
  asset,
  onClose,
  onExtract,
}: {
  documentId: string
  asset: MediaAsset
  onClose: () => void
  onExtract: () => void
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy>(),
    [page, setPage] = useState(0),
    [image, setImage] = useState(''),
    [zoom, setZoom] = useState(1),
    [error, setError] = useState('')
  useEffect(() => {
    let alive = true,
      p: PDFDocumentProxy | undefined
    boardFetch(`/${documentId}/assets/${asset.id}`)
      .then((r) => r.arrayBuffer())
      .then(openPdf)
      .then((d) => {
        p = d
        if (alive) setPdf(d)
        else void d.loadingTask.destroy()
      })
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
      void p?.loadingTask.destroy()
    }
  }, [documentId, asset.id])
  useEffect(() => {
    if (!pdf) return
    let alive = true
    setImage('')
    renderPage(pdf, page, 2400)
      .then(({ canvas }) => {
        if (alive) setImage(canvas.toDataURL())
        canvas.width = canvas.height = 0
      })
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
  }, [pdf, page])
  return (
    <Overlay
      title={asset.filename}
      onClose={onClose}
      className="sb-original"
      footer={
        <>
          <Button
            icon="download"
            onClick={() =>
              void downloadOriginal(documentId, asset).catch((e) =>
                setError(e.message),
              )
            }
          >
            Download original
          </Button>
          <Button onClick={onExtract}>Organize panels</Button>
        </>
      }
    >
      <div className="sb-toolstrip">
        <Button disabled={!page} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <span>
          Page {page + 1} of {pdf?.numPages || '…'}
        </span>
        <Button
          disabled={!pdf || page >= pdf.numPages - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
        <Button onClick={() => setZoom((z) => Math.max(1, z - 0.25))}>−</Button>
        <span>{Math.round(zoom * 100)}%</span>
        <Button onClick={() => setZoom((z) => Math.min(4, z + 0.25))}>+</Button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="sb-original-scroll">
        {image ? (
          <img
            src={image}
            style={{ width: `${zoom * 100}%` }}
            alt={`Original page ${page + 1}`}
          />
        ) : (
          <DotsLoader />
        )}
      </div>
    </Overlay>
  )
}
