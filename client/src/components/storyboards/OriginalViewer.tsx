import { useEffect, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { Overlay } from '../whiteout/Overlay'
import { StudioIcon } from './StudioControls'
import { Button } from '../whiteout/Button'
import DotsLoader from '../whiteout/DotsLoader'
import { boardFetch, type MediaAsset } from '../../lib/storyboards/api'
import type { Source } from '../../lib/storyboards/model'
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
  related = [],
  onPanel,
}: {
  documentId: string
  asset: MediaAsset
  onClose: () => void
  onExtract: () => void
  related?: { id: string; label: string; source?: Source }[]
  onPanel?: (id: string) => void
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy>(),
    [page, setPage] = useState(0),
    [image, setImage] = useState(''),
    [zoom, setZoom] = useState(1),
    [error, setError] = useState('')
  useEffect(() => {
    let alive = true,
      p: PDFDocumentProxy | undefined,
      objectUrl: string | undefined
    setImage('')
    setError('')
    boardFetch(`/${documentId}/assets/${asset.id}`)
      .then(async (r) => {
        if (asset.mime !== 'application/pdf') {
          const url = URL.createObjectURL(await r.blob())
          objectUrl = url
          if (alive) setImage(url)
          else URL.revokeObjectURL(url)
          return undefined
        }
        return openPdf(await r.arrayBuffer())
      })
      .then((d) => {
        p = d
        if (alive && d) setPdf(d)
        else if (d) void d.loadingTask.destroy()
      })
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
      void p?.loadingTask.destroy()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
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
          {asset.mime === 'application/pdf' && (
            <Button icon="grid" onClick={onExtract}>
              Organize panels
            </Button>
          )}
        </>
      }
    >
      <div className="sb-toolstrip">
        <StudioIcon
          name="previous"
          label="Previous source page"
          disabled={!page}
          onClick={() => setPage((p) => p - 1)}
        />
        <span>
          Page {page + 1} of{' '}
          {pdf?.numPages || (asset.mime === 'application/pdf' ? '…' : 1)}
        </span>
        <StudioIcon
          name="next"
          label="Next source page"
          disabled={!pdf || page >= pdf.numPages - 1}
          onClick={() => setPage((p) => p + 1)}
        />
        <span className="sb-dock-divider" />
        <StudioIcon
          name="minus"
          label="Zoom out source"
          onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
        />
        <span>{Math.round(zoom * 100)}%</span>
        <StudioIcon
          name="plus"
          label="Zoom in source"
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="sb-original-scroll">
        {image ? (
          <div
            className="sb-source-context"
            style={{ width: `${zoom * 100}%` }}
          >
            <img src={image} alt={`Original page ${page + 1}`} />
            {related
              .filter((p) => (p.source?.page || 0) === page && p.source)
              .map((p) => (
                <button
                  key={p.id}
                  className="sb-source-region"
                  aria-label={`Open ${p.label || 'extracted panel'}`}
                  style={{
                    left: p.source!.crop.x * 100 + '%',
                    top: p.source!.crop.y * 100 + '%',
                    width: p.source!.crop.width * 100 + '%',
                    height: p.source!.crop.height * 100 + '%',
                  }}
                  onClick={() => onPanel?.(p.id)}
                >
                  <span>{p.label || 'Panel'}</span>
                </button>
              ))}
          </div>
        ) : (
          <DotsLoader />
        )}
      </div>
      {related.length > 0 && (
        <div className="sb-source-related">
          <strong>From this source</strong>
          {related.map((p, i) => (
            <button key={p.id} onClick={() => onPanel?.(p.id)}>
              {p.label || `Panel ${i + 1}`}
            </button>
          ))}
        </div>
      )}
    </Overlay>
  )
}
