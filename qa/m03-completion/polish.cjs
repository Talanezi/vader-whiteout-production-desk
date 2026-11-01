const { state, out, api, create, until } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  path = require('node:path'),
  fs = require('node:fs'),
  crypto = require('node:crypto')
const pw = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
  wk = require('/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright')
;(async () => {
  for (const [name, engine] of [
    ['chrome', pw.chromium],
    ['webkit', wk.webkit],
  ]) {
    if (process.env.M03_BROWSER && process.env.M03_BROWSER !== name) continue
    const list = await create(
        'M03 acceptance ' + name + ' ' + crypto.randomUUID(),
      ),
      b = await engine.launch(
        name === 'chrome'
          ? { channel: 'chrome', headless: true }
          : { headless: true },
      )
    try {
      const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
      if (name === 'chrome')
        await c.grantPermissions(['clipboard-read', 'clipboard-write'])
      await c.addInitScript(
        (t) => localStorage.setItem('token', t),
        state.tokens[101],
      )
      const p = await c.newPage()
      p.setDefaultTimeout(15000)
      const errors = []
      p.on('pageerror', (e) => errors.push(e.message))
      await p.goto(state.root + '#/shotlists/' + list.id)
      await p.locator('[data-sync="saved"]').waitFor()
      assert.equal(
        await p
          .getByRole('button', { name: 'Open shot inspector', exact: true })
          .count(),
        0,
      )
      await p.getByRole('button', { name: 'Grid preset', exact: true }).click()
      await p
        .getByRole('menuitemradio', { name: 'Cinematography', exact: true })
        .click()
      const headers = await p
        .locator('.pd-pro-table thead th')
        .allTextContents()
      assert.deepEqual(
        headers.slice(1, -1).map((v) => v.trim()),
        [
          'Shot number',
          'Action / coverage',
          'Camera',
          'Framing',
          'Subject',
          'Camera angle',
          'Lens',
          'Support / equipment',
          'Movement',
          'Camera notes',
          'Focus notes',
          'Lighting notes',
          'Script duration · sec',
          'Setup · min',
          'Estimated shooting · min',
        ],
      )
      const rows = p.locator('tr[data-shot]'),
        id = await rows.first().getAttribute('data-shot')
      const subject = rows.first().getByRole('button', { name: /^Subject ·/ })
      await subject.click()
      assert.ok(
        await p.getByRole('option', { name: 'VADER', exact: true }).count(),
      )
      await p.getByRole('combobox', { name: /^Search subject/ }).press('Tab')
      await p
        .getByRole('button', { name: 'Edit choices', exact: true })
        .press('Enter')
      await p
        .getByRole('textbox', { name: 'New choice', exact: true })
        .fill('MANDALORIAN')
      await p
        .getByRole('textbox', { name: 'New choice', exact: true })
        .press('Enter')
      await p.getByRole('button', { name: 'Done', exact: true }).click()
      await subject.click()
      await p.getByRole('option', { name: 'MANDALORIAN', exact: true }).click()
      await rows
        .nth(1)
        .getByRole('button', { name: /^Subject ·/ })
        .click()
      await p.getByRole('option', { name: 'MANDALORIAN', exact: true }).click()
      await p.locator('[data-sync="saved"]').waitFor()
      await p.reload()
      await p.locator('[data-sync="saved"]').waitFor()
      assert.equal(
        (
          await rows
            .first()
            .getByRole('button', { name: /^Subject ·/ })
            .innerText()
        ).trim(),
        'MANDALORIAN',
      )
      const peer = await b.newContext({
        viewport: { width: 1440, height: 1000 },
      })
      await peer.addInitScript(
        (t) => localStorage.setItem('token', t),
        state.tokens[102],
      )
      const q = await peer.newPage()
      await q.goto(state.root + '#/shotlists/' + list.id)
      await q.locator('[data-sync="saved"]').waitFor()
      await q
        .locator('tr[data-shot]')
        .nth(2)
        .getByRole('button', { name: /^Subject ·/ })
        .click()
      assert.equal(
        await q
          .getByRole('option', { name: 'MANDALORIAN', exact: true })
          .count(),
        1,
      )
      await q.getByRole('button', { name: 'Edit choices', exact: true }).click()
      await q
        .getByRole('button', { name: 'Rename choice MANDALORIAN', exact: true })
        .click()
      await q
        .getByRole('textbox', { name: 'Rename MANDALORIAN', exact: true })
        .fill('THE ARMORER')
      await q
        .getByRole('textbox', { name: 'Rename MANDALORIAN', exact: true })
        .press('Enter')
      await q.getByRole('button', { name: 'Done', exact: true }).click()
      await q.locator('[data-sync="saved"]').waitFor()
      assert.equal(
        (await api('/' + list.id + '/export')).shots[id].subject,
        'MANDALORIAN',
      )
      await subject.click()
      await p
        .getByRole('option', { name: 'THE ARMORER', exact: true })
        .waitFor()
      await p.getByRole('button', { name: 'Edit choices', exact: true }).click()
      await p
        .getByRole('button', { name: 'Remove choice THE ARMORER', exact: true })
        .click()
      await p.getByRole('button', { name: 'Done', exact: true }).click()
      await p.locator('[data-sync="saved"]').waitFor()
      assert.equal(
        (await api('/' + list.id + '/export')).shots[id].subject,
        'MANDALORIAN',
      )
      await peer.close()
      console.log(
        'PASS',
        name,
        'exact Cinematography, document-derived Subject choices, shared add/select/rename/remove/reload without rewriting historical values',
      )
      for (const [field, value] of [
        ['Camera', 'CAM B'],
        ['Framing', 'MS'],
        ['Camera angle', 'Low Angle'],
        ['Lens', '35mm'],
        ['Support / equipment', 'Sticks'],
        ['Movement', 'Static'],
      ]) {
        await rows
          .first()
          .getByRole('button', {
            name: new RegExp(
              '^' + field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' ·',
            ),
          })
          .click()
        await p.getByRole('option', { name: value, exact: true }).click()
      }
      await rows
        .first()
        .getByRole('button', { name: /^Lens ·/ })
        .click()
      await p.getByRole('combobox', { name: /^Search lens/ }).fill('ATLAS 95mm')
      await p
        .getByRole('option', { name: 'Use “ATLAS 95mm”', exact: true })
        .click()
      await p.locator('[data-sync="saved"]').waitFor()
      console.log(
        'PASS',
        name,
        'all seven categorical editors retain defaults/free text; Edit choices keyboard access',
      )
      // Header and row checkbox centers are identical before/after horizontal scrolling.
      for (const left of [0, 1000]) {
        await p
          .locator('.pd-pro-grid')
          .evaluate((el, x) => (el.scrollLeft = x), left)
        const centers = await p
          .locator('.pd-pin-grip input')
          .evaluateAll((els) =>
            els.slice(0, 3).map((el) => {
              const r = el.getBoundingClientRect()
              return r.x + r.width / 2
            }),
          )
        assert.ok(
          centers.every((x) => Math.abs(x - centers[0]) < 0.6),
          JSON.stringify(centers),
        )
      }
      await p.locator('.pd-pro-grid').evaluate((el) => (el.scrollLeft = 0))
      const check = rows.first().getByRole('checkbox')
      await check.check()
      const samples = await rows
        .first()
        .locator('.pd-draw-tick')
        .evaluate(async (el) => {
          const values = []
          for (let i = 0; i < 20; i++) {
            values.push(parseFloat(getComputedStyle(el).strokeDashoffset))
            await new Promise(requestAnimationFrame)
          }
          return values
        })
      assert.ok(
        samples.some((v) => v > 0 && v < 1),
        'draw animation intermediate frames ' + samples,
      )
      assert.equal(samples.at(-1), 0)
      const toolbar = p.locator('.pd-shot-selection')
      assert.deepEqual(await toolbar.getByRole('button').allTextContents(), [
        'Copy selected',
        'Duplicate selected',
        'Clear selection',
        'Delete selected',
      ])
      await p
        .getByRole('button', { name: 'Copy selected', exact: true })
        .click()
      await p.locator('.pd-selection-feedback.is-copied').waitFor()
      assert.equal(
        await p
          .getByRole('textbox', { name: 'Bulk value', exact: true })
          .count(),
        0,
      )
      await p.screenshot({
        path: path.join(out, 'polish-' + name + '-copy.png'),
      })
      await p
        .getByRole('button', { name: 'Duplicate selected', exact: true })
        .click()
      await p.locator('.pd-selection-feedback.is-duplicated').waitFor()
      assert.equal(await rows.count(), 9)
      await p.screenshot({
        path: path.join(out, 'polish-' + name + '-duplicate.png'),
      })
      const snap = await api('/' + list.id + '/export')
      await p
        .getByRole('button', { name: 'Clear selection', exact: true })
        .click()
      assert.equal(await toolbar.count(), 0)
      assert.deepEqual((await api('/' + list.id + '/export')).shots, snap.shots)
      await rows.first().getByRole('checkbox').check()
      await rows.nth(1).getByRole('checkbox').check()
      const selected = await p
        .locator('tr.is-checked')
        .evaluateAll((els) => els.map((el) => el.dataset.shot))
      assert.equal(selected.length, 2)
      await p
        .getByRole('button', { name: 'Delete selected', exact: true })
        .click()
      await p.getByText('Delete 2 selected shots?', { exact: true }).waitFor()
      await p
        .getByRole('button', { name: 'Cancel deletion', exact: true })
        .click()
      assert.equal(await rows.count(), 9)
      await p
        .getByRole('button', { name: 'Delete selected', exact: true })
        .click()
      await p
        .getByRole('button', {
          name: 'Confirm delete 2 selected shots',
          exact: true,
        })
        .click()
      await until(async () => (await rows.count()) === 7, 'selected deletion')
      await p
        .getByRole('button', { name: 'Restore', exact: true })
        .last()
        .click()
      await until(async () => (await rows.count()) === 9, 'selected restore')
      await p.locator('[data-sync="saved"]').waitFor()
      const restored = await api('/' + list.id + '/export')
      const content = (shot) =>
        Object.fromEntries(
          Object.entries(shot).filter(
            ([k]) => !['deleted', 'updatedAt', 'updatedBy'].includes(k),
          ),
        )
      for (const selectedId of selected) {
        assert.equal(restored.shots[selectedId].deleted, false)
        assert.deepEqual(
          content(restored.shots[selectedId]),
          content(snap.shots[selectedId]),
        )
      }
      // Existing far-right row deletion and restore remain the same component/path.
      const row = rows.first(),
        raw = restored.shots[await row.getAttribute('data-shot')].number
      await row
        .getByRole('button', { name: 'Delete shot ' + raw, exact: true })
        .click()
      await row
        .getByRole('button', {
          name: 'Confirm delete shot ' + raw,
          exact: true,
        })
        .click()
      await until(async () => (await rows.count()) === 8, 'row delete')
      await p
        .getByRole('button', { name: 'Restore', exact: true })
        .last()
        .click()
      await until(async () => (await rows.count()) === 9, 'row restore')
      // Text deletion is text editing, never a row command.
      await p.locator('.pd-pro-grid').evaluate((el) => (el.scrollLeft = 0))
      await rows
        .first()
        .getByRole('button', { name: /^Action \/ coverage ·/ })
        .click()
      const edit = rows
        .first()
        .getByRole('textbox', { name: /^Action \/ coverage ·/ })
      await edit.press('End')
      await edit.press('Backspace')
      await edit.press('Delete')
      await p.locator('[data-sync="saved"]').waitFor()
      assert.equal(await rows.count(), 9)
      console.log(
        'PASS',
        name,
        'visible path drawing; aligned checkboxes; four-action toolbar; real copy/duplicate feedback; clear, cancel/delete/restore, row deletion and text-only Backspace/Delete',
      )
      // Frozen PDF smoke: automatic current bytes and one-click download.
      let bytes
      p.on('response', async (r) => {
        if (r.url().endsWith('/pdf') && r.ok()) bytes = await r.body()
      })
      await p.getByRole('button', { name: 'Download', exact: true }).click()
      const download = p.getByRole('link', {
        name: 'Download PDF',
        exact: true,
      })
      await download.waitFor()
      assert.ok(bytes)
      const event = p.waitForEvent('download')
      await download.click()
      const d = await event
      const file = path.join(out, 'polish-' + name + '-download.pdf')
      await d.saveAs(file)
      assert.equal(
        crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
        crypto.createHash('sha256').update(bytes).digest('hex'),
      )
      await p.screenshot({
        path: path.join(out, 'polish-' + name + '-print.png'),
      })
      await p.getByRole('button', { name: 'Close', exact: true }).click()
      assert.deepEqual(errors, [])
      console.log(
        'PASS',
        name,
        'unchanged automatic PDF preview and byte-identical download; no browser errors',
      )
    } finally {
      await b.close()
    }
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
