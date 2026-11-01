const {
    runtime,
    state,
    out,
    api,
    create,
    join,
    until,
  } = require('./helpers.cjs'),
  fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto'),
  { execFileSync } = require('node:child_process')
const checks = []
function pass(name) {
  checks.push({ name, pass: true })
  console.log('PASS', name)
}
async function pdf(id, body = {}, user = '101', status = 201) {
  const r = await fetch(`${state.api}/shotlists/${id}/pdf`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + (state.tokens[user] || user),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  assert.equal(
    r.status,
    status,
    status === 201 ? await r.clone().text() : undefined,
  )
  return Buffer.from(await r.arrayBuffer())
}
;(async () => {
  const list = await create('M03.2 API scheduling/report QA'),
    before = await api('/' + list.id + '/export'),
    first = await api('', {
      name: 'Optional initial date',
      firstDate: '2027-05-31',
    })
  assert.equal(
    Object.values((await api('/' + first.id + '/export')).shootDays)[0].date,
    '2027-05-31',
  )
  assert.deepEqual(
    (await api('')).items.find((l) => l.id === first.id).dates,
    [],
  )
  await api(
    '',
    { name: 'Invalid calendar', firstDate: '2027-02-29' },
    '101',
    400,
  )
  pass(
    'Optional real first date, valid calendar checks and no fabricated scheduled range',
  )
  const schedule = {
      batchId: crypto.randomUUID(),
      scenes: [],
      schedule: [
        {
          date: '2027-05-31',
          title: 'Day 1',
          rows: [
            {
              number: '16-B',
              sceneNumber: '16',
              notes: 'Start with over shoulder',
              estimatedMinutes: '8',
            },
            { number: '16-A', sceneNumber: '16' },
            { number: '16-B', sceneNumber: '16', notes: 'Pickup' },
          ],
        },
        {
          date: '2027-06-02',
          title: 'Day 2',
          rows: [{ number: '9.10', sceneNumber: '09' }],
        },
      ],
    },
    result = await api('/' + list.id + '/import', schedule)
  assert.equal(result.assignments, 4)
  const snapshot = await api('/' + list.id + '/export')
  assert.deepEqual(snapshot.shots, before.shots)
  assert.deepEqual(snapshot.scenes, before.scenes)
  assert.equal(
    Object.values(snapshot.shootAssignments).filter((a) => a.pickup).length,
    1,
  )
  assert.deepEqual(await api('/' + list.id + '/import', schedule), result)
  assert.deepEqual((await api('')).items.find((l) => l.id === list.id).dates, [
    '2027-05-31',
    '2027-06-02',
  ])
  pass(
    'Reviewed schedule-only import, pickups, cross-day references, range metadata and idempotent retry',
  )
  await api(
    '/' + list.id + '/import',
    {
      ...schedule,
      batchId: crypto.randomUUID(),
      schedule: [
        {
          date: '2027-05-31',
          title: 'Bad references',
          rows: [{ number: 'does not exist' }],
        },
      ],
    },
    '101',
    400,
  )
  assert.deepEqual(await api('/' + list.id + '/export'), snapshot)
  await api(
    '/' + list.id + '/import',
    {
      batchId: crypto.randomUUID(),
      scenes: [{ number: '99', shots: [{ number: '99-A' }] }],
      schedule: [
        { date: '2027-05-31', title: 'Bad', rows: [{ number: 'missing' }] },
      ],
    },
    '101',
    400,
  )
  assert.deepEqual(await api('/' + list.id + '/export'), snapshot)
  pass(
    'Unmatched schedules fail atomically before creating master shots or import batch records',
  )
  for (const user of ['101', '102', '103', '104', '105', '106', '107', '108'])
    assert.equal(
      (await pdf(list.id, { mode: 'both' }, user)).subarray(0, 4).toString(),
      '%PDF',
    )
  for (const user of ['109', '110', '111', '999'])
    await pdf(list.id, {}, user, 403)
  await pdf(list.id, {}, 'invalid-session', 401)
  await pdf(list.id, { profile: 'unsupported' }, '101', 400)
  await pdf(list.id, { sceneIds: 'bad' }, '101', 400)
  pass(
    'PDF uses the same verified eight-role production policy; ineligible/unverified/revoked and invalid sessions are denied',
  )
  const connected = await join(list.id),
    shotId = Object.keys(snapshot.shots)[0]
  connected.provider.disconnect()
  connected.doc
    .getMap('shots')
    .get(shotId)
    .get('coverage')
    .insert(0, 'UNSAVED-BROWSER-MARKER ')
  const saved = await pdf(list.id, { mode: 'both' }),
    file = path.join(out, 'api-both-saved-snapshot.pdf')
  fs.writeFileSync(file, saved)
  const text = execFileSync('pdftotext', [file, '-']).toString()
  assert.ok(!text.includes('UNSAVED-BROWSER-MARKER'))
  assert.ok(text.includes('Shooting Order'))
  assert.ok(text.includes('2027-06-02'))
  assert.deepEqual(await api('/' + list.id + '/export'), snapshot)
  connected.close()
  pass(
    'PDF reads saved authoritative content, includes real dates, and does not mutate content or include an offline browser draft',
  )
  fs.writeFileSync(
    path.join(out, 'api.json'),
    JSON.stringify({ pass: true, checks }, null, 2),
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
