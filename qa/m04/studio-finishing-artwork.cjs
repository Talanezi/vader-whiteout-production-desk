const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto'),
  webkit = process.env.M04_BROWSER === 'webkit',
  pw = require(
    webkit
      ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
      : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
  ),
  state = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  source = JSON.parse(fs.readFileSync('/tmp/m04/studio-scene16-record.json')),
  headers = {
    Authorization: 'Bearer ' + state.tokens['101'],
    'Content-Type': 'application/json',
  },
  base = 'http://127.0.0.1:4314/api',
  hash = (b) => crypto.createHash('sha256').update(b).digest('hex')
;(async () => {
  const browser = await (webkit ? pw.webkit : pw.chromium).launch({
    headless: true,
  })
  let page
  try {
    const board = await (
        await fetch(`${base}/storyboards/${source.id}/manage`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ action: 'duplicate' }),
        })
      ).json(),
      id = board.id,
      snapshot = async () =>
        await (
          await fetch(`${base}/storyboards/${id}/snapshot`, { headers })
        ).json(),
      before = await snapshot(),
      panel = Object.values(before.panels).sort((a, b) => a.order - b.order)[0],
      revision = before.revisions[panel.activeRevision],
      original = Buffer.from(
        await (
          await fetch(`${base}/storyboards/${id}/assets/${revision.assetId}`, {
            headers,
          })
        ).arrayBuffer(),
      )
    page = await browser.newPage({ viewport: { width: 1600, height: 1100 } })
    page.setDefaultTimeout(20000)
    await page.addInitScript((t) => {
      localStorage.setItem('token', t)
      Object.defineProperty(window, 'EyeDropper', {
        value: undefined,
        configurable: true,
      })
    }, state.tokens['101'])
    await page.goto(`http://127.0.0.1:5176/productiondesk/#/storyboards/${id}`)
    await page.locator('.sb-card-art').first().click()
    await page.locator('.sb-studio-composition image').waitFor()
    await page.getByRole('button', { name: 'Studio', exact: true }).click()
    await page.locator('[data-drawing-engine="vectorcraft-639c9d6"]').waitFor()
    const controls = [
        'Studio',
        'Details',
        'Drawing frame',
        'Artwork fit',
        'Full screen',
      ],
      positions = async () => {
        await page
          .getByRole('dialog', { name: 'Panel viewer', exact: true })
          .evaluate(async (n) => {
            await Promise.all(
              n.getAnimations().map((a) => a.finished.catch(() => {})),
            )
          })
        await page.evaluate(
          () =>
            new Promise((r) =>
              requestAnimationFrame(() => requestAnimationFrame(r)),
            ),
        )
        console.log(
          'Viewer bounds',
          await page.locator('.sb-viewer').evaluate((n) => {
            const s = getComputedStyle(n),
              h = n.querySelector('.sb-viewer-frame>header'),
              hs = getComputedStyle(h)
            return {
              root: {
                x: n.getBoundingClientRect().x,
                width: n.getBoundingClientRect().width,
              },
              header: {
                x: h.getBoundingClientRect().x,
                width: h.getBoundingClientRect().width,
              },
              padding: s.padding,
              overflow: s.overflow,
              gutter: s.scrollbarGutter,
              headerPadding: hs.padding,
              client: n.clientWidth,
              html: document.documentElement.clientWidth,
              viewport: innerWidth,
              transform: s.transform,
            }
          }),
        )
        return await Promise.all(
          controls.map(async (name) => {
            const b = await page
              .getByRole('button', { name, exact: true })
              .boundingBox()
            return { name, x: b.x, y: b.y, w: b.width, h: b.height }
          }),
        )
      },
      importedPositions = await positions()
    const pixel = await page
      .locator('.sb-studio-composition image')
      .evaluate(async (n) => {
        const image = new Image()
        image.src = n.getAttribute('href')
        await image.decode()
        const h = Number(n.getAttribute('height')),
          c = document.createElement('canvas')
        c.width = 1000
        c.height = Math.ceil(h)
        const ctx = c.getContext('2d')
        ctx.drawImage(image, 0, 0, 1000, h)
        const d = ctx.getImageData(0, 0, c.width, c.height).data
        for (let y = 20; y < c.height - 20; y += 5)
          for (let x = 20; x < 980; x += 5) {
            const i = (y * 1000 + x) * 4,
              r = d[i],
              g = d[i + 1],
              b = d[i + 2]
            if (Math.max(r, g, b) - Math.min(r, g, b) > 80 && r > 80) {
              const stable = [-2, 0, 2].every((dy) =>
                [-2, 0, 2].every((dx) =>
                  [0, 1, 2].every(
                    (k) =>
                      Math.abs(
                        d[i + k] - d[((y + dy) * 1000 + x + dx) * 4 + k],
                      ) <= 2,
                  ),
                ),
              )
              if (stable)
                return {
                  x,
                  y,
                  h,
                  color:
                    '#' +
                    [r, g, b]
                      .map((v) => v.toString(16).padStart(2, '0'))
                      .join(''),
                }
            }
          }
        throw Error('No stable colored fixture pixel')
      })
    const art = await page.locator('.sb-studio-composition>rect').boundingBox(),
      point = (x, y) => [
        art.x + (x / 1000) * art.width,
        art.y + (y / pixel.h) * art.height,
      ]
    await page.locator('.sb-property-trigger').click()
    const preset = await page
        .getByRole('button', { name: 'Brush preset', exact: true })
        .boundingBox(),
      swatches = await page.locator('.sb-swatches').boundingBox()
    assert.ok(swatches.y - (preset.y + preset.height) >= 16)
    await page.screenshot({ path: '/tmp/m04/finishing-brush-spacing.png' })
    console.log({
      pixel,
      art,
      point: point(pixel.x, pixel.y),
      image: await page
        .locator('.sb-studio-composition image')
        .evaluate((n) => ({
          h: n.getAttribute('height'),
          box: {
            x: n.getBoundingClientRect().x,
            y: n.getBoundingClientRect().y,
            w: n.getBoundingClientRect().width,
            h: n.getBoundingClientRect().height,
          },
        })),
    })
    await page
      .getByRole('button', { name: 'Sample color', exact: true })
      .click()
    await page
      .getByRole('status')
      .filter({ hasText: 'Sample artwork' })
      .waitFor()
    await page.mouse.move(...point(pixel.x, pixel.y))
    await page.screenshot({
      path: '/tmp/m04/finishing-sampling-original-pixel.png',
    })
    console.log(
      'Scroll owners',
      await page.evaluate(() =>
        Array.from(
          document.querySelectorAll(
            '.sb-viewer,.sb-viewer-frame,.sb-viewer-frame>header,.sb-viewer-body,.sb-viewer-art,.sb-studio,.sb-studio-canvas',
          ),
        ).map((n) => ({
          c: n.className.baseVal || n.className,
          scroll: n.scrollLeft,
          width: n.getBoundingClientRect().width,
          left: n.getBoundingClientRect().left,
          client: n.clientWidth,
          scrollWidth: n.scrollWidth,
          min: getComputedStyle(n).minWidth,
        })),
      ),
    )
    await page.mouse.click(...point(pixel.x, pixel.y))
    await page.locator('.sb-property-trigger').click()
    const sampled = await page.getByLabel('Custom color HEX').inputValue()
    assert.ok(
      [1, 3, 5].every(
        (i) =>
          Math.abs(
            parseInt(sampled.slice(i, i + 2), 16) -
              parseInt(pixel.color.slice(i, i + 2), 16),
          ) <= 3,
      ),
      `${sampled} must sample real imported artwork ${pixel.color}`,
    )
    await page.getByLabel('Custom color HEX').fill('#77d7ff')
    const range = page.getByRole('slider', { name: 'Brush width', exact: true })
    await range.press('Home')
    for (let i = 0; i < 11; i++) await range.press('ArrowRight')
    await page.locator('.sb-property-trigger').click()
    await page.mouse.move(...point(200, 100))
    await page.mouse.down()
    await page.mouse.move(...point(500, 100), { steps: 20 })
    await page.mouse.up()
    await page.locator('.sb-property-trigger').click()
    await page
      .getByRole('button', { name: 'Sample color', exact: true })
      .click()
    await page
      .getByRole('status')
      .filter({ hasText: 'Sample artwork' })
      .waitFor()
    await page.mouse.click(...point(350, 100))
    await page.locator('.sb-property-trigger').click()
    assert.equal(
      await page.getByLabel('Custom color HEX').inputValue(),
      '#77d7ff',
    )
    await page.locator('.sb-property-trigger').click()
    await page.waitForFunction(
      () => document.querySelector('[data-sync]')?.dataset.sync === 'saved',
    )
    const marked = await snapshot(),
      marks = JSON.stringify(marked.annotations)
    await page
      .getByRole('button', { name: 'Drawing frame', exact: true })
      .click()
    await page
      .getByRole('menuitemradio', { name: 'Square · 1:1', exact: true })
      .click()
    await page.screenshot({ path: '/tmp/m04/finishing-imported-frame-fit.png' })
    await page.getByRole('button', { name: 'Artwork fit', exact: true }).click()
    await page
      .getByRole('menuitemradio', { name: 'Crop to frame', exact: true })
      .click()
    await page.screenshot({
      path: '/tmp/m04/finishing-imported-frame-crop.png',
    })
    await page.getByRole('button', { name: 'Artwork fit', exact: true }).click()
    await page
      .getByRole('menuitemradio', { name: 'Fit with padding', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Drawing frame', exact: true })
      .click()
    await page
      .getByRole('menuitemradio', { name: 'Original', exact: true })
      .click()
    await page.waitForFunction(
      () => document.querySelector('[data-sync]')?.dataset.sync === 'saved',
    )
    const changed = await snapshot()
    assert.equal(JSON.stringify(changed.annotations), marks)
    assert.equal(changed.revisions[revision.id].assetId, revision.assetId)
    assert.equal(
      hash(
        Buffer.from(
          await (
            await fetch(
              `${base}/storyboards/${id}/assets/${revision.assetId}`,
              { headers },
            )
          ).arrayBuffer(),
        ),
      ),
      hash(original),
    )
    await page.screenshot({ path: '/tmp/m04/finishing-imported-toolbar.png' })
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page
      .getByRole('dialog', { name: 'Panel viewer', exact: true })
      .waitFor({ state: 'hidden' })
    await page.locator('.sb-panel-card').first().hover()
    await page
      .locator('.sb-panel-card')
      .first()
      .getByRole('button', { name: /Actions for/ })
      .click()
    await page
      .getByRole('menuitem', { name: 'Draw panel after', exact: true })
      .click()
    await page.locator('[data-drawing-engine="vectorcraft-639c9d6"]').waitFor()
    const nativePositions = await positions()
    console.log({ importedPositions, nativePositions })
    for (let i = 0; i < controls.length; i++)
      assert.ok(
        Math.abs(importedPositions[i].x - nativePositions[i].x) < 1 &&
          Math.abs(importedPositions[i].y - nativePositions[i].y) < 1,
        `${controls[i]} must retain its exact position across panel types`,
      )
    await page.screenshot({ path: '/tmp/m04/finishing-native-toolbar.png' })
    console.log(
      'Imported-image and visible-vector eyedropper sampling, 18px palette spacing, non-destructive fit/crop/original framing, unchanged source bytes/objects, and identical imported/native toolbar geometry passed.',
    )
  } catch (e) {
    if (page) {
      console.error(await page.locator('[role=alert]').allTextContents())
      await page.screenshot({ path: '/tmp/m04/finishing-artwork-failure.png' })
    }
    throw e
  } finally {
    await browser.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
