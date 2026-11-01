const { state, out, create, api, until } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  path = require('node:path'),
  pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  wk = require('/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright')
;(async () => {
  for (const [name, engine] of [
    ['chrome', pw.chromium],
    ['webkit', wk.webkit],
  ]) {
    const list = await create('M03 deliberate failures ' + name),
      b = await engine.launch(
        name === 'chrome'
          ? { channel: 'chrome', headless: true }
          : { headless: true },
      )
    try {
      const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
      await c.addInitScript(
        (t) => localStorage.setItem('token', t),
        state.tokens[101],
      )
      const p = await c.newPage()
      p.setDefaultTimeout(15000)
      await p.goto(state.root + '#/shotlists/' + list.id)
      await p.locator('[data-sync="saved"]').waitFor()
      const baseline = await api('/' + list.id + '/export')
      await p.locator('tr[data-shot]').first().getByRole('checkbox').check()
      await p.evaluate(() =>
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: async () => {
              throw Error('Controlled clipboard denial')
            },
          },
        }),
      )
      await p
        .getByRole('button', { name: 'Copy selected', exact: true })
        .click()
      await p.getByText('Clipboard unavailable.', { exact: true }).waitFor()
      assert.equal(await p.locator('.is-copied').count(), 0)
      await c.setOffline(true)
      await p
        .getByText(
          'Connection interrupted. Keep this window open; edits remain in memory.',
          { exact: true },
        )
        .waitFor()
      await p
        .getByRole('button', { name: 'Delete selected', exact: true })
        .click()
      await p
        .getByRole('button', {
          name: 'Confirm delete 1 selected shot',
          exact: true,
        })
        .click()
      await p
        .getByText('Reconnect before deleting. The shots are retained.', {
          exact: true,
        })
        .waitFor()
      assert.equal(await p.locator('tr[data-shot]').count(), 8)
      await p
        .getByRole('button', { name: 'Cancel deletion', exact: true })
        .click()
      await p
        .getByRole('button', { name: 'Clear selection', exact: true })
        .click()
      assert.deepEqual(
        (await api('/' + list.id + '/export')).shots,
        baseline.shots,
      )
      await c.setOffline(false)
      await p.locator('[data-sync="saved"]').waitFor()
      await p.locator('tr[data-shot]').first().getByRole('checkbox').check()
      await c.setOffline(true)
      await p
        .getByText(
          'Connection interrupted. Keep this window open; edits remain in memory.',
          { exact: true },
        )
        .last()
        .waitFor()
      const dup = p.getByRole('button', {
          name: 'Duplicate selected',
          exact: true,
        }),
        box = await dup.boundingBox()
      await p.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2, {
        delay: 30,
      })
      await until(
        async () => (await p.locator('tr[data-shot]').count()) === 9,
        'one duplicate',
      )
      assert.equal(await dup.isDisabled(), true)
      assert.equal(await p.locator('.is-duplicated').count(), 0)
      await c.setOffline(false)
      await p.locator('.is-duplicated').waitFor()
      await p.locator('[data-sync="saved"]').waitFor()
      assert.equal(await p.locator('tr[data-shot]').count(), 9)
      await p.screenshot({
        path: path.join(out, 'polish-' + name + '-reconnected.png'),
      })
      console.log(
        'PASS',
        name,
        'copy denial has no false success; offline deletion retains records; pending duplicate resists double-click and confirms only after reconnect/save',
      )
    } finally {
      await b.close()
    }
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
