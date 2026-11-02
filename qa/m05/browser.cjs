const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  path = require('node:path')
const kind = process.env.M05_BROWSER || 'chromium',
  pw = require(
    kind === 'webkit'
      ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  fixture = JSON.parse(fs.readFileSync('/tmp/m05/fixture.json')),
  out = '/tmp/m05/screenshots/' + kind
fs.mkdirSync(out, { recursive: true })
;(async () => {
  const browser = await pw[kind].launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1640, height: 1050 },
    acceptDownloads: true,
  })
  await context.addInitScript(
    (t) => localStorage.setItem('token', t),
    state.tokens['101'],
  )
  const page = await context.newPage(),
    errors = [],
    runId = Date.now()
  let previewBytes
  page.on('response', (r) => {
    if (r.url().endsWith('/pdf') && r.ok())
      void r.body().then((b) => (previewBytes = b))
  })
  page.on('pageerror', (e) => errors.push(e.message))
  page.setDefaultTimeout(15000)
  try {
    await page.goto(
      'http://127.0.0.1:5176/productiondesk/#/flows/' + fixture.id,
    )
    await page
      .getByRole('table', { name: 'Department Flow', exact: true })
      .waitFor()
    await page.getByText('Saved', { exact: true }).waitFor()
    await page.screenshot({ path: out + '/01-department-flow.png' })
    await page
      .getByRole('button', { name: 'Close Shot Rail', exact: true })
      .click()
    await page.getByRole('button', { name: 'Layout', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Departments and layout' }).click()
    await page.getByRole('dialog', { name: 'Departments and layout' }).waitFor()
    await page.screenshot({ path: out + '/02-departments.png' })
    await page
      .getByRole('button', { name: 'Close Departments and layout' })
      .click()
    const table = page.getByRole('table', {
      name: 'Department Flow',
      exact: true,
    })
    await table
      .getByRole('checkbox', { name: 'Select all events', exact: true })
      .check()
    assert.equal(
      await page.locator('.flow-selection strong').textContent(),
      fixture.eventCount + ' selected',
    )
    await page
      .getByRole('button', { name: 'Clear selection', exact: true })
      .click()
    assert.equal(
      await table
        .getByRole('checkbox', { name: 'Select all events', exact: true })
        .isChecked(),
      false,
    )
    const first = page.locator('.flow-grid tbody tr').first()
    await first.locator('.flow-time').click()
    await page
      .getByRole('dialog', { name: 'Event timing', exact: true })
      .waitFor()
    await page.screenshot({ path: out + '/03-time-editor.png' })
    await page.getByRole('button', { name: 'Close Event timing' }).click()
    await page.getByRole('button', { name: 'Time Map', exact: true }).click()
    await page.locator('.flow-time-block').first().waitFor()
    await page.screenshot({ path: out + '/04-time-map.png' })
    const block = page.locator('.flow-time-block>button').first()
    await block.focus()
    await block.press('ArrowRight')
    await page.getByRole('dialog', { name: 'Preview timing change' }).waitFor()
    await page
      .getByRole('button', { name: 'Close Preview timing change' })
      .click()
    await page
      .getByRole('button', { name: 'Department Flow', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Actions for event 1', exact: true })
      .click()
    await page.getByRole('menuitem', { name: 'Comments', exact: true }).click()
    await page
      .getByRole('textbox', { name: 'Add comment', exact: true })
      .fill('M05 browser discussion ' + kind + ' ' + runId)
    await page
      .getByRole('button', { name: 'Post comment', exact: true })
      .click()
    await page
      .getByText('M05 browser discussion ' + kind + ' ' + runId, {
        exact: true,
      })
      .waitFor()
    await page.screenshot({ path: out + '/05-event-comments.png' })
    await page
      .getByRole('button', {
        name: /^Close (Choreo Practice|19-|Production event)/,
      })
      .first()
      .click()
    await page
      .getByRole('button', { name: 'Print Studio', exact: true })
      .click()
    await page.locator('canvas[data-rendered=true]').waitFor({ timeout: 45000 })
    await page.screenshot({ path: out + '/06-print-studio.png' })
    const pdfResponse = await page
      .getByRole('link', { name: 'Download PDF', exact: true })
      .getAttribute('href')
    assert(pdfResponse.startsWith('blob:'))
    const download = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'Download PDF', exact: true }).click(),
    ])
    await download[0].saveAs('/tmp/m05/browser-' + kind + '.pdf')
    assert.deepEqual(
      fs.readFileSync('/tmp/m05/browser-' + kind + '.pdf'),
      previewBytes,
      'Preview and download use the identical PDF bytes',
    )
    await page
      .getByRole('button', { name: 'Close Print Studio', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Flow options', exact: true })
      .click()
    await page
      .getByRole('menuitem', { name: 'Revision history', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Preview', exact: true })
      .first()
      .click()
    await page.locator('.flow-revision-preview').waitFor()
    await page.screenshot({ path: out + '/07-revision-preview.png' })
    await page.getByRole('button', { name: 'Close Flow revisions' }).click()
    for (const factor of [1, 1.25, 1.5, 2]) {
      await page.evaluate((v) => {
        document.documentElement.style.zoom = String(v)
      }, factor)
      await page.screenshot({ path: out + `/08-zoom-${factor}.png` })
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      )
      const { all, row } = await page.evaluate(() => {
        const a = document
            .querySelector('.flow-grid thead .pd-draw-checkbox')
            .getBoundingClientRect(),
          b = document
            .querySelector('.flow-grid tbody .pd-draw-checkbox')
            .getBoundingClientRect()
        return {
          all: { x: a.x, width: a.width },
          row: { x: b.x, width: b.width },
        }
      })
      assert(
        Math.abs(all.x + all.width / 2 - (row.x + row.width / 2)) < 3,
        `Checkbox axis must align at ${factor}: ${JSON.stringify({ all, row })}`,
      )
    }
    await page.evaluate(() => {
      document.documentElement.style.zoom = '1'
    })
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.screenshot({ path: out + '/09-tablet.png' })
    await page.setViewportSize({ width: 430, height: 900 })
    await page.screenshot({ path: out + '/10-mobile.png' })
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      'No viewport overflow',
    )
    await page.goto('http://127.0.0.1:5176/productiondesk/#/flows')
    await page.getByRole('table', { name: 'Production flows' }).waitFor()
    await page.screenshot({ path: out + '/11-index.png' })
    await page
      .getByRole('searchbox', { name: 'Search flows', exact: true })
      .fill('no-match-m05')
    await page.getByText('No flows match your search.').waitFor()
    await page
      .getByRole('searchbox', { name: 'Search flows', exact: true })
      .fill('')
    assert.deepEqual(errors, [])
    console.log(
      kind +
        ' Flow matrix, layout, selection, timing, Time Map, comments, actual PDF/download, revision preview, 100/125/150/200% zoom, tablet/mobile/index/search passed.',
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
