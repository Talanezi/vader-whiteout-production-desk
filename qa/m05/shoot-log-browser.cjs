const fs = require('fs'),
  assert = require('assert/strict'),
  { randomUUID } = require('crypto'),
  Y = require('/tmp/m032/runtime/client/node_modules/yjs'),
  { join } = require('../m04/collaboration.cjs'),
  kind = process.env.M05_BROWSER || 'chromium',
  pw = require(
    kind === 'webkit'
      ? '/tmp/m05/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  f = JSON.parse(fs.readFileSync('/tmp/m05/refinement/fixture.json')),
  base = 'http://127.0.0.1:4314/api',
  root = 'http://127.0.0.1:5176/productiondesk/#/flows/',
  out = '/tmp/m05/refinement/' + kind
fs.mkdirSync(out, { recursive: true })
async function api(
  path,
  b,
  user = '103',
  status = b === undefined ? 200 : 201,
) {
  const r = await fetch(base + path, {
    method: b === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer ' + auth.tokens[user],
      'Content-Type': 'application/json',
    },
    body: b === undefined ? undefined : JSON.stringify(b),
  })
  assert.equal(r.status, status, await r.clone().text())
  return r.headers.get('content-type')?.includes('pdf')
    ? Buffer.from(await r.arrayBuffer())
    : r.json()
}
async function fixture(name) {
  const v = await api('/flows', {
      id: randomUUID(),
      name,
      date: f.date,
      listId: f.listId,
      shotIds: f.shotIds.slice(0, 5),
    }),
    c = await join(v.id, '103', 'flows')
  c.doc.transact(() => {
    c.doc.getMap('meta').set('filmingStart', 540)
    ;[...c.doc.getMap('events').values()].forEach((e) =>
      e.set('allottedMinutes', 10),
    )
  }, 'local')
  await new Promise((r) => setTimeout(r, 450))
  const state = await api('/flows/' + v.id + '/snapshot')
  const ids = Object.values(state.state.events)
    .sort((a, b) => a.order - b.order)
    .map((e) => e.id)
  c.close()
  return { ...v, ids }
}
;(async () => {
  const browser = await pw[kind].launch(),
    ctx = await browser.newContext({
      viewport: { width: 1640, height: 1050 },
      acceptDownloads: true,
    })
  await ctx.addInitScript((t) => {
    if (!sessionStorage.getItem('qa-auth')) {
      localStorage.setItem('token', t)
      sessionStorage.setItem('qa-auth', 'yes')
    }
  }, auth.tokens['103'])
  const page = await ctx.newPage()
  page.setDefaultTimeout(20000)
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const snap = async (n) =>
    page.screenshot({ path: out + '/shoot-log-' + n + '.png' })
  async function open(v) {
    await page.goto(root + v.id)
    await page
      .getByRole('radio', { name: 'Shoot Log', exact: true })
      .click()
    await page
      .getByRole('region', { name: 'Shoot Log', exact: true })
      .waitFor()
  }
  try {
    const v = await fixture('Shoot Log desktop ' + kind)
    await open(v)
    assert.equal(await page.locator('.flow-live-strip').count(), 0)
    await page.getByText('No actual checkpoint', { exact: true }).waitFor()
    assert.equal((await api('/flows/' + v.id + '/live')).live.revision, 0)
    await snap('01-empty')
    const input = (i) =>
      page.getByRole('textbox', {
        name: 'Actual start 10-' + String.fromCharCode(65 + i),
        exact: true,
      })
    async function type(i, time) {
      await input(i).fill(time)
      await input(i).press('Enter')
      await page.waitForFunction(
        (id) =>
          !document.querySelector(`[data-log-event="${id}"] .is-pending`),
        v.ids[i],
      )
    }
    await type(0, '9:04 AM')
    await input(1).evaluate((n) => {
      if (document.activeElement !== n)
        throw Error('Enter did not advance to the next timestamp')
    })
    await type(2, '9:31 AM')
    assert.equal(
      (await api('/flows/' + v.id + '/live')).live.blocks[v.ids[1]],
      undefined,
    )
    await page.getByText('1 need review', { exact: true }).waitFor()
    await type(1, '9:18 AM')
    const first = page.locator(`[data-log-event="${v.ids[0]}"]`)
    assert((await first.innerText()).includes('14.0 min'))
    assert((await first.innerText()).includes('Start-to-start'))
    await input(3).locator('..').getByRole('button').click()
    let sheet = page.getByRole('dialog', {
      name: 'Actual start 10-D',
      exact: true,
    })
    await sheet
      .getByRole('button', { name: 'Use current time', exact: true })
      .click()
    await page.waitForFunction(
      (id) =>
        !document.querySelector(`[data-log-event="${id}"] .is-pending`),
      v.ids[3],
    )
    assert(
      (await api('/flows/' + v.id + '/live')).live.blocks[v.ids[3]]
        .startedAt > 0,
    )
    await type(3, '9:44 AM')
    await page
      .getByRole('button', { name: 'Log actions for 10-A', exact: true })
      .click()
    await page
      .getByRole('menuitem', {
        name: 'Confirm actual finish',
        exact: true,
      })
      .click()
    const finish = page.getByRole('textbox', {
      name: 'Confirmed finish 10-A',
      exact: true,
    })
    await finish.fill('9:12 AM')
    await finish.press('Tab')
    await page.waitForTimeout(350)
    assert((await first.innerText()).includes('Confirmed block'))
    assert((await first.innerText()).includes('Within estimate'))
    await first.getByRole('button', { name: /Choose take|★ Take/ }).click()
    const take = page.getByRole('dialog', {
      name: 'Preferred take',
      exact: true,
    })
    await take
      .getByRole('textbox', { name: 'Take', exact: true })
      .fill('7')
    await take
      .getByRole('button', { name: 'Record take', exact: true })
      .click()
    await take
      .getByRole('button', { name: 'Close Preferred take', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Log actions for 10-E', exact: true })
      .click()
    await page
      .getByRole('menuitem', { name: 'Mark skipped', exact: true })
      .click()
    await page.waitForTimeout(300)
    assert.equal(
      (await api('/flows/' + v.id + '/live')).live.blocks[v.ids[4]]
        .startedAt,
      undefined,
    )
    await page.getByText('Planned versus actual', { exact: true }).click()
    await page
      .getByRole('img', {
        name: 'Recorded schedule variance across actual checkpoints',
      })
      .waitFor()
    await snap('02-desktop-backfilled')
    await page.reload()
    await page
      .getByRole('textbox', { name: 'Actual start 10-A', exact: true })
      .waitFor()
    assert.equal(await input(0).inputValue(), '9:04 AM')
    await page.getByRole('button', { name: '10-A', exact: true }).click()
    await page.getByText('Correction history', { exact: true }).click()
    assert(
      (await page.getByRole('dialog').innerText()).includes(
        'Actual timestamp',
      ),
    )
    await page
      .getByRole('button', { name: 'Close 10-A', exact: true })
      .click()
    const source = await api('/shotlists/' + f.listId + '/export')
    assert(
      Object.values(source.shots[f.shotIds[0]].takes || {}).some(
        (t) => t.label === '7' && t.context.flowId === v.id,
      ),
    )
    await page
      .getByRole('radio', { name: 'Department Flow', exact: true })
      .click()
    assert.equal(await page.locator('.flow-live-strip').count(), 0)
    await page
      .getByRole('radio', { name: 'Time Map', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Fit day', exact: true })
      .waitFor()
    await page
      .getByRole('radio', { name: 'Shoot Log', exact: true })
      .click()
    const offline = await fixture('Shoot Log offline ' + kind)
    await open(offline)
    await ctx.setOffline(true)
    await page.waitForTimeout(600)
    await input(0).fill('9:00 AM')
    await input(0).press('Enter')
    await input(1).fill('9:10 AM')
    await input(1).press('Enter')
    await page.getByText(/2 entries stored on this device/).waitFor()
    const queued = await page.evaluate(
      (id) =>
        JSON.parse(
          localStorage.getItem('whiteout:shoot-log-pending:103:' + id),
        ),
      offline.id,
    )
    assert.equal(queued.length, 2)
    await ctx.setOffline(false)
    await page.reload()
    await input(0).waitFor()
    await page.waitForFunction(
      (id) =>
        !localStorage.getItem('whiteout:shoot-log-pending:103:' + id),
      offline.id,
    )
    const resumed = await api('/flows/' + offline.id + '/live')
    assert.equal(resumed.live.blocks[offline.ids[0]].startMinute, 540)
    assert.equal(resumed.live.blocks[offline.ids[1]].startMinute, 550)
    assert.equal(
      resumed.live.audit.filter((a) => a.type === 'stamp').length,
      2,
    )
    await snap('03-reconnected')
    const retryFlow = await fixture('Shoot Log durable retry ' + kind)
    await open(retryFlow)
    let failOnce = true
    await ctx.route(
      '**/api/flows/' + retryFlow.id + '/live',
      async (route) => {
        if (failOnce && route.request().method() === 'POST') {
          failOnce = false
          return route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'Transient local QA interruption',
            }),
          })
        }
        return route.continue()
      },
    )
    await input(0).fill('9:04 AM')
    await input(0).press('Enter')
    await page
      .getByRole('button', { name: 'Retry pending entries', exact: true })
      .waitFor()
    assert.equal(
      (await api('/flows/' + retryFlow.id + '/live')).live.revision,
      0,
    )
    await page
      .getByRole('button', { name: 'Retry pending entries', exact: true })
      .click()
    await page.waitForFunction(
      (id) =>
        !localStorage.getItem('whiteout:shoot-log-pending:103:' + id),
      retryFlow.id,
    )
    assert.equal(
      (await api('/flows/' + retryFlow.id + '/live')).live.revision,
      1,
    )
    const mobile = await fixture('Shoot Log phone ' + kind)
    await page.setViewportSize({ width: 390, height: 844 })
    await open(mobile)
    const card = (i) => page.locator(`[data-log-card="${mobile.ids[i]}"]`)
    await card(0)
      .getByRole('button', { name: 'Actual start 10-A', exact: true })
      .click()
    sheet = page.getByRole('dialog', {
      name: 'Actual start 10-A',
      exact: true,
    })
    await sheet
      .getByRole('spinbutton', { name: 'Hour', exact: true })
      .fill('11')
    await sheet
      .getByRole('spinbutton', { name: 'Minute', exact: true })
      .fill('50')
    await sheet
      .getByRole('button', { name: 'AM or PM', exact: true })
      .click()
    await page
      .getByRole('menuitemradio', { name: 'PM', exact: true })
      .click()
    await snap('04-phone-time-sheet')
    await sheet
      .getByRole('button', { name: 'Record time', exact: true })
      .click()
    await page.waitForTimeout(300)
    await card(1)
      .getByRole('button', { name: 'Actual start 10-B', exact: true })
      .click()
    sheet = page.getByRole('dialog', {
      name: 'Actual start 10-B',
      exact: true,
    })
    await sheet
      .getByRole('spinbutton', { name: 'Hour', exact: true })
      .fill('12')
    await sheet
      .getByRole('spinbutton', { name: 'Minute', exact: true })
      .fill('10')
    await sheet
      .getByRole('button', { name: 'Shoot day', exact: true })
      .click()
    await page
      .getByRole('menuitemradio', { name: 'Next day', exact: true })
      .click()
    await sheet
      .getByRole('button', { name: 'Record time', exact: true })
      .click()
    await page.waitForTimeout(300)
    const night = await api('/flows/' + mobile.id + '/live')
    assert.equal(night.live.blocks[mobile.ids[0]].startMinute, 1430)
    assert.equal(night.live.blocks[mobile.ids[1]].startMinute, 1450)
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
    await snap('05-phone-cards')
    await page.setViewportSize({ width: 1024, height: 768 })
    await snap('06-tablet')
    assert.deepEqual(errors, [])
    fs.writeFileSync(
      out + '/shoot-log-records.json',
      JSON.stringify({ desktop: v, offline, mobile }),
    )
    console.log(
      kind +
        ': real Shoot Log desktop direct entry/Enter navigation/current-time shortcut; C before B/backfill/recalculated inferred intervals; optional confirmed finish; audit/history; shared preferred takes; explicit skip; refresh; two pending offline entries/reload/idempotent reconciliation; phone bottom-sheet AM/PM/midnight/card layout without horizontal scrolling; tablet; native three-view switching and no old banner passed.',
    )
  } catch (e) {
    await snap('failure')
    console.error((await page.locator('body').innerText()).slice(-1800))
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
