import PrintDepartments from './PrintDepartments'
import DatePicker from '../whiteout/DatePicker'
import { useEffect, useState } from 'react'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import Menu from '../whiteout/Menu'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import DotsLoader from '../whiteout/DotsLoader'
import { ErrorNotice } from '../whiteout/Feedback'
import PdfPages from './FlowPdfScroll'
import Combobox from '../whiteout/Combobox'
import { flowFetch } from '../../lib/flow/api'
import type { Department } from '../../lib/flow/model'
export default function FlowPrint({
  id,
  departments,
  onClose,
  title,
  date,
  onDateChange,
}: {
  title: string
  date: string
  onDateChange: (date: string) => void
  id: string
  departments: Department[]
  onClose: () => void
}) {
  const [product, setProduct] = useState('master'),
    [paper, setPaper] = useState('tabloid'),
    [orientation, setOrientation] = useState('landscape'),
    [style, setStyle] = useState('color'),
    [scope, setScope] = useState(departments.map((d) => d.id)),
    [pack, setPack] = useState(false),
    [packBusy, setPackBusy] = useState(false),
    [packError, setPackError] = useState(''),
    [packScope, setPackScope] = useState(departments.map((d) => d.id)),
    [packQuery, setPackQuery] = useState(''),
    [packAbort, setPackAbort] = useState<AbortController>(),
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
    actual: false,
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
          {!date && (
            <DatePicker
              label="Assign Shoot date"
              value={date}
              onChange={onDateChange}
            />
          )}
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
                label={
                  orientation === 'landscape' ? 'Landscape' : 'Portrait'
                }
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
                style === 'color'
                  ? 'Editorial Color'
                  : 'Production Monochrome'
              }
              value={style}
              onChange={setStyle}
              items={[
                { value: 'color', label: 'Editorial Color' },
                { value: 'mono', label: 'Production Monochrome' },
              ]}
            />
          </label>
          {product === 'department' && (
            <label>
              Department
              <Combobox
                label="Choose department"
                custom={false}
                clearable={false}
                value={scope[0] || ''}
                onChange={(v) => setScope([v])}
                options={departments.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
              />
            </label>
          )}
          {product === 'master' && (
            <fieldset>
              <legend>Departments</legend>
              <PrintDepartments
                departments={departments}
                scope={scope}
                onChange={setScope}
              />
            </fieldset>
          )}
          <fieldset>
            <legend>Include</legend>
            {[
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
          <Button icon="download" onClick={() => setPack(true)}>
            Download department pack
          </Button>
          <p className="flow-muted">
            This PDF preserves the previewed revision and print settings.
            Later edits do not change this download.
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
              <Button
                icon="retry"
                onClick={() => setRefresh((n) => n + 1)}
              >
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
                    download={
                      title + ' - ' + (date || 'Date TBD') + '.pdf'
                    }
                  >
                    Download PDF
                  </a>
                </>
              )}
          </div>
        </main>
      </div>
      {pack && (
        <Overlay
          title="Department pack"
          onClose={() => {
            packAbort?.abort()
            setPack(false)
          }}
          className="flow-pack-dialog"
          footer={
            <>
              <Button
                disabled={packBusy || !packScope.length}
                variant="primary"
                state={packBusy ? 'pending' : 'idle'}
                pendingLabel="Preparing pack…"
                onClick={() => {
                  const controller = new AbortController()
                  setPackAbort(controller)
                  setPackBusy(true)
                  setPackError('')
                  void flowFetch(`/${id}/department-pack`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      ...JSON.parse(config),
                      departments: packScope,
                    }),
                    signal: controller.signal,
                  })
                    .then((r) => r.blob())
                    .then((blob) => {
                      const u = URL.createObjectURL(blob),
                        a = document.createElement('a')
                      a.href = u
                      a.download =
                        title +
                        ' - ' +
                        (date || 'Date TBD') +
                        ' - Department pack.zip'
                      a.click()
                      setTimeout(() => URL.revokeObjectURL(u), 1000)
                      setPack(false)
                    })
                    .catch((e) => {
                      if (e.name !== 'AbortError') setPackError(e.message)
                    })
                    .finally(() => setPackBusy(false))
                }}
              >
                Download ZIP
              </Button>
              {packBusy && (
                <Button onClick={() => packAbort?.abort()}>
                  Cancel download
                </Button>
              )}
            </>
          }
        >
          {packError && <ErrorNotice>{packError}</ErrorNotice>}
          <p className="flow-muted">
            All department files use one captured schedule.
          </p>
          <input
            aria-label="Search departments"
            placeholder="Search departments…"
            value={packQuery}
            onChange={(e) => setPackQuery(e.target.value)}
          />
          <label className="flow-check">
            <DrawCheckbox
              checked={packScope.length === departments.length}
              indeterminate={
                packScope.length > 0 &&
                packScope.length < departments.length
              }
              onChange={(e) =>
                setPackScope(
                  e.target.checked ? departments.map((d) => d.id) : [],
                )
              }
            />
            All departments
          </label>
          {departments
            .filter((d) =>
              d.name.toLowerCase().includes(packQuery.toLowerCase()),
            )
            .map((d) => (
              <label className="flow-check" key={d.id}>
                <DrawCheckbox
                  checked={packScope.includes(d.id)}
                  onChange={(e) =>
                    setPackScope((v) =>
                      e.target.checked
                        ? [...v, d.id]
                        : v.filter((x) => x !== d.id),
                    )
                  }
                />
                {d.name}
              </label>
            ))}
        </Overlay>
      )}
    </Overlay>
  )
}
