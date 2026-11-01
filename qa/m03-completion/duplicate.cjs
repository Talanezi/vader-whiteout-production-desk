const { state, out, api, create, join } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  path = require('node:path'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const list = await create('Duplicate identity review ' + crypto.randomUUID()),
    peer = await join(list.id),
    records = [...peer.doc.getMap('shots').values()].slice(0, 2)
  peer.doc.transact(() => records.forEach((s) => s.set('number', 'B')))
  await new Promise((r) => setTimeout(r, 1400))
  peer.close()
  const before = await api('/' + list.id + '/export'),
    id = records[0].get('id'),
    b = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
    await c.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens[101],
    )
    const p = await c.newPage()
    p.setDefaultTimeout(15000)
    await p.goto(state.root + '#/shotlists/' + list.id)
    await p.locator('[data-sync="saved"]').waitFor()
    const row = p.locator(`tr[data-shot="${id}"]`)
    await row
      .getByRole('button', { name: 'Inspect shot B', exact: true })
      .click()
    await p
      .getByText(
        'Duplicate shot number. Edit Shot number below to distinguish this shot.',
        { exact: true },
      )
      .waitFor()
    await p.screenshot({
      path: path.join(out, 'completion-duplicate-warning.png'),
    })
    const after = await api('/' + list.id + '/export')
    assert.deepEqual(after.shots, before.shots)
    const field = p
      .locator('.pd-inspector-body [data-field="number"] input')
      .first()
    await field.click()
    await field.press('ControlOrMeta+A')
    await field.fill('09-Z')
    await field.press('Tab')
    await p.locator('[data-sync="saved"]').waitFor()
    assert.equal(
      await p
        .getByText(
          'Duplicate shot number. Edit Shot number below to distinguish this shot.',
          { exact: true },
        )
        .count(),
      0,
    )
    const final = await api('/' + list.id + '/export')
    assert.equal(final.shots[id].number, '09-Z')
    assert.equal(final.shots[records[1].get('id')].number, 'B')
    console.log(
      'PASS duplicate warning without mutation; explicit inspector correction changes only chosen label',
    )
  } finally {
    await b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
