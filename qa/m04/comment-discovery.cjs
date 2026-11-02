// Targeted final refinements only. Disposable local records; no production writes.
const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto')
const { join, until } = require('./collaboration.cjs')
const Y = require('/tmp/m032/runtime/client/node_modules/yjs')
const webkit = process.env.M04_BROWSER === 'webkit'
const pw = require(
  webkit
    ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
    : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  fixture = JSON.parse(fs.readFileSync('/tmp/m04/studio-scene16-record.json'))
;(async () => {
  const browser = await (webkit ? pw.webkit : pw.chromium).launch({
    headless: true,
  })
  let client, page
  try {
    const r = await fetch(
      `http://127.0.0.1:4314/api/storyboards/${fixture.id}/manage`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + state.tokens['101'],
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'duplicate' }),
      },
    )
    assert.ok(r.ok)
    const { id } = await r.json()
    client = await join(id, '102')
    const panels = [...client.doc.getMap('panels').values()].sort(
        (a, b) => a.get('order') - b.get('order'),
      ),
      pid = panels[0].get('id')
    const comment = (key, parentId, resolved = false) => {
      const c = new Y.Map()
      client.doc.getMap('comments').set(key, c)
      Object.entries({
        id: key,
        panelId: pid,
        author: 'Elias Moreno',
        authorId: 102,
        text: key,
        createdAt: new Date().toISOString(),
        resolved,
        ...(parentId ? { parentId } : {}),
      }).forEach(([k, v]) => c.set(k, v))
    }
    client.doc.transact(() => {
      client.doc.getMap('comments').clear()
      comment('Open discussion')
      comment('Reply', 'Open discussion')
      comment('Resolved thread', undefined, true)
      comment('Hidden reply', 'Resolved thread')
    })
    page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
    page.setDefaultTimeout(15000)
    await page.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens['101'],
    )
    await page.goto(`http://127.0.0.1:5176/productiondesk/#/storyboards/${id}`)
    const card = page.locator('.sb-panel-card').first()
    await card.getByRole('button', { name: /Open 2 active comments/ }).waitFor()
    assert.equal(await page.locator('.sb-comment-indicator').count(), 1)
    await card.getByRole('button', { name: /Open 2 active comments/ }).click()
    await page.getByRole('tab', { name: 'Comments', exact: true }).waitFor()
    assert.equal(
      await page
        .getByRole('tab', { name: 'Comments', exact: true })
        .getAttribute('aria-selected'),
      'true',
    )
    await page.getByText('Open discussion', { exact: true }).waitFor()
    assert.equal(await page.locator('.sb-viewer-comment-rail').count(), 0)
    await page.getByRole('tab', { name: 'History', exact: true }).click()
    await page.locator('.sb-viewer-comment-rail').waitFor()
    assert.equal(
      await page
        .getByRole('button', { name: 'Artwork fit', exact: true })
        .count(),
      0,
    )
    const art = await page.locator('.sb-viewer-art').boundingBox(),
      rail = await page.locator('.sb-viewer-comment-rail').boundingBox()
    assert.ok(
      rail.x >= art.x + art.width - 1,
      'Bubble rail is outside the artwork surface',
    )
    await page.locator('.sb-viewer-comment-rail button').click()
    assert.equal(
      await page
        .getByRole('tab', { name: 'Comments', exact: true })
        .getAttribute('aria-selected'),
      'true',
    )
    await page
      .getByRole('button', { name: 'Hide details', exact: true })
      .click()
    await page.locator('.sb-viewer-comment-rail button').waitFor()
    client.doc.transact(() => comment('Remote reply', 'Open discussion'))
    await page
      .locator('.sb-viewer-comment-rail')
      .getByRole('button', { name: /Open 3 active comments/ })
      .waitFor()
    client.doc.getMap('comments').get('Open discussion').set('resolved', true)
    await page.locator('.sb-viewer-comment-rail').waitFor({ state: 'hidden' })
    client.doc.getMap('comments').get('Open discussion').set('resolved', false)
    await page
      .locator('.sb-viewer-comment-rail')
      .getByRole('button', { name: /Open 3 active comments/ })
      .waitFor()
    await page.setViewportSize({ width: 390, height: 650 })
    await page.locator('.sb-viewer-comment-rail button').click()
    assert.equal(
      await page
        .getByRole('tab', { name: 'Comments', exact: true })
        .getAttribute('aria-selected'),
      'true',
    )
    assert.equal(await page.locator('.sb-viewer-comment-rail').count(), 0)
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page
      .getByRole('dialog', { name: 'Panel viewer', exact: true })
      .waitFor({ state: 'hidden' })
    await card.getByRole('button', { name: /Open 3 active comments/ }).waitFor()
    await page.setViewportSize({ width: 1440, height: 1000 })
    await card.locator('.sb-card-art').click()
    await page.getByRole('button', { name: 'Studio', exact: true }).click()
    assert.equal(
      await page
        .getByRole('button', { name: 'Artwork fit', exact: true })
        .count(),
      0,
    )
    await page
      .getByRole('button', { name: 'Drawing frame', exact: true })
      .click()
    await page
      .getByRole('menuitemradio', { name: 'Square · 1:1', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Drawing frame', exact: true })
      .click()
    await page
      .getByRole('menuitemradio', { name: 'Crop to frame', exact: true })
      .click()
    await until(
      () =>
        client.doc
          .getMap('revisions')
          .get(panels[0].get('activeRevision'))
          .get('frame')?.fit === 'crop',
      'Preserved fitting in the frame menu',
    )
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page
      .getByRole('dialog', { name: 'Panel viewer', exact: true })
      .waitFor({ state: 'hidden' })
    await card.hover()
    await card.getByRole('button', { name: /Actions for/ }).click()
    await page
      .getByRole('menuitem', { name: 'Draw panel after', exact: true })
      .click()
    await page.locator('[data-drawing-engine]').waitFor()
    assert.equal(
      await page
        .getByRole('button', { name: 'Artwork fit', exact: true })
        .count(),
      0,
    )
    await page
      .getByRole('button', { name: 'Drawing frame', exact: true })
      .waitFor()
    await page
      .getByRole('button', { name: 'Full screen', exact: true })
      .waitFor()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page
      .getByRole('dialog', { name: 'Panel viewer', exact: true })
      .waitFor({ state: 'hidden' })
    await page.getByRole('radio', { name: 'Present', exact: true }).click()
    await page.locator('.sb-viewer-comment-rail button').click()
    await page
      .locator('.sb-panel-inspector')
      .getByText('Open discussion', { exact: true })
      .waitFor()
    assert.equal(await page.locator('.sb-viewer-comment-rail').count(), 0)
    console.log(
      'Grid and viewer direct Comments navigation; unresolved-thread/reply counts; second-user live post/resolve/reopen; hidden duplicate bubble; artwork-external rail;390px layout; imported/native/Studio/Present toolbar removal; frame fit/crop preservation passed.',
    )
  } catch (e) {
    if (page)
      await page.screenshot({ path: '/tmp/m04/comment-discovery-failure.png' })
    throw e
  } finally {
    client?.close()
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
