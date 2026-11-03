const fs = require('fs'),
  assert = require('assert/strict'),
  runtime = '/tmp/m032/runtime',
  s = JSON.parse(fs.readFileSync(runtime + '/local-state.json')),
  { join, until } = require('../m04/collaboration.cjs'),
  { HocuspocusProvider, HocuspocusProviderWebsocket } = require(runtime +
    '/client/node_modules/@hocuspocus/provider'),
  Y = require(runtime + '/client/node_modules/yjs'),
  WS = require(runtime + '/server/node_modules/ws'),
  fixture = JSON.parse(
    fs.readFileSync('/tmp/m05/corrections/fixture.json'),
  ),
  flow = JSON.parse(
    fs.readFileSync('/tmp/m05/corrections/chromium/flow.json'),
  ),
  base = 'http://127.0.0.1:4314/api'
async function get(path, user = 101, body) {
  return fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: 'Bearer ' + s.tokens[String(user)],
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}
async function denied(collection, id, user) {
  await new Promise((resolve, reject) => {
    class Socket extends WS {
      constructor(url) {
        super(url, { origin: 'http://127.0.0.1:5176' })
      }
    }
    const sock = new HocuspocusProviderWebsocket({
        url: 'ws://127.0.0.1:4314/api/' + collection + '/collaboration',
        WebSocketPolyfill: Socket,
      }),
      d = new Y.Doc(),
      timer = setTimeout(() => {
        p.destroy()
        sock.destroy()
        d.destroy()
        reject(Error('Denied WS admitted'))
      }, 7000),
      p = new HocuspocusProvider({
        websocketProvider: sock,
        name: id,
        token: s.tokens[String(user)],
        document: d,
        onAuthenticationFailed: () => {
          clearTimeout(timer)
          p.destroy()
          sock.destroy()
          d.destroy()
          resolve()
        },
      })
  })
}
;(async () => {
  const board = await (
      await get('/storyboards', 101, {
        id: crypto.randomUUID(),
        name: 'Disposable permission acceptance',
      })
    ).json(),
    snapshot = await (await get('/flows/' + flow.id + '/snapshot')).json(),
    spec = {
      product: 'master',
      paper: 'letter',
      orientation: 'landscape',
      style: 'mono',
      departments: Object.keys(snapshot.state.departments),
      actual: false,
      personnel: true,
      notes: true,
    }
  for (const user of [101, 103, 108, 102, 112, 113, 114, 109]) {
    for (const route of [
      '/shotlists',
      '/storyboards',
      '/flows',
      '/callsheets',
      '/roster',
    ]) {
      const r = await get(route, user)
      assert.equal(
        r.status,
        200,
        user + ' ' + route + ' ' + (await r.text()),
      )
    }
    for (const [c, id] of [
      ['shotlists', fixture.listId],
      ['storyboards', board.id],
      ['flows', flow.id],
    ]) {
      const r = await get('/' + c + '/' + id + '/session', user)
      assert.equal(r.status, 200, await r.text())
      const socket = await join(id, String(user), c)
      socket.close()
    }
  }
  for (const user of [999, 110, 115]) {
    for (const path of [
      '/shotlists',
      '/storyboards',
      '/flows',
      '/callsheets',
      '/roster',
    ])
      assert.equal((await get(path, user)).status, 403)
    assert.equal(
      (await get('/flows/' + flow.id + '/pdf', user, spec)).status,
      403,
    )
    assert.equal(
      (await get('/flows/' + flow.id + '/department-pack', user, spec))
        .status,
      403,
    )
    for (const [c, id] of [
      ['shotlists', fixture.listId],
      ['storyboards', board.id],
      ['flows', flow.id],
    ])
      await denied(c, id, user)
  }
  assert.equal((await fetch(base + '/flows')).status, 401)
  const active = await join(flow.id, '112', 'flows')
  let closed = 0
  active.provider.on('close', ({ event }) => (closed = event.code))
  try {
    await fetch('http://127.0.0.1:4311/qa/team/revoke/112', {
      method: 'POST',
    })
    assert.equal((await get('/flows', 112)).status, 403)
    await until(
      () => closed === 4403,
      'active membership revocation',
      45000,
    )
  } finally {
    await fetch('http://127.0.0.1:4311/qa/team/restore/112', {
      method: 'POST',
    })
    active.close()
  }
  const {
      verifiedMembership,
    } = require('/tmp/whiteout-membership-scheduler/build/src/users/production-membership'),
    u = {
      ID: 117,
      Email: 'crew@whiteout.invalid',
      Department: 'Creative',
      Role: 'Camera Operator',
    },
    record = {
      version: 1,
      status: 'verified',
      userID: 117,
      email: u.Email,
      department: 'Creative',
      role: 'Director',
      verifiedAt: '2026-11-02T12:00:00Z',
      verifiedBy: 'Independent producer',
      evidence: 'Approved production crew identity',
    }
  assert(
    verifiedMembership(JSON.stringify(record), u),
    'Changing a profile title does not erase an approved team identity',
  )
  assert.equal(
    verifiedMembership(
      JSON.stringify({ ...record, status: 'revoked' }),
      u,
    ),
    null,
  )
  assert.equal(
    verifiedMembership(JSON.stringify({ ...record, userID: 118 }), u),
    null,
  )
  console.log(
    'Director, 1st/2nd AD, DP, Camera, Storyboard Artist, Costume and Actor verified-member HTTP/WS access; unverified, revoked, foreign-production, anonymous/export denial; live socket revocation and profile-title-independent verification passed.',
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
