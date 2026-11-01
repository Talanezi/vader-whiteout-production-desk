const { state, out, api, create } = require('./helpers.cjs'),
  assert = require('node:assert/strict'),
  path = require('node:path'),
  { chromium } = require(
    process.env.PLAYWRIGHT_PATH ||
      '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  )
;(async () => {
  const list = await create(
    'M03.2 index metadata ' + crypto.randomUUID().slice(0, 8),
  )
  await api('/' + list.id + '/import', {
    batchId: crypto.randomUUID(),
    scenes: [],
    schedule: [
      { date: '2027-05-31', title: 'Day 1', rows: [{ number: '16-A' }] },
      { date: '2027-06-02', title: 'Pickups', rows: [{ number: '16-A' }] },
    ],
  })
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    await ctx.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens[101],
    )
    const p = await ctx.newPage()
    await p.goto(state.root + '#/shotlists')
    const row = p.getByRole('link').filter({ hasText: list.name })
    await row.getByText('3 scenes · 8 shots', { exact: true }).waitFor()
    assert.ok((await row.innerText()).includes('2027'))
    await p.screenshot({ path: path.join(out, '17-shot-list-index.png') })
    console.log(
      'PASS actual saved scene/shot counts and assigned date range in Shot Lists index',
    )
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
