const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const { createFixturePage } = require('./browser-harness.cjs')
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict')
const root =
  process.env.PD_PREVIEW_URL || 'http://127.0.0.1:5174/productiondesk/'
const out = path.join(__dirname, 'artifacts/refinement')
fs.mkdirSync(out, { recursive: true })
const results = []
const shot = async (p, name) => {
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(260)
  await p.screenshot({
    path: path.join(out, name + '.png'),
    fullPage: !(await p.locator('dialog[open]').count()),
  })
}
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome' })
  try {
    const { p, c } = await createFixturePage(browser, { root })
    await p
      .getByRole('link', { name: 'Camera & lighting test', exact: true })
      .waitFor()
    assert.equal(await p.locator('.pd-page-header p').count(), 0)
    assert.equal(
      await p
        .getByRole('link', { name: 'New call sheet', exact: true })
        .count(),
      1,
    )
    assert.equal(await p.locator('.pd-topbar').isVisible(), false)
    await shot(p, '01-expanded-dashboard')
    const brand = p.locator('.pd-sidebar .pd-brand'),
      emblem = brand.locator('.pd-emblem'),
      front = emblem.locator('.pd-emblem-front')
    const rest = await front.evaluate((n) => getComputedStyle(n).transform),
      box = await emblem.boundingBox()
    assert.equal(box.width, 28)
    assert.equal(box.height, 28)
    await p.evaluate(() => {
      const proof = document.createElement('div')
      proof.id = 'emblem-proof'
      proof.className = 'pd-ui'
      Object.assign(proof.style, {
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        padding: '22px',
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
        background: '#080b12',
        border: '1px solid #293746',
      })
      for (const size of [28, 48]) {
        const column = document.createElement('div'),
          svg = document.querySelector('.pd-brand .pd-emblem').cloneNode(true)
        svg.setAttribute('width', size)
        svg.setAttribute('height', size)
        column.appendChild(svg)
        const label = document.createElement('div')
        label.textContent = size + ' px'
        Object.assign(label.style, {
          font: '10px Inter, sans-serif',
          color: '#a9b4c3',
          marginTop: '14px',
        })
        column.appendChild(label)
        proof.appendChild(column)
      }
      document.body.appendChild(proof)
    })
    await p
      .locator('#emblem-proof')
      .screenshot({ path: path.join(out, '02-emblem-actual-sizes.png') })
    await p.locator('#emblem-proof').evaluate((n) => n.remove())
    await brand.hover()
    await p.waitForTimeout(240)
    assert.notEqual(
      await front.evaluate((n) => getComputedStyle(n).transform),
      rest,
    )
    await shot(p, '03-emblem-hover')
    await p.mouse.move(0, 0)
    await p.waitForTimeout(240)
    assert.equal(
      await front.evaluate((n) => getComputedStyle(n).transform),
      rest,
    )
    await p.keyboard.press('Tab')
    await brand.focus()
    assert.equal(await brand.evaluate((n) => n.matches(':focus-visible')), true)
    await shot(p, '04-brand-keyboard-focus')
    await p.getByRole('link', { name: 'Roster', exact: true }).hover()
    await shot(p, '05-navigation-hover')
    await p.getByRole('button', { name: 'Collapse sidebar' }).click()
    await p.waitForTimeout(260)
    const collapsedBox = await emblem.boundingBox()
    assert.equal(collapsedBox.x, box.x)
    assert.equal((await p.locator('.pd-sidebar').boundingBox()).width, 66)
    await shot(p, '06-collapsed-dashboard')
    await p.getByRole('link', { name: 'Roster', exact: true }).click()
    assert.equal(await p.locator('.pd-app.pd-collapsed').count(), 1)
    await p.getByRole('button', { name: 'Expand sidebar' }).click()
    await p.getByRole('button', { name: 'Maya Chen', exact: true }).waitFor()
    await shot(p, '07-roster')
    await p.getByRole('button', { name: 'All categories', exact: true }).click()
    await shot(p, '08-roster-category-menu')
    await p.keyboard.press('Escape')
    await p.getByRole('button', { name: 'Add person', exact: true }).click()
    await shot(p, '09-add-person')
    await p.getByRole('button', { name: 'Cancel', exact: true }).click()
    await p.getByRole('button', { name: 'Maya Chen', exact: true }).click()
    await shot(p, '10-edit-person')
    await p.getByRole('button', { name: 'Cancel', exact: true }).click()
    await p.goto(root + '#/callsheets/new')
    await p.locator('.pd-template').first().waitFor()
    await shot(p, '11-new-call-sheet')
    assert.equal(await p.locator('.pd-page-header p').count(), 0)
    const signed = await createFixturePage(browser, { root, token: false })
    await signed.p
      .getByRole('heading', { name: 'Sign in to Production Desk', exact: true })
      .waitFor()
    assert.equal(await signed.p.locator('h1,h2').count(), 1)
    assert.equal(await signed.p.locator('.pd-session p').count(), 0)
    assert.equal(
      await signed.p
        .getByRole('link', { name: 'Sign in', exact: true })
        .count(),
      1,
    )
    assert.equal(
      await signed.p
        .getByRole('link', { name: 'Sign in', exact: true })
        .getAttribute('href'),
      '/scheduler/login?returnTo=' +
        encodeURIComponent(
          '/productiondesk/' + (await signed.p.evaluate(() => location.hash)),
        ),
    )
    assert.equal(signed.state.requests.length, 0)
    await shot(signed.p, '12-signed-out')
    await signed.c.close()
    for (const width of [390, 360]) {
      await p.setViewportSize({ width, height: 844 })
      await p.goto(root)
      await p
        .getByRole('link', { name: 'Camera & lighting test', exact: true })
        .waitFor()
      await shot(p, '13-mobile-dashboard-' + width)
      assert.equal(await p.locator('.pd-mobile-brand .pd-emblem').count(), 1)
      assert.equal(
        await p
          .getByRole('link', { name: 'New call sheet', exact: true })
          .count(),
        1,
      )
      await p.getByRole('button', { name: 'Open navigation' }).click()
      await shot(p, '14-mobile-navigation-' + width)
      await p
        .getByRole('dialog')
        .getByRole('link', { name: 'Roster', exact: true })
        .click()
      await p.getByRole('button', { name: 'Maya Chen', exact: true }).waitFor()
      await shot(p, '15-mobile-roster-' + width)
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      )
    }
    await c.close()
    const reduced = await createFixturePage(browser, {
      root,
      reducedMotion: 'reduce',
    })
    await reduced.p
      .getByRole('link', { name: 'Camera & lighting test', exact: true })
      .waitFor()
    const rfront = reduced.p.locator('.pd-sidebar .pd-emblem-front'),
      before = await rfront.evaluate((n) => getComputedStyle(n).transform)
    await reduced.p.locator('.pd-sidebar .pd-brand').hover()
    assert.equal(
      await rfront.evaluate((n) => getComputedStyle(n).transform),
      before,
    )
    assert.equal(
      await rfront.evaluate((n) => getComputedStyle(n).transitionDuration),
      '0s',
    )
    await reduced.c.close()
    results.push({
      name: 'Concise copy, original 28/48px emblem, hover/focus/settling, stable collapsed icon column, routes, one creation action, concise authenticated redirect, mobile and reduced motion',
      pass: true,
    })
    fs.writeFileSync(
      path.join(out, 'refinement-verification.json'),
      JSON.stringify(results, null, 2),
    )
    console.log('PASS', results[0].name)
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
