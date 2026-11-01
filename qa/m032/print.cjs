const { runtime, state, out, api, create } = require('./helpers.cjs'),
  fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  { execFileSync } = require('node:child_process')
const { resolvePrintArea, computePrintLayout, buildTablePrint } = require(
  path.join(runtime, 'server-dist/shotlists/pdf/table-print'),
)
const rows = (snapshot) => {
  const scenes = Object.values(snapshot.scenes).sort(
    (a, b) => a.order - b.order,
  )
  return scenes.flatMap((scene) =>
    Object.values(snapshot.shots)
      .filter((s) => s.sceneId === scene.id && !s.deleted)
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ shotId: s.id })),
  )
}
const columns = [
  { field: 'number', width: 106 },
  { field: 'coverage', width: 330 },
  { field: 'framing', width: 118 },
  { field: 'camera', width: 104 },
  { field: 'lens', width: 100 },
  { field: 'movement', width: 150 },
  { field: 'estimatedMinutes', width: 110 },
]
const base = {
  version: 2,
  scope: 'entire',
  layout: 'table',
  rows: [],
  columns,
  paper: 'letter',
  orientation: 'landscape',
  margins: 'normal',
  scaling: 'fit-width',
  text: 'wrap',
  groupScenes: true,
}
const results = []
async function pdf(id, spec, name) {
  const response = await fetch(state.api + '/shotlists/' + id + '/pdf', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + state.tokens[101],
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(spec),
  })
  assert.equal(response.status, 201, await response.clone().text())
  const buffer = Buffer.from(await response.arrayBuffer()),
    file = path.join(out, name + '.pdf')
  assert.equal(buffer.subarray(0, 4).toString(), '%PDF')
  fs.writeFileSync(file, buffer)
  const info = execFileSync('pdfinfo', [file]).toString(),
    text = execFileSync('pdftotext', ['-layout', file, '-']).toString(),
    pages = Number(info.match(/Pages:\s+(\d+)/)[1])
  results.push({
    name,
    rows: spec.rows.length,
    fields: spec.columns.map((c) => c.field),
    paper: spec.paper,
    orientation: spec.orientation,
    scaling: spec.scaling,
    pages,
    bytes: buffer.length,
  })
  console.log('PASS', name, pages + ' pages')
  return { text, info, pages, file }
}
;(async () => {
  const workbook = JSON.parse(
      fs.readFileSync(path.join(runtime, 'workbook-list.json')),
    ),
    snapshot = await api('/' + workbook.id + '/export'),
    all = rows(snapshot)
  assert.equal(all.length, 129)
  const five = await pdf(
    workbook.id,
    { ...base, scope: 'selected', rows: all.slice(0, 5) },
    'print-five-selected',
  )
  assert.equal(five.pages, 1)
  assert.ok(!five.text.includes('Camera notes'))
  assert.ok(!five.text.includes('Focus notes'))
  assert.ok(!five.text.includes('9.5 '))
  const scene = Object.values(snapshot.scenes).find((s) => s.number === '16'),
    sceneRows = all.filter((r) => snapshot.shots[r.shotId].sceneId === scene.id)
  await pdf(
    workbook.id,
    { ...base, scope: 'current', rows: sceneRows },
    'print-current-scene-16',
  )
  await pdf(
    workbook.id,
    {
      ...base,
      scope: 'scenes',
      sceneIds: [scene.id],
      rows: sceneRows,
      paper: 'a4',
    },
    'print-selected-scene-a4',
  )
  const narrow = [
      { field: 'number', width: 106 },
      { field: 'camera', width: 104 },
      { field: 'lens', width: 100 },
      { field: 'movement', width: 150 },
    ],
    area = await pdf(
      workbook.id,
      {
        ...base,
        scope: 'area',
        rows: all.slice(0, 10),
        columns: narrow,
        orientation: 'portrait',
        groupScenes: false,
      },
      'print-ten-row-area-portrait',
    )
  assert.equal(area.pages, 1)
  assert.ok(!area.text.includes('Coverage'))
  assert.ok(!area.text.includes('Est. min'))
  await pdf(workbook.id, { ...base, rows: all }, 'print-entire-129')
  await pdf(
    workbook.id,
    { ...base, rows: all, text: 'single-line' },
    'print-entire-129-one-line',
  )
  const fieldNames = Object.keys(
      require(path.join(runtime, 'server-dist/shotlists/pdf/table-print'))
        .printFields,
    ).filter(
      (f) =>
        !['scene', 'sequence', 'assignmentNotes', 'assignmentStatus'].includes(
          f,
        ),
    ),
    wide = fieldNames.map((field) => ({
      field,
      width:
        field === 'coverage'
          ? 330
          : field.toLowerCase().includes('notes')
            ? 260
            : 120,
    }))
  assert.throws(
    () => computePrintLayout({ ...base, columns: wide }, wide),
    /readable type/,
  )
  const layout = computePrintLayout({ ...base, scaling: 'readable' }, wide)
  assert.ok(layout.bands.length > 1)
  assert.ok(layout.font >= 8)
  await pdf(
    workbook.id,
    { ...base, rows: all, columns: wide, scaling: 'readable', paper: 'a4' },
    'print-full-technical-tiled',
  )
  await pdf(
    workbook.id,
    { ...base, rows: all.slice(0, 20), columns: narrow, scaling: 'actual' },
    'print-actual-size',
  )
  await pdf(
    workbook.id,
    {
      ...base,
      rows: all.slice(0, 5),
      layout: 'report',
      report: {
        mode: 'creative',
        profile: 'detailed',
        notes: true,
        summaries: true,
      },
    },
    'print-optional-detailed',
  )
  const list = await create('Table print security / day order / long content'),
    start = await api('/' + list.id + '/export')
  await api('/' + list.id + '/import', {
    batchId: crypto.randomUUID(),
    scenes: [],
    schedule: [
      {
        date: '2027-05-31',
        title: 'Day 1',
        rows: [
          { number: '16-B', sceneNumber: '16' },
          { number: '16-A', sceneNumber: '16' },
        ],
      },
    ],
  })
  const scheduled = await api('/' + list.id + '/export'),
    day = Object.values(scheduled.shootDays)[0],
    dayRows = Object.values(scheduled.shootAssignments)
      .sort((a, b) => a.order - b.order)
      .map((a) => ({ shotId: a.shotId, assignmentId: a.id }))
  const dayPDF = await pdf(
    list.id,
    {
      ...base,
      scope: 'day',
      rows: dayRows,
      dayId: day.id,
      columns: [{ field: 'sequence', width: 65 }, ...columns],
      scaling: 'readable',
      groupScenes: false,
    },
    'print-shoot-day-order',
  )
  assert.ok(dayPDF.text.indexOf('16-B') < dayPDF.text.indexOf('16-A'))
  assert.deepEqual((await api('/' + list.id + '/export')).shots, start.shots)
  const invalid = { ...base, rows: [{ shotId: crypto.randomUUID() }] }
  assert.throws(
    () => resolvePrintArea(scheduled, invalid),
    /no longer available/,
  )
  assert.throws(
    () =>
      resolvePrintArea(scheduled, {
        ...base,
        rows: rows(scheduled),
        columns: [{ field: 'source', width: 100 }],
      }),
    /Invalid/,
  )
  assert.throws(
    () =>
      resolvePrintArea(scheduled, {
        ...base,
        rows: rows(scheduled),
        columns: [{ field: 'number', width: 0 }],
      }),
    /Invalid/,
  )
  assert.throws(
    () =>
      resolvePrintArea(scheduled, {
        ...base,
        rows: [dayRows[0]],
        scope: 'day',
        dayId: crypto.randomUUID(),
      }),
    /selected shoot day/,
  )
  const one = rows(scheduled)[0],
    long = structuredClone(scheduled)
  long.shots[one.shotId].coverage =
    'Café Δ Привет — & % # { } \\input{/etc/passwd} ' +
    'Long coverage, with line breaks.\n'.repeat(200) +
    ' END-COVERAGE-MARKER'
  long.shots[one.shotId].number = 'UNBROKEN'.repeat(30)
  long.shots[one.shotId].notes = 'HIDDEN-NOTE-MARKER'
  const built = buildTablePrint(long, {
    ...base,
    rows: [one],
    columns: [
      { field: 'number', width: 106 },
      { field: 'coverage', width: 330 },
    ],
    groupScenes: false,
  })
  assert.ok(!built.source.includes('HIDDEN-NOTE-MARKER'))
  assert.ok(!built.source.includes('\\input{/etc/passwd}'))
  const compiled = await require(
      path.join(runtime, 'server-dist/shotlists/pdf/compile-shotlist'),
    ).compileShotlist(built.source),
    longFile = path.join(out, 'print-long-unicode-escaped.pdf')
  fs.writeFileSync(longFile, compiled)
  const extracted = execFileSync('pdftotext', [longFile, '-']).toString()
  assert.ok(extracted.includes('END-COVERAGE-MARKER'))
  assert.ok(extracted.includes('Café'))
  assert.ok(extracted.includes('Привет'))
  assert.ok(!extracted.includes('root:x:'))
  console.log(
    'PASS long wrapped continuation rows, Unicode, safe LaTeX escaping and no hidden fields',
  )
  fs.writeFileSync(
    path.join(out, 'print.json'),
    JSON.stringify(
      {
        pass: true,
        results,
        minimumFontPt: 8,
        wideColumnBands: layout.bands.length,
        engine: 'XeLaTeX; PDF.js renders the same bytes for preview',
      },
      null,
      2,
    ),
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
