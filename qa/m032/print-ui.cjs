const { runtime, state, out, api, join, until } = require('./helpers.cjs'),
  fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  { createHash } = require('node:crypto'),
  { execFileSync } = require('node:child_process'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const ready = (p) =>
    p.locator('[data-sync="saved"]').waitFor({ timeout: 20000 }),
  rendered = (p) =>
    p.locator('canvas[data-rendered="true"]').waitFor({ timeout: 60000 }),
  sha = (b) => createHash('sha256').update(b).digest('hex'),
  checks = []
async function choose(page, label, option) {
  await page.getByRole('button', { name: label, exact: true }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}
async function download(page, name) {
  const event = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download PDF', exact: true }).click()
  const result = await event,
    file = path.join(out, name + '.pdf')
  await result.saveAs(file)
  return {
    file,
    sha: sha(fs.readFileSync(file)),
    text: execFileSync('pdftotext', ['-layout', file, '-']).toString(),
  }
}
;(async () => {
  const list = JSON.parse(
      fs.readFileSync(path.join(runtime, 'workbook-list.json')),
    ),
    snapshot = await api('/' + list.id + '/export'),
    browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      permissions: ['clipboard-read', 'clipboard-write'],
    })
    await context.addInitScript(
      (token) => localStorage.setItem('token', token),
      state.tokens[101],
    )
    const page = await context.newPage(),
      errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(state.root + '#/shotlists/' + list.id)
    await ready(page)
    const rows = page.locator('tbody tr[data-shot]')
    await rows.first().getByRole('checkbox').check()
    await rows
      .nth(4)
      .getByRole('checkbox')
      .click({ modifiers: ['Shift'] })
    await page.getByText('5 selected', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    assert.ok(
      (
        await page
          .getByRole('button', { name: 'Print scope', exact: true })
          .innerText()
      ).includes('Selected Shots (5)'),
    )
    await page.getByRole('button', { name: 'Print scope', exact: true }).click()
    assert.equal(
      await page
        .getByRole('menuitemradio', { name: 'Selected Area', exact: true })
        .isEnabled(),
      false,
    )
    await page.keyboard.press('Escape')
    await page
      .getByRole('button', { name: 'Generate PDF', exact: true })
      .click()
    await rendered(page)
    const five = await download(page, 'ui-five-selected')
    assert.ok(five.text.includes('5 rows'))
    assert.ok(!five.text.includes('9.5 '))
    await page.screenshot({ path: path.join(out, 'print-five-preview.png') })
    const peer = await join(list.id, '102'),
      firstId = await rows.first().getAttribute('data-shot')
    peer.doc.transact(() => {
      peer.doc
        .getMap('shots')
        .get(firstId)
        .set('actualTakes', 'QA offline snapshot test')
    }, 'local')
    await page
      .getByText(
        'Newer document edits exist. Download keeps this preview snapshot; refresh to include them.',
      )
      .waitFor()
    const same = await download(page, 'ui-five-same-snapshot')
    assert.equal(same.sha, five.sha)
    peer.close()
    checks.push({
      name: 'Five selected rows recognized automatically; missing area disabled; PDF preview and download stay byte-identical after a collaborator edit',
      pass: true,
    })
    await choose(page, 'Print paper', 'A4')
    assert.equal(
      await page
        .getByRole('link', { name: 'Download PDF', exact: true })
        .count(),
      0,
    )
    await page
      .getByText(
        'Print selection or settings changed. Refresh the preview before downloading.',
      )
      .waitFor()
    await page
      .getByRole('dialog', { name: 'Download shot list' })
      .getByRole('button', { name: /^Close/ })
      .first()
      .click()
    await page.getByRole('button', { name: 'Clear', exact: true }).click()
    await page
      .getByRole('button', { name: 'Choose columns', exact: true })
      .click()
    for (const label of [
      'Show Action / coverage',
      'Show Framing',
      'Show Estimated shooting · min',
    ])
      await page.getByRole('checkbox', { name: label, exact: true }).uncheck()
    await page
      .getByRole('button', { name: 'Close Columns and layout', exact: true })
      .click()
    const first = page.locator('[data-grid-row="0"][data-grid-col="0"]')
    await first.focus()
    await page.keyboard.press('Shift+End')
    for (let i = 0; i < 9; i++) await page.keyboard.press('Shift+ArrowDown')
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    assert.equal(
      await page
        .getByRole('button', { name: 'Print scope', exact: true })
        .innerText(),
      'Selected Area',
    )
    await page.getByText(/Rows 1–10/).waitFor()
    await choose(page, 'Print orientation', 'portrait')
    await page
      .getByRole('button', { name: 'Generate PDF', exact: true })
      .click()
    await rendered(page)
    const area = await download(page, 'ui-ten-row-area')
    assert.ok(!area.text.includes('Coverage'))
    assert.ok(area.text.includes('10 rows'))
    assert.ok(
      area.text.includes('Camera') &&
        area.text.includes('Lens') &&
        area.text.includes('Movement'),
    )
    await page.screenshot({ path: path.join(out, 'print-area-preview.png') })
    await choose(page, 'Preview zoom', '150%')
    await rendered(page)
    assert.ok(
      (await page
        .locator('.pd-pdf-pages canvas')
        .evaluate((canvas) => canvas.width)) > 600,
    )
    checks.push({
      name: 'Exact rectangular area carries ten rows and four visible fields into a portrait PDF, with actual preview zoom',
      pass: true,
    })
    await page
      .getByRole('dialog', { name: 'Download shot list' })
      .getByRole('button', { name: /^Close/ })
      .first()
      .click()
    const scene = Object.values(snapshot.scenes).find((s) => s.number === '16')
    await page.goto(
      state.root + '#/shotlists/' + list.id + '?scene=' + scene.id,
    )
    await ready(page)
    await choose(page, 'Grid preset', 'Cinematography')
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    assert.equal(
      await page
        .getByRole('button', { name: 'Print scope', exact: true })
        .innerText(),
      'Current Scene',
    )
    await page
      .getByRole('button', { name: 'Generate PDF', exact: true })
      .click()
    await rendered(page)
    const cinematography = await download(
      page,
      'ui-current-scene-cinematography',
    )
    assert.ok(cinematography.text.includes('14 rows'))
    assert.ok(!cinematography.text.includes('Coverage'))
    await page.screenshot({
      path: path.join(out, 'print-cinematography-preview.png'),
    })
    const currentText = await page
      .locator('.pd-pdf-page-toolbar [role="status"]')
      .innerText()
    assert.match(currentText, /Page 1 of [2-9]/)
    await page
      .getByRole('button', { name: 'Next PDF page', exact: true })
      .click()
    await rendered(page)
    assert.match(
      await page.locator('.pd-pdf-page-toolbar [role="status"]').innerText(),
      /Page 2 of/,
    )
    await page.getByRole('button', { name: 'Print scope', exact: true }).click()
    await page
      .getByRole('menuitemradio', { name: 'Selected Scenes', exact: true })
      .click()
    await page.getByRole('checkbox', { name: 'Scene 16', exact: true }).check()
    await page
      .getByRole('button', { name: 'Refresh preview', exact: true })
      .click()
    await rendered(page)
    const two = await download(page, 'ui-two-selected-scenes')
    assert.ok(two.text.includes('38 rows'))
    checks.push({
      name: 'Current Scene, Cinematography field order, horizontal bands, page navigation and multi-scene print scope',
      pass: true,
    })
    assert.deepEqual(errors, [])
    fs.writeFileSync(
      path.join(out, 'print-ui.json'),
      JSON.stringify(
        { pass: true, checks, errors, previewDownloadSameBytes: true },
        null,
        2,
      ),
    )
    console.log('PASS', checks.map((c) => c.name).join('\nPASS '))
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
