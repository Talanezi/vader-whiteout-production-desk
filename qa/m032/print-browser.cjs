const { state, out, create } = require('./helpers.cjs'),
  fs = require('node:fs'),
  path = require('node:path'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const list = await create('Whiteout · selected table preview'),
      context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      })
    await context.addInitScript(
      (token) => localStorage.setItem('token', token),
      state.tokens[101],
    )
    const page = await context.newPage()
    page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning')
        console.log(m.type(), m.text())
    })
    page.on('requestfailed', (r) =>
      console.log('FAILED', r.url(), r.failure()?.errorText),
    )
    await page.goto(state.root + '#/shotlists/' + list.id)
    await page.locator('[data-sync="saved"]').waitFor()
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    await page
      .getByRole('button', { name: 'Generate PDF', exact: true })
      .click()
    try {
      await page
        .locator('canvas[data-rendered="true"]')
        .waitFor({ timeout: 25000 })
      console.log('PDF RENDERED')
    } catch (e) {
      console.log('PREVIEW FAILURE', await page.locator('dialog').innerText())
    }
    await page.screenshot({ path: path.join(out, 'print-browser-debug.png') })
    await fs.promises.writeFile(
      path.join(out, 'print-browser-debug.txt'),
      await page.locator('body').innerText(),
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
