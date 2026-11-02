const fs = require('fs'),
  assert = require('assert/strict'),
  crypto = require('crypto'),
  pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  { join, until } = require('../m04/collaboration.cjs'),
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
    listName = 'M05 connection fixture'
  await api('/shotlists/' + fixture.listId + '/manage', {
    action: 'rename',
    name: listName,
  })
  const flow = await api('/flows', {
      id: crypto.randomUUID(),
      name: 'M05 source connection acceptance',
      date: '2026-09-25',
      zone: 'America/Los_Angeles',
    }),
    browser = await pw.chromium.launch(),
    p = await browser.newPage({ viewport: { width: 1600, height: 1050 } }),
    client = await join(fixture.listId, '102', 'shotlists')
  await p.addInitScript(
    (t) => localStorage.setItem('token', t),
    state.tokens['101'],
  )
  p.setDefaultTimeout(15000)
  try {
    await p.goto('http://127.0.0.1:5176/productiondesk/#/flows/' + flow.id)
    await p
      .getByRole('button', { name: 'Connect Shot List', exact: true })
      .click()
    await p.locator('.sb-toolstrip button[aria-haspopup=menu]').first().click()
    await p.getByRole('menuitemradio', { name: listName, exact: true }).click()
    await p
      .getByRole('button', { name: 'Connect without scheduling', exact: true })
      .click()
    await p.getByText('Saved', { exact: true }).waitFor()
    let snapshot = await api('/flows/' + flow.id + '/snapshot')
    assert.equal(snapshot.state.meta.listId, fixture.listId)
    assert.equal(Object.keys(snapshot.state.events).length, 0)
    const rail = p
        .locator('.flow-rail-shot')
        .filter({ hasText: '19-1' })
        .first(),
      grip = await rail.locator('.flow-grip').boundingBox(),
      target = await p.locator('.flow-grid-scroll').boundingBox()
    await p.mouse.move(grip.x + 7, grip.y + 7)
    await p.mouse.down()
    await p.mouse.move(target.x + 250, target.y + 180, { steps: 25 })
    await p.waitForTimeout(200)
    await p.mouse.up()
    await p.waitForFunction(
      () => document.querySelectorAll('.flow-grid tbody tr').length === 1,
    )
    await p.getByText('Saved', { exact: true }).waitFor()
    snapshot = await api('/flows/' + flow.id + '/snapshot')
    const event = Object.values(snapshot.state.events)[0]
    assert.equal(event.shotId, fixture.shotIds[0])
    await p.locator('.flow-shot-ref').click()
    await p.getByRole('button', { name: 'Lens', exact: true }).click()
    await p.getByRole('option', { name: '50mm', exact: true }).click()
    await p.getByText('Saved', { exact: true }).waitFor()
    const updated = await api('/shotlists/' + fixture.listId + '/export')
    assert.equal(updated.shots[fixture.shotIds[0]].lens, '50mm')
    await p.screenshot({
      path: '/tmp/m05/screenshots/chromium/20-source-technical-edit.png',
    })
    await p.getByRole('button', { name: /^Close 19-1$/ }).click()
    client.doc.getMap('shots').get(fixture.shotIds[0]).set('deleted', true)
    await p.getByText('Source unavailable · relink', { exact: true }).waitFor()
    await p.screenshot({
      path: '/tmp/m05/screenshots/chromium/21-missing-source.png',
    })
    await p.locator('.flow-shot-ref').click()
    await p.getByRole('button', { name: 'Relink shot', exact: true }).click()
    await p.getByRole('checkbox', { name: new RegExp('^Select 19-2,') }).check()
    await p
      .getByRole('button', { name: 'Use selected shots', exact: true })
      .click()
    await p.getByText('Saved', { exact: true }).waitFor()
    snapshot = await api('/flows/' + flow.id + '/snapshot')
    assert.equal(snapshot.state.events[event.id].shotId, fixture.shotIds[1])
    assert.equal(Object.keys(snapshot.state.events).length, 1)
    await p.getByRole('button', { name: /^Close 19-2$/ }).click()
    await p
      .getByRole('button', { name: 'Shot List connection', exact: true })
      .click()
    await p.getByRole('menuitem', { name: 'Disconnect', exact: true }).click()
    await p.screenshot({
      path: '/tmp/m05/screenshots/chromium/22-disconnect-confirm.png',
    })
    await p
      .getByRole('dialog', { name: 'Disconnect Shot List?' })
      .getByRole('button', { name: 'Disconnect', exact: true })
      .click()
    await p.getByText('Saved', { exact: true }).waitFor()
    snapshot = await api('/flows/' + flow.id + '/snapshot')
    assert.equal(snapshot.state.meta.listId, '')
    assert.equal(Object.keys(snapshot.state.events).length, 1)
    assert.equal(snapshot.state.events[event.id].reference, '19-2')
    console.log(
      'Blank Flow connects without creating occurrences; real empty-grid rail drop; authorized M03 Lens write; live deleted-source state; single-UUID relink preserves occurrence; disconnect preserves rows and accurate historical labels passed.',
    )
  } finally {
    client.doc
      .getMap('shots')
      .get(fixture.shotIds[0])
      .set('deleted', source.shots[fixture.shotIds[0]].deleted)
    client.doc
      .getMap('shots')
      .get(fixture.shotIds[0])
      .set('lens', source.shots[fixture.shotIds[0]].lens)
    await new Promise((r) => setTimeout(r, 500))
    client.close()
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
