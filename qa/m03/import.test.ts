import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as XLSX from 'xlsx'
import {
  inspectWorkbook,
  importPayload,
  mapRows,
} from '../../client/src/lib/shotImport'
const fixture = () => {
  const book = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([
    ['SCENE 09'],
    [
      'SHOT #',
      'FRAME',
      'COVERAGE',
      'SCRIPT TIME (SECONDS)',
      'LENS',
      'FOCUS NOTES',
    ],
    ['9.1', 'CU', 'Eyes open', 4, '50mm', 'Rack near'],
    ['9.10', 'Wide', 'Clearing', 8, 'Unknown custom lens', ''],
    [9.1, 'MS', 'Numeric ambiguity', 2, '24mm', ''],
    ['9.10', 'CU', 'Duplicate label', 0, '35mm', ''],
    ['', 'CU', 'Missing identifier', 2, '', ''],
    ['9.A', 'CU', '', null, '', ''],
  ])
  XLSX.utils.book_append_sheet(book, sheet, 'Scene 09')
  const two = XLSX.utils.aoa_to_sheet([
    ['Shot Number', 'Camera', 'Action', 'SCRIPT TIME (MINUTES)'],
    ['19-1.1', 'CAM B', 'The stairwell', 0.5],
    [9.1, 'CAM A', 'Formatted label', 1],
  ])
  two.A3.z = '0.00'
  XLSX.utils.book_append_sheet(book, two, 'Scene 19')
  XLSX.utils.book_append_sheet(book, sheet, 'Shot List Template')
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([['LENS'], ['50mm']]),
    'Dropdown Options',
  )
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([['Scene 09 Shot Order'], ['9.10']]),
    'Order of Shooting',
  )
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' })
}
test('multi-sheet inspection preserves text, displayed formatted identifiers, custom choices, empty fields and excludes reference/template/planning sheets', () => {
  const p = inspectWorkbook(fixture()),
    [a, b] = p.sheets
  assert.equal(p.sheets.filter((s) => s.include).length, 2)
  assert.deepEqual(
    a.rows.slice(0, 2).map((r) => r.values.number),
    ['9.1', '9.10'],
  )
  assert.equal(b.rows[1].values.number, '9.10')
  assert.equal(b.rows[1].issues.length, 0)
  assert.equal(b.rows[0].values.scriptSeconds, '30')
  assert.equal(a.rows[1].values.lens, 'Unknown custom lens')
  assert.equal(a.rows.at(-1)!.values.coverage, '')
  assert.equal(p.sheets.find((s) => s.kind === 'template')!.include, false)
  assert.deepEqual(p.options.LENS, ['50mm'])
})
test('numeric ambiguity, missing identifiers and duplicates require explicit review; confirmation cannot silently guess', () => {
  const p = inspectWorkbook(fixture()),
    a = p.sheets[0]
  assert.match(a.rows[2].issues.join(' '), /trailing-zero/)
  assert.match(a.rows[3].issues.join(' '), /Duplicate/)
  assert.match(a.rows[4].issues.join(' '), /Missing/)
  assert.throws(() => importPayload(p, crypto.randomUUID()), /Review/)
  for (const row of a.rows) if (!row.reviewed) row.include = false
  const payload = importPayload(p, crypto.randomUUID())
  assert.equal(payload.scenes[0].shots[1].number, '9.10')
  a.mapping.Z = 'number'
  a.rows = mapRows(a)
  assert.throws(
    () => importPayload(p, crypto.randomUUID()),
    /Review|duplicate/i,
  )
})
test('actual supplied workbook is inspected with seven scene sheets, per-sheet mapping and honest unresolved identifiers/units', () => {
  const file = process.env.M03_WORKBOOK
  if (!file)
    throw new Error('Set M03_WORKBOOK to the supplied workbook for this test.')
  const p = inspectWorkbook(fs.readFileSync(file))
  assert.equal(p.sheets.filter((s) => s.kind === 'scene').length, 7)
  assert.equal(p.sheets.length, 10)
  assert.equal(p.sheets.filter((s) => s.kind === 'planning').length, 1)
  assert.throws(() => importPayload(p, crypto.randomUUID()), /Review|Confirm/)
  const summary = p.sheets.map((s) => ({
    name: s.name,
    kind: s.kind,
    sceneNumber: s.sceneNumber,
    rows: s.rows.length,
    flagged: s.rows.filter((r) => r.issues.length).length,
    scriptUnit: s.scriptUnit,
    mapping: s.mapping,
  }))
  fs.mkdirSync('client/qa/m03/artifacts', { recursive: true })
  fs.writeFileSync(
    'client/qa/m03/artifacts/workbook-inspection.json',
    JSON.stringify(summary, null, 2) + '\n',
  )
})
