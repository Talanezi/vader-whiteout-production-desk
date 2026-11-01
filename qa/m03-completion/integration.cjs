const { api, state, out } = require('../m032/helpers.cjs'),
  fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict'),
  { execFileSync } = require('child_process')
const X = require('/tmp/m032/runtime/client/node_modules/xlsx')
;(async () => {
  const w = X.readFile(
      '/Users/thameralanezi/Downloads/Shot List - Vader_ Whiteout.xlsx',
    ),
    source = X.utils
      .sheet_to_json(w.Sheets['Shot List - Scene 05'], {
        header: 1,
        defval: '',
      })
      .slice(4, 18)
  const fields = [
    'number',
    'camera',
    'framing',
    'subject',
    'angle',
    'lens',
    'equipment',
    'movement',
    'coverage',
    'notes',
    'focusNotes',
    'lightingNotes',
    'scriptSeconds',
    'setupMinutes',
    'plannedTakes',
    'estimatedMinutes',
    'actualTakes',
  ]
  const list = await api('', { name: 'Scene 05 direct renderer QA' })
  await api('/' + list.id + '/import', {
    batchId: crypto.randomUUID(),
    scenes: [
      {
        number: '05',
        title: 'Foresty stuffs',
        shots: source.map((row) =>
          Object.fromEntries(
            fields.map((f, i) => [f, String(row[i + 1] ?? '')]),
          ),
        ),
      },
    ],
  })
  const data = await api('/' + list.id + '/export'),
    rows = Object.keys(data.shots).map((shotId) => ({ shotId }))
  assert.equal(rows.length, 14)
  const widths = [
    23, 31, 40, 40, 40, 40, 48, 40, 48, 48, 35, 35, 35, 31, 24, 32, 76,
  ]
  const spec = {
    version: 2,
    scope: 'entire',
    layout: 'table',
    rows,
    columns: fields.map((field, i) => ({
      field,
      width: Math.max(40, widths[i] * 3),
    })),
    paper: 'letter',
    orientation: 'landscape',
    margins: 'normal',
    scaling: 'fit-width',
    text: 'wrap',
    groupScenes: true,
  }
  const r = await fetch(state.api + '/shotlists/' + list.id + '/pdf', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + state.tokens[101],
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(spec),
  })
  assert.equal(r.status, 201, await r.clone().text())
  const file = path.join(out, 'completion-scene05.pdf')
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
  const text = execFileSync('pdftotext', ['-layout', file, '-']).toString()
  for (const word of ['SHADOW', 'corpse', 'Foresty', 'Framing', 'Lighting'])
    assert.ok(text.includes(word), word)
  assert.match(execFileSync('pdfinfo', [file]).toString(), /Pages:\s+1/)
  console.log(
    execFileSync('pdfinfo', [file])
      .toString()
      .split('\n')
      .filter((x) => /^Pages:|^Page size:/.test(x))
      .join('\n'),
  )
  console.log(
    'PASS real authenticated direct-PDF endpoint: 14 Scene 05 shots, 17 technical fields, complete long coverage, embedded Unicode font',
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
