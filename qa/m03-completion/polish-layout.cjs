const { state, out, create } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  path = require('node:path'),
  fs = require('node:fs'),
  pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  wk = require('/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright')
;(async () => {
  const list = await create('M03 responsive controls ' + crypto.randomUUID())
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
      p.setDefaultTimeout(15000)
      for (const height of [1000, 700, 480]) {
        await p.setViewportSize({ width: 1280, height })
        await p.goto(state.root + '#/shotlists/' + list.id)
        await p.locator('[data-sync="saved"]').waitFor()
        await p
          .getByRole('button', { name: 'Choose columns', exact: true })
          .click()
        const dialog = p.getByRole('dialog', {
          name: 'Columns and layout',
          exact: true,
        })
        const g = await dialog.evaluate((el) => {
          const body = el.querySelector('.pd-overlay-body')
          return {
            dialog: el.getBoundingClientRect().toJSON(),
            body: body.getBoundingClientRect().toJSON(),
            header: el
              .querySelector('.pd-overlay-header')
              .getBoundingClientRect()
              .toJSON(),
            footer: el
              .querySelector('.pd-overlay-footer')
              .getBoundingClientRect()
              .toJSON(),
            scrollHeight: body.scrollHeight,
            clientHeight: body.clientHeight,
            preset: el
              .querySelector('.pd-menu-trigger')
              ?.getBoundingClientRect()
              .toJSON(),
          }
        })
        assert.ok(
          g.body.height > Math.min(160, height * 0.3),
          JSON.stringify(g),
        )
        assert.ok(g.header.top >= 0 && g.footer.bottom <= height + 1)
        assert.ok(
          g.preset.top >= g.body.top && g.preset.bottom <= g.body.bottom,
          JSON.stringify(g),
        )
        await p
          .getByRole('checkbox', { name: 'Show Schedule status', exact: true })
          .scrollIntoViewIfNeeded()
        await p
          .getByRole('checkbox', { name: 'Show Schedule status', exact: true })
          .check()
        await p.screenshot({
          path: path.join(out, `polish-${name}-columns-${height}.png`),
        })
        await p
          .getByRole('button', {
            name: 'Close Columns and layout',
            exact: true,
          })
          .click()
        await p
          .getByRole('button', { name: 'Choose columns', exact: true })
          .click()
        assert.equal(
          await p
            .getByRole('checkbox', {
              name: 'Show Schedule status',
              exact: true,
            })
            .isChecked(),
          true,
        )
        await p
          .getByRole('button', {
            name: 'Close Columns and layout',
            exact: true,
          })
          .click()
      }
      // Actual pending/reconnection lifecycle; no fixture spinner substitution.
      await p.setViewportSize({ width: 1280, height: 900 })
      await p.goto(state.root + '#/shotlists/' + list.id)
      await p.locator('[data-sync="saved"]').waitFor()
      await c.setOffline(true)
      await p
        .getByText(
          'Connection interrupted. Keep this window open; edits remain in memory.',
          { exact: true },
        )
        .waitFor()
      await c.setOffline(false)
      let sawPending = false
      p.on('console', () => {})
      await p.waitForFunction(() =>
        document.querySelector('[data-sync="saved"]'),
      )
      await p
        .getByText('Connection restored. All changes saved.', { exact: true })
        .waitFor()
      assert.equal(await p.locator('.pd-toast-pending').count(), 0)
      assert.equal(await p.locator('.pd-toasts .pd-spinner').count(), 0)
      // Force a genuine persistence interval with a local master edit, observing contained dots in pending delete.
      await p
        .locator('tr[data-shot]')
        .first()
        .getByRole('button', { name: /^Delete shot/ })
        .click()
      const confirm = p
        .locator('tr[data-shot]')
        .first()
        .getByRole('button', { name: /^Confirm delete shot/ })
      await confirm.click()
      await p.locator('.pd-toast-pending .pd-dots-loader').waitFor()
      const box = await p
        .locator('.pd-toast-pending .pd-dots-loader')
        .boundingBox()
      assert.ok(box.width <= 24 && box.height <= 24)
      await p.screenshot({
        path: path.join(out, 'polish-' + name + '-dots-pending.png'),
      })
      await p
        .getByRole('button', { name: 'Restore', exact: true })
        .last()
        .waitFor()
      await p
        .getByRole('button', { name: 'Restore', exact: true })
        .last()
        .click()
      await p.locator('[data-sync="saved"]').waitFor()
      await p.waitForFunction(
        () => !document.querySelector('.pd-toast-pending'),
      )
      assert.equal(
        await p.locator('.pd-toast-pending .pd-dots-loader').count(),
        0,
      )
      console.log(
        'PASS',
        name,
        'normal/short modal field scroll/reopen; actual offline/reconnect/Saved; contained pending dots stop after save',
      )
    } finally {
      await b.close()
    }
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
