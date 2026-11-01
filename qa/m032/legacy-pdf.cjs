const { state, out } = require('./helpers.cjs'),
  fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  { execFileSync } = require('node:child_process')
;(async () => {
  const headers = {
    Authorization: 'Bearer ' + state.tokens['101'],
    'Content-Type': 'application/json',
  }
  const made = await fetch(state.api + '/callsheets', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'M03.2 local Call Sheet PDF regression',
      productionDate: '2027-05-31',
    }),
  })
  assert.ok(made.ok, await made.clone().text())
  const draft = await made.json()
  try {
    const pdf = await fetch(state.api + '/callsheets/' + draft.id + '/pdf', {
      headers,
    })
    assert.equal(pdf.status, 200, await pdf.clone().text())
    const bytes = Buffer.from(await pdf.arrayBuffer())
    assert.equal(bytes.subarray(0, 4).toString(), '%PDF')
    const file = path.join(out, 'legacy-callsheet.pdf')
    fs.writeFileSync(file, bytes)
    const info = execFileSync('pdfinfo', [file]).toString()
    assert.match(info, /Pages:\s+[1-9]/)
    fs.writeFileSync(
      path.join(out, 'legacy-pdf.json'),
      JSON.stringify(
        {
          pass: true,
          bytes: bytes.length,
          engine: 'Existing unchanged pdflatex Call Sheet pipeline',
        },
        null,
        2,
      ),
    )
    console.log('PASS actual authenticated legacy Call Sheet PDF compilation')
  } finally {
    const removed = await fetch(state.api + '/callsheets/' + draft.id, {
      method: 'DELETE',
      headers,
    })
    assert.ok(removed.ok)
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
