const fs = require('fs'),
  assert = require('assert/strict'),
  pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  fixture = JSON.parse(fs.readFileSync('/tmp/m05/fixture.json')),
  headers = { Authorization: 'Bearer ' + state.tokens['101'] },
  url = 'http://127.0.0.1:4314/api/flows/' + fixture.id + '/snapshot'
async function snapshot() {
  return (await (await fetch(url, { headers })).json()).state
}
;(async () => {
  const browser = await pw.chromium.launch(),
    p = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  await p.addInitScript(
    (t) => localStorage.setItem('token', t),
    state.tokens['101'],
  )
  try {
    await p.goto('http://127.0.0.1:5176/productiondesk/#/flows/' + fixture.id)
    await p.getByText('Saved', { exact: true }).waitFor()
    const before = await snapshot()
    await p.locator('.flow-grid tbody tr').first().getByRole('checkbox').check()
    await p.getByRole('button', { name: 'Layout', exact: true }).click()
    await p
      .getByRole('menuitem', {
        name: 'Shift following activities',
        exact: true,
      })
      .click()
    await p
      .getByLabel('Minutes · positive or negative', { exact: true })
      .fill('15')
    await p.screenshot({
      path: '/tmp/m05/screenshots/chromium/19-shift-preview.png',
    })
    await p.getByRole('button', { name: /^Shift \d+ activities$/ }).click()
    await p.getByText('Saved', { exact: true }).waitFor()
    const shifted = await snapshot()
    for (const e of Object.values(before.events)) {
      if (e.fixed || !e.start) assert.equal(shifted.events[e.id].start, e.start)
      else
        assert.equal(
          Date.parse(shifted.events[e.id].start) - Date.parse(e.start),
          900000,
        )
    }
    await p.getByRole('button', { name: 'Undo', exact: true }).click()
    await p.getByText('Saved', { exact: true }).waitFor()
    const restored = await snapshot()
    for (const e of Object.values(before.events))
      assert.equal(restored.events[e.id].start, e.start)
    console.log(
      'Actual shift preview/application advances eligible events by 15 minutes, keeps fixed/untimed entries unchanged, and one Undo restores all planned times.',
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
