const { state, out, api, create, join } = require('../m032/helpers.cjs'),
  fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict'),
  { execFileSync } = require('node:child_process')
;(async () => {
  const list = await create('Direct PDF edge cases ' + crypto.randomUUID()),
    peer = await join(list.id)
  const shot = [...peer.doc.getMap('shots').values()][0],
    id = shot.get('id'),
    coverage = shot.get('coverage')
  const long = 'Long coverage Café Δ. '.repeat(700) + ' ENDLONGCOVERAGE'
  peer.doc.transact(() => {
    coverage.delete(0, coverage.length)
    coverage.insert(0, long)
  })
  await new Promise((r) => setTimeout(r, 1800))
  peer.close()
  const columns = [
      { field: 'number', width: 106 },
      { field: 'coverage', width: 330 },
      { field: 'camera', width: 104 },
    ],
    base = {
      version: 2,
      scope: 'selected',
      layout: 'table',
      rows: [{ shotId: id }],
      columns,
      paper: 'letter',
      orientation: 'landscape',
      margins: 'normal',
      scaling: 'fit-width',
      text: 'wrap',
      groupScenes: true,
    }
  for (const [name, spec, status] of [
    [
      'narrow',
      {
        ...base,
        columns: [
          ...columns,
          { field: 'lens', width: 1200 },
          { field: 'movement', width: 1200 },
          { field: 'framing', width: 1200 },
        ].map((c) => ({
          ...c,
          width: c.field === 'number' ? 40 : 1200,
        })),
      },
      400,
    ],
    [
      'wide-identity',
      {
        ...base,
        scaling: 'actual',
        text: 'single-line',
        columns: columns.map((c) => ({
          ...c,
          width: c.field === 'number' ? 1200 : c.width,
        })),
      },
      201,
    ],
  ]) {
    const r = await fetch(state.api + '/shotlists/' + list.id + '/pdf', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + state.tokens[101],
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(spec),
    })
    assert.equal(r.status, status, await r.clone().text())
    if (status === 201)
      fs.writeFileSync(
        path.join(out, 'completion-edge-' + name + '.pdf'),
        Buffer.from(await r.arrayBuffer()),
      )
    else assert.match(await r.text(), /too narrow/)
    console.log('PASS deliberate extreme column widths', name)
  }
  for (const mode of ['wrap', 'single-line']) {
    const r = await fetch(state.api + '/shotlists/' + list.id + '/pdf', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + state.tokens[101],
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...base, text: mode }),
    })
    assert.equal(r.status, 201, await r.clone().text())
    const file = path.join(out, 'completion-edge-' + mode + '.pdf')
    fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()))
    const text = execFileSync('pdftotext', [file, '-']).toString()
    if (mode === 'wrap') {
      assert.ok(text.includes('ENDLONGCOVERAGE'))
      assert.equal((text.match(/Café/g) || []).length, 700)
    } else {
      assert.ok(text.includes('One-line preview'))
      assert.ok(!text.includes('ENDLONGCOVERAGE'))
    }
    console.log(
      'PASS',
      mode,
      'complete tall-row slices / deliberate measured truncation',
    )
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
