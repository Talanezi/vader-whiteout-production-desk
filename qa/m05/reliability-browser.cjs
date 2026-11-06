const fs = require('fs'),
  assert = require('assert/strict'),
  http = require('http'),
  path = require('path'),
  kind = process.env.M05_BROWSER || 'chromium',
  pw = require(
    kind === 'webkit'
      ? '/tmp/m05/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  f = JSON.parse(fs.readFileSync('/tmp/m05/refinement/fixture.json')),
  root = 'http://127.0.0.1:5176/productiondesk/#',
  out = '/tmp/m05/refinement/' + kind
;(async () => {
  const browser = await pw[kind].launch(),
    ctx = await browser.newContext({
      viewport: { width: 1450, height: 1000 },
    })
  await ctx.addInitScript(
    (t) => localStorage.setItem('token', t),
    auth.tokens['103'],
  )
  const p = await ctx.newPage()
  p.setDefaultTimeout(25000)
  try {
    let status = 503,
      attempts = 0
    await ctx.route('**/api/shotlists', async (r) => {
      attempts++
      if (status === 0) return r.abort('namenotresolved')
      return r.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          message:
            status === 403
              ? 'Verified production membership is required.'
              : 'Unavailable',
        }),
      })
    })
    await p.goto(root + '/shotlists')
    await p
      .getByRole('heading', {
        name: 'Shot lists unavailable',
        exact: true,
      })
      .waitFor()
    assert.equal(attempts, 3)
    assert.equal(
      await p.evaluate(() => localStorage.getItem('token')),
      auth.tokens['103'],
    )
    status = 403
    attempts = 0
    await p.getByRole('button', { name: 'Try again', exact: true }).click()
    await p
      .getByText('Verified production membership is required.', {
        exact: true,
      })
      .waitFor()
    assert.equal(attempts, 1)
    status = 0
    await p.getByRole('button', { name: 'Try again', exact: true }).click()
    await p
      .getByText(
        'Unable to reach the service. Check your connection, then retry.',
        { exact: true },
      )
      .waitFor()
    await ctx.unroute('**/api/shotlists')
    await p.getByRole('button', { name: 'Try again', exact: true }).click()
    await p
      .getByRole('table', { name: 'Production shot lists', exact: true })
      .waitFor()
    await p.goto(root + '/shotlists/' + f.listId)
    await p.locator('tr[data-shot]').first().waitFor()
    await ctx.setOffline(true)
    await p.waitForTimeout(400)
    const first = p.locator(`[data-shot="${f.shotIds[0]}"]`)
    await first.getByRole('checkbox').check()
    await p.getByRole('button', { name: 'Row color', exact: true }).click()
    await p.getByRole('menuitem', { name: 'Teal', exact: true }).click()
    const key = 'whiteout:pending-yjs:103:shotlists:' + f.listId
    await p.waitForFunction((k) => !!localStorage.getItem(k), key)
    await ctx.setOffline(false)
    await p.reload()
    await first.waitFor()
    await p.waitForFunction((k) => !localStorage.getItem(k), key)
    assert.equal(await first.getAttribute('data-colored'), 'true')
    await p.screenshot({ path: out + '/reliability-recovered.png' })
    const c = await browser.newContext()
    await c.addInitScript(
      (t) => {if(!sessionStorage.getItem('qa-scheduler-auth')){localStorage.setItem('token',t);sessionStorage.setItem('qa-scheduler-auth','yes')}},
      auth.tokens['103'],
    )
    const q = await c.newPage()
    let fail = true
    await c.route(
      'https://scheduler-api.vaderwhiteout.com/api/**',
      (r) => {
        const url = new URL(r.request().url())
        if (url.pathname === '/api/server-info')
          return fail
            ? r.abort('namenotresolved')
            : r.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                  googleOAuth2IsSupported: false,
                  microsoftOAuth2IsSupported: false,
                }),
              })
        return r.fulfill({
          status: 503,
          contentType: 'application/json',
          body: '{}',
        })
      },
    )
    const dir = '/tmp/whiteout-scheduler-client-reliability/build',
      server = http.createServer((req, res) => {
        const rel =
            new URL(req.url, 'http://localhost').pathname.replace(
              /^\/scheduler\/?/,
              '',
            ) || 'index.html',
          file = path.resolve(dir, rel)
        if (!file.startsWith(dir + '/') || !fs.existsSync(file)) {
          res.writeHead(404)
          return res.end()
        }
        res.setHeader(
          'Content-Type',
          file.endsWith('.js')
            ? 'text/javascript'
            : file.endsWith('.css')
              ? 'text/css'
              : 'text/html',
        )
        fs.createReadStream(file).pipe(res)
      })
    await new Promise((r) => server.listen(5178, '127.0.0.1', r))
    try {
      await q.goto(
        'http://127.0.0.1:5178/scheduler/#/login?returnTo=%2Fproductiondesk%2F',
      )
      await q
        .getByRole('heading', {
          name: 'Unable to reach Scheduler',
          exact: true,
        })
        .waitFor()
      assert.equal(
        await q.evaluate(() => localStorage.getItem('token')),
        auth.tokens['103'],
      )
      fail = false
      await q
        .getByRole('button', { name: 'Try again', exact: true })
        .click()
      await q.getByRole('textbox', { name: /email/i }).waitFor()
      assert((await q.url()).includes('returnTo='))
      await q.screenshot({ path: out + '/scheduler-recovery.png' })
      await q.evaluate(()=>localStorage.removeItem('token'))
      await q.goto('about:blank')
      await q.goto('http://127.0.0.1:5178/scheduler/#/login?returnTo=%2Fproductiondesk%2F&token=invalid-fixture&nonce=wrong-fixture')
      await q.getByRole('alert').filter({hasText:'Sign-in could not be verified. Please try again.'}).waitFor()
      assert.equal(await q.evaluate(()=>localStorage.getItem('token')),null)
      assert(!(await q.url()).includes('invalid-fixture'))
    } finally {
      server.closeAllConnections()
      server.close()
      await c.close()
    }
    console.log(
      kind +
        ': real request 503 bounded retry, 403 no retry, DNS failure classification, recoverable index; offline Yjs delta survives reload and durable confirmation; Scheduler DNS outage preserves session/return destination and recovers through Retry passed.',
    )
  } catch (e) {
    await p.screenshot({ path: out + '/reliability-failure.png' })
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
