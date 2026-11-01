const { runtime, state, out, api } = require('../m032/helpers.cjs'),
  fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict'),
  { execFileSync } = require('child_process')
;(async () => {
  const list = JSON.parse(
      fs.readFileSync(path.join(runtime, 'completion-workbook-list.json')),
    ),
    data = await api('/' + list.id + '/export'),
    scenes = Object.values(data.scenes)
      .filter((s) => !s.deleted)
      .sort((a, b) => a.order - b.order),
    rows = scenes.flatMap((scene) =>
      Object.values(data.shots)
        .filter((s) => !s.deleted && s.sceneId === scene.id)
        .sort((a, b) => a.order - b.order)
        .map((s) => ({ shotId: s.id })),
    )
  assert.equal(rows.length, 129)
  const { printFields } = require(
      path.join(runtime, 'server-dist/shotlists/pdf/table-print'),
    ),
    all = Object.keys(printFields)
      .filter(
        (f) => !['sequence', 'assignmentNotes', 'assignmentStatus'].includes(f),
      )
      .map((field) => ({
        field,
        width:
          field === 'coverage'
            ? 330
            : field.toLowerCase().includes('notes')
              ? 260
              : 120,
      })),
    essentials = [
      'number',
      'coverage',
      'camera',
      'lens',
      'movement',
      'estimatedMinutes',
    ].map((field) => ({ field, width: field === 'coverage' ? 330 : 110 })),
    results = []
  for (const layout of [
    'table',
    'technical',
    'single-line',
    'five-selected',
    'ten-area',
  ]) {
    const body = {
      version: 2,
      scope:
        layout === 'five-selected'
          ? 'selected'
          : layout === 'ten-area'
            ? 'area'
            : 'entire',
      layout: 'table',
      rows:
        layout === 'five-selected'
          ? rows.slice(0, 5)
          : layout === 'ten-area'
            ? rows.slice(0, 10)
            : rows,
      columns:
        layout === 'technical'
          ? all
          : layout === 'ten-area'
            ? ['number', 'camera', 'lens', 'movement'].map((field) => ({
                field,
                width: 120,
              }))
            : essentials,
      paper: 'letter',
      orientation: 'landscape',
      margins: 'normal',
      scaling: 'fit-width',
      text: layout === 'single-line' ? 'single-line' : 'wrap',
      groupScenes: true,
      report: { profile: 'detailed', notes: true, summaries: true },
    }
    const r = await fetch(state.api + '/shotlists/' + list.id + '/pdf', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + state.tokens[101],
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    assert.equal(r.status, 201, await r.clone().text())
    const file = path.join(
      out,
      'final',
      `completion-workbook-129-${layout}.pdf`,
    )
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
    const pages = Number(
      execFileSync('pdfinfo', [file])
        .toString()
        .match(/Pages:\s+(\d+)/)[1],
    )
    if (['five-selected', 'ten-area'].includes(layout)) assert.equal(pages, 1)
    results.push({
      layout,
      shots: body.rows.length,
      fields: body.columns.length,
      pages,
    })
    console.log('PASS original workbook', layout, pages + ' pages')
  }
  fs.writeFileSync(
    path.join(out, 'final', 'workbook-pdf.json'),
    JSON.stringify({ pass: true, results }, null, 2),
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
