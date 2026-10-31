// Node-only fixture interception; never imported by the frontend.
const fixtures = require('./fixtures.cjs')
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function createFixturePage(
  browser,
  {
    token = true,
    empty = false,
    status = 200,
    delay = 0,
    viewport = { width: 1440, height: 900 },
    reducedMotion,
    hasTouch = false,
    context,
    root,
    onError,
  } = {},
) {
  const c =
    context ||
    (await browser.newContext({
      viewport,
      reducedMotion,
      hasTouch,
      isMobile: hasTouch,
      serviceWorkers: 'block',
    }))
  if (token)
    await c.addInitScript((origin) => {
      if (location.origin === origin)
        localStorage.setItem('token', 'm02-isolated-qa')
    }, new URL(root).origin)
  const p = await c.newPage()
  p.on('pageerror', (e) => onError?.(e))
  const state = {
    docs: empty ? [] : structuredClone(fixtures.docs),
    people: empty ? [] : structuredClone(fixtures.people),
    requests: [],
    fail: null,
    hold: null,
    failedNames: new Set(),
    listStatus: status,
    listDelay: delay,
  }
  await c.route('**/api/**', async (r) => {
    const q = r.request(),
      method = q.method(),
      api = new URL(q.url()).pathname.split('/api')[1],
      body = q.postDataJSON()
    state.requests.push({ method, api, body })
    if (api.includes('/email/') && method === 'POST')
      return r.fulfill({
        status: 403,
        body: 'Email delivery is disabled in the local fixture preview.',
      })
    if (state.hold && state.hold.method === method && state.hold.api === api)
      await state.hold.promise
    if (state.fail && state.fail.method === method && state.fail.api === api) {
      const f = state.fail
      state.fail = null
      return r.fulfill({
        status: f.status || 500,
        body: f.message || 'The server could not complete this request.',
      })
    }
    if (method === 'GET' && ['/callsheets', '/roster'].includes(api)) {
      if (state.listDelay) await wait(state.listDelay)
      if (state.listStatus !== 200)
        return r.fulfill({
          status: state.listStatus,
          body: 'Service temporarily unavailable',
        })
      const items = api === '/callsheets' ? state.docs : state.people
      return r.fulfill({ json: { items, total: items.length } })
    }
    if (api === '/callsheets/email/config')
      return r.fulfill({
        json: {
          configured: false,
          provider: null,
          fromEmail: '',
          fromName: '',
        },
      })
    if (api.endsWith('/pdf'))
      return r.fulfill({
        contentType: 'application/pdf',
        body: Buffer.from('%PDF-1.4\n% isolated QA download\n%%EOF'),
      })
    if (method === 'POST' && api.endsWith('/duplicate')) {
      const original = state.docs.find((x) => x.id === api.split('/')[2]),
        copy = {
          ...structuredClone(original),
          id: 'copy-' + state.docs.length,
          title: original.title + ' (copy)',
        }
      state.docs.unshift(copy)
      return r.fulfill({ json: copy })
    }
    if (method === 'POST' && api === '/callsheets') {
      const saved = {
        ...structuredClone(fixtures.base),
        ...body,
        id: 'created-' + state.docs.length,
      }
      state.docs.unshift(saved)
      return r.fulfill({ json: saved })
    }
    if (method === 'POST' && api === '/roster') {
      if (state.failedNames.has(body.name))
        return r.fulfill({ status: 500, body: 'Import request failed' })
      const saved = { ...body, id: 'new-person-' + state.people.length }
      state.people.unshift(saved)
      return r.fulfill({ json: saved })
    }
    const list = api.startsWith('/roster/') ? state.people : state.docs,
      id = api.split('/')[2],
      index = list.findIndex((x) => x.id === id)
    if (index < 0) return r.fulfill({ status: 404, body: 'Fixture not found' })
    if (method === 'GET') return r.fulfill({ json: list[index] })
    if (method === 'PUT') {
      list[index] = { ...list[index], ...body }
      return r.fulfill({ json: list[index] })
    }
    if (method === 'DELETE') {
      list.splice(index, 1)
      return r.fulfill({ json: { ok: true, id } })
    }
    return r.fulfill({ status: 400, body: 'Unexpected fixture request' })
  })
  await p.goto(root)
  return { c, p, state }
}
module.exports = { createFixturePage }
