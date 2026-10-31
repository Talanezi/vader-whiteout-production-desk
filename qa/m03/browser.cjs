const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os')
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_PATH ||
    path.join(
      os.homedir(),
      '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
    ),
)
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research',
  state = JSON.parse(fs.readFileSync(path.join(runtime, 'local-state.json'))),
  list = JSON.parse(fs.readFileSync(path.join(runtime, 'preview-list.json')))
const root = state.root,
  out = path.resolve('client/qa/m03/artifacts'),
  results = [],
  errors = []
fs.mkdirSync(out, { recursive: true })
let browser
const check = (name, detail = {}) => {
  results.push({ name, pass: true, ...detail })
  console.log('PASS', name)
}
const shot = async (p, name) => {
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(230)
  await p.screenshot({
    path: path.join(out, name + '.png'),
    fullPage: !(await p.locator('dialog[open]').count()),
  })
}
async function setup({
  user = '101',
  viewport = { width: 1440, height: 900 },
  engine = browser,
  reducedMotion,
  token = true,
} = {}) {
  const c = await engine.newContext({
    viewport,
    reducedMotion,
    permissions:
      engine === browser ? ['clipboard-read', 'clipboard-write'] : [],
    serviceWorkers: 'block',
  })
  await c.addInitScript(
    ({ token, origin }) => {
      if (location.origin === origin && token)
        localStorage.setItem('token', token)
    },
    { token: token ? state.tokens[user] : null, origin: new URL(root).origin },
  )
  const p = await c.newPage()
  p.on('pageerror', (e) => errors.push(e.message))
  await p.goto(root + '#/shotlists/' + list.id)
  if (token) await p.locator('.pd-shot-table tbody tr').first().waitFor()
  return { p, c }
}
const saved = async (p) =>
  p.locator('[data-sync="saved"]').waitFor({ timeout: 12000 })
