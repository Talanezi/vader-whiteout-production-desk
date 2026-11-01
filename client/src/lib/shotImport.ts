import * as XLSX from 'xlsx'
import { workbookInput } from './shotImportLimits'
import { type ShotField, fields } from './shotDocument'
import { validateValue } from './shotClipboard'
export type ImportField = ShotField | 'sceneNumber'
export type ImportRow = {
  row: number
  sceneNumber: string
  values: Partial<Record<ShotField | 'source', string>>
  issues: string[]
  include: boolean
  reviewed: boolean
  overrides?: Partial<Record<ShotField, string>>
  sceneOverride?: string
}
export type ImportSheet = {
  name: string
  kind: 'scene' | 'combined' | 'planning' | 'reference' | 'template' | 'unknown'
  include: boolean
  sceneNumber: string
  title: string
  headerRow: number
  columns: { letter: string; label: string }[]
  mapping: Record<string, ImportField | ''>
  rows: ImportRow[]
  scriptUnit: 'seconds' | 'minutes' | 'review'
  units: Record<string, 'seconds' | 'minutes' | 'review'>
  workbook: XLSX.WorkSheet
  date: string
  scheduleReviewed: boolean
  blocks?: ImportSheet[]
}
export type ImportPreview = {
  sheets: ImportSheet[]
  options: Record<string, string[]>
  warnings: string[]
}
export const isShotSheet = (s: ImportSheet) =>
  s.kind === 'scene' || s.kind === 'combined'
