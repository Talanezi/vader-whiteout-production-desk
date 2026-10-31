/* Real local HTTP/WebSocket + actual Scheduler registry code. No production access. */
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  { randomUUID } = require('node:crypto')
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research'
const scheduler =
  process.env.M03_SCHEDULER_RUNTIME || '/tmp/whiteout-membership-scheduler'
const state = JSON.parse(
  fs.readFileSync(path.join(runtime, 'local-state.json')),
)
assert.equal(new URL(state.api).hostname, '127.0.0.1')
assert.equal(new URL(state.databaseUrl).hostname, '127.0.0.1')
const { DataSource } = require(path.join(scheduler, 'node_modules/typeorm'))
const Dbconfig = require(
  path.join(scheduler, 'build/src/dbconfig/dbconfig.entity'),
).default
const Naming = require(
  path.join(scheduler, 'build/src/lower-case-naming-strategy'),
).default
const { manageProductionMembership } = require(
  path.join(scheduler, 'build/src/users/production-membership-admin'),
)
const { verifiedMembership, membershipKey } = require(
  path.join(scheduler, 'build/src/users/production-membership'),
)
const { HocuspocusProvider, HocuspocusProviderWebsocket } = require(
  path.join(runtime, 'client/node_modules/@hocuspocus/provider'),
)
const Y = require(path.join(runtime, 'client/node_modules/yjs')),
  WS = require(path.join(runtime, 'server/node_modules/ws'))
const results = [],
  clients = []
