const { state, out, create, api } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  path = require('path'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const list = await create('Cross-scene order ' + crypto.randomUUID()),
    before = await api('/' + list.id + '/export'),
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
    const rows = p.locator('tr[data-shot]'),
      count = await rows.count()
    assert.equal(count, 8)
    const scenes = p
      .getByRole('navigation', { name: 'Scenes' })
      .getByRole('button')
    await scenes.nth(1).click()
    assert.equal(await rows.count(), 8)
    await p.getByRole('button', { name: 'All Scenes', exact: true }).click()
    await p
      .getByRole('menuitemradio', { name: 'Isolate Scene', exact: true })
      .click()
    assert.ok((await rows.count()) < 8)
    await p.getByRole('button', { name: 'Isolate Scene', exact: true }).click()
    await p
      .getByRole('menuitemradio', { name: 'All Scenes', exact: true })
      .click()
    assert.equal(await rows.count(), 8)
    await p.screenshot({ path: path.join(out, 'completion-all-scenes.png') })
    await p.getByRole('button', { name: 'All Scenes', exact: true }).click()
    await p
      .getByRole('menuitemradio', { name: 'Planning Order', exact: true })
      .click()
    const ids = await rows.evaluateAll((els) =>
      els.map((el) => el.dataset.shot),
    )
    const boundary = ids.findIndex(
      (id, i) =>
        i > 0 && before.shots[id].sceneId !== before.shots[ids[i - 1]].sceneId,
    )
    assert.ok(boundary > 0)
    const target = rows.nth(boundary),
      id = ids[boundary]
    await target.getByRole('button', { name: /^Actions for shot / }).click()
    await p.getByRole('menuitem', { name: 'Move earlier', exact: true }).click()
    await p.locator('[data-sync="saved"]').waitFor()
    let after = await api('/' + list.id + '/export')
    assert.equal(after.shots[id].sceneId, before.shots[id].sceneId)
    assert.equal(after.shots[id].number, before.shots[id].number)
    assert.ok(
      Number(after.shots[id].planningOrder) <
        Number(after.shots[ids[boundary - 1]].planningOrder),
    )
    await p.screenshot({ path: path.join(out, 'completion-cross-scene.png') })
    await p.reload()
    await p.locator('[data-sync="saved"]').waitFor()
    after = await api('/' + list.id + '/export')
    assert.equal(after.shots[id].sceneId, before.shots[id].sceneId)
    await p.getByRole('button', { name: 'All Scenes', exact: true }).click()
    await p
      .getByRole('menuitemradio', { name: 'Planning Order', exact: true })
      .click()
    const dragBefore = await rows.evaluateAll((els) =>
      els.map((el) => el.dataset.shot),
    )
    const cross = dragBefore.findIndex(
      (id, i) =>
        i > 0 &&
        before.shots[id].sceneId !== before.shots[dragBefore[i - 1]].sceneId,
    )
    const grip = rows.nth(cross).getByRole('button', { name: /^Reorder shot / })
    await grip.press('Space')
    await p.keyboard.press('ArrowUp')
    await p.waitForFunction(
      (previous) =>
        JSON.stringify(
          [...document.querySelectorAll('tr[data-shot]')].map(
            (el) => el.dataset.shot,
          ),
        ) !== JSON.stringify(previous),
      dragBefore,
    )
    await p.keyboard.press('Space')
    await p.locator('[data-sync="saved"]').waitFor()
    const dragged = await api('/' + list.id + '/export')
    for (const id of dragBefore) {
      assert.equal(dragged.shots[id].sceneId, before.shots[id].sceneId)
      assert.equal(dragged.shots[id].number, before.shots[id].number)
    }
    await p.screenshot({
      path: path.join(out, 'completion-cross-scene-drag.png'),
    })
    console.log(
      'PASS All Scenes, rail navigation retains every row, explicit isolation/return, cross-scene planning move, identity/UUID preservation and reload',
    )
  } finally {
    await b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
