// Disposable loopback-only M05 contract/authority/persistence/print acceptance.
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto')
const root = path.resolve(__dirname, '../..'),
  runtime = process.env.M03_RUNTIME || '/tmp/m032/runtime',
  out = '/tmp/m05',
  fixture =
    process.env.M05_WORKBOOK ||
    '/Users/thameralanezi/Downloads/Flow-Of-The-Day September 25th [Vader _ Whiteout] Fall 2026.xlsx'
fs.mkdirSync(out, { recursive: true })
process.env.NODE_PATH =
  runtime + '/client/node_modules:' + runtime + '/server/node_modules'
require('node:module').Module._initPaths()
const esbuild = require(runtime + '/client/node_modules/esbuild'),
  Y = require(runtime + '/client/node_modules/yjs'),
  { join, until } = require('../m04/collaboration.cjs'),
  state = JSON.parse(fs.readFileSync(runtime + '/local-state.json'))
for (const file of ['model', 'import'])
  esbuild.buildSync({
    entryPoints: [root + '/client/src/lib/flow/' + file + '.ts'],
    outfile: out + '/' + file + '.cjs',
    platform: 'node',
    format: 'cjs',
    bundle: true,
    packages: 'external',
  })
const model = require(out + '/model.cjs'),
  imp = require(out + '/import.cjs')
