const fs = require('fs'),
  assert = require('assert/strict'),
  crypto = require('crypto'),
  kind = process.env.M05_BROWSER || 'chromium',
  pw = require(kind === 'webkit'
    ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
    : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  fixture = JSON.parse(
    fs.readFileSync('/tmp/m05/corrections/fixture.json'),
  ),
  { join, until } = require('../m04/collaboration.cjs'),
  Y = require('/tmp/m032/runtime/client/node_modules/yjs'),
  out = '/tmp/m05/corrections/' + kind
const headers = {
    Authorization: 'Bearer ' + auth.tokens['101'],
    'Content-Type': 'application/json',
  },
  base = 'http://127.0.0.1:4314/api'
async function api(path, b) {
  const r = await fetch(base + path, {
    method: b ? 'POST' : 'GET',
    headers,
    body: b && JSON.stringify(b),
  })
  assert(r.ok, await r.clone().text())
  return r.json()
}
function put(doc, key, id, values) {
  const m = doc.getMap(key).get(id) || new Y.Map()
  if (!doc.getMap(key).has(id)) doc.getMap(key).set(id, m)
  Object.entries({ id, ...values }).forEach(([k, v]) => m.set(k, v))
}
;(async () => {
  const id = crypto.randomUUID(),
    source = await join(fixture.listId, '102', 'shotlists')
  source.doc.transact(() =>
    fixture.shotIds.slice(0, 4).forEach((id, i) =>
      source.doc
        .getMap('shots')
        .get(id)
        .set('estimatedMinutes', String([20, 15, 25, 10][i])),
    ),
  )
  await new Promise((r) => setTimeout(r, 350))
  await api('/flows', {
    id,
    name: 'Corrective timing and layout ' + kind,
    date: '2026-11-12',
    listId: fixture.listId,
    shotIds: fixture.shotIds.slice(0, 4),
  })
  const client = await join(id, '102', 'flows'),
    browser = await pw[kind].launch(),
    ctx = await browser.newContext({
      viewport: { width: 1640, height: 1050 },
    })
  await ctx.addInitScript(
    (t) => localStorage.setItem('token', t),
    auth.tokens['101'],
  )
  const p = await ctx.newPage()
  p.setDefaultTimeout(16000)
  try {
    await p.goto('http://127.0.0.1:5176/productiondesk/#/flows/' + id)
    await p.getByText('Saved', { exact: true }).waitFor()
    await p
      .getByRole('button', { name: 'Close Shot Rail', exact: true })
      .click()
    await p.locator('.flow-time').first().click()
    await p
      .getByRole('button', { name: 'Choose start time', exact: true })
      .click()
    await p.getByRole('dialog', { name: 'Choose set time' }).waitFor()
    await p.screenshot({ path: out + '/12-clock-picker.png' })
    await p.keyboard.press('Escape')
    await p.getByLabel('Start time', { exact: true }).fill('9:00 AM')
    await p.getByLabel('Shooting duration').click()
    await p
      .getByRole('button', { name: 'Apply timing', exact: true })
      .click()
    await p.getByText('Saved', { exact: true }).waitFor()
    let ev = [...client.doc.getMap('events').values()].sort(
      (a, b) => a.get('order') - b.get('order'),
    )
    await until(
      () => client.doc.getMap('meta').get('filmingStart') === 540,
      'filming start',
    )
    assert(
      (await p.locator('.flow-time').allTextContents())[3].includes(
        '10:00 AM',
      ),
    )
    // Fixed milestone deliberately conflicts with shot 2; real resolution UI preserves full shot.
    const lunch = crypto.randomUUID()
    put(client.doc, 'events', lunch, {
      type: 'milestone',
      description: 'Lunch',
      order: ev[1].get('order') + 0.5,
      timing: 'anchor',
      clockStart: 570,
      duration: 30,
      fixed: true,
    })
    await p
      .getByRole('button', { name: 'Resolve timing', exact: true })
      .first()
      .click()
    await p
      .getByRole('dialog', { name: 'Resolve fixed-time conflict' })
      .waitFor()
    await p.screenshot({ path: out + '/13-fixed-conflict.png' })
    await p
      .getByRole('button', { name: 'Keep current timing', exact: true })
      .click()
    assert.equal(
      client.doc.getMap('events').get(lunch).get('clockStart'),
      570,
    )
    await p
      .getByRole('button', { name: 'Resolve timing', exact: true })
      .first()
      .click()
    await p
      .getByRole('button', {
        name: 'Move shot after fixed activity',
        exact: true,
      })
      .click()
    await p
      .getByRole('button', { name: 'Resolve timing', exact: true })
      .waitFor({ state: 'hidden' })
    assert.equal(
      client.doc.getMap('events').get(lunch).get('clockStart'),
      570,
    )
    assert.equal(
      source.doc
        .getMap('shots')
        .get(fixture.shotIds[1])
        .get('estimatedMinutes'),
      '15',
    )
    // Day override stays Flow-only; clearing it returns to source inheritance.
    const row = p.locator('[data-event="' + ev[0].get('id') + '"]')
    await row.locator('.flow-time').click()
    await p.getByLabel('Use a different duration for this day').check()
    await p.getByLabel('Shooting duration').fill('30')
    await p
      .getByRole('button', { name: 'Apply timing', exact: true })
      .click()
    await until(
      () =>
        client.doc
          .getMap('events')
          .get(ev[0].get('id'))
          .get('duration') === 30,
      'day override',
    )
    assert.equal(
      source.doc
        .getMap('shots')
        .get(fixture.shotIds[0])
        .get('estimatedMinutes'),
      '20',
    )
    await row.locator('.flow-time').click()
    await p.getByLabel('Use a different duration for this day').uncheck()
    await p
      .getByRole('button', { name: 'Apply timing', exact: true })
      .click()
    // Actual department column drag (all shared order), resize, hide, presets.
    let deps = [...client.doc.getMap('departments').values()].sort(
      (a, b) => a.get('order') - b.get('order'),
    )
    const original = deps.map((d) => d.get('id'))
    await p
      .getByRole('button', { name: 'Move Camera', exact: true })
      .focus()
    const from = await p
        .getByRole('button', { name: 'Move Camera', exact: true })
        .boundingBox(),
      to = await p
        .getByRole('textbox', { name: 'Rename Talent', exact: true })
        .boundingBox()
    await p.mouse.move(from.x + 6, from.y + 6)
    await p.mouse.down()
    await p.mouse.move(to.x + 20, to.y + 12, { steps: 24 })
    await p.waitForTimeout(180)
    await p.mouse.up()
    await until(
      () =>
        [...client.doc.getMap('departments').values()]
          .sort((a, b) => a.get('order') - b.get('order'))[0]
          .get('id') !== original[0],
      'canonical column drag',
    )
    const resize = p.getByRole('button', {
      name: 'Resize Camera',
      exact: true,
    })
    await resize.focus()
    const w = await resize
      .locator('..')
      .evaluate((e) => e.getBoundingClientRect().width)
    await resize.press('ArrowRight')
    assert(
      (await resize
        .locator('..')
        .evaluate((e) => e.getBoundingClientRect().width)) > w,
    )
    await p.getByRole('button', { name: 'Layout', exact: true }).click()
    await p
      .getByRole('menuitem', { name: 'Core Crew', exact: true })
      .click()
    assert.equal(
      await p
        .getByRole('textbox', { name: 'Rename Costume', exact: true })
        .count(),
      0,
    )
    await p.getByRole('button', { name: 'Layout', exact: true }).click()
    await p
      .getByRole('menuitem', { name: 'All Departments', exact: true })
      .click()
      .catch(async () =>
        p.getByRole('menuitem', { name: 'All', exact: true }).click(),
      )
    await p
      .getByRole('textbox', { name: 'Rename Costume', exact: true })
      .waitFor()
    await p
      .getByRole('button', { name: 'Actions for Camera', exact: true })
      .click()
    await p
      .getByRole('menuitem', { name: 'Split department', exact: true })
      .click()
    await p.getByLabel('New department', { exact: true }).fill('Electric')
    await p
      .getByRole('button', {
        name: 'Add separate department',
        exact: true,
      })
      .click()
    await p
      .getByRole('textbox', { name: 'Rename Electric', exact: true })
      .waitFor()
    await until(
      () =>
        [...client.doc.getMap('departments').values()].some(
          (d) => d.get('name') === 'Electric',
        ),
      'split department',
    )
    assert(
      [...client.doc.getMap('departments').values()].some(
        (d) => d.get('name') === 'Camera',
      ),
    )
    await p
      .getByRole('button', { name: 'Actions for Electric', exact: true })
      .click()
    await p.getByRole('menuitem', { name: 'Group', exact: true }).click()
    await p.getByLabel('Group name', { exact: true }).fill('Lighting')
    await p
      .getByRole('heading', { name: 'Group Electric', exact: true })
      .click()
    await p
      .getByRole('button', { name: 'Close Group Electric', exact: true })
      .click()
    await p.getByText('Lighting', { exact: true }).waitFor()
    // Header and row checkboxes share a geometry-derived center; zoom-equivalent viewports.
    for (const zoom of [1, 1.25, 1.5, 2]) {
      await p.setViewportSize({
        width: Math.round(1640 / zoom),
        height: Math.round(1050 / zoom),
      })
      await p.waitForTimeout(220)
      const head = await p
          .locator('.flow-grid thead input[type=checkbox]')
          .boundingBox(),
        body = await p
          .locator('.flow-grid tbody input[type=checkbox]')
          .first()
          .boundingBox()
      assert(
        Math.abs(head.x + head.width / 2 - body.x - body.width / 2) < 1,
        JSON.stringify({ zoom, head, body }),
      )
      assert(
        (await p
          .locator('.flow-grid-scroll')
          .evaluate((e) => e.clientHeight)) > 150,
      )
      await p.screenshot({ path: out + '/zoom-' + zoom + '.png' })
    }
    await p.setViewportSize({ width: 1640, height: 1050 })
    await p
      .getByRole('button', { name: 'Flow options', exact: true })
      .click()
    await p
      .getByRole('menuitem', { name: 'Shoot date', exact: true })
      .click()
    await p
      .getByRole('button', { name: 'Choose shoot date', exact: true })
      .click()
    await p.locator('.pd-calendar').waitFor()
    await p.screenshot({ path: out + '/14-calendar.png' })
    await p.keyboard.press('Escape')
    await p
      .getByRole('button', { name: 'Close Shoot date', exact: true })
      .click()
    // Source changes propagate to another authenticated browser without copying technical data.
    source.doc
      .getMap('shots')
      .get(fixture.shotIds[3])
      .set('estimatedMinutes', '')
    await p.waitForFunction(
      () =>
        [...document.querySelectorAll('.flow-grid tbody tr')]
          .find((e) => e.textContent.includes('09-D'))
          ?.querySelector('.flow-time small') == null,
    )
    await p.reload()
    await p.getByText('Saved', { exact: true }).waitFor()
    const snap = await api('/flows/' + id + '/snapshot')
    assert.equal(Object.keys(snap.state.events).length, 5)
    fs.writeFileSync(out + '/timing.json', JSON.stringify({ id }))
    console.log(
      kind +
        ' actual clock/calendar, 9/9:20/9:35/10 sequence, fixed conflict cancel/resolve, day-only override, shared column drag/resize/presets, checkbox alignment at 100/125/150/200%, unknown source estimate and reload passed.',
    )
  } catch (e) {
    await p.screenshot({ path: out + '/interaction-failure.png' })
    throw e
  } finally {
    await browser.close()
    client.close()
    source.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
