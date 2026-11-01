const { state, out, create } = require('./helpers.cjs'),
  fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  webkitRuntime = require('/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright')
const results = [],
  sizes = [
    [1920, 1080],
    [1440, 900],
    [1280, 800],
    [1024, 768],
    [768, 1024],
    [390, 844],
    [360, 800],
  ]
;(async () => {
  const list = await create('Whiteout · viewport / engine QA')
  for (const [name, engine] of [
    ['chromium', pw.chromium],
    ['webkit', webkitRuntime.webkit],
  ]) {
    const browser = await engine.launch(
      name === 'chromium'
        ? { channel: 'chrome', headless: true }
        : { headless: true },
    )
    try {
      for (const [width, height] of sizes) {
        const context = await browser.newContext({
          viewport: { width, height },
          hasTouch: width < 768,
          serviceWorkers: 'block',
        })
        await context.addInitScript(
          (token) => localStorage.setItem('token', token),
          state.tokens[101],
        )
        const page = await context.newPage(),
          errors = []
        page.on('pageerror', (e) => errors.push(e.message))
        await page.goto(state.root + '#/shotlists/' + list.id)
        await page.locator('[data-sync="saved"]').waitFor({ timeout: 30000 })
        await page
          .getByRole('button', { name: 'Grid preset', exact: true })
          .click()
        await page
          .getByRole('option', { name: 'Full Technical', exact: true })
          .click()
        await page.evaluate(() => document.fonts.ready)
        const geometry = await page.evaluate(() => ({
          viewport: innerWidth,
          outer: document.documentElement.scrollWidth,
          table: document.querySelector('.pd-pro-table').getBoundingClientRect()
            .width,
          scroller: document.querySelector('.pd-pro-grid').clientWidth,
        }))
        assert.ok(
          geometry.outer <= geometry.viewport + 1,
          JSON.stringify({ name, width, geometry }),
        )
        assert.ok(geometry.table > 2700)
        await page.screenshot({
          path: path.join(out, `${name}-${width}-full.png`),
        })
        await page
          .locator('.pd-pro-grid')
          .evaluate((el) => (el.scrollLeft = 1000))
        const pinned = await page
            .locator('tbody .pd-pin-number')
            .first()
            .boundingBox(),
          scroll = await page.locator('.pd-pro-grid').boundingBox()
        assert.ok(
          pinned.x >= scroll.x && pinned.x + 50 < scroll.x + scroll.width,
        )
        await page.locator('tbody [data-field="number"] input').first().focus()
        await page
          .getByRole('button', { name: 'Open shot inspector', exact: true })
          .click()
        const inspector =
          width < 1360
            ? page.getByRole('dialog', { name: 'Shot inspector', exact: true })
            : page.locator('.pd-shot-inspector-desktop')
        await inspector.waitFor()
        const menu = inspector.getByRole('button', { name: /^Lens ·/ })
        await menu.click()
        const bounds = await page.locator('.pd-combo-panel').boundingBox()
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1)
        await page.screenshot({
          path: path.join(out, `${name}-${width}-inspector.png`),
        })
        await page.keyboard.press('Escape')
        assert.deepEqual(errors, [])
        results.push({
          engine: name,
          version: browser.version(),
          width,
          height,
          geometry,
          inspectorMenuWithinViewport: true,
          pass: true,
        })
        console.log('PASS', name, width, height)
        await context.close()
      }
    } finally {
      await browser.close()
    }
  }
  fs.writeFileSync(
    path.join(out, 'viewports.json'),
    JSON.stringify({ pass: true, results }, null, 2),
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
