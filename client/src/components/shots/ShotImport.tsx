import { useEffect, useRef, useState } from 'react'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import { ErrorNotice, useToast } from '../whiteout/Feedback'
import Combobox from '../whiteout/Combobox'
import Icon from '../whiteout/Icon'
import { fields } from '../../lib/shotDocument'
import { shotRequest } from '../../lib/shotApi'
import type { ImportPreview, ImportSheet } from '../../lib/shotImport'

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
    [fileName, setFileName] = useState('')
  useEffect(() => {
    onBusyChange(busy)
    return () => onBusyChange(false)
  }, [busy, onBusyChange])
  const confirmed = useRef<unknown>(undefined)
  const [batch] = useState(() => crypto.randomUUID()),
    [, render] = useState(0)
  const notify = useToast(),
    refresh = () => render((x) => x + 1)
  async function load(file?: File) {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      if (!file.name.toLowerCase().endsWith('.xlsx'))
        throw new Error('Choose an .xlsx workbook.')
      const parser = await import('../../lib/shotImport')
      const next = parser.inspectWorkbook(await file.arrayBuffer())
      setPreview(next)
      setFileName(file.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this workbook.')
    } finally {
      setBusy(false)
    }
  }
  async function remap(sheet: ImportSheet) {
    const { mapRows } = await import('../../lib/shotImport')
    sheet.rows = mapRows(sheet)
    refresh()
  }
  async function confirm() {
    if (!preview) return
    setError('')
    setBusy(true)
    try {
      const { importPayload } = await import('../../lib/shotImport')
      const payload = confirmed.current || importPayload(preview, batch)
      confirmed.current = payload
      await notify.promise(
        shotRequest<{ scenes: number; shots: number; rejected: number }>(
          `/${id}/import`,
          payload,
        ),
        {
          pending: 'Importing reviewed shots…',
          success: (result) =>
            `${result.shots} ${result.shots === 1 ? 'shot' : 'shots'} imported into ${result.scenes} ${result.scenes === 1 ? 'scene' : 'scenes'}. ${result.rejected} rejected.`,
          error:
            'Import was not confirmed. Your review is retained; retry safely.',
        },
      )
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }
  const selected =
      preview?.sheets.filter((s) => s.include && s.kind === 'scene') || [],
    count = selected.flatMap((s) => s.rows.filter((r) => r.include)).length
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
              ? `${selected.length} scenes · ${count} shots selected`
              : '.xlsx · up to 8 MB'}
          </span>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="import"
            disabled={!preview || !count}
            state={busy ? 'pending' : 'idle'}
            pendingLabel="Importing…"
            onClick={confirm}
          >
            Import selected
          </Button>
        </>
      }
    >
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {!preview ? (
        <label
          className="pd-shot-upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            void load(e.dataTransfer.files[0])
          }}
        >
          <Icon name="import" />
          <strong>Choose a workbook</strong>
          <span>Drop an .xlsx file or browse</span>
          <input
            data-initial-focus
            type="file"
            accept=".xlsx"
            aria-label="Upload shot-list workbook"
            disabled={busy}
            onChange={(e) => void load(e.target.files?.[0])}
          />
        </label>
      ) : (
        <>
          <div className="pd-import-summary">
            <strong>{fileName}</strong>
            <span>{preview.sheets.length} worksheets inspected</span>
          </div>
          {preview.warnings.map((w) => (
            <p className="pd-import-guidance" key={w}>
              {w}
            </p>
          ))}
          <fieldset
            className="pd-import-sheets"
            disabled={busy || Boolean(confirmed.current)}
          >
            {preview.sheets.map((sheet) => (
              <details
                key={sheet.name}
                open={(sheet.kind === 'scene' && sheet.include) || undefined}
              >
                <summary>
                  <span>
                    {sheet.kind === 'scene' ? (
                      <input
                        type="checkbox"
                        aria-label={`Include ${sheet.name}`}
                        checked={sheet.include}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          sheet.include = e.target.checked
                          refresh()
                        }}
                      />
                    ) : (
                      <Icon name="file" />
                    )}
                    {sheet.name}
                  </span>
                  <small>
                    {sheet.kind === 'scene'
                      ? `${sheet.rows.length} rows`
                      : `${sheet.kind} · excluded`}
                  </small>
                </summary>
                {sheet.kind === 'scene' && (
                  <div className="pd-import-sheet-body">
                    <div className="pd-import-mapping-head">
                      <label>
                        Scene number
                        <input
                          aria-label={`Scene number for ${sheet.name}`}
                          value={sheet.sceneNumber}
                          onChange={(e) => {
                            sheet.sceneNumber = e.target.value
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
                      <div>
                        <label>Script-time source unit</label>
                        <Combobox
                          custom={false}
                          label={`Script-time unit for ${sheet.name}`}
                          value={
                            sheet.scriptUnit === 'review'
                              ? 'Review required'
                              : sheet.scriptUnit
                          }
                          options={['seconds', 'minutes']}
                          onChange={(v) => {
                            sheet.scriptUnit = v as 'seconds' | 'minutes'
                            void remap(sheet)
                          }}
                        />
                      </div>
                    </div>
                    <details className="pd-import-columns">
                      <summary>
                        Column mapping · {sheet.columns.length} columns
                      </summary>
                      <div>
                        {sheet.columns.map((c) => (
                          <div key={c.letter}>
                            <span>
                              {c.letter} · {c.label}
                            </span>
                            <Combobox
                              label={`Map ${c.label} in ${sheet.name}`}
                              custom={false}
                              value={
                                sheet.mapping[c.letter]
                                  ? fields[
                                      sheet.mapping[
                                        c.letter
                                      ] as keyof typeof fields
                                    ]
                                  : 'Ignore column'
                              }
                              options={[
                                'Ignore column',
                                ...Object.values(fields),
                              ]}
                              onChange={(v) => {
                                sheet.mapping[c.letter] = (Object.keys(
                                  fields,
                                ).find(
                                  (k) => fields[k as keyof typeof fields] === v,
                                ) || '') as keyof typeof fields
                                void remap(sheet)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </details>
                    <div className="pd-import-row-preview">
                      <table>
                        <thead>
                          <tr>
                            <th>Use</th>
                            <th>Row / shot</th>
                            <th>Action / coverage</th>
                            <th>Review</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sheet.rows.map((row) => (
                            <tr
                              key={row.row}
                              className={
                                row.issues.length && !row.reviewed
                                  ? 'needs-review'
                                  : ''
                              }
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  aria-label={`Include row ${row.row} in ${sheet.name}`}
                                  checked={row.include}
                                  onChange={(e) => {
                                    row.include = e.target.checked
                                    refresh()
                                  }}
                                />
                              </td>
                              <td>
                                <small>Row {row.row}</small>
                                <input
                                  aria-label={`Shot identifier row ${row.row} in ${sheet.name}`}
                                  value={row.values.number || ''}
                                  onChange={(e) => {
                                    row.values.number = e.target.value
                                    row.reviewed = Boolean(
                                      e.target.value.trim(),
                                    )
                                    refresh()
                                  }}
                                />
                              </td>
                              <td>{row.values.coverage || '—'}</td>
                              <td>
                                {row.issues.length ? (
                                  <>
                                    <span>{row.issues.join(' ')}</span>
                                    <label>
                                      <input
                                        type="checkbox"
                                        checked={row.reviewed}
                                        onChange={(e) => {
                                          row.reviewed = e.target.checked
                                          refresh()
                                        }}
                                      />
                                      Reviewed displayed identifier and mapping
                                    </label>
                                  </>
                                ) : (
                                  <span>Ready</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </details>
            ))}
          </fieldset>
          <p className="pd-import-guidance">
            Import creates new scenes and shots. Existing records remain. A
            retry of this confirmed batch cannot create duplicates.
          </p>
        </>
      )}
    </Overlay>
  )
}
