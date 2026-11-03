const fs = require('fs'),
  assert = require('assert/strict'),
  crypto = require('crypto'),
  pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  base = 'http://127.0.0.1:4314/api/flows',
  headers = {
    Authorization: 'Bearer ' + auth.tokens['101'],
    'Content-Type': 'application/json',
  },
  workbook =
    '/Users/thameralanezi/Downloads/Flow-Of-The-Day September 25th [Vader _ Whiteout] Fall 2026.xlsx',
  out = '/tmp/m05/corrections'
async function api(p, b) {
  const r = await fetch(base + p, {
    method: b ? 'POST' : 'GET',
    headers,
    body: b && JSON.stringify(b),
  })
  assert(r.ok, await r.clone().text())
  return r.json()
}
;(async () => {
  const browser = await pw.chromium.launch(),
    ctx = await browser.newContext({
      viewport: { width: 1640, height: 1050 },
    })
  await ctx.addInitScript(
    (t) => localStorage.setItem('token', t),
    auth.tokens['101'],
  )
  const p = await ctx.newPage()
  p.setDefaultTimeout(20000)
  try {
    await p.goto('http://127.0.0.1:5176/productiondesk/#/flows/new')
    await p.getByRole('button', { name: /Import Excel/ }).click()
    await p
      .getByLabel('Title', { exact: true })
      .fill('Original September 25 import correction')
    await p.getByLabel('Shoot date', { exact: true }).fill('2026-09-25')
    await p.getByRole('heading', { name: 'New Flow of the Day' }).click()
    await p
      .getByRole('button', { name: 'Create Flow', exact: true })
      .click()
    await p.getByRole('dialog', { name: 'Import Flow workbook' }).waitFor()
    const id = p.url().split('/flows/')[1].split('?')[0]
    assert.equal(
      Object.keys((await api('/' + id + '/snapshot')).state.departments)
        .length,
      0,
    )
    await p.locator('input[type=file]').setInputFiles(workbook)
    await p.locator('.flow-import-layout').waitFor()
    const dialog = p.getByRole('dialog', { name: 'Import Flow workbook' })
    assert(
      await p
        .getByRole('button', { name: 'Import 62 events', exact: true })
        .isDisabled(),
    )
    async function select(label, option) {
      await dialog
        .locator('aside>label')
        .filter({ hasText: new RegExp('^' + label) })
        .getByRole('button')
        .click()
      await p
        .getByRole('menuitemradio', { name: option, exact: true })
        .click()
    }
    await select('Planned time', 'A · Unlabeled')
    await select('Secondary time', 'B · Unlabeled')
    await select('Secondary meaning', 'Actual start')
    await select('Planned clock', '12-hour sequence · advance at rollover')
    await select('Secondary clock', '1–6 interpreted as afternoon')
    await dialog.locator('input[type=checkbox]').check()
    await p.screenshot({ path: out + '/import-review.png' })
    await p
      .getByRole('button', { name: 'Import 62 events', exact: true })
      .click()
    await p.waitForFunction(
      () => document.querySelectorAll('.flow-grid tbody tr').length === 62,
    )
    await p.getByText('Saved', { exact: true }).waitFor()
    await p.reload()
    await p.waitForFunction(
      () => document.querySelectorAll('.flow-grid tbody tr').length === 62,
    )
    let snap = await api('/' + id + '/snapshot')
    assert.equal(Object.keys(snap.state.departments).length, 9)
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
    const hash = Object.values(snap.state.imports)[0].sha256,
      r = await fetch(base + '/' + id + '/sources/' + hash, { headers })
    assert.deepEqual(
      Buffer.from(await r.arrayBuffer()),
      fs.readFileSync(workbook),
    )
    assert(
      Object.values(snap.state.events).every(
        (e) => e.clockStart == null || Number.isFinite(e.clockStart),
      ),
    )
    await p.screenshot({ path: out + '/imported-grid.png' })
    await ctx.setOffline(true)
    await p.getByText('Reconnecting', { exact: true }).waitFor()
    const cell = p
      .locator('.flow-grid tbody tr')
      .first()
      .locator('.flow-action-cell')
    await cell.locator('.pd-text-preview').click()
    await cell
      .locator('.cm-content')
      .fill('Local offline import correction')
    await cell.locator('.cm-content').press('Escape')
    await ctx.setOffline(false)
    await p.getByText('Saved', { exact: true }).waitFor({ timeout: 35000 })
    await p.reload()
    await p
      .getByText('Local offline import correction', { exact: true })
      .waitFor()
    fs.writeFileSync(out + '/import.json', JSON.stringify({ id }))
    console.log(
      'Actual import route: explicit ambiguous clock mapping, 62 events, 52 instructions, exactly nine original department headings/personnel, byte-identical private workbook, reload and offline/reconnect persistence passed.',
    )
  } catch (e) {
    await p.screenshot({ path: out + '/import-failure.png' })
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
