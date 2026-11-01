const { state, out, api } = require('../m032/helpers.cjs'),
  fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const dest = path.join(out, 'final'),
    list = JSON.parse(fs.readFileSync(path.join(dest, 'product.json'))),
    b = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
    await c.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens[101],
    )
    const p = await c.newPage()
    await p.goto(state.root + '#/shotlists/' + list.listId)
    await p.locator('[data-sync="saved"]').waitFor()
    const other = await b.newContext({
      viewport: { width: 1440, height: 1000 },
    })
    await other.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens[102],
    )
    const peer = await other.newPage()
    await peer.goto(state.root + '#/shotlists/' + list.listId)
    await peer.locator('[data-sync="saved"]').waitFor()
    const avatar = p.locator('.pd-avatar').filter({ hasText: 'EM' })
    await avatar.hover()
    await p
      .getByRole('tooltip')
      .getByText('Elias Moreno', { exact: true })
      .waitFor()
    await avatar.focus()
    const a = await avatar.boundingBox(),
      t = await p.getByRole('tooltip').boundingBox()
    assert.ok(t.y >= a.y + a.height)
    assert.ok(t.x >= 0 && t.x + t.width <= 1440)
    await p.screenshot({ path: path.join(dest, 'collaborator-name.png') })
    await other.close()
    await p.getByRole('button', { name: 'All Scenes', exact: true }).click()
    await p
      .getByRole('menuitemradio', { name: 'Shooting Order', exact: true })
      .click()
    await p.getByRole('button', { name: 'Day actions', exact: true }).click()
    await p.getByRole('menuitem', { name: 'Add day', exact: true }).click()
    const d = p.getByRole('dialog', { name: 'Add shooting day', exact: true })
    await d
      .getByRole('textbox', { name: 'New shoot date', exact: true })
      .fill('2027-06-03')
    await d
      .getByRole('textbox', { name: 'New shoot date', exact: true })
      .press('Tab')
    await d.getByRole('button', { name: 'Add day', exact: true }).click()
    assert.equal(await p.locator('tr[data-assignment]').count(), 0)
    await p.getByRole('button', { name: 'Change day', exact: true }).click()
    await p.getByRole('option', { name: /Jun 2, 2027/ }).click()
    assert.equal(await p.locator('tr[data-assignment]').count(), 2)
    await p.getByRole('button', { name: 'Change day', exact: true }).click()
    await p.getByRole('option', { name: /Jun 3, 2027/ }).click()
    await p.getByRole('button', { name: 'Day actions', exact: true }).click()
    await p.getByRole('menuitem', { name: 'Delete day', exact: true }).click()
    await p
      .getByRole('button', {
        name: /^Confirm delete shoot day and its assignments/,
      })
      .click()
    await p.locator('[data-sync="saved"]').waitFor()
    assert.equal(await p.locator('tr[data-assignment]').count(), 2)
    const saved = await api('/' + list.listId + '/export')
    assert.equal(
      Object.values(saved.shootDays).filter((d) => !d.deleted).length,
      1,
    )
    assert.equal(Object.values(saved.shots).filter((s) => !s.deleted).length, 8)
    assert.ok(
      Object.values(saved.shootAssignments).some((a) => a.pickup && !a.deleted),
    )
    console.log(
      'PASS other collaborator full-name hover/focus and edge geometry; switch and recoverably delete a day without changing masters',
    )
    fs.writeFileSync(
      path.join(dest, 'day-lifecycle.json'),
      JSON.stringify({ pass: true }, null, 2),
    )
  } finally {
    await b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