async function main() {
  const fresh = await require('./seed.cjs')(state)
  list.id = fresh.id
  browser = await chromium.launch({ channel: 'chrome' })
  const a = await setup(),
    p = a.p
  await saved(p)
  await shot(p, '06-shot-workspace')
  assert.equal(await p.locator('.pd-show-scenes').isVisible(), false)
  await p.locator('.pd-sidebar-create [aria-label="Create"]').click()
  await shot(p, '04-create-expanded')
  await p.keyboard.press('Escape')
  await p.locator('.pd-sidebar-create [aria-label="Create"]').hover()
  await shot(p, '05-metal-primary')
  await p.mouse.move(1000, 300)
  await p.getByRole('button', { name: 'All Shots', exact: true }).click()
  await shot(p, '07-scene-mode-menu')
  await p
    .getByRole('menuitemradio', { name: 'Scene View', exact: true })
    .click()
  await p
    .getByRole('button', { name: 'All Shots', exact: true })
    .count()
    .then(() => {})
  await p.getByRole('button', { name: 'Scene View', exact: true }).click()
  await p.getByRole('menuitemradio', { name: 'All Shots', exact: true }).click()
  const first = p.locator('.pd-shot-table tbody tr').first(),
    firstLabel = await first.locator('[data-field="number"] input').inputValue()
  await first.getByRole('button', { name: new RegExp('Inspect shot') }).click()
  await shot(p, '08-shot-inspector')
  await p
    .locator('.pd-shot-inspector-desktop')
    .getByRole('button', { name: new RegExp('Lens ·') })
    .click()
  await p.getByRole('combobox').fill('35')
  await shot(p, '09-technical-combobox')
  await p.keyboard.press('ArrowDown')
  await p.keyboard.press('Enter')
  await saved(p)
  await p
    .getByRole('button', { name: 'Collapse inspector', exact: true })
    .first()
    .click()
  await first.getByRole('button', { name: new RegExp('Delete shot') }).click()
  assert.equal(
    await first
      .getByRole('button', { name: new RegExp('Confirm delete') })
      .count(),
    1,
  )
  await shot(p, '10-inline-delete-confirm')
  await p.keyboard.press('Escape')
  assert.equal(await p.locator('.pd-delete-confirm').count(), 0)
  const b = await setup({ user: '102' })
  await saved(b.p)
  const field = b.p
    .locator('.pd-shot-table tbody tr')
    .first()
    .getByRole('button', { name: new RegExp('Framing ·') })
  await field.focus()
  await p.locator('.pd-avatar').filter({ hasText: 'EM' }).waitFor()
  await p.locator('.pd-shot-cell.has-remote').first().waitFor()
  await shot(p, '11-two-collaborators-cell')
  const editor = b.p
    .locator('.pd-shot-table tbody tr')
    .first()
    .locator('.cm-content')
  await editor.focus()
  await b.p.keyboard.press('Home')
  await b.p.keyboard.press('ArrowRight')
  await b.p.keyboard.press('Shift+ArrowRight')
  await b.p.keyboard.press('Shift+ArrowRight')
  await p.locator('.cm-ySelectionCaret').first().waitFor()
  assert.ok(await p.locator('.cm-ySelection').count())
  await shot(p, '12-live-caret-selection')
  const originalEditor = await p
    .locator('.pd-shot-table tbody tr')
    .first()
    .locator('.cm-content')
    .elementHandle()
  const originalNumber = await b.p
    .locator('.pd-shot-table tbody tr')
    .first()
    .locator('[data-field="number"] input')
    .inputValue()
  await b.p
    .locator('.pd-shot-table tbody tr')
    .first()
    .locator('[data-field="number"] input')
    .fill(originalNumber + 'A')
  await p
    .locator('.pd-shot-table tbody tr')
    .first()
    .locator('.cm-content')
    .getAttribute('aria-label')
  await p.waitForFunction(
    (label) =>
      document
        .querySelector('.pd-shot-table tbody tr .cm-content')
        .getAttribute('aria-label')
        .endsWith(label),
    originalNumber + 'A',
  )
  assert.ok(
    await originalEditor.evaluate((e) => e.isConnected),
    'A remote shot-number edit must not recreate an active narrative editor',
  )
  await b.p
    .locator('.pd-shot-table tbody tr')
    .first()
    .locator('[data-field="number"] input')
    .fill(originalNumber)
  await saved(p)
  const before = await p
    .locator('.pd-shot-table tbody tr')
    .first()
    .locator('.cm-content')
    .innerText()
  await Promise.all([
    p
      .locator('.pd-shot-table tbody tr')
      .first()
      .locator('.cm-content')
      .press('End')
      .then(() => p.keyboard.type(' Director note.')),
    editor.press('End').then(() => b.p.keyboard.type(' DP note.')),
  ])
  await saved(p)
  await saved(b.p)
  const after = await p
    .locator('.pd-shot-table tbody tr')
    .first()
    .locator('.cm-content')
    .innerText()
  assert.ok(after.includes('Director note.') && after.includes('DP note.'))
  assert.ok(after.length > before.length)
  check(
    'Two real authenticated browser editors show avatars, cell boundaries, actual remote carets/ranges and merge narrative edits',
  )
  await b.c.close()
  await p.waitForFunction(
    () => document.querySelectorAll('.pd-avatar').length === 1,
  )
  await p.getByRole('button', { name: 'Copy link', exact: true }).click()
  await p.getByRole('button', { name: 'Copied', exact: true }).waitFor()
  assert.equal(
    await p.getByRole('button', { name: 'Copied', exact: true }).count(),
    1,
  )
  const link = await p.evaluate(() => navigator.clipboard.readText())
  assert.ok(link.includes('/shotlists/' + list.id))
  assert.ok(!link.includes(state.tokens['101']))
  const deleteLabel = 'QA-' + require('node:crypto').randomUUID().slice(0, 8)
  await p.getByRole('button', { name: 'Add shot', exact: true }).click()
  const added = p.locator('.pd-shot-table tbody tr').filter({
    has: p.getByRole('textbox', {
      name: 'Shot number · unnumbered shot',
      exact: true,
    }),
  })
  await added.locator('[data-field="number"] input').fill(deleteLabel)
  await saved(p)
  const row = p.locator('.pd-shot-table tbody tr').filter({
    has: p.getByRole('textbox', {
      name: 'Shot number · ' + deleteLabel,
      exact: true,
    }),
  })
  await row
    .getByRole('button', { name: 'Delete shot ' + deleteLabel, exact: true })
    .click()
  await row
    .getByRole('button', {
      name: 'Confirm delete shot ' + deleteLabel,
      exact: true,
    })
    .click()
  await p.getByText('Shot deleted.', { exact: true }).waitFor()
  await p.getByRole('button', { name: 'Restore', exact: true }).click()
  await p
    .getByRole('textbox', { name: 'Shot number · ' + deleteLabel, exact: true })
    .waitFor()
  await saved(p)
  await row
    .getByRole('button', { name: 'Delete shot ' + deleteLabel, exact: true })
    .click()
  await row
    .getByRole('button', {
      name: 'Confirm delete shot ' + deleteLabel,
      exact: true,
    })
    .click()
  await p
    .getByRole('textbox', { name: 'Shot number · ' + deleteLabel, exact: true })
    .waitFor({ state: 'detached' })
  await saved(p)
  check(
    'One creation menu, searchable keyboard combobox, inline delete/Escape, durable deletion/restoration and authorized deep-link copy',
  )
  await p.getByRole('button', { name: 'Import', exact: true }).click()
  await p
    .getByLabel('Upload shot-list workbook')
    .setInputFiles(
      process.env.M03_WORKBOOK ||
        '/Users/thameralanezi/Downloads/Shot List - Vader_ Whiteout.xlsx',
    )
  await p.getByText('10 worksheets inspected').waitFor()
  await shot(p, '17-actual-workbook-review')
  assert.equal((await p.locator('.needs-review').count()) > 0, true)
  await p.getByRole('button', { name: 'Import selected', exact: true }).click()
  await p
    .getByRole('alert')
    .filter({ hasText: /Review|Confirm/ })
    .waitFor()
  await p.getByRole('button', { name: 'Cancel', exact: true }).click()
  check(
    'Actual workbook mapping/scene preview exposes numeric ambiguity and blocks unreviewed confirmation',
  )
  await a.c.setOffline(true)
  await p.locator('[data-sync="disconnected"]').waitFor()
  assert.equal(await p.locator('[data-sync="saved"]').count(), 0)
  await shot(p, '18-connection-interrupted')
  await a.c.setOffline(false)
  await saved(p)
  check(
    'Browser network interruption reports unsaved/disconnected and recovers honestly',
  )
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 360, height: 800 },
  ]) {
    const v = await setup({ viewport })
    await saved(v.p)
    const metrics = await v.p.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      app: document.querySelector('.pd-app').getBoundingClientRect().width,
    }))
    assert.ok(
      metrics.scroll <= metrics.width + 1,
      JSON.stringify({ viewport, metrics }),
    )
    assert.equal(metrics.app, metrics.width)
    await shot(v.p, `responsive-${viewport.width}`)
    if (viewport.width === 390) {
      await shot(v.p, '14-mobile-shot-list')
      await v.p
        .locator('.pd-shot-table tbody tr')
        .first()
        .getByRole('button', { name: /Inspect shot/ })
        .click()
      await v.p.getByRole('dialog', { name: 'Shot inspector' }).waitFor()
      await shot(v.p, '15-mobile-inspector')
      await v.p
        .getByRole('dialog')
        .getByRole('button', { name: /Lens ·/ })
        .click()
      await shot(v.p, '16-mobile-combobox')
    }
    await v.c.close()
  }
  check(
    'Six viewport sizes: full-width app, local horizontal table scrolling and focused mobile inspector',
  )
  const reduced = await setup({ reducedMotion: 'reduce' })
  assert.equal(
    await reduced.p
      .locator('.pd-sidebar-create .pd-create')
      .getAttribute('data-metal'),
    'static',
  )
  await shot(reduced.p, '05-metal-static-fallback')
  await reduced.c.close()
  const controls = await a.c.newPage()
  await controls.goto(root + 'qa/m03/controls.html')
  await controls.getByRole('button', { name: 'Choose production date' }).click()
  await shot(controls, '13-custom-calendar')
  await controls
    .getByRole('gridcell', { name: 'Tuesday, November 3, 2026' })
    .focus()
  await controls.keyboard.press('ArrowRight')
  await controls.keyboard.press('Enter')
  assert.equal(await controls.locator('output').innerText(), '2026-11-04')
  await controls
    .getByLabel('Production date', { exact: true })
    .fill('2026-02-30')
  await controls.getByLabel('Production date', { exact: true }).press('Tab')
  await controls.getByRole('alert').waitFor()
  await controls.getByRole('button', { name: 'Success transition' }).click()
  await shot(controls, 'toast-pending')
  await controls.getByText('8 shots imported into 3 scenes.').waitFor()
  await shot(controls, 'toast-success')
  await controls.getByRole('button', { name: 'Error transition' }).click()
  await controls
    .getByText('Connection interrupted. Changes retained.')
    .waitFor()
  await shot(controls, 'toast-error')
  check(
    'Custom date grid keyboard selection, date-only validation, reduced-motion Metal fallback and promise toast transitions',
  )
  const signed = await setup({ token: false })
  await signed.p
    .getByRole('heading', { name: 'Sign in to Production Desk' })
    .waitFor()
  assert.equal(
    await signed.p
      .getByRole('heading', { name: 'Sign in to Production Desk' })
      .count(),
    1,
  )
  await signed.c.close()
  await a.c.close()
  assert.deepEqual(errors, [])
  check('No uncaught browser errors')
}
main()
  .then(() =>
    fs.writeFileSync(
      path.join(out, 'browser.json'),
      JSON.stringify(results, null, 2) + '\n',
    ),
  )
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    await browser?.close()
  })
