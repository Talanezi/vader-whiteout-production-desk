import * as XLSX from 'xlsx'
import { localCandidates } from './model'
export type SourceCell = {
  address: string
  value: unknown
  formatted: string
  formula?: string
  format?: string
  style?: unknown
  comment?: unknown
}
export type SourceSheet = {
  name: string
  rows: SourceCell[][]
  merges: unknown
  columns: unknown
  rowMetadata: unknown
  range: string
}
export type Mapping = {
  planned: string
  secondary: string
  secondaryRole: 'actual' | 'preserve'
  action: string
  estimate: string
  header: number
  personnel: number
  first: number
  plannedClock: string
  secondaryClock: string
  departments: Record<string, string>
}
export function readWorkbook(bytes: ArrayBuffer): SourceSheet[] {
  if (bytes.byteLength > 12 * 1024 * 1024)
    throw Error('Choose an XLSX up to 12 MB.')
  const v = new DataView(bytes)
  let e = -1
  for (let i = v.byteLength - 22; i >= Math.max(0, v.byteLength - 65557); i--)
    if (v.getUint32(i, true) === 0x06054b50) {
      e = i
      break
    }
  if (e < 0) throw Error('Invalid workbook archive.')
  let p = v.getUint32(e + 16, true),
    total = 0
  const count = v.getUint16(e + 10, true)
  if (count > 2000) throw Error('Workbook has too many archive entries.')
  for (let i = 0; i < count; i++) {
    if (p + 46 > v.byteLength || v.getUint32(p, true) !== 0x02014b50)
      throw Error('Malformed workbook archive.')
    const size = v.getUint32(p + 24, true)
    total += size
    if (total > 60 * 1024 * 1024 || size > 25 * 1024 * 1024)
      throw Error('Expanded workbook exceeds the safe processing limit.')
    p +=
      46 +
      v.getUint16(p + 28, true) +
      v.getUint16(p + 30, true) +
      v.getUint16(p + 32, true)
  }
  const w = XLSX.read(bytes, {
    type: 'array',
    cellStyles: true,
    cellNF: true,
    cellFormula: true,
    sheetRows: 2500,
  })
  return w.SheetNames.map((name) => {
    const s = w.Sheets[name],
      cells = Object.keys(s).filter(
        (k) => k[0] !== '!' && (s[k].v != null || s[k].f),
      ),
      maxRow = Math.max(0, ...cells.map((k) => XLSX.utils.decode_cell(k).r)),
      maxCol = Math.max(0, ...cells.map((k) => XLSX.utils.decode_cell(k).c))
    if (maxRow >= 2499 || maxCol > 99)
      throw Error(
        'Review workbooks with fewer than 2,500 rows and 100 columns.',
      )
    return {
      name,
      range: s['!ref'] || '',
      merges: s['!merges'] || [],
      columns: s['!cols'] || [],
      rowMetadata: s['!rows'] || [],
      rows: Array.from({ length: maxRow + 1 }, (_, r) =>
        Array.from({ length: maxCol + 1 }, (_, c) => {
          const address = XLSX.utils.encode_cell({ r, c }),
            cell = s[address]
          return {
            address,
            value: cell?.v ?? '',
            formatted: cell?.w || String(cell?.v ?? ''),
            formula: cell?.f,
            format: cell?.z,
            style: cell?.s,
            comment: cell?.c,
          }
        }),
      ),
    }
  })
}
export const column = (index: number) => XLSX.utils.encode_col(index)
export function suggest(sheet: SourceSheet): Mapping {
  const row = sheet.rows[0] || []
  const find = (re: RegExp, fallback: string) =>
    column(
      Math.max(
        0,
        row.findIndex((c) => re.test(c.formatted)),
      ),
    ) || fallback
  const action = find(/current action|action/i, 'C'),
    estimate = find(/estimate|duration/i, 'N')
  const departments: Record<string, string> = {}
  row.forEach((c, i) => {
    if (c.formatted.trim() && column(i) !== action && column(i) !== estimate)
      departments[column(i)] = c.formatted.trim()
  })
  return {
    planned: '',
    secondary: '',
    secondaryRole: 'preserve',
    action,
    estimate,
    header: 1,
    personnel: 2,
    first: 4,
    plannedClock: '24',
    secondaryClock: '24',
    departments,
  }
}
export function mappedRows(
  sheet: SourceSheet,
  m: Mapping,
  date: string,
  zone: string,
) {
  const result: {
      row: number
      description: string
      type: string
      start: string | null
      actualStart: string | null
      duration: number | null
      instructions: Record<string, string>
      provenance: unknown
      warning: string
    }[] = [],
    last: Record<string, number> = {},
    day: Record<string, number> = {}
  const index = (col: string) => XLSX.utils.decode_col(col)
  const val = (row: SourceCell[], col: string) =>
    col ? row[index(col)]?.formatted || '' : ''
  function time(value: string, col: string, mode: string) {
    if (!value.trim()) return null
    if (!date)
      throw Error('Set the production date before interpreting source times.')
    const match = value.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
    if (!match) throw Error(`Unrecognized time “${value}”`)
    let h = Number(match[1]),
      min = Number(match[2])
    if (h > 23 || min > 59) throw Error(`Invalid time “${value}”`)
    if (match[3]) h = (h % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0)
    else if (mode === '12-afternoon' && h >= 1 && h <= 6) h += 12
    else if (mode === '12-sequence') {
      const base = h === 12 ? 12 : h
      let minute = base * 60 + min + (day[col] || 0)
      while (last[col] != null && minute < last[col]) {
        day[col] = (day[col] || 0) + 720
        minute += 720
      }
      last[col] = minute
      h = Math.floor(minute / 60)
      min = minute % 60
    }
    const d = new Date(date + 'T00:00:00Z')
    d.setUTCDate(d.getUTCDate() + Math.floor(h / 24))
    const local = `${d.toISOString().slice(0, 10)} ${String(h % 24).padStart(2, '0')}:${String(min).padStart(2, '0')}`
    const candidates = localCandidates(local, zone)
    if (candidates.length !== 1)
      throw Error(
        `Ambiguous or nonexistent local time ${local}; correct this source time before import.`,
      )
    return candidates[0]
  }
  for (let i = m.first - 1; i < sheet.rows.length; i++) {
    const row = sheet.rows[i]
    if (!row.some((c) => c.formatted.trim() || c.formula)) continue
    const description = val(row, m.action),
      instructions = Object.fromEntries(
        Object.keys(m.departments).map((c) => [c, val(row, c)]),
      )
    let start: string | null = null,
      actualStart: string | null = null,
      warning = ''
    try {
      start = time(val(row, m.planned), m.planned, m.plannedClock)
      if (m.secondaryRole === 'actual')
        actualStart = time(val(row, m.secondary), m.secondary, m.secondaryClock)
    } catch (e) {
      warning = (e as Error).message
    }
    const estimate = val(row, m.estimate),
      n = estimate.match(/^\s*(\d+(?:\.\d+)?)\s*(?:min(?:utes?)?)?\s*$/i)
    const type =
      /general call|safety|lunch|begin filming|resume filming|wrap|shoot day now over/i.test(
        description,
      )
        ? 'milestone'
        : !description
          ? 'department'
          : 'custom'
    result.push({
      row: i + 1,
      description,
      type,
      start,
      actualStart,
      duration: n ? Number(n[1]) : null,
      instructions,
      provenance: {
        sheet: sheet.name,
        row: i + 1,
        cells: row.filter((c) => c.formatted.trim() || c.formula),
        sourceEstimate: estimate,
        mapping: m,
      },
      warning,
    })
  }
  return result
}
