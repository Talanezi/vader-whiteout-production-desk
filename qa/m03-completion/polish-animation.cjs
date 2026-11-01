const { state, out, create } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  path = require('node:path'),
  fs = require('node:fs'),
  pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  wk = require('/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright')
;(async () => {
  const results = []
  for (const [name, engine] of [
    ['chrome', pw.chromium],
    ['webkit', wk.webkit],
  ]) {
    const list = await create('M03 path animation ' + name),
      b = await engine.launch(
        name === 'chrome'
          ? { channel: 'chrome', headless: true }
          : { headless: true },
      )
    try {
      const c = await b.newContext({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: 'no-preference',
      })
      if (name === 'chrome')
        await c.grantPermissions(['clipboard-read', 'clipboard-write'])
      await c.addInitScript(
        (t) => localStorage.setItem('token', t),
        state.tokens[101],
      )
      const p = await c.newPage()
      p.setDefaultTimeout(15000)
      await p.goto(state.root + '#/shotlists/' + list.id)
      await p.locator('[data-sync="saved"]').waitFor()
      const header = p.getByRole('checkbox', {
          name: 'Select all visible shots',
          exact: true,
        }),
        row = p.locator('tr[data-shot]').first().getByRole('checkbox'),
        tick = p.locator('thead .pd-draw-tick')
      const frames = () =>
        tick.evaluate(async (el) => {
          let a = []
          for (let i = 0; i < 23; i++) {
            a.push({
              dash: parseFloat(getComputedStyle(el).strokeDashoffset),
              display: getComputedStyle(el).display,
            })
            await new Promise(requestAnimationFrame)
          }
          return a
        })
      await header.check()
      const full = await frames()
      assert.ok(
        full.some((v) => v.dash > 0 && v.dash < 1),
        JSON.stringify(full),
      )
      await header.uncheck()
      await row.check()
      assert.equal(await header.evaluate((el) => el.indeterminate), true)
      await header.check()
      const mixed = await frames()
      assert.ok(
        mixed.some((v) => v.dash > 0 && v.dash < 1),
        JSON.stringify(mixed),
      )
      await p.getByRole('button', { name: 'Grid preset', exact: true }).click()
      await p.keyboard.press('Escape')
      assert.equal(await tick.evaluate((el) => el.getAnimations().length), 0)
      assert.equal(
        await tick.evaluate((el) =>
          parseFloat(getComputedStyle(el).strokeDashoffset),
        ),
        0,
      )
      await p
        .getByRole('button', { name: 'Copy selected', exact: true })
        .click()
      await p.locator('.is-copied').waitFor()
      await p.waitForTimeout(240)
      const green = await p.locator('.is-copied').evaluate((el) => ({
        color: getComputedStyle(el).color,
        border: getComputedStyle(el).borderColor,
        background: getComputedStyle(el).backgroundColor,
      }))
      assert.equal(green.color, 'rgb(166, 235, 193)')
      await p.screenshot({
        path: path.join(out, 'polish-' + name + '-green-copy.png'),
      })
      await p
        .getByRole('button', { name: 'Duplicate selected', exact: true })
        .click()
      await p.locator('.is-duplicated').waitFor()
      await p.waitForTimeout(240)
      const blue = await p.locator('.is-duplicated').evaluate((el) => ({
        color: getComputedStyle(el).color,
        background: getComputedStyle(el).backgroundColor,
      }))
      assert.equal(blue.color, 'rgb(181, 230, 255)')
      await p.screenshot({
        path: path.join(out, 'polish-' + name + '-blue-duplicate.png'),
      })
      await p.emulateMedia({ reducedMotion: 'reduce' })
      assert.equal(
        await tick.evaluate((el) => getComputedStyle(el).transitionDuration),
        '0s',
      )
      await p.goto(state.root + 'qa/m03-completion/controls.html')
      const dots = p.locator('.pd-dots-loader')
      const bounded = await dots.boundingBox()
      assert.ok(bounded.width <= 24 && bounded.height <= 24)
      assert.equal(
        await dots
          .locator('i')
          .first()
          .evaluate((el) => getComputedStyle(el).animationName),
        'none',
      )
      results.push({ name, full, mixed, green, blue, pass: true })
      console.log(
        'PASS',
        name,
        'actual unchecked and mixed Select All path frames; no rerender restart; green/blue feedback; reduced motion',
      )
    } finally {
      await b.close()
    }
  }
  fs.writeFileSync(
    path.join(out, 'polish-animation.json'),
    JSON.stringify({ pass: true, results }, null, 2),
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
