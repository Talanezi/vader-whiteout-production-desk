import {
  Component,
  type ReactNode,
  lazy,
  Suspense,
  useEffect,
  useState,
} from 'react'
import * as Y from 'yjs'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import Combobox from '../whiteout/Combobox'
import Menu from '../whiteout/Menu'
import { ErrorNotice } from '../whiteout/Feedback'
import { ordered, scenes, shots, str } from '../../lib/shotDocument'
import { days, validAssignments } from '../../lib/shotSchedule'
import { shotApiBase } from '../../lib/shotApi'
import { getAuthToken } from '../../lib/api'
import {
  printFit,
  printLabels,
  shootingColumns,
  type PrintColumn,
  type PrintReference,
  type PrintSpec,
  type PrintView,
} from '../../lib/shotPrint'
const PdfPages = lazy(() => import('./PdfPages'))
class PdfPreviewBoundary extends Component<
  { children: ReactNode; fallbackUrl: string },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <div>
        <ErrorNotice>
          PDF preview could not load. The generated file is still available.
        </ErrorNotice>
        <a
          className="pd-button"
          href={this.props.fallbackUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open generated PDF
        </a>
      </div>
    ) : (
      this.props.children
    )
  }
}
const defaults: PrintColumn[] = [
  { field: 'number', width: 106 },
  { field: 'coverage', width: 330 },
  { field: 'framing', width: 118 },
  { field: 'camera', width: 104 },
  { field: 'lens', width: 100 },
  { field: 'movement', width: 150 },
  { field: 'estimatedMinutes', width: 110 },
]
export default function ShotPdf({
  id,
  doc,
  saved,
  onClose,
  view,
  selected,
  entire,
}: {
  id: string
  doc: Y.Doc
  saved: boolean
  onClose: () => void
  view?: PrintView
  selected: string[]
  entire: PrintReference[]
}) {
  const [scope, setScope] = useState<PrintSpec['scope']>(
      view?.dayId
        ? 'day'
        : selected.length
          ? 'selected'
          : view?.area
            ? 'area'
            : 'current',
    ),
    [layout, setLayout] = useState<PrintSpec['layout']>('table'),
    [paper, setPaper] = useState<PrintSpec['paper']>('letter'),
    [orientation, setOrientation] =
      useState<PrintSpec['orientation']>('landscape'),
    [margins, setMargins] = useState<PrintSpec['margins']>('normal'),
    [columns, setColumns] = useState<PrintColumn[]>(
      view?.area && !selected.length
        ? view.area.columns
        : view?.columns || defaults,
    ),
    [scaling, setScaling] = useState<PrintSpec['scaling']>(() =>
      printFit(view?.columns || defaults, 'letter', 'landscape', 'normal')
        .readable
        ? 'fit-width'
        : 'readable',
    ),
    [text, setText] = useState<PrintSpec['text']>('wrap'),
    [groupScenes, setGroups] = useState(view?.groupScenes ?? true),
    [sceneIds, setScenes] = useState<string[]>([]),
    [dayId, setDay] = useState(
      view?.dayId ||
        str(
          ordered(days(doc)).find(
            (d) => validAssignments(doc, str(d, 'id')).length,
          ),
          'id',
        ),
    ),
    [profile, setProfile] = useState<'compact' | 'standard' | 'detailed'>(
      'standard',
    ),
    [notes, setNotes] = useState(true),
    [summaries, setSummaries] = useState(true),
    [reportMode, setReportMode] = useState<'creative' | 'shooting' | 'both'>(
      'creative',
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [generated, setGenerated] = useState<{
      url: string
      bytes: Uint8Array
      signature: string
    }>(),
    [newer, setNewer] = useState(false)
  const allScenes = ordered(scenes(doc)),
    shootDays = ordered(days(doc)).filter(
      (day) => validAssignments(doc, str(day, 'id')).length,
    ),
    availableColumns = [
      ...new Map(
        [
          ...(scope === 'day' ? shootingColumns : view?.columns || defaults),
          ...defaults,
          ...Object.entries(printLabels).map(([field]) => ({
            field: field as PrintColumn['field'],
            width: field.includes('Notes') || field === 'notes' ? 260 : 120,
          })),
        ].map((c) => [c.field, c]),
      ).values(),
    ]
  const rows =
    scope === 'entire'
      ? entire
      : scope === 'current'
        ? view?.rows || entire
        : scope === 'area'
          ? view?.area?.rows || []
          : scope === 'selected'
            ? entire.filter((row) => selected.includes(row.shotId))
            : scope === 'scenes'
              ? entire.filter((row) =>
                  sceneIds.includes(str(shots(doc).get(row.shotId), 'sceneId')),
                )
              : validAssignments(doc, dayId).map((assignment) => ({
                  shotId: str(assignment, 'shotId'),
                  assignmentId: str(assignment, 'id'),
                }))
  const printable = columns.some((c) => c.field === 'number')
      ? columns
      : [{ field: 'number' as const, width: 106 }, ...columns],
    fit = printFit(printable, paper, orientation, margins),
    spec: PrintSpec = {
      version: 2,
      scope,
      layout,
      rows,
      columns: printable,
      sceneIds: scope === 'scenes' ? sceneIds : undefined,
      dayId: scope === 'day' ? dayId : undefined,
      paper,
      orientation,
      margins,
      scaling,
      text,
      groupScenes,
      report: { mode: reportMode, profile, notes, summaries },
    },
    signature = JSON.stringify(spec),
    changed = !!generated && generated.signature !== signature,
    blocked = layout === 'table' && scaling === 'fit-width' && !fit.readable
  useEffect(
    () => () => {
      if (generated) URL.revokeObjectURL(generated.url)
    },
    [generated],
  )
  useEffect(() => {
    const update = () => {
      if (generated) setNewer(true)
    }
    doc.on('update', update)
    return () => doc.off('update', update)
  }, [doc, generated])
  function chooseScope(value: string) {
    const next = value as PrintSpec['scope']
    setScope(next)
    setError('')
    if (next === 'area' && view?.area) setColumns(view.area.columns)
    else if (next === 'day') {
      setColumns(shootingColumns)
      setGroups(false)
      setScaling('readable')
    } else {
      setColumns(view?.columns || defaults)
      setGroups(view?.groupScenes ?? true)
    }
    if (next === 'scenes' && !sceneIds.length)
      setScenes(allScenes[0] ? [str(allScenes[0], 'id')] : [])
  }
  async function generate() {
    setError('')
    setBusy(true)
    try {
      const response = await fetch(`${shotApiBase}/shotlists/${id}/pdf`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken() || ''}`,
          'Content-Type': 'application/json',
        },
        body: signature,
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        throw Error(result.message || 'PDF generation failed.')
      }
      if (!response.headers.get('content-type')?.includes('application/pdf'))
        throw Error('The service did not return a PDF.')
      const blob = await response.blob(),
        bytes = new Uint8Array(await blob.arrayBuffer())
      setGenerated({ url: URL.createObjectURL(blob), bytes, signature })
      setNewer(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  function move(index: number, delta: number) {
    setColumns((old) => {
      const next = [...old],
        to = index + delta
      if (to < 0 || to >= next.length) return next
      ;[next[index], next[to]] = [next[to], next[index]]
      return next
    })
  }
  return (
    <Overlay
      title="Download shot list"
      className={`pd-pdf-dialog ${generated ? 'has-preview' : ''}`}
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Close
          </Button>
          {generated && !changed && (
            <a
              className="pd-button"
              href={generated.url}
              download="whiteout-shot-list.pdf"
            >
              Download PDF
            </a>
          )}
          <Button
            variant="primary"
            icon="download"
            state={busy ? 'pending' : 'idle'}
            pendingLabel="Typesetting…"
            disabled={
              !saved ||
              (!rows.length &&
                !(
                  entire.length === 0 &&
                  (scope === 'entire' || scope === 'current')
                )) ||
              blocked
            }
            onClick={generate}
          >
            {generated ? 'Refresh preview' : 'Generate PDF'}
          </Button>
        </>
      }
    >
      <div className="pd-print-workspace">
        <div className="pd-print-settings">
          <div className="pd-print-setting">
            <label>Scope</label>
            <Menu
              ariaLabel="Print scope"
              label={
                {
                  entire: 'Entire Shot List',
                  current: view?.label.startsWith('Scene ')
                    ? 'Current Scene'
                    : 'Current View',
                  selected: `Selected Shots (${selected.length})`,
                  area: 'Selected Area',
                  scenes: 'Selected Scenes',
                  day: 'Selected Shoot Day',
                }[scope]
              }
              value={scope}
              onChange={chooseScope}
              items={[
                { value: 'entire', label: 'Entire Shot List' },
                {
                  value: 'current',
                  label: view?.label.startsWith('Scene ')
                    ? 'Current Scene'
                    : 'Current View',
                },
                {
                  value: 'selected',
                  label: `Selected Shots (${selected.length})`,
                  disabled: !selected.length,
                },
                {
                  value: 'area',
                  label: 'Selected Area',
                  disabled: !view?.area,
                },
                {
                  value: 'scenes',
                  label: 'Selected Scenes',
                  disabled: !allScenes.length,
                },
                {
                  value: 'day',
                  label: 'Selected Shoot Day',
                  disabled: !shootDays.length,
                },
              ]}
            />
          </div>
          <p className="pd-print-area" role="status">
            {rows.length} rows · {printable.length} fields
            {scope === 'current' && view ? ` · ${view.label}` : ''}
            {scope === 'area' && view?.area ? ` · ${view.area.label}` : ''}
          </p>
          {scope === 'scenes' && (
            <div className="pd-print-scene-picker">
              {allScenes.map((scene) => (
                <label key={str(scene, 'id')}>
                  <input
                    type="checkbox"
                    checked={sceneIds.includes(str(scene, 'id'))}
                    onChange={(e) =>
                      setScenes((old) =>
                        e.target.checked
                          ? [...old, str(scene, 'id')]
                          : old.filter((id) => id !== str(scene, 'id')),
                      )
                    }
                  />
                  Scene {str(scene, 'number')}
                </label>
              ))}
            </div>
          )}
          {scope === 'day' && (
            <Combobox
              label="Print shoot day"
              value={dayId}
              options={shootDays.map((day) => ({
                value: str(day, 'id'),
                label: `${str(day, 'date')} · ${str(day, 'title')}`,
              }))}
              custom={false}
              clearable={false}
              onChange={setDay}
            />
          )}
          <div className="pd-pdf-options">
            <div className="pd-print-setting">
              <label>Layout</label>
              <Combobox
                label="Print layout"
                value={layout}
                options={[
                  { value: 'table', label: 'Table Print' },
                  { value: 'report', label: 'Detailed Production Report' },
                ]}
                custom={false}
                clearable={false}
                onChange={(v) => setLayout(v as PrintSpec['layout'])}
              />
            </div>
            <div className="pd-print-setting">
              <label>Paper</label>
              <Combobox
                label="Print paper"
                value={paper}
                options={[
                  { value: 'letter', label: 'US Letter' },
                  { value: 'a4', label: 'A4' },
                ]}
                custom={false}
                clearable={false}
                onChange={(v) => setPaper(v as PrintSpec['paper'])}
              />
            </div>
            <div className="pd-print-setting">
              <label>Orientation</label>
              <Combobox
                label="Print orientation"
                value={orientation}
                options={['landscape', 'portrait']}
                custom={false}
                clearable={false}
                onChange={(v) => setOrientation(v as PrintSpec['orientation'])}
              />
            </div>
            <div className="pd-print-setting">
              <label>Margins</label>
              <Combobox
                label="Print margins"
                value={margins}
                options={[
                  { value: 'normal', label: 'Normal · 12 mm' },
                  { value: 'narrow', label: 'Narrow · 8 mm' },
                ]}
                custom={false}
                clearable={false}
                onChange={(v) => setMargins(v as PrintSpec['margins'])}
              />
            </div>
          </div>
          {layout === 'table' ? (
            <>
              <div className="pd-print-setting">
                <label>Scaling</label>
                <Combobox
                  label="Print scaling"
                  value={scaling}
                  options={[
                    { value: 'fit-width', label: 'Fit one page wide' },
                    {
                      value: 'actual',
                      label: 'Actual size · tile wide columns',
                    },
                    {
                      value: 'readable',
                      label: 'Readable pages · tile columns',
                    },
                  ]}
                  custom={false}
                  clearable={false}
                  onChange={(v) => setScaling(v as PrintSpec['scaling'])}
                />
              </div>
              <div className="pd-print-setting">
                <label>Text</label>
                <Combobox
                  label="Printed text"
                  value={text}
                  options={[
                    { value: 'wrap', label: 'Wrap full text' },
                    {
                      value: 'single-line',
                      label: 'One-line preview · truncated',
                    },
                  ]}
                  custom={false}
                  clearable={false}
                  onChange={(v) => setText(v as PrintSpec['text'])}
                />
              </div>
              {blocked && (
                <div className="pd-print-warning" role="alert">
                  These fields would shrink below 8 pt.{' '}
                  <Button onClick={() => setScaling('readable')}>
                    Use readable pages
                  </Button>
                  <span>
                    Or choose fewer fields, landscape or narrower margins.
                  </span>
                </div>
              )}
              {scaling !== 'fit-width' && (
                <p className="pd-print-hint">
                  Wide fields continue in column bands with shot IDs repeated.
                  Rows continue vertically; they are never fitted to one page.
                </p>
              )}
              <details className="pd-print-columns">
                <summary>Columns · {printable.length} in print order</summary>
                <p className="pd-print-hint">
                  Shot identity is retained. Hidden notes print only when
                  selected here.
                </p>
                {columns.map((column, index) => (
                  <div className="pd-print-column-row" key={column.field}>
                    <input
                      type="checkbox"
                      aria-label={`Print ${printLabels[column.field]}`}
                      checked
                      disabled={column.field === 'number'}
                      onChange={() =>
                        setColumns((old) =>
                          old.filter((c) => c.field !== column.field),
                        )
                      }
                    />
                    <span>{printLabels[column.field]}</span>
                    <button
                      aria-label={`Print ${printLabels[column.field]} earlier`}
                      disabled={!index}
                      onClick={() => move(index, -1)}
                    >
                      ↑
                    </button>
                    <button
                      aria-label={`Print ${printLabels[column.field]} later`}
                      disabled={index === columns.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      ↓
                    </button>
                  </div>
                ))}
                {availableColumns
                  .filter((c) => !columns.some((x) => x.field === c.field))
                  .map((column) => (
                    <label className="pd-print-column-row" key={column.field}>
                      <input
                        type="checkbox"
                        aria-label={`Print ${printLabels[column.field]}`}
                        checked={false}
                        onChange={() => setColumns((old) => [...old, column])}
                      />
                      <span>{printLabels[column.field]}</span>
                    </label>
                  ))}
              </details>
              <label className="pd-print-groups">
                <input
                  type="checkbox"
                  checked={groupScenes}
                  onChange={(e) => setGroups(e.target.checked)}
                />{' '}
                Scene dividers
              </label>
            </>
          ) : (
            <>
              <div className="pd-pdf-options">
                <Combobox
                  label="Report profile"
                  value={profile}
                  options={['compact', 'standard', 'detailed']}
                  onChange={(v) => setProfile(v as typeof profile)}
                  custom={false}
                  clearable={false}
                />
                <Combobox
                  label="Report sections"
                  value={scope === 'day' ? 'shooting' : reportMode}
                  options={
                    scope === 'day'
                      ? [{ value: 'shooting', label: 'Shooting Order' }]
                      : [
                          { value: 'creative', label: 'Creative Shot List' },
                          ...(shootDays.length
                            ? [
                                {
                                  value: 'both',
                                  label: 'Creative + Shooting Order',
                                },
                              ]
                            : []),
                        ]
                  }
                  onChange={(v) => setReportMode(v as typeof reportMode)}
                  custom={false}
                  clearable={false}
                />
              </div>
              <div className="pd-pdf-checks">
                <label>
                  <input
                    type="checkbox"
                    checked={notes}
                    onChange={(e) => setNotes(e.target.checked)}
                  />{' '}
                  Expanded technical notes
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={summaries}
                    onChange={(e) => setSummaries(e.target.checked)}
                  />{' '}
                  Scene summaries
                </label>
              </div>
            </>
          )}
          {!saved && (
            <p role="status" className="pd-muted">
              Waiting for saved changes before generating.
            </p>
          )}
          {changed && (
            <p className="pd-print-warning" role="status">
              Print selection or settings changed. Refresh the preview before
              downloading.
            </p>
          )}
          {newer && generated && !changed && (
            <p className="pd-print-hint" role="status">
              Newer document edits exist. Download keeps this preview snapshot;
              refresh to include them.
            </p>
          )}
          {error && <ErrorNotice>{error}</ErrorNotice>}
        </div>
        {generated && (
          <PdfPreviewBoundary key={generated.url} fallbackUrl={generated.url}>
            <Suspense fallback={<p className="pd-muted">Loading PDF pages…</p>}>
              <PdfPages bytes={generated.bytes} />
            </Suspense>
          </PdfPreviewBoundary>
        )}
      </div>
    </Overlay>
  )
}
