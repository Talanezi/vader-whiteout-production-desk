const { state, out, create, api } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  path = require('path'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const list = await create(
      'CSV import review ' + crypto.randomUUID().slice(0, 6),
    ),
    b = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
    await c.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens[101],
    )
    const p = await c.newPage()
    p.setDefaultTimeout(20000)
    await p.goto(state.root + '#/shotlists/' + list.id)
    await p.locator('[data-sync="saved"]').waitFor()
    await p
      .getByRole('button', { name: 'Workspace actions', exact: true })
      .click()
    await p.getByRole('menuitem', { name: 'Import', exact: true }).click()
    await p.getByLabel('Upload shot-list workbook').setInputFiles({
      name: 'Scene05.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'Scene,Shot,Camera,Coverage,Lens,Movement,Estimated Minutes\n05,05-A,CAM A,Tracking through the trees,35mm,Dolly,4\n05,05-B,CAM B,Reverse angle,50mm,Static,6',
      ),
    })
    await p.getByRole('button', { name: 'Continue', exact: true }).click()
    await p.getByRole('button', { name: 'Continue', exact: true }).click()
    const include = p.getByRole('checkbox', { name: /^Include row / })
    await include.first().uncheck()
    assert.equal(await include.first().isChecked(), false)
    await include.first().check()
    const review = p.getByRole('checkbox', {
      name: 'Reviewed final identifier and mapping',
      exact: true,
    })
    while (await review.count()) await review.first().check()
    await p.screenshot({
      path: path.join(out, 'completion-import-review.png'),
    })
    await p.getByRole('button', { name: 'Continue', exact: true }).click()
    await p
      .getByRole('button', { name: 'Import selected', exact: true })
      .click()
    await p
      .getByRole('dialog', { name: 'Import Shot List', exact: true })
      .waitFor({ state: 'hidden' })
    await p.locator('[data-sync="saved"]').waitFor()
    const data = await api('/' + list.id + '/export')
    assert.equal(Object.values(data.shots).filter((s) => !s.deleted).length, 10)
    assert.ok(
      Object.values(data.shots).some(
        (s) => s.number === '05-A' && s.lens === '35mm',
      ),
    )
    console.log(
      'PASS actual CSV mapping/review custom checkboxes, explicit review and once-only import into existing local document',
    )
  } finally {
    await b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