const normalized = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
export function matchField(header: string): ImportField | '' {
  const s = normalized(header),
    aliases: Record<string, ImportField> = {
      scene: 'sceneNumber',
      scenenumber: 'sceneNumber',
      sceneno: 'sceneNumber',
      shot: 'number',
      shotnumber: 'number',
      shotno: 'number',
      shotid: 'number',
      cam: 'camera',
      camera: 'camera',
      frame: 'framing',
      framing: 'framing',
      shotsize: 'framing',
      subject: 'subject',
      angle: 'angle',
      cameraangle: 'angle',
      lens: 'lens',
      equipment: 'equipment',
      support: 'equipment',
      rig: 'equipment',
      movement: 'movement',
      cameramovement: 'movement',
      coverage: 'coverage',
      action: 'coverage',
      description: 'coverage',
      notes: 'notes',
      cameranotes: 'notes',
      focusnotes: 'focusNotes',
      lightingnotes: 'lightingNotes',
      predicoftakes: 'plannedTakes',
      predictedtakes: 'plannedTakes',
      plannedtakes: 'plannedTakes',
      takecirclebest: 'actualTakes',
      actualtakes: 'actualTakes',
      takenumber: 'actualTakes',
      besttake: 'actualTakes',
    }
  if (aliases[s]) return aliases[s]
  if (/^(scripttime|scriptduration|duration)/.test(s)) return 'scriptSeconds'
  if (/^setuptime/.test(s)) return 'setupMinutes'
  if (/^(shoottime|estimatedtime|estimatedshooting)/.test(s))
    return 'estimatedMinutes'
  return ''
}
function text(cell?: XLSX.CellObject) {
  return !cell || cell.v === undefined || cell.v === null
    ? ''
    : (cell.w ?? String(cell.v))
}
export function setHeader(sheet: ImportSheet, row: number) {
  const range = XLSX.utils.decode_range(sheet.workbook['!ref'] || 'A1')
  sheet.headerRow = row
  sheet.columns = []
  sheet.mapping = {}
  for (let c = range.s.c; c <= range.e.c; c++) {
    const letter = XLSX.utils.encode_col(c),
      label = text(sheet.workbook[`${letter}${row + 1}`])
    if (label) {
      sheet.columns.push({ letter, label })
      sheet.mapping[letter] = matchField(label)
    }
  }
}
export function inspectWorkbook(
  data: ArrayBuffer | Uint8Array,
  filename = '',
): ImportPreview {
  if (data.byteLength > 8 * 1024 * 1024)
    throw Error('The file must be 8 MB or smaller.')
  if (!data.byteLength) throw Error('The file is empty.')
  const input = workbookInput(data)
  const book = XLSX.read(input.data, {
    type: input.type,
    raw: true,
    cellNF: true,
    cellText: true,
    cellFormula: true,
    sheetRows: 10001,
  })
  if (book.SheetNames.length > 100) throw Error('Maximum 100 worksheets.')
  const sheets: ImportSheet[] = [],
    options: Record<string, string[]> = {}
  let total = 0
  for (const name of book.SheetNames) {
    const ws = book.Sheets[name],
      range = XLSX.utils.decode_range(ws['!fullref'] || ws['!ref'] || 'A1')
    if (range.e.r > 9999 || range.e.c > 99)
      throw Error(
        `${name}: maximum 10,000 rows and 100 columns. No rows were imported.`,
      )
    let headerRow = -1,
      best = 0
    for (let r = range.s.r; r <= Math.min(range.e.r, 30); r++) {
      const cells = Array.from({ length: range.e.c + 1 }, (_, c) =>
          text(ws[XLSX.utils.encode_cell({ r, c })]),
        ),
        score = cells.filter((c) => matchField(c)).length
      if (cells.some((c) => matchField(c) === 'number')) {
        headerRow = r
        break
      }
      if (score > best && score >= 2) {
        best = score
        headerRow = r
      }
    }
    const kind: ImportSheet['kind'] = /template/i.test(name + ' ' + filename)
      ? 'template'
      : /dropdown|options|reference/i.test(name)
        ? 'reference'
        : /order.*shoot|shoot.*order/i.test(name)
          ? 'planning'
          : headerRow >= 0
            ? 'scene'
            : 'unknown'
    const sheet: ImportSheet = {
      name,
      kind,
      include: kind === 'scene',
      sceneNumber: name.match(/scene\s*(.+)$/i)?.[1]?.trim() || '',
      title: '',
      headerRow,
      columns: [],
      mapping: {},
      rows: [],
      scriptUnit: 'review',
      units: {},
      workbook: ws,
      date: '',
      scheduleReviewed: false,
    }
    if (headerRow >= 0) {
      setHeader(sheet, headerRow)
      if (
        kind === 'scene' &&
        Object.values(sheet.mapping).includes('sceneNumber')
      )
        sheet.kind = 'combined'
      for (const field of [
        'scriptSeconds',
        'setupMinutes',
        'estimatedMinutes',
      ]) {
        const header =
          sheet.columns.find((c) => sheet.mapping[c.letter] === field)?.label ||
          ''
        sheet.units[field] = /sec/i.test(header)
          ? 'seconds'
          : /min/i.test(header)
            ? 'minutes'
            : 'review'
      }
      sheet.scriptUnit = sheet.units.scriptSeconds
      sheet.rows = mapRows(sheet)
    }
    const title = Array.from({ length: Math.max(headerRow, 0) }, (_, r) =>
      Array.from({ length: range.e.c + 1 }, (_, c) =>
        text(ws[XLSX.utils.encode_cell({ r, c })]),
      ),
    )
      .flat()
      .find((v) => /^location:/i.test(v))
    sheet.title = title?.replace(/^location:\s*/i, '') || ''
    if (kind === 'reference') {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const key = text(ws[XLSX.utils.encode_cell({ r: range.s.r, c })])
        if (key)
          options[key] = Array.from(
            { length: Math.min(range.e.r, 500) },
            (_, i) => text(ws[XLSX.utils.encode_cell({ r: i + 1, c })]),
          ).filter(Boolean)
      }
    }
    if (kind === 'planning') {
      const blockHeaders: {
        r: number
        c: number
        label: string
        scene: string
      }[] = []
      for (let r = range.s.r; r <= Math.min(range.e.r, 10); r++)
        for (let c = range.s.c; c <= range.e.c; c++) {
          const label = text(ws[XLSX.utils.encode_cell({ r, c })]),
            match = label.match(/^Scene\s+(.+?)\s+(?:Shot|Shoot)\s+Order$/i)
          if (match)
            blockHeaders.push({
              r,
              c,
              label,
              scene: (match[1].match(/^\d+/)?.[0] || match[1]).padStart(2, '0'),
            })
        }
      if (blockHeaders.length) {
        sheet.blocks = blockHeaders.map((header, i) => {
          const endColumn = blockHeaders[i + 1]?.c ?? range.e.c + 1,
            block: ImportSheet = {
              ...sheet,
              name: header.label,
              sceneNumber: header.scene,
              columns: [],
              mapping: {},
              headerRow: header.r,
              units: { estimatedMinutes: 'minutes' },
              scriptUnit: 'seconds',
              blocks: undefined,
            }
          for (let c = header.c; c < endColumn; c++) {
            const letter = XLSX.utils.encode_col(c),
              label = text(ws[`${letter}${header.r + 1}`])
            if (!label) continue
            block.columns.push({ letter, label })
            block.mapping[letter] =
              c === header.c
                ? 'number'
                : /specs|descrip/i.test(label)
                  ? 'notes'
                  : /time to shoot/i.test(label)
                    ? 'estimatedMinutes'
                    : ''
          }
          block.rows = mapRows(block)
          return block
        })
        sheet.rows = []
      }
    }
    total += sheet.rows.length
    if (total > 5000)
      throw Error('Maximum 5,000 candidate rows across all worksheets.')
    sheets.push(sheet)
  }
  return {
    sheets,
    options,
    warnings: !sheets.some(isShotSheet)
      ? [
          'No confident master shot sheet detected. In Map, choose a sheet role, header row and Shot number column.',
        ]
      : [],
  }
}
function duration(
  value: string,
  cell: XLSX.CellObject | undefined,
  field: string,
  unit: string,
) {
  if (!value.trim()) return { value: '' }
  if (cell?.t === 'n' && /[hms].*[:].*[hms]/i.test(String(cell.z)))
    return {
      value: String(
        Number(
          (Number(cell.v) * (field === 'scriptSeconds' ? 86400 : 1440)).toFixed(
            6,
          ),
        ),
      ),
    }
  const explicit = value
    .trim()
    .match(/^([\d.]+)\s*(sec(?:onds?)?|s|min(?:utes?)?|m)$/i)
  if (explicit) {
    const n = Number(explicit[1]),
      seconds = /^s/i.test(explicit[2])
    return {
      value: String(
        Number(
          (
            n *
            (field === 'scriptSeconds'
              ? seconds
                ? 1
                : 60
              : seconds
                ? 1 / 60
                : 1)
          ).toFixed(6),
        ),
      ),
    }
  }
  if (unit === 'review')
    return { value, issue: 'Confirm timing units for this column.' }
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0)
    return {
      value,
      issue: `Invalid duration “${value}”. Correct or exclude this row.`,
    }
  return {
    value: String(
      Number(
        (
          number *
          (field === 'scriptSeconds'
            ? unit === 'minutes'
              ? 60
              : 1
            : unit === 'seconds'
              ? 1 / 60
              : 1)
        ).toFixed(6),
      ),
    ),
  }
}
export function mapRows(sheet: ImportSheet): ImportRow[] {
  const ws = sheet.workbook,
    end = XLSX.utils.decode_range(ws['!ref'] || 'A1').e.r,
    result: ImportRow[] = [],
    labels = new Set<string>(),
    mapped = Object.values(sheet.mapping).filter(Boolean),
    duplicate = mapped.some((v, i, a) => a.indexOf(v) !== i)
  if (sheet.headerRow < 0) return result
  for (let r = sheet.headerRow + 1; r <= end; r++) {
    const values: ImportRow['values'] = {},
      issues: string[] = []
    let sceneNumber = sheet.sceneNumber
    for (const [col, field] of Object.entries(sheet.mapping)) {
      if (!field) continue
      const cell: XLSX.CellObject | undefined = ws[`${col}${r + 1}`]
      let value = text(cell)
      if (field === 'sceneNumber') {
        sceneNumber = value
        continue
      }
      if (
        ['scriptSeconds', 'setupMinutes', 'estimatedMinutes'].includes(field)
      ) {
        const converted = duration(
          value,
          cell,
          field,
          field === 'scriptSeconds'
            ? sheet.scriptUnit
            : sheet.units[field] || 'review',
        )
        value = converted.value
        if (converted.issue) issues.push(`${fields[field]}: ${converted.issue}`)
      }
      values[field] = value
      if (field === 'number' && cell?.t === 'n') {
        const fmt = String(cell.z || 'General'),
          reliable = /0\.0{1,4}/.test(fmt) && value.includes('.')
        if (!reliable && Number(cell.v) % 1 !== 0)
          issues.push(
            `Numeric identifier “${value}”: trailing-zero meaning may already be lost. Review the label; the importer cannot reconstruct it.`,
          )
        if (
          !reliable &&
          Math.abs(Number(cell.v) - Number(Number(cell.v).toFixed(8))) > 1e-10
        )
          issues.push('Floating-point identifier needs manual review.')
      }
    }
    if (
      !['number', 'coverage', 'subject', 'notes'].some((k) =>
        values[k as ShotField]?.trim(),
      )
    )
      continue
    if (
      normalized(values.number || '') === 'shot' ||
      normalized(values.number || '') === 'shotnumber'
    )
      continue
    if (!values.number?.trim())
      issues.push(
        'Missing shot number. Enter a text identifier or exclude this row.',
      )
    else if (labels.has(sceneNumber + '\0' + values.number))
      issues.push(
        'Duplicate label in this scene. Distinct UUIDs will be created; review this row.',
      )
    labels.add(sceneNumber + '\0' + values.number)
    if (duplicate)
      issues.push('Two columns map to one field. Resolve the mapping first.')
    for (const field of ['plannedTakes'] as ShotField[])
      try {
        validateValue(field, values[field] || '')
      } catch (e) {
        issues.push(`${fields[field]}: ${(e as Error).message}`)
      }
    values.source = JSON.stringify({
      sheet: sheet.name,
      row: r + 1,
      original: Object.fromEntries(
        sheet.columns.map((c) => [c.label, text(ws[`${c.letter}${r + 1}`])]),
      ),
      cells: Object.fromEntries(
        sheet.columns.map((c) => {
          const cell = ws[`${c.letter}${r + 1}`] as XLSX.CellObject | undefined
          return [
            c.letter,
            cell
              ? Object.fromEntries(
                  ['t', 'v', 'w', 'z', 'f']
                    .filter(
                      (k) => cell[k as keyof XLSX.CellObject] !== undefined,
                    )
                    .map((k) => [k, cell[k as keyof XLSX.CellObject]]),
                )
              : null,
          ]
        }),
      ),
    })
    result.push({
      row: r + 1,
      sceneNumber,
      values,
      issues,
      include: true,
      reviewed: issues.length === 0,
    })
  }
  return result
}
export function importPayload(preview: ImportPreview, batchId: string) {
  const selected = preview.sheets.filter((s) => s.include && isShotSheet(s))
  if (!selected.length && !scheduleSheets(preview).some((s) => s.include))
    throw Error('Select a master shot sheet or reviewed schedule block.')
  const grouped = new Map<
    string,
    { number: string; title: string; shots: Record<string, string>[] }
  >()
  for (const sheet of selected) {
    const rows = sheet.rows.filter((r) => r.include)
    if (!rows.length) throw Error(`${sheet.name} has no selected rows.`)
    if (
      Object.values(sheet.mapping)
        .filter(Boolean)
        .some((v, i, a) => a.indexOf(v) !== i)
    )
      throw Error(`Resolve duplicate mappings in ${sheet.name}.`)
    for (const row of rows) {
      if (!row.values.number?.trim() || !row.reviewed)
        throw Error(`Review row ${row.row} in ${sheet.name}.`)
      for (const field of [
        'scriptSeconds',
        'setupMinutes',
        'estimatedMinutes',
        'plannedTakes',
      ] as ShotField[])
        validateValue(field, row.values[field] || '')
      const number =
        sheet.kind === 'combined' ? row.sceneNumber : sheet.sceneNumber
      if (!number.trim())
        throw Error(`Enter a scene for row ${row.row} in ${sheet.name}.`)
      const key = sheet.name + '\0' + number
      if (!grouped.has(key))
        grouped.set(key, { number, title: sheet.title, shots: [] })
      grouped
        .get(key)!
        .shots.push(
          Object.fromEntries(
            Object.entries(row.values).filter(
              ([k]) => k === 'source' || k in fields,
            ),
          ) as Record<string, string>,
        )
    }
  }
  const schedule = scheduleSheets(preview)
    .filter((s) => s.include)
    .map((sheet) => {
      if (!sheet.date || !sheet.scheduleReviewed)
        throw Error(
          `Choose a real date and review schedule references in ${sheet.name}.`,
        )
      const rows = sheet.rows.filter((r) => r.include)
      if (rows.some((r) => !r.reviewed || !r.values.number?.trim()))
        throw Error(`Review schedule rows in ${sheet.name}.`)
      return {
        date: sheet.date,
        title: sheet.name,
        rows: rows.map((r) => ({
          number: r.values.number!,
          sceneNumber: r.sceneNumber,
          notes: r.values.notes || '',
          estimatedMinutes: r.values.estimatedMinutes || '',
        })),
      }
    })
  return { batchId, scenes: [...grouped.values()], schedule }
}

export function scheduleSheets(preview: ImportPreview) {
  return preview.sheets
    .filter((s) => s.kind === 'planning')
    .flatMap((s) => s.blocks || [s])
}
