const { state, out, create, api, until } = require('./helpers.cjs'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path')
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const checks = [],
  errors = []
const pass = (name, detail = {}) => {
  checks.push({ name, pass: true, ...detail })
  console.log('PASS', name, JSON.stringify(detail))
}
const shot = async (page, name) => {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: path.join(out, name + '.png') })
}
async function ready(page) {
  await page.locator('[data-sync="saved"]').waitFor({ timeout: 20000 })
}
async function preset(page, name) {
  await page.getByRole('button', { name: 'Grid preset', exact: true }).click()
  await page.getByRole('option', { name, exact: true }).click()
}
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const list = await create('Whiteout · M03.2 workspace QA'),
      context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        permissions: ['clipboard-read', 'clipboard-write'],
      })
    await context.addInitScript(
      (token) => localStorage.setItem('token', token),
      state.tokens[101],
    )
    const page = await context.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(state.root + '#/shotlists/' + list.id)
    await ready(page)
    await shot(page, '01-essentials')
    const identity = page.locator('.pd-pro-table tbody .pd-pin-number').first(),
      start = await identity.boundingBox()
    await preset(page, 'Full Technical')
    const widths = await page
      .locator('.pd-pro-table thead th')
      .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().width))
    assert.ok(widths.slice(1, -1).every((w) => w >= 80))
    assert.ok(
      (await page.locator('.pd-pro-table').evaluate((el) => el.offsetWidth)) >
        2700,
    )
    await shot(page, '02-full-technical')
    await page.locator('.pd-pro-grid').evaluate((el) => (el.scrollLeft = 1100))
    assert.ok(Math.abs((await identity.boundingBox()).x - start.x) < 2)
    await shot(page, '03-full-scrolled')
    pass('Readable fixed columns and pinned identity while scrolled', {
      columns: widths.length,
      minWidth: Math.min(...widths.slice(1, -1)),
    })
    await page.locator('.pd-pro-grid').evaluate((el) => (el.scrollLeft = 0))
    const resize = page.getByRole('separator', {
      name: 'Resize Action / coverage',
      exact: true,
    })
    await resize.evaluate((el) =>
      el.scrollIntoView({ inline: 'center', block: 'nearest' }),
    )
    const r = await resize.boundingBox(),
      old = Number(await resize.getAttribute('aria-valuenow'))
    await page.mouse.move(r.x + 4, r.y + 15)
    await page.mouse.down()
    await page.mouse.move(r.x + 95, r.y + 15, { steps: 8 })
    await page.mouse.up()
    assert.ok(Number(await resize.getAttribute('aria-valuenow')) > old + 50)
    await shot(page, '04-resized')
    await resize.press('ArrowLeft')
    const personal = Number(await resize.getAttribute('aria-valuenow'))
    await page.reload()
    await ready(page)
    assert.equal(
      Number(
        await page
          .getByRole('separator', {
            name: 'Resize Action / coverage',
            exact: true,
          })
          .getAttribute('aria-valuenow'),
      ),
      personal,
    )
    pass('Pointer and keyboard resize persists after reload')
    await page
      .getByRole('button', { name: 'Choose columns', exact: true })
      .click()
    await shot(page, '05-column-manager')
    await page
      .getByRole('button', {
        name: 'Reset Action / coverage width',
        exact: true,
      })
      .click()
    await page
      .getByRole('button', { name: 'Move Camera column later', exact: true })
      .click()
    await page
      .getByRole('textbox', { name: 'Search columns', exact: true })
      .fill('Lighting')
    assert.equal(
      await page
        .getByRole('checkbox', { name: 'Show Lighting notes', exact: true })
        .count(),
      1,
    )
    await page
      .getByRole('textbox', { name: 'Search columns', exact: true })
      .fill('')
    await page
      .getByRole('button', { name: 'Restore default layout', exact: true })
      .click()
    await page
      .getByRole('dialog', { name: 'Columns and layout' })
      .getByRole('button', { name: /^Close/ })
      .first()
      .click()
    await preset(page, 'Essentials')
    await page
      .getByRole('separator', { name: 'Resize Action / coverage', exact: true })
      .dblclick()
    assert.ok(
      Number(
        await page
          .getByRole('separator', {
            name: 'Resize Action / coverage',
            exact: true,
          })
          .getAttribute('aria-valuenow'),
      ) <= 640,
    )
    pass('Column search/order/reset, presets and capped autofit')
    const rows = page.locator('.pd-pro-table tbody tr[data-shot]'),
      first = rows.first(),
      firstId = await first.getAttribute('data-shot'),
      label = await first.locator('[data-field="number"] input').inputValue()
    await first
      .getByRole('button', { name: 'Inspect shot ' + label, exact: true })
      .click()
    await shot(page, '06-inspector')
    const logicalWidth = await page
      .locator('.pd-pro-table')
      .evaluate((el) => el.offsetWidth)
    await page.getByRole('button', { name: 'Focus', exact: true }).click()
    assert.equal(
      await page.locator('.pd-shot-layout>.pd-scene-rail').count(),
      0,
    )
    assert.equal(
      await page.locator('.pd-pro-table').evaluate((el) => el.offsetWidth),
      logicalWidth,
    )
    await shot(page, '07-focus')
    await page
      .getByRole('button', { name: 'Restore layout', exact: true })
      .click()
    assert.equal(
      await page.locator('.pd-shot-layout>.pd-scene-rail').count(),
      1,
    )
    pass('Inspector and focus mode preserve logical widths and selection')
    // Navigation owns TD focus; text editing retains native shortcuts.
    const c00 = page.locator('[data-grid-row="0"][data-grid-col="0"]')
    await c00.press('ArrowRight')
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('data-grid-col') === '1',
    )
    await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('ControlOrMeta+c')
    assert.ok(
      (await page.evaluate(() => navigator.clipboard.readText())).includes(
        '\t',
      ),
    )
    await c00.press('Home')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.evaluate(() =>
      navigator.clipboard.writeText(
        'QA-A\t"first line\nsecond line"\nQA-B\tsecond coverage',
      ),
    )
    await page.keyboard.press('ControlOrMeta+v')
    await ready(page)
    assert.equal(
      await first.locator('[data-field="number"] input').inputValue(),
      'QA-A',
    )
    assert.equal(
      (await api('/' + list.id + '/export')).shots[firstId].coverage,
      'first line\nsecond line',
    )
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await ready(page)
    assert.equal(
      await first.locator('[data-field="number"] input').inputValue(),
      label,
    )
    pass(
      'Arrow navigation, rectangular copy, quoted multiline TSV paste and one-step undo',
    )
    await preset(page, 'AD / Planning')
    const numeric = page
        .locator('[data-field="setupMinutes"]')
        .first()
        .locator('..'),
      before = await api('/' + list.id + '/export')
    await numeric.focus()
    await page.evaluate(() =>
      navigator.clipboard.writeText('not a duration\t-1'),
    )
    await page.keyboard.press('ControlOrMeta+v')
    await page
      .getByText(/Enter a non-negative/)
      .first()
      .waitFor()
    assert.deepEqual((await api('/' + list.id + '/export')).shots, before.shots)
    await preset(page, 'Essentials')
    pass('Invalid multi-cell paste is atomic with field-specific error')
    await first.getByRole('checkbox').check()
    await rows.nth(1).getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Bulk field', exact: true }).click()
    await page.getByRole('option', { name: 'Camera', exact: true }).click()
    await page
      .getByRole('textbox', { name: 'Bulk value', exact: true })
      .fill('CAM D')
    await page.getByRole('button', { name: 'Apply', exact: true }).click()
    await ready(page)
    assert.equal(
      (await api('/' + list.id + '/export')).shots[firstId].camera,
      'CAM D',
    )
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await ready(page)
    await page.getByRole('button', { name: 'Clear', exact: true }).click()
    pass('Contextual bulk update changes one field and undoes coherently')
    // Intentional drag from grip; native field clicks and checkboxes never reorder.
    const baseline = await rows.evaluateAll((nodes) =>
        nodes.map((n) => n.dataset.shot),
      ),
      handle = first.getByRole('button', {
        name: 'Reorder shot ' + label,
        exact: true,
      }),
      a = await handle.boundingBox(),
      b = await rows.nth(2).boundingBox()
    await page.mouse.move(a.x + 12, a.y + 12)
    await page.mouse.down()
    await page.mouse.move(a.x + 12, a.y + 14)
    assert.deepEqual(
      await rows.evaluateAll((n) => n.map((r) => r.dataset.shot)),
      baseline,
    )
    await page.mouse.move(a.x + 12, b.y + b.height / 2, { steps: 12 })
    await shot(page, '08-drag-active')
    await page.mouse.up()
    await ready(page)
    const reordered = await rows.evaluateAll((n) =>
      n.map((r) => r.dataset.shot),
    )
    assert.notDeepEqual(reordered, baseline)
    assert.deepEqual([...reordered].sort(), [...baseline].sort())
    await shot(page, '09-reordered')
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await ready(page)
    assert.deepEqual(
      await rows.evaluateAll((n) => n.map((r) => r.dataset.shot)),
      baseline,
    )
    pass(
      'Pointer grip, activation threshold, stable identities, completed reorder and undo',
    )
    await handle.press('Space')
    await page.keyboard.press('ArrowDown')
    await until(
      async () =>
        JSON.stringify(
          await rows.evaluateAll((n) => n.map((r) => r.dataset.shot)),
        ) !== JSON.stringify(baseline),
      'keyboard drag preview',
    )
    await page.keyboard.press('Escape')
    await until(
      async () =>
        JSON.stringify(
          await rows.evaluateAll((n) => n.map((r) => r.dataset.shot)),
        ) === JSON.stringify(baseline),
      'Escape restores visual order',
    )
    await page.locator('[data-settling]').waitFor({ state: 'hidden' })
    await handle.press('Space')
    await page.keyboard.press('ArrowDown')
    await until(
      async () =>
        JSON.stringify(
          await rows.evaluateAll((n) => n.map((r) => r.dataset.shot)),
        ) !== JSON.stringify(baseline),
      'second keyboard drag preview',
    )
    await page.keyboard.press('Space')
    await until(
      async () =>
        await page
          .getByRole('button', { name: 'Undo', exact: true })
          .isEnabled(),
      'keyboard reorder committed',
    )
    await ready(page)
    assert.notDeepEqual(
      await rows.evaluateAll((n) => n.map((r) => r.dataset.shot)),
      baseline,
    )
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await ready(page)
    await page.getByRole('searchbox', { name: 'Search shots' }).fill('Anakin')
    assert.equal(await page.locator('.pd-row-grip:not([disabled])').count(), 0)
    await page.getByRole('searchbox', { name: 'Search shots' }).fill('')
    pass('Keyboard drag, Escape cancellation and filtered-view safety')
    await first.getByRole('checkbox').check()
    await rows.nth(1).getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Assign day', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Shooting days' })
    await dialog
      .getByRole('textbox', { name: 'New shoot date', exact: true })
      .fill('2027-05-31')
    await dialog
      .getByRole('textbox', { name: 'New shoot date', exact: true })
      .press('Tab')
    await dialog.getByRole('textbox', { name: 'New day label' }).fill('Day 1')
    await dialog.getByRole('button', { name: 'Add day', exact: true }).click()
    await dialog
      .getByRole('button', { name: 'Assign 2 shots', exact: true })
      .click()
    await shot(page, '10-day-assignment')
    await dialog
      .getByRole('button', { name: /^Close/ })
      .first()
      .click()
    await page.getByRole('button', { name: 'All Shots', exact: true }).click()
    await page
      .getByRole('menuitemradio', { name: 'Shooting Order', exact: true })
      .click()
    await page.locator('[data-assignment]').first().waitFor()
    assert.equal(await page.locator('[data-assignment]').count(), 2)
    await shot(page, '11-shooting-order')
    await ready(page)
    pass(
      'Date-only day creation, bulk assignments and independent Shooting Order',
    )
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    await shot(page, '12-pdf-config')
    assert.equal(
      await page
        .getByRole('button', { name: 'Print layout', exact: true })
        .innerText(),
      'Table Print',
    )
    await page
      .getByRole('button', { name: 'Generate PDF', exact: true })
      .click()
    await page.waitForFunction(
      () => {
        const canvas = document.querySelector('.pd-pdf-pages canvas')
        return canvas?.dataset.rendered === 'true'
      },
      { timeout: 60000 },
    )
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('link', { name: 'Download PDF', exact: true }).click()
    const download = await downloadPromise
    await download.saveAs(path.join(out, 'browser-day-table-print.pdf'))
    await shot(page, '13-pdf-preview')
    await page
      .getByRole('dialog', { name: 'Download shot list' })
      .getByRole('button', { name: /^Close/ })
      .first()
      .click()
    pass(
      'Selected-day Table Print, actual PDF canvas preview and immutable browser download',
    )
    await page.getByRole('button', { name: 'Import', exact: true }).click()
    await page
      .getByLabel('Upload shot-list workbook')
      .setInputFiles({
        name: 'Google Sheets.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(
          'Scene,Shot,Camera,Framing,Coverage,Script Time (seconds)\r\n22,22-A,CAM A,Wide,"A quoted, description",8\r\n22,22-B,CAM B,CU,Second shot,3',
        ),
      })
    await shot(page, '14-import-upload')
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await shot(page, '15-import-map')
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await shot(page, '16-import-review')
    await page.getByRole('button', { name: 'Continue', exact: true }).click()
    await page
      .getByRole('button', { name: 'Import selected', exact: true })
      .click()
    await page
      .getByRole('dialog', { name: 'Import Shot List' })
      .waitFor({ state: 'hidden' })
    await ready(page)
    assert.equal(
      Object.values((await api('/' + list.id + '/export')).shots).filter(
        (s) => !s.deleted,
      ).length,
      10,
    )
    pass('Four-stage CSV import through real UI and collaborative persistence')
    assert.deepEqual(errors, [])
    fs.writeFileSync(
      path.join(out, 'browser.json'),
      JSON.stringify({ pass: true, checks, errors, listId: list.id }, null, 2),
    )
    console.log('M03.2 browser workflow passed')
  } finally {
    await browser.close()
  }
})().catch((e) => {
  fs.writeFileSync(path.join(out, 'browser-failure.txt'), e.stack || String(e))
  console.error(e)
  process.exitCode = 1
})
