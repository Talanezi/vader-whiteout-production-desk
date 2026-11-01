/* Isolated browser QA. Supply PLAYWRIGHT_PATH; no runtime dependency is added. */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')
const assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path')
const { createFixturePage } = require('./browser-harness.cjs')
const ROOT =
  process.env.PD_PREVIEW_URL || 'http://127.0.0.1:5174/productiondesk/'
const OUT = process.env.PD_QA_OUTPUT || path.join(__dirname, 'artifacts')
fs.mkdirSync(OUT, { recursive: true })
const results = [],
  errors = []
let browser
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
function check(name, detail) {
  results.push({ name, pass: true, ...detail })
  console.log('PASS', name)
}
async function shot(p, name) {
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(260)
  if (!p.viewportSize()) {
    // Chrome's clip coordinates are unzoomed DIPs on a Retina display.
    const session = await p.context().newCDPSession(p),
      metrics = await session.send('Page.getLayoutMetrics'),
      view = metrics.cssVisualViewport,
      zoom = view.zoom || 1
    const image = await session.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: {
        x: 0,
        y: 0,
        width: view.clientWidth * zoom,
        height: view.clientHeight * zoom,
        scale: 1 / zoom,
      },
    })
    fs.writeFileSync(
      path.join(OUT, name + '.png'),
      Buffer.from(image.data, 'base64'),
    )
    await session.detach()
    return
  }
  await p.screenshot({
    path: path.join(OUT, name + '.png'),
    fullPage: !(await p.locator('dialog[open]').count()),
  })
}

async function setup(options = {}) {
  return createFixturePage(browser, {
    root: ROOT,
    onError: (e) => errors.push(e.message),
    ...options,
  })
}

