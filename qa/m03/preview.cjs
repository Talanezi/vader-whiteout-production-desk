// Visible local review of the actual collaboration server and local PostgreSQL.
const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os')
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research'
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ||
    path.join(
      os.homedir(),
      '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
    ),
)
async function main() {
  const state = JSON.parse(
      fs.readFileSync(path.join(runtime, 'local-state.json')),
    ),
    list = JSON.parse(fs.readFileSync(path.join(runtime, 'preview-list.json')))
  if (
    new URL(state.root).hostname !== '127.0.0.1' ||
    new URL(state.api).hostname !== '127.0.0.1'
  )
    throw new Error('Local QA URLs only.')
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
    args: ['--window-size=1440,1000'],
  })
  const context = await browser.newContext({
    viewport: null,
    serviceWorkers: 'block',
  })
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (
      ['127.0.0.1', 'localhost'].includes(url.hostname) ||
      (route.request().method() === 'GET' &&
        ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname))
    )
      return route.continue()
    return route.abort()
  })
  await context.addInitScript(
    ({ token, origin, name }) => {
      if (location.origin !== origin) return
      localStorage.setItem('token', token)
      document.addEventListener(
        'DOMContentLoaded',
        () => {
          const badge = document.createElement('div')
          badge.textContent = `LOCAL POSTGRESQL · ${name} · no production access`
          Object.assign(badge.style, {
            position: 'fixed',
            bottom: '8px',
            right: '8px',
            zIndex: '1000',
            font: '10px Inter,system-ui',
            color: '#a9b4c3',
            background: '#10151e',
            border: '1px solid #293746',
            borderRadius: '4px',
            padding: '7px',
            pointerEvents: 'none',
          })
          document.body.append(badge)
        },
        { once: true },
      )
    },
    {
      token: state.tokens[process.env.M03_USER || '101'],
      origin: new URL(state.root).origin,
      name: state.users.find(user=>String(user.userID)===(process.env.M03_USER||'101'))?.name||'QA identity',
    },
  )
  const page = await context.newPage()
  await page.goto(state.root + '#/shotlists/' + list.id)
  await page.locator('[data-sync="saved"]').waitFor()
  if(process.env.M03_PREVIEW_SCREENSHOT){await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:process.env.M03_PREVIEW_SCREENSHOT})}
  console.log(
    'Visible M03 local PostgreSQL preview ready. Resizing uses the real window viewport. Close Chrome or press Ctrl+C to stop.',
  )
  process.on('SIGINT', () => browser.close())
  process.on('SIGTERM', () => browser.close())
  await new Promise((resolve) => browser.on('disconnected', resolve))
}
main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
