const { state, out, create } = require('../m032/helpers.cjs'),
  path = require('path'),
  fs = require('fs'),
  assert = require('node:assert/strict')
const pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  wk = require('/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright')
;(async () => {
  const list = await create('Definitive M03 browser ' + crypto.randomUUID())
  for (const [name, engine] of [
    ['chrome', pw.chromium],
    ['webkit', wk.webkit],
  ]) {
    const b = await engine.launch(
      name === 'chrome'
        ? { channel: 'chrome', headless: true }
        : { headless: true },
    )
    try {
      const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
      await c.addInitScript(
        (t) => localStorage.setItem('token', t),
        state.tokens[101],
      )
      const p = await c.newPage()
      p.setDefaultTimeout(20000)
      const errors = []
      p.on('pageerror', (e) => errors.push(e.message))
      await p.goto(state.root + '#/shotlists/' + list.id)
      await p.locator('[data-sync="saved"]').waitFor()
      assert.equal(
        await p.getByRole('button', { name: 'Focus', exact: true }).count(),
        0,
      )
      await p.getByRole('button', { name: 'Grid preset', exact: true }).click()
      assert.equal(
        await p.getByRole('textbox', { name: 'Search grid preset' }).count(),
        0,
      )
      await p.locator('.pd-menu-open').evaluate(async (el) => {
        await Promise.all(el.getAnimations().map((a) => a.finished))
      })
      await p.screenshot({
        path: path.join(out, 'completion-' + name + '-preset-menu.png'),
      })
      await p
        .getByRole('menuitemradio', { name: 'Full Technical', exact: true })
        .click()
      await p.locator('tr[data-shot]').first().getByRole('checkbox').check()
      assert.equal(
        await p
          .getByRole('checkbox', { name: 'Select all visible shots' })
          .evaluate((el) => el.indeterminate),
        true,
      )
      await p.getByRole('button', { name: 'Download', exact: true }).click()
      await p.screenshot({
        path: path.join(out, 'completion-' + name + '-print-opening.png'),
      })
      await p
        .getByRole('link', { name: 'Download PDF', exact: true })
        .waitFor({ timeout: 60000 })
      assert.equal(
        await p
          .getByRole('button', { name: 'Generate PDF', exact: true })
          .count(),
        0,
      )
      await p.screenshot({
        path: path.join(out, 'completion-' + name + '-print.png'),
      })
      await p
        .getByRole('button', { name: 'Close Download shot list', exact: true })
        .click()
      await p.getByRole('link', { name: 'Shot lists', exact: true }).click()
      await p.getByRole('table', { name: 'Production shot lists' }).waitFor()
      const row = p.getByRole('row').filter({ hasText: list.name })
      assert.equal(
        await p.getByRole('table', { name: 'Production shot lists' }).count(),
        1,
      )
      for (let i = 0; i < 2; i++) {
        await row
          .getByRole('button', {
            name: 'Actions for ' + list.name,
            exact: true,
          })
          .click()
        await p.getByRole('menuitem', { name: 'Delete', exact: true }).click()
        await p
          .getByRole('dialog', { name: 'Delete this shot list?' })
          .waitFor()
        await p.screenshot({
          path: path.join(out, 'completion-' + name + '-delete-confirm.png'),
        })
        await p.getByRole('button', { name: 'Cancel', exact: true }).click()
        assert.equal(await p.getByRole('dialog').count(), 0)
        assert.equal(await row.locator('.pd-inline-delete').count(), 0)
      }
      await p.route(
        '**/shotlists/' + list.id + '/manage',
        (route) =>
          route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Controlled archive failure' }),
          }),
        { times: 1 },
      )
      await row
        .getByRole('button', { name: 'Actions for ' + list.name, exact: true })
        .click()
      await p.getByRole('menuitem', { name: 'Delete', exact: true }).click()
      await p
        .getByRole('dialog', { name: 'Delete this shot list?' })
        .getByRole('button', { name: 'Delete', exact: true })
        .click()
      await p.getByText('Controlled archive failure', { exact: true }).waitFor()
      await p.getByRole('button', { name: 'Cancel', exact: true }).click()
      await row
        .getByRole('button', { name: 'Actions for ' + list.name, exact: true })
        .click()
      await p.getByRole('menuitem', { name: 'Delete', exact: true }).click()
      await p
        .getByRole('dialog', { name: 'Delete this shot list?' })
        .press('Escape')
      assert.equal(await p.getByRole('dialog').count(), 0)
      await p.screenshot({
        path: path.join(out, 'completion-' + name + '-index-cancel.png'),
      })
      assert.deepEqual(errors, [])
      console.log(
        'PASS',
        name,
        'real checkbox/indeterminate, compact preset, automatic direct PDF, matching index and repeated Delete/Cancel',
      )
    } finally {
      await b.close()
    }
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
