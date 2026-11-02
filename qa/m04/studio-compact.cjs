const fs = require('node:fs')
const assert = require('node:assert/strict')
const webkit = process.env.M04_BROWSER === 'webkit'
const pw = require(
  webkit
    ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
    : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json'))
const record = JSON.parse(fs.readFileSync('/tmp/m04/studio-import-record.json'))
;(async () => {
  const browser = await (webkit ? pw.webkit : pw.chromium).launch({
    headless: true,
  })
  try {
    const page = await browser.newPage()
    page.setDefaultTimeout(15000)
    await page.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens['101'],
    )
    for (const [width, height] of [
      [720, 401],
      [390, 650],
    ]) {
      await page.setViewportSize({ width, height })
      console.log('Viewport', width, height)
      await page.goto(record.url)
      await page.getByRole('button', { name: 'Sources', exact: true }).click()
      await page
        .getByRole('menuitem', { name: /Organize panels · Scene 09.pdf/ })
        .click()
      console.log('Import opened')
      await page
        .locator('.sb-import-sequence li')
        .nth(21)
        .waitFor({ state: 'attached' })
      await page.getByRole('button', { name: 'Fit page', exact: true }).click()
      console.log('Page fitted')
      await page
        .waitForFunction(
          () =>
            document.querySelector('.sb-crop-scroll')?.getBoundingClientRect()
              .height >= 120,
          null,
          { timeout: 5000 },
        )
        .catch(async (e) => {
          console.log(
            await page.evaluate(() =>
              [
                ...document.querySelectorAll(
                  '.sb-import-studio,.sb-import-workspace,.sb-import-canvas,.sb-crop-scroll',
                ),
              ].map((n) => ({
                class: n.className,
                height: n.getBoundingClientRect().height,
                display: getComputedStyle(n).display,
              })),
            ),
          )
          await page.screenshot({
            path: '/tmp/m04/studio-compact-diagnostic.png',
          })
          throw e
        })
      assert.ok(
        (await page.locator('.sb-crop-scroll').boundingBox()).height >= 120,
      )
      const done = page.getByRole('button', { name: 'Done', exact: true })
      const bounds = await done.boundingBox()
      assert.ok(bounds.y + bounds.height <= height)
      await page.screenshot({
        path: `/tmp/m04/studio-compact-${webkit ? 'webkit' : 'chromium'}-${width}-crop.png`,
      })
      await page
        .getByRole('tab', { name: 'Panel sequence', exact: true })
        .click()
      assert.ok(await page.locator('.sb-import-sequence').isVisible())
      await page
        .locator('.sb-import-sequence svg image')
        .first()
        .evaluate((n) => {
          if (!n.getAttribute('href').startsWith('data:image/'))
            throw Error('Missing sequence artwork')
        })
      await page.screenshot({
        path: `/tmp/m04/studio-compact-${webkit ? 'webkit' : 'chromium'}-${width}-sequence.png`,
      })
      await page.getByRole('tab', { name: 'Crop regions', exact: true }).click()
      assert.ok(await page.locator('.sb-crop-scroll').isVisible())
      await page
        .locator('.pd-overlay-footer')
        .getByRole('button', { name: 'Close', exact: true })
        .click()
    }
    console.log(
      `${webkit ? 'WebKit' : 'Chromium'}: short/narrow crop and sequence tabs, decoded artwork, canvas height and accessible footer passed.`,
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
