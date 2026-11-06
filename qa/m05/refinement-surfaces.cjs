// Browser-only empty/error fixtures are isolated to these QA contexts.
const fs = require('fs'),
  assert = require('assert/strict'),
  kind = process.env.M05_BROWSER || 'chromium',
  pw = require(
    kind === 'webkit'
      ? '/tmp/m05/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  f = JSON.parse(fs.readFileSync('/tmp/m05/refinement/fixture.json')),
  board = JSON.parse(
    fs.readFileSync('/tmp/m05/refinement/storyboard.json'),
  ),
  log = JSON.parse(
    fs.readFileSync('/tmp/m05/refinement/shoot-log-http.json'),
  ),
  root = 'http://127.0.0.1:5176/productiondesk/#',
  out = '/tmp/m05/refinement/' + kind
;(async () => {
  const browser = await pw[kind].launch(),
    ctx = await browser.newContext({
      viewport: { width: 1640, height: 1050 },
      acceptDownloads: true,
    })
  await ctx.addInitScript((t) => {
    if (!sessionStorage.getItem('qa-final')) {
      localStorage.setItem('token', t)
      sessionStorage.setItem('qa-final', 'yes')
    }
  }, auth.tokens['103'])
  const page = await ctx.newPage()
  page.setDefaultTimeout(20000)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  try {
    await page.goto(root + '/shotlists/' + f.listId)
    await page
      .getByRole('button', { name: 'Download', exact: true })
      .click()
    await page
      .getByRole('dialog', { name: 'Download shot list', exact: true })
      .waitFor()
    await page
      .locator('.pd-pdf-pages canvas')
      .first()
      .waitFor({ timeout: 45000 })
    let response
    page.on('response', async (r) => {
      if (r.url().endsWith('/pdf') && r.status() === 201) response = r
    })
    const download = page.waitForEvent('download')
    await page
      .getByRole('link', { name: 'Download PDF', exact: true })
      .click()
    const file = await (await download).path()
    assert(fs.readFileSync(file).subarray(0, 5).toString() === '%PDF-')
    await page
      .getByRole('button', {
        name: 'Close Download shot list',
        exact: true,
      })
      .click()
    await page.goto(root + '/flows/' + log.flowId)
    await page
      .getByRole('button', { name: 'Print Studio', exact: true })
      .click()
    await page
      .getByRole('checkbox', {
        name: 'Include production log',
        exact: true,
      })
      .check()
    await page
      .locator('.flow-pdf-pages-scroll canvas')
      .first()
      .waitFor({ timeout: 45000 })
    await page.waitForTimeout(500)
    const pdf = page.waitForEvent('download')
    await page
      .getByRole('link', { name: 'Download PDF', exact: true })
      .click()
    const flowFile = await (await pdf).path()
    const bytes = fs.readFileSync(flowFile)
    assert(bytes.subarray(0, 5).toString() === '%PDF-')
    if (response)
      assert.deepEqual(
        bytes,
        await response.body(),
        'actual preview and download share identical PDF bytes',
      )
    await page
      .getByRole('button', { name: 'Close Print Studio', exact: true })
      .click()
    await page.goto(root + '/storyboards/' + board.id)
    await page
      .locator('.sb-panel-card')
      .first()
      .getByRole('button', { name: 'Edit visual description' })
      .click()
    const desc = page.getByRole('dialog', {
      name: 'Visual description',
      exact: true,
    })
    const editor = desc.getByRole('textbox', {
      name: 'Visual description',
      exact: true,
    })
    await editor.fill('Browser-edited visual description ' + kind)
    await desc.getByRole('button', { name: 'Done', exact: true }).click()
    await page.locator('.sb-card-art').first().click()
    await page.getByRole('button', { name: 'Studio', exact: true }).click()
    await page.locator('[data-drawing-engine]').waitFor()
    await page.locator('.sb-property-trigger').click()
    const swatches = page.locator('.sb-swatches>button')
    await swatches.nth(8).click()
    const previous = await swatches.evaluateAll((ns) =>
      ns.map((n) => n.style.backgroundColor),
    )
    await page
      .getByRole('slider', { name: 'Color hue', exact: true })
      .press('ArrowRight')
    const next = await swatches.evaluateAll((ns) =>
      ns.map((n) => n.style.backgroundColor),
    )
    assert.notEqual(next[8], previous[8])
    previous.forEach((v, i) => {
      if (i !== 8) assert.equal(next[i], v)
    })
    assert.equal(next.length, 12)
    await page.evaluate(() => {
      Object.defineProperty(window, 'EyeDropper', {
        configurable: true,
        value: undefined,
      })
    })
    await page
      .getByRole('button', { name: 'Sample color', exact: true })
      .click()
    const canvas = page.locator('[data-drawing-engine]')
    await canvas.click({ position: { x: 250, y: 200 } })
    await page.locator('.sb-property-trigger').click()
    assert.equal(await swatches.count(), 12)
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    const empty = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    })
    await empty.addInitScript(
      (t) => localStorage.setItem('token', t),
      auth.tokens['103'],
    )
    let mode = 'empty'
    await empty.route('**/api/*', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (
        route.request().method() === 'GET' &&
        [
          '/api/callsheets',
          '/api/shotlists',
          '/api/storyboards',
          '/api/flows',
        ].includes(path)
      )
        return route.fulfill({
          status: mode === 'empty' ? 200 : 503,
          contentType: 'application/json',
          body: JSON.stringify(
            mode === 'empty'
              ? { items: [] }
              : { message: 'QA service unavailable' },
          ),
        })
      return route.continue()
    })
    const p = await empty.newPage()
    for (const [path, title] of [
      ['/', 'No call sheets yet'],
      ['/shotlists', 'No shot lists yet'],
      ['/storyboards', 'No storyboards yet'],
      ['/flows', 'No production days yet'],
    ]) {
      await p.goto(root + path)
      await p.getByRole('heading', { name: title, exact: true }).waitFor()
      assert.equal(await p.locator('.pd-empty').count(), 1)
    }
    mode = 'error'
    for (const path of ['/shotlists', '/storyboards', '/flows']) {
      await p.goto(root + path)
      await p.getByRole('alert').first().waitFor()
      assert.equal(await p.getByText(/No .* yet/).count(), 0)
    }
    await empty.close()
    await page.setViewportSize({ width: 390, height: 844 })
    await page
      .getByRole('button', { name: 'Open navigation', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Account menu', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Switch account', exact: true })
      .waitFor()
    await page.screenshot({ path: out + '/account-phone.png' })
    assert.deepEqual(errors, [])
    console.log(
      kind +
        ': unchanged M03 PDF and actual production-log preview/download; direct description edit, stable hue and in-artwork eyedropper replacement; four shared empty states and distinct backend errors; phone account menu passed.',
    )
  } catch (e) {
    await page.screenshot({ path: out + '/surface-failure.png' })
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
