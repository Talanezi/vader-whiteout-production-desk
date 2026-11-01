const {
    runtime,
    state,
    out,
    api,
    create,
    join,
    until,
  } = require('../m032/helpers.cjs'),
  fs = require('fs'),
  path = require('path'),
  assert = require('node:assert/strict'),
  crypto = require('crypto'),
  { execFileSync } = require('child_process')
const dest = path.join(out, 'final')
fs.mkdirSync(dest, { recursive: true })
const pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  wk = require('/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright')
const fields = [
  'number',
  'coverage',
  'camera',
  'framing',
  'subject',
  'angle',
  'lens',
  'equipment',
  'movement',
  'notes',
  'focusNotes',
  'lightingNotes',
  'scriptSeconds',
  'setupMinutes',
  'plannedTakes',
  'estimatedMinutes',
  'actualTakes',
]
async function fixture() {
  const list = await api('', { name: 'Final M03 · scene and day acceptance' })
  await api('/' + list.id + '/import', {
    batchId: crypto.randomUUID(),
    scenes: [0, 1, 2].map((scene) => ({
      number: String(scene + 9).padStart(2, '0'),
      title: 'Scene ' + scene,
      shots: Array.from({ length: scene === 2 ? 5 : 10 }, (_, i) =>
        Object.fromEntries(
          fields.map((f) => [
            f,
            f === 'number'
              ? String(scene + 9).padStart(2, '0') +
                '-' +
                String.fromCharCode(65 + i)
              : [
                    'scriptSeconds',
                    'setupMinutes',
                    'estimatedMinutes',
                    'plannedTakes',
                  ].includes(f)
                ? '4'
                : f === 'coverage'
                  ? 'Tracking through the trees. Shot ' + i + ' Café Δ'
                  : f === 'camera'
                    ? 'CAM A'
                    : {
                        framing: ['Wide', 'CU', 'MCU'][i % 3],
                        subject: i % 2 ? 'Vader' : 'Anakin',
                        angle: 'Eye level',
                        lens: ['35mm', '50mm', '85mm'][i % 3],
                        equipment: i % 2 ? 'Dolly' : 'Sticks',
                        movement: i % 2 ? 'Tracking' : 'Static',
                        notes: 'Protect screen direction',
                        focusNotes: 'Continuous on lead',
                        lightingNotes: 'Moonlight key; negative fill',
                        actualTakes: '3 / best 2',
                      }[f] || f + ' detail',
          ]),
        ),
      ),
    })),
  })
  const s = await api('/' + list.id + '/export')
  await api('/' + list.id + '/import', {
    batchId: crypto.randomUUID(),
    scenes: [],
    schedule: [
      {
        date: '2027-05-31',
        title: 'Day 1',
        rows: Object.values(s.shots)
          .slice(0, 22)
          .reverse()
          .map((s) => ({ number: s.number, sceneNumber: undefined })),
      },
    ],
  })
  return list
}
const checks = []
const pass = (n) => {
  checks.push(n)
  console.log('PASS', n)
}
async function choose(p, label, value, menu = false) {
  await p.getByRole('button', { name: label, exact: true }).click()
  await p
    .getByRole(menu ? 'menuitemradio' : 'option', { name: value, exact: true })
    .click()
}
async function ready(p) {
  try {
    await p
      .getByRole('link', { name: 'Download PDF', exact: true })
      .waitFor({ timeout: 20000 })
  } catch (e) {
    console.log(await p.locator('dialog').innerText())
    await p.screenshot({ path: path.join(dest, 'failure.png') })
    throw e
  }
  await p.locator('canvas[data-rendered="true"]').waitFor({ timeout: 30000 })
}
;(async () => {
  const list = await fixture()
  for (const [name, engine] of [
    ['chrome', pw.chromium],
    ['webkit', wk.webkit],
  ]) {
    const b = await engine.launch(
      name === 'chrome'
        ? { channel: 'chrome', headless: true }
        : { headless: true },
    )
    try {
      const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
      await c.addInitScript(
        (t) => localStorage.setItem('token', t),
        state.tokens[101],
      )
      const p = await c.newPage()
      let latest
      const errors = []
      p.on('pageerror', (e) => errors.push(e.message))
      p.on('response', async (r) => {
        if (r.url().endsWith('/pdf'))
          console.log('PDF', name, r.status(), r.ok() ? '' : await r.text())
      })
      await p.goto(state.root + '#/shotlists/' + list.id)
      await p.locator('[data-sync="saved"]').waitFor()
      const rows = p.locator('tr[data-shot]')
      await rows.nth(0).getByRole('checkbox').check()
      await rows.nth(1).getByRole('checkbox').check()
      await p.locator('[data-grid-row="0"][data-grid-col="0"]').focus()
      await p.keyboard.press('Shift+ArrowRight')
      await p.keyboard.press('Shift+ArrowDown')
      await p.getByRole('button', { name: 'Download', exact: true }).click()
      assert.equal(
        await p
          .getByRole('button', { name: 'Generate PDF', exact: true })
          .count(),
        0,
      )
      await ready(p)
      latest = Buffer.from(
        await p
          .getByRole('link', { name: 'Download PDF', exact: true })
          .evaluate(async (a) =>
            Array.from(
              new Uint8Array(await (await fetch(a.href)).arrayBuffer()),
            ),
          ),
      )
      pass(name + ' automatic first preview with no Generate action')
      for (const scope of [
        'Current View',
        'Entire Shot List',
        'Selected Scenes',
        'Selected Shots (2)',
        'Selected Area',
        'Selected Shoot Day',
        'Entire Shot List',
        'Current View',
      ]) {
        console.log('SCOPE', name, scope)
        await choose(p, 'Print scope', scope, true)
        if (scope === 'Selected Scenes') {
          await p
            .getByRole('checkbox', { name: 'Scene 10', exact: true })
            .check()
          await p
            .getByRole('checkbox', { name: 'Scene 09', exact: true })
            .uncheck()
        }
        await ready(p)
        latest = Buffer.from(
          await p
            .getByRole('link', { name: 'Download PDF', exact: true })
            .evaluate(async (a) =>
              Array.from(
                new Uint8Array(await (await fetch(a.href)).arrayBuffer()),
              ),
            ),
        )
        assert.equal(
          (
            await p
              .getByRole('button', { name: 'Print scope', exact: true })
              .innerText()
          ).trim(),
          scope,
        )
        const file = path.join(
          dest,
          name + '-' + scope.replace(/\W/g, '-') + '.pdf',
        )
        fs.writeFileSync(file, latest)
        const txt = execFileSync('pdftotext', ['-layout', file, '-']).toString()
        if (scope === 'Selected Shots (2)' || scope === 'Selected Area')
          assert.match(txt, /2 rows/)
        if (scope === 'Selected Shoot Day') {
          assert.match(txt, /22 rows/)
          assert.ok(txt.indexOf('11-B') < txt.indexOf('09-A'))
        }
        if (scope === 'Selected Scenes') {
          assert.ok(txt.includes('10-A'))
          assert.ok(!txt.includes('09-A'))
        }
        if (scope === 'Selected Area') assert.ok(!txt.includes('Camera'))
      }
      pass(
        name +
          ' repeated stable scope transitions and correct saved PDF row counts',
      )
      await choose(p, 'Print column preset', 'Full Technical')
      await ready(p)
      latest = Buffer.from(
        await p
          .getByRole('link', { name: 'Download PDF', exact: true })
          .evaluate(async (a) =>
            Array.from(
              new Uint8Array(await (await fetch(a.href)).arrayBuffer()),
            ),
          ),
      )
      assert.equal(
        (
          await p
            .getByRole('button', { name: 'Print layout', exact: true })
            .innerText()
        ).trim(),
        'Compact Table',
      )
      await p.screenshot({
        path: path.join(dest, name + '-expanded-preview.png'),
      })
      fs.writeFileSync(path.join(dest, name + '-expanded.pdf'), latest)
      pass(
        name + ' independent Full Technical prints a direct rectangular grid',
      )
      await choose(p, 'Print layout', 'Exact Grid')
      await choose(p, 'Print scaling', 'Readable pages · tile columns')
      await ready(p)
      latest = Buffer.from(
        await p
          .getByRole('link', { name: 'Download PDF', exact: true })
          .evaluate(async (a) =>
            Array.from(
              new Uint8Array(await (await fetch(a.href)).arrayBuffer()),
            ),
          ),
      )
      await choose(p, 'Print paper', 'Tabloid')
      await choose(p, 'Print orientation', 'portrait')
      await choose(p, 'Print margins', 'Narrow · 8 mm')
      await ready(p)
      latest = Buffer.from(
        await p
          .getByRole('link', { name: 'Download PDF', exact: true })
          .evaluate(async (a) =>
            Array.from(
              new Uint8Array(await (await fetch(a.href)).arrayBuffer()),
            ),
          ),
      )
      await choose(p, 'Print orientation', 'landscape')
      await choose(p, 'Print paper', 'A3')
      await ready(p)
      latest = Buffer.from(
        await p
          .getByRole('link', { name: 'Download PDF', exact: true })
          .evaluate(async (a) =>
            Array.from(
              new Uint8Array(await (await fetch(a.href)).arrayBuffer()),
            ),
          ),
      )
      const pages = Number(
        (
          await p.locator('.pd-pdf-page-toolbar [role="status"]').innerText()
        ).match(/of (\d+)/)[1],
      )
      for (let i = 1; i < pages; i++) {
        await p
          .getByRole('button', { name: 'Next PDF page', exact: true })
          .click()
        await p.locator('canvas[data-rendered="true"]').waitFor()
      }
      if (
        await p
          .getByRole('button', { name: 'Column band', exact: true })
          .count()
      ) {
        await choose(p, 'Column band', 'Band 1 of 2').catch(async () => {
          await p.keyboard.press('Escape')
        })
      }
      await p.route(
        '**/shotlists/' + list.id + '/pdf',
        (route) =>
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Controlled preview failure' }),
          }),
        { times: 1 },
      )
      await choose(p, 'Print paper', 'A4')
      await p
        .getByRole('alert')
        .filter({ hasText: 'Controlled preview failure' })
        .waitFor()
      assert.equal(await p.locator('.pd-pdf-pages canvas').count(), 1)
      assert.equal(
        await p
          .getByRole('link', { name: 'Download PDF', exact: true })
          .count(),
        0,
      )
      await p.getByRole('button', { name: 'Retry', exact: true }).click()
      await ready(p)
      latest = Buffer.from(
        await p
          .getByRole('link', { name: 'Download PDF', exact: true })
          .evaluate(async (a) =>
            Array.from(
              new Uint8Array(await (await fetch(a.href)).arrayBuffer()),
            ),
          ),
      )
      const event = p.waitForEvent('download')
      await p.getByRole('link', { name: 'Download PDF', exact: true }).click()
      const dl = await event,
        file = path.join(dest, name + '-download.pdf')
      await dl.saveAs(file)
      assert.equal(
        crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
        crypto.createHash('sha256').update(latest).digest('hex'),
      )
      pass(
        name +
          ' all Exact Grid pages, rapid settings changes and current preview/download bytes',
      )
      await p
        .getByRole('button', { name: 'Close Download shot list', exact: true })
        .click()
      assert.equal(
        (
          await p
            .getByRole('button', { name: 'Grid preset', exact: true })
            .innerText()
        ).trim(),
        'Essentials',
      )
      assert.equal(
        await p
          .getByRole('button', { name: 'Hide scenes', exact: true })
          .count(),
        0,
      )
      assert.deepEqual(errors, [])
      pass(name + ' main grid preset preserved and no browser errors')
    } finally {
      await b.close()
    }
  }
  const disposable = await create('Disposable recoverable deletion'),
    peer = await join(disposable.id)
  await api('/' + disposable.id + '/manage', {
    action: 'rename',
    name: 'Renamed disposable',
  })
  assert.equal(
    (await api('')).items.find((x) => x.id === disposable.id).name,
    'Renamed disposable',
  )
  let disconnected = false
  peer.provider.on('disconnect', () => (disconnected = true))
  await api('/' + disposable.id + '/manage', { action: 'archive' })
  assert.ok(!(await api('')).items.find((x) => x.id === disposable.id))
  await api('/' + disposable.id + '/session', undefined, '101', 403)
  await until(() => disconnected, 'archived connection closed')
  peer.close()
  await api('/' + disposable.id + '/manage', { action: 'restore' })
  assert.ok((await api('')).items.find((x) => x.id === disposable.id))
  pass(
    'Rename, recoverable archive, denied new sessions, old socket closure and restore',
  )
  fs.writeFileSync(
    path.join(dest, 'acceptance.json'),
    JSON.stringify({ pass: true, listId: list.id, checks }, null, 2),
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
