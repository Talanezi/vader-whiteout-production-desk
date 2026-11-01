import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import * as Y from 'yjs'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import Menu from '../whiteout/Menu'
import DotsLoader from '../whiteout/DotsLoader'
import {
  uploadAsset,
  boardFetch,
  type MediaAsset,
} from '../../lib/storyboards/api'
import { openPdf, renderPage, cropBlob } from '../../lib/storyboards/pdfSource'
import { suggestRegions } from '../../lib/storyboards/detection'
import {
  panels,
  put,
  type Panel,
  type Source,
} from '../../lib/storyboards/model'
import ExtractionReview from './ExtractionReview'
import CropEditor, { type CropRegion } from './CropEditor'

type Item = {
  key: string
  file: File
  asset?: MediaAsset
  progress: number
  error?: string
}
export default function ArtworkImport({
  documentId,
  doc,
  userId,
  userName,
  onClose,
  onImported,
  replacePanel,
  existingSource,
  initialFiles,
}: {
  documentId: string
  doc: Y.Doc
  userName?: string
  userId: number
  onClose: () => void
  onImported: () => void
  replacePanel?: Panel
  initialFiles?: File[]
  existingSource?: MediaAsset
}) {
  const [items, setItems] = useState<Item[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [mode, setMode] = useState('crops')
  const [pdf, setPdf] = useState<PDFDocumentProxy>(),
    [source, setSource] = useState<MediaAsset>(),
    [page, setPage] = useState(0),
    [preview, setPreview] = useState<{
      url: string
      canvas: HTMLCanvasElement
      rotation: number
    }>(),
    [regions, setRegions] = useState<Record<number, CropRegion[]>>({})
  const [reviewing, setReviewing] = useState(false),
    [reviewOrder, setReviewOrder] = useState<string[]>([]),
    [pageThumbs, setPageThumbs] = useState<
      Record<number, { url: string; width: number; height: number }>
    >({})
  const extraction = Object.entries(regions)
    .sort(([a], [b]) => Number(a) - Number(b))
    .flatMap(([p, crops]) =>
      crops.map((crop) => ({
        page: Number(p),
        crop,
        preview: pageThumbs[Number(p)],
      })),
    )
    .filter((e) => e.preview)
  const orderedExtraction = [...extraction].sort((a, b) => {
    const ai = reviewOrder.indexOf(a.crop.id),
      bi = reviewOrder.indexOf(b.crop.id)
    return (ai < 0 ? 99999 : ai) - (bi < 0 ? 99999 : bi)
  })
  const batch = useRef(crypto.randomUUID()),
    fileInput = useRef<HTMLInputElement>(null),
    request = useRef(0),
    alive = useRef(true),
    completed = useRef(false)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      request.current++
    }
  }, [])
  useEffect(
    () => () => {
      void pdf?.loadingTask.destroy()
    },
    [pdf],
  )
  useEffect(() => {
    if (!pdf) return
    const n = ++request.current
    setBusy(true)
    renderPage(pdf, page, 1600)
      .then(({ canvas, rotation }) => {
        if (n !== request.current) {
          canvas.width = canvas.height = 0
          return
        }
        if (mode === 'crops')
          setRegions((old) =>
            old[page] !== undefined
              ? old
              : {
                  ...old,
                  [page]: suggestRegions(
                    canvas
                      .getContext('2d')!
                      .getImageData(0, 0, canvas.width, canvas.height),
                  ).map((r) => ({ ...r, id: crypto.randomUUID(), label: '' })),
                },
          )
        const thumb = document.createElement('canvas')
        thumb.width = 600
        thumb.height = Math.round((canvas.height / canvas.width) * 600)
        thumb
          .getContext('2d')!
          .drawImage(canvas, 0, 0, thumb.width, thumb.height)
        setPageThumbs((old) => ({
          ...old,
          [page]: {
            url: thumb.toDataURL('image/jpeg', 0.85),
            width: canvas.width,
            height: canvas.height,
          },
        }))
        thumb.width = thumb.height = 0
        setPreview((old) => {
          if (old) {
            URL.revokeObjectURL(old.url)
            old.canvas.width = old.canvas.height = 0
          }
          return { url: canvas.toDataURL(), canvas, rotation }
        })
      })
      .catch((e) => alive.current && setError(e.message))
      .finally(() => alive.current && n === request.current && setBusy(false))
  }, [pdf, page])
  useEffect(() => {
    if (!existingSource) return
    setSource(existingSource)
    setBusy(true)
    boardFetch(`/${documentId}/assets/${existingSource.id}`)
      .then((r) => r.arrayBuffer())
      .then(openPdf)
      .then(setPdf)
      .catch((e) => setError(e.message))
      .finally(() => setBusy(false))
  }, [existingSource, documentId])
  const seeded = useRef(false)
  useEffect(() => {
    if (initialFiles && !seeded.current) {
      seeded.current = true
      add(initialFiles)
    }
  }, [initialFiles])
  function add(files: FileList | File[] | null) {
    if (!files) return
    const accepted = [...files].filter(
      (f) =>
        /\.(pdf|png|jpe?g|webp)$/i.test(f.name) && f.size <= 128 * 1024 * 1024,
    )
    if (accepted.length !== files.length)
      setError('Choose PDF, PNG, JPG or WebP files up to 128 MB.')
    setItems((old) => [
      ...old,
      ...accepted.map((file) => ({
        key: crypto.randomUUID(),
        file,
        progress: 0,
      })),
    ])
  }
  async function upload() {
    setBusy(true)
    setError('')
    try {
      for (const item of items) {
        if (item.asset) continue
        const asset = await uploadAsset(documentId, item.file, (p) =>
          setItems((old) =>
            old.map((v) => (v.key === item.key ? { ...v, progress: p } : v)),
          ),
        )
        item.asset = asset
        setItems((old) =>
          old.map((v) =>
            v.key === item.key ? { ...v, asset, progress: 1 } : v,
          ),
        )
      }
      if (items.length === 1 && items[0].asset?.mime === 'application/pdf') {
        setSource(items[0].asset)
        setPdf(await openPdf(await items[0].file.arrayBuffer()))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed. Retry safely.')
    } finally {
      setBusy(false)
    }
  }
  function commit(
    entries: { assetId: string; label: string; source?: Source }[],
  ) {
    if (completed.current || doc.getMap('imports').has(batch.current)) return
    doc.transact(() => {
      const order = panels(doc).reduce((n, p) => Math.max(n, p.order), 0)
      entries.forEach((entry, i) => {
        const id = replacePanel?.id || crypto.randomUUID(),
          revisionId = crypto.randomUUID()
        put(doc, 'revisions', revisionId, {
          id: revisionId,
          panelId: id,
          ...entry,
          uploader: userId,
          uploaderName: userName || `User ${userId}`,
          createdAt: new Date().toISOString(),
        })
        put(
          doc,
          'panels',
          id,
          replacePanel
            ? { activeRevision: revisionId }
            : {
                id,
                label: entry.label,
                notes: '',
                order: order + (i + 1) * 1024,
                links: [],
                activeRevision: revisionId,
              },
        )
      })
      doc.getMap('imports').set(batch.current, {
        count: entries.length,
        at: new Date().toISOString(),
      })
    })
    completed.current = true
    onImported()
    onClose()
  }
  async function confirmImages() {
    const entries = []
    for (const item of items) {
      if (!item.asset) continue
      if (item.asset.mime === 'application/pdf') {
        // Multiple PDFs remain valid original-only sources for later extraction.
        continue
      }
      entries.push({
        assetId: item.asset.id,
        label: item.file.name.replace(/\.[^.]+$/, ''),
      })
    }
    if (replacePanel && entries.length !== 1)
      throw Error('Choose exactly one replacement image.')
    commit(entries)
  }
  async function confirmPdf() {
    if (!pdf || !source || !preview) return
    setBusy(true)
    setError('')
    try {
      if (mode === 'original') {
        if (replacePanel)
          throw Error('Choose a page or crop as replacement artwork.')
        commit([])
        return
      }
      const entries = []
      for (let i = 0; i < pdf.numPages; i++) {
        const crops =
          mode === 'pages'
            ? [
                {
                  x: 0,
                  y: 0,
                  width: 1,
                  height: 1,
                  id: 'page',
                  label: `Page ${i + 1}`,
                },
              ]
            : regions[i] || []
        if (!crops.length) continue
        const { canvas, rotation } = await renderPage(pdf, i, 3200)
        try {
          for (const crop of crops) {
            const blob = await cropBlob(canvas, crop),
              asset = await uploadAsset(
                documentId,
                new File(
                  [blob],
                  `${source.filename}-page-${i + 1}-${crop.id}.png`,
                  { type: 'image/png' },
                ),
              )
            entries.push({
              orderKey: crop.id,
              assetId: asset.id,
              label: crop.label,
              source: {
                assetId: source.id,
                page: i,
                rotation,
                crop: {
                  x: crop.x,
                  y: crop.y,
                  width: crop.width,
                  height: crop.height,
                },
              },
            })
          }
        } finally {
          canvas.width = canvas.height = 0
        }
      }
      if (!entries.length) throw Error('Add at least one crop region.')
      if (replacePanel && entries.length !== 1)
        throw Error('Select exactly one crop for the replacement.')
      if (mode === 'crops')
        entries.sort(
          (a, b) =>
            orderedExtraction.findIndex((e) => e.crop.id === a.orderKey) -
            orderedExtraction.findIndex((e) => e.crop.id === b.orderKey),
        )
      commit(entries.map(({ orderKey, ...entry }) => entry))
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Could not extract panels. The original is preserved.',
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <Overlay
      title={replacePanel ? 'Replace artwork' : 'Import artwork'}
      onClose={onClose}
      busy={busy}
      className="sb-import"
      footer={
        <>
          <Button disabled={busy} onClick={onClose}>
            Close
          </Button>
          {pdf ? (
            <Button
              variant="primary"
              state={busy ? 'pending' : 'idle'}
              pendingLabel="Importing artwork…"
              disabled={mode === 'crops' && (!reviewing || !extraction.length)}
              onClick={confirmPdf}
            >
              {mode === 'original'
                ? 'Keep original only'
                : 'Add reviewed panels'}
            </Button>
          ) : (
            <Button
              variant="primary"
              state={busy ? 'pending' : 'idle'}
              pendingLabel="Importing artwork…"
              disabled={!items.length}
              onClick={() =>
                items.every((item) => item.asset)
                  ? void confirmImages().catch((e) => setError(e.message))
                  : void upload()
              }
            >
              {items.length && items.every((item) => item.asset)
                ? 'Add reviewed panels'
                : 'Upload artwork'}
            </Button>
          )}
        </>
      }
    >
      {error && (
        <p className="pd-alert" role="alert">
          {error}
        </p>
      )}
      {!pdf ? (
        <>
          <div
            className="sb-upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              add(e.dataTransfer.files)
            }}
          >
            <Button icon="import" onClick={() => fileInput.current?.click()}>
              Choose artwork
            </Button>
            <span>PDF · PNG · JPG · WebP</span>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              multiple={!replacePanel}
              hidden
              onChange={(e) => add(e.target.files)}
            />
          </div>
          <ul className="sb-upload-list">
            {items.map((item, index) => (
              <li key={item.key}>
                <FilePreview file={item.file} />
                <span>{item.file.name}</span>
                <Button
                  disabled={busy || index === 0}
                  onClick={() =>
                    setItems((old) => {
                      const next = [...old]
                      ;[next[index - 1], next[index]] = [
                        next[index],
                        next[index - 1],
                      ]
                      return next
                    })
                  }
                >
                  Earlier
                </Button>
                <Button
                  disabled={busy || index === items.length - 1}
                  onClick={() =>
                    setItems((old) => {
                      const next = [...old]
                      ;[next[index + 1], next[index]] = [
                        next[index],
                        next[index + 1],
                      ]
                      return next
                    })
                  }
                >
                  Later
                </Button>
                <progress
                  aria-label={`Upload ${item.file.name}`}
                  value={item.progress}
                  max="1"
                />
                <Button
                  disabled={busy}
                  onClick={() =>
                    setItems((v) => v.filter((x) => x.key !== item.key))
                  }
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="sb-toolstrip">
            <Menu
              label={
                mode === 'original'
                  ? 'Keep original only'
                  : mode === 'pages'
                    ? 'Import pages as panels'
                    : 'Organize individual panels'
              }
              value={mode}
              onChange={setMode}
              items={[
                { value: 'original', label: 'Keep original only' },
                { value: 'pages', label: 'Import pages as panels' },
                { value: 'crops', label: 'Organize individual panels' },
              ]}
            />
            <Button
              disabled={busy || page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page + 1} of {pdf.numPages}
            </span>
            <Button
              disabled={busy || page >= pdf.numPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
            {mode === 'crops' && (
              <Button
                disabled={busy || !preview}
                onClick={() => {
                  if (preview)
                    setRegions((r) => ({
                      ...r,
                      [page]: suggestRegions(
                        preview.canvas
                          .getContext('2d')!
                          .getImageData(
                            0,
                            0,
                            preview.canvas.width,
                            preview.canvas.height,
                          ),
                      ).map((x) => ({
                        ...x,
                        id: crypto.randomUUID(),
                        label: '',
                      })),
                    }))
                }}
              >
                Suggest frames
              </Button>
            )}
          </div>
          {mode === 'crops' && (
            <Button
              icon="grid"
              disabled={!extraction.length || busy}
              onClick={() => {
                setReviewing((v) => !v)
                if (!reviewOrder.length)
                  setReviewOrder(extraction.map((e) => e.crop.id))
              }}
            >
              {reviewing
                ? 'Back to crop editor'
                : `Review ${extraction.length} panels`}
            </Button>
          )}
          {reviewing && mode === 'crops' && (
            <ExtractionReview
              entries={orderedExtraction}
              onReorder={setReviewOrder}
            />
          )}
          {busy && <DotsLoader />}
          {!reviewing &&
            preview &&
            (mode === 'crops' ? (
              <CropEditor
                key={page}
                image={preview.url}
                width={preview.canvas.width}
                height={preview.canvas.height}
                regions={regions[page] || []}
                onChange={(r) => {
                  setReviewing(false)
                  setRegions((old) => ({ ...old, [page]: r }))
                }}
              />
            ) : (
              <img
                className="sb-original-page"
                src={preview.url}
                alt={`Original page ${page + 1}`}
              />
            ))}
          {mode === 'crops' && !regions[page]?.length && (
            <p>
              Drag on the page to define a panel. Include any handwritten
              context you want to retain.
            </p>
          )}
        </>
      )}
    </Overlay>
  )
}

function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    if (!file.type.startsWith('image/')) return
    const value = URL.createObjectURL(file)
    setUrl(value)
    return () => URL.revokeObjectURL(value)
  }, [file])
  return url ? (
    <img className="sb-upload-thumb" src={url} alt={file.name} />
  ) : (
    <span className="sb-upload-filetype">PDF</span>
  )
}
