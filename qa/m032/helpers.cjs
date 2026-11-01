const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict')
const runtime = process.env.M03_RUNTIME || '/tmp/m032/runtime',
  state = JSON.parse(fs.readFileSync(path.join(runtime, 'local-state.json'))),
  out = path.resolve('client/qa/m032/artifacts')
assert.equal(new URL(state.api).hostname, '127.0.0.1')
assert.equal(new URL(state.root).hostname, '127.0.0.1')
fs.mkdirSync(out, { recursive: true })
async function api(
  route,
  payload,
  user = '101',
  expected = payload === undefined ? 200 : 201,
) {
  const response = await fetch(state.api + '/shotlists' + route, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer ' + (state.tokens[user] || user),
      'Content-Type': 'application/json',
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })
  assert.equal(response.status, expected, await response.clone().text())
  return response.json()
}
async function create(name = 'M03.2 local QA', size = 8) {
  const list = await api('', { name })
  const fixture = require('../m03/fixtures.cjs')(crypto.randomUUID())
  if (size !== 8) {
    fixture.scenes = [
      {
        number: '16',
        title: 'Synthetic performance fixture',
        shots: Array.from({ length: size }, (_, i) => ({
          number: `16-${String(i + 1).padStart(4, '0')}`,
          camera: 'CAM A',
          framing: 'Wide',
          lens: '35mm',
          movement: 'Tracking',
          coverage:
            `Coverage ${i + 1}. ` +
            (i % 25 === 0
              ? 'Long action line. '.repeat(20)
              : 'The subject crosses the clearing.'),
          notes: 'Technical note',
          estimatedMinutes: '5',
          setupMinutes: '3',
          plannedTakes: '2',
        })),
      },
    ]
  }
  await api('/' + list.id + '/import', fixture)
  return list
}
async function until(fn, label, ms = 15000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    if (await fn()) return
    await new Promise((r) => setTimeout(r, 50))
  }
  throw Error('Timeout: ' + label)
}
async function join(id, user = '101') {
  const Y = require(path.join(runtime, 'client/node_modules/yjs')),
    { HocuspocusProvider, HocuspocusProviderWebsocket } = require(
      path.join(runtime, 'client/node_modules/@hocuspocus/provider'),
    ),
    WS = require(path.join(runtime, 'server/node_modules/ws'))
  class Socket extends WS {
    constructor(url) {
      super(url, { origin: new URL(state.root).origin })
    }
  }
  const doc = new Y.Doc()
  let synced = false
  const socket = new HocuspocusProviderWebsocket({
      url: state.api.replace('http', 'ws') + '/shotlists/collaboration',
      WebSocketPolyfill: Socket,
    }),
    provider = new HocuspocusProvider({
      websocketProvider: socket,
      name: id,
      token: state.tokens[user],
      document: doc,
      onSynced: ({ state }) => {
        synced = state
      },
    })
  await until(() => synced, 'Yjs sync')
  return {
    doc,
    provider,
    socket,
    close() {
      provider.destroy()
      socket.destroy()
      doc.destroy()
    },
  }
}
module.exports = { runtime, state, out, api, create, join, until }
