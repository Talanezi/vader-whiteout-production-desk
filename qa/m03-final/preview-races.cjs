const { state, out, create, join, until } = require('../m032/helpers.cjs')
const {
  chromium,
} = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
;(async () => {
  const list = await create('Final preview races ' + crypto.randomUUID())
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  const peer = await join(list.id, '102')
  try {
    const c = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    })
    await c.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens[101],
    )
    const p = await c.newPage()
    p.setDefaultTimeout(20000)
    await p.goto(state.root + '#/shotlists/' + list.id)
    await p.locator('[data-sync="saved"]').waitFor()
    await p.getByRole('button', { name: 'Download', exact: true }).click()
    const link = p.getByRole('link', { name: 'Download PDF', exact: true })
    await link.waitFor({ timeout: 60000 })
    const initial = await link.getAttribute('href')
    let delayed = false
    await p.route('**/shotlists/' + list.id + '/pdf', async (route) => {
      const spec = route.request().postDataJSON()
      if (spec.paper !== 'a4') return route.continue()
      delayed = true
      const response = await route.fetch()
      await new Promise((r) => setTimeout(r, 1800))
      await route.fulfill({ response }).catch(() => {}) // Aborted obsolete response is expected.
    })
    const choose = async (label, option) => {
      await p.getByRole('button', { name: label, exact: true }).click()
      await p.getByRole('option', { name: option, exact: true }).click()
    }
    await choose('Print paper', 'A4')
    await until(() => delayed, 'A4 request in flight')
    assert.equal(await link.count(), 0)
    await choose('Print paper', 'A3')
    await link.waitFor({ timeout: 60000 })
    const latest = await link.getAttribute('href')
    assert.notEqual(latest, initial)
    await p.waitForTimeout(2200)
    assert.equal(
      await link.getAttribute('href'),
      latest,
      'old response cannot replace latest A3 bytes',
    )
    const bytes = Buffer.from(
      await link.evaluate(async (a) =>
        Array.from(new Uint8Array(await (await fetch(a.href)).arrayBuffer())),
      ),
    )
    const file = path.join(out, 'final', 'race-a3.pdf')
    fs.writeFileSync(file, bytes)
    assert.match(
      execFileSync('pdfinfo', [file]).toString(),
      /1190\.5\d? x 841\.8\d? pts/,
    )

    const shot = [...peer.doc.getMap('shots').values()].find(
      (s) => !s.get('deleted'),
    )
    const coverage = shot.get('coverage')
    const marker = 'Collaborative preview revision checked'
    peer.doc.transact(() => {
      coverage.delete(0, coverage.length)
      coverage.insert(0, marker)
    })
    await until(
      async () => (await link.count()) === 0,
      'new revision disables stale download',
    )
    await link.waitFor({ timeout: 60000 })
    assert.notEqual(await link.getAttribute('href'), latest)
    const next = Buffer.from(
      await link.evaluate(async (a) =>
        Array.from(new Uint8Array(await (await fetch(a.href)).arrayBuffer())),
      ),
    )
    const updated = path.join(out, 'final', 'collaborative-preview-update.pdf')
    fs.writeFileSync(updated, next)
    assert.ok(
      execFileSync('pdftotext', [updated, '-']).toString().includes(marker),
    )
    fs.writeFileSync(
      path.join(out, 'final', 'preview-races.json'),
      JSON.stringify(
        {
          pass: true,
          delayedResponseIgnored: true,
          collaborativeRevisionAutomaticallyRefreshed: true,
        },
        null,
        2,
      ),
    )
    console.log(
      'PASS delayed obsolete response ignored, stale download disabled, collaborative revision automatically previews authoritative saved content',
    )
  } finally {
    peer.close()
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
