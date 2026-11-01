const { runtime, state, out, create } = require('./helpers.cjs'),
  fs = require('node:fs'),
  path = require('node:path')
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const results = []
  try {
    for (const size of [500, 2000]) {
      const list = await create(`M03.2 ${size}-shot performance`, size),
        context = await browser.newContext({
          viewport: { width: 1440, height: 900 },
        })
      await context.addInitScript(
        (token) => localStorage.setItem('token', token),
        state.tokens[101],
      )
      const page = await context.newPage()
      page.setDefaultTimeout(90000)
      console.log('START', size)
      const start = Date.now()
      await page.goto(state.root + '#/shotlists/' + list.id)
      await page
        .locator('.pd-pro-table tbody [data-shot]')
        .first()
        .waitFor({ timeout: 120000 })
      await page.locator('[data-sync="saved"]').waitFor({ timeout: 120000 })
      const load = Date.now() - start
      console.log('LOADED', size, load)
      const ready = Date.now()
      await page
        .getByRole('button', { name: 'Grid preset', exact: true })
        .click()
      await page
        .getByRole('option', { name: 'Full Technical', exact: true })
        .click()
      console.log('FULL SELECTED', size)
      await page
        .locator('[data-field="lightingNotes"]')
        .first()
        .waitFor({ timeout: 120000 })
      const full = Date.now() - ready
      const input = page.locator('[data-field="number"] input').first(),
        editStart = Date.now()
      await input.fill(`PERF-${size}`)
      await page.locator('[data-sync="saved"]').waitFor({ timeout: 120000 })
      const edit = Date.now() - editStart
      const resize = page.getByRole('separator', {
        name: 'Resize Action / coverage',
        exact: true,
      })
      await resize.evaluate((el) =>
        el.scrollIntoView({ inline: 'center', block: 'nearest' }),
      )
      const before = Number(await resize.getAttribute('aria-valuenow')),
        bounds = await resize.boundingBox()
      await page.mouse.move(bounds.x + 3, bounds.y + 10)
      await page.mouse.down()
      const resizeStart = Date.now()
      await page.mouse.move(bounds.x + 80, bounds.y + 10, { steps: 8 })
      await page.mouse.up()
      const after = Number(await resize.getAttribute('aria-valuenow'))
      require('node:assert/strict').ok(
        after > before + 40,
        'Actual visible boundary resized',
      )
      results.push({
        widthBefore: before,
        widthAfter: after,
        shots: size,
        loadMs: load,
        fullTechnicalMs: full,
        editSavedMs: edit,
        resizeMs: Date.now() - resizeStart,
        nodes: await page.locator('*').count(),
      })
      fs.writeFileSync(
        path.join(out, 'performance.json'),
        JSON.stringify(results, null, 2),
      )
      console.log(results.at(-1))
      await context.close()
    }
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
