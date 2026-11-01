import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import * as Y from 'yjs'
import * as XLSX from 'xlsx'
import { createShotUndo } from '../../client/src/lib/shotUndo'
import {
  parseMatrix,
  formatMatrix,
  validateValue,
} from '../../client/src/lib/shotClipboard'
import {
  addScene,
  addShot,
  ordered,
  shots,
  scenes,
  str,
  nextShotNumber,
  reorder,
} from '../../client/src/lib/shotDocument'
import {
  addDay,
  assignShots,
  validAssignments,
  moveRecords,
  days,
  assignments,
  validDate,
  assignmentContract,
} from '../../client/src/lib/shotSchedule'
import {
  inspectWorkbook,
  importPayload,
  mapRows,
  scheduleSheets,
} from '../../client/src/lib/shotImport'
const fixture = () => {
  const doc = new Y.Doc(),
    scene = addScene(doc, '16', 'Dunes'),
    ids = Array.from({ length: 30 }, () => addShot(doc, scene, 101))
  return { doc, scene, ids }
}
test('quoted TSV round trips multiline, tabs, quotes, CRLF, empty cells; bounds and invalid input', () => {
  const rows = [
    ['09-A', 'line1\nline2', 'a\tb', 'He said "yes"', ''],
    ['09-AA', 'Unicode: café Δ Привет', '', '', ''],
  ]
  assert.deepEqual(parseMatrix(formatMatrix(rows)), rows)
  assert.deepEqual(parseMatrix('a\tb\r\nc\td\r\n'), [
    ['a', 'b'],
    ['c', 'd'],
  ])
  assert.throws(() => parseMatrix('"unfinished'), /closing quote/)
  assert.throws(() => parseMatrix('x'.repeat(2_000_001)), /2 MB/)
  for (const field of [
    'scriptSeconds',
    'estimatedMinutes',
    'setupMinutes',
    'plannedTakes',
  ] as const) {
    assert.throws(() => validateValue(field, '-1'))
    assert.throws(() => validateValue(field, 'oops'))
  }
  assert.throws(() => validateValue('plannedTakes', '1.5'))
  assert.throws(() => validateValue('number', ''))
  validateValue('number', '9.10')
})
test('new alphabetic IDs, distinct duplicates, stable labels/UUIDs and undo of local order', () => {
  const { doc, scene, ids } = fixture()
  assert.deepEqual(
    ids.slice(25, 28).map((id) => str(shots(doc).get(id), 'number')),
    ['16-Z', '16-AA', '16-AB'],
  )
  const first = shots(doc).get(ids[0])!
  first.set('number', '9.10')
  const duplicate = addShot(doc, scene, 101, first)
  assert.notEqual(str(shots(doc).get(duplicate), 'number'), '9.10')
  assert.equal(str(first, 'number'), '9.10')
  const undo = new Y.UndoManager(shots(doc), {
    trackedOrigins: new Set(['local']),
  })
  const before = ordered(shots(doc)).map((s) => str(s, 'id'))
  moveRecords(doc, ordered(shots(doc)), [ids[0], ids[1]], ids[5])
  assert.deepEqual(
    ordered(shots(doc))
      .slice(4, 6)
      .map((s) => str(s, 'id')),
    ids.slice(0, 2),
  )
  undo.undo()
  assert.deepEqual(
    ordered(shots(doc)).map((s) => str(s, 'id')),
    before,
  )
  assert.equal(str(first, 'number'), '9.10')
  doc.destroy()
})
test('three independent Yjs clients converge after concurrent reorder, text edit, day assignment and reconnect', () => {
  const { doc, ids } = fixture(),
    a = new Y.Doc(),
    b = new Y.Doc(),
    c = new Y.Doc()
  ;[a, b, c].forEach((d) => Y.applyUpdate(d, Y.encodeStateAsUpdate(doc)))
  moveRecords(a, ordered(shots(a)), [ids[1]], ids[8])
  moveRecords(b, ordered(shots(b)), [ids[2]], ids[8])
  ;(shots(c).get(ids[0])!.get('coverage') as Y.Text).insert(
    0,
    'Independent collaborator coverage',
  )
  const day = addDay(c, '2027-05-31')
  assignShots(c, day, [ids[0], ids[8]])
  const updates = [a, b, c].map((d) => Y.encodeStateAsUpdate(d))
  for (const target of [a, b, c])
    for (const update of updates) Y.applyUpdate(target, update)
  assert.deepEqual(
    ordered(shots(a)).map((s) => str(s, 'id')),
    ordered(shots(b)).map((s) => str(s, 'id')),
  )
  for (const name of [
    'meta',
    'scenes',
    'shots',
    'shootDays',
    'shootAssignments',
  ])
    assert.deepEqual(a.getMap(name).toJSON(), c.getMap(name).toJSON())
  assert.equal(new Set(ordered(shots(a)).map((s) => str(s, 'id'))).size, 30)
  assert.equal(
    str(shots(b).get(ids[0]), 'coverage'),
    'Independent collaborator coverage',
  )
  assert.equal(validAssignments(a, day).length, 2)
  ;[doc, a, b, c].forEach((d) => d.destroy())
})
test('fractional ordering survives equal positions and repeated midpoint operations', () => {
  const { doc, ids } = fixture()
  shots(doc).get(ids[0])!.set('order', 1024)
  shots(doc).get(ids[1])!.set('order', 1024)
  for (let i = 0; i < 200; i++)
    moveRecords(doc, ordered(shots(doc)), [ids[29]], ids[i % 2])
  assert.ok(ordered(shots(doc)).every((s) => Number.isFinite(s.get('order'))))
  assert.equal(ordered(shots(doc)).length, 30)
  doc.destroy()
})
test('shoot-day identity, pickups, independent sequences, date-only validation and M05 contract', () => {
  const { doc, ids } = fixture(),
    before = ordered(shots(doc)).map((s) => [
      str(s, 'id'),
      s.get('order'),
      s.get('planningOrder'),
      str(s, 'number'),
    ]),
    one = addDay(doc, '2027-05-31', 'Day 1'),
    two = addDay(doc, '2027-06-02', 'Pickups')
  assignShots(doc, one, ids.slice(0, 3))
  assignShots(doc, one, [ids[0]])
  assert.equal(validAssignments(doc, one).length, 3)
  assignShots(doc, two, [ids[0]], true)
  const records = validAssignments(doc, one)
  moveRecords(doc, records, [str(records[0], 'id')], str(records[2], 'id'))
  assert.deepEqual(
    ordered(shots(doc)).map((s) => [
      str(s, 'id'),
      s.get('order'),
      s.get('planningOrder'),
      str(s, 'number'),
    ]),
    before,
  )
  assert.equal(assignmentContract(doc, two)[0].shotId, ids[0])
  assignments(doc).get(str(records[0], 'id'))!.set('deleted', true)
  assert.equal(shots(doc).size, 30)
  days(doc).get(two)!.set('deleted', true)
  assert.equal(validAssignments(doc, two).length, 0)
  for (const date of ['2027-05-31', '2028-02-29']) assert.ok(validDate(date))
  for (const date of ['2027-02-29', '2027-99-99', '2027-05-31T00:00Z', ''])
    assert.equal(validDate(date), false)
  doc.destroy()
})
test('CSV and TSV preserve text identifiers, leading zeros, multiline and combined-scene grouping', () => {
  for (const delimiter of [',', '\t']) {
    const text = [
      [
        'Scene',
        'Shot No',
        'Cam',
        'Shot Size',
        'Description',
        'Script Duration (minutes)',
      ],
      ['09', '09-A', 'CAM A', 'CU', 'line1\nline2', '0.5'],
      ['16', '9.10', 'CAM B', 'Wide', 'Café', '1'],
    ]
      .map((row) =>
        row.map((v) => '"' + v.replace(/"/g, '""') + '"').join(delimiter),
      )
      .join('\r\n')
    const p = inspectWorkbook(Buffer.from(text))
    assert.equal(p.sheets[0].kind, 'combined')
    assert.equal(p.sheets[0].rows[0].sceneNumber, '09')
    assert.equal(p.sheets[0].rows[1].values.number, '9.10')
    assert.equal(p.sheets[0].rows[1].values.coverage, 'Café')
    const payload = importPayload(p, crypto.randomUUID())
    assert.equal(payload.scenes.length, 2)
    assert.equal(payload.scenes[0].shots[0].scriptSeconds, '30')
    assert.equal(payload.scenes[0].shots[0].coverage, 'line1\nline2')
  }
})
test('cell audit preserves t/v/w/z/f; Excel serial and explicit duration units normalize deliberately', () => {
  const book = XLSX.utils.book_new(),
    ws = XLSX.utils.aoa_to_sheet([
      ['Shot', 'Coverage', 'Script Duration', 'Setup Time (seconds)'],
      [9.1, 'Unicode & multiline\nΔ', 0.5, 120],
    ])
  ws.A2.z = '0.00'
  ws.C2.z = 'hh:mm:ss'
  ws.D2.f = '60*2'
  XLSX.utils.book_append_sheet(book, ws, 'Scene 09')
  const p = inspectWorkbook(
    XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }),
  )
  const row = p.sheets[0].rows[0]
  assert.equal(row.values.number, '9.10')
  assert.equal(row.values.scriptSeconds, '43200')
  assert.equal(row.values.setupMinutes, '2')
  const audit = JSON.parse(row.values.source!)
  assert.equal(audit.cells.A.z, '0.00')
  assert.equal(audit.cells.D.f, '60*2')
  assert.equal(audit.cells.A.t, 'n')
  assert.equal(audit.cells.A.v, 9.1)
  assert.equal(audit.cells.A.w, '9.10')
})
test('malformed and excessive workbooks reject before payload creation; unknown headers remain mappable', () => {
  assert.throws(() => inspectWorkbook(Buffer.alloc(0)), /empty/)
  assert.throws(
    () => inspectWorkbook(Buffer.alloc(8 * 1024 * 1024 + 1)),
    /8 MB/,
  )
  const book = XLSX.utils.book_new(),
    ws = XLSX.utils.aoa_to_sheet([
      ['Shot', 'Coverage'],
      ['09-A', 'one'],
    ])
  ws['!ref'] = 'A1:DX10002'
  XLSX.utils.book_append_sheet(book, ws, 'Scene 09')
  assert.throws(
    () =>
      inspectWorkbook(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' })),
    /10,000 rows and 100 columns/,
  )
})
test('original workbook: seven scenes / 129 candidates / six independently reviewable schedule blocks', () => {
  const p = inspectWorkbook(
    fs.readFileSync(
      process.env.M03_WORKBOOK ||
        '/Users/thameralanezi/Downloads/Shot List - Vader_ Whiteout.xlsx',
    ),
  )
  assert.equal(p.sheets.length, 10)
  assert.equal(p.sheets.filter((s) => s.kind === 'scene').length, 7)
  assert.equal(
    p.sheets
      .filter((s) => s.kind === 'scene')
      .reduce((n, s) => n + s.rows.length, 0),
    129,
  )
  assert.equal(scheduleSheets(p).length, 6)
  assert.ok(scheduleSheets(p).every((s) => s.date === '' && !s.include))
  assert.deepEqual(
    scheduleSheets(p)
      .find((s) => s.sceneNumber === '16')!
      .rows.slice(0, 6)
      .map((r) => r.values.number),
    ['16-I', '16-J', '16-E', '16-F', '16-A', '16-D'],
  )
  assert.throws(() => importPayload(p, crypto.randomUUID()), /Review/)
  console.log(
    JSON.stringify(
      p.sheets
        .filter((s) => s.kind === 'scene')
        .map((s) => ({
          scene: s.sceneNumber,
          rows: s.rows.length,
          firstIssues: s.rows[0].issues,
          units: s.units,
        })),
    ),
  )
})

test('deliberate commands isolate undo even when issued within the typing window', () => {
  const { doc, ids } = fixture(),
    undo = createShotUndo(doc),
    day = addDay(doc, '2027-05-31')
  assignShots(doc, day, [ids[0]])
  undo.undo()
  assert.equal(validAssignments(doc, day).length, 0)
  assert.equal(days(doc).get(day)?.get('date'), '2027-05-31')
  undo.undo()
  assert.equal(days(doc).has(day), false)
  doc.destroy()
})
test('clipboard preserves explicit empty trailing cells/rows and rejects malformed closing quotes', () => {
  const values = [
    ['A', ''],
    ['', ''],
  ]
  assert.deepEqual(parseMatrix(formatMatrix(values)), values)
  assert.deepEqual(parseMatrix('a\t\n\t'), [
    ['a', ''],
    ['', ''],
  ])
  assert.throws(() => parseMatrix('"a"oops\tb'), /closing quote/)
  assert.deepEqual(parseMatrix('""'), [['']])
})
test('UTF-16 text import and bounded ZIP inflation', () => {
  const utf = Buffer.concat([
      Buffer.from([255, 254]),
      Buffer.from('Scene,Shot,Coverage\r\n09,09-A,Café Δ', 'utf16le'),
    ]),
    p = inspectWorkbook(utf)
  assert.equal(p.sheets[0].rows[0].values.coverage, 'Café Δ')
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ['Shot', 'Coverage'],
      ['09-A', 'one'],
    ]),
    'Scene 09',
  )
  const zip = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' })
  const start = zip.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]))
  zip.writeUInt32LE(100 * 1024 * 1024, start + 24)
  assert.throws(() => inspectWorkbook(zip), /64 MB/)
})
test('deletion reserves old alphabetic labels so restoring a shot cannot create a duplicate', () => {
  const { doc, scene, ids } = fixture()
  shots(doc).get(ids[0])!.set('deleted', true)
  assert.notEqual(nextShotNumber(doc, scene), '16-A')
  doc.destroy()
})
