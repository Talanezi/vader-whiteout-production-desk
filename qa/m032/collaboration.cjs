const {
  runtime,
  state,
  out,
  api,
  create,
  join,
  until,
} = require('./helpers.cjs')
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const Y = require(path.join(runtime, 'client/node_modules/yjs'))
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const checks = [],
  pass = (name) => {
    checks.push(name)
    console.log('PASS', name)
  }
;(async () => {
  const list = await create('M03.2 multi-user scheduling and private layouts'),
    baseline = await api('/' + list.id + '/export')
  const a = await join(list.id, '101'),
    b = await join(list.id, '102'),
    c = await join(list.id, '103'),
    clients = [a, b, c]
  const dayId = crypto.randomUUID(),
    ids = Object.keys(baseline.shots).slice(0, 2),
    assignmentIds = ids.map(() => crypto.randomUUID())
  a.doc.transact(() => {
    a.doc
      .getMap('shootDays')
      .set(
        dayId,
        new Y.Map(
          Object.entries({
            id: dayId,
            date: '2027-05-31',
            title: 'Shared day',
            order: 1024,
          }),
        ),
      )
    ids.forEach((shotId, i) =>
      a.doc
        .getMap('shootAssignments')
        .set(
          assignmentIds[i],
          new Y.Map(
            Object.entries({
              id: assignmentIds[i],
              shotId,
              dayId,
              order: (i + 1) * 1024,
              status: 'planned',
              notes: '',
              estimatedMinutes: '',
              pickup: false,
            }),
          ),
        ),
    )
  }, 'local')
  await until(
    () => clients.every((x) => x.doc.getMap('shootAssignments').size === 2),
    'shared assignments',
  )
  c.provider.disconnect()
  c.doc
    .getMap('shootAssignments')
    .get(assignmentIds[0])
    .set('notes', 'Offline assignment notes')
  a.doc
    .getMap('shots')
    .get(ids[0])
    .get('coverage')
    .insert(0, 'Concurrent master coverage. ')
  b.doc.getMap('shootAssignments').get(assignmentIds[0]).set('order', 3072)
  b.doc
    .getMap('shootAssignments')
    .get(assignmentIds[1])
    .set('estimatedMinutes', '12')
  c.provider.connect()
  const shared = (d) =>
    ['shots', 'scenes', 'shootDays', 'shootAssignments'].map((k) =>
      d.getMap(k).toJSON(),
    )
  await until(
    () =>
      JSON.stringify(shared(a.doc)) === JSON.stringify(shared(b.doc)) &&
      JSON.stringify(shared(a.doc)) === JSON.stringify(shared(c.doc)),
    'three-way reconnection',
  )
  await until(async () => {
    const s = await api('/' + list.id + '/export')
    return (
      s.shootAssignments[assignmentIds[0]]?.notes ===
        'Offline assignment notes' &&
      s.shootAssignments[assignmentIds[0]]?.order === 3072
    )
  }, 'durable schedule')
  const saved = await api('/' + list.id + '/export')
  for (const [id, original] of Object.entries(baseline.shots))
    for (const key of ['id', 'number', 'sceneId', 'order', 'planningOrder'])
      assert.equal(saved.shots[id][key], original[key])
  pass(
    'Three real authenticated WebSocket clients converge after offline assignment notes, concurrent master editing and independent shooting-order changes; master identities and creative order are preserved',
  )
  clients.forEach((x) => x.close())
  const restarted = await fetch('http://127.0.0.1:4312/restart', {
    method: 'POST',
  })
  assert.ok(restarted.ok)
  await until(
    async () => {
      try {
        return (
          (await api('/' + list.id + '/export')).shootAssignments[
            assignmentIds[0]
          ]?.notes === 'Offline assignment notes'
        )
      } catch {
        return false
      }
    },
    'restart persistence',
    25000,
  )
  const rejoined = await join(list.id, '102')
  assert.deepEqual(
    rejoined.doc.getMap('shootAssignments').toJSON(),
    saved.shootAssignments,
  )
  rejoined.close()
  pass(
    'Scheduling state survives an actual backend restart and fresh collaborator connection',
  )
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const pages = []
    for (const user of ['101', '102']) {
      const ctx = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      })
      await ctx.addInitScript(
        (token) => localStorage.setItem('token', token),
        state.tokens[user],
      )
      const p = await ctx.newPage()
      await p.goto(state.root + '#/shotlists/' + list.id)
      await p.locator('[data-sync="saved"]').waitFor()
      pages.push(p)
    }
    const resize = (p) =>
      p.getByRole('separator', {
        name: 'Resize Action / coverage',
        exact: true,
      })
    const other = Number(await resize(pages[1]).getAttribute('aria-valuenow')),
      own = Number(await resize(pages[0]).getAttribute('aria-valuenow'))
    await resize(pages[0]).focus()
    await resize(pages[0]).press('ArrowRight')
    await resize(pages[0]).press('ArrowRight')
    const changed = Number(await resize(pages[0]).getAttribute('aria-valuenow'))
    assert.ok(changed > own)
    await pages[0].reload()
    await pages[0].locator('[data-sync="saved"]').waitFor()
    assert.equal(
      Number(await resize(pages[0]).getAttribute('aria-valuenow')),
      changed,
    )
    assert.equal(
      Number(await resize(pages[1]).getAttribute('aria-valuenow')),
      other,
    )
    assert.deepEqual(await api('/' + list.id + '/export'), saved)
    pass(
      'Column widths persist for the individual user without changing another collaborator or the shared document',
    )
  } finally {
    await browser.close()
  }
  fs.writeFileSync(
    path.join(out, 'collaboration.json'),
    JSON.stringify({ pass: true, checks }, null, 2),
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
