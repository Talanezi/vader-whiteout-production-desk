const { state, out, api } = require('../m032/helpers.cjs'),
  fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict'),
  { execFileSync } = require('child_process')
;(async () => {
  const list = await api('', { name: 'Unicode font verification' })
  await api('/' + list.id + '/import', {
    batchId: crypto.randomUUID(),
    scenes: [
      {
        number: '01',
        title: 'International crew',
        shots: [
          {
            number: '01-A',
            subject: 'Café · Δ · Люк · محمد',
            coverage: 'Unicode names and symbols: ✓ ± ° é',
          },
        ],
      },
    ],
  })
  const data = await api('/' + list.id + '/export'),
    r = await fetch(state.api + '/shotlists/' + list.id + '/pdf', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + state.tokens[101],
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 2,
        scope: 'entire',
        layout: 'table',
        rows: Object.keys(data.shots).map((shotId) => ({ shotId })),
        columns: [
          { field: 'number', width: 106 },
          { field: 'subject', width: 300 },
          { field: 'coverage', width: 330 },
        ],
        paper: 'letter',
        orientation: 'landscape',
        margins: 'normal',
        scaling: 'fit-width',
        text: 'wrap',
        groupScenes: true,
      }),
    })
  assert.equal(r.status, 201, await r.clone().text())
  const file = path.join(out, 'completion-unicode.pdf')
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
  const text = execFileSync('pdftotext', [file, '-']).toString()
  for (const word of ['Café', 'Δ', 'Люк', '✓', '±', '°'])
    assert.ok(text.includes(word), word)
  assert.ok(text.normalize('NFKC').includes('محمد'))
  console.log(
    'PASS embedded Latin/Greek/Cyrillic and symbol text, Arabic shaping PDF produced for visual review',
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
