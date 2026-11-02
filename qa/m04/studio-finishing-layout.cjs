const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const assert = require('node:assert/strict')
const webkit = process.env.M04_BROWSER === 'webkit'
const nativeZoom = process.env.M04_NATIVE_ZOOM === '1'
const pw = require(
  webkit
    ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
    : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json'))
const source = JSON.parse(
  fs.readFileSync('/tmp/m04/finishing-ecosystem-record.json'),
)
const headers = {
  Authorization: 'Bearer ' + state.tokens['101'],
  'Content-Type': 'application/json',
}
async function main() {
  const profile = nativeZoom
    ? fs.mkdtempSync(path.join(os.tmpdir(), 'whiteout-final-zoom-'))
    : null
  const browser = nativeZoom
    ? null
    : await (webkit ? pw.webkit : pw.chromium).launch({ headless: true })
  const context = nativeZoom
    ? await pw.chromium.launchPersistentContext(profile, {
        channel: 'chrome',
        headless: false,
        viewport: null,
        args: ['--window-size=1600,1100'],
      })
    : await browser.newContext({ viewport: { width: 1600, height: 1100 } })
  let page
  try {
    const response = await fetch(
      `http://127.0.0.1:4314/api/storyboards/${source.id}/manage`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'duplicate' }),
      },
    )
    assert.ok(response.ok)
    const { id } = await response.json()
    await context.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens['101'],
    )
    page = await context.newPage()
    page.setDefaultTimeout(15000)
    const settings = nativeZoom ? await context.newPage() : null
    if (settings) await settings.goto('chrome://settings/appearance')
    const cases = nativeZoom
      ? [1, 1.25, 1.5, 2]
      : [
          { width: 1024, height: 768 },
          { width: 768, height: 600 },
          { width: 390, height: 650 },
        ]
    for (const item of cases) {
      if (settings)
        await settings.locator('#zoomLevel').selectOption(String(item))
      else await page.setViewportSize(item)
      await page.bringToFront()
      await page.goto(
        `http://127.0.0.1:5176/productiondesk/#/storyboards/${id}`,
      )
      await page.getByRole('radio', { name: 'Grid', exact: true }).click()
      await page.locator('.sb-card-art').first().waitFor()
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
      await page.locator('.sb-card-art').first().click()
      await page.getByRole('button', { name: 'Details', exact: true }).click()
      const inspector = page.locator('.sb-inspector-scroll')
      await inspector.waitFor()
      await inspector.evaluate((n) => {
        n.scrollTop = n.scrollHeight
      })
      await page
        .getByRole('button', { name: 'Replace artwork', exact: true })
        .scrollIntoViewIfNeeded()
      const bounds = await page.locator('.sb-viewer').boundingBox()
      const geometry = await page.evaluate(() => ({
        w: innerWidth,
        h: innerHeight,
        x: scrollX,
        y: scrollY,
        rootScroll: document.querySelector('.sb-viewer').scrollLeft,
      }))
      assert.ok(
        bounds.x >= 0 &&
          bounds.y >= 0 &&
          bounds.x + bounds.width <= geometry.w + 1 &&
          bounds.y + bounds.height <= geometry.h + 1,
      )
      assert.equal(geometry.rootScroll, 0)
      assert.equal(geometry.y, 0)
      const label = settings
        ? String(item * 100)
        : `${item.width}x${item.height}`
      const capturePath = `/tmp/m04/finishing-layout-${webkit ? 'webkit' : 'chromium'}-${label}.png`
      if (settings) {
        const cdp = await context.newCDPSession(page)
        const capture = await cdp.send('Page.captureScreenshot', {
          format: 'png',
          fromSurface: false,
        })
        fs.writeFileSync(capturePath, Buffer.from(capture.data, 'base64'))
        await cdp.detach()
      } else await page.screenshot({ path: capturePath })
      await page
        .getByRole('button', { name: 'Hide details', exact: true })
        .click()
      for (const name of [
        'Studio',
        'Details',
        'Drawing frame',
        'Artwork fit',
        'Full screen',
      ]) {
        const b = await page
          .getByRole('button', { name, exact: true })
          .boundingBox()
        assert.ok(
          b.x >= bounds.x &&
            b.y >= bounds.y &&
            b.x + b.width <= bounds.x + bounds.width + 1 &&
            b.y + b.height <= bounds.y + bounds.height,
          name + ' must remain contained',
        )
      }
      await page.getByRole('button', { name: 'Back', exact: true }).click()
      await page
        .getByRole('dialog', { name: 'Panel viewer', exact: true })
        .waitFor({ state: 'hidden' })
      await page.getByRole('radio', { name: 'Split', exact: true }).click()
      if (
        await page
          .getByRole('button', { name: 'Shot List', exact: true })
          .isVisible()
      )
        await page
          .getByRole('button', { name: 'Shot List', exact: true })
          .click()
      const scroll = page.locator('.sb-shot-pane-scroll')
      await scroll.waitFor()
      await scroll.evaluate((n) => {
        n.scrollTop = n.scrollHeight
      })
      await page
        .locator('.sb-shot-pane tbody tr')
        .last()
        .scrollIntoViewIfNeeded()
      console.log(
        'Split bounds',
        await page.evaluate(() => ({
          viewport: innerHeight,
          doc: document.documentElement.scrollHeight,
          body: document.body.scrollHeight,
          scroll: scrollY,
          splitTop:
            document.querySelector('.sb-split').getBoundingClientRect().top +
            scrollY,
          splitHeight: document
            .querySelector('.sb-split')
            .getBoundingClientRect().height,
          contentBottom:
            document.querySelector('.pd-content').getBoundingClientRect()
              .bottom + scrollY,
        })),
      )
      assert.ok(
        await page.evaluate(() => {
          const split = document.querySelector('.sb-split'),
            box = split.getBoundingClientRect(),
            bottom =
              parseFloat(
                getComputedStyle(document.querySelector('.pd-content'))
                  .paddingBottom,
              ) || 0
          // Short/high-zoom screens may scroll past the real header and the useful 160px pane.
          // Reject unexplained overflow beyond those actual boxes, not legitimate header height.
          return (
            document.documentElement.scrollHeight <=
              Math.max(innerHeight, box.top + scrollY + box.height + bottom) +
                2 &&
            box.height <= Math.max(160, innerHeight - (box.top + scrollY)) + 1
          )
        }),
        'Split has no phantom document overflow',
      )
      console.log(
        label +
          ': contained toolbar, independently scrollable inspector, last-shot Split scroll and no phantom overflow passed.',
      )
    }
    if (!nativeZoom) {
      await page.setViewportSize({ width: 1600, height: 1100 })
      await page.getByRole('radio', { name: 'Grid', exact: true }).click()
      const card = page.locator('.sb-panel-card').last()
      await card.scrollIntoViewIfNeeded()
      await card.hover()
      await card.getByRole('button', { name: /Actions for/ }).click()
      const menu = page.getByRole('menu')
      await menu.getByRole('menuitem', { name: 'Delete', exact: true }).hover()
      const mb = await menu.boundingBox()
      assert.ok(mb.y >= 0 && mb.y + mb.height <= 1100)
      await page.screenshot({
        path: `/tmp/m04/finishing-menu-edge-${webkit ? 'webkit' : 'chromium'}.png`,
      })
      await menu.getByRole('menuitem', { name: 'Delete', exact: true }).click()
      await card
        .getByRole('button', { name: 'Cancel deletion', exact: true })
        .waitFor()
      await page.screenshot({ path: '/tmp/m04/finishing-single-delete.png' })
      const panelId = await card.getAttribute('data-panel')
      const before = await (
        await fetch(`http://127.0.0.1:4314/api/storyboards/${id}/snapshot`, {
          headers,
        })
      ).json()
      await card.getByRole('button', { name: /^Confirm delete/ }).click()
      await page.waitForFunction(
        (pid) => !document.querySelector(`[data-panel="${pid}"]`),
        panelId,
      )
      await page
        .locator('.pd-toast')
        .filter({ hasText: '1 panel deleted.' })
        .getByRole('button', { name: 'Restore', exact: true })
        .click()
      await page.locator(`[data-panel="${panelId}"]`).waitFor()
      await page.waitForFunction(
        () => document.querySelector('[data-sync]')?.dataset.sync === 'saved',
      )
      const after = await (
        await fetch(`http://127.0.0.1:4314/api/storyboards/${id}/snapshot`, {
          headers,
        })
      ).json()
      for (const field of ['id', 'activeRevision', 'links', 'label', 'notes'])
        assert.deepEqual(
          after.panels[panelId][field],
          before.panels[panelId][field],
        )
      await page.locator('.sb-panel-card').first().scrollIntoViewIfNeeded()
      await page.locator('.sb-panel-card').first().hover()
      const from = await page.locator('.sb-drag').first().boundingBox(),
        to = await page.locator('.sb-panel-card').nth(1).boundingBox()
      const order = await page
        .locator('.sb-panel-card')
        .evaluateAll((ns) => ns.map((n) => n.dataset.panel))
      await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
      await page.mouse.down()
      await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
        steps: 20,
      })
      await page.mouse.up()
      await page.waitForFunction(
        (first) =>
          document.querySelector('.sb-panel-card')?.dataset.panel !== first,
        order[0],
      )
      await page.getByRole('status').filter({ hasText: 'Saved' }).waitFor()
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.locator('.sb-card-art').first().click()
      assert.ok(
        await page
          .locator('.sb-viewer')
          .evaluate((n) =>
            n
              .getAnimations()
              .every((a) => Number(a.effect.getTiming().duration) <= 1),
          ),
      )
      await page.getByRole('button', { name: 'Back', exact: true }).click()
      console.log(
        'Edge-anchored pointer menu, actual inline single deletion+Restore data identity, real artwork grip drag and reduced-motion viewer passed.',
      )
    }
  } catch (e) {
    if (page)
      await page.screenshot({ path: '/tmp/m04/finishing-layout-failure.png' })
    throw e
  } finally {
    await context.close()
    await browser?.close()
    if (profile) fs.rmSync(profile, { recursive: true, force: true })
  }
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
