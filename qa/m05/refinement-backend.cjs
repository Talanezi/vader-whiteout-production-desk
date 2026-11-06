const fs = require('fs'),
  assert = require('assert/strict'),
  { randomUUID } = require('crypto'),
  { execFileSync } = require('child_process')
process.env.NODE_PATH =
  '/tmp/m032/runtime/server/node_modules:/tmp/m032/runtime/client/node_modules'
require('module').Module._initPaths()
const Y = require('/tmp/m032/runtime/client/node_modules/yjs'),
  { join, until } = require('../m04/collaboration.cjs'),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  base = 'http://127.0.0.1:4314/api',
  out = '/tmp/m05/refinement'
fs.mkdirSync(out, { recursive: true })
async function request(
  path,
  body,
  user = '101',
  expected = body === undefined ? 200 : 201,
) {
  const r = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer ' + auth.tokens[user],
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  assert.equal(r.status, expected, await r.clone().text())
  return r.headers.get('content-type')?.includes('pdf')
    ? Buffer.from(await r.arrayBuffer())
    : r.json()
}
function put(doc, key, id, data) {
  const m = new Y.Map()
  doc.getMap(key).set(id, m)
  Object.entries({ id, ...data }).forEach(([k, v]) => m.set(k, v))
  return m
}
;(async () => {
  const list = await request('/shotlists', {
      name: 'Refinement — cinematography source',
    }),
    c = await join(list.id, '102', 'shotlists'),
    scene = randomUUID(),
    ids = []
  c.doc.transact(() => {
    put(c.doc, 'scenes', scene, {
      number: '10',
      order: 1024,
      title: 'Cave Scene',
    })
    for (let i = 0; i < 60; i++) {
      const id = randomUUID()
      ids.push(id)
      put(c.doc, 'shots', id, {
        number: String.fromCharCode(65 + (i % 26)) + (i > 25 ? 'A' : ''),
        sceneId: scene,
        order: (i + 1) * 1024,
        planningOrder: (i + 1) * 1024,
        subject: i === 0 ? 'VADER' : i === 1 ? 'Cave wall' : '',
        notes: new Y.Text(''),
        focusNotes: new Y.Text(''),
        lightingNotes: new Y.Text(''),
        coverage: new Y.Text(
          i === 0 ? 'Vader enters the cave.' : 'Coverage ' + (i + 1),
        ),
        estimatedMinutes:
          i === 0 ? '8' : String([1, 2, 3, 5, 10, 30, 60, 120][i % 8]),
        camera: 'CAM A',
        framing: 'MS',
        lens: '35mm',
        deleted: false,
      })
    }
  }, 'local')
  await new Promise((r) => setTimeout(r, 700))
  await request('/shotlists/' + list.id + '/export')
  await request('/roster', {
    id: randomUUID(),
    name: 'Cast Performer',
    category: 'cast',
    roleOrDepartment: 'VADER',
    active: true,
  })
  const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()),
    flow = await request('/flows', {
      id: randomUUID(),
      name: 'Flow of the Day - Cave Scene',
      date: today,
      zone: 'America/Los_Angeles',
      listId: list.id,
      shotIds: ids.slice(0, 8),
    }),
    a = await join(flow.id, '103', 'flows'),
    b = await join(flow.id, '101', 'flows')
  a.doc.transact(() => {
    a.doc.getMap('meta').set('filmingStart', 540)
    ;[...a.doc.getMap('events').values()].forEach((e, i) =>
      e.set(
        'allottedMinutes',
        i === 0 ? 10 : [1, 2, 3, 5, 10, 30, 60, 120][i % 8],
      ),
    )
  }, 'local')
  await new Promise((r) => setTimeout(r, 650))
  const snapshot = await request('/flows/' + flow.id + '/snapshot'),
    events = Object.values(snapshot.state.events).sort(
      (a, b) => a.order - b.order,
    )
  assert.equal(Object.keys(snapshot.state.departments).length, 10)
  assert.deepEqual(
    Object.values(snapshot.state.departments)
      .sort((a, b) => a.order - b.order)
      .map((d) => d.name),
    [
      'Camera & Lighting',
      'Grip & Electric',
      'Talent',
      'Sound',
      'Costume',
      'Hair & Makeup',
      'Props',
      'Choreography',
      'Director',
      'Production',
    ],
  )
  assert.equal(snapshot.source.shots[ids[0]].estimatedMinutes, '8')
  assert.equal(snapshot.state.events[events[0].id].allottedMinutes, 10)
  assert.equal(snapshot.state.cast[0].roleOrDepartment, 'VADER')
  const livePath = '/flows/' + flow.id + '/live',
    first = {
      id: randomUUID(),
      revision: 0,
      type: 'start',
      eventId: events[0].id,
      occurredAt: Date.now() - 8 * 60000,
    }
  const r = await request(livePath, first)
  assert.equal(r.live.revision, 1)
  assert.equal((await request(livePath, first)).live.revision, 1)
  await until(
    () => b.doc.getMap('meta').get('liveState')?.activeId === events[0].id,
    'shared live start',
  )
  const results = await Promise.all([
    request(
      livePath,
      {
        id: randomUUID(),
        revision: 1,
        type: 'finish',
        eventId: events[0].id,
      },
      '103',
    )
      .then(() => 201)
      .catch(() => 400),
    request(
      livePath,
      {
        id: randomUUID(),
        revision: 1,
        type: 'advance',
        eventId: events[1].id,
      },
      '101',
    )
      .then(() => 201)
      .catch(() => 400),
  ])
  assert.deepEqual(results.sort(), [201, 400])
  let live = (await request(livePath)).live
  assert.equal(live.revision, 2)
  if (live.activeId)
    live = (
      await request(livePath, {
        id: randomUUID(),
        revision: 2,
        type: 'finish',
        eventId: live.activeId,
      })
    ).live
  const copy = await request('/flows/' + flow.id + '/manage', {
    action: 'duplicate',
  })
  assert.equal(
    (await request('/flows/' + copy.id + '/live')).live.revision,
    0,
  )
  await request(livePath, undefined, '999', 403)
  await request(
    livePath,
    {
      id: randomUUID(),
      revision: live.revision,
      type: 'start',
      eventId: events[2].id,
    },
    '115',
    403,
  )
  const tamper = await join(flow.id, '102', 'flows')
  tamper.doc
    .getMap('meta')
    .set('liveState', { revision: 999, activeId: 'forged' })
  await new Promise((r) => setTimeout(r, 500))
  assert.notEqual((await request(livePath)).live.revision, 999)
  tamper.close()
  const spec = {
    product: 'master',
    paper: 'tabloid',
    orientation: 'landscape',
    departments: Object.keys(snapshot.state.departments),
    style: 'color',
    actual: false,
    notes: true,
    personnel: true,
  }
  for (const [label, extra] of [
    ['master', {}],
    ['production-log', { productionLog: true }],
    [
      'focus',
      {
        product: 'department',
        departments: [
          Object.values(snapshot.state.departments).find(
            (d) => d.name === 'Talent',
          ).id,
        ],
      },
    ],
    ['rundown', { product: 'rundown' }],
  ]) {
    const bytes = await request('/flows/' + flow.id + '/pdf', {
      ...spec,
      ...extra,
    })
    fs.writeFileSync(out + '/' + label + '.pdf', bytes)
    const text = execFileSync('pdftotext', [
      out + '/' + label + '.pdf',
      '-',
    ]).toString()
    assert(text.includes('Flow of the Day — Cave Scene'))
    if (label === 'master') {
      assert(text.includes('Production'))
      assert(text.includes('VADER'))
      assert(!text.includes('VADER Vader'))
      const pages = execFileSync('pdfinfo', [out + '/' + label + '.pdf'])
        .toString()
        .match(/Pages:\s+(\d+)/)[1]
      assert.equal(+pages, 1)
    }
    if (label === 'production-log')
      assert(
        text.includes('Production log') && text.includes('Actual start'),
      )
  }
  a.close()
  b.close()
  c.close()
  fs.writeFileSync(
    out + '/fixture.json',
    JSON.stringify({
      listId: list.id,
      shotIds: ids,
      sceneId: scene,
      flowId: flow.id,
      eventIds: events.map((e) => e.id),
      date: today,
    }),
  )
  await fetch('http://127.0.0.1:4318/restart', { method: 'POST' })
  assert.equal((await request(livePath)).live.revision, live.revision)
  console.log(
    'Real HTTP/WS: shared separate allotment/estimate, default ten departments, cast mapping, atomic one-active concurrency, duplicate retry, persisted reload/backend restart, duplicate planning clears actual log, unauthorized/foreign rejection, forged WS actual-state denial; actual master/Focus/Rundown/production-log PDFs passed.',
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
