const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  pw = require(
    process.env.M04_BROWSER === 'webkit'
      ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  record = JSON.parse(fs.readFileSync('/tmp/m04/finishing-input-record.json')),
  headers = {
    Authorization: 'Bearer ' + state.tokens['101'],
    'Content-Type': 'application/json',
  }
;(async () => {
  const browser = await (
    process.env.M04_BROWSER === 'webkit' ? pw.webkit : pw.chromium
  ).launch({ headless: true })
  let page
  try {
    const copied = await (
        await fetch(
          `http://127.0.0.1:4314/api/storyboards/${record.id}/manage`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ action: 'duplicate' }),
          },
        )
      ).json(),
      id = copied.id,
      snapshot = async () =>
        await (
          await fetch(`http://127.0.0.1:4314/api/storyboards/${id}/snapshot`, {
            headers,
          })
        ).json()
    page = await browser.newPage({
      viewport: { width: 1600, height: 1100 },
      acceptDownloads: true,
    })
    page.setDefaultTimeout(15000)
    await page.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens['101'],
    )
    await page.goto(`http://127.0.0.1:5176/productiondesk/#/storyboards/${id}`)
    await page.locator('.sb-card-art').first().click()
    await page
      .getByRole('dialog', { name: 'Panel viewer', exact: true })
      .waitFor()
    assert.equal(
      await page
        .getByRole('button', { name: 'Artwork history', exact: true })
        .count(),
      0,
    )
    assert.equal(
      await page
        .getByRole('checkbox', { name: 'Show annotations', exact: true })
        .count(),
      0,
    )
    await page.getByRole('button', { name: 'Details', exact: true }).click()
    await page.getByLabel('Custom panel title').fill('Blocking sketch')
    await page
      .getByLabel('Original label', { exact: true })
      .fill('9.2 original')
    await page
      .getByRole('heading', { name: 'Blocking sketch', exact: true })
      .first()
      .waitFor()
    await page
      .getByRole('textbox', { name: 'Visual notes', exact: true })
      .fill('Keep the camera moving.')
    await page.screenshot({ path: '/tmp/m04/finishing-inspector-details.png' })
    await page.getByRole('tab', { name: 'Comments', exact: true }).click()
    await page
      .getByLabel('Add comment', { exact: true })
      .fill('Review the crossing.')
    await page
      .getByRole('button', { name: 'Post comment', exact: true })
      .click()
    await page.getByRole('button', { name: 'Reply', exact: true }).click()
    await page
      .getByRole('textbox', { name: 'Reply', exact: true })
      .fill('Move left.')
    await page.screenshot({ path: '/tmp/m04/finishing-comment-reply.png' })
    await page
      .getByRole('button', { name: 'Cancel reply', exact: true })
      .click()
    assert.equal(
      await page.getByRole('textbox', { name: 'Reply', exact: true }).count(),
      0,
    )
    await page.getByRole('button', { name: 'Reply', exact: true }).click()
    await page.getByRole('button', { name: 'Send reply', exact: true }).click()
    await page.getByText('Move left.', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Resolve', exact: true }).click()
    await page
      .getByRole('button', { name: 'View resolved', exact: true })
      .click()
    await page.getByRole('button', { name: 'Reopen', exact: true }).click()
    await page.screenshot({ path: '/tmp/m04/finishing-comments.png' })
    await page.getByRole('tab', { name: 'History', exact: true }).click()
    const before = await snapshot(),
      panelId = Object.keys(before.panels)[0],
      oldActive = before.panels[panelId].activeRevision,
      oldCount = Object.values(before.annotations).filter(
        (a) => a.revisionId === oldActive,
      ).length
    await page
      .getByRole('button', { name: 'Save version', exact: true })
      .click()
    await page.locator('.sb-history article').nth(1).waitFor()
    await page
      .getByRole('button', { name: 'Rectangle (R)', exact: true })
      .click()
    const art = await page.locator('.sb-studio-composition>rect').boundingBox()
    await page.mouse.move(art.x + art.width * 0.7, art.y + art.height * 0.15)
    await page.mouse.down()
    await page.mouse.move(art.x + art.width * 0.8, art.y + art.height * 0.25, {
      steps: 8,
    })
    await page.mouse.up()
    await page.getByRole('button', { name: /Saved version/ }).click()
    await page.getByText('Read-only preview', { exact: true }).waitFor()
    await page.screenshot({ path: '/tmp/m04/finishing-history-preview.png' })
    await page
      .getByRole('button', { name: 'Compare current', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Restore version', exact: true })
      .click()
    await page.waitForFunction(
      () => !document.querySelector('.sb-history-preview'),
    )
    await page
      .getByRole('button', { name: 'Drawing frame', exact: true })
      .click()
    await page
      .getByRole('menuitemradio', { name: 'Square · 1:1', exact: true })
      .click()
    await page.screenshot({ path: '/tmp/m04/finishing-frame-native.png' })
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page
      .getByRole('dialog', { name: 'Panel viewer', exact: true })
      .waitFor({ state: 'hidden' })
    await page.getByRole('status').filter({ hasText: 'Saved' }).waitFor()
    const after = await snapshot()
    assert.equal(after.panels[panelId].title, 'Blocking sketch')
    assert.equal(after.panels[panelId].label, '9.2 original')
    assert.notEqual(after.panels[panelId].activeRevision, oldActive)
    assert.ok(after.revisions[oldActive])
    assert.equal(
      Object.values(after.annotations).filter(
        (a) => a.revisionId === after.panels[panelId].activeRevision,
      ).length,
      oldCount,
    )
    assert.equal(
      Object.values(after.annotations).filter((a) => a.revisionId === oldActive)
        .length,
      oldCount + 1,
    )
    assert.equal(Object.values(after.comments).length, 2)
    assert.deepEqual(after.panels[panelId].links, before.panels[panelId].links)
    assert.equal(
      after.revisions[after.panels[panelId].activeRevision].frame.height,
      1000,
    )
    await page.reload()
    await page.getByText('Blocking sketch', { exact: true }).first().waitFor()
    await page.locator('.sb-card-art').first().click()
    await page.getByRole('button', { name: 'Details', exact: true }).click()
    await page.getByRole('tab', { name: 'Comments', exact: true }).click()
    await page.getByText('Move left.', { exact: true }).waitFor()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page
      .getByRole('dialog', { name: 'Panel viewer', exact: true })
      .waitFor({ state: 'hidden' })
    const response = page.waitForResponse(
      (r) => r.url().endsWith('/pdf') && r.request().method() === 'POST',
    )
    await page.getByRole('button', { name: 'Download', exact: true }).click()
    const pdf = await response
    assert.ok(pdf.ok())
    const expected = await pdf.body()
    await page
      .getByRole('button', { name: 'Download PDF', exact: true })
      .waitFor({ state: 'visible' })
    await page.waitForFunction(
      () =>
        !Array.from(document.querySelectorAll('button')).find(
          (b) => b.textContent.trim() === 'Download PDF',
        )?.disabled,
    )
    await page.screenshot({ path: '/tmp/m04/finishing-frame-pdf.png' })
    const dl = page.waitForEvent('download')
    await page
      .getByRole('button', { name: 'Download PDF', exact: true })
      .click()
    assert.deepEqual(fs.readFileSync(await (await dl).path()), expected)
    fs.writeFileSync('/tmp/m04/finishing-frame.pdf', expected)
    await page
      .getByRole('button', { name: 'Close Download storyboard', exact: true })
      .click()
    await page.getByRole('button', { name: 'Create', exact: true }).click()
    const action = page.getByRole('menuitem', {
      name: 'New Storyboard',
      exact: true,
    })
    await action.waitFor()
    await page.locator('.pd-create-panel').evaluate(async (n) => {
      await Promise.all(
        n
          .getAnimations({ subtree: true })
          .map((a) => a.finished.catch(() => {})),
      )
    })
    const b = await action.boundingBox(),
      parent = await page.locator('.pd-create-panel').boundingBox()
    assert.ok(b.y + b.height <= parent.y + parent.height + 1)
    await page.screenshot({ path: '/tmp/m04/finishing-create-three.png' })
    await action.click()
    let created = []
    for (let pass = 0; pass < 2; pass++) {
      const creation = page.getByRole('dialog', {
        name: 'New storyboard',
        exact: true,
      })
      await creation
        .getByRole('textbox', { name: 'Title', exact: true })
        .fill('Global creation ' + pass + ' ' + Date.now())
      await creation
        .getByRole('button', { name: 'Start drawing', exact: true })
        .click()
      await creation
        .getByRole('button', { name: 'Create storyboard', exact: true })
        .click()
      await page
        .getByRole('dialog', { name: 'Panel viewer', exact: true })
        .waitFor()
      created.push(page.url().split('/storyboards/')[1].split('?')[0])
      await page.getByRole('button', { name: 'Back', exact: true }).click()
      await page
        .getByRole('dialog', { name: 'Panel viewer', exact: true })
        .waitFor({ state: 'hidden' })
      if (pass === 0) {
        await page.getByRole('button', { name: 'Create', exact: true }).click()
        await page
          .getByRole('menuitem', { name: 'New Storyboard', exact: true })
          .click()
      }
    }
    assert.notEqual(created[0], created[1])
    console.log(
      'Inspector Details/inline comments/resolve/reopen, real revision preview/checkpoint/restore, retained identities/history, persisted frame, PDF byte parity and un-clipped third Create action passed.',
    )
    fs.writeFileSync(
      '/tmp/m04/finishing-inspector-record.json',
      JSON.stringify({ id, panelId }),
    )
  } catch (e) {
    if (page) {
      console.error(await page.locator('[role=alert]').allTextContents())
      await page.screenshot({
        path: '/tmp/m04/finishing-inspector-failure.png',
      })
    }
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
