const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto')
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
const headers = {
    Authorization: 'Bearer ' + state.tokens['101'],
    'Content-Type': 'application/json',
  },
  base = 'http://127.0.0.1:4314/api/flows'
async function req(p, b) {
  const r = await fetch(base + p, {
    method: b === undefined ? 'GET' : 'POST',
    headers,
    body: b === undefined ? undefined : JSON.stringify(b),
  })
  assert(r.ok, await r.clone().text())
  return r.json()
}
;(async () => {
  await fetch(
    'http://127.0.0.1:4314/api/shotlists/' + fixture.listId + '/manage',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'rename', name: 'M05 Fixture Source' }),
    },
  )
  const browser = await pw[kind].launch({ headless: true }),
    context = await browser.newContext({
      viewport: { width: 1640, height: 1050 },
    })
  await context.addInitScript(
    (t) => localStorage.setItem('token', t),
    state.tokens['101'],
  )
  const page = await context.newPage()
  page.setDefaultTimeout(20000)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  try {
    await page.goto('http://127.0.0.1:5176/productiondesk/#/flows/new')
    await page
      .getByRole('dialog', { name: 'New Flow of the Day', exact: true })
      .waitFor()
    await page.screenshot({ path: out + '/12-creation.png' })
    await page
      .getByLabel('Title', { exact: true })
      .fill('M05 ' + kind + ' creation ' + Date.now())
    await page.getByLabel('Production date', { exact: true }).fill('2026-09-25')
    await page
      .getByRole('button', { name: 'Choose Shot List and shots', exact: true })
      .click()
    await page
      .getByRole('dialog', { name: 'Link shots', exact: true })
      .waitFor()
    const listChooser = page
      .locator('.sb-shot-picker .sb-toolstrip button[aria-haspopup=menu]')
      .first() // select the exact disposable source from the existing picker
    await listChooser.click()
    await page
      .getByRole('menuitemradio', { name: 'M05 Fixture Source', exact: true })
      .last()
      .click()
    const pickerSearch = page
      .getByRole('dialog', { name: 'Link shots' })
      .getByRole('searchbox')
    await pickerSearch.fill('Production subject 1')
    await page
      .getByRole('dialog', { name: 'Link shots' })
      .getByRole('checkbox')
      .nth(1)
      .waitFor()
    await pickerSearch.fill('')
    const firstBox = page
      .getByRole('dialog', { name: 'Link shots' })
      .getByRole('checkbox')
      .nth(1)
    await firstBox.check()
    await page
      .getByRole('button', { name: 'Use selected shots', exact: true })
      .click()
    await page.getByRole('button', { name: 'Create Flow', exact: true }).click()
    await page
      .getByRole('table', { name: 'Department Flow', exact: true })
      .waitFor()
    const newId = page.url().split('/flows/')[1].split('?')[0]
    let snap = await req('/' + newId + '/snapshot')
    assert.equal(Object.keys(snap.state.events).length, 1)
    await page.getByRole('button', { name: 'Add event', exact: true }).click()
    await page
      .getByRole('menuitem', { name: 'Department activity', exact: true })
      .click()
    await page.getByRole('button', { name: /^Close Production event$/ }).click()
    await page
      .getByRole('button', { name: 'Close Shot Rail', exact: true })
      .click()
    const firstAction = page
      .locator('.flow-grid tbody tr')
      .first()
      .locator('.flow-action-cell')
    await firstAction.locator('.pd-text-preview').click()
    await firstAction.locator('.cm-content').fill('Direct action edit ' + kind)
    await firstAction.locator('.cm-content').press('Tab')
    await page.waitForTimeout(200)
    await page.getByText('Saved', { exact: true }).waitFor()
    snap = await req('/' + newId + '/snapshot')
    assert(
      Object.values(snap.state.events).some(
        (e) => e.description === 'Direct action edit ' + kind,
      ),
    )
    const rows = page.locator('.flow-grid tbody tr')
    const tsv = 'Coverage one\tCamera one\nCoverage two\tCamera two'
    await rows.first().locator('.flow-action-cell').focus()
    await rows
      .first()
      .locator('.flow-action-cell')
      .dispatchEvent('paste', { clipboardData: { getData: () => tsv } })
      .catch(() => {}) // real clipboard payload dispatched below using DataTransfer
    await rows
      .first()
      .locator('.flow-action-cell')
      .evaluate((el, value) => {
        const data = new DataTransfer()
        data.setData('text/plain', value)
        el.dispatchEvent(
          new ClipboardEvent('paste', {
            clipboardData: data,
            bubbles: true,
            cancelable: true,
          }),
        )
      }, tsv)
    await page.getByText('Coverage one', { exact: true }).waitFor()
    await page
      .getByRole('checkbox', { name: 'Select all events', exact: true })
      .check()
    await page
      .getByRole('button', { name: 'Delete selected', exact: true })
      .click()
    await page.getByRole('button', { name: 'Cancel', exact: true }).click()
    assert.equal(await rows.count(), 2)
    await page
      .getByRole('button', { name: 'Delete selected', exact: true })
      .click()
    await page
      .getByRole('dialog')
      .last()
      .getByRole('button', { name: 'Delete selected', exact: true })
      .click()
    assert.equal(await rows.count(), 0)
    await page.getByRole('button', { name: 'Restore', exact: true }).click()
    await page.waitForFunction(
      () => document.querySelectorAll('.flow-grid tbody tr').length === 2,
    )
    await page.screenshot({ path: out + '/13-grid-edit-restore.png' })
    // A real XLSX review/confirmation, preserving the private original and mapping ambiguity.
    const imported = await req('', {
      id: crypto.randomUUID(),
      name: 'M05 ' + kind + ' workbook review',
      date: '2026-09-25',
      zone: 'America/Los_Angeles',
    })
    await page.goto(
      'http://127.0.0.1:5176/productiondesk/#/flows/' +
        imported.id +
        '?import=1',
    )
    await page
      .locator('input[type=file]')
      .setInputFiles(
        '/Users/thameralanezi/Downloads/Flow-Of-The-Day September 25th [Vader _ Whiteout] Fall 2026.xlsx',
      )
    await page.locator('.flow-import-layout').waitFor()
    const dialog = page.getByRole('dialog', {
      name: 'Import Flow workbook',
      exact: true,
    })
    await dialog
      .getByText('The source time columns are unlabeled.', { exact: false })
      .waitFor()
    await page.screenshot({ path: out + '/14-import-ambiguity.png' })
    const select = async (label, option) => {
      await dialog
        .locator('aside>label')
        .filter({ hasText: new RegExp('^' + label) })
        .getByRole('button')
        .click()
      await page
        .getByRole('menuitemradio', { name: option, exact: true })
        .click()
    }
    await select('Planned time', 'A · Unlabeled')
    await select('Secondary time', 'B · Unlabeled')
    await select('Secondary meaning', 'Actual start')
    await select('Planned clock', '12-hour sequence · advance at rollover')
    await select('Secondary clock', '1–6 interpreted as afternoon')
    await dialog.locator('input[type=checkbox]').check()
    await page.screenshot({ path: out + '/15-import-review.png' })
    await page
      .getByRole('button', { name: 'Import 62 events', exact: true })
      .click()
    await page
      .getByRole('table', { name: 'Department Flow', exact: true })
      .waitFor()
    await page.waitForFunction(
      () => document.querySelectorAll('.flow-grid tbody tr').length === 62,
    )
    await page.getByText('Saved', { exact: true }).waitFor()
    await page.reload()
    await page.waitForFunction(
      () => document.querySelectorAll('.flow-grid tbody tr').length === 62,
    )
    snap = await req('/' + imported.id + '/snapshot')
    assert.equal(Object.keys(snap.state.imports).length, 1)
    assert.equal(
      Object.values(snap.state.instructions).filter((i) => i.text).length,
      52,
    )
    assert.equal(
      Object.values(snap.state.departments).find(
        (d) => d.name === 'Camera + G&E',
      ).personnel,
      'Tobin C., Lucas R.',
    )
    await page.screenshot({ path: out + '/16-imported-day.png' })
    // Offline local edit: honest reconnection state, persisted on return.
    await context.setOffline(true)
    await page.getByText('Reconnecting', { exact: true }).waitFor()
    const action = page
      .locator('.flow-grid tbody tr')
      .first()
      .locator('.flow-action-cell')
    await action.locator('.pd-text-preview').click()
    await action.locator('.cm-content').fill('Offline correction ' + kind)
    await action.locator('.cm-content').press('Escape')
    await page.screenshot({ path: out + '/17-offline.png' })
    await context.setOffline(false)
    await page.getByText('Saved', { exact: true }).waitFor()
    snap = await req('/' + imported.id + '/snapshot')
    assert(
      Object.values(snap.state.events).some(
        (e) => e.description === 'Offline correction ' + kind,
      ),
    )
    assert.deepEqual(errors, [])
    console.log(
      kind +
        ' real creation, direct collaborative edit, TSV paste, cancel/delete/restore, original XLSX ambiguity/mapping/review/import/reload/personnel, offline edit/reconnect passed.',
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