function hold(state, method, api) {
  let release
  const promise = new Promise((r) => (release = r))
  state.hold = { method, api, promise }
  return () => {
    state.hold = null
    release()
  }
}
async function roster(p) {
  await p.goto(ROOT + '#/roster')
  await p.locator('.pd-roster tbody tr').first().waitFor()
}
async function tableReady(p) {
  await p
    .getByRole('link', { name: 'Camera & lighting test', exact: true })
    .waitFor()
}
async function assertLayout(p, label) {
  await p.waitForTimeout(260)
  const result = await p.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    main: document.querySelector('main').getBoundingClientRect().toJSON(),
    dialogs: [...document.querySelectorAll('dialog[open]')].map((n) =>
      n.getBoundingClientRect().toJSON(),
    ),
  }))
  assert.ok(
    result.scroll <= result.width,
    `${label}: page overflow ${result.scroll}/${result.width}`,
  )
  for (const d of result.dialogs)
    assert.ok(
      d.x >= -1 && d.right <= result.width + 1,
      `${label}: dialog clipped`,
    )
  return result
}
async function testDashboard() {
  const { c, p, state } = await setup()
  await tableReady(p)
  await shot(p, '01-dashboard')
  assert.equal(await p.getByRole('button',{name:'All statuses',exact:true}).count(),0)
  assert.equal(await p.getByRole('columnheader',{name:'Status',exact:true}).count(),0)
  await p
    .getByRole('searchbox', { name: 'Search call sheets' })
    .fill('observatory')
  assert.equal(await p.locator('.pd-documents tbody tr').count(), 1)
  await p.getByRole('button', { name: 'Clear search call sheets' }).click()
  await p.getByRole('searchbox').fill('no-matching-document')
  await p.getByRole('heading', { name: 'No matching call sheets' }).waitFor()
  await p.getByRole('button', { name: 'Clear search and filters' }).click()
  await p.getByRole('button', { name: 'Production date', exact: true }).click()
  await p.getByRole('menuitemradio', { name: 'Title A–Z', exact: true }).click()
  assert.match(
    await p.locator('.pd-documents tbody tr').first().innerText(),
    /Camera/,
  )
  const actions = () =>
    p.getByRole('button', {
      name: 'Actions for Camera & lighting test',
      exact: true,
    })
  await actions().click()
  await shot(p, '03-document-menu')
  await p
    .getByRole('menuitem', { name: 'Duplicate call sheet', exact: true })
    .click()
  await p
    .getByRole('link', { name: 'Camera & lighting test (copy)', exact: true })
    .waitFor()
  assert.equal(state.docs.length, 7)
  await actions().click()
  const download = p.waitForEvent('download')
  await p.getByRole('menuitem', { name: 'Download PDF', exact: true }).click()
  assert.equal((await download).suggestedFilename(), 'camera-lighting-test.pdf')
  await actions().click()
  await p
    .getByRole('menuitem', { name: 'Delete call sheet', exact: true })
    .click()
  await p.getByRole('dialog', { name: 'Delete this call sheet?' }).waitFor()
  assert.equal(state.docs.length, 7)
  await shot(p, '07-delete-confirmation')
  await p.getByRole('button', { name: 'Cancel', exact: true }).click()
  assert.equal(state.docs.length, 7)
  assert.equal(
    await actions().evaluate((n) => n === document.activeElement),
    true,
  )
  await actions().click()
  await p
    .getByRole('menuitem', { name: 'Delete call sheet', exact: true })
    .click()
  state.fail = { method: 'DELETE', api: '/callsheets/d5' }
  await p.getByRole('button', { name: 'Delete', exact: true }).click()
  await p.getByRole('alert').waitFor()
  assert.equal(state.docs.length, 7)
  await p.getByRole('button', { name: 'Delete', exact: true }).click()
  await p.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(state.docs.length, 6)
  const dist = p.locator('.pd-distribution details').first()
  await dist.locator('summary').click()
  assert.match(await dist.innerText(), /confirmed/)
  check(
    'Call-sheet search, all statuses, sort, distribution details, duplicate, PDF, delete cancel/failure/retry, menu keys and return focus',
  )
  await p.getByRole('button', { name: 'Collapse sidebar' }).click()
  await p.getByRole('link', { name: 'Roster', exact: true }).click()
  assert.equal(
    await p
      .locator('.pd-app')
      .evaluate((n) => n.classList.contains('pd-collapsed')),
    true,
  )
  await p.reload()
  await p.getByRole('button', { name: 'Expand sidebar' }).waitFor()
  check('Sidebar collapse survives routes and reload')
  await c.close()
}
async function testRoster() {
  const { c, p, state } = await setup()
  await roster(p)
  await shot(p, '04-roster')
  await p.getByRole('button', { name: 'All categories', exact: true }).click()
  await shot(p, '05-category-menu')
  await p.getByRole('menuitemradio', { name: 'Crew', exact: true }).click()
  assert.equal(await p.locator('.pd-roster tbody tr').count(), 3)
  await p.getByRole('button', { name: 'Crew', exact: true }).click()
  await p
    .getByRole('menuitemradio', { name: 'All categories', exact: true })
    .click()
  await p.getByRole('searchbox', { name: 'Search roster' }).fill('maya.chen')
  assert.equal(await p.locator('.pd-roster tbody tr').count(), 1)
  await p.getByRole('button', { name: 'Clear search roster' }).click()
  await p.getByRole('button', { name: 'Add person', exact: true }).click()
  await p.locator('#person-name').waitFor()
  assert.equal(
    await p
      .locator('#person-name')
      .evaluate((n) => n === document.activeElement),
    true,
  )
  await shot(p, '06-person-drawer')
  for (let i = 0; i < 14; i++) await p.keyboard.press('Tab')
  assert.equal(
    await p.evaluate(() => !!document.activeElement.closest('dialog')),
    true,
  )
  await p.locator('#person-name').fill('QA New Person')
  await p.locator('#person-email').fill('qa@example.test')
  await p.getByRole('button', { name: 'Category: Other', exact: true }).click()
  await p.getByRole('menuitemradio', { name: 'Cast', exact: true }).click()
  assert.equal(await p.locator('#person-email').inputValue(), 'qa@example.test')
  await p.keyboard.press('Escape')
  await p.getByRole('dialog', { name: 'Discard unsaved changes?' }).waitFor()
  await p.getByRole('button', { name: 'Cancel', exact: true }).last().click()
  assert.equal(await p.locator('#person-name').inputValue(), 'QA New Person')
  state.fail = {
    method: 'POST',
    api: '/roster',
    message: 'Could not save right now.',
  }
  await p.getByRole('button', { name: 'Save person', exact: true }).click()
  await p.getByRole('alert').waitFor()
  assert.equal(await p.locator('#person-name').inputValue(), 'QA New Person')
  assert.equal(state.people.length, 6)
  const release = hold(state, 'POST', '/roster')
  const before = await p.locator('.pd-save-button').boundingBox()
  await p.getByRole('button', { name: 'Try again', exact: true }).click()
  await p.getByRole('button', { name: 'Saving…', exact: true }).waitFor()
  await shot(p, '08-saving')
  assert.equal(state.people.length, 6)
  await p.keyboard.press('Escape')
  assert.equal(
    await p.getByRole('dialog', { name: 'Add person', exact: true }).count(),
    1,
  )
  release()
  await p.getByRole('button', { name: 'Saved', exact: true }).waitFor()
  const after = await p.locator('.pd-save-button').boundingBox()
  assert.equal(Math.round(before.width), Math.round(after.width))
  await shot(p, '09-saved')
  assert.equal(state.people.length, 7)
  await p.getByRole('button', { name: 'Done', exact: true }).click()
  assert.equal(
    await p
      .getByRole('button', { name: 'Add person', exact: true })
      .evaluate((n) => n === document.activeElement),
    true,
  )
  await p.getByRole('button', { name: 'Maya Chen', exact: true }).click()
  await p.locator('#person-role').fill('Cinematographer')
  await p.getByRole('button', { name: 'Save person', exact: true }).click()
  await p.getByRole('button', { name: 'Saved', exact: true }).waitFor()
  await p.getByRole('button', { name: 'Done', exact: true }).click()
  assert.equal(
    state.people.find((x) => x.id === 'p1').roleOrDepartment,
    'Cinematographer',
  )
  const sw = p.getByRole('switch', {
    name: 'Deactivate Maya Chen',
    exact: true,
  })
  state.fail = { method: 'PUT', api: '/roster/p1' }
  await sw.click()
  await p.getByRole('alert').waitFor()
  assert.equal(await sw.getAttribute('aria-checked'), 'true')
  await sw.click()
  await p
    .getByRole('switch', { name: 'Activate Maya Chen', exact: true })
    .waitFor()
  assert.equal(state.people.find((x) => x.id === 'p1').active, false)
  await p
    .getByRole('button', { name: 'Actions for Jordan Lee', exact: true })
    .click()
  await p.getByRole('menuitem', { name: 'Delete person', exact: true }).click()
  assert.equal(state.people.length, 7)
  await p.getByRole('button', { name: 'Delete', exact: true }).click()
  await p.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(state.people.length, 6)
  // Dirty drawer dismissal must retain form until explicit discard; closing both modals must unlock scrolling.
  await p.getByRole('button', { name: 'Add person', exact: true }).click()
  await p.locator('#person-name').fill('Unsaved')
  await p.getByRole('button', { name: 'Close Add person', exact: true }).click()
  await p.getByRole('button', { name: 'Discard changes', exact: true }).click()
  await p.getByRole('dialog').waitFor({ state: 'hidden' })
  assert.equal(await p.evaluate(() => document.body.style.overflow), '')
  check(
    'Roster filtering, add/edit returned records, failed save retains form, pending/saved states, stable button width, focus containment/return, unsaved guard, active switch confirmation, delete, scroll recovery',
  )
  await p.getByRole('button', { name: 'Paste import', exact: true }).click()
  await p
    .locator('#roster-paste')
    .fill(
      'Imported Cast | actor | Lead | cast@example.test\nImport Fails | crew | Grip\nImported Other | unknown | Location',
    )
  assert.match(await p.locator('.pd-import-preview').innerText(), /Cast/)
  state.failedNames.add('Import Fails')
  await p.getByRole('button', { name: 'Import 3 people', exact: true }).click()
  await p
    .getByRole('button', { name: 'Retry remaining', exact: true })
    .waitFor()
  assert.equal(
    await p.locator('#roster-paste').inputValue(),
    'Import Fails | crew | Grip',
  )
  assert.equal(
    state.people.filter((x) => x.name.startsWith('Imported')).length,
    2,
  )
  await shot(p, '10-partial-import')
  state.failedNames.clear()
  await p.getByRole('button', { name: 'Retry remaining', exact: true }).click()
  await p.getByRole('button', { name: 'Imported', exact: true }).waitFor()
  assert.equal(state.people.filter((x) => x.name === 'Import Fails').length, 1)
  await p.getByRole('button', { name: 'Done', exact: true }).click()
  check(
    'Import preview, category normalization, partial successes retained, failed rows preserved, retry without confirmed duplicates',
  )
  await c.close()
}
async function testStates() {
  for (const [name, options] of [
    ['signed-out', { token: false }],
    ['expired-session', { status: 401 }],
    ['api-error', { status: 503 }],
    ['empty', { empty: true }],
    ['loading', { delay: 1500 }],
  ]) {
    const { c, p, state } = await setup(options)
    if (name === 'loading')
      await p
        .getByRole('status')
        .filter({ hasText: 'Loading call sheets' })
        .waitFor()
    else if (name === 'signed-out' || name === 'expired-session')
      await p
        .getByRole('heading', { name: 'Sign in to Production Desk' })
        .waitFor()
    else if (name === 'api-error')
      await p
        .getByRole('heading', { name: 'Call sheets couldn’t be loaded' })
        .waitFor()
    else await p.getByRole('heading', { name: 'No call sheets yet' }).waitFor()
    await shot(p, 'state-' + name)
    if (name === 'signed-out') {
      assert.equal(state.requests.length, 0)
      assert.match(
        await p.getByRole('link', { name: 'Sign in' }).getAttribute('href'),
        /returnTo=%2Fproductiondesk%2F/,
      )
    }
    if (name === 'api-error') {
      state.listStatus = 200
      await p.getByRole('button', { name: 'Try again' }).click()
      await tableReady(p)
    }
    await p.goto(ROOT + '#/roster')
    if (name === 'loading')
      await p
        .getByRole('status')
        .filter({ hasText: 'Loading production roster' })
        .waitFor()
    else if (name === 'signed-out' || name === 'expired-session')
      await p
        .getByRole('heading', { name: 'Sign in to Production Desk' })
        .waitFor()
    else if (name === 'empty')
      await p.getByRole('heading', { name: 'No people yet' }).waitFor()
    await c.close()
    check('Distinct state: ' + name)
  }
}
async function testResponsive() {
  const { c, p } = await setup()
  await tableReady(p)
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [1024, 768],
    [768, 1024],
    [390, 844],
    [360, 800],
  ]) {
    await p.setViewportSize({ width, height })
    await p.goto(ROOT)
    await tableReady(p)
    const dash = await assertLayout(p, `dashboard ${width}`)
    if (width <= 390) await shot(p, `mobile-dashboard-${width}`)
    await roster(p)
    const directory = await assertLayout(p, `roster ${width}`)
    if (width <= 390) await shot(p, `mobile-roster-${width}`)
    await p.getByRole('button', { name: 'Add person', exact: true }).click()
    await p.locator('#person-name').waitFor()
    await assertLayout(p, `drawer ${width}`)
    if (width <= 390) await shot(p, `mobile-person-editor-${width}`)
    await p.getByRole('button', { name: 'Cancel', exact: true }).click()
    if (width <= 768) {
      await p.getByRole('button', { name: 'Open navigation' }).click()
      assert.equal(
        await p
          .getByRole('dialog', { name: 'Production Desk', exact: true })
          .count(),
        1,
      )
      await p.keyboard.press('Escape')
      await p.getByRole('dialog').waitFor({ state: 'hidden' })
    }
    check(
      `Responsive dashboard, roster, drawer, navigation ${width}×${height}`,
      { dashboard: dash, roster: directory },
    )
  }
  await p.setViewportSize({ width: 390, height: 844 })
  await p.getByRole('button', { name: 'All categories', exact: true }).click()
  const menu = await p.getByRole('menu').boundingBox()
  assert.ok(menu.x >= 0 && menu.x + menu.width <= 390)
  await p.keyboard.press('Escape')
  await c.close()
}
async function testEditorAndTemplates() {
  const { c, p, state } = await setup()
  await p.goto(ROOT + '#/callsheets/new')
  await p
    .getByRole('heading', { name: 'New call sheet', exact: true })
    .waitFor()
  assert.equal(await p.locator('.pd-template').count(), 6)
  await shot(p, '11-new-call-sheet')
  // Every template uses its existing payload; a real POST response determines the editor route.
  for (let i = 0; i < 6; i++) {
    await p.goto(ROOT + '#/callsheets/new')
    await p.locator('.pd-template').nth(i).click()
    await p.waitForURL(/#\/callsheets\/created-\d+\/edit$/)
    await p.getByRole('button', { name: 'Save Draft', exact: true }).waitFor()
  }
  const editorRequests = state.requests.filter(
    (x) => x.method === 'POST' && x.api === '/callsheets',
  )
  assert.equal(editorRequests.length, 6)
  assert.equal(editorRequests[1].body.scenes[0].id, 'template-scene-test')
  assert.equal(editorRequests[5].body.castCalls[0].id, 'template-cast-read')
  await p.getByLabel('Autosave', { exact: true }).uncheck()
  // Existing field labels and controls are checked without changing editor markup.
  const input = p.locator('.builder-form input').first()
  await input.fill('Edited isolated call sheet')
  await p.getByRole('button', { name: 'Save Draft', exact: true }).click()
  await p.locator('.save-state-badge-saved').waitFor()
  const download = p.waitForEvent('download')
  await p.getByRole('button', { name: 'Download PDF', exact: true }).click()
  await download
  await p
    .getByRole('button', { name: /Distribution/ })
    .first()
    .click()
  await p
    .getByRole('button', { name: 'Send Test Email', exact: true })
    .waitFor()
  assert.equal(
    state.requests.some(
      (x) => x.api.endsWith('/email/send') || x.api.endsWith('/email/test'),
    ),
    false,
  )
  await shot(p, '12-editor-regression')
  await p.setViewportSize({ width: 390, height: 844 })
  await assertLayout(p, 'legacy editor mobile')
  await shot(p, '13-mobile-legacy-editor')
  await p.getByRole('button', { name: 'Open navigation' }).click()
  await p
    .getByRole('dialog')
    .getByRole('link', { name: 'Call sheets', exact: true })
    .click()
  await tableReady(p)
  check(
    'All six template POST payloads, existing editor route/fields/save/PDF/distribution/sidebar/mobile and return route; no emails',
  )
  await c.close()
}
async function testLongAndMotion() {
  const { c, p, state } = await setup({ reducedMotion: 'reduce' })
  state.people[0].name =
    'A very long production contact name that must remain readable without truncating the action controls'
  state.people[0].email =
    'very.long.production.contact.for.location.coordination@example-of-an-extremely-long-domain.test'
  await roster(p)
  await p.setViewportSize({ width: 360, height: 800 })
  await assertLayout(p, 'long content mobile')
  await shot(p, 'long-content-mobile')
  await p.getByRole('button', { name: 'All categories' }).click()
  assert.equal(
    await p
      .getByRole('menu')
      .evaluate((n) => getComputedStyle(n).animationName),
    'none',
  )
  await p.keyboard.press('Escape')
  await p.getByRole('button', { name: 'Add person', exact: true }).click()
  assert.equal(
    await p
      .getByRole('dialog')
      .evaluate((n) => getComputedStyle(n).animationName),
    'none',
  )
  await p.getByRole('button', { name: 'Cancel', exact: true }).click()
  check('Long names/emails, empty fields and reduced-motion overlays')
  await c.close()
  const touch = await setup({
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  })
  await tableReady(touch.p)
  await touch.p.getByRole('button', { name: 'Production date' }).tap()
  await touch.p.getByRole('menuitemradio', { name: 'Title A–Z', exact: true }).tap()
  assert.equal(await touch.p.locator('tbody tr').count(), 6)
  await touch.p.getByRole('button', { name: 'Open navigation' }).tap()
  await touch.p
    .getByRole('dialog')
    .getByRole('link', { name: 'Roster', exact: true })
    .tap()
  await touch.p.getByRole('button', { name: 'Add person', exact: true }).tap()
  await touch.p.locator('#person-name').fill('Touch fixture')
  await touch.p.getByRole('button', { name: 'Save person', exact: true }).tap()
  await touch.p.getByRole('button', { name: 'Saved', exact: true }).waitFor()
  check('Touch menu, mobile navigation and person save')
  await touch.c.close()
}
async function testNavigationGuard() {
  const { c, p, state } = await setup()
  await tableReady(p)
  await p.getByRole('link', { name: 'Roster', exact: true }).click()
  await p.locator('.pd-roster tbody tr').first().waitFor()
  await p.getByRole('button', { name: 'Add person', exact: true }).click()
  await p.locator('#person-name').fill('Unsaved navigation fixture')
  await p.evaluate(() => history.back())
  await p
    .getByRole('dialog', { name: 'Leave the roster?', exact: true })
    .waitFor()
  await p
    .getByRole('dialog', { name: 'Leave the roster?', exact: true })
    .getByRole('button', { name: 'Cancel', exact: true })
    .click()
  assert.equal(
    await p.locator('#person-name').inputValue(),
    'Unsaved navigation fixture',
  )
  assert.match(p.url(), /#\/roster$/)
  await p.evaluate(() => history.back())
  await p
    .getByRole('button', { name: 'Discard and leave', exact: true })
    .click()
  await tableReady(p)
  assert.equal(await p.evaluate(() => document.body.style.overflow), '')
  assert.equal(
    state.requests.some((x) => x.method === 'POST'),
    false,
  )
  await p.getByRole('link', { name: 'Roster', exact: true }).click()
  await p.getByRole('button', { name: 'Paste import', exact: true }).click()
  await p
    .locator('#roster-paste')
    .fill('Navigation import 1 | crew\nNavigation import 2 | cast')
  const release = hold(state, 'POST', '/roster')
  await p.getByRole('button', { name: 'Import 2 people', exact: true }).click()
  await p.getByRole('button', { name: /Importing/ }).waitFor()
  await p.evaluate(() => history.back())
  await p
    .getByRole('dialog', { name: 'Import in progress', exact: true })
    .waitFor()
  await p.getByRole('button', { name: 'Return to import', exact: true }).click()
  release()
  await p.getByRole('button', { name: 'Imported', exact: true }).waitFor()
  await p.getByRole('button', { name: 'Done', exact: true }).click()
  assert.equal(
    state.people.filter((x) => x.name.startsWith('Navigation import')).length,
    2,
  )
  check(
    'Browser Back guards unsaved person edits and pending imports; cancel retains contents, explicit discard navigates, imports complete once',
  )
  await c.close()
}

async function testNativeZoom() {
  const os = require('os')
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'whiteout-m02-zoom-'))
  const context = await chromium.launchPersistentContext(profile, {
    channel: 'chrome',
    headless: false,
    viewport: null,
    args: ['--window-size=1440,900'],
  })
  try {
    const { p } = await setup({ context })
    await tableReady(p)
    const before = await p.evaluate(() => ({
      width: innerWidth,
      dpr: devicePixelRatio,
    }))
    const settings = await context.newPage()
    await settings.goto('chrome://settings/appearance')
    await settings.locator('#zoomLevel').selectOption('2')
    await p.bringToFront()
    await p.reload()
    await tableReady(p)
    const after = await p.evaluate(() => ({
      width: innerWidth,
      dpr: devicePixelRatio,
    }))
    assert.equal(after.width, Math.round(before.width / 2))
    assert.equal(after.dpr, before.dpr * 2)
    await assertLayout(p, 'native zoom dashboard')
    await shot(p, 'zoom-200-dashboard')
    await roster(p)
    await assertLayout(p, 'native zoom roster')
    await p.getByRole('button', { name: 'Add person', exact: true }).click()
    await p.locator('#person-name').waitFor()
    await assertLayout(p, 'native zoom drawer')
    await p
      .getByRole('button', { name: 'Category: Other', exact: true })
      .click()
    await p.waitForTimeout(220)
    const box = await p.getByRole('menu').boundingBox(),
      vp = await p.evaluate(() => ({ w: innerWidth, h: innerHeight }))
    assert.ok(
      box.x >= 0 &&
        box.y >= 0 &&
        box.x + box.width <= vp.w + 1 &&
        box.y + box.height <= vp.h + 1,
    )
    await shot(p, 'zoom-200-drawer-menu')
    await p.keyboard.press('Escape')
    assert.equal(await p.getByRole('dialog').count(), 1)
    await p.keyboard.press('Escape')
    await p.getByRole('dialog').waitFor({ state: 'hidden' })
    check(
      'Native 200% Chrome zoom: dashboard/roster reflow and collision-aware menu within person drawer',
      { before, after },
    )
  } finally {
    await context.close()
  }
}

;(async () => {
  browser = await chromium.launch({ channel: 'chrome' })
  try {
    for (const [name, run] of [
      ['dashboard', testDashboard],
      ['roster', testRoster],
      ['states', testStates],
      ['responsive', testResponsive],
      ['editor', testEditorAndTemplates],
      ['motion', testLongAndMotion],
      ['zoom', testNativeZoom],
      ['navigation', testNavigationGuard],
    ])
      if (
        !process.env.PD_QA_GROUPS ||
        process.env.PD_QA_GROUPS.split(',').includes(name)
      )
        await run()
    assert.deepEqual(errors, [])
    check('No uncaught browser errors')
    fs.writeFileSync(
      path.join(OUT, 'verification.json'),
      JSON.stringify(results, null, 2),
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  fs.writeFileSync(
    path.join(OUT, 'verification-partial.json'),
    JSON.stringify(results, null, 2),
  )
  process.exit(1)
})
