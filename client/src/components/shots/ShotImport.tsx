import DrawCheckbox from '../whiteout/DrawCheckbox'
import { useEffect, useRef, useState } from 'react'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import { ErrorNotice, useToast } from '../whiteout/Feedback'
import Combobox from '../whiteout/Combobox'
import DatePicker from '../whiteout/DatePicker'
import Icon from '../whiteout/Icon'
import { fields } from '../../lib/shotDocument'
import { shotRequest } from '../../lib/shotApi'
import type {
  ImportPreview,
  ImportSheet,
  ImportField,
} from '../../lib/shotImport'
const isShotSheet = (sheet: ImportSheet) =>
  sheet.kind === 'scene' || sheet.kind === 'combined'
const roleLabels = {
  scene: 'Scene shot list',
  combined: 'Master shot list',
  planning: 'Shooting-order reference',
  reference: 'Options / reference',
  template: 'Template',
  unknown: 'Unknown',
}
const mappingFields = { ...fields, sceneNumber: 'Scene number' }
function template() {
  const csv =
    'Scene,Shot,Camera,Framing,Lens,Movement,Coverage,Script Duration (seconds),Setup Time (minutes),Estimated Shooting (minutes),Notes\r\n09,09-A,CAM A,Wide,24mm,Static,EXAMPLE — replace or exclude this row,12,10,15,Shot identifiers are text; preserve leading zeros\r\n16,16-A,CAM B,CU,85mm,Handheld,EXAMPLE — replace or exclude this row,8,5,10,Optional fields can remain blank\r\n'
  const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
    ),
    a = document.createElement('a')
  a.href = url
  a.download = 'Whiteout-import-template.csv'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export default function ShotImport({
  id,
  onClose,
  onBusyChange,
}: {
  id: string
  onClose: () => void
  onBusyChange: (busy: boolean) => void
}) {
  const [preview, setPreview] = useState<ImportPreview>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [fileName, setFileName] = useState(''),
    [stage, setStage] = useState(1),
    [batch] = useState(() => crypto.randomUUID()),
    [, render] = useState(0),
    confirmed = useRef<unknown>(undefined),
    notify = useToast(),
    refresh = () => render((x) => x + 1)
  useEffect(() => {
    onBusyChange(busy)
    return () => onBusyChange(false)
  }, [busy, onBusyChange])
  async function load(file?: File) {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      if (!/\.(xlsx|csv|tsv)$/i.test(file.name))
        throw Error('Choose an .xlsx, .csv or .tsv file.')
      if (file.size > 8 * 1024 * 1024) throw Error('Maximum file size is 8 MB.')
      const parser = await import('../../lib/shotImport'),
        next = parser.inspectWorkbook(await file.arrayBuffer(), file.name)
      setPreview(next)
      setFileName(file.name)
      setStage(1)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function remap(sheet: ImportSheet) {
    const { mapRows } = await import('../../lib/shotImport')
    const previous = new Map(sheet.rows.map((row) => [row.row, row]))
    sheet.rows = mapRows(sheet).map((row) => {
      const prior = previous.get(row.row)
      if (!prior) return row
      return {
        ...row,
        include: prior.include,
        values: { ...row.values, ...prior.overrides },
        overrides: prior.overrides,
        sceneOverride: prior.sceneOverride,
        sceneNumber: prior.sceneOverride ?? row.sceneNumber,
        reviewed: false,
      }
    })
    refresh()
  }
  async function confirm() {
    if (!preview) return
    setError('')
    setBusy(true)
    try {
      const { importPayload } = await import('../../lib/shotImport'),
        payload = confirmed.current || importPayload(preview, batch)
      confirmed.current = payload
      await notify.promise(
        shotRequest<{ scenes: number; shots: number; rejected: number }>(
          `/${id}/import`,
          payload,
        ),
        {
          pending: 'Importing reviewed shots…',
          success: (r) =>
            `${r.shots} shots imported into ${r.scenes} scenes. ${r.rejected} rejected.`,
          error:
            'Import was not confirmed. Your review is retained; retry safely.',
        },
      )
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const mapSheets =
    preview?.sheets.flatMap((sheet) => sheet.blocks || [sheet]) || []
  const scheduleSelected = mapSheets.filter(
    (sheet) => sheet.kind === 'planning' && sheet.include,
  )
  const assignmentCount = scheduleSelected.reduce(
    (n, sheet) => n + sheet.rows.filter((row) => row.include).length,
    0,
  )
  const selected =
      preview?.sheets.filter((s) => s.include && isShotSheet(s)) || [],
    rows = selected.flatMap((s) => s.rows),
    included = rows.filter((r) => r.include),
    flagged = included.filter((r) => !r.reviewed),
    excluded = rows.length - included.length,
    sceneCount = new Set(
      selected.flatMap((s) =>
        s.rows
          .filter((r) => r.include)
          .map(
            (r) =>
              s.name +
              '\0' +
              (s.kind === 'combined' ? r.sceneNumber : s.sceneNumber),
          ),
      ),
    ).size
  function next() {
    setError('')
    if (stage === 3 && preview) {
      import('../../lib/shotImport').then(({ importPayload }) => {
        try {
          importPayload(preview, batch)
          setStage(4)
        } catch (e) {
          setError((e as Error).message)
        }
      })
    } else setStage(stage + 1)
  }
  const upload = (
    <label
      className="pd-shot-upload"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault()
        void load(e.dataTransfer.files[0])
      }}
    >
      <Icon name="import" />
      <strong>Choose a shot list</strong>
      <span>Drop an .xlsx, .csv or .tsv file · up to 8 MB</span>
      <input
        data-initial-focus
        type="file"
        accept=".xlsx,.csv,.tsv"
        aria-label="Upload shot-list workbook"
        disabled={busy}
        onChange={(e) => void load(e.target.files?.[0])}
      />
    </label>
  )
  return (
    <Overlay
      title="Import Shot List"
      className="pd-shot-import"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <span className="pd-import-count">
            {preview
              ? `${sceneCount} scenes · ${included.length} shots · ${excluded} excluded`
              : '.xlsx / .csv / .tsv'}
          </span>
          <Button disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          {stage > 1 && (
            <Button
              disabled={busy || Boolean(confirmed.current)}
              onClick={() => setStage(stage - 1)}
            >
              Back
            </Button>
          )}
          {stage < 4 ? (
            <Button
              variant="primary"
              disabled={!preview || busy}
              onClick={next}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              icon="import"
              disabled={!included.length && !assignmentCount}
              state={busy ? 'pending' : 'idle'}
              pendingLabel="Importing…"
              onClick={confirm}
            >
              Import selected
            </Button>
          )}
        </>
      }
    >
      <ol className="pd-import-stages" aria-label="Import progress">
        {['Upload', 'Map', 'Review', 'Import'].map((name, i) => (
          <li key={name} aria-current={stage === i + 1 ? 'step' : undefined}>
            <span>{i + 1}</span>
            {name}
          </li>
        ))}
      </ol>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {stage === 1 && (
        <>
          {upload}
          {preview && (
            <div className="pd-import-summary">
              <strong>{fileName}</strong>
              <span>
                {fileName.split('.').pop()?.toUpperCase()} ·{' '}
                {preview.sheets.length} sheets ·{' '}
                {preview.sheets.reduce((n, s) => n + s.rows.length, 0)}{' '}
                candidate rows
              </span>
            </div>
          )}
          <Button onClick={template}>Download import template</Button>
          <p className="pd-import-guidance">
            Any clearly structured shot list works. The optional CSV template
            has two labeled example rows; templates are excluded until
            explicitly selected. Scene and Shot are required. Durations name
            their units. Multi-scene files use a Scene column. Shooting-order
            sheets are mapped separately to a date.
          </p>
        </>
      )}
      {preview && stage === 2 && (
        <>
          <div className="pd-import-summary">
            <strong>{fileName}</strong>
            <span>{preview.sheets.length} sheets inspected</span>
          </div>
          {preview.warnings.map((w) => (
            <p className="pd-import-guidance" key={w}>
              {w}
            </p>
          ))}
          <div className="pd-import-batch-units">
            <span>Apply to all master sheets:</span>
            {['seconds', 'minutes'].map((unit) => (
              <Button
                key={unit}
                disabled={busy}
                onClick={async () => {
                  for (const sheet of preview.sheets.filter(isShotSheet)) {
                    sheet.scriptUnit = unit as 'seconds' | 'minutes'
                    sheet.units.scriptSeconds = sheet.scriptUnit
                    await remap(sheet)
                  }
                }}
              >
                Script time in {unit}
              </Button>
            ))}
          </div>
          <fieldset
            className="pd-import-sheets"
            disabled={busy || Boolean(confirmed.current)}
          >
            {mapSheets.map((sheet) => (
              <details
                key={sheet.name}
                open={
                  (sheet.include &&
                    (sheet.rows.some((r) => !r.reviewed) ||
                      !sheet.sceneNumber)) ||
                  undefined
                }
              >
                <summary>
                  <span>{sheet.name}</span>
                  <small>
                    {roleLabels[sheet.kind]} · {sheet.rows.length} rows
                    {sheet.include ? ' · selected' : ' · excluded'}
                  </small>
                </summary>
                <div className="pd-import-sheet-body">
                  <div className="pd-import-mapping-head">
                    <Combobox
                      label={`Role of ${sheet.name}`}
                      value={sheet.kind}
                      options={[
                        'scene',
                        'combined',
                        'planning',
                        'reference',
                        'template',
                        'unknown',
                      ]}
                      custom={false}
                      clearable={false}
                      onChange={(v) => {
                        sheet.kind = v as ImportSheet['kind']
                        sheet.include = isShotSheet(sheet)
                        void remap(sheet)
                      }}
                    />
                    <label>
                      <DrawCheckbox
                        aria-label={`Include ${sheet.name}`}
                        checked={sheet.include}
                        disabled={
                          !isShotSheet(sheet) && sheet.kind !== 'planning'
                        }
                        onChange={(e) => {
                          sheet.include = e.target.checked
                          refresh()
                        }}
                      />{' '}
                      Include{' '}
                      {sheet.kind === 'planning'
                        ? 'as schedule references'
                        : 'as master shots'}
                    </label>
                  </div>
                  {(isShotSheet(sheet) ||
                    sheet.kind === 'planning' ||
                    sheet.kind === 'template') && (
                    <>
                      <div className="pd-import-mapping-head">
                        <label>
                          Scene number
                          <input
                            aria-label={`Scene number for ${sheet.name}`}
                            value={sheet.sceneNumber}
                            onChange={(e) => {
                              sheet.sceneNumber = e.target.value
                              sheet.rows.forEach((r) => {
                                if (
                                  !Object.values(sheet.mapping).includes(
                                    'sceneNumber',
                                  )
                                )
                                  r.sceneNumber = e.target.value
                              })
                              refresh()
                            }}
                          />
                        </label>
                        <label>
                          Scene title
                          <input
                            value={sheet.title}
                            onChange={(e) => {
                              sheet.title = e.target.value
                              refresh()
                            }}
                          />
                        </label>
                        <label>
                          Header row
                          <input
                            aria-label={`Header row for ${sheet.name}`}
                            type="number"
                            min={1}
                            max={10000}
                            value={sheet.headerRow + 1}
                            onChange={async (e) => {
                              const { setHeader } = await import(
                                '../../lib/shotImport'
                              )
                              setHeader(
                                sheet,
                                Math.max(0, Number(e.target.value) - 1),
                              )
                              void remap(sheet)
                            }}
                          />
                        </label>
                      </div>
                      <div className="pd-import-mapping-head">
                        {(
                          [
                            'scriptSeconds',
                            'setupMinutes',
                            'estimatedMinutes',
                          ] as const
                        )
                          .filter((f) =>
                            Object.values(sheet.mapping).includes(f),
                          )
                          .map((field) => (
                            <div key={field}>
                              <label>{fields[field]} · source unit</label>
                              <Combobox
                                label={`${fields[field]} unit for ${sheet.name}`}
                                value={
                                  field === 'scriptSeconds'
                                    ? sheet.scriptUnit
                                    : sheet.units[field] || 'review'
                                }
                                labels={{ review: 'Review required' }}
                                options={['review', 'seconds', 'minutes']}
                                custom={false}
                                clearable={false}
                                onChange={(v) => {
                                  sheet.units[field] = v as
                                    | 'seconds'
                                    | 'minutes'
                                    | 'review'
                                  if (field === 'scriptSeconds')
                                    sheet.scriptUnit = sheet.units[field]
                                  void remap(sheet)
                                }}
                              />
                            </div>
                          ))}
                      </div>
                      <details
                        className="pd-import-columns"
                        open={
                          Object.values(sheet.mapping)
                            .filter(Boolean)
                            .some((v, i, a) => a.indexOf(v) !== i) || undefined
                        }
                      >
                        <summary>
                          Column mapping ·{' '}
                          {
                            sheet.columns.filter(
                              (c) => !sheet.mapping[c.letter],
                            ).length
                          }{' '}
                          unmapped
                        </summary>
                        <div>
                          {sheet.columns.map((c) => (
                            <div key={c.letter}>
                              <span>
                                {c.letter} · {c.label}
                              </span>
                              <Combobox
                                label={`Map ${c.label} in ${sheet.name}`}
                                value={sheet.mapping[c.letter]}
                                labels={{
                                  '': 'Ignore column',
                                  ...mappingFields,
                                }}
                                options={['', ...Object.keys(mappingFields)]}
                                custom={false}
                                clearable={false}
                                onChange={(v) => {
                                  sheet.mapping[c.letter] = v as ImportField
                                  void remap(sheet)
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </details>
                    </>
                  )}
                  {sheet.kind === 'planning' && (
                    <div className="pd-import-schedule">
                      <DatePicker
                        label={`Shooting date for ${sheet.name}`}
                        value={sheet.date}
                        onChange={(v) => {
                          sheet.date = v
                          refresh()
                        }}
                      />
                      <label>
                        <DrawCheckbox
                          checked={sheet.scheduleReviewed}
                          onChange={(e) => {
                            sheet.scheduleReviewed = e.target.checked
                            refresh()
                          }}
                        />{' '}
                        Match reviewed labels to master shots, preserving
                        creative order. Ambiguous matches stop the entire
                        import.
                      </label>
                      <p className="pd-import-guidance">
                        Without a real date this sheet stays excluded. It never
                        creates duplicate creative shots.
                      </p>
                    </div>
                  )}
                  {sheet.kind === 'template' && (
                    <Button
                      onClick={() => {
                        sheet.kind = Object.values(sheet.mapping).includes(
                          'sceneNumber',
                        )
                          ? 'combined'
                          : 'scene'
                        sheet.include = true
                        void remap(sheet)
                      }}
                    >
                      Explicitly use template rows as shots
                    </Button>
                  )}
                </div>
              </details>
            ))}
          </fieldset>
        </>
      )}
      {preview && stage === 3 && (
        <>
          <div className="pd-import-summary">
            <strong>
              {rows.length} detected · {included.length - flagged.length} ready
              · {flagged.length} need review · {excluded} excluded
            </strong>
          </div>
          <p className="pd-import-guidance">
            Numeric labels can already have lost trailing zeros in Excel. Review
            uncertain identifiers individually; Whiteout preserves the displayed
            source and cell metadata and never guesses missing digits.
          </p>
          {[...selected, ...scheduleSelected].map((sheet) => (
            <section key={sheet.name}>
              <h3>
                {sheet.name} ·{' '}
                {sheet.kind === 'planning'
                  ? 'schedule references'
                  : sheet.kind === 'combined'
                    ? 'multiple scenes'
                    : `Scene ${sheet.sceneNumber}`}
              </h3>
              <div className="pd-import-row-preview">
                <table>
                  <thead>
                    <tr>
                      <th>Use</th>
                      <th>Row / scene / shot</th>
                      <th>Final technical values</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.rows.map((row) => (
                      <tr
                        key={row.row}
                        className={!row.reviewed ? 'needs-review' : ''}
                      >
                        <td>
                          <DrawCheckbox
                            aria-label={`Include row ${row.row} in ${sheet.name}`}
                            checked={row.include}
                            onChange={(e) => {
                              row.include = e.target.checked
                              refresh()
                            }}
                          />
                          {!row.include && <small>Excluded by you</small>}
                        </td>
                        <td>
                          <small>
                            Row {row.row} · Scene{' '}
                            {row.sceneNumber || sheet.sceneNumber || '—'}
                          </small>
                          {sheet.kind === 'combined' && (
                            <input
                              aria-label={`Scene row ${row.row} in ${sheet.name}`}
                              value={row.sceneNumber}
                              onChange={(e) => {
                                row.sceneNumber = e.target.value
                                row.sceneOverride = e.target.value
                                row.reviewed = false
                                refresh()
                              }}
                            />
                          )}
                          <input
                            aria-label={`Shot identifier row ${row.row} in ${sheet.name}`}
                            value={row.values.number || ''}
                            onChange={(e) => {
                              row.values.number = e.target.value
                              row.overrides = {
                                ...row.overrides,
                                number: e.target.value,
                              }
                              row.reviewed = false
                              refresh()
                            }}
                          />
                        </td>
                        <td>
                          <strong>{row.values.coverage || '—'}</strong>
                          <details>
                            <summary>Camera / technical / source</summary>
                            {Object.entries(row.values)
                              .filter(([k, v]) => k !== 'source' && v)
                              .map(([k, v]) => (
                                <label className="pd-import-value" key={k}>
                                  <span>
                                    {fields[k as keyof typeof fields]}
                                  </span>
                                  <input
                                    aria-label={`${fields[k as keyof typeof fields]} row ${row.row} in ${sheet.name}`}
                                    value={v}
                                    onChange={(e) => {
                                      row.values[k as keyof typeof fields] =
                                        e.target.value
                                      row.overrides = {
                                        ...row.overrides,
                                        [k]: e.target.value,
                                      }
                                      row.reviewed = false
                                      refresh()
                                    }}
                                  />
                                </label>
                              ))}
                            <pre>{row.values.source}</pre>
                          </details>
                        </td>
                        <td>
                          {row.issues.length > 0 && (
                            <span>{row.issues.join(' ')}</span>
                          )}
                          <label>
                            <DrawCheckbox
                              checked={row.reviewed}
                              onChange={(e) => {
                                row.reviewed = e.target.checked
                                refresh()
                              }}
                            />
                            {row.reviewed
                              ? 'Ready'
                              : 'Reviewed final identifier and mapping'}
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
      {preview && stage === 4 && (
        <div className="pd-import-final">
          <h3>
            Create {sceneCount} scenes and {included.length} shots
          </h3>
          <p>
            {excluded} rows excluded by you. Existing scenes and shots are
            retained.
          </p>
          <p>
            {scheduleSelected.length} reviewed shooting-order sheets will create
            separate day assignments.
          </p>
          <p className="pd-import-guidance">
            A retry of this confirmed batch cannot create duplicates. After
            confirmation, the payload is locked until its result is known.
          </p>
        </div>
      )}
    </Overlay>
  )
}
