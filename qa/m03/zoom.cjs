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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'whiteout-m03-zoom-'))
  const c = await chromium.launchPersistentContext(profile, {
    channel: 'chrome',
    headless: false,
    viewport: null,
    args: ['--window-size=1440,900'],
  })
  try {
    await c.addInitScript(
      ({ token, origin }) => {
        if (location.origin === origin) localStorage.setItem('token', token)
      },
      { token: state.tokens['101'], origin: new URL(state.root).origin },
    )
    const p = await c.newPage()
    await p.goto(state.root + '#/shotlists/' + list.id)
    await p.locator('.pd-shot-table tbody tr').first().waitFor()
    await p.locator('[data-sync="saved"]').waitFor()
    const before = await p.evaluate(() => ({
      width: innerWidth,
      dpr: devicePixelRatio,
    }))
    const settings = await c.newPage()
    await settings.goto('chrome://settings/appearance')
    await settings.locator('#zoomLevel').selectOption('2')
    await p.bringToFront()
    await p.reload()
    await p.locator('.pd-shot-table tbody tr').first().waitFor()
    await p.locator('[data-sync="saved"]').waitFor()
    const after = await p.evaluate(() => ({
      width: innerWidth,
      dpr: devicePixelRatio,
      scroll: document.documentElement.scrollWidth,
    }))
    assert.equal(after.width, before.width / 2)
    assert.equal(after.dpr, before.dpr * 2)
    assert.ok(after.scroll <= after.width + 1)
    await p
      .locator('.pd-shot-table tbody tr [data-field="number"] input')
      .first()
      .focus()
    await p
      .getByRole('button', { name: 'Open shot inspector', exact: true })
      .click()
    await p
      .getByRole('dialog', { name: 'Shot inspector' })
      .getByRole('button', { name: /Lens ·/ })
      .click()
    const panel = await p.locator('.pd-combo-panel').boundingBox()
    assert.ok(panel.x >= 0 && panel.x + panel.width <= after.width + 1)
    const cdp = await c.newCDPSession(p),
      { cssVisualViewport: view } = await cdp.send('Page.getLayoutMetrics'),
      zoom = view.zoom || 1
    const image = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width: view.clientWidth * zoom,
        height: view.clientHeight * zoom,
        scale: 1 / zoom,
      },
    })
    fs.writeFileSync(
      'client/qa/m03/artifacts/zoom-200-shot-inspector.png',
      Buffer.from(image.data, 'base64'),
    )
    fs.writeFileSync(
      'client/qa/m03/artifacts/zoom.json',
      JSON.stringify({ pass: true, before, after, menu: panel }, null, 2) +
        '\n',
    )
    console.log(
      'PASS Native 200% Chrome zoom reflows shot workspace and keeps inspector combobox within viewport',
    )
  } finally {
    await c.close()
    fs.rmSync(profile, { recursive: true, force: true })
  }
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
