const fs = require('node:fs')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const webkit = process.env.M04_BROWSER === 'webkit'
const pw = require(
  webkit
    ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
    : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json'))
;(async () => {
  const browser = await (webkit ? pw.webkit : pw.chromium).launch({
    headless: true,
  })
  let page
  try {
    const id = crypto.randomUUID(),
      headers = {
        Authorization: 'Bearer ' + state.tokens['101'],
        'Content-Type': 'application/json',
      }
    assert.ok(
      (
        await fetch('http://127.0.0.1:4314/api/storyboards', {
          method: 'POST',
          headers,
          body: JSON.stringify({ id, name: 'M04 gestures ' + id.slice(0, 4) }),
        })
      ).ok,
    )
    page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
    page.setDefaultTimeout(20000)
    await page.addInitScript(
      (token) => localStorage.setItem('token', token),
      state.tokens['101'],
    )
    await page.goto(`http://127.0.0.1:5176/productiondesk/#/storyboards/${id}`)
    await page
      .getByRole('button', { name: 'Start drawing', exact: true })
      .click()
    await page.locator('[data-drawing-engine="vectorcraft-639c9d6"]').waitFor()
    const canvas = page.getByLabel('Storyboard drawing canvas')
    const records = async () => {
      await page.waitForFunction(
        () => document.querySelector('[data-sync]')?.dataset.sync === 'saved',
      )
      const data = await (
        await fetch(`http://127.0.0.1:4314/api/storyboards/${id}/snapshot`, {
          headers,
        })
      ).json()
      return Object.values(data.annotations)
    }
    const locate = async () => {
      const b = await page
        .locator('.sb-studio-composition > rect')
        .boundingBox()
      return (x, y) => [
        b.x + (x / 1000) * b.width,
        b.y + (y / 562.5) * b.height,
      ]
    }
    const draw = async (points) => {
      const at = await locate()
      await page.mouse.move(...at(...points[0]))
      await page.mouse.down()
      for (const p of points.slice(1)) await page.mouse.move(...at(...p))
      await page.waitForTimeout(900) // Deliberate real hold, not a simulated recognized result.
      await page.mouse.up()
    }
    const polygon = (vertices) =>
      vertices
        .slice(1)
        .flatMap((p, i) =>
          Array.from({ length: 10 }, (_, j) =>
            vertices[i].map((n, k) => n + ((p[k] - n) * j) / 9),
          ),
        )
    const shapes = [
      [
        'line',
        Array.from({ length: 24 }, (_, i) => [
          150 + i * 10,
          100 + Math.sin(i) * 0.5,
        ]),
      ],
      [
        'ellipse',
        Array.from({ length: 73 }, (_, i) => [
          500 + 60 * Math.cos((i * Math.PI) / 36),
          170 + 60 * Math.sin((i * Math.PI) / 36),
        ]),
      ],
      [
        'rectangle',
        polygon([
          [150, 260],
          [280, 260],
          [280, 340],
          [150, 340],
          [150, 260],
        ]),
      ],
      [
        'path',
        polygon([
          [500, 280],
          [620, 280],
          [560, 380],
          [500, 280],
        ]),
      ],
      [
        'arrow',
        polygon([
          [150, 430],
          [400, 430],
          [350, 395],
          [360, 465],
        ]),
      ],
    ]
    for (const [type, points] of shapes) {
      const before = new Set((await records()).map((a) => a.id))
      await draw(points)
      const added = (await records()).filter((a) => !before.has(a.id))
      assert.equal(added.length, 1)
      assert.equal(
        added[0].type,
        type,
        'A held gesture must persist actual editable recognized geometry',
      )
      await page.getByRole('button', { name: 'Undo', exact: true }).click()
      assert.equal(
        (await records()).find((a) => a.id === added[0].id).type,
        'pen',
        'Undo restores the original freehand stroke',
      )
      await page.getByRole('button', { name: 'Redo', exact: true }).click()
      assert.equal(
        (await records()).find((a) => a.id === added[0].id).type,
        type,
      )
    }
    await page
      .getByRole('button', { name: 'Studio settings', exact: true })
      .click()
    await page
      .getByRole('checkbox', { name: 'Shape Assistance', exact: true })
      .uncheck()
    await page
      .getByRole('button', { name: 'Studio settings', exact: true })
      .click()
    const count = (await records()).length
    await draw(Array.from({ length: 20 }, (_, i) => [650 + i * 6, 420]))
    assert.equal((await records()).filter((a) => a.type === 'pen').length, 1)
    const at = await locate(),
      start = at(700, 100),
      end = at(760, 150)
    const pointer = (type, pointerId, pointerType, p, pressure = 0) =>
      canvas.dispatchEvent(type, {
        pointerId,
        pointerType,
        clientX: p[0],
        clientY: p[1],
        button: 0,
        buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
        pressure,
      })
    await pointer('pointerdown', 51, 'pen', start, 0.8)
    for (let i = 1; i <= 6; i++)
      await pointer(
        'pointermove',
        51,
        'pen',
        [start[0] + ((end[0] - start[0]) * i) / 6, start[1]],
        i < 4 ? 0.8 : 0,
      )
    await pointer('pointerup', 51, 'pen', end)
    const pen = (await records()).find((a) =>
      a.points.some((p) => Math.abs((p[2] || 0) - 0.8) < 1e-5),
    )
    assert.ok(
      pen && pen.points.some((p) => p[2] === 0.5),
      'Real pressure and zero-pressure fallback both remain usable',
    )
    const beforeTouch = (await records()).length
    await pointer('pointerdown', 61, 'touch', start)
    await pointer('pointermove', 61, 'touch', end)
    await pointer('pointerup', 61, 'touch', end)
    assert.equal(
      (await records()).length,
      beforeTouch,
      'Auto navigates fingers after a recognized pen',
    )
    const inputMode = async (label) => {
      await page
        .getByRole('button', { name: 'Studio settings', exact: true })
        .click()
      await page
        .getByRole('button', { name: 'Drawing input', exact: true })
        .click()
      await page
        .getByRole('menuitemradio', { name: label, exact: true })
        .click()
      await page
        .getByRole('button', { name: 'Studio settings', exact: true })
        .click()
    }
    await inputMode('Touch Drawing')
    await pointer('pointerdown', 62, 'touch', start)
    await pointer('pointermove', 62, 'touch', end)
    await pointer('pointerup', 62, 'touch', end)
    assert.equal((await records()).length, beforeTouch + 1)
    const beforePinch = (await records()).length
    await pointer('pointerdown', 71, 'touch', [700, 500])
    await pointer('pointerdown', 72, 'touch', [800, 500])
    await pointer('pointermove', 72, 'touch', [850, 510])
    await pointer('pointerup', 71, 'touch', [700, 500])
    await pointer('pointerup', 72, 'touch', [850, 510])
    assert.equal(
      (await records()).length,
      beforePinch,
      'Two fingers cancel the draft and navigate',
    )
    assert.notEqual(
      await page.locator('.sb-studio-navigation output').innerText(),
      '100%',
    )
    await page.getByRole('button', { name: 'Fit artwork', exact: true }).click()
    await pointer('pointerdown', 81, 'touch', start)
    await pointer('pointermove', 81, 'touch', end)
    await pointer('pointercancel', 81, 'touch', end)
    assert.equal((await records()).length, beforePinch)
    await inputMode('Navigation Only')
    await pointer('pointerdown', 91, 'touch', start)
    await pointer('pointermove', 91, 'touch', end)
    await pointer('pointerup', 91, 'touch', end)
    assert.equal((await records()).length, beforePinch)
    assert.equal(await page.evaluate(() => scrollY), 0)
    await page.screenshot({
      path: `/tmp/m04/finishing-gesture-${webkit ? 'webkit' : 'chromium'}.png`,
    })
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page
      .getByRole('dialog', { name: 'Panel viewer', exact: true })
      .waitFor({ state: 'hidden' })
    assert.notEqual(
      await page.evaluate(() => document.body.style.position),
      'fixed',
    )
    await page.reload()
    await page.locator('.sb-card-art').first().click()
    await page
      .getByRole('button', { name: 'Studio settings', exact: true })
      .click()
    assert.match(
      await page
        .getByRole('button', { name: 'Drawing input', exact: true })
        .innerText(),
      /Navigation Only/,
    )
    assert.equal(
      await page
        .getByRole('checkbox', { name: 'Shape Assistance', exact: true })
        .isChecked(),
      false,
    )
    assert.ok((await records()).length >= count)
    console.log(
      'Actual held line/circle/rectangle/triangle/arrow geometry; conversion Undo/Redo; disabled assistance; pressure fallback; Auto/Touch Drawing/Navigation Only; two-touch pan/zoom; cancellation; persisted preferences and scroll restoration passed. Synthetic input, no physical stylus certification.',
    )
  } catch (error) {
    if (page)
      await page.screenshot({ path: '/tmp/m04/finishing-gesture-failure.png' })
    throw error
  } finally {
    await browser.close()
  }
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
