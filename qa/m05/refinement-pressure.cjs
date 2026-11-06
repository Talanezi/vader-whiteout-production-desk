const fs = require('fs'),
  assert = require('assert/strict'),
  crypto = require('crypto'),
  Y = require('/tmp/m032/runtime/client/node_modules/yjs'),
  { join } = require('../m04/collaboration.cjs'),
  kind = process.env.M05_BROWSER || 'chromium',
  pw = require(
    kind === 'webkit'
      ? '/tmp/m05/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  s = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  f = JSON.parse(fs.readFileSync('/tmp/m05/refinement/fixture.json')),
  out = '/tmp/m05/refinement/' + kind
const headers = {
    Authorization: 'Bearer ' + s.tokens['103'],
    'Content-Type': 'application/json',
  },
  api = async (path, b) => {
    const r = await fetch('http://127.0.0.1:4314/api/flows' + path, {
      method: b === undefined ? 'GET' : 'POST',
      headers,
      body: b === undefined ? undefined : JSON.stringify(b),
    })
    assert(r.ok, await r.clone().text())
    return r.json()
  }
function put(d, k, id, v) {
  const m = new Y.Map()
  d.getMap(k).set(id, m)
  Object.entries({ id, ...v }).forEach(([k, v]) => m.set(k, v))
  return m
}
;(async () => {
  const flow = await api('', {
      id: crypto.randomUUID(),
      name: 'Time Map pressure ' + kind,
      date: f.date,
      listId: f.listId,
      shotIds: f.shotIds.slice(0, 50),
    }),
    c = await join(flow.id, '103', 'flows')
  const events = [...c.doc.getMap('events').values()].sort(
      (a, b) => a.get('order') - b.get('order'),
    ),
    dep = [...c.doc.getMap('departments').keys()][0]
  c.doc.transact(() => {
    c.doc.getMap('meta').set('filmingStart', 540)
    events.forEach((e, i) =>
      e.set(
        'allottedMinutes',
        i < 8 ? [1, 2, 3, 5, 10, 30, 60, 120][i] : 1,
      ),
    )
    for (let i = 0; i < 3; i++)
      put(c.doc, 'events', crypto.randomUUID(), {
        type: 'department',
        departmentId: dep,
        description: 'Simultaneous ' + i,
        order: 52000 + i,
        timing: 'anchor',
        clockStart: 550,
        duration: 10,
        fixed: true,
      })
    put(c.doc, 'events', crypto.randomUUID(), {
      type: 'custom',
      description: 'Long-day checkpoint',
      order: 55000,
      timing: 'anchor',
      clockStart: 1410,
      duration: 30,
      fixed: true,
    })
    put(c.doc, 'events', crypto.randomUUID(), {
      type: 'custom',
      description: 'Duration still unknown',
      order: 56000,
      timing: 'unscheduled',
      duration: null,
    })
  }, 'local')
  await new Promise((r) => setTimeout(r, 600))
  const b = await pw[kind].launch(),
    ctx = await b.newContext({ viewport: { width: 1640, height: 1050 } }),
    p = await ctx.newPage()
  await p.addInitScript(
    (t) => localStorage.setItem('token', t),
    s.tokens['103'],
  )
  try {
    await p.goto('http://127.0.0.1:5176/productiondesk/#/flows/' + flow.id)
    await p.getByRole('radio', { name: 'Time Map', exact: true }).click()
    await p
      .getByRole('button', { name: 'Close Shot Rail', exact: true })
      .click()
    await p.getByRole('button', { name: 'Fit day', exact: true }).click()
    const blocks = p
      .locator('.flow-lane')
      .first()
      .locator('.flow-time-block')
    assert.equal(await blocks.count(), 51)
    const w = await blocks.evaluateAll((ns) =>
      ns.slice(0, 8).map((n) => parseFloat(n.style.width)),
    )
    const ratio = w[0]
    ;[1, 2, 3, 5, 10, 30, 60, 120].forEach((n, i) =>
      assert(Math.abs(w[i] - ratio * n) < 0.1, JSON.stringify(w)),
    )
    const ticks = await p
      .locator('.flow-time-ruler time')
      .evaluateAll((ns) =>
        ns.map((n) => {
          const r = n.getBoundingClientRect()
          return [r.left, r.right]
        }),
      )
    assert(ticks.every((r, i) => !i || r[0] >= ticks[i - 1][1]))
    await blocks.first().getByRole('button').first().focus()
    assert(
      (await p.locator('.flow-map-peek').innerText()).includes('10-A'),
    )
    assert(
      (await p.locator('.flow-unscheduled').innerText()).includes(
        'Needs scheduling',
      ),
    )
    const simultaneous = await p
      .locator('.flow-lane')
      .nth(1)
      .locator('.flow-time-block')
      .evaluateAll((ns) => ns.map((n) => n.style.top))
    assert.equal(new Set(simultaneous).size, 3)
    await p.screenshot({ path: out + '/08-map-fifty-short-15hours.png' })
    for (const zoom of [1.25, 1.5, 2]) {
      await p.setViewportSize({
        width: Math.round(1640 / zoom),
        height: Math.round(1050 / zoom),
      })
      await p.getByRole('button', { name: 'Fit day', exact: true }).click()
      const rule = await p
        .locator('.flow-time-ruler time')
        .evaluateAll((ns) =>
          ns.map((n) => n.getBoundingClientRect().toJSON()),
        )
      assert(rule.every((r, i) => !i || r.left >= rule[i - 1].right))
    }
    await p.setViewportSize({ width: 1024, height: 768 })
    await p.getByRole('button', { name: 'Fit day', exact: true }).click()
    await p.screenshot({ path: out + '/09-map-tablet.png' })
    console.log(
      kind +
        ': actual proportional 1/2/3/5/10/30/60/120min geometry; 50 consecutive shots; 15-hour span; three simultaneous tasks on separate tracks; missing duration remains unplaced; adaptive tick labels; focus detail; 125/150/200% layout and tablet passed.',
    )
  } finally {
    c.close()
    await b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
