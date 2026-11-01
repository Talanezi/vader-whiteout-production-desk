const { runtime, state, out, api } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  { execFileSync } = require('child_process')
;(async () => {
  const dest = path.join(out, 'final'),
    list = JSON.parse(fs.readFileSync(path.join(dest, 'acceptance.json'))),
    snapshot = await api('/' + list.listId + '/export'),
    rows = Object.keys(snapshot.shots)
      .slice(0, 10)
      .map((shotId) => ({ shotId })),
    base = {
      version: 2,
      scope: 'selected',
      layout: 'table',
      rows,
      columns: [
        { field: 'number', width: 106 },
        { field: 'camera', width: 104 },
        { field: 'lens', width: 100 },
        { field: 'movement', width: 150 },
      ],
      margins: 'normal',
      scaling: 'fit-width',
      text: 'wrap',
      groupScenes: true,
    },
    results = []
  for (const [paper, dimensions] of [
    ['letter', [612, 792]],
    ['a4', [595.28, 841.89]],
    ['a3', [841.89, 1190.55]],
    ['tabloid', [792, 1224]],
  ])
    for (const orientation of ['portrait', 'landscape']) {
      const r = await fetch(state.api + '/shotlists/' + list.listId + '/pdf', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + state.tokens[101],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...base, paper, orientation }),
      })
      assert.equal(r.status, 201, await r.clone().text())
      const file = path.join(dest, `paper-${paper}-${orientation}.pdf`)
      fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
      const info = execFileSync('pdfinfo', [file]).toString(),
        size = info.match(/Page size:\s+([\d.]+) x ([\d.]+)/),
        expected =
          orientation === 'portrait' ? dimensions : [...dimensions].reverse()
      assert.ok(Math.abs(Number(size[1]) - expected[0]) < 2)
      assert.ok(Math.abs(Number(size[2]) - expected[1]) < 2)
      results.push({
        paper,
        orientation,
        width: Number(size[1]),
        height: Number(size[2]),
        pass: true,
      })
    }
  fs.writeFileSync(
    path.join(dest, 'paper.json'),
    JSON.stringify({ pass: true, results }, null, 2),
  )
  console.log('PASS all eight actual Letter/A4/A3/Tabloid geometries')
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
