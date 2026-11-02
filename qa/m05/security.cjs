const fs = require('fs'),
  assert = require('assert/strict'),
  crypto = require('crypto'),
  runtime = '/tmp/m032/runtime',
  state = JSON.parse(fs.readFileSync(runtime + '/local-state.json')),
  fixture = JSON.parse(fs.readFileSync('/tmp/m05/fixture.json')),
  Y = require(runtime + '/client/node_modules/yjs'),
  { HocuspocusProvider, HocuspocusProviderWebsocket } = require(
    runtime + '/client/node_modules/@hocuspocus/provider',
  ),
  WS = require(runtime + '/server/node_modules/ws'),
  { join, until } = require('../m04/collaboration.cjs'),
  base = 'http://127.0.0.1:4314/api/flows',
  headers = {
    Authorization: 'Bearer ' + state.tokens['101'],
    'Content-Type': 'application/json',
  }
async function get(p, b) {
  const r = await fetch(base + p, {
    method: b === undefined ? 'GET' : 'POST',
    headers,
    body: b === undefined ? undefined : JSON.stringify(b),
  })
  assert(r.ok, await r.clone().text())
  return r.headers.get('content-type').includes('pdf')
    ? Buffer.from(await r.arrayBuffer())
    : r.json()
}
;(async () => {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Error('Unauthorized WebSocket was not rejected')),
      7000,
    )
    class Socket extends WS {
      constructor(url) {
        super(url, { origin: 'http://127.0.0.1:5176' })
      }
    }
    const socket = new HocuspocusProviderWebsocket({
      url: 'ws://127.0.0.1:4314/api/flows/collaboration',
      WebSocketPolyfill: Socket,
    })
    const p = new HocuspocusProvider({
      websocketProvider: socket,
      name: fixture.id,
      token: state.tokens['999'],
      document: new Y.Doc(),
      onAuthenticationFailed: () => {
        clearTimeout(timer)
        p.destroy()
        socket.destroy()
        resolve()
      },
    })
  })
  const copy = await get('/' + fixture.id + '/manage', { action: 'duplicate' }),
    a = await join(copy.id, '101', 'flows')
  try {
    const first = [...a.doc.getMap('events').values()][0],
      id = first.get('id')
    let closed = 0
    a.provider.on('close', ({ event }) => (closed = event.code))
    first.set('duration', -5)
    await until(() => closed === 4400, 'invalid CRDT update rejected')
    const clean = await get('/' + copy.id + '/snapshot')
    assert.notEqual(clean.state.events[id].duration, -5)
  } finally {
    a.close()
  }
  const current = await get('/' + fixture.id + '/snapshot'),
    spec = {
      product: 'master',
      paper: 'letter',
      orientation: 'landscape',
      departments: Object.keys(current.state.departments),
      style: 'color',
      actual: false,
      personnel: true,
      notes: true,
    },
    pdf = await get('/' + fixture.id + '/pdf', spec)
  const canonical = (v) =>
      Array.isArray(v)
        ? v.map(canonical)
        : v && typeof v === 'object'
          ? Object.fromEntries(
              Object.keys(v)
                .sort()
                .map((k) => [k, canonical(v[k])]),
            )
          : v,
    key = crypto
      .createHash('sha256')
      .update(JSON.stringify(canonical({ state: current, settings: spec })))
      .digest('hex')
  const artifact = await get('/' + fixture.id + '/prints/' + key)
  assert.deepEqual(artifact, pdf)
  const forbidden = await fetch(base + '/' + fixture.id + '/prints/' + key, {
    headers: { Authorization: 'Bearer ' + state.tokens['999'] },
  })
  assert.equal(forbidden.status, 403)
  const client = await join(fixture.id, '101', 'flows')
  try {
    client.doc.getMap('meta').set('status', 'ready')
    await new Promise((r) => setTimeout(r, 500))
    assert.deepEqual(await get('/' + fixture.id + '/prints/' + key), pdf)
    client.doc.getMap('meta').set('status', current.state.meta.status)
  } finally {
    client.close()
  }
  const noOrigin = new WS('ws://127.0.0.1:4314/api/flows/collaboration', {
    origin: 'https://unapproved.invalid',
  })
  await new Promise((resolve, reject) => {
    noOrigin.once('unexpected-response', (_, response) => {
      assert.equal(response.statusCode, 403)
      response.destroy()
      noOrigin.terminate()
      resolve()
    })
    noOrigin.once('error', () => {})
    setTimeout(() => reject(Error('Origin test timeout')), 5000).unref()
  })
  console.log(
    'Unverified WebSocket denial, origin enforcement, malformed negative-duration update rejected before live/durable mutation, private immutable PDF authorization and byte-identical historical artifact after edits passed.',
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
