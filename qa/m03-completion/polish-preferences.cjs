const { state, create } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const list = await create('M03 existing preset migration'),
    b = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const old = [
      'subject',
      'framing',
      'angle',
      'camera',
      'lens',
      'equipment',
      'movement',
      'notes',
      'focusNotes',
      'lightingNotes',
    ]
    for (const customized of [false, true]) {
      const c = await b.newContext()
      await c.addInitScript(
        ({ token, old, customized }) => {
          localStorage.setItem('token', token)
          localStorage.setItem(
            'whiteout.shot-grid.v2.101',
            JSON.stringify({
              preset: 'Cinematography',
              visible: old,
              order: customized ? [...old].reverse() : old,
              sizes: { coverage: 430 },
            }),
          )
        },
        { token: state.tokens[101], old, customized },
      )
      const p = await c.newPage()
      await p.goto(state.root + '#/shotlists/' + list.id)
      await p.locator('[data-sync="saved"]').waitFor()
      const stateNow = await p.evaluate(() =>
        JSON.parse(localStorage.getItem('whiteout.shot-grid.v2.101')),
      )
      if (customized) {
        assert.equal(stateNow.preset, 'Custom')
        assert.deepEqual(stateNow.order, [...old].reverse())
      } else {
        assert.equal(stateNow.preset, 'Cinematography')
        assert.equal(stateNow.visible[0], 'coverage')
        assert.equal(stateNow.visible.length, 14)
        assert.equal(stateNow.sizes.coverage, 430)
        const columns = await p.locator('.pd-pro-table th').allTextContents()
        assert.equal(columns[2].trim(), 'Action / coverage')
      }
      await c.close()
    }
    console.log(
      'PASS existing standard Cinematography migrates in real browser; custom order and widths remain intact',
    )
  } finally {
    await b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
