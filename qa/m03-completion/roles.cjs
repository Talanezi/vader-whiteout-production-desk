const { state, create } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const list = await create('Role defaults ' + crypto.randomUUID())
  const b = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const c = await b.newContext(),
      p = await c.newPage()
    for (const [user, expected] of [
      ['102', 'Cinematography'],
      ['103', 'AD / Planning'],
      ['101', 'Essentials'],
    ]) {
      await p.goto(state.root)
      await p.evaluate(
        (token) => localStorage.setItem('token', token),
        state.tokens[user],
      )
      await p.goto(state.root + '#/shotlists/' + list.id)
      await p.reload()
      await p.locator('[data-sync="saved"]').waitFor()
      assert.equal(
        (
          await p
            .getByRole('button', { name: 'Grid preset', exact: true })
            .innerText()
        ).trim(),
        expected,
      )
      console.log('PASS initial role default', user, expected)
      if (user === '102') {
        await p
          .getByRole('button', { name: 'Grid preset', exact: true })
          .click()
        await p
          .getByRole('menuitemradio', { name: 'Full Technical', exact: true })
          .click()
        await p.reload()
        await p.locator('[data-sync="saved"]').waitFor()
        assert.equal(
          (
            await p
              .getByRole('button', { name: 'Grid preset', exact: true })
              .innerText()
          ).trim(),
          'Full Technical',
        )
      }
    }
    await p.evaluate(
      (token) => localStorage.setItem('token', token),
      state.tokens[102],
    )
    await p.reload()
    await p.locator('[data-sync="saved"]').waitFor()
    assert.equal(
      (
        await p
          .getByRole('button', { name: 'Grid preset', exact: true })
          .innerText()
      ).trim(),
      'Full Technical',
    )
    console.log(
      'PASS manual override survives reload and same-browser account switching',
    )
  } finally {
    await b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
