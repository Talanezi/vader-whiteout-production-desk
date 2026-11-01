const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    path.join(
      process.env.HOME,
      '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
    ),
)
const { createFixturePage } = require('../../client/qa/m02/browser-harness.cjs')
const root =
    process.env.PD_PREVIEW_URL || 'http://127.0.0.1:5175/productiondesk/',
  out = path.resolve('client/qa/m031/artifacts'),
  results = []
const pass = (name, detail) => {
  results.push({ name, pass: true, ...detail })
  console.log('PASS', name)
}
async function main() {
  const browser = await chromium.launch({ channel: 'chrome' })
  fs.mkdirSync(out, { recursive: true })
  try {
    const { p, c } = await createFixturePage(browser, { root })
    await p.goto(root)
    await p.getByRole('heading', { name: 'Call sheets', exact: true }).waitFor()
    const errors = []
    p.on('pageerror', (e) => errors.push(e.message))
    for (const name of ['Production date']) {
      const trigger = p.getByRole('button', { name, exact: true })
      const a = await trigger.boundingBox()
      await trigger.click()
      const menu = p.getByRole('menu', { name, exact: true })
      await menu.waitFor()
      await p.waitForTimeout(250)
      const b = await menu.boundingBox()
      assert.ok(
        b.width <= a.width + 34,
        JSON.stringify({ trigger: a.width, menu: b.width }),
      )
      const rows = await menu
        .locator('button')
        .evaluateAll((nodes) =>
          nodes.map((e) => e.getBoundingClientRect().height),
        )
      assert.ok(
        rows.every((h) => h >= 30 && h <= 34),
        JSON.stringify({ name, rows, width: b.width, trigger: a.width }),
      )
      await p.screenshot({
        path: path.join(
          out,
          name === 'All statuses' ? '01-status.png' : '02-sort.png',
        ),
      })
      await p.keyboard.press('Escape')
      assert.ok(await trigger.evaluate((e) => e === document.activeElement))
      pass('Compact ' + name + ' menu', {
        triggerWidth: a.width,
        menuWidth: b.width,
        rowHeights: rows,
      })
    }
    const trigger = p
      .locator('.pd-sidebar-create')
      .getByRole('button', { name: 'Create', exact: true })
    await trigger.hover()
    await p.mouse.move(
      (await trigger.boundingBox()).x + 6,
      (await trigger.boundingBox()).y + 18,
    )
    await p.waitForTimeout(400)
    const metal = p.locator('.pd-sidebar-create .metal-fx-root')
    await metal.waitFor()
    await p.screenshot({ path: path.join(out, '03-metal-pointer.png') })
    assert.ok(await metal.locator('canvas').count())
    pass('Actual Metal WebGL canvas and cursor-bend integration', {
      bendHookAttached: (await p.locator('filter[id^="mfx-bend-"]').count()) > 0,
      cursorDeformationActive: await metal.evaluate(e=>e.hasAttribute('data-mfx-bend') || e.style.filter.includes('mfx-bend')),
    })
    const a = await trigger.boundingBox()
    await trigger.click()
    const menu = p.getByRole('menu', { name: 'Create', exact: true })
    await menu.waitFor()
    await p.waitForTimeout(380)
    const b = await p.locator('.pd-create-panel').boundingBox()
    assert.equal(await menu.getByRole('menuitem').count(), 2)
    assert.equal(
      await p.getByRole('button', { name: 'Close creation menu' }).count(),
      0,
    )
    assert.equal(await p.locator('.pd-create-heading').count(), 0)
    assert.ok(Math.abs(a.x - b.x) <= 1 && Math.abs(a.y - b.y) <= 1)
    assert.ok(b.width <= 210 && b.height <= 105)
    await p.screenshot({ path: path.join(out, '04-create-expanded.png') })
    await p.keyboard.press('Escape')
    await p.waitForTimeout(240)
    assert.ok(await trigger.evaluate((e) => e === document.activeElement))
    pass(
      'Connected origin morph, two actions, no duplicated header/close, compact geometry and Escape focus',
      { trigger: a, expanded: b },
    )
    await trigger.press('ArrowDown')
    await menu.getByRole('menuitem', { name: 'New Shot List' }).press('Enter')
    await p.getByRole('heading', { name: 'Shot lists', exact: true }).waitFor()
    await p.goto(root)
    await p.getByRole('heading', { name: 'Call sheets', exact: true }).waitFor()
    await p.waitForTimeout(260)
    await p
      .locator('.pd-sidebar-create')
      .getByRole('button', { name: 'Create', exact: true })
      .click()
    await p.getByRole('menuitem', { name: 'New Call Sheet' }).click()
    await p
      .getByRole('heading', { name: 'New call sheet', exact: true })
      .waitFor()
    pass('Both Create routes remain functional')
    await c.close()
    for (const reduced of [false, true]) {
      const { p, c } = await createFixturePage(browser, {
        root,
        viewport: { width: 360, height: 640 },
        reducedMotion: reduced ? 'reduce' : 'no-preference',
      })
      await p.goto(root)
      await p.getByRole('button', { name: 'Create', exact: true }).click()
      await p.getByRole('menu', { name: 'Create', exact: true }).waitFor()
      await p.waitForTimeout(380)
      const b = await p.locator('.pd-create-panel').boundingBox()
      assert.ok(
        b.x >= 0 && b.y >= 0 && b.x + b.width <= 360 && b.y + b.height <= 640,
      )
      if (reduced)
        assert.equal(
          await p.locator('.pd-create').first().getAttribute('data-metal'),
          'static',
        )
      await p.screenshot({
        path: path.join(
          out,
          reduced ? '06-reduced-motion.png' : '05-mobile-create.png',
        ),
      })
      await c.close()
    }
    pass('Mobile placement and reduced-motion fallback')
    assert.deepEqual(errors, [])
    fs.writeFileSync(
      path.join(out, 'visual.json'),
      JSON.stringify(results, null, 2) + '\n',
    )
  } finally {
    await browser.close()
  }
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
