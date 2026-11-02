import { useMemo, useRef, useState } from 'react'
import type * as Y from 'yjs'
import { Overlay } from '../whiteout/Overlay'
import { Button, IconButton } from '../whiteout/Button'
import Menu from '../whiteout/Menu'
import { ErrorNotice } from '../whiteout/Feedback'
import {
  readWorkbook,
  suggest,
  mappedRows,
  column,
  type SourceSheet,
  type Mapping,
} from '../../lib/flow/import'
import { flowFetch } from '../../lib/flow/api'
import { put, addEvent, departments, localParts } from '../../lib/flow/model'
import { StudioGlyph } from '../storyboards/StudioControls'
export default function FlowImport({
  id,
  doc,
  date,
  zone,
  onClose,
}: {
  id: string
  doc: Y.Doc
  date: string
  zone: string
  onClose: () => void
}) {
  const input = useRef<HTMLInputElement>(null),
    [file, setFile] = useState<File>(),
    [sheets, setSheets] = useState<SourceSheet[]>([]),
    [sheetIndex, setSheetIndex] = useState(0),
    [mapping, setMapping] = useState<Mapping>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(0),
    [reviewed, setReviewed] = useState(false),
    [matches, setMatches] = useState<Record<number, string>>({}),
    [sourceShots, setSourceShots] = useState<any[]>([])
  const sheet = sheets[sheetIndex]
  const rows = useMemo(
    () => (sheet && mapping ? mappedRows(sheet, mapping, date, zone) : []),
    [sheet, mapping, date, zone],
  )
  const cols = sheet
    ? Array.from({ length: sheet.rows[0].length }, (_, i) => ({
        value: column(i),
        label:
          column(i) +
          ' · ' +
          (sheet.rows[(mapping?.header || 1) - 1]?.[i]?.formatted ||
            'Unlabeled'),
      }))
    : []
  async function choose(f: File) {
    setBusy(true)
    setError('')
    try {
      if (!/\.xlsx$/i.test(f.name)) throw Error('Choose an .xlsx workbook.')
      setProgress(0.2)
      const parsed = readWorkbook(await f.arrayBuffer())
      setProgress(1)
      setFile(f)
      setSheets(parsed)
      setSheetIndex(0)
      setMapping(suggest(parsed[0]))
      setReviewed(false)
      const list = doc.getMap('meta').get('listId')
      if (list) {
        const { shotRequest } = await import('../../lib/shotApi')
        const data = await shotRequest<any>(`/${list}/export`)
        setSourceShots(
          Object.entries(data.shots)
            .filter(([, s]: any) => !s.deleted)
            .map(([id, s]: any) => ({ id, ...s })),
        )
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function confirm() {
    if (!file || !mapping || !sheet) return
    setBusy(true)
    setError('')
    try {
      const hash = [
          ...new Uint8Array(
            await crypto.subtle.digest('SHA-256', await file.arrayBuffer()),
          ),
        ]
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
        batch = hash + ':' + sheet.name
      if (doc.getMap('imports').has(batch)) {
        onClose()
        return
      }
      const form = new FormData()
      form.append('file', file)
      await flowFetch(`/${id}/sources`, { method: 'POST', body: form })
      const existing = departments(doc),
        ids: Record<string, string> = {}
      doc.transact(() => {
        Object.entries(mapping.departments).forEach(([col, name], i) => {
          const found = existing.find(
              (d) => d.name.trim().toLowerCase() === name.trim().toLowerCase(),
            ),
            key = found?.id || crypto.randomUUID()
          ids[col] = key
          if (!found)
            put(doc, 'departments', key, {
              name,
              personnel:
                sheet.rows[mapping.personnel - 1]?.[
                  cols.findIndex((c) => c.value === col)
                ]?.formatted || '',
              order: (existing.length + i + 1) * 1024,
            })
        })
        rows.forEach((r) => {
          const linked = matches[r.row],
            shot = sourceShots.find((s) => s.id === linked)
          const event = addEvent(doc, {
            type: linked ? 'shot' : (r.type as 'custom'),
            description: linked ? '' : r.description,
            start: r.start,
            actualStart: r.actualStart,
            duration: r.duration,
            notes:
              (r.provenance as any).sourceEstimate && !r.duration
                ? 'Source estimate: ' + (r.provenance as any).sourceEstimate
                : '',
            fixed: r.type === 'milestone',
            provenance: r.provenance,
            ...(linked
              ? {
                  shotId: linked,
                  sourceListId: String(doc.getMap('meta').get('listId')),
                  reference: String(shot?.number || r.description),
                }
              : {}),
          })
          Object.entries(r.instructions).forEach(([col, text]) => {
            if (text)
              put(doc, 'instructions', event + ':' + ids[col], {
                eventId: event,
                departmentId: ids[col],
                text,
              })
          })
        })
        put(doc, 'imports', batch, {
          sha256: hash,
          sheet: sheet.name,
          mapping,
          metadata: {
            range: sheet.range,
            merges: sheet.merges,
            columns: sheet.columns,
            rows: sheet.rowMetadata,
          },
          filename: file.name,
          createdAt: new Date().toISOString(),
          count: rows.length,
        })
      })
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const mappingField = (
    key: 'planned' | 'secondary' | 'action' | 'estimate',
    label: string,
  ) => (
    <label>
      {label}
      <Menu
        label={
          cols.find((c) => c.value === mapping?.[key])?.label || 'Choose column'
        }
        value={mapping?.[key] || ''}
        onChange={(v) => {
          setMapping((m) => (m ? { ...m, [key]: v } : m))
          setReviewed(false)
        }}
        items={[
          {
            value: '',
            label:
              key === 'planned' ? 'Do not assign planned times' : 'Not mapped',
          },
          ...cols,
        ]}
      />
    </label>
  )
  return (
    <Overlay
      title="Import Flow workbook"
      onClose={onClose}
      className="flow-import-studio"
      busy={busy}
      footer={
        <Button
          variant="primary"
          icon="check"
          state={busy ? 'pending' : 'idle'}
          disabled={
            !file ||
            !mapping?.planned ||
            !reviewed ||
            rows.some((r) => r.warning) ||
            !rows.length ||
            !date
          }
          onClick={() => void confirm()}
        >
          Import {rows.length || ''} events
        </Button>
      }
    >
      <input
        type="file"
        accept=".xlsx"
        hidden
        ref={input}
        onChange={(e) => e.target.files?.[0] && void choose(e.target.files[0])}
      />
      {!file ? (
        <div
          className="flow-upload"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (e.dataTransfer.files[0]) void choose(e.dataTransfer.files[0])
          }}
        >
          <StudioGlyph name="layers" />
          <h3>Bring your production schedule</h3>
          <Button icon="import" onClick={() => input.current?.click()}>
            Choose Excel workbook
          </Button>
          <small>XLSX · private original retained · up to 12 MB</small>
        </div>
      ) : (
        <>
          <div className="flow-import-file">
            <StudioGlyph name="layers" />
            <strong>{file.name}</strong>
            <progress value={progress} max={1} />
            <IconButton
              name="close"
              label="Remove workbook"
              onClick={() => {
                setFile(undefined)
                setSheets([])
                setMapping(undefined)
              }}
            />
          </div>
          <div className="flow-import-layout">
            <aside>
              <Menu
                label={sheet?.name || 'Worksheet'}
                value={String(sheetIndex)}
                onChange={(v) => {
                  setSheetIndex(Number(v))
                  setMapping(suggest(sheets[Number(v)]))
                  setReviewed(false)
                }}
                items={sheets.map((s, i) => ({
                  value: String(i),
                  label: s.name,
                }))}
              />
              <p className="flow-warning">
                The source time columns are unlabeled. Choose their meanings and
                clock interpretation explicitly.
              </p>
              {mappingField('planned', 'Planned time')}
              {mappingField('secondary', 'Secondary time')}
              <label>
                Secondary meaning
                <Menu
                  label={
                    mapping?.secondaryRole === 'actual'
                      ? 'Actual start'
                      : 'Preserve original only'
                  }
                  value={mapping?.secondaryRole || 'preserve'}
                  onChange={(v) =>
                    setMapping((m) =>
                      m ? { ...m, secondaryRole: v as 'actual' } : m,
                    )
                  }
                  items={[
                    { value: 'preserve', label: 'Preserve original only' },
                    { value: 'actual', label: 'Actual start' },
                  ]}
                />
              </label>
              {(['plannedClock', 'secondaryClock'] as const).map((k, i) => (
                <label key={k}>
                  {i ? 'Secondary' : 'Planned'} clock
                  <Menu
                    label={
                      {
                        '24': '24-hour source',
                        '12-sequence': '12-hour sequence · advance at rollover',
                        '12-afternoon': '1–6 interpreted as afternoon',
                      }[mapping?.[k] || '24'] || ''
                    }
                    value={mapping?.[k] || '24'}
                    onChange={(v) =>
                      setMapping((m) => (m ? { ...m, [k]: v } : m))
                    }
                    items={[
                      { value: '24', label: '24-hour source' },
                      {
                        value: '12-sequence',
                        label: '12-hour sequence · advance at rollover',
                      },
                      {
                        value: '12-afternoon',
                        label: '1–6 interpreted as afternoon',
                      },
                    ]}
                  />
                </label>
              ))}
              {mappingField('action', 'Current Action')}
              {mappingField('estimate', 'Estimate (minutes)')}
              {(['header', 'personnel', 'first'] as const).map((k) => (
                <label key={k}>
                  {k === 'first'
                    ? 'First event row'
                    : k === 'header'
                      ? 'Header row'
                      : 'Personnel row'}
                  <input
                    type="number"
                    min={1}
                    max={sheet.rows.length}
                    value={mapping?.[k] || 1}
                    onChange={(e) =>
                      setMapping((m) =>
                        m
                          ? { ...m, [k]: Math.max(1, Number(e.target.value)) }
                          : m,
                      )
                    }
                  />
                </label>
              ))}
              <fieldset>
                <legend>Department columns</legend>
                {Object.entries(mapping?.departments || {}).map(([c, name]) => (
                  <label key={c}>
                    {c}
                    <input
                      aria-label={`Department in column ${c}`}
                      value={name}
                      maxLength={100}
                      onChange={(e) =>
                        setMapping((m) =>
                          m
                            ? {
                                ...m,
                                departments: {
                                  ...m.departments,
                                  [c]: e.target.value,
                                },
                              }
                            : m,
                        )
                      }
                    />
                  </label>
                ))}
              </fieldset>
            </aside>
            <main>
              <h3>Original source</h3>
              <div className="flow-source-preview">
                <table>
                  <tbody>
                    {sheet.rows.map((r, i) =>
                      r.some((c) => c.formatted) ? (
                        <tr key={i}>
                          <th>{i + 1}</th>
                          {r.map((c) => (
                            <td
                              key={c.address}
                              title={c.address}
                              style={{
                                background: (c.style as any)?.fgColor?.rgb
                                  ? '#' + (c.style as any).fgColor.rgb
                                  : undefined,
                              }}
                            >
                              {c.formatted}
                            </td>
                          ))}
                        </tr>
                      ) : null,
                    )}
                  </tbody>
                </table>
              </div>
              <h3>Mapped Flow · {rows.length} events</h3>
              <div className="flow-mapped-preview">
                <table>
                  <thead>
                    <tr>
                      <th>Source row</th>
                      <th>Planned</th>
                      <th>Action / type</th>
                      <th>Departments</th>
                      <th>Match Shot · optional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.row}>
                        <td>{r.row}</td>
                        <td>
                          {r.start ? localParts(r.start, zone) : 'Unscheduled'}
                          {r.actualStart && (
                            <small>
                              Actual {localParts(r.actualStart, zone)}
                            </small>
                          )}
                          {r.warning && (
                            <p className="flow-warning">{r.warning}</p>
                          )}
                        </td>
                        <td>
                          <input
                            aria-label={`Event type for source row ${r.row}`}
                            value={r.type}
                            readOnly
                          />
                          {r.description || 'Department activity'}
                        </td>
                        <td>
                          {Object.entries(r.instructions)
                            .filter(([, t]) => t)
                            .map(([c, t]) => (
                              <p key={c}>
                                <strong>{mapping?.departments[c]}</strong> {t}
                              </p>
                            ))}
                        </td>
                        <td>
                          {sourceShots.length > 0 && (
                            <Menu
                              label={
                                sourceShots.find((s) => s.id === matches[r.row])
                                  ?.number || 'Keep manual'
                              }
                              value={matches[r.row] || ''}
                              onChange={(v) =>
                                setMatches((m) => ({ ...m, [r.row]: v }))
                              }
                              items={[
                                { value: '', label: 'Keep manual' },
                                ...sourceShots.map((s) => ({
                                  value: s.id,
                                  label: `${s.number} · ${String(s.subject || '')} · ${s.id.slice(0, 6)}`,
                                })),
                              ]}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="flow-check">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                />
                I reviewed the time interpretation, event categories and
                department mapping.
              </label>
            </main>
          </div>
        </>
      )}
      {!date && file && (
        <ErrorNotice>
          Set the Flow production date before importing timed events.
        </ErrorNotice>
      )}
      {error && <ErrorNotice>{error}</ErrorNotice>}
    </Overlay>
  )
}
