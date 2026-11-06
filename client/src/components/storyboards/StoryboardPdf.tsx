import { useEffect, useRef, useState } from 'react'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import Menu from '../whiteout/Menu'
import DotsLoader from '../whiteout/DotsLoader'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import PdfPages from '../shots/PdfPages'
import { boardFetch } from '../../lib/storyboards/api'
export default function StoryboardPdf({
  documentId,
  selected,
  scenes = [],
  onClose,
  saved,
  connected,
}: {
  saved: boolean
  connected: boolean
  documentId: string
  selected: string[]
  scenes?: { id: string; label: string; panels: string[] }[]
  onClose: () => void
}) {
  const [selectedScenes, setSelectedScenes] = useState<string[]>([])
  const [scope, setScope] = useState(selected.length ? 'selected' : 'all'),
    [layout, setLayout] = useState('6'),
    [paper, setPaper] = useState('letter'),
    [orientation, setOrientation] = useState('portrait'),
    [notes, setNotes] = useState(true),
    [shots, setShots] = useState(true),
    [annotations, setAnnotations] = useState(true),
    [bytes, setBytes] = useState<Uint8Array>(),
    [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(true),
    sequence = useRef(0)
  const signature = JSON.stringify({
    panels:
      scope === 'selected'
        ? selected
        : scope === 'scenes'
          ? [
              ...new Set(
                scenes
                  .filter((s) => selectedScenes.includes(s.id))
                  .flatMap((s) => s.panels),
              ),
            ]
          : undefined,
    layout: +layout,
    paper,
    orientation,
    notes,
    shots,
    annotations,
  })
  useEffect(() => {
    const number = ++sequence.current,
      abort = new AbortController()
    setBusy(connected)
    setReady(false)
    setError('')
    if (!saved) {
      if (!connected) setError('Reconnect to preview this storyboard.')
      return () => abort.abort()
    }
    const timer = setTimeout(() => {
      void boardFetch(`/${documentId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: signature,
        signal: abort.signal,
      })
        .then((r) => r.arrayBuffer())
        .then((b) => {
          if (sequence.current === number) {
            setReady(false)
            setBytes(new Uint8Array(b))
          }
        })
        .catch((e) => {
          if (e.name !== 'AbortError' && number === sequence.current)
            setError(e.message)
        })
        .finally(() => {
          if (sequence.current === number) setBusy(false)
        })
    }, 350)
    return () => {
      clearTimeout(timer)
      abort.abort()
    }
  }, [documentId, signature, saved, connected])
  function download() {
    if (!bytes || busy || !ready) return
    const url = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }),
      ),
      a = document.createElement('a')
    a.href = url
    a.download = 'whiteout-storyboard.pdf'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }
  return (
    <Overlay
      title="Download storyboard"
      className="sb-print"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button
            icon="download"
            variant="primary"
            disabled={!bytes || busy || !ready || !!error}
            onClick={download}
          >
            Download PDF
          </Button>
        </>
      }
    >
      <div className="sb-print-layout">
        <div className="sb-print-settings">
          <Menu
            label={
              scope === 'all'
                ? 'Entire storyboard'
                : scope === 'scenes'
                  ? 'Selected scenes'
                  : 'Selected panels'
            }
            value={scope}
            onChange={setScope}
            items={[
              { value: 'all', label: 'Entire storyboard' },
              {
                value: 'selected',
                label: 'Selected panels',
                disabled: !selected.length,
              },
              {
                value: 'scenes',
                label: 'Selected scenes',
                disabled: !scenes.length,
              },
            ]}
          />
          {scope === 'scenes' && (
            <div>
              {scenes.map((scene) => (
                <label key={scene.id}>
                  <DrawCheckbox
                    checked={selectedScenes.includes(scene.id)}
                    onChange={(e) =>
                      setSelectedScenes((old) =>
                        e.target.checked
                          ? [...old, scene.id]
                          : old.filter((id) => id !== scene.id),
                      )
                    }
                  />
                  {scene.label}
                </label>
              ))}
            </div>
          )}
          <Menu
            label={`${layout} panels per page`}
            value={layout}
            onChange={setLayout}
            items={['1', '2', '4', '6','8'].map((value) => ({
              value,
              label: `${value} panel${value === '1' ? '' : 's'} per page`,
            }))}
          />
          <Menu
            label={paper === 'letter' ? 'US Letter' : 'A4'}
            value={paper}
            onChange={setPaper}
            items={[
              { value: 'letter', label: 'US Letter' },
              { value: 'a4', label: 'A4' },
            ]}
          />
          <Menu
            label={orientation === 'landscape' ? 'Landscape' : 'Portrait'}
            value={orientation}
            onChange={setOrientation}
            items={[
              { value: 'landscape', label: 'Landscape' },
              { value: 'portrait', label: 'Portrait' },
            ]}
          />
          {[
            ['Visual descriptions', notes, setNotes],
            ['Linked shots', shots, setShots],
            ['Annotations', annotations, setAnnotations],
          ].map(([label, checked, change]) => (
            <label key={String(label)}>
              <DrawCheckbox
                checked={checked as boolean}
                onChange={(e) =>
                  (change as (v: boolean) => void)(e.target.checked)
                }
              />
              {label as string}
            </label>
          ))}
        </div>
        <div className="sb-print-preview" aria-busy={busy}>
          {busy && (
            <div className="sb-preview-updating" role="status">
              <DotsLoader />
              <span className="pd-sr-only">Updating preview</span>
            </div>
          )}
          {error ? (
            <p role="alert">{error}</p>
          ) : bytes ? (
            <PdfPages
              bytes={bytes}
              onReady={(b) => {
                if (b === bytes) setReady(true)
              }}
            />
          ) : (
            <p role="status">Preparing preview…</p>
          )}
        </div>
      </div>
    </Overlay>
  )
}
