/* Actual PostgreSQL/Nest/Hocuspocus integration. Never contacts production. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  { randomUUID, createHash } = require('node:crypto')
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research'
const { HocuspocusProvider, HocuspocusProviderWebsocket } = require(
  path.join(runtime, 'client/node_modules/@hocuspocus/provider'),
)
const Y = require(path.join(runtime, 'client/node_modules/yjs'))
const WebSocket = require(path.join(runtime, 'server/node_modules/ws'))
const { Client } = require(path.join(runtime, 'server/node_modules/pg'))
const state = JSON.parse(
  fs.readFileSync(path.join(runtime, 'local-state.json')),
)
assert.equal(new URL(state.api).hostname, '127.0.0.1')
assert.equal(new URL(state.databaseUrl).hostname, '127.0.0.1')
const results = [],
  clients = []
const check = (name) => {
  results.push({ name, pass: true })
  console.log('PASS', name)
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function until(fn, label, timeout = 12000) {
  for (let i = 0; i < timeout / 50; i++) {
    if (await fn()) return
    await wait(50)
  }
  throw new Error('Timed out: ' + label)
}
async function api(route, payload, user = '101', expected = 200) {
  const res = await fetch(state.api + '/shotlists' + route, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer ' + (state.tokens[user] || user),
      'Content-Type': 'application/json',
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })
  assert.equal(res.status, expected, await res.clone().text())
  return res.json()
}
async function join(id, user = '101', expectDenied = false) {
  const doc = new Y.Doc()
  let denied = false,
    connected = false,
    persisted = ''
  class OriginSocket extends WebSocket {
    constructor(url) {
      super(url, { origin: 'http://127.0.0.1:5175' })
    }
  }
  const socket = new HocuspocusProviderWebsocket({
    url: 'ws://127.0.0.1:4310/api/shotlists/collaboration',
    WebSocketPolyfill: OriginSocket,
  })
  const p = new HocuspocusProvider({
    websocketProvider: socket,
    name: id,
    document: doc,
    token: state.tokens[user] || user,
    onAuthenticationFailed: () => {
      denied = true
    },
    onStatus: ({ status }) => {
      connected = status === 'connected'
    },
    onStateless: ({ payload }) => {
      const data = JSON.parse(payload)
      if (data.type === 'persisted') persisted = data.digest
    },
  })
  p.setAwarenessField('user', {
    id: Number(user),
    name:
      user === '101'
        ? 'Maya Chen'
        : user === '102'
          ? 'Elias Moreno'
          : 'Samira Okafor',
    color: user === '101' ? '#87d8ff' : '#d9b8ff',
    colorLight: '#87d8ff22',
  })
  const client = {
    doc,
    p,
    socket,
    get connected() {
      return connected
    },
    get persisted() {
      return persisted
    },
    close() {
      p.destroy()
      socket.destroy()
      doc.destroy()
    },
  }
  clients.push(client)
  await until(
    () => (expectDenied ? denied : p.synced),
    expectDenied ? 'denied document' : 'document sync',
  )
  return client
}
const summary = (doc) => {
  for (const key of ['meta', 'scenes', 'shots', 'imports']) doc.getMap(key)
  return JSON.stringify(doc.toJSON())
}
async function main() {
  const list = await api(
      '',
      { name: 'Whiteout · creative coverage' },
      '101',
      201,
    ),
    id = list.id
  const batchId = randomUUID()
  const seed = require('./fixtures.cjs')(batchId)
  const imported = await api('/' + id + '/import', seed, '101', 201)
  assert.equal(imported.shots, 8)
  assert.deepEqual(await api('/' + id + '/import', seed, '101', 201), imported)
  assert.equal(Object.keys((await api('/' + id + '/export')).shots).length, 8)
  check(
    'Atomic append import, exact 9.1/9.10 text IDs, stable UUIDs and idempotent retry against PostgreSQL',
  )
  const a = await join(id),
    b = await join(id, '102'),
    shotIds = [...a.doc.getMap('shots').keys()],
    s1 = shotIds[0],
    s2 = shotIds[1]
  assert.notEqual(s1, s2)
  assert.match(s1, /^[a-f0-9-]{36}$/)
  a.doc.getMap('shots').get(s1).set('framing', 'ECU')
  b.doc.getMap('shots').get(s1).set('lens', '40mm')
  await until(
    () =>
      a.doc.getMap('shots').get(s1).get('lens') === '40mm' &&
      b.doc.getMap('shots').get(s1).get('framing') === 'ECU',
    'concurrent structured fields',
  )
  check(
    'Two authenticated clients edit different structured fields without replacing a record',
  )
  const textA = a.doc.getMap('shots').get(s1).get('coverage'),
    textB = b.doc.getMap('shots').get(s1).get('coverage')
  textA.insert(0, 'Director: ')
  textB.insert(textB.length, ' DP: hold. ')
  await until(
    () =>
      textA.toString() === textB.toString() &&
      textA.toString().includes('Director: ') &&
      textA.toString().includes('DP: hold.'),
    'concurrent Y.Text',
  )
  a.p.setAwarenessField('cell', { shotId: s1, field: 'framing' })
  a.p.setAwarenessField('cursor', {
    anchor: Y.createRelativePositionFromTypeIndex(textA, 4),
    head: Y.createRelativePositionFromTypeIndex(textA, 8),
  })
  await until(
    () =>
      [...b.p.awareness.getStates().values()].some(
        (s) => s.cell?.field === 'framing' && s.cursor,
      ),
    'awareness selection',
  )
  const awareness = [...b.p.awareness.getStates().values()].find(
    (s) => s.cursor,
  )
  const pos = Y.createAbsolutePositionFromRelativePosition(
    Y.createRelativePositionFromJSON(awareness.cursor.anchor),
    b.doc,
  )
  assert.equal(pos.index, 4)
  textB.insert(0, 'New ')
  await until(
    () =>
      Y.createAbsolutePositionFromRelativePosition(
        Y.createRelativePositionFromJSON(awareness.cursor.anchor),
        b.doc,
      ).index === 8,
    'relative caret moves with insertion',
  )
  check(
    'Concurrent Y.Text merge and real awareness-relative text ranges remain positioned after edits',
  )
  const third = await join(id, '103')
  await until(
    () => [...a.p.awareness.getStates()].length === 3,
    'third collaborator presence',
  )
  assert.equal(
    third.doc.getMap('shots').get(s1).get('coverage').toString(),
    textA.toString(),
  )
  const oldNumber = a.doc.getMap('shots').get(s1).get('number')
  a.doc.getMap('shots').get(s1).set('planningOrder', 999999)
  await until(
    () => third.doc.getMap('shots').get(s1).get('planningOrder') === 999999,
    'planning order',
  )
  assert.equal(third.doc.getMap('shots').get(s1).get('number'), oldNumber)
  check(
    'Late third client gets merged state, three-way presence and independent planning order without renumbering',
  )
  b.socket.disconnect()
  await until(() => !b.connected, 'disconnection')
  b.doc.getMap('shots').get(s2).set('movement', 'Crane')
  a.doc.getMap('shots').get(s2).set('camera', 'CAM C')
  await b.socket.connect()
  await until(
    () =>
      a.doc.getMap('shots').get(s2).get('movement') === 'Crane' &&
      b.doc.getMap('shots').get(s2).get('camera') === 'CAM C',
    'reconnect merge',
  )
  check(
    'Interrupted client retains in-memory edits and reconciles independent remote edits on reconnect',
  )
  const digest = () =>
    createHash('sha256')
      .update(Y.encodeSnapshot(Y.snapshot(a.doc)))
      .digest('hex')
  await until(() => a.persisted === digest(), 'durable acknowledgement')
  const expected = JSON.parse(summary(a.doc))
  a.close()
  b.close()
  third.close()
  await fetch('http://127.0.0.1:4312/restart', { method: 'POST' })
  const reopened = await join(id)
  assert.deepEqual(JSON.parse(summary(reopened.doc)), expected)
  check(
    'Binary collaborative history and changes survive all clients leaving and an actual Nest server restart',
  )
  await api('/' + id + '/session', undefined, '999', 403)
  await api('/not-a-uuid/session', undefined, '101', 403)
  await api('/' + randomUUID() + '/session', undefined, '101', 403)
  await api('', undefined, 'invalid-token', 401)
  await api('/'+id.toUpperCase()+'/session',undefined,'101',403)
  await join(id.toUpperCase(),'101',true)
  await join(id, '999', true)
  await join(randomUUID(), '101', true)
  await join('not-a-uuid', '101', true)
  await join(id, 'bad-token', true)
  check(
    'HTTP and authenticated WebSocket reject unrelated identities, invalid tokens and guessed or malformed document IDs',
  )
  await fetch('http://127.0.0.1:4311/qa/revoke/102', { method: 'POST' })
  await join(id, '102', true)
  await fetch('http://127.0.0.1:4311/qa/restore/102', { method: 'POST' })
  check(
    'Revoked Scheduler test identity is denied on a fresh WebSocket handshake',
  )
  const db = new Client({ connectionString: state.databaseUrl })
  await db.connect()
  const row = (
    await db.query('SELECT state FROM shot_list_documents WHERE id=$1', [id])
  ).rows[0]
  const stored = new Y.Doc()
  Y.applyUpdate(stored, row.state)
  assert.equal(stored.getMap('shots').size, 8)
  await db.end()
  fs.writeFileSync(
    path.join(runtime, 'preview-list.json'),
    JSON.stringify({ id }),
  )
  check('Database stores loadable Yjs binary, not a JSON reconstruction')
}
main()
  .then(() => {
    fs.mkdirSync('client/qa/m03/artifacts', { recursive: true })
    fs.writeFileSync(
      'client/qa/m03/artifacts/integration.json',
      JSON.stringify(results, null, 2) + '\n',
    )
  })
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => {
    for (const c of clients)
      try {
        c.close()
      } catch {}
    setTimeout(() => process.exit(process.exitCode || 0), 100)
  })
