const { state, out, create } = require('../m032/helpers.cjs'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  assert = require('node:assert/strict'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const profile = fs.mkdtempSync(
      path.join(os.tmpdir(), 'whiteout-polish-zoom-'),
    ),
    c = await chromium.launchPersistentContext(profile, {
      channel: 'chrome',
      headless: false,
      viewport: null,
      args: ['--window-size=1440,1000'],
    })
  try {
    const list = await create('M03 final zoom'),
      p = await c.newPage()
    await c.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens[101],
    )
    await p.goto(state.root + '#/shotlists/' + list.id)
    await p.locator('[data-sync="saved"]').waitFor()
    const baseline = await p.evaluate(() => ({
        width: innerWidth,
        dpr: devicePixelRatio,
      })),
      settings = await c.newPage()
    await settings.goto('chrome://settings/appearance')
    const results = []
    for (const zoom of [1, 1.25, 1.5, 2]) {
      await settings.locator('#zoomLevel').selectOption(String(zoom))
      await p.bringToFront()
      await p.reload()
      await p.locator('[data-sync="saved"]').waitFor()
      await p.getByRole('button', { name: 'Grid preset', exact: true }).click()
      await p
        .getByRole('menuitemradio', { name: 'Cinematography', exact: true })
        .click()
      const view = await p.evaluate(() => ({
        width: innerWidth,
        height: innerHeight,
        dpr: devicePixelRatio,
        scroll: document.documentElement.scrollWidth,
      }))
      assert.ok(Math.abs(view.width - baseline.width / zoom) < 2)
      assert.ok(view.scroll <= view.width + 1)
      await p
        .getByRole('button', { name: 'Choose columns', exact: true })
        .click()
      const dialog = p.getByRole('dialog', {
        name: 'Columns and layout',
        exact: true,
      })
      const body = await dialog.locator('.pd-overlay-body').boundingBox()
      assert.ok(body.height > 100, JSON.stringify(body))
      await p
        .getByRole('checkbox', { name: 'Show Schedule status', exact: true })
        .scrollIntoViewIfNeeded()
      await p
        .getByRole('checkbox', { name: 'Show Schedule status', exact: true })
        .check()
      await p.screenshot({
        path: path.join(out, 'polish-zoom-' + zoom * 100 + '-columns.png'),
      })
      await p
        .getByRole('button', { name: 'Close Columns and layout', exact: true })
        .click()
      const check = p.getByRole('checkbox', {
        name: 'Select all visible shots',
        exact: true,
      })
      await check.check()
      const toolbar = p.locator('.pd-shot-selection')
      const geometry = await toolbar.evaluate((el) => ({
        r: el.getBoundingClientRect().toJSON(),
        children: [...el.children].map((x) =>
          x.getBoundingClientRect().toJSON(),
        ),
        width: innerWidth,
      }))
      assert.ok(
        geometry.children.every(
          (r) =>
            r.x >= geometry.r.x - 1 &&
            r.right <= geometry.r.right + 1 &&
            r.top >= geometry.r.top - 1 &&
            r.bottom <= geometry.r.bottom + 1,
        ),
        JSON.stringify(geometry),
      )
      for (const left of [0, 1200]) {
        await p
          .locator('.pd-pro-grid')
          .evaluate((el, x) => (el.scrollLeft = x), left)
        const centers = await p
          .locator('.pd-pin-grip input')
          .evaluateAll((els) =>
            els.slice(0, 3).map((el) => {
              const r = el.getBoundingClientRect()
              return r.x + r.width / 2
            }),
          )
        assert.ok(
          centers.every((x) => Math.abs(x - centers[0]) < 0.6),
          JSON.stringify(centers),
        )
      }
      await p.screenshot({
        path: path.join(out, 'polish-zoom-' + zoom * 100 + '-toolbar.png'),
      })
      await p
        .getByRole('button', { name: 'Clear selection', exact: true })
        .click()
      results.push({ zoom: zoom * 100, view, body, pass: true })
      console.log(
        'PASS native zoom',
        zoom * 100 + '%',
        'checkbox axes after scroll; modal full-list scroll; wrapped four-action toolbar',
      )
    }
    fs.writeFileSync(
      path.join(out, 'polish-zoom.json'),
      JSON.stringify({ pass: true, results }, null, 2),
    )
  } finally {
    await c.close()
    fs.rmSync(profile, { recursive: true, force: true })
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
