const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto'),
  webkit = process.env.M04_BROWSER === 'webkit',
  pw = require(
    webkit
      ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  source = JSON.parse(fs.readFileSync('/tmp/m04/studio-import-record.json')),
  headers = {
    Authorization: 'Bearer ' + state.tokens['101'],
    'Content-Type': 'application/json',
  },
  base = 'http://127.0.0.1:4314/api'
async function api(p, body) {
  const r = await fetch(base + p, {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  assert.ok(r.ok, await r.clone().text())
  return r.json()
}
;(async () => {
  const browser = await (webkit ? pw.webkit : pw.chromium).launch({
    headless: true,
  })
  let page
  try {
    const list = await api('/shotlists', {
        name: 'M04 connected plan ' + crypto.randomUUID().slice(0, 5),
      }),
      fixture = require('../m03/fixtures.cjs')(crypto.randomUUID())
    const templates = fixture.scenes[0].shots
    fixture.scenes[0].shots = Array.from({ length: 40 }, (_, i) => ({
      ...templates[i % templates.length],
      number: '09-' + (i + 1),
    }))
    await api(`/shotlists/${list.id}/import`, fixture)
    const board = await api(`/storyboards/${source.id}/manage`, {
        action: 'duplicate',
      }),
      id = board.id,
      snapshot = () => api(`/storyboards/${id}/snapshot`),
      before = await snapshot()
    page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
    page.setDefaultTimeout(15000)
    await page.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens['101'],
    )
    await page.goto(`http://127.0.0.1:5176/productiondesk/#/storyboards/${id}`)
    await page.locator('.sb-card-art').first().click()
    await page.getByRole('button', { name: 'Details', exact: true }).click()
    await page.getByRole('button', { name: 'Link shots', exact: true }).click()
    const picker = page.getByRole('dialog', { name: 'Link shots', exact: true })
    await picker
      .getByRole('button', { name: /Choose Shot List|M04/ })
      .first()
      .click()
    await page
      .getByRole('menuitemradio', { name: list.name, exact: true })
      .click()
    await picker.locator('.sb-shot-options input[type=checkbox]').nth(1).check()
    await picker.locator('.sb-shot-options input[type=checkbox]').nth(2).check()
    await page.screenshot({ path: '/tmp/m04/finishing-link-picker.png' })
    await picker
      .getByRole('button', { name: 'Use selected shots', exact: true })
      .click()
    await page
      .getByRole('heading', { name: '09-1 +1', exact: true })
      .first()
      .waitFor()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page
      .getByRole('dialog', { name: 'Panel viewer', exact: true })
      .waitFor({ state: 'hidden' })
    await page
      .locator('.sb-panel-card footer strong')
      .filter({ hasText: '09-1 +1' })
      .waitFor()
    await page.screenshot({ path: '/tmp/m04/finishing-linked-gallery.png' })
    await page.getByRole('radio', { name: 'Split', exact: true }).click()
    await page.locator('.sb-shot-pane tbody tr').nth(39).waitFor()
    assert.equal(await page.locator('.sb-shot-pane select').count(), 0)
    await page
      .getByRole('button', { name: 'Details for 09-1', exact: true })
      .click()
    const choose = async (label, value) => {
      await page.getByRole('button', { name: label, exact: true }).click()
      const input = page.getByRole('combobox', {
        name: 'Search ' + label.toLowerCase(),
        exact: true,
      })
      await input.fill(value)
      await input.press('Enter')
    }
    await choose('Subject 09-1', 'VADER — revised from Split')
    await choose('Lens 09-1', '75mm')
    await page.waitForFunction(
      () => !document.querySelector('.sb-shot-pane-heading [role=status]'),
    )
    const savedList = await api(`/shotlists/${list.id}/export`),
      first = Object.values(savedList.shots).find((s) => s.number === '09-1')
    assert.equal(first.subject, 'VADER — revised from Split')
    assert.equal(first.lens, '75mm')
    const second = await browser.newContext({
      viewport: { width: 1600, height: 1100 },
    })
    await second.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens['102'],
    )
    const main = await second.newPage()
    await main.goto(
      `http://127.0.0.1:5176/productiondesk/#/shotlists/${list.id}?shot=${first.id}&scene=${first.sceneId}`,
    )
    await main.getByLabel('Subject · 09-1', { exact: true }).first().waitFor()
    assert.equal(
      (
        await main
          .getByLabel('Subject · 09-1', { exact: true })
          .first()
          .innerText()
      ).trim(),
      'VADER — revised from Split',
    )
    await choose('Subject 09-1', 'VADER — live second edit')
    await main.waitForFunction(() =>
      Array.from(document.querySelectorAll('button')).some(
        (n) =>
          n.getAttribute('aria-label') === 'Subject · 09-1' &&
          n.textContent.includes('VADER — live second edit'),
      ),
    )
    await page.waitForFunction(
      () => !document.querySelector('.sb-shot-pane-heading [role=status]'),
    )
    const masterBeforeDisconnect = (await api(`/shotlists/${list.id}/export`))
      .shots
    await second.close()
    const split = page.locator('.sb-split'),
      scroll = page.locator('.sb-shot-pane-scroll')
    await scroll.evaluate((n) => {
      n.scrollTop = n.scrollHeight
    })
    await page.locator('.sb-shot-pane tbody tr').last().scrollIntoViewIfNeeded()
    const geometry = await split.boundingBox()
    assert.ok(geometry.height <= 1100 - geometry.y + 1)
    console.log(
      'Split geometry',
      await page.evaluate(() => ({
        vh: innerHeight,
        doc: document.documentElement.scrollHeight,
        body: document.body.scrollHeight,
        top: document.querySelector('.sb-split').getBoundingClientRect().top,
        height: document.querySelector('.sb-split').getBoundingClientRect()
          .height,
        shots: document.querySelector('.sb-split-shots').getBoundingClientRect()
          .height,
        shotContent: document
          .querySelector('.sb-shot-pane')
          .getBoundingClientRect().height,
        scroll: document
          .querySelector('.sb-shot-pane-scroll')
          .getBoundingClientRect().height,
        windowScroll: scrollY,
      })),
    )
    console.log(
      'Overflow contributors',
      await page.evaluate(() =>
        Array.from(document.querySelectorAll('body *'))
          .map((n) => ({
            tag: n.tagName,
            cls: typeof n.className === 'string' ? n.className : 'svg',
            bottom: n.getBoundingClientRect().bottom + scrollY,
            position: getComputedStyle(n).position,
            overflow: getComputedStyle(n).overflow,
          }))
          .filter((v) => v.bottom > document.body.scrollHeight + 100)
          .sort((a, b) => b.bottom - a.bottom)
          .slice(0, 12),
      ),
    )
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollHeight < innerHeight + 150,
      ),
    )
    await page.screenshot({ path: '/tmp/m04/finishing-split-last-shot.png' })
    await page
      .getByRole('separator', { name: 'Resize Split view', exact: true })
      .press('ArrowRight')
    await page
      .getByRole('button', { name: 'Connected Shot List', exact: true })
      .click()
    await page
      .getByRole('menuitem', { name: 'Disconnect Shot List', exact: true })
      .click()
    await page.getByRole('button', { name: 'Disconnect', exact: true }).click()
    await page
      .getByRole('heading', { name: 'Connect a Shot List', exact: true })
      .waitFor()
    const detached = await snapshot()
    assert.equal(
      Object.keys(detached.panels).length,
      Object.keys(before.panels).length,
    )
    assert.equal(
      Object.keys(detached.revisions).length,
      Object.keys(before.revisions).length,
    )
    assert.ok(
      Object.values(detached.panels).every((p) =>
        p.links.every((l) => l.listId !== list.id),
      ),
    )
    assert.deepEqual(
      (await api(`/shotlists/${list.id}/export`)).shots,
      masterBeforeDisconnect,
    )
    await page.screenshot({ path: '/tmp/m04/finishing-disconnected-split.png' })
    await page
      .getByRole('button', { name: 'Connect shots', exact: true })
      .click()
    await page
      .getByRole('dialog', { name: 'Link shots', exact: true })
      .getByRole('button', { name: /Choose Shot List|M04/ })
      .first()
      .click()
    await page
      .getByRole('menuitemradio', { name: list.name, exact: true })
      .click()
    await page.locator('.sb-shot-options input[type=checkbox]').nth(1).check()
    await page
      .getByRole('button', { name: 'Use selected shots', exact: true })
      .click()
    await page.locator('.sb-shot-pane table').waitFor()
    await page.getByRole('radio', { name: 'Grid', exact: true }).click()
    const card = page.locator('.sb-panel-card').first()
    await card.hover()
    const controls = card.locator('.sb-card-controls'),
      centers = await controls.evaluate((n) =>
        [
          n.querySelector('.sb-drag'),
          n.querySelector('.pd-draw-checkbox'),
          n.querySelector('.pd-menu-anchor>button'),
        ].map((e) => {
          const b = e.getBoundingClientRect()
          return b.y + b.height / 2
        }),
      )
    assert.ok(Math.max(...centers) - Math.min(...centers) < 1)
    await card.getByRole('button', { name: /Actions for/ }).click()
    const menu = page.getByRole('menu')
    await menu
      .getByRole('menuitem', { name: 'Draw panel after', exact: true })
      .hover()
    assert.ok(await menu.isVisible())
    await page.screenshot({ path: '/tmp/m04/finishing-card-menu.png' })
    await page.keyboard.press('Escape')
    await card.getByRole('button', { name: /Actions for/ }).click()
    await page.getByRole('menuitem', { name: 'Delete', exact: true }).click()
    await card
      .getByRole('button', { name: 'Cancel deletion', exact: true })
      .click()
    assert.equal(await page.locator('.sb-panel-card').count(), 22)
    for (let i = 0; i < 3; i++) {
      await page.locator('.sb-panel-card').nth(i).hover()
      await page.locator('.sb-panel-card').nth(i).getByRole('checkbox').check()
    }
    await page
      .getByRole('button', { name: 'Duplicate selected', exact: true })
      .click()
    await page.locator('.pd-selection-feedback.is-duplicated').waitFor()
    assert.equal(await page.locator('.sb-panel-card').count(), 25)
    await page.screenshot({ path: '/tmp/m04/finishing-duplicate-success.png' })
    await page
      .getByRole('button', { name: 'Clear selection', exact: true })
      .click()
    assert.equal(await page.locator('.sb-panel-card').count(), 25)
    for (let i = 0; i < 3; i++) {
      await page.locator('.sb-panel-card').nth(i).hover()
      await page.locator('.sb-panel-card').nth(i).getByRole('checkbox').check()
    }
    await page
      .getByRole('button', { name: 'Delete selected', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Cancel deletion', exact: true })
      .click()
    assert.equal(await page.locator('.sb-panel-card').count(), 25)
    await page
      .getByRole('button', { name: 'Delete selected', exact: true })
      .click()
    await page.screenshot({
      path: '/tmp/m04/finishing-bulk-delete-confirm.png',
    })
    await page
      .getByRole('button', {
        name: 'Confirm delete 3 selected panels',
        exact: true,
      })
      .click()
    await page.waitForFunction(
      () => document.querySelectorAll('.sb-panel-card').length === 22,
    )
    await page
      .locator('.pd-toast')
      .filter({ hasText: '3 panels deleted.' })
      .getByRole('button', { name: 'Restore', exact: true })
      .click()
    await page.waitForFunction(
      () => document.querySelectorAll('.sb-panel-card').length === 25,
    )
    await page.getByRole('radio', { name: 'Present', exact: true }).click()
    await page
      .getByRole('button', { name: 'Notes & shots', exact: true })
      .click()
    await page.locator('.sb-panel-inspector').waitFor()
    await page.screenshot({ path: '/tmp/m04/finishing-present-details.png' })
    await page
      .getByRole('button', { name: 'Notes & shots', exact: true })
      .click()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    console.log(
      'Canonical Split field editing and live M03 second-user propagation, bounded final-shot scrolling, disconnect/reconnect, derived naming, menu stability/alignment, animated duplicate, clear/delete/cancel/restore and Present details passed.',
    )
    fs.writeFileSync(
      '/tmp/m04/finishing-ecosystem-record.json',
      JSON.stringify({ id, listId: list.id }),
    )
  } catch (e) {
    if (page) {
      console.error(await page.locator('[role=alert]').allTextContents())
      await page.screenshot({
        path: '/tmp/m04/finishing-ecosystem-failure.png',
      })
    }
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
