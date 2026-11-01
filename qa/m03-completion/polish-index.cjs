const { state, out, api, create } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  path = require('node:path'),
  pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  wk = require('/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright')
;(async () => {
  const made = await fetch(state.api + '/callsheets', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + state.tokens[101],
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'M03 local clickable row',
      productionDate: '2027-05-31',
    }),
  })
  assert.ok(made.ok)
  const call = await made.json()
  const prefix = 'Index acceptance ' + crypto.randomUUID().slice(0, 6),
    a = await create(prefix + ' A'),
    b = await create(prefix + ' B'),
    z = await create(prefix + ' Z')
  for (const [name, engine] of [
    ['chrome', pw.chromium],
    ['webkit', wk.webkit],
  ]) {
    const browser = await engine.launch(
      name === 'chrome'
        ? { channel: 'chrome', headless: true }
        : { headless: true },
    )
    try {
      const c = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      })
      await c.addInitScript(
        (t) => localStorage.setItem('token', t),
        state.tokens[101],
      )
      const p = await c.newPage()
      p.setDefaultTimeout(15000)
      await p.route('**/api/shotlists', async (route) => {
        if (route.request().method() !== 'GET') return route.continue()
        await route.fulfill({
          json: {
            items: [
              { ...z, dates: [] },
              { ...b, dates: ['2026-11-04'] },
              { ...a, dates: ['2026-11-06'] },
            ],
          },
        })
      })
      await p.goto(state.root + '#/shotlists')
      await p
        .getByRole('searchbox', { name: 'Search shot lists', exact: true })
        .fill(prefix)
      const links = p.locator('.pd-documents tbody .pd-document-link')
      await links.first().waitFor()
      assert.deepEqual(await links.allTextContents(), [b.name, a.name, z.name])
      await p
        .getByRole('button', { name: 'Production date', exact: true })
        .click()
      await p
        .getByRole('menuitemradio', { name: 'Title A–Z', exact: true })
        .click()
      assert.deepEqual(await links.allTextContents(), [a.name, b.name, z.name])
      await p
        .getByRole('searchbox', { name: 'Search shot lists', exact: true })
        .fill(prefix + ' Z')
      assert.equal(await links.count(), 1)
      await p
        .getByRole('searchbox', { name: 'Search shot lists', exact: true })
        .fill('UNMATCHABLE')
      await p
        .getByRole('heading', { name: 'No matching shot lists', exact: true })
        .waitFor()
      await p.getByRole('button', { name: 'Clear search', exact: true }).click()
      const row = p
        .locator('.pd-documents tbody tr')
        .filter({ hasText: a.name })
      await row
        .getByRole('button', { name: 'Actions for ' + a.name, exact: true })
        .click()
      await p.getByRole('menuitem', { name: 'Rename', exact: true }).click()
      await p
        .getByRole('dialog', { name: 'Rename shot list', exact: true })
        .waitFor()
      assert.ok(p.url().endsWith('#/shotlists'))
      await p
        .getByRole('button', { name: 'Close Rename shot list', exact: true })
        .click()
      await row
        .getByRole('button', { name: 'Actions for ' + a.name, exact: true })
        .click()
      await p.getByRole('menuitem', { name: 'Delete', exact: true }).click()
      await p.getByRole('button', { name: 'Cancel', exact: true }).click()
      assert.ok(p.url().endsWith('#/shotlists'))
      assert.equal(await row.locator('.pd-inline-delete').count(), 0)
      assert.equal(
        await row.evaluate((el) => getComputedStyle(el).cursor),
        'pointer',
      )
      await p.screenshot({
        path: path.join(out, 'polish-' + name + '-index.png'),
      })
      const spot = await row.locator('td').nth(1).boundingBox()
      await p.mouse.click(spot.x + spot.width / 2, spot.y + spot.height / 2)
      await p.waitForURL('**/#/shotlists/' + a.id)
      await p.locator('[data-sync="saved"]').waitFor()
      await p
        .getByRole('link', { name: 'Back to shot lists', exact: true })
        .click()
      await p.getByRole('link', { name: a.name, exact: true }).press('Enter')
      await p.waitForURL('**/#/shotlists/' + a.id)
      await p.getByRole('link', { name: 'Call sheets', exact: true }).click()
      await p.locator('.pd-documents tbody tr').first().waitFor()
      const callRow = p.locator('.pd-documents tbody tr').first(),
        href = await callRow.getByRole('link').getAttribute('href')
      await callRow.getByRole('button', { name: /^Actions for/ }).click()
      assert.ok(p.url().endsWith('#/'))
      await p.keyboard.press('Escape')
      const callSpot = await callRow.locator('td').nth(1).boundingBox()
      await p.mouse.click(
        callSpot.x + callSpot.width / 2,
        callSpot.y + callSpot.height / 2,
      )
      await p.waitForURL('**/' + href)
      assert.ok(p.url().includes('/callsheets/'))
      console.log(
        'PASS',
        name,
        'immediate title search, date/title sort with undated last/stable tie; full-row and keyboard Shot List/Call Sheet links; actions never navigate',
      )
    } finally {
      await browser.close()
    }
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
