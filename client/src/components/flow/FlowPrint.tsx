import { useEffect, useState } from 'react'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import Menu from '../whiteout/Menu'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import DotsLoader from '../whiteout/DotsLoader'
import { ErrorNotice } from '../whiteout/Feedback'
import PdfPages from '../shots/PdfPages'
import { flowFetch } from '../../lib/flow/api'
import type { Department } from '../../lib/flow/model'
export default function FlowPrint({
  id,
  departments,
  onClose,
}: {
  id: string
  departments: Department[]
  onClose: () => void
}) {
  const [product, setProduct] = useState('master'),
    [paper, setPaper] = useState('tabloid'),
    [orientation, setOrientation] = useState('landscape'),
    [style, setStyle] = useState('color'),
    [scope, setScope] = useState(departments.map((d) => d.id)),
    [actual, setActual] = useState(false),
    [personnel, setPersonnel] = useState(true),
    [notes, setNotes] = useState(true),
    [bytes, setBytes] = useState<Uint8Array>(),
    [readyBytes, setReadyBytes] = useState<Uint8Array>(),
    [generatedConfig, setGeneratedConfig] = useState(''),
    [url, setUrl] = useState(''),
    [error, setError] = useState(''),
    [pending, setPending] = useState(true),
    [refresh, setRefresh] = useState(0)
  const config = JSON.stringify({
    product,
    paper,
    orientation,
    style,
    departments: scope,
    actual,
    personnel,
    notes,
  })
  useEffect(() => {
    let alive = true
    const abort = new AbortController()
    setPending(true)
    setError('')
    setBytes(undefined)
    setReadyBytes(undefined)
    const timer = setTimeout(() => {
      void flowFetch(`/${id}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: config,
        signal: abort.signal,
      })
        .then((r) => r.arrayBuffer())
        .then((b) => {
          if (alive) {
            setBytes(new Uint8Array(b))
            setGeneratedConfig(config)
          }
        })
        .catch((e) => {
          if (alive && e.name !== 'AbortError') setError(e.message)
        })
        .finally(() => {
          if (alive) setPending(false)
        })
    }, 450)
    return () => {
      alive = false
      clearTimeout(timer)
      abort.abort()
    }
  }, [id, config, refresh])
  useEffect(() => {
    if (!bytes) {
      setUrl('')
      return
    }
    const u = URL.createObjectURL(
      new Blob([bytes as BlobPart], { type: 'application/pdf' }),
    )
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [bytes])
  return (
    <Overlay
      title="Print Studio"
      onClose={onClose}
      className="flow-print-studio"
    >
      <div className="flow-print-layout">
        <aside>
          <label>
            Print product
            <Menu
              label={
                {
                  master: 'Master Departmental Flow',
                  department: 'Department Focus',
                  rundown: 'Daily Rundown',
                }[product] || ''
              }
              value={product}
              onChange={(v) => {
                setProduct(v)
                if (v === 'department') {
                  setScope(departments.slice(0, 1).map((d) => d.id))
                  setPaper('letter')
                } else {
                  setScope(departments.map((d) => d.id))
                  setPaper(v === 'master' ? 'tabloid' : 'letter')
                }
              }}
              items={[
                { value: 'master', label: 'Master Departmental Flow' },
                { value: 'department', label: 'Department Focus' },
                { value: 'rundown', label: 'Daily Rundown' },
              ]}
            />
          </label>
          <div className="flow-print-pair">
            <label>
              Paper
              <Menu
                label={
                  {
                    letter: 'US Letter',
                    a4: 'A4',
                    tabloid: 'Tabloid · 11 × 17',
                    a3: 'A3',
                  }[paper] || ''
                }
                value={paper}
                onChange={setPaper}
                items={['letter', 'a4', 'tabloid', 'a3'].map((v) => ({
                  value: v,
                  label:
                    {
                      letter: 'US Letter',
                      a4: 'A4',
                      tabloid: 'Tabloid · 11 × 17',
                      a3: 'A3',
                    }[v] || v,
                }))}
              />
            </label>
            <label>
              Orientation
              <Menu
                label={orientation === 'landscape' ? 'Landscape' : 'Portrait'}
                value={orientation}
                onChange={setOrientation}
                items={[
                  { value: 'landscape', label: 'Landscape' },
                  { value: 'portrait', label: 'Portrait' },
                ]}
              />
            </label>
          </div>
          <label>
            Style
            <Menu
              label={
                style === 'color' ? 'Editorial Color' : 'Production Monochrome'
              }
              value={style}
              onChange={setStyle}
              items={[
                { value: 'color', label: 'Editorial Color' },
                { value: 'mono', label: 'Production Monochrome' },
              ]}
            />
          </label>
          {product !== 'rundown' && (
            <fieldset>
              <legend>Departments</legend>
              {departments.map((d) => (
                <label className="flow-check" key={d.id}>
                  <DrawCheckbox
                    checked={scope.includes(d.id)}
                    onChange={(e) =>
                      setScope(
                        product === 'department'
                          ? [d.id]
                          : e.target.checked
                            ? [...scope, d.id]
                            : scope.filter((k) => k !== d.id),
                      )
                    }
                  />
                  {d.name}
                </label>
              ))}
            </fieldset>
          )}
          <fieldset>
            <legend>Include</legend>
            {[
              [actual, setActual, 'Actual times'],
              [personnel, setPersonnel, 'Personnel'],
              [notes, setNotes, 'Production notes'],
            ].map(([value, set, label]) => (
              <label className="flow-check" key={String(label)}>
                <DrawCheckbox
                  checked={Boolean(value)}
                  onChange={(e) =>
                    (set as (v: boolean) => void)(e.target.checked)
                  }
                />
                {String(label)}
              </label>
            ))}
          </fieldset>
          <p className="flow-muted">
            This PDF preserves the previewed revision and print settings. Later
            edits do not change this download.
          </p>
          <Button
            icon="retry"
            variant="quiet"
            onClick={() => setRefresh((n) => n + 1)}
          >
            Refresh from current schedule
          </Button>
        </aside>
        <main className="flow-print-preview">
          {pending ? (
            <div className="flow-print-loading" role="status">
              <DotsLoader />
              Preparing measured pages…
            </div>
          ) : error ? (
            <div className="flow-print-loading">
              <ErrorNotice>{error}</ErrorNotice>
              <Button icon="retry" onClick={() => setRefresh((n) => n + 1)}>
                Retry preview
              </Button>
            </div>
          ) : bytes ? (
            <PdfPages bytes={bytes} onReady={setReadyBytes} />
          ) : null}
          <div className="flow-print-actions">
            {url &&
              bytes &&
              readyBytes === bytes &&
              generatedConfig === config &&
              !pending &&
              !error && (
                <>
                  <a
                    className="pd-button pd-button-primary"
                    href={url}
                    download="Whiteout - Flow of the Day.pdf"
                  >
                    Download PDF
                  </a>
                  <Button
                    icon="file"
                    onClick={() => {
                      const frame = document.createElement('iframe')
                      frame.style.display = 'none'
                      frame.src = url
                      document.body.append(frame)
                      frame.onload = () => {
                        frame.contentWindow?.print()
                        setTimeout(() => frame.remove(), 60000)
                      }
                    }}
                  >
                    Print PDF
                  </Button>
                </>
              )}
          </div>
        </main>
      </div>
    </Overlay>
  )
}
