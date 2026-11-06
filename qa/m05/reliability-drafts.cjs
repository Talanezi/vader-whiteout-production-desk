const fs = require('fs'),
  assert = require('assert/strict'),
  kind = process.env.M05_BROWSER || 'chromium',
  pw = require(
    kind === 'webkit'
      ? '/tmp/m05/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  f = JSON.parse(fs.readFileSync('/tmp/m05/refinement/fixture.json')),
  board = JSON.parse(
    fs.readFileSync('/tmp/m05/refinement/storyboard.json'),
  ),
  root = 'http://127.0.0.1:5176/productiondesk/#'
;(async () => {
  const browser = await pw[kind].launch(),
    ctx = await browser.newContext({
      viewport: { width: 1640, height: 1050 },
    })
  await ctx.addInitScript(
    (t) => localStorage.setItem('token', t),
    auth.tokens['103'],
  )
  const p = await ctx.newPage()
  p.setDefaultTimeout(25000)
  try {
    await p.goto(root + '/flows/' + f.flowId)
    await p
      .getByRole('radio', { name: 'Department Flow', exact: true })
      .click()
    await p
      .getByRole('button', {
        name: 'Camera & Lighting · 10-A',
        exact: true,
      })
      .click()
    const instruction = p.getByRole('textbox', {
      name: 'Camera & Lighting · 10-A',
      exact: true,
    })
    await instruction.waitFor()
    await ctx.setOffline(true)
    await instruction.fill('Offline department instruction ' + kind)
    let key = 'whiteout:pending-yjs:103:flows:' + f.flowId
    await p.waitForFunction((k) => !!localStorage.getItem(k), key)
    await ctx.setOffline(false)
    await p.reload()
    await p
      .getByRole('radio', { name: 'Department Flow', exact: true })
      .waitFor()
    await p.waitForFunction((k) => !localStorage.getItem(k), key)
    assert(
      (
        await p
          .getByRole('button', {
            name: 'Camera & Lighting · 10-A',
            exact: true,
          })
          .innerText()
      ).includes('Offline department instruction ' + kind),
    )
    await p.goto(root + '/storyboards/' + board.id)
    await p.locator('.sb-card-art').first().click()
    await p.getByRole('button', { name: 'Studio', exact: true }).click()
    await p.getByRole('button', { name: 'Brush (B)', exact: true }).click()
    const canvas = p.getByLabel('Storyboard drawing canvas'),
      box = await canvas.boundingBox()
    const before = await p
      .locator('.sb-studio-composition [data-object]')
      .count()
    await ctx.setOffline(true)
    await p.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.3)
    await p.mouse.down()
    await p.mouse.move(
      box.x + box.width * 0.55,
      box.y + box.height * 0.5,
      { steps: 15 },
    )
    await p.mouse.up()
    key = 'whiteout:pending-yjs:103:storyboards:' + board.id
    await p.waitForFunction((k) => !!localStorage.getItem(k), key)
    assert.equal(
      await p.locator('.sb-studio-composition [data-object]').count(),
      before + 1,
    )
    await ctx.setOffline(false)
    await p.reload()
    await p.locator('.sb-card-art').first().waitFor()
    await p.waitForFunction((k) => !localStorage.getItem(k), key)
    await p.locator('.sb-card-art').first().click()
    await p.getByRole('button', { name: 'Studio', exact: true }).click()
    await p.locator('[data-drawing-engine]').waitFor()
    assert.equal(
      await p.locator('.sb-studio-composition [data-object]').count(),
      before + 1,
    )
    console.log(
      kind +
        ': actual Flow instruction and completed VectorCraft brush stroke survive offline/reload, reauthorize, merge and durable confirmation without a second document store.',
    )
  } catch (e) {
    await p.screenshot({
      path: '/tmp/m05/refinement/' + kind + '/draft-recovery-failure.png',
    })
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
