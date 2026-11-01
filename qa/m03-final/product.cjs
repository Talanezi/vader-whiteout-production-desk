const { state, out, api, create } = require('../m032/helpers.cjs'),
  path = require('path'),
  fs = require('fs'),
  assert = require('node:assert/strict'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const list = await create('Final product UI ' + crypto.randomUUID()),
    browser = await chromium.launch({ channel: 'chrome', headless: true })
  const renamed = 'Final renamed ' + list.id
  try {
    const c = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    })
    await c.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens[101],
    )
    const p = await c.newPage()
    await p.goto(state.root + '#/shotlists/' + list.id)
    await p.locator('[data-sync="saved"]').waitFor()
    assert.equal(
      await p.getByRole('button', { name: 'Hide scenes', exact: true }).count(),
      0,
    )
    await p.getByRole('button', { name: 'Focus', exact: true }).click()
    assert.equal(await p.locator('.pd-shot-layout>.pd-scene-rail').count(), 0)
    await p.getByRole('button', { name: 'Restore layout', exact: true }).click()
    await p
      .getByRole('button', { name: 'Collapse scenes', exact: true })
      .click()
    await p.getByRole('button', { name: 'Show scenes', exact: true }).click()
    await p.locator('.pd-avatar').first().hover()
    await p
      .getByRole('tooltip')
      .getByText('Maya Chen', { exact: true })
      .waitFor()
    await p.mouse.move(600, 200)
    await p.getByRole('button', { name: 'All Shots', exact: true }).click()
    await p
      .getByRole('menuitemradio', { name: 'Shooting Order', exact: true })
      .click()
    await p.getByRole('button', { name: 'Add day', exact: true }).click()
    let dialog = p.getByRole('dialog', {
      name: 'Add shooting day',
      exact: true,
    })
    await dialog
      .getByRole('textbox', { name: 'New shoot date', exact: true })
      .fill('2027-06-02')
    await dialog
      .getByRole('textbox', { name: 'New shoot date', exact: true })
      .press('Tab')
    await dialog.getByRole('textbox', { name: 'New day label' }).fill('Pickups')
    await dialog.getByRole('button', { name: 'Add day', exact: true }).click()
    await p.getByRole('button', { name: 'Assign Shots', exact: true }).click()
    dialog = p.getByRole('dialog', { name: 'Assign shots', exact: true })
    await dialog
      .locator('.pd-day-shot-picker input[type="checkbox"]')
      .nth(0)
      .check()
    await dialog
      .locator('.pd-day-shot-picker input[type="checkbox"]')
      .nth(1)
      .check()
    await dialog
      .getByRole('button', { name: 'Assign 2 shots', exact: true })
      .click()
    assert.equal(await p.locator('tr[data-assignment]').count(), 2)
    await p.getByRole('button', { name: 'Assign Shots', exact: true }).click()
    dialog = p.getByRole('dialog', { name: 'Assign shots', exact: true })
    await dialog
      .getByRole('checkbox', { name: 'Pickup / repeat assignment' })
      .check()
    await dialog
      .locator('.pd-day-shot-picker input[type="checkbox"]')
      .first()
      .check()
    await dialog
      .getByRole('button', { name: 'Assign 1 shots', exact: true })
      .click()
    assert.equal(await p.locator('tr[data-assignment]').count(), 3)
    await p
      .locator('tr[data-assignment]')
      .last()
      .getByRole('button', { name: /^Move assignment .* earlier$/ })
      .click()
    const remove = p.locator('tr[data-assignment]').first()
    await remove.getByRole('button', { name: /^Delete assignment / }).click()
    await remove
      .getByRole('button', { name: /^Confirm delete assignment / })
      .click()
    assert.equal(await p.locator('tr[data-assignment]').count(), 2)

    await p.getByRole('button', { name: 'Day actions', exact: true }).click()
    await p.getByRole('menuitem', { name: 'Edit day', exact: true }).click()
    dialog = p.getByRole('dialog', { name: 'Edit shooting day', exact: true })
    await dialog
      .getByRole('textbox', { name: 'Day label', exact: true })
      .fill('Revised pickup day')
    await dialog
      .getByRole('button', { name: 'Close Edit shooting day', exact: true })
      .click()
    await p.locator('[data-sync="saved"]').waitFor()
    await p.reload()
    await p.locator('[data-sync="saved"]').waitFor()
    const saved = await api('/' + list.id + '/export')
    assert.ok(
      Object.values(saved.shootDays).find(
        (d) => d.title === 'Revised pickup day',
      ),
    )
    assert.equal(
      Object.values(saved.shootAssignments).filter((a) => !a.deleted).length,
      2,
    )
    await p.getByRole('button', { name: 'All Shots', exact: true }).click()
    await p
      .getByRole('menuitemradio', { name: 'Shooting Order', exact: true })
      .click()
    await p.screenshot({ path: path.join(out, 'final', 'shooting-order.png') })
    await p.getByRole('link', { name: 'Shot lists', exact: true }).click()
    const row = p.locator('.pd-shot-index-row').filter({ hasText: list.name })
    await row
      .getByRole('button', { name: 'Actions for ' + list.name, exact: true })
      .click()
    await p.getByRole('menuitem', { name: 'Rename', exact: true }).click()
    dialog = p.getByRole('dialog', { name: 'Rename shot list' })
    await dialog
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill(renamed)
    await dialog.getByRole('button', { name: 'Save', exact: true }).click()
    await p
      .getByRole('button', {
        name: 'Actions for ' + renamed,
        exact: true,
      })
      .click()
    await p.getByRole('menuitem', { name: 'Delete', exact: true }).click()
    await p
      .getByRole('button', {
        name: 'Confirm delete shot list ' + renamed,
        exact: true,
      })
      .click()
    await p
      .getByRole('link')
      .filter({ hasText: renamed })
      .waitFor({ state: 'hidden' })
    await api('/' + list.id + '/manage', { action: 'restore' })
    assert.ok(
      Object.values(saved.shootAssignments).some((a) => a.pickup && !a.deleted),
    )
    console.log(
      'PASS focus/rail, real-name tooltip, add/edit day, focused multi-assignment, reload, UI rename/delete and recovery',
    )
    fs.writeFileSync(
      path.join(out, 'final', 'product.json'),
      JSON.stringify({ pass: true, listId: list.id }, null, 2),
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
