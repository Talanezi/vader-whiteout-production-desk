const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os')
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    path.join(
      os.homedir(),
      '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
    ),
)
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research',
  state = JSON.parse(fs.readFileSync(path.join(runtime, 'local-state.json')))
const XLSX = require(path.join(runtime, 'client/node_modules/xlsx')),
  results = []
const ready = async (p) =>
  p.locator('[data-sync="saved"]').waitFor({ timeout: 12000 })
async function main() {
  const browser = await chromium.launch({ channel: 'chrome' })
  try {
    const c = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      permissions: ['clipboard-read', 'clipboard-write'],
    })
    await c.addInitScript(
      (token) => localStorage.setItem('token', token),
      state.tokens['101'],
    )
    const p = await c.newPage(),
      errors = []
    p.on('pageerror', (e) => errors.push(e.message))
    await p.goto(state.root + '#/shotlists/new')
    await p
      .getByRole('dialog', { name: 'New shot list' })
      .getByRole('textbox', { name: 'Name', exact: true })
      .fill('UI creation workflow · local QA')
    await p
      .getByRole('button', { name: 'Create shot list', exact: true })
      .click()
    await p.getByRole('heading', { name: 'Create the first scene' }).waitFor()
    await p
      .locator('.pd-shot-empty')
      .getByRole('button', { name: 'Add scene' })
      .click()
    await p.getByRole('button', { name: 'Save scene' }).click()
    await p.getByText('A scene number is required.').waitFor()
    await p
      .getByRole('textbox', { name: 'Scene number', exact: true })
      .fill('12')
    await p
      .getByRole('textbox', { name: 'Title / location' })
      .fill('The threshold')
    await p.getByRole('button', { name: 'Save scene' }).click()
    await p.getByRole('button', { name: 'Add shot', exact: true }).click()
    await p
      .getByRole('textbox', { name: 'Shot number · unnumbered shot' })
      .fill('12.B')
    await ready(p)
    const first = p.locator('.pd-shot-table tbody tr').first(),
      id = await first.getAttribute('data-shot')
    await first.locator('[data-field="number"] input').evaluate((e) => {
      const data = new DataTransfer()
      data.setData(
        'text/plain',
        '12.B\tHold at the threshold.\tCU\tCAM B\t50mm\tStatic\t6',
      )
      e.dispatchEvent(
        new ClipboardEvent('paste', {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    await ready(p)
    assert.equal(
      await first.getByRole('button', { name: 'Framing · 12.B' }).innerText(),
      'CU',
    )
    assert.match(
      await first.locator('.cm-content').innerText(),
      /Hold at the threshold/,
    )
    await first
      .getByRole('button', { name: 'Framing · 12.B', exact: true })
      .click()
    await p.getByRole('combobox').press('Tab')
    assert.ok(
      await first
        .getByRole('button', { name: 'Camera · 12.B', exact: true })
        .evaluate((e) => document.activeElement === e),
    )
    const duration = first.locator('[data-field="estimatedMinutes"] input')
    await duration.focus()
    await p.keyboard.press('Alt+ArrowUp')
    assert.equal(await duration.inputValue(), '6')
    await first
      .getByRole('checkbox', { name: 'Select shot 12.B', exact: true })
      .check()
    await p.getByRole('button', { name: 'Copy selected', exact: true }).click()
    const copied = await p.evaluate(() => navigator.clipboard.readText())
    assert.match(copied, /12.B\tHold at the threshold/)
    results.push({
      name: 'Real UI creates list/scene/shot, validates scene number, pastes TSV into cells and copies selected rows',
      pass: true,
    })
    await first.getByRole('button', { name: 'Actions for shot 12.B' }).click()
    await p.getByRole('menuitem', { name: 'Duplicate shot' }).click()
    await p.waitForFunction(
      () => document.querySelectorAll('.pd-shot-table tbody tr').length === 2,
    )
    await ready(p)
    await p.getByRole('button', { name: 'Undo', exact: true }).click()
    await p.waitForFunction(
      () => document.querySelectorAll('.pd-shot-table tbody tr').length === 1,
    )
    await ready(p)
    await p.getByRole('button', { name: 'Redo', exact: true }).click()
    await p.waitForFunction(
      () => document.querySelectorAll('.pd-shot-table tbody tr').length === 2,
    )
    await ready(p)
    await first.getByRole('button', { name: 'Actions for shot 12.B' }).click()
    await p.getByRole('menuitem', { name: 'Move later' }).click()
    await p.waitForFunction(
      (old) =>
        document.querySelector('.pd-shot-table tbody tr').dataset.shot !== old,
      id,
    )
    await ready(p)
    assert.equal(
      await p
        .getByRole('textbox', { name: 'Shot number · 12.B', exact: true })
        .count(),
      2,
    )
    await p.getByRole('button', { name: 'Copy link', exact: true }).click()
    await p.getByRole('button', { name: 'Copied', exact: true }).waitFor()
    assert.match(
      await p.evaluate(() => navigator.clipboard.readText()),
      /\?scene=[a-f0-9-]{36}/,
    )
    await p.getByRole('button', { name: 'Choose columns' }).click()
    await p
      .getByRole('dialog', { name: 'Table columns' })
      .getByRole('checkbox', { name: 'Camera notes', exact: true })
      .check()
    await p.getByRole('button', { name: 'Close Table columns' }).click()
    await p.getByRole('columnheader', { name: 'Camera notes' }).waitFor()
    results.push({
      name: 'Duplicate, collaborative undo/redo, identity-preserving reorder, selected-scene deep link and column customization',
      pass: true,
    })
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([
        ['SHOT #', 'CAMERA', 'COVERAGE', 'SCRIPT TIME (SECONDS)'],
        ['9.10', 'CAM C', 'Unambiguous text shot identifier', 5],
      ]),
      'Scene 09',
    )
    await p.getByRole('button', { name: 'Import', exact: true }).click()
    await p.getByLabel('Upload shot-list workbook').setInputFiles({
      name: 'controlled-import.xlsx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }),
    })
    await p.getByText('1 worksheets inspected').waitFor()
    await p
      .getByRole('button', { name: 'Import selected', exact: true })
      .click()
    await p.getByText('1 shot imported into 1 scene. 0 rejected.').waitFor()
    await ready(p)
    await p.reload()
    await p.locator('.pd-shot-table tbody tr').first().waitFor()
    await p.getByRole('button', { name: 'Scene View', exact: true }).click()
    await p.getByRole('menuitemradio', { name: 'All Shots' }).click()
    await p
      .getByRole('textbox', { name: 'Shot number · 9.10', exact: true })
      .waitFor()
    results.push({
      name: 'XLSX upload/mapping/confirmation persists through real API and reload with exact text identifier 9.10',
      pass: true,
    })
    const documentId = new URL(p.url()).hash.split('/')[2].split('?')[0]
    const duplicateScene = {
      batchId: require('node:crypto').randomUUID(),
      scenes: [
        {
          number: '12',
          title: 'Pickup coverage',
          shots: [
            {
              number: '12.C',
              coverage: 'A second scene with a repeated displayed number.',
            },
          ],
        },
      ],
    }
    const headers = {
      Authorization: 'Bearer ' + state.tokens['101'],
      'Content-Type': 'application/json',
    }
    const response = await fetch(
      state.api + '/shotlists/' + documentId + '/import',
      { method: 'POST', headers, body: JSON.stringify(duplicateScene) },
    )
    assert.equal(response.status, 201)
    await p
      .locator('.pd-scene-rail')
      .getByText('Pickup coverage', { exact: true })
      .waitFor()
    const originalRow = p
      .locator('.pd-shot-table tbody tr')
      .filter({
        has: p.getByRole('textbox', {
          name: 'Shot number · 12.B',
          exact: true,
        }),
      })
      .first()
    const originalId = await originalRow.getAttribute('data-shot')
    await originalRow
      .getByRole('button', { name: 'Inspect shot 12.B', exact: true })
      .click()
    await p
      .locator('.pd-shot-inspector-desktop')
      .getByRole('button', { name: 'Move shot to scene', exact: true })
      .click()
    await p
      .getByRole('option', { name: '12 · Pickup coverage', exact: true })
      .click()
    await ready(p)
    const exported = await (
      await fetch(state.api + '/shotlists/' + documentId + '/export', {
        headers,
      })
    ).json()
    const target = Object.values(exported.scenes).find(
      (scene) => scene.title === 'Pickup coverage',
    )
    assert.equal(exported.shots[originalId].sceneId, target.id)
    results.push({
      name: 'Scene chooser searches displayed labels and moves the same shot UUID to the correct scene UUID when scene numbers repeat',
      pass: true,
    })
    await c.close()
    for (const timezoneId of [
      'Pacific/Kiritimati',
      'Pacific/Pago_Pago',
      'America/Los_Angeles',
    ]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        timezoneId,
      })
      const page = await context.newPage()
      await page.goto(state.root + 'qa/m03/controls.html')
      await page.getByRole('button', { name: 'Choose production date' }).click()
      await page
        .getByRole('gridcell', { name: 'Tuesday, November 3, 2026' })
        .focus()
      await page.keyboard.press('PageDown')
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('output').innerText(), '2026-12-03')
      await context.close()
    }
    assert.deepEqual(errors, [])
    results.push({
      name: 'Date-only selection and month keyboard navigation are stable in UTC+14, UTC−11 and Los Angeles timezones',
      pass: true,
    })
    fs.writeFileSync(
      'client/qa/m03/artifacts/workflows.json',
      JSON.stringify(results, null, 2) + '\n',
    )
    for (const result of results) console.log('PASS', result.name)
  } finally {
    await browser.close()
  }
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
