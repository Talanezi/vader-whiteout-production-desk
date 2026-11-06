// Isolated local services only. Never accepts a production base URL.
const fs = require('fs'),
  assert = require('assert/strict'),
  { randomUUID } = require('crypto'),
  { execFileSync } = require('child_process'),
  Y = require('/tmp/m032/runtime/client/node_modules/yjs'),
  { join, until } = require('../m04/collaboration.cjs'),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  f = JSON.parse(fs.readFileSync('/tmp/m05/refinement/fixture.json')),
  base = 'http://127.0.0.1:4314/api',
  out = '/tmp/m05/refinement',
  { ledgerMetrics } = require('/tmp/m032/runtime/server-dist/flows/live')
async function api(
  path,
  body,
  user = '103',
  status = body === undefined ? 200 : 201,
) {
  const r = await fetch(base + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer ' + auth.tokens[user],
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  assert.equal(r.status, status, await r.clone().text())
  if (status !== 200 && status !== 201) return
  return /pdf|zip/.test(r.headers.get('content-type'))
    ? Buffer.from(await r.arrayBuffer())
    : r.json()
}
;(async () => {
  const flow = await api('/flows', {
      id: randomUUID(),
      name: 'Shoot Log authoritative compatibility',
      date: f.date,
      listId: f.listId,
      shotIds: [],
    }),
    id = flow.id,
    a = await join(id, '103', 'flows'),
    b = await join(id, '101', 'flows'),
    ids = [randomUUID(), randomUUID(), randomUUID()]
  let live
  try {
    a.doc.transact(() => {
      a.doc.getMap('meta').set('filmingStart', 540)
      ids.forEach((id, i) => {
        const e = new Y.Map()
        a.doc.getMap('events').set(id, e)
        Object.entries({
          id,
          type: 'shot',
          order: (i + 1) * 1024,
          timing: 'sequence',
          sourceListId: f.listId,
          shotId: f.shotIds[i],
          allottedMinutes: 10,
          ...(i === 0 ? { actualStart: f.date + 'T16:04:00.000Z' } : {}),
        }).forEach(([k, v]) => e.set(k, v))
      })
    }, 'local')
    await until(() => b.doc.getMap('events').size === 3, 'fixture sync')
    let snap = await api('/flows/' + id + '/snapshot'),
      metrics = ledgerMetrics(snap.state, snap.source)
    const imported = Date.parse(snap.state.events[ids[0]].actualStart)
    assert.equal(metrics.recorded, 1)
    assert.equal(
      snap.state.meta.liveState,
      undefined,
      'reading imported data must not write a log',
    )
    const legacyAction = {
      id: randomUUID(),
      revision: 0,
      type: 'stamp',
      field: 'start',
      eventId: ids[0],
      minute: 545,
      expectedStartedAt: imported,
      expectedEndedAt: null,
    }
    live = (await api('/flows/' + id + '/live', legacyAction)).live
    assert.equal(live.audit[0].before.blocks[ids[0]].startedAt, imported)
    assert.equal(
      (await api('/flows/' + id + '/snapshot')).state.events[ids[0]]
        .actualStart,
      f.date + 'T16:04:00.000Z',
    )
    const action = (eventId, minute) => ({
        id: randomUUID(),
        revision: live.revision,
        type: 'stamp',
        field: 'start',
        eventId,
        minute,
        expectedStartedAt: null,
        expectedEndedAt: null,
      }),
      second = action(ids[1], 558),
      third = action(ids[2], 571)
    await Promise.all([
      api('/flows/' + id + '/live', second),
      api('/flows/' + id + '/live', third, '101'),
    ])
    live = (await api('/flows/' + id + '/live')).live
    assert.equal(live.revision, 3)
    await until(
      () => b.doc.getMap('meta').get('liveState')?.revision === 3,
      'durable log propagated to peer',
    )
    assert.equal(
      (await api('/flows/' + id + '/live', second)).live.revision,
      3,
      'retry is idempotent even after another row changed',
    )
    await api(
      '/flows/' + id + '/live',
      { ...second, id: randomUUID(), minute: 560 },
      '103',
      400,
    )
    await api('/flows/' + id + '/live', action(ids[1], 560), '115', 403)
    await api('/flows/' + id + '/live', undefined, '999', 403)
    a.doc
      .getMap('events')
      .get(ids[0])
      .set('actualStart', f.date + 'T16:00:00.000Z')
    await new Promise((r) => setTimeout(r, 400))
    assert.equal(
      (await api('/flows/' + id + '/snapshot')).state.events[ids[0]]
        .actualStart,
      f.date + 'T16:04:00.000Z',
      'raw WS edits cannot bypass audited corrections',
    )
    a.close()
    await api('/flows/' + id + '/manage', {
      action: 'checkpoint',
      summary: 'Planning before timestamp correction',
    })
    const revisions = await api('/flows/' + id + '/revisions')
    const revisionId = revisions.items[0].id
    const before = live.blocks[ids[0]]
    live = (
      await api('/flows/' + id + '/live', {
        id: randomUUID(),
        revision: live.revision,
        type: 'stamp',
        field: 'start',
        eventId: ids[0],
        minute: null,
        expectedStartedAt: before.startedAt,
        expectedEndedAt: null,
      })
    ).live
    snap = await api('/flows/' + id + '/snapshot')
    assert.equal(
      ledgerMetrics(snap.state, snap.source).rows[0].block.startedAt,
      undefined,
      'explicit clear overrides imported timestamp',
    )
    live = (
      await api('/flows/' + id + '/live', {
        id: randomUUID(),
        revision: live.revision,
        type: 'undo',
      })
    ).live
    assert.equal(live.blocks[ids[0]].startMinute, 545)
    await api('/flows/' + id + '/manage', {
      action: 'restoreRevision',
      revisionId,
    })
    assert.deepEqual(
      (await api('/flows/' + id + '/live')).live,
      live,
      'planning restore preserves production log',
    )
    const spec = {
      product: 'master',
      paper: 'tabloid',
      orientation: 'landscape',
      departments: Object.keys(snap.state.departments),
      style: 'color',
      actual: true,
      notes: true,
      personnel: true,
      productionLog: true,
    }
    const bytes = await api('/flows/' + id + '/pdf', spec)
    fs.writeFileSync(out + '/shoot-log-production.pdf', bytes)
    const text = execFileSync('pdftotext', [
      out + '/shoot-log-production.pdf',
      '-',
    ]).toString()
    assert(
      text.includes('Production log') &&
        text.includes('Start-to-start') &&
        text.includes('Actual start'),
    )
    const zip = await api('/flows/' + id + '/department-pack', {
      ...spec,
      departments: spec.departments.slice(0, 3),
    })
    fs.writeFileSync(out + '/refinement-departments.zip', zip)
    execFileSync('python3', [
      '-c',
      "import zipfile; z=zipfile.ZipFile('/tmp/m05/refinement/refinement-departments.zip'); assert len(z.namelist())==3 and z.testzip() is None; assert all(n.endswith('.pdf') and '/' not in n for n in z.namelist())",
    ])
    const m03 = await api('/shotlists/' + f.listId + '/pdf', {
      version: 2,
      scope: 'selected',
      layout: 'table',
      rows: f.shotIds.slice(0, 5).map((shotId) => ({ shotId })),
      columns: [
        { field: 'number', width: 106 },
        { field: 'coverage', width: 330 },
        { field: 'camera', width: 104 },
      ],
      paper: 'letter',
      orientation: 'landscape',
      margins: 'normal',
      scaling: 'fit-width',
      text: 'wrap',
      groupScenes: true,
    })
    fs.writeFileSync(out + '/m03-preservation.pdf', m03)
    assert(m03.subarray(0, 5).toString() === '%PDF-')
    assert(
      /Pages:\s+1\b/.test(
        execFileSync('pdfinfo', [
          out + '/m03-preservation.pdf',
        ]).toString(),
      ),
    )
    b.close()
    await fetch('http://127.0.0.1:4318/restart', { method: 'POST' })
    assert.deepEqual((await api('/flows/' + id + '/live')).live, live)
    fs.writeFileSync(
      out + '/shoot-log-http.json',
      JSON.stringify({ flowId: id, eventIds: ids }),
    )
    console.log(
      'HTTP/WS Shoot Log: read-only imported timestamp projection; audited corrections/clear/undo; parallel different-row edits; same-row conflict; idempotent retry; unauthorized rejection; raw-actual WS tamper rejected; planning restoration and backend restart preserve records. Actual production-log PDF, three-department ZIP and unchanged five-shot M03 PDF passed.',
    )
  } finally {
    a.close()
    b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
