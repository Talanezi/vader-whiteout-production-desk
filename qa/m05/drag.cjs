const fs = require('fs'),
  assert = require('assert/strict'),
  crypto = require('crypto'),
  kind = process.env.M05_BROWSER || 'chromium',
  pw = require(
    kind === 'webkit'
      ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  fixture = JSON.parse(fs.readFileSync('/tmp/m05/fixture.json')),
  headers = {
    Authorization: 'Bearer ' + state.tokens['101'],
    'Content-Type': 'application/json',
  },
  base = 'http://127.0.0.1:4314/api'
async function api(p, b) {
  const r = await fetch(base + p, {
    method: b === undefined ? 'GET' : 'POST',
    headers,
    body: b === undefined ? undefined : JSON.stringify(b),
  })
  assert(r.ok, await r.clone().text())
  return r.json()
}
;(async () => {
  const source = await api('/shotlists/' + fixture.listId + '/export'),
    flow = await api('/flows', {
      id: crypto.randomUUID(),
      name: 'M05 disposable drag ' + kind,
      date: '2026-09-25',
      zone: 'America/Los_Angeles',
      listId: fixture.listId,
      shotIds: fixture.shotIds.slice(0, 2),
      start: '2026-09-25T14:00:00.000Z',
    }),
    browser = await pw[kind].launch({ headless: true }),
    p = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  await p.addInitScript(
    (t) => localStorage.setItem('token', t),
    state.tokens['101'],
  )
  p.setDefaultTimeout(15000)
  try {
    await p.goto('http://127.0.0.1:5176/productiondesk/#/flows/' + flow.id)
    await p.getByText('Saved', { exact: true }).waitFor()
    const before = await api('/flows/' + flow.id + '/snapshot'),
      ids = Object.keys(before.state.events)
    const rows = p.locator('.flow-grid tbody tr')
    const from = await rows.first().locator('.flow-grip').boundingBox(),
      to = await rows.nth(1).boundingBox()
    await p.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
    await p.mouse.down()
    await p.mouse.move(from.x + from.width / 2, to.y + to.height * 0.8, {
      steps: 16,
    })
    await p.waitForTimeout(200)
    await p.mouse.up()
    await p
      .getByRole('dialog', { name: 'Preview timing change', exact: true })
      .waitFor()
    await p.getByRole('button', { name: 'Apply move', exact: true }).click()
    await p.getByText('Saved', { exact: true }).waitFor()
    let snapshot = await api('/flows/' + flow.id + '/snapshot')
    assert(
      Object.values(snapshot.state.events).some(
        (e) => e.start !== before.state.events[e.id].start,
      ),
    )
    const rail = p.locator('.flow-rail-shot').filter({ hasText: '19-3' })
    const grip = await rail.locator('.flow-grip').boundingBox(),
      target = await rows.first().boundingBox()
    await p.mouse.move(grip.x + 8, grip.y + 8)
    await p.mouse.down()
    await p.mouse.move(target.x + 250, target.y + target.height / 2, {
      steps: 25,
    })
    await p.waitForTimeout(200)
    await p.mouse.up()
    await p.waitForFunction(
      () => document.querySelectorAll('.flow-grid tbody tr').length === 3,
    )
    await p.getByText('Saved', { exact: true }).waitFor()
    snapshot = await api('/flows/' + flow.id + '/snapshot')
    assert(
      Object.values(snapshot.state.events).some(
        (e) => e.shotId === fixture.shotIds[2],
      ),
    )
    await p.getByRole('button', { name: 'Time Map', exact: true }).click()
    const resize = p.locator('.flow-resize-duration').first(),
      box = await resize.boundingBox()
    await p.mouse.move(box.x + box.width / 2, box.y + 15)
    await p.mouse.down()
    await p.mouse.move(box.x + 22, box.y + 15, { steps: 10 })
    await p.mouse.up()
    await p
      .getByRole('dialog', { name: 'Preview timing change', exact: true })
      .waitFor()
    await p.getByRole('button', { name: 'Apply move', exact: true }).click()
    await p.getByText('Saved', { exact: true }).waitFor()
    snapshot = await api('/flows/' + flow.id + '/snapshot')
    assert(Object.values(snapshot.state.events).some((e) => e.duration != null))
    const after = await api('/shotlists/' + fixture.listId + '/export')
    assert.deepEqual(after.shots, source.shots)
    await p.screenshot({
      path: '/tmp/m05/screenshots/' + kind + '/18-drag-time-map.png',
    })
    console.log(
      kind +
        ' actual timed row drag/preview/apply, real Shot Rail drop creating one UUID occurrence, Time Map pointer resize, and unchanged authoritative M03 source passed.',
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
