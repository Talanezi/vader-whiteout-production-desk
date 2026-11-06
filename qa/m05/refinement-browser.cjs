const fs = require('fs'),
  assert = require('assert/strict'),
  kind = process.env.M05_BROWSER || 'chromium',
  pw = require(
    kind === 'webkit'
      ? '/tmp/m05/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  s = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  f = JSON.parse(fs.readFileSync('/tmp/m05/refinement/fixture.json')),
  board = JSON.parse(
    fs.readFileSync('/tmp/m05/refinement/storyboard.json'),
  ),
  base = 'http://127.0.0.1:5176/productiondesk/#',
  api = 'http://127.0.0.1:4314/api',
  out = '/tmp/m05/refinement/' + kind
fs.mkdirSync(out, { recursive: true })
;(async () => {
  const browser = await pw[kind].launch(),
    errors = []
  let page
  const context = async (user) => {
    const c = await browser.newContext({
      viewport: { width: 1640, height: 1050 },
      acceptDownloads: true,
    })
    await c.addInitScript((t) => {
      if (!sessionStorage.getItem('qa-auth-initialized')) {
        localStorage.setItem('token', t)
        sessionStorage.setItem('qa-auth-initialized', 'yes')
      }
    }, s.tokens[user])
    return c
  }
  async function snap(name) {
    await page.screenshot({ path: out + '/' + name + '.png' })
  }
  const read = async (path) => {
    const r = await fetch(api + path, {
      headers: { Authorization: 'Bearer ' + s.tokens['101'] },
    })
    assert(r.ok, await r.clone().text())
    return r.json()
  }
  try {
    const dp = await context('102')
    page = await dp.newPage()
    page.setDefaultTimeout(18000)
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(base + '/shotlists/' + f.listId)
    await page
      .getByRole('button', { name: 'Grid preset', exact: true })
      .waitFor()
    assert.equal(
      await page.getByRole('button', { name: 'Grid preset' }).innerText(),
      'Cinematography',
    )
    const rows = page.locator('tbody tr[data-shot]')
    await rows.first().getByRole('checkbox').check()
    await page
      .locator('.pd-shot-selection')
      .getByRole('button', { name: 'Row color', exact: true })
      .click()
    await page.getByRole('menuitem', { name: 'Rose', exact: true }).click()
    await page.waitForFunction(
      (id) =>
        document
          .querySelector(`[data-shot="${id}"]`)
          ?.getAttribute('data-colored') === 'true',
      f.shotIds[0],
    )
    await snap('01-dp-row-color')
    await page
      .getByRole('button', { name: 'Clear selection', exact: true })
      .click()
    for (const i of [0, 1]) await rows.nth(i).getByRole('checkbox').check()
    await page
      .locator('.pd-shot-selection')
      .getByRole('button', { name: 'Row color' })
      .click()
    await page.getByRole('menuitem', { name: 'Teal', exact: true }).click()
    await page
      .getByRole('button', { name: 'Clear selection', exact: true })
      .click()
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await page.waitForTimeout(450)
    await page.reload()
    await rows.first().waitFor()
    assert.equal(await rows.first().getAttribute('data-colored'), 'true')
    const ad = await context('103'),
      adPage = await ad.newPage()
    page = adPage
    page.setDefaultTimeout(18000)
    await page.goto(base + '/shotlists/' + f.listId)
    await page.getByRole('button', { name: 'AD production day' }).waitFor()
    assert.equal(
      await page.getByRole('button', { name: 'Grid preset' }).innerText(),
      'AD / On-Set',
    )
    await page.getByRole('button', { name: 'AD production day' }).click()
    await page
      .getByRole('menuitemradio', {
        name: 'Flow of the Day - Cave Scene · ' + f.date,
        exact: true,
      })
      .click()
    const first = page.locator(`[data-shot="${f.shotIds[0]}"]`),
      allot = first.getByRole('spinbutton', {
        name: 'AD allotted minutes',
      })
    await allot.waitFor()
    await allot.fill('12')
    await allot.press('Tab')
    await first.getByRole('button', { name: /Choose take|★ Take/ }).click()
    let dialog = page.getByRole('dialog', {
      name: 'Preferred take',
      exact: true,
    })
    await dialog
      .getByRole('textbox', { name: 'Take', exact: true })
      .fill(kind === 'chromium' ? '3' : '4')
    await dialog
      .getByRole('textbox', { name: 'Take note', exact: true })
      .fill('Preferred on-set performance ' + kind)
    await dialog
      .getByRole('button', { name: 'Record take', exact: true })
      .click()
    await dialog
      .getByRole('button', { name: /Close Preferred take/ })
      .click()
    await first
      .getByRole('textbox', { name: 'Production notes' })
      .fill('AD production note ' + kind)
    await snap('02-ad-on-set')
    await page.reload()
    await first.getByRole('button', { name: /★ Take/ }).waitFor()
    const source = await read('/shotlists/' + f.listId + '/export')
    assert.equal(source.shots[f.shotIds[0]].estimatedMinutes, '8')
    assert(Object.keys(source.shots[f.shotIds[0]].takes).length >= 1)
    const flow = await read('/flows/' + f.flowId + '/snapshot')
    assert.equal(flow.state.events[f.eventIds[0]].allottedMinutes, 12)
    await page.goto(base + '/flows/' + f.flowId)
    await page
      .getByRole('radio', { name: 'Department Flow', exact: true })
      .click()
    await page.getByRole('button', { name: 'Layout', exact: true }).click()
    assert.equal(
      await page.getByText('Customize', { exact: true }).count(),
      1,
    )
    assert.equal(await page.locator('.flow-layout-row').count(), 10)
    await snap('03-layout')
    await page.keyboard.press('Escape')
    await page
      .getByRole('radio', { name: 'Time Map', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Close Shot Rail', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Fit day', exact: true })
      .click()
    const compact = page.locator('.flow-time-block[data-density=compact]')
    await compact.first().getByRole('button').first().focus()
    await page.locator('.flow-map-peek strong').waitFor()
    const ticks = await page
      .locator('.flow-time-ruler time')
      .evaluateAll((ns) =>
        ns.map((n) => {
          const r = n.getBoundingClientRect()
          return { left: r.left, right: r.right }
        }),
      )
    assert(ticks.every((t, i) => !i || t.left >= ticks[i - 1].right))
    await snap('05-time-map')
    for (const zoom of [1.25, 1.5, 2]) {
      await page.setViewportSize({
        width: Math.round(1640 / zoom),
        height: Math.round(1050 / zoom),
      })
      await snap('time-map-' + zoom)
    }
    await page.setViewportSize({ width: 1640, height: 1050 })
    await page.goto(base + '/storyboards/' + board.id)
    await page.locator('.sb-panel-card').first().waitFor()
    await page
      .locator('.sb-panel-card')
      .first()
      .getByRole('button', { name: 'Edit visual description' })
      .click()
    await page
      .getByRole('dialog', { name: 'Visual description', exact: true })
      .waitFor()
    await page
      .getByRole('dialog', { name: 'Visual description', exact: true })
      .getByRole('button', { name: 'Done', exact: true })
      .click()
    await page.locator('.sb-card-art').first().click()
    await page.getByRole('button', { name: 'Studio', exact: true }).click()
    await page.locator('[data-drawing-engine]').waitFor()
    await page.locator('.sb-property-trigger').click()
    await page.getByRole('textbox', { name: 'Custom color HEX' }).waitFor()
    const swatches = page.locator('.sb-swatches>button')
    assert.equal(await swatches.count(), 12)
    await swatches.nth(3).click()
    await page
      .getByRole('textbox', { name: 'Custom color HEX' })
      .fill('#ef665e')
    const before = await swatches.evaluateAll((ns) =>
      ns.map((n) => n.style.backgroundColor),
    )
    await page
      .getByRole('textbox', { name: 'Custom color HEX' })
      .fill('#000bff')
    const after = await swatches.evaluateAll((ns) =>
      ns.map((n) => n.style.backgroundColor),
    )
    assert.equal(after[3], 'rgb(0, 11, 255)')
    before.forEach((v, i) => {
      if (i !== 3) assert.equal(after[i], v)
    })
    await snap('06-palette-twelve')
    await page.reload()
    await page.locator('.sb-card-art').first().click()
    await page.getByRole('button', { name: 'Studio', exact: true }).click()
    await page.locator('.sb-property-trigger').click()
    assert.equal(
      await page
        .locator('.sb-swatches>button')
        .nth(3)
        .evaluate((n) => n.style.backgroundColor),
      'rgb(0, 11, 255)',
    )
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page
      .getByRole('button', { name: 'Download', exact: true })
      .click()
    await page
      .getByRole('button', { name: '6 panels per page', exact: true })
      .waitFor()
    await page
      .getByRole('button', { name: '8 panels per page', exact: true })
      .count()
    await page
      .locator('.pd-pdf-page canvas,.pd-pdf-pages canvas')
      .first()
      .waitFor({ timeout: 30000 })
    await snap('07-storyboard-pdf')
    await page
      .getByRole('button', {
        name: 'Close Download storyboard',
        exact: true,
      })
      .click()
    await page
      .getByRole('button', { name: 'Account menu', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Sign out', exact: true })
      .click()
    await page
      .getByRole('heading', {
        name: 'Sign in to Production Desk',
        exact: true,
      })
      .waitFor()
    assert.equal(
      await page.evaluate(() => localStorage.getItem('token')),
      null,
    )
    assert.deepEqual(errors, [])
    console.log(
      kind +
        ': DP colors/bulk/undo/reload, AD preset/day context/allotment/takes persistence, compact Layout, adaptive Time Map/high zoom, direct descriptions, exact 12-slot in-place palette/reload, actual PDF preview and real Scheduler-backed logout passed.',
    )
  } catch (e) {
    if (page) {
      await snap('failure')
      console.error((await page.locator('body').innerText()).slice(-2400))
    }
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
