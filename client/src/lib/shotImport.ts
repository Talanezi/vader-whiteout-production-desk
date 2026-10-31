import * as XLSX from 'xlsx'
import { type ShotField, fields } from './shotDocument'

export type ImportRow = {
  row: number
  values: Partial<Record<ShotField | 'source', string>>
  issues: string[]
  include: boolean
  reviewed: boolean
}
export type ImportSheet = {
  name: string
  kind: 'scene' | 'planning' | 'reference' | 'template' | 'unknown'
  include: boolean
  sceneNumber: string
  title: string
  headerRow: number
  columns: { letter: string; label: string }[]
  mapping: Record<string, ShotField | ''>
  rows: ImportRow[]
  scriptUnit: 'seconds' | 'minutes' | 'review'
  workbook: XLSX.WorkSheet
}
export type ImportPreview = {
  sheets: ImportSheet[]
  options: Record<string, string[]>
  warnings: string[]
}
const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
function matchField(header: string): ShotField | '' {
  const s = normalized(header)
  const aliases: Record<string, ShotField> = {
    shot: 'number',
    shotnumber: 'number',
    shotno: 'number',
    camera: 'camera',
    frame: 'framing',
    framing: 'framing',
    subject: 'subject',
    angle: 'angle',
    cameraangle: 'angle',
    lens: 'lens',
    equipment: 'equipment',
    support: 'equipment',
    movement: 'movement',
    coverage: 'coverage',
    action: 'coverage',
    description: 'coverage',
    notes: 'notes',
    cameranotes: 'notes',
    focusnotes: 'focusNotes',
    lightingnotes: 'lightingNotes',
    predicoftakes: 'plannedTakes',
    plannedtakes: 'plannedTakes',
    takecirclebest: 'actualTakes',
    actualtakes: 'actualTakes',
  }
  if (aliases[s]) return aliases[s]
  if (s.startsWith('scripttime') || s.startsWith('scriptduration'))
    return 'scriptSeconds'
  if (s.startsWith('setuptime')) return 'setupMinutes'
  if (s.startsWith('shoottime') || s.startsWith('estimatedtime'))
    return 'estimatedMinutes'
  return ''
}
function text(cell?: XLSX.CellObject) {
  if (!cell || cell.v === undefined || cell.v === null) return ''
  return cell.w ?? String(cell.v)
}
export function inspectWorkbook(data: ArrayBuffer | Uint8Array): ImportPreview {
  if (data.byteLength > 8 * 1024 * 1024)
    throw new Error('The workbook must be 8 MB or smaller.')
  const book = XLSX.read(data, {
    type: 'array',
    cellNF: true,
    cellText: true,
    cellFormula: false,
    sheetRows: 10000,
  })
  if (book.SheetNames.length > 100)
    throw new Error('The workbook has too many worksheets (maximum 100).')
  const sheets: ImportSheet[] = [],
    options: Record<string, string[]> = {}
  for (const name of book.SheetNames) {
    const ws = book.Sheets[name],
      range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    let headerRow = -1
    for (let r = range.s.r; r <= Math.min(range.e.r, 30); r++) {
      for (let c = range.s.c; c <= Math.min(range.e.c, 100); c++) {
        const v = normalized(text(ws[XLSX.utils.encode_cell({ r, c })]))
        if (v === 'shot' || v === 'shotnumber' || v === 'shotno') {
          headerRow = r
          break
        }
      }
      if (headerRow >= 0) break
    }
    const kind: ImportSheet['kind'] = /template/i.test(name)
      ? 'template'
      : /dropdown|options|reference/i.test(name)
        ? 'reference'
        : /order.*shoot|shoot.*order/i.test(name)
          ? 'planning'
          : headerRow >= 0
            ? 'scene'
            : 'unknown'
    if (kind === 'reference') {
      for (let c = range.s.c; c <= Math.min(range.e.c, 100); c++) {
        const key = text(ws[XLSX.utils.encode_cell({ r: range.s.r, c })])
        if (!key) continue
        options[key] = Array.from(
          { length: Math.min(range.e.r, 500) },
          (_, i) => text(ws[XLSX.utils.encode_cell({ r: i + 1, c })]),
        ).filter(Boolean)
      }
    }
    const columns: ImportSheet['columns'] = [],
      mapping: ImportSheet['mapping'] = {}
    if (headerRow >= 0)
      for (let c = range.s.c; c <= Math.min(range.e.c, 100); c++) {
        const letter = XLSX.utils.encode_col(c),
          label = text(ws[`${letter}${headerRow + 1}`])
        if (label) {
          columns.push({ letter, label })
          mapping[letter] = matchField(label)
        }
      }
    const scene = name.match(/scene\s*(.+)$/i)?.[1]?.trim() || ''
    const title =
      Array.from({ length: Math.max(headerRow, 0) }, (_, r) =>
        Array.from({ length: Math.min(range.e.c + 1, 24) }, (_, c) =>
          text(ws[XLSX.utils.encode_cell({ r, c })]),
        ),
      )
        .flat()
        .find((v) => /^location:/i.test(v))
        ?.replace(/^location:\s*/i, '') || ''
    const scriptHeader =
      columns.find((c) => mapping[c.letter] === 'scriptSeconds')?.label || ''
    const sheet: ImportSheet = {
      name,
      kind,
      include: kind === 'scene',
      sceneNumber: scene,
      title,
      headerRow,
      columns,
      mapping,
      rows: [],
      scriptUnit: /seconds/i.test(scriptHeader)
        ? 'seconds'
        : /minutes/i.test(scriptHeader)
          ? 'minutes'
          : 'review',
      workbook: ws,
    }
    if (kind === 'scene') sheet.rows = mapRows(sheet)
    sheets.push(sheet)
  }
  if (!sheets.some((s) => s.kind === 'scene'))
    throw new Error(
      'No shot-list headers found. Include a “SHOT #” column in each scene sheet.',
    )
  return {
    sheets,
    options,
    warnings: [
      'Shooting-order worksheets are retained as references; day-specific timing and order are not imported into creative planning order.',
    ],
  }
}
export function mapRows(sheet: ImportSheet): ImportRow[] {
  const ws = sheet.workbook,
    end = Math.min(XLSX.utils.decode_range(ws['!ref'] || 'A1').e.r, 9999)
  const result: ImportRow[] = [],
    labels = new Set<string>()
  const duplicateMapping = Object.values(sheet.mapping)
    .filter(Boolean)
    .some((v, i, a) => a.indexOf(v) !== i)
  for (let r = sheet.headerRow + 1; r <= end; r++) {
    const values: ImportRow['values'] = {},
      issues: string[] = []
    for (const [col, field] of Object.entries(sheet.mapping)) {
      if (!field) continue
      const cell: XLSX.CellObject | undefined = ws[`${col}${r + 1}`]
      let value = text(cell)
      // Durations remain strings and can include explicit production notation.
      // Only convert minutes to seconds when the user confirms the source unit.
      if (
        field === 'scriptSeconds' &&
        sheet.scriptUnit === 'minutes' &&
        value &&
        Number.isFinite(Number(cell?.v))
      )
        value = String(Number((Number(cell!.v) * 60).toFixed(6)))
      values[field] = value
      if (field === 'number' && cell?.t === 'n') {
        const fmt = String(cell.z || 'General')
        const reliable = /0\.0{1,4}/.test(fmt) && value.includes('.')
        if (!reliable && Number(cell.v) % 1 !== 0)
          issues.push(
            `Numeric identifier “${value}”: trailing-zero meaning may already be lost. Review the label.`,
          )
        if (
          !reliable &&
          Math.abs(Number(cell.v) - Number(Number(cell.v).toFixed(8))) > 1e-10
        )
          issues.push('Floating-point identifier needs manual review.')
      }
    }
    // Ignore styled/formula-only trailing rows, totals, and template filler.
    if (
      !['number', 'coverage', 'subject', 'notes'].some((k) =>
        values[k as ShotField]?.trim(),
      )
    )
      continue
    if (!values.number?.trim())
      issues.push(
        'Missing shot number. Enter a text identifier or exclude this row.',
      )
    else if (labels.has(values.number))
      issues.push(
        'Duplicate label within this scene. UUIDs remain distinct; review before importing.',
      )
    if (values.number) labels.add(values.number)
    if (sheet.scriptUnit === 'review' && values.scriptSeconds)
      issues.push(
        'Script-time unit is unspecified. Choose seconds or minutes for this sheet.',
      )
    if (duplicateMapping)
      issues.push(
        'Two columns map to the same field. Resolve the mapping first.',
      )
    values.source = JSON.stringify({
      sheet: sheet.name,
      row: r + 1,
      original: Object.fromEntries(
        sheet.columns.map((c) => [c.label, text(ws[`${c.letter}${r + 1}`])]),
      ),
    })
    result.push({
      row: r + 1,
      values,
      issues,
      include: true,
      reviewed: issues.length === 0,
    })
  }
  return result
}
export function importPayload(preview: ImportPreview, batchId: string) {
  const selected = preview.sheets.filter((s) => s.include && s.kind === 'scene')
  if (!selected.length) throw new Error('Select at least one scene.')
  return {
    batchId,
    scenes: selected.map((sheet) => {
      if (!sheet.sceneNumber.trim())
        throw new Error(`Enter a scene number for ${sheet.name}.`)
      const rows = sheet.rows.filter((r) => r.include)
      if (!rows.length) throw new Error(`${sheet.name} has no selected shots.`)
      if (
        sheet.scriptUnit === 'review' &&
        rows.some((r) => r.values.scriptSeconds)
      )
        throw new Error(`Confirm script-time units for ${sheet.name}.`)
      if (rows.some((r) => !r.values.number?.trim() || !r.reviewed))
        throw new Error(`Review the flagged identifiers in ${sheet.name}.`)
      if (
        Object.values(sheet.mapping)
          .filter(Boolean)
          .some((v, i, a) => a.indexOf(v) !== i)
      )
        throw new Error(`Resolve duplicate column mappings in ${sheet.name}.`)
      return {
        number: sheet.sceneNumber,
        title: sheet.title,
        shots: rows.map((r) =>
          Object.fromEntries(
            Object.entries(r.values).filter(
              ([key]) => key === 'source' || key in fields,
            ),
          ),
        ),
      }
    }),
  }
}
