const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict')
const runtime = process.env.M03_RUNTIME || '/tmp/m032/runtime',
  state = JSON.parse(fs.readFileSync(path.join(runtime, 'local-state.json'))),
  list = JSON.parse(fs.readFileSync(path.join(runtime, 'preview-list.json'))),
  out = path.resolve('client/qa/m032/artifacts')
assert.equal(new URL(state.api).hostname, '127.0.0.1')
;(async () => {
  const headers = {
    Authorization: 'Bearer ' + state.tokens['101'],
    'Content-Type': 'application/json',
  }
  const before = await fetch(`${state.api}/shotlists/${list.id}/export`, {
    headers,
  }).then((r) => r.json())
  const res = await fetch(`${state.api}/shotlists/${list.id}/pdf`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ profile: 'detailed' }),
  })
  assert.equal(res.status, 201, await res.clone().text())
  const pdf = Buffer.from(await res.arrayBuffer())
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF')
  fs.writeFileSync(path.join(out, 'coverage-detailed.pdf'), pdf)
  assert.deepEqual(
    await fetch(`${state.api}/shotlists/${list.id}/export`, { headers }).then(
      (r) => r.json(),
    ),
    before,
  )
  console.log(
    'PASS saved-snapshot PDF, nonmutating export, bytes=' + pdf.length,
  )
  const { chromium } = require(
    process.env.PLAYWRIGHT_PATH ||
      '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  )
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    })
    await context.addInitScript(
      (token) => localStorage.setItem('token', token),
      state.tokens['101'],
    )
    const page = await context.newPage(),
      errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(state.root + '#/shotlists/' + list.id)
    await page.locator('[data-sync="saved"]').waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: path.join(out, 'essentials.png') })
    assert.equal(
      await page.locator('.pd-pro-table tbody tr').count(),
      Object.values(before.shots).filter((s) => !s.deleted).length,
    )
    assert.deepEqual(errors, [])
    console.log('PASS grid rendered without browser errors')
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
