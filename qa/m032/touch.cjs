const { state, out, create, api, until } = require('./helpers.cjs'),
  path = require('node:path'),
  fs = require('node:fs'),
  assert = require('node:assert/strict'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const list = await create('Touch and drop-cancellation QA'),
      context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      })
    await context.addInitScript(
      (token) => localStorage.setItem('token', token),
      state.tokens[101],
    )
    const page = await context.newPage()
    await page.goto(state.root + '#/shotlists/' + list.id)
    await page.locator('[data-sync="saved"]').waitFor()
    const rows = page.locator('tbody tr[data-shot]'),
      before = await rows.evaluateAll((nodes) =>
        nodes.map((n) => n.dataset.shot),
      ),
      grip = rows.first().locator('.pd-row-grip')
    await grip.scrollIntoViewIfNeeded()
    const start = await grip.boundingBox(),
      target = await rows.nth(2).boundingBox(),
      cdp = await context.newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: start.x + 12, y: start.y + 12 }],
    })
    await page.waitForTimeout(210)
    for (let step = 1; step <= 12; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [
          {
            x: start.x + 12,
            y:
              start.y +
              12 +
              ((target.y + target.height / 2 - start.y - 12) * step) / 12,
          },
        ],
      })
      await page.waitForTimeout(16)
    }
    await page.screenshot({ path: path.join(out, 'touch-drag.png') })
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    })
    await until(async () => {
      const result = await api('/' + list.id + '/export'),
        ordered = Object.values(result.shots)
          .filter((s) => s.sceneId === result.shots[before[0]].sceneId)
          .sort((a, b) => a.order - b.order)
      return ordered[0].id !== before[0]
    }, 'touch reorder durable')
    assert.equal(
      new Set(await rows.evaluateAll((n) => n.map((r) => r.dataset.shot))).size,
      before.length,
    )
    await page.getByRole('button', { name: 'Undo', exact: true }).click()
    await page.locator('[data-sync="saved"]').waitFor()
    await until(
      async () =>
        JSON.stringify(
          await rows.evaluateAll((n) => n.map((r) => r.dataset.shot)),
        ) === JSON.stringify(before),
      'undo touch',
    )
    await context.close()
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    await desktop.addInitScript(
      (token) => localStorage.setItem('token', token),
      state.tokens[101],
    )
    const p = await desktop.newPage()
    await p.goto(state.root + '#/shotlists/' + list.id)
    await p.locator('[data-sync="saved"]').waitFor()
    const ds = p.locator('tbody tr[data-shot]'),
      handle = ds.first().locator('.pd-row-grip'),
      s = await handle.boundingBox(),
      t = await ds.nth(2).boundingBox()
    await p.mouse.move(s.x + 12, s.y + 12)
    await p.mouse.down()
    await p.mouse.move(s.x + 12, t.y + t.height / 2, { steps: 8 })
    await p.mouse.move(20, 20, { steps: 8 })
    await p.mouse.up()
    await until(
      async () =>
        JSON.stringify(
          await ds.evaluateAll((n) => n.map((r) => r.dataset.shot)),
        ) === JSON.stringify(before),
      'outside drop restores canonical view',
    )
    assert.deepEqual(
      Object.keys((await api('/' + list.id + '/export')).shots).sort(),
      before.slice().sort(),
    )
    fs.writeFileSync(
      path.join(out, 'touch.json'),
      JSON.stringify(
        {
          pass: true,
          touch: 'CDP real touch events, 180ms grip activation',
          outsideDropCancelled: true,
          uuidCount: before.length,
        },
        null,
        2,
      ),
    )
    console.log(
      'PASS real touch grip / durable order / undo / outside drop cancellation',
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
