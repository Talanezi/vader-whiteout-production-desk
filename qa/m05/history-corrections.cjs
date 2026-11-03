// Controlled time, real disposable PostgreSQL records; no production endpoint.
const fs = require('fs'),
  assert = require('assert/strict'),
  crypto = require('crypto')
process.env.NODE_PATH =
  '/tmp/m032/runtime/server/node_modules:/tmp/m032/runtime/client/node_modules'
require('module').Module._initPaths()
const Y = require('yjs'),
  { Pool } = require('pg'),
  {
    FlowsService,
  } = require('/tmp/m032/runtime/server-dist/flows/flows.service'),
  { join, until } = require('../m04/collaboration.cjs')
const auth = JSON.parse(
    fs.readFileSync('/tmp/m032/runtime/local-state.json'),
  ),
  headers = {
    Authorization: 'Bearer ' + auth.tokens['101'],
    'Content-Type': 'application/json',
  },
  base = 'http://127.0.0.1:4314/api/flows'
async function req(p, b) {
  const r = await fetch(base + p, {
    method: b ? 'POST' : 'GET',
    headers,
    body: b && JSON.stringify(b),
  })
  assert(r.ok, await r.clone().text())
  return r.json()
}
;(async () => {
  const id = crypto.randomUUID()
  await req('', { id, name: 'Disposable automatic history contract' })
  const a = await join(id, '101', 'flows'),
    b = await join(id, '102', 'flows'),
    pool = new Pool({
      connectionString:
        'postgresql://whiteout_qa:local-qa-only@127.0.0.1:55432/whiteout_m04',
    }),
    svc = new FlowsService(
      { query: async (q, p) => (await pool.query(q, p)).rows },
      {},
      {},
    )
  try {
    await svc.autoCheckpoint(id, a.doc)
    await svc.autoCheckpoint(id, a.doc)
    assert.equal((await req('/' + id + '/revisions')).items.length, 0)
    a.doc.getMap('meta').set('name', 'Changed checkpoint title')
    svc.historyClock.get(id).at -= 301000
    await Promise.all(
      Array.from({ length: 4 }, () => svc.autoCheckpoint(id, a.doc)),
    )
    let revisions = (await req('/' + id + '/revisions')).items
    assert.equal(revisions.length, 1)
    assert.equal(revisions[0].summary, 'Automatic checkpoint')
    svc.historyClock.get(id).at -= 301000
    await svc.autoCheckpoint(id, a.doc)
    assert.equal((await req('/' + id + '/revisions')).items.length, 1)
    a.doc.getMap('meta').set('name', 'Later meaningful change')
    await until(
      () => b.doc.getMap('meta').get('name') === 'Later meaningful change',
      'collaboration',
    )
    await new Promise((r) => setTimeout(r, 400))
    await req('/' + id + '/manage', {
      action: 'restoreRevision',
      revisionId: revisions[0].id,
    })
    await until(
      () =>
        a.doc.getMap('meta').get('name') === 'Changed checkpoint title',
      'safe restore',
    )
    revisions = (await req('/' + id + '/revisions')).items
    assert.equal(revisions.length, 2)
    assert(revisions.some((r) => r.summary === 'Before restoration'))
    const printed = await pool.query(
      'select count(*)::int as count, coalesce(sum(octet_length(pdf)),0)::int as bytes from flow_prints where document_id=$1',
      [
        JSON.parse(
          fs.readFileSync('/tmp/m05/corrections/chromium/flow.json'),
        ).id,
      ],
    )
    assert.equal(printed.rows[0].bytes, 0)
    assert(printed.rows[0].count > 0)
    console.log(
      'Real database automatic checkpoint at five-minute boundary; no idle/duplicate concurrent checkpoint; two-client edit; recoverable restore; generated exports store metadata and zero PDF bytes passed.',
    )
  } finally {
    a.close()
    b.close()
    await pool.end()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
