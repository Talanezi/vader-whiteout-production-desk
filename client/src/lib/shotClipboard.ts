import type { ShotField } from './shotDocument'
/** A bounded quoted matrix parser. Embedded tabs/newlines remain cell content. */
export function parseMatrix(text: string, separator = '\t'): string[][] {
  if (text.length > 2_000_000) throw Error('Paste must be smaller than 2 MB.')
  const rows: string[][] = [],
    row: string[] = []
  let value = '',
    quoted = false,
    closed = false,
    endedRow = false
  const field = () => {
    row.push(value)
    value = ''
    closed = false
  }
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      endedRow = false
      if (c === '"') {
        if (text[i + 1] === '"') {
          value += '"'
          i++
        } else {
          quoted = false
          closed = true
        }
      } else value += c
      continue
    }
    if (c === separator || c === '\n' || c === '\r') {
      field()
      endedRow = c !== separator
      if (c !== separator) {
        rows.push([...row])
        row.length = 0
        if (c === '\r' && text[i + 1] === '\n') i++
      }
      continue
    }
    endedRow = false
    if (closed)
      throw Error(
        'Unexpected text after a closing quote. Check the pasted cells.',
      )
    if (c === '"' && !value) quoted = true
    else value += c
  }
  if (quoted) throw Error('An opening quote is missing its closing quote.')
  field()
  if (!endedRow || !rows.length) rows.push(row)
  if (rows.length > 5000 || rows.some((r) => r.length > 50))
    throw Error('Paste is limited to 5,000 rows and 50 columns.')
  return rows
}
export const formatMatrix = (rows: string[][]) =>
  rows
    .map((r) =>
      r
        .map((v) =>
          !v || /[\t\n\r"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v,
        )
        .join('\t'),
    )
    .join('\n')
export function validateValue(field: ShotField, value: string) {
  if (value.length > 20000) throw Error('Text is limited to 20,000 characters.')
  if (
    [
      'scriptSeconds',
      'setupMinutes',
      'estimatedMinutes',
      'plannedTakes',
    ].includes(field) &&
    value !== '' &&
    (!Number.isFinite(Number(value)) ||
      Number(value) < 0 ||
      (field === 'plannedTakes' && !Number.isInteger(Number(value))))
  )
    throw Error(
      'Enter a non-negative ' +
        (field === 'plannedTakes' ? 'whole number' : 'number') +
        '.',
    )
  if (field === 'number' && !value.trim())
    throw Error('Shot identifiers cannot be empty.')
}
