const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  assert = require('node:assert/strict')
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    path.join(
      os.homedir(),
      '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
    ),
)
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research'
const compatible = path.join(runtime, 'webkit-runtime/node_modules/playwright')
const { webkit } = require(
  process.env.M03_WEBKIT_PATH ||
    (fs.existsSync(compatible)
      ? compatible
      : process.env.PLAYWRIGHT_PATH ||
        path.join(
          os.homedir(),
          '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
        )),
)
const state = JSON.parse(
    fs.readFileSync(path.join(runtime, 'local-state.json')),
  ),
  list = JSON.parse(fs.readFileSync(path.join(runtime, 'preview-list.json')))
const { createFixturePage } = require('../../client/qa/m02/browser-harness.cjs')
const out = path.resolve('client/qa/m03/artifacts'),
  results = []
const sizes = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
]
async function main() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--window-size=1440,1000'],
  })
  try {
    for (const mode of ['old-fixed-emulation', 'native-window']) {
      const context = await browser.newContext({
        viewport:
          mode === 'native-window' ? null : { width: 1440, height: 900 },
        serviceWorkers: 'block',
      })
      const { p } = await createFixturePage(browser, {
        context,
        root: state.root,
      })
      const cdp = await context.newCDPSession(p),
        { windowId } = await cdp.send('Browser.getWindowForTarget'),
        measurements = []
      for (const width of [1280, 1600]) {
        await cdp.send('Browser.setWindowBounds', {
          windowId,
          bounds: { width, height: 1000, windowState: 'normal' },
        })
        await p.waitForTimeout(250)
        measurements.push({
          requestedWindow: width,
          ...(await p.evaluate(() => ({
            outer: outerWidth,
            inner: innerWidth,
            visual: visualViewport.width,
            root: document.querySelector('.pd-app').getBoundingClientRect()
              .width,
            scroll: document.documentElement.scrollWidth,
            background: getComputedStyle(document.querySelector('.pd-app'))
              .backgroundColor,
          }))),
        })
      }
      if (mode === 'old-fixed-emulation')
        assert.equal(measurements[0].inner, measurements[1].inner)
      else {
        assert.notEqual(measurements[0].inner, measurements[1].inner)
        for (const m of measurements) assert.equal(m.root, m.inner)
      }
      results.push({ name: mode, pass: true, measurements })
      await context.close()
    }
    const { p, c } = await createFixturePage(browser, { root: state.root })
    await p.locator('.pd-table tbody tr').first().waitFor()
    await p.screenshot({ path: path.join(out, '01-dashboard.png') })
    assert.equal(await p.getByRole('button',{name:'All statuses',exact:true}).count(),0)
    await p
      .getByRole('button', { name: 'Production date', exact: true })
      .click()
    const menu = await p.getByRole('menu').boundingBox()
    assert.ok(
      menu.width >= 120 &&
        menu.width <=
          (
            await p
              .getByRole('button', { name: 'Production date', exact: true })
              .boundingBox()
          ).width +
            34,
    )
    await p.screenshot({ path: path.join(out, '03-compact-sort.png') })
    await p.keyboard.press('Escape')
    await p
      .getByRole('button', { name: 'Collapse sidebar', exact: true })
      .click()
    await p.waitForTimeout(200)
    const emblem = await p.locator('.pd-sidebar .pd-emblem').boundingBox()
    assert.equal(emblem.x, 19)
    await p.screenshot({
      path: path.join(out, '04-create-collapsed-sidebar.png'),
    })
    const create = p.locator('.pd-sidebar-create [aria-label="Create"]')
    await create.click()
    await p.keyboard.press('ArrowDown')
    await p.keyboard.press('Escape')
    await create.focus()
    assert.equal(
      await create.evaluate((e) => e === document.activeElement),
      true,
    )
    await c.close()
    results.push({
      name: 'Compact status/sort geometry, keyboard menus and collapsed emblem/Create control',
      pass: true,
    })
  } finally {
    await browser.close()
  }
  const engine = await webkit.launch()
  try {
    for (const viewport of sizes) {
      const c = await engine.newContext({ viewport, serviceWorkers: 'block' })
      await c.addInitScript(
        (token) => localStorage.setItem('token', token),
        state.tokens['103'],
      )
      const p = await c.newPage()
      const errors = []
      p.on('pageerror', (e) => errors.push(e.message))
      await p.goto(state.root + '#/shotlists/' + list.id)
      await p.locator('.pd-shot-table tbody tr').first().waitFor()
      await p.locator('[data-sync="saved"]').waitFor({ timeout: 12000 })
      await p.evaluate(() => document.fonts.ready)
      const metrics = await p.evaluate(() => ({
        inner: innerWidth,
        root: document.querySelector('.pd-app').getBoundingClientRect().width,
        scroll: document.documentElement.scrollWidth,
        dpr: devicePixelRatio,
        metal: [...document.querySelectorAll('.pd-create')].map(
          (e) => e.dataset.metal,
        ),
      }))
      assert.equal(metrics.root, viewport.width)
      assert.ok(metrics.scroll <= viewport.width + 1)
      if (viewport.width === 1440) {
        await p.screenshot({ path: path.join(out, 'webkit-desktop.png') })
        await p.locator('.pd-sidebar-create [aria-label="Create"]').click()
        await p.getByRole('menuitem', { name: 'New Shot List' }).waitFor()
        await p.screenshot({ path: path.join(out, 'webkit-create-metal.png') })
        await p.keyboard.press('Escape')
      }
      if (viewport.width === 390) {
        await p.screenshot({
          path: path.join(out, 'webkit-mobile.png'),
          fullPage: true,
        })
        await p
          .locator('.pd-shot-table tbody tr [data-field="number"] input')
          .first()
          .focus()
        await p
          .getByRole('button', { name: 'Open shot inspector', exact: true })
          .click()
        await p
          .getByRole('dialog')
          .getByRole('button', { name: /Lens ·/ })
          .click()
        await p.getByRole('combobox').fill('24')
        await p.keyboard.press('Enter')
        await p.screenshot({
          path: path.join(out, 'webkit-mobile-inspector.png'),
        })
      }
      assert.deepEqual(errors, [])
      results.push({
        name: `WebKit ${viewport.width}x${viewport.height}`,
        pass: true,
        metrics,
      })
      await c.close()
    }
    const c = await engine.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    })
    const p = await c.newPage()
    await p.goto(state.root + 'qa/m03/controls.html')
    await p.getByRole('button', { name: 'Choose production date' }).click()
    await p.getByRole('gridcell', { name: 'Tuesday, November 3, 2026' }).focus()
    await p.keyboard.press('ArrowLeft')
    await p.keyboard.press('Enter')
    assert.equal(await p.locator('output').innerText(), '2026-11-02')
    await p.screenshot({ path: path.join(out, 'webkit-calendar.png') })
    await c.close()
    results.push({
      name: 'WebKit custom date-only calendar keyboard selection',
      pass: true,
    })
  } finally {
    await engine.close()
  }
  fs.writeFileSync(
    path.join(out, 'engines-and-viewport.json'),
    JSON.stringify(results, null, 2) + '\n',
  )
  console.log(
    'PASS Chrome native/emulated viewport diagnosis, menu geometry, six WebKit layouts, WebKit Metal/Create and date picker',
  )
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
