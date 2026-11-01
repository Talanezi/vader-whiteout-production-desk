const { state, out, create } = require('../m032/helpers.cjs'),
  assert = require('node:assert/strict'),
  path = require('path'),
  {
    chromium,
  } = require('/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
;(async () => {
  const list = await create('Columns and layout review ' + crypto.randomUUID()),
    b = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const c = await b.newContext({ viewport: { width: 1440, height: 1000 } })
    await c.addInitScript(
      (t) => localStorage.setItem('token', t),
      state.tokens[101],
    )
    const p = await c.newPage()
    p.setDefaultTimeout(20000)
    await p.goto(state.root + '#/shotlists/' + list.id)
    await p.locator('[data-sync="saved"]').waitFor()
    const resize = p.getByRole('separator', {
        name: 'Resize Action / coverage',
        exact: true,
      }),
      base = await resize.getAttribute('aria-valuenow')
    await resize.press('ArrowRight')
    assert.notEqual(await resize.getAttribute('aria-valuenow'), base)
    await p.getByRole('button', { name: 'Choose columns', exact: true }).click()
    await p
      .getByRole('checkbox', { name: 'Show Camera', exact: true })
      .uncheck()
    await p
      .getByRole('button', { name: 'Reset column widths', exact: true })
      .click()
    const bounds = await p
      .getByRole('dialog', { name: 'Columns and layout', exact: true })
      .evaluate((el) => ({
        dialog: el.getBoundingClientRect().toJSON(),
        header: el
          .querySelector('.pd-overlay-header')
          .getBoundingClientRect()
          .toJSON(),
        footer: el
          .querySelector('.pd-overlay-footer')
          .getBoundingClientRect()
          .toJSON(),
        checks: [...el.querySelectorAll('.pd-draw-checkbox svg')].map((svg) =>
          svg.getBoundingClientRect().toJSON(),
        ),
      }))
    assert.ok(
      bounds.header.top >= bounds.dialog.top &&
        bounds.footer.bottom <= bounds.dialog.bottom,
    )
    assert.ok(
      bounds.checks.every((box) => box.width <= 16.5 && box.height <= 16.5),
    )
    await p.screenshot({
      path: path.join(out, 'completion-column-manager.png'),
    })
    await p
      .getByRole('button', { name: 'Close Columns and layout', exact: true })
      .click()
    assert.equal(await resize.getAttribute('aria-valuenow'), base)
    assert.equal(
      await p
        .getByRole('separator', { name: 'Resize Camera', exact: true })
        .count(),
      0,
    )
    await p.getByRole('button', { name: 'Choose columns', exact: true }).click()
    await p
      .getByRole('dialog', { name: 'Columns and layout', exact: true })
      .evaluate(async (el) => {
        await Promise.all(el.getAnimations().map((a) => a.finished))
      })
    await p.screenshot({
      path: path.join(out, 'completion-column-manager-opening.png'),
    })
    await p
      .getByRole('button', { name: 'Restore default layout', exact: true })
      .click()
    await p
      .getByRole('button', { name: 'Drag Lens column', exact: true })
      .press('Alt+ArrowUp')
    await p
      .getByRole('button', { name: 'Close Columns and layout', exact: true })
      .click()
    const headers = await p.locator('.pd-pro-table thead th').allTextContents()
    assert.ok(
      headers.findIndex((x) => x.trim() === 'Lens') <
        headers.findIndex((x) => x.trim() === 'Camera'),
    )
    console.log(
      'PASS width reset preserves visibility; restore layout restores role defaults; dedicated handle keyboard reorder works',
    )
    await p.goto(state.root + 'qa/m03-completion/controls.html')
    await p
      .getByRole('checkbox', { name: 'Unchecked', exact: true })
      .press('Space')
    assert.equal(
      await p
        .getByRole('checkbox', { name: 'Unchecked', exact: true })
        .isChecked(),
      true,
    )
    assert.equal(
      await p
        .getByRole('checkbox', { name: 'Mixed', exact: true })
        .evaluate((el) => el.indeterminate),
      true,
    )
    assert.equal(
      await p
        .getByRole('checkbox', { name: 'Disabled', exact: true })
        .isDisabled(),
      true,
    )
    await p
      .getByRole('checkbox', { name: 'Unchecked', exact: true })
      .press('Space')
    assert.equal(
      await p
        .getByRole('checkbox', { name: 'Unchecked', exact: true })
        .isChecked(),
      false,
    )
    await p.screenshot({
      path: path.join(out, 'completion-checkbox-states.png'),
    })
    console.log(
      'PASS checked/unchecked/mixed/disabled native semantics and keyboard draw-checkbox fixture',
    )
  } finally {
    await b.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
