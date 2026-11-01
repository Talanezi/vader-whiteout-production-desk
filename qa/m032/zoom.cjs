const { state, out, create } = require('./helpers.cjs'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  assert = require('node:assert/strict'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'whiteout-m032-zoom-')),
    context = await chromium.launchPersistentContext(profile, {
      channel: 'chrome',
      headless: false,
      viewport: null,
      args: ['--window-size=1440,1000'],
    })
  try {
    const list = await create('Native browser zoom QA')
    await context.addInitScript(
      ({ token, origin }) => {
        if (location.origin === origin) localStorage.setItem('token', token)
      },
      { token: state.tokens[101], origin: new URL(state.root).origin },
    )
    const page = await context.newPage()
    await page.goto(state.root + '#/shotlists/' + list.id)
    await page.locator('[data-sync="saved"]').waitFor()
    await page.getByRole('button', { name: 'Grid preset', exact: true }).click()
    await page
      .getByRole('option', { name: 'Full Technical', exact: true })
      .click()
    const before = await page.evaluate(() => ({
        width: innerWidth,
        dpr: devicePixelRatio,
      })),
      settings = await context.newPage()
    await settings.goto('chrome://settings/appearance')
    const results = []
    for (const zoom of [1.25, 1.5, 2]) {
      await settings.locator('#zoomLevel').selectOption(String(zoom))
      await page.bringToFront()
      await page.reload()
      await page.locator('[data-sync="saved"]').waitFor()
      const after = await page.evaluate(() => ({
        width: innerWidth,
        dpr: devicePixelRatio,
        scroll: document.documentElement.scrollWidth,
        table: document.querySelector('.pd-pro-table').offsetWidth,
      }))
      assert.ok(Math.abs(after.width - before.width / zoom) < 2)
      assert.ok(Math.abs(after.dpr - before.dpr * zoom) < 0.02)
      assert.ok(after.scroll <= after.width + 1)
      assert.ok(after.table > 2700)
      await page.locator('[data-field="number"] input').first().focus()
      await page
        .getByRole('button', { name: 'Open shot inspector', exact: true })
        .click()
      const inspector = page.getByRole('dialog', {
        name: 'Shot inspector',
        exact: true,
      })
      await inspector.getByRole('button', { name: /^Lens ·/ }).click()
      const menu = await page.locator('.pd-combo-panel').boundingBox()
      assert.ok(menu.x >= 0 && menu.x + menu.width <= after.width + 1)
      const cdp = await context.newCDPSession(page),
        { cssVisualViewport: view } = await cdp.send('Page.getLayoutMetrics'),
        factor = view.zoom || 1,
        image = await cdp.send('Page.captureScreenshot', {
          format: 'png',
          captureBeyondViewport: true,
          clip: {
            x: 0,
            y: 0,
            width: view.clientWidth * factor,
            height: view.clientHeight * factor,
            scale: 1 / factor,
          },
        })
      fs.writeFileSync(
        path.join(out, `zoom-${zoom * 100}.png`),
        Buffer.from(image.data, 'base64'),
      )
      results.push({
        nativeZoomPercent: zoom * 100,
        before,
        after,
        menu,
        pass: true,
      })
      console.log('PASS native', zoom * 100 + '%')
    }
    fs.writeFileSync(
      path.join(out, 'zoom.json'),
      JSON.stringify({ pass: true, results }, null, 2),
    )
  } finally {
    await context.close()
    fs.rmSync(profile, { recursive: true, force: true })
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
