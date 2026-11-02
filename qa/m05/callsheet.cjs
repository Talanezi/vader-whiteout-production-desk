const fs = require('fs'),
  assert = require('assert/strict'),
  state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  base = 'http://127.0.0.1:4314/api',
  headers = {
    Authorization: 'Bearer ' + state.tokens['101'],
    'Content-Type': 'application/json',
  }
;(async () => {
  const r = await fetch(base + '/callsheets', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'M05 disposable Call Sheet preservation',
      productionDate: '2026-09-25',
    }),
  })
  assert(r.ok, await r.clone().text())
  const d = await r.json()
  try {
    const pdf = await fetch(base + '/callsheets/' + d.id + '/pdf', { headers })
    assert(pdf.ok, await pdf.clone().text())
    const b = Buffer.from(await pdf.arrayBuffer())
    assert.equal(b.subarray(0, 5).toString(), '%PDF-')
    fs.writeFileSync('/tmp/m05/callsheet-preservation.pdf', b)
    console.log(
      'Existing authenticated Call Sheet LaTeX PDF compiles unchanged.',
    )
  } finally {
    const removed = await fetch(base + '/callsheets/' + d.id, {
      method: 'DELETE',
      headers,
    })
    assert(removed.ok)
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