const pass = (name) => {
  results.push({ name, pass: true })
  console.log('PASS', name)
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function until(fn) {
  for (let i = 0; i < 120; i++) {
    if (await fn()) return
    await wait(100)
  }
  throw Error('Timed out')
}
async function api(route, user = '101', body, status = 200) {
  const r = await fetch(state.api + '/shotlists' + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer ' + state.tokens[user],
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  assert.equal(r.status, status, await r.clone().text())
  return r.json()
}
async function join(id, user, denied = false) {
  class Socket extends WS {
    constructor(url) {
      super(url, { origin: 'http://127.0.0.1:5175' })
    }
  }
  const socket = new HocuspocusProviderWebsocket({
    url: 'ws://127.0.0.1:4310/api/shotlists/collaboration',
    WebSocketPolyfill: Socket,
  })
  let refused = false
  const doc = new Y.Doc(),
    p = new HocuspocusProvider({
      websocketProvider: socket,
      name: id,
      document: doc,
      token: state.tokens[user],
      onAuthenticationFailed: () => (refused = true),
    })
  clients.push({ p, socket, doc })
  await until(() => (denied ? refused : p.synced))
  return { p, socket, doc }
}
async function main() {
  const root = new DataSource({ type: 'postgres', url: state.databaseUrl })
  await root.initialize()
  const schema = 'qa_team_' + randomUUID().replaceAll('-', '')
  await root.query(`CREATE SCHEMA ${schema}`)
  const db = new DataSource({
    type: 'postgres',
    url: state.databaseUrl,
    schema,
    namingStrategy: new Naming(),
    entities: [Dbconfig],
    synchronize: false,
    extra: { options: `-c search_path=${schema}` },
  })
  await db.initialize()
  try {
    await db.query(
      `CREATE TABLE ${schema}."user"(id integer PRIMARY KEY,email text NOT NULL,department text,role text)`,
    )
    await db.query(
      `CREATE TABLE ${schema}.config(key varchar PRIMARY KEY,value varchar NOT NULL)`,
    )
    await db.query(
      `INSERT INTO ${schema}."user" VALUES(1,'person@example.test','Creative','Director')`,
    )
    const identity = {
      ID: 1,
      Email: 'person@example.test',
      Department: 'Creative',
      Role: 'Director',
    }
    const repo = db.getRepository(Dbconfig),
      read = async () =>
        (await repo.findOneBy({ Key: membershipKey(1) }))?.Value || null
    assert.equal(verifiedMembership(await read(), identity), null)
    const input = {
      action: 'verify',
      email: identity.Email,
      department: 'Creative',
      role: 'Director',
      actor: 'Trusted producer',
      evidence: 'Independent crew contract checked',
    }
    await assert.rejects(() =>
      manageProductionMembership(db, { ...input, evidence: '' }),
    )
    await assert.rejects(() =>
      manageProductionMembership(db, {
        ...input,
        role: 'Producer',
        department: 'Production',
      }),
    )
    await manageProductionMembership(db, input)
    const UsersService = require(
      path.join(scheduler, 'build/src/users/users.service'),
    ).default
    const { UsersController } = require(
      path.join(scheduler, 'build/src/users/users.controller'),
    )
    const service = new UsersService({ get: () => 'postgres' }, null, null, {
      get: async (key) => (await repo.findOneBy({ Key: key }))?.Value || null,
    })
    const controller = new UsersController(null, service, null)
    const response = await controller.getUserInfo({
      ...identity,
      Name: 'Verified crew',
      IsSubscribedToNotifications: false,
    })
    assert.equal(response.department, 'Creative')
    assert.equal(response.role, 'Director')
    assert.equal(response.productionMembership.verified, true)
    assert.equal(response.productionMembership.evidence, undefined)
    const { ValidationPipe } = require(
      path.join(scheduler, 'node_modules/@nestjs/common'),
    )
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
    const Signup = require(
      path.join(scheduler, 'build/src/auth/local-signup.dto'),
    ).default
    const Edit = require(
      path.join(scheduler, 'build/src/users/edit-user.dto'),
    ).default
    await assert.rejects(() =>
      pipe.transform(
        {
          name: 'Attacker',
          email: 'attacker@example.test',
          password: 'safe-password',
          department: 'Creative',
          role: 'Director',
          productionMembership: response.productionMembership,
        },
        { type: 'body', metatype: Signup },
      ),
    )
    await assert.rejects(() =>
      pipe.transform(
        { productionMembership: response.productionMembership },
        { type: 'body', metatype: Edit },
      ),
    )
    pass(
      'Actual Scheduler /api/me response includes protected membership; signup and profile DTOs reject injected verification claims',
    )
    const raw = await read()
    assert.equal(verifiedMembership(raw, identity).verified, true)
    for (const altered of [
      { ...identity, ID: 2 },
      { ...identity, Email: 'other@example.test' },
      { ...identity, Role: 'Director of Photography' },
      { ...identity, Department: 'Production' },
    ])
      assert.equal(verifiedMembership(raw, altered), null)
    for (const raw of [
      null,
      'broken',
      '{}',
      JSON.stringify({ ...JSON.parse(await read()), verifiedBy: '' }),
    ])
      assert.equal(verifiedMembership(raw, identity), null)
    await manageProductionMembership(db, { ...input, action: 'revoke' })
    assert.equal(verifiedMembership(await read(), identity), null)
    assert.equal(await repo.count(), 3) // current record + append-only verify/revoke evidence records
    await db.query(`DELETE FROM ${schema}."user" WHERE id=1`)
    await db.query(
      `INSERT INTO ${schema}."user" VALUES(2,'person@example.test','Creative','Director')`,
    )
    assert.equal(verifiedMembership(raw, { ...identity, ID: 2 }), null)
    pass(
      'Actual Scheduler registry: independent verification/evidence required; account/assignment binding, revoke, audit and recreated-account denial',
    )
  } finally {
    await db.destroy()
    await root.query(`DROP SCHEMA ${schema} CASCADE`)
  }
  try {
    const id = randomUUID(),
      doc = new Y.Doc()
    doc.getMap('meta').set('name', 'Existing member-scoped document')
    await root.query(
      'INSERT INTO shot_list_documents(id,name,owner_user_id,state) VALUES($1,$2,101,$3)',
      [
        id,
        'Existing member-scoped document',
        Buffer.from(Y.encodeStateAsUpdate(doc)),
      ],
    )
    doc.destroy()
    await root.query('INSERT INTO shot_list_members VALUES($1,101)', [id])
    for (const user of [
      '101',
      '102',
      '103',
      '104',
      '105',
      '106',
      '107',
      '108',
    ]) {
      assert.ok((await api('', user)).items.some((x) => x.id === id))
      await api('/' + id + '/session', user)
      await api('/' + id + '/export', user)
      const created = await api(
        '',
        user,
        { name: 'Eligible role ' + user },
        201,
      )
      assert.ok(created.id)
      const c = await join(id, user)
      c.doc.getMap('meta').set('role-' + user, user)
    }
    await until(async () => {
      const x = await api('/' + id + '/export')
      return ['101', '102', '103', '104', '105', '106', '107', '108'].every(
        (user) => x.meta['role-' + user] === user,
      )
    })
    assert.equal(
      (
        await root.query(
          'SELECT count(*)::int AS count FROM shot_list_members WHERE document_id=$1',
          [id],
        )
      )[0].count,
      1,
    )
    pass(
      'All eight eligible verified roles discover old documents, create lists and merge real WebSocket edits without per-document grants',
    )
    for (const user of ['109', '110', '111', '999']) {
      await api('', user, undefined, 403)
      await api('', user, { name: 'Must deny' }, 403)
      for (const endpoint of ['/session', '/export'])
        await api('/' + id + endpoint, user, undefined, 403)
      await api(
        '/' + id + '/import',
        user,
        { batchId: randomUUID(), scenes: [] },
        403,
      )
      await join(id, user, true)
    }
    pass(
      'HTTP list/create/session/export/import and WebSocket deny verified ineligible role, unverified Producer, revoked Director and self-selected Director',
    )
    const c = await join(id, '104')
    let closed = false
    c.p.on('close', () => (closed = true))
    await fetch('http://127.0.0.1:4311/qa/team/revoke/104', { method: 'POST' })
    try {
      await api('', '104', undefined, 403)
      for (let i = 0; i < 340 && !closed; i++) await wait(100)
      assert.ok(
        closed,
        'Connected collaborator must lose access within 30-second recheck window',
      )
    } finally {
      await fetch('http://127.0.0.1:4311/qa/team/restore/104', {
        method: 'POST',
      })
    }
    pass(
      'Central revocation denies HTTP immediately and disconnects an already connected collaborator within the revalidation window',
    )
  } finally {
    for (const { p, socket, doc } of clients) {
      p.destroy()
      socket.destroy()
      doc.destroy()
    }
    await root.destroy()
  }
  fs.writeFileSync(
    'client/qa/m03/artifacts/team-access.json',
    JSON.stringify(results, null, 2) + '\n',
  )
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
