const fs = require('fs'),
  assert = require('assert/strict'),
  kind = process.env.M05_BROWSER || 'chromium',
  pw = require(kind === 'webkit'
    ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
    : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  fixture = JSON.parse(
    fs.readFileSync('/tmp/m05/corrections/fixture.json'),
  ),
  out = '/tmp/m05/corrections/' + kind
fs.mkdirSync(out, { recursive: true })
;(async () => {
  const browser = await pw[kind].launch(),
    ctx = await browser.newContext({
      viewport: { width: 1640, height: 1050 },
      acceptDownloads: true,
    }),
    p = await ctx.newPage()
  await ctx.addInitScript(
    (t) => localStorage.setItem('token', t),
    auth.tokens['101'],
  )
  p.setDefaultTimeout(30000)
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  async function shot(n) {
    await p.screenshot({ path: out + '/' + n + '.png' })
  }
  try {
    await p.goto('http://127.0.0.1:5176/productiondesk/#/flows/new')
    await p
      .getByRole('textbox', { name: 'Title', exact: true })
      .fill('Corrective acceptance ' + kind)
    await p
      .getByRole('textbox', { name: 'Shoot date', exact: true })
      .fill('2026-11-12')
    await p.getByRole('heading', { name: 'New Flow of the Day' }).click()
    assert.equal(
      await p.getByText('Production timezone', { exact: true }).count(),
      0,
    )
    assert.equal(
      await p.getByRole('button', { name: 'Use previous day' }).count(),
      0,
    )
    await shot('01-creation')
    await p
      .getByRole('button', { name: 'Choose Shot List and shots' })
      .click()
    await p
      .getByRole('button', { name: 'Use selected shots', exact: true })
      .waitFor()
    await p.getByText('60 selected', { exact: false }).waitFor()
    await p
      .getByRole('button', { name: 'Use selected shots', exact: true })
      .click()
    await p
      .locator('.flow-draft-list li')
      .first()
      .getByRole('button', { name: /09-A/ })
      .last()
      .waitFor()
    assert.equal(await p.locator('.flow-draft-list li').count(), 60)
    await p.locator('.flow-draft-shot').first().click()
    await p.getByRole('heading', { name: '09-A', exact: true }).waitFor()
    await shot('02-shot-preview')
    await p
      .getByRole('button', { name: 'Close 09-A', exact: true })
      .click()
    assert.equal(
      await p
        .getByRole('textbox', { name: 'Title', exact: true })
        .inputValue(),
      'Corrective acceptance ' + kind,
    )
    assert.equal(await p.locator('.flow-draft-list li').count(), 60)
    await shot('03-selected-sequence')
    const grip = await p
        .locator('.flow-draft-list li')
        .first()
        .locator('.flow-grip')
        .boundingBox(),
      target = await p.locator('.flow-draft-list li').nth(2).boundingBox()
    await p.mouse.move(grip.x + 8, grip.y + 8)
    await p.mouse.down()
    await p.mouse.move(target.x + 40, target.y + target.height * 0.8, {
      steps: 18,
    })
    await p.waitForTimeout(170)
    await p.mouse.up()
    await p
      .getByRole('button', { name: 'Create Flow', exact: true })
      .click()
    await p
      .getByRole('table', { name: 'Department Flow', exact: true })
      .waitFor()
    await p.getByText('Saved', { exact: true }).waitFor()
    const flowId = p.url().split('/').pop()
    fs.writeFileSync(out + '/flow.json', JSON.stringify({ id: flowId }))
    await p
      .locator('.flow-grid tbody tr')
      .first()
      .locator('.flow-time')
      .click()
    await p
      .getByRole('textbox', { name: 'Start time', exact: true })
      .fill('9:00 AM')
    await p
      .getByRole('textbox', { name: 'Shooting duration', exact: true })
      .click()
    await p
      .getByRole('button', { name: 'Apply timing', exact: true })
      .click()
    await p.getByText('Saved', { exact: true }).waitFor()
    await p.waitForTimeout(250)
    const times = await p
      .locator('.flow-grid tbody tr')
      .locator('.flow-time')
      .allTextContents()
    assert(times[0].includes('9:00 AM'))
    assert(!times.slice(1, 5).some((t) => t.includes('TBD')))
    await shot('04-calculated-flow')
    await p
      .locator('.flow-grid tbody tr')
      .nth(1)
      .locator('.flow-time')
      .click()
    await p
      .getByRole('textbox', { name: 'Shooting duration', exact: true })
      .fill('10')
    await p
      .getByRole('button', { name: 'Apply timing', exact: true })
      .click()
    await p
      .getByRole('dialog')
      .waitFor({ state: 'hidden', timeout: 22000 })
    await p.getByText('Saved', { exact: true }).waitFor()
    await shot('05-shared-estimate')
    await p
      .getByRole('textbox', { name: 'Rename Talent', exact: true })
      .fill('Talent & Cast')
    await p
      .getByRole('heading', {
        name: 'Corrective acceptance ' + kind,
        exact: true,
      })
      .click()
    await p
      .getByRole('textbox', {
        name: 'Talent & Cast personnel',
        exact: true,
      })
      .fill('Production cast')
    const soundCell = p
      .locator('.flow-grid tbody tr')
      .first()
      .locator('td[data-department]')
      .nth(3)
    await soundCell.locator('.pd-text-preview').click()
    await soundCell
      .locator('.cm-content')
      .fill('Prepare sound ten minutes into the shot.')
    await p
      .getByRole('heading', {
        name: 'Corrective acceptance ' + kind,
        exact: true,
      })
      .click()
    await p
      .getByRole('button', {
        name: 'Timing for Sound in activity 1',
        exact: true,
      })
      .click()
    await p
      .getByRole('button', { name: 'With this activity', exact: true })
      .click()
    await p
      .getByRole('menuitemradio', {
        name: 'Relative to this activity',
        exact: true,
      })
      .click()
    await p
      .getByLabel('Minutes · negative for before', { exact: true })
      .fill('10')
    await p
      .getByLabel('Duration · optional minutes', { exact: true })
      .fill('5')
    await shot('06-relative-timing')
    await p
      .getByRole('button', { name: 'Apply timing', exact: true })
      .click()
    await p.getByRole('button', { name: 'Time Map', exact: true }).click()
    await p.locator('.flow-time-block').first().waitFor()
    await shot('07-time-map')
    const before = await p.locator('.flow-map-scroll').boundingBox()
    await p
      .getByRole('button', { name: 'Close Shot Rail', exact: true })
      .click()
    const after = await p.locator('.flow-map-scroll').boundingBox()
    assert(after.width > before.width + 200)
    await shot('08-map-full-width')
    await p
      .getByRole('button', { name: 'Department Flow', exact: true })
      .click()
    await p
      .getByRole('button', { name: 'Print Studio', exact: true })
      .click()
    await p
      .locator('canvas[data-rendered=true]')
      .first()
      .waitFor({ timeout: 45000 })
    assert((await p.locator('.flow-pdf-sheet').count()) > 1)
    assert.equal(
      await p
        .getByRole('button', { name: 'Print PDF', exact: true })
        .count(),
      0,
    )
    await shot('09-continuous-preview')
    await p.locator('.flow-pdf-sheet').last().scrollIntoViewIfNeeded()
    await p
      .locator('.flow-pdf-sheet')
      .last()
      .locator('canvas[data-rendered=true]')
      .waitFor({ timeout: 45000 })
    await shot('10-last-page')
    const download = Promise.all([
      p.waitForEvent('download'),
      p.getByRole('link', { name: 'Download PDF', exact: true }).click(),
    ])
    const [file] = await download
    await file.saveAs(out + '/master.pdf')
    await p
      .getByRole('button', {
        name: 'Download department pack',
        exact: true,
      })
      .click()
    await shot('11-department-pack')
    const pack = Promise.all([
      p.waitForEvent('download', { timeout: 90000 }),
      p.getByRole('button', { name: 'Download ZIP', exact: true }).click(),
    ])
    const [zip] = await pack
    await zip.saveAs(out + '/departments.zip')
    assert.equal(
      fs.readFileSync(out + '/departments.zip').readUInt32LE(0),
      0x04034b50,
    )
    assert.deepEqual(errors, [])
    console.log(
      kind +
        ' integrated creation/60 selected shots/draft preview/drag/automatic clock/shared source ACK/header edits/relative timing/Time Map width/continuous PDF/final page/PDF and ZIP download passed.',
    )
  } catch (e) {
    await shot('failure')
    console.error(await p.getByRole('alert').allTextContents())
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
