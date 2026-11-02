const fs = require('fs'),
  assert = require('assert/strict'),
  pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  fixture = JSON.parse(fs.readFileSync('/tmp/m05/fixture.json'))
;(async () => {
  const browser = await pw.chromium.launch(),
    ctx = await browser.newContext({
      viewport: { width: 1640, height: 1050 },
      permissions: ['clipboard-read', 'clipboard-write'],
    }),
    p = await ctx.newPage(),
    out = '/tmp/m05/screenshots/chromium/'
  await ctx.addInitScript(
    (t) => localStorage.setItem('token', t),
    state.tokens['101'],
  )
  p.setDefaultTimeout(20000)
  const snap = async (name) => {
    await p.waitForTimeout(230)
    await p.screenshot({ path: out + name + '.png' })
  }
  try {
    await p.goto('http://127.0.0.1:5176/productiondesk/#/flows/' + fixture.id)
    await p.getByText('Saved', { exact: true }).waitFor()
    await p.getByRole('button', { name: 'Create', exact: true }).first().click()
    await p
      .getByRole('menuitem', { name: 'New Flow of the Day', exact: true })
      .waitFor()
    await snap('23-global-create')
    await p.keyboard.press('Escape')
    await p.locator('.flow-grid tbody tr').first().getByRole('checkbox').check()
    await p.getByRole('button', { name: 'Copy selected', exact: true }).click()
    await p.locator('.flow-selection .flow-copy-success').waitFor()
    await snap('24-selected-copy-success')
    await p
      .getByRole('button', { name: 'Delete selected', exact: true })
      .click()
    await snap('25-delete-confirmation')
    await p.getByRole('button', { name: 'Cancel', exact: true }).click()
    await p
      .getByRole('button', { name: 'Clear selection', exact: true })
      .click()
    await p
      .getByRole('button', { name: 'Actions for event 1', exact: true })
      .click()
    await p
      .getByRole('menuitem', { name: 'Notes and details', exact: true })
      .click()
    await snap('26-event-details')
    await p.getByRole('button', { name: 'Comments', exact: true }).click()
    await p
      .getByRole('textbox', { name: 'Add comment', exact: true })
      .fill('Local M05 secondary-interface check')
    await p.getByRole('button', { name: 'Post comment', exact: true }).click()
    await p.getByRole('button', { name: 'Reply', exact: true }).last().click()
    await p
      .getByRole('textbox', { name: 'Reply', exact: true })
      .fill('A reply remains attached to this event.')
    await snap('27-comment-reply')
    await p.getByRole('button', { name: 'Send reply', exact: true }).click()
    await p.getByRole('button', { name: 'Resolve', exact: true }).last().click()
    await p.getByRole('button', { name: 'View resolved', exact: true }).click()
    await snap('28-resolved-discussion')
    await p
      .getByRole('button', {
        name: /^Close (Choreo Practice|19-|Production event)/,
      })
      .first()
      .click()
    await p.getByRole('button', { name: 'Layout', exact: true }).click()
    await p
      .getByRole('menuitem', { name: 'Departments and layout', exact: true })
      .click()
    await p
      .getByRole('checkbox', { name: 'Show Camera + G&E', exact: true })
      .uncheck()
    await snap('29-personal-department-scope')
    await p
      .getByRole('button', {
        name: 'Close Departments and layout',
        exact: true,
      })
      .click()
    await snap('30-hidden-department-grid')
    await p.locator('.flow-grid tbody tr').first().locator('.flow-time').click()
    await p.getByLabel(/Planned start/).fill('2026-03-08 02:30')
    await p.getByRole('button', { name: 'Apply timing', exact: true }).click()
    await p.getByText(/does not exist because/).waitFor()
    await snap('31-dst-gap-validation')
    await p.getByLabel(/Planned start/).fill('2026-11-01 01:30')
    await p.getByRole('button', { name: 'Apply timing', exact: true }).click()
    await p.getByRole('radio').first().waitFor()
    await snap('32-dst-fold-choice')
    await p
      .getByRole('button', { name: 'Close Event timing', exact: true })
      .click()
    await p.getByRole('button', { name: 'Print Studio', exact: true }).click()
    await p.locator('canvas[data-rendered=true]').waitFor({ timeout: 45000 })
    await p
      .getByRole('dialog', { name: 'Print Studio' })
      .locator('aside>label')
      .first()
      .getByRole('button')
      .click()
    await p
      .getByRole('menuitemradio', { name: 'Department Focus', exact: true })
      .click()
    await p.locator('canvas[data-rendered=true]').waitFor({ timeout: 45000 })
    await snap('33-department-focus-print')
    await p
      .getByRole('dialog', { name: 'Print Studio' })
      .locator('aside>label')
      .first()
      .getByRole('button')
      .click()
    await p
      .getByRole('menuitemradio', { name: 'Daily Rundown', exact: true })
      .click()
    await p.locator('canvas[data-rendered=true]').waitFor({ timeout: 45000 })
    await snap('34-daily-rundown-print')
    await p
      .getByRole('dialog', { name: 'Print Studio' })
      .locator('aside>label')
      .first()
      .getByRole('button')
      .click()
    await p
      .getByRole('menuitemradio', {
        name: 'Master Departmental Flow',
        exact: true,
      })
      .click()
    for (const checkbox of await p
      .getByRole('dialog', { name: 'Print Studio' })
      .locator('fieldset')
      .first()
      .getByRole('checkbox')
      .all())
      await checkbox.uncheck()
    await p
      .getByText('Choose at least one department.', { exact: true })
      .waitFor({ timeout: 45000 })
    await snap('35-print-recovery')
    await p
      .getByRole('button', { name: 'Close Print Studio', exact: true })
      .click()
    await p.goto('http://127.0.0.1:5176/productiondesk/#/flows')
    await p.getByRole('table', { name: 'Production flows' }).waitFor()
    await p
      .getByRole('button', { name: 'Production date', exact: true })
      .click()
    await snap('36-index-sort')
    await p.keyboard.press('Escape')
    await p
      .locator('.pd-documents tbody tr')
      .first()
      .getByRole('button')
      .click()
    await p.getByRole('menuitem', { name: 'Rename', exact: true }).click()
    await snap('37-rename')
    await p
      .getByRole('button', { name: 'Close Rename Flow', exact: true })
      .click()
    assert(p.url().endsWith('/flows'), 'Document actions never navigate rows')
    console.log(
      'Additional actual Create, copy feedback, delete confirmation, details/replies/resolution, personal department hiding, DST validation, print products/error recovery and index-action surfaces verified and captured.',
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