async function api(
  collection,
  p,
  payload,
  user = '101',
  expect = payload === undefined ? 200 : 201,
) {
  const r = await fetch('http://127.0.0.1:4314/api/' + collection + p, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer ' + state.tokens[user],
      'Content-Type': 'application/json',
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  })
  assert.equal(r.status, expect, await r.clone().text())
  return r.headers.get('content-type')?.includes('application/pdf')
    ? Buffer.from(await r.arrayBuffer())
    : r.json()
}
async function main() {
  assert.equal(model.parseDuration('1h 20m'), 80)
  assert.equal(model.parseDuration(''), null)
  assert.throws(() => model.parseDuration('-1'))
  assert.deepEqual(
    model.localCandidates('2026-03-08 02:30', 'America/Los_Angeles'),
    [],
  )
  assert.equal(
    model.localCandidates('2026-11-01 01:30', 'America/Los_Angeles').length,
    2,
  )
  assert.equal(
    model.localCandidates('2026-09-26 01:30', 'America/Los_Angeles')[0],
    '2026-09-26T08:30:00.000Z',
  )
  const original = fs.readFileSync(fixture),
    sheets = imp.readWorkbook(
      original.buffer.slice(
        original.byteOffset,
        original.byteOffset + original.byteLength,
      ),
    )
  assert.equal(sheets.length, 1)
  const mapping = {
      ...imp.suggest(sheets[0]),
      planned: 'A',
      secondary: 'B',
      secondaryRole: 'actual',
      plannedClock: '12-sequence',
      secondaryClock: '12-afternoon',
    },
    rows = imp.mappedRows(
      sheets[0],
      mapping,
      '2026-09-25',
      'America/Los_Angeles',
    )
  assert(
    !rows.some((r) => r.warning),
    rows
      .filter((r) => r.warning)
      .map((r) => r.warning)
      .join(';'),
  )
  assert(
    rows.some(
      (r) => !r.description && Object.values(r.instructions).some(Boolean),
    ),
  )
  assert(rows.some((r) => r.description === '19-1.1'))
  assert.equal(
    rows.find((r) => r.row === 121).start,
    '2026-09-25T23:05:00.000Z',
  )
  const fields = new Set([
      mapping.planned,
      mapping.secondary,
      mapping.action,
      mapping.estimate,
      ...Object.keys(mapping.departments),
    ]),
    unmapped = []
  for (const r of rows)
    for (const c of r.provenance.cells)
      if (!fields.has(c.address.replace(/\d/g, ''))) unmapped.push(c.address)
  assert.deepEqual(unmapped, [])
  const { checkWorkbook } = require(
    runtime + '/server-dist/flows/flows.controller.js',
  )
  checkWorkbook(original)
  assert.throws(() => checkWorkbook(Buffer.from('not a zip')))
  await api(
    'flows',
    '',
    { id: crypto.randomUUID(), name: 'Denied' },
    '999',
    403,
  )
  const noAuth = await fetch('http://127.0.0.1:4314/api/flows')
  assert.equal(noAuth.status, 401)
  const shotList = await api('shotlists', '', {
      name: 'M05 disposable authoritative shots',
    }),
    sa = await join(shotList.id, '101', 'shotlists')
  const scene = model.put(sa.doc, 'scenes', crypto.randomUUID(), {}) // create real M03-shaped source through its collaboration channel
  const sceneId = [...sa.doc.getMap('scenes').keys()][0]
  sa.doc.getMap('scenes').get(sceneId).set('number', '19')
  sa.doc.getMap('scenes').get(sceneId).set('order', 1024)
  const shotIds = []
  for (let i = 0; i < 3; i++) {
    const id = crypto.randomUUID()
    shotIds.push(id)
    model.put(sa.doc, 'shots', id, {
      sceneId,
      order: (i + 1) * 1024,
      planningOrder: (i + 1) * 1024,
      number: '19-' + (i + 1),
      subject: 'Production subject ' + (i + 1),
      coverage: new Y.Text('Authoritative coverage ' + (i + 1)),
      camera: 'CAM A',
      framing: 'MS',
      lens: '24mm',
      estimatedMinutes: i === 2 ? '' : '12',
      deleted: false,
    })
  }
  await new Promise((r) => setTimeout(r, 350))
  const flow = await api('flows', '', {
    id: crypto.randomUUID(),
    name: 'September 25 · Department Flow',
    date: '2026-09-25',
    zone: 'America/Los_Angeles',
    listId: shotList.id,
    shotIds,
  })
  await api('flows', `/${flow.id}/session`, undefined, '999', 403)
  const a = await join(flow.id, '101', 'flows'),
    b = await join(flow.id, '102', 'flows')
  try {
    const deps = model.departments(a.doc),
      sourceOrder = shotIds.map((id) =>
        sa.doc.getMap('shots').get(id).get('order'),
      )
    assert.equal(deps.length, 9)
    assert.equal(
      model.duration(
        model.orderedEvents(a.doc)[2],
        sa.doc.getMap('shots').get(shotIds[2]),
      ),
      null,
    )
    const one = model.orderedEvents(a.doc)[0],
      two = model.orderedEvents(a.doc)[1]
    model.instruction(a.doc, one.id, deps[0].id).insert(0, 'Camera prepare')
    await until(
      () => b.doc.getMap('instructions').has(one.id + ':' + deps[0].id),
      'instruction created',
    )
    model
      .instruction(b.doc, one.id, deps[0].id)
      .insert(0, 'Other collaborator · ')
    model.instruction(a.doc, one.id, deps[1].id).insert(0, 'Actors rehearse')
    await until(
      () =>
        String(
          a.doc
            .getMap('instructions')
            .get(one.id + ':' + deps[0].id)
            .get('text'),
        ).includes('Other collaborator'),
      'shared character edits',
    )
    model.moveEvent(a.doc, two, one)
    assert.deepEqual(
      shotIds.map((id) => sa.doc.getMap('shots').get(id).get('order')),
      sourceOrder,
    )
    sa.doc.getMap('shots').get(shotIds[0]).set('estimatedMinutes', '19')
    assert.equal(
      model.duration(one, sa.doc.getMap('shots').get(shotIds[0])),
      19,
    )
    model.put(a.doc, 'events', one.id, { duration: 7 })
    assert.equal(
      model.duration(
        model.orderedEvents(a.doc).find((e) => e.id === one.id),
        sa.doc.getMap('shots').get(shotIds[0]),
      ),
      7,
    )
    a.doc.transact(() => {
      for (const r of rows) {
        const id = model.addEvent(a.doc, {
          type: r.type,
          description: r.description,
          start: r.start,
          actualStart: r.actualStart,
          duration: r.duration,
          notes: '',
          fixed: r.type === 'milestone',
          provenance: r.provenance,
        })
        Object.entries(r.instructions).forEach(([col, text]) => {
          if (text) {
            const dep = deps.find((d) => d.name === mapping.departments[col])
            model.put(a.doc, 'instructions', id + ':' + dep.id, {
              eventId: id,
              departmentId: dep.id,
              text: new Y.Text(text),
            })
          }
        })
      }
    })
    await until(
      () => model.orderedEvents(b.doc).length === rows.length + 3,
      'import events shared',
    )
    a.provider.sendStateless('persistence-status')
    await new Promise((r) => setTimeout(r, 500))
    const file = new FormData()
    file.append(
      'file',
      new Blob([original], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
      path.basename(fixture),
    )
    const upload = await fetch(
      `http://127.0.0.1:4314/api/flows/${flow.id}/sources`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + state.tokens['101'] },
        body: file,
      },
    )
    assert.equal(upload.status, 201, await upload.clone().text())
    const hash = (await upload.json()).sha256
    const download = await fetch(
      `http://127.0.0.1:4314/api/flows/${flow.id}/sources/${hash}`,
      { headers: { Authorization: 'Bearer ' + state.tokens['101'] } },
    )
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), original)
    const denied = await fetch(
      `http://127.0.0.1:4314/api/flows/${flow.id}/sources/${hash}`,
    )
    assert.equal(denied.status, 401)
    await api('flows', `/${flow.id}/manage`, {
      action: 'checkpoint',
      summary: 'Imported September 25 baseline',
    })
    const history = await api('flows', `/${flow.id}/revisions`),
      rev = history.items[0]
    model.put(a.doc, 'events', one.id, {
      description: 'Changed after checkpoint',
    })
    await new Promise((r) => setTimeout(r, 300))
    await api('flows', `/${flow.id}/manage`, {
      action: 'restoreRevision',
      revisionId: rev.id,
    })
    await until(
      () =>
        !model
          .orderedEvents(a.doc)
          .some((e) => e.description === 'Changed after checkpoint'),
      'restored actual revision',
    )
    const history2 = await api('flows', `/${flow.id}/revisions`)
    assert.equal(history2.items.length, 2)
    assert.equal(
      (await api('flows', `/${flow.id}/revisions/${rev.id}`)).meta.name,
      'September 25 · Department Flow',
    )
    const spec = {
      product: 'master',
      paper: 'tabloid',
      orientation: 'landscape',
      departments: deps.map((d) => d.id),
      style: 'color',
      actual: false,
      personnel: true,
      notes: true,
    }
    for (const paper of ['tabloid', 'letter', 'a4', 'a3']) {
      const pdf = await api('flows', `/${flow.id}/pdf`, { ...spec, paper })
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-')
      fs.writeFileSync(out + `/master-${paper}.pdf`, pdf)
    }
    for (const product of ['department', 'rundown']) {
      const pdf = await api('flows', `/${flow.id}/pdf`, {
        ...spec,
        product,
        paper: 'letter',
        departments:
          product === 'department' ? [deps[0].id] : deps.map((d) => d.id),
        style: 'mono',
      })
      fs.writeFileSync(out + '/' + product + '.pdf', pdf)
    }
    const snapshot = await api('flows', `/${flow.id}/snapshot`)
    assert.equal(
      Object.values(snapshot.state.events).filter((e) => !e.deletedAt).length,
      rows.length + 3,
    )
    const reload = await join(flow.id, '101', 'flows')
    assert.equal(model.orderedEvents(reload.doc).length, rows.length + 3)
    reload.close()
    const copy = await api('flows', `/${flow.id}/manage`, {
        action: 'duplicate',
      }),
      copied = await api('flows', `/${copy.id}/snapshot`)
    assert.equal(copied.state.meta.date, '')
    assert.equal(copied.state.meta.status, 'draft')
    assert(
      Object.values(copied.state.events).every(
        (e) => !e.start && !e.actualStart,
      ),
    )
    fs.writeFileSync(
      out + '/fixture.json',
      JSON.stringify({
        id: flow.id,
        listId: shotList.id,
        shotIds,
        firstEvent: one.id,
        eventCount: rows.length + 3,
        sourceHash: hash,
      }),
    )
    fs.writeFileSync(
      out + '/contract-results.json',
      JSON.stringify(
        {
          workbook: {
            nonempty: 223,
            lastRow: 121,
            events: rows.length,
            instructions: rows.reduce(
              (n, r) =>
                n + Object.values(r.instructions).filter(Boolean).length,
              0,
            ),
            unmapped,
          },
          time: 'DST gap/fold and cross-midnight passed',
          security:
            'anonymous and unverified denied; private workbook exact roundtrip',
          collaboration:
            'two authorized clients; character edits; independent instructions; reload',
          authority:
            'M03 daily order preserved; estimate inheritance and override',
          history: 'real preview and nondestructive restore passed',
          pdf: 'six actual artifacts generated',
        },
        null,
        2,
      ),
    )
    console.log(fs.readFileSync(out + '/contract-results.json', 'utf8'))
  } finally {
    a.close()
    b.close()
    sa.close()
  }
}
if (require.main === module)
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
module.exports = { api }
