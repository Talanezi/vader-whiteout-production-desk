const fs = require('node:fs')
const assert = require('node:assert/strict')
const webkit = process.env.M04_BROWSER === 'webkit'
const pw = require(
  webkit
    ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
    : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json'))
const record = JSON.parse(
  fs.readFileSync('/tmp/m04/studio-scene16-record.json'),
)
;(async () => {
  const browser = await (webkit ? pw.webkit : pw.chromium).launch({
    headless: true,
  })
  let page
  try {
    for (const touch of [false, true]) {
      const context = await browser.newContext({
        viewport: { width: touch ? 1024 : 1600, height: touch ? 768 : 1100 },
        hasTouch: touch,
      })
      await context.addInitScript(
        (t) => localStorage.setItem('token', t),
        state.tokens['101'],
      )
      page = await context.newPage()
      await page.goto(
        `http://127.0.0.1:5176/productiondesk/#/storyboards/${record.id}`,
      )
      const activate = async (locator) =>
        touch ? locator.tap() : locator.click()
      await activate(page.locator('.sb-card-art').first())
      await activate(page.getByRole('button', { name: 'Studio', exact: true }))
      await page.locator('[data-drawing-engine]').waitFor()
      const settings = page.getByRole('button', {
        name: 'Studio settings',
        exact: true,
      })
      assert.equal(
        await page.locator('.sb-studio > .sb-input-settings').count(),
        0,
      )
      assert.equal(
        await page.locator('.sb-creative-dock .sb-input-settings').count(),
        1,
      )
      const inspectorPath = await page
        .getByRole('button', { name: 'Details', exact: true })
        .locator('svg path')
        .getAttribute('d')
      const settingsPath = await settings.locator('svg path').getAttribute('d')
      assert.notEqual(settingsPath, inspectorPath)
      await activate(settings)
      const menu = page.getByRole('dialog', {
        name: 'Studio settings',
        exact: true,
      })
      await menu.waitFor()
      const b = await menu.boundingBox(),
        viewport = page.viewportSize()
      assert.ok(
        b.x >= 0 &&
          b.y >= 0 &&
          b.x + b.width <= viewport.width &&
          b.y + b.height <= viewport.height,
      )
      await activate(
        page.getByRole('button', { name: 'Drawing input', exact: true }),
      )
      await activate(
        page.getByRole('menuitemradio', { name: 'Touch Drawing', exact: true }),
      )
      await page
        .getByRole('checkbox', { name: 'Shape Assistance', exact: true })
        .uncheck()
      await menu.evaluate(async (n) => {
        await Promise.all(
          document
            .getAnimations()
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished.catch(() => {})),
        )
      })
      await page.screenshot({
        path: `/tmp/m04/final-dock-settings-${webkit ? 'webkit' : 'chromium'}-${touch ? 'tablet' : 'desktop'}.png`,
      })
      await settings.press('Escape')
      await menu.waitFor({ state: 'hidden' })
      await activate(settings)
      assert.match(
        await page
          .getByRole('button', { name: 'Drawing input', exact: true })
          .innerText(),
        /Touch Drawing/,
      )
      assert.equal(
        await page
          .getByRole('checkbox', { name: 'Shape Assistance', exact: true })
          .isChecked(),
        false,
      )
      await activate(settings)
      await activate(page.getByRole('button', { name: 'Details', exact: true }))
      await page.getByRole('tab', { name: 'History', exact: true }).waitFor()
      await activate(
        page.getByRole('button', { name: 'Hide details', exact: true }),
      )
      await page.getByRole('button', { name: 'Back', exact: true }).click()
      await page
        .getByRole('dialog', { name: 'Panel viewer', exact: true })
        .waitFor({ state: 'hidden' })
      await page.getByRole('button', { name: 'Download', exact: true }).click()
      const dialog = page.getByRole('dialog', {
        name: 'Download storyboard',
        exact: true,
      })
      await page.waitForFunction(
        () =>
          !Array.from(document.querySelectorAll('button')).find(
            (b) => b.textContent.trim() === 'Download PDF',
          )?.disabled,
      )
      for (const viewport of [
        { width: 1280, height: 720 },
        { width: 1024, height: 600 },
        { width: 768, height: 650 },
        { width: 390, height: 650 },
        { width: 1280, height: 401 },
      ]) {
        await page.setViewportSize(viewport)
        await dialog
          .getByRole('button', { name: 'Download PDF', exact: true })
          .focus()
        const geometry = await dialog.evaluate((n) => {
          const rect = (e) => {
            const b = e.getBoundingClientRect()
            return { top: b.top, bottom: b.bottom }
          }
          return {
            root: rect(n),
            header: rect(n.querySelector('.pd-overlay-header')),
            footer: rect(n.querySelector('.pd-overlay-footer')),
            scroll: n.scrollTop,
          }
        })
        assert.equal(
          geometry.scroll,
          0,
          'Focusing Download must not scroll the print header out of view',
        )
        assert.ok(
          geometry.header.top >= geometry.root.top &&
            geometry.footer.bottom <= geometry.root.bottom + 1,
        )
        if (viewport.height === 720 || viewport.width === 390)
          await page.screenshot({
            path: `/tmp/m04/final-print-contained-${webkit ? 'webkit' : 'chromium'}-${viewport.width}x${viewport.height}.png`,
          })
      }
      await context.close()
      console.log(
        `${touch ? 'Touch/tablet' : 'Desktop'}: distinct dock gear and sidebar inspector, persistent input/shape settings, contained settings popup, and print header/footer at720/600/650/401px passed.`,
      )
    }
  } catch (e) {
    if (page)
      await page.screenshot({ path: '/tmp/m04/final-controls-failure.png' })
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
