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
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research',
  state = JSON.parse(fs.readFileSync(path.join(runtime, 'local-state.json'))),
  list = JSON.parse(fs.readFileSync(path.join(runtime, 'preview-list.json')))
async function main() {
  const browser = await chromium.launch({ channel: 'chrome' })
  try {
    const c = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    await c.addInitScript((token) => {
      localStorage.setItem('token', token)
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === 'webgl2') return null
        return original.call(this, type, ...args)
      }
    }, state.tokens['101'])
    const p = await c.newPage()
    await p.goto(state.root + '#/shotlists/' + list.id)
    await p.locator('.pd-shot-table tbody tr').first().waitFor()
    await p.locator('[data-sync="saved"]').waitFor()
    assert.equal(
      await p
        .locator('.pd-sidebar-create .pd-create')
        .getAttribute('data-metal'),
      'static',
    )
    assert.ok(
      await p.locator('.pd-sidebar-create [aria-label="Create"]').isVisible(),
    )
    await p.screenshot({
      path: 'client/qa/m03/artifacts/05-metal-no-webgl-fallback.png',
    })
    await p.locator('.pd-sidebar-create [aria-label="Create"]').click()
    await p.getByRole('menuitem', { name: 'New Shot List' }).waitFor()
    await p.keyboard.press('Tab')
    assert.ok(
      await p
        .locator('.pd-sidebar nav a')
        .first()
        .evaluate((e) => e === document.activeElement),
    )
    await c.close()
    const normal = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    await normal.addInitScript(
      (token) => localStorage.setItem('token', token),
      state.tokens['101'],
    )
    const page = await normal.newPage()
    await page.goto(state.root + '#/shotlists/' + list.id)
    await page.locator('.pd-shot-table tbody tr').first().waitFor()
    const control = page.locator('.pd-sidebar-create .pd-create')
    await page.mouse.move(1100, 400)
    await page.waitForFunction(
      () =>
        document.querySelector('.pd-sidebar-create .pd-create').dataset
          .paused === 'true',
    )
    await control.hover()
    await page.waitForFunction(
      () =>
        document.querySelector('.pd-sidebar-create .pd-create').dataset
          .paused === 'false',
    )
    await page.mouse.move(1100, 400)
    await page.waitForFunction(
      () =>
        document.querySelector('.pd-sidebar-create .pd-create').dataset
          .paused === 'true',
    )
    assert.equal(
      await page
        .locator('.pd-mobile-create .pd-create')
        .getAttribute('data-paused'),
      'true',
    )
    await normal.close()
    fs.writeFileSync(
      'client/qa/m03/artifacts/metal-fallback.json',
      JSON.stringify(
        {
          pass: true,
          name: 'WebGL2 unavailable: readable functional static Create control; real Metal activation pauses at rest and on the hidden mobile control. Reduced-motion static fallback is separately covered by browser.json.',
        },
        null,
        2,
      ) + '\n',
    )
    console.log(
      'PASS WebGL-unavailable fallback and interaction/visibility Metal pausing',
    )
  } finally {
    await browser.close()
  }
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
