#!/usr/bin/env node
// Visible, isolated browser only. No fixture endpoint or frontend route exists.
const { createFixturePage } = require('./browser-harness.cjs')
const path = require('node:path')
const os = require('node:os')
let browser
function playwright() {
  if (process.env.PLAYWRIGHT_PATH) return require(process.env.PLAYWRIGHT_PATH)
  try {
    return require('playwright')
  } catch {
    return require(
      path.join(
        os.homedir(),
        '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
      ),
    )
  }
}
const root =
  process.env.PD_PREVIEW_URL || 'http://127.0.0.1:5174/productiondesk/'
const url = new URL(root)
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  !['http:', 'https:'].includes(url.protocol) ||
  url.username ||
  url.password
) {
  throw new Error('Fixture preview requires a loopback-only URL.')
}
;(async () => {
  const response = await fetch(root).catch(() => {
    throw new Error(
      'Local frontend is not running. Start Vite first; see client/qa/m02/README.md.',
    )
  })
  if (!response.ok)
    throw new Error(
      `Local frontend returned ${response.status}. Start the Vite preview first; see README.md.`,
    )
  const { chromium } = playwright()
  browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--window-size=1440,1000'],
  })
  const context = await browser.newContext({
    viewport: null,
    serviceWorkers: 'block',
  })
  // A fresh non-persistent context never reads or writes the user's real profile.
  // Block every external navigation/request except the existing brand font files.
  await context.route('**/*', (route) => {
    const request = route.request(),
      target = new URL(request.url())
    if (
      target.origin === url.origin ||
      (request.method() === 'GET' &&
        ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(target.hostname))
    )
      return route.continue()
    return route.abort('blockedbyclient')
  })
  await context.addInitScript(() => {
    document.addEventListener(
      'DOMContentLoaded',
      () => {
        document.title = 'Fixture preview · Production Desk'
        const badge = document.createElement('div')
        badge.textContent = 'LOCAL FIXTURES · changes stay in this window'
        badge.setAttribute('role', 'note')
        Object.assign(badge.style, {
          position: 'fixed',
          bottom: '12px',
          right: '12px',
          zIndex: '1000',
          background: '#10151e',
          color: '#a9b4c3',
          border: '1px solid #293746',
          borderRadius: '5px',
          padding: '7px 10px',
          font: '10px Inter,system-ui,sans-serif',
          pointerEvents: 'none',
        })
        document.body.appendChild(badge)
      },
      { once: true },
    )
  })
  const { p } = await createFixturePage(browser, {
    context,
    root,
    onError: (error) => console.error('Preview error:', error.message),
  })
  await p.locator('.pd-table tbody tr, .pd-template').first().waitFor()
  if (process.env.PD_PREVIEW_SCREENSHOT)
    await p.screenshot({ path: process.env.PD_PREVIEW_SCREENSHOT })
  console.log(`Interactive fixture preview: ${root}`)
  console.log(
    'Use Call sheets, Roster, menus, person editor and New call sheet normally.',
  )
  console.log(
    'All API requests are intercepted in memory. Restart to reset. Close the browser or press Ctrl+C to exit.',
  )
  let closing = false
  const close = async () => {
    if (closing) return
    closing = true
    await browser.close()
  }
  process.on('SIGINT', close)
  process.on('SIGTERM', close)
  await new Promise((resolve) => browser.on('disconnected', resolve))
})().catch(async (error) => {
  await browser?.close().catch(() => {})
  console.error(error.message)
  process.exitCode = 1
})
