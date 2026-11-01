const { state, out } = require('../m032/helpers.cjs'),
  fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict'),
  pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  wk = require('/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright')
;(async () => {
  const dest = path.join(out, 'final'),
    list = JSON.parse(fs.readFileSync(path.join(dest, 'acceptance.json')))
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
      const c = await b.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      })
      await c.addInitScript(
        (t) => localStorage.setItem('token', t),
        state.tokens[101],
      )
      const p = await c.newPage()
      await p.goto(state.root + '#/shotlists/' + list.listId)
      await p.locator('[data-sync="saved"]').waitFor()
      await p.getByRole('button', { name: 'Download', exact: true }).click()
      await p
        .getByRole('link', { name: 'Download PDF', exact: true })
        .waitFor({ timeout: 60000 })
      const geometry = await p.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        dialog: document
          .querySelector('dialog[open]')
          .getBoundingClientRect()
          .toJSON(),
      }))
      assert.ok(geometry.scroll <= geometry.width + 1)
      assert.ok(geometry.dialog.x >= 0 && geometry.dialog.right <= 391)
      await p.screenshot({ path: path.join(dest, name + '-mobile-print.png') })
      await p
        .getByRole('button', { name: 'Close Download shot list', exact: true })
        .click()
      assert.equal(
        await p
          .getByRole('button', { name: 'Hide scenes', exact: true })
          .count(),
        0,
      )
      console.log(
        'PASS',
        name,
        '390px automatic print preview, accessible fixed download and no outer overflow',
      )
    } finally {
      await b.close()
    }
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
