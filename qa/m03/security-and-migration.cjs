const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  { randomUUID } = require('node:crypto')
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research',
  state = JSON.parse(fs.readFileSync(path.join(runtime, 'local-state.json')))
const { DataSource } = require(
  path.join(runtime, 'server/node_modules/typeorm'),
)
const { ShotLists1793426400000 } = require(
  path.join(runtime, 'server-dist/shotlists/shotlists.migration'),
)
const { HocuspocusProvider, HocuspocusProviderWebsocket } = require(
  path.join(runtime, 'client/node_modules/@hocuspocus/provider'),
)
const Y = require(path.join(runtime, 'client/node_modules/yjs')),
  WebSocket = require(path.join(runtime, 'server/node_modules/ws'))
assert.equal(new URL(state.databaseUrl).hostname, '127.0.0.1')
const results = [],
  wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function api(route, body) {
  const r = await fetch(state.api + '/shotlists' + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer ' + state.tokens['101'],
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: r.status, data: await r.json() }
}
async function main() {
  const db = new DataSource({
    type: 'postgres',
    url: state.databaseUrl,
    synchronize: false,
  })
  await db.initialize()
  try {
    const q = db.createQueryRunner()
    await q.connect()
    const schema = 'qa_migration_' + randomUUID().replaceAll('-', '')
    await q.query(`CREATE SCHEMA ${schema}`)
    await q.query(`SET search_path TO ${schema}`)
    await q.query(
      'CREATE TABLE production_desk_callsheets(id text PRIMARY KEY,payload jsonb)',
    )
    await q.query(
      'CREATE TABLE production_desk_roster_people(id text PRIMARY KEY,payload jsonb)',
    )
    await q.query(
      `INSERT INTO production_desk_callsheets VALUES('sentinel','{"title":"preserve call sheet"}')`,
    )
    await q.query(
      `INSERT INTO production_desk_roster_people VALUES('sentinel','{"name":"preserve person"}')`,
    )
    const migration = new ShotLists1793426400000()
    await migration.up(q)
    const id = randomUUID()
    await q.query(
      "INSERT INTO shot_list_documents(id,name,owner_user_id,state) VALUES($1,'rollback fixture',101,$2)",
      [id, Buffer.from(Y.encodeStateAsUpdate(new Y.Doc()))],
    )
    await migration.down(q)
    assert.deepEqual(
      (await q.query('SELECT payload FROM production_desk_callsheets'))[0]
        .payload,
      { title: 'preserve call sheet' },
    )
    assert.deepEqual(
      (await q.query('SELECT payload FROM production_desk_roster_people'))[0]
        .payload,
      { name: 'preserve person' },
    )
    await q.query('SET search_path TO public')
    await q.query(`DROP SCHEMA ${schema} CASCADE`)
    await q.release()
    results.push({
      name: 'Additive migration up/down preserves pre-existing call-sheet and roster sentinel rows in a disposable PostgreSQL schema',
      pass: true,
    })
    const list = (await api('', { name: 'Security integration fixture' })).data
    const before = await api('/' + list.id + '/export')
    const bad = await api('/' + list.id + '/import', {
      batchId: randomUUID(),
      scenes: [
        {
          number: '1',
          shots: [
            { number: '1.1', coverage: 'valid before invalid' },
            { number: 9.1, coverage: 'must reject' },
          ],
        },
      ],
    })
    assert.equal(bad.status, 400)
    assert.deepEqual((await api('/' + list.id + '/export')).data, before.data)
    results.push({
      name: 'Invalid mixed import is rejected before any scene or shot mutation',
      pass: true,
    })
    class Socket extends WebSocket {
      constructor(url) {
        super(url, { origin: 'http://127.0.0.1:5175' })
      }
    }
    const socket = new HocuspocusProviderWebsocket({
      url: 'ws://127.0.0.1:4310/api/shotlists/collaboration',
      WebSocketPolyfill: Socket,
    })
    let closed = false
    const p = new HocuspocusProvider({
      websocketProvider: socket,
      name: list.id,
      document: new Y.Doc(),
      token: state.tokens['102'],
      onClose: () => {
        closed = true
      },
    })
    p.setAwarenessField('user', { name: 'Revocation test' })
    for (let i = 0; i < 100 && !p.synced; i++) await wait(100)
    assert.ok(p.synced)
    await fetch('http://127.0.0.1:4311/qa/team/revoke/102', { method: 'POST' })
    for (let i = 0; i < 330 && !closed; i++) await wait(100)
    assert.ok(
      closed,
      'An idle revoked member must be disconnected within the periodic authorization window',
    )
    p.destroy()
    socket.destroy()
    await fetch('http://127.0.0.1:4311/qa/team/restore/102', { method: 'POST' })
    results.push({
      name: 'An already connected, idle collaborator is disconnected after centralized production-team membership revocation',
      pass: true,
    })
    for (const [suffix, origin] of [
      ['?token=must-not-be-in-url', 'http://127.0.0.1:5175'],
      ['', 'https://unapproved.example.test'],
    ]) {
      const ws = new WebSocket(
        'ws://127.0.0.1:4310/api/shotlists/collaboration' + suffix,
        { origin },
      )
      let status
      await new Promise((resolve) => {
        ws.on('unexpected-response', (_, res) => {
          status = res.statusCode
          res.destroy()
          resolve()
        })
        ws.on('error', resolve)
      })
      assert.equal(status, 403)
      ws.terminate()
    }
    results.push({
      name: 'WebSocket upgrade rejects unapproved origins and URL credentials',
      pass: true,
    })
  } finally {
    await db.destroy()
  }
  fs.writeFileSync(
    'client/qa/m03/artifacts/security-and-migration.json',
    JSON.stringify(results, null, 2) + '\n',
  )
  for (const r of results) console.log('PASS', r.name)
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
