// Regression for a real release smoke failure: a normal saved stroke exceeded the old500KB PDF guard.
const fs = require('node:fs')
const assert = require('node:assert/strict')
process.env.NODE_PATH = '/tmp/m032/runtime/server/node_modules'
require('node:module').Module._initPaths()
const {
  renderStoryboard,
} = require('/tmp/m032/runtime/server-dist/storyboards/pdf/export.js')
;(async () => {
  const { instance } = await WebAssembly.instantiate(
    fs.readFileSync('client/src/lib/storyboards/whiteout_studio_engine.wasm'),
    {},
  )
  const k = instance.exports
  const points = Array.from({ length: 1489 }, (_, i) => [
    500 + Math.cos(i * 0.5) * 400,
    270 + Math.sin(i * 0.5 * 0.31) * 200,
    0.25 + 0.65 * (0.5 + Math.sin(i * 0.08) / 2),
  ])
  const bytes = new TextEncoder().encode(
    JSON.stringify({ op: 'brush', points, width: 4 }),
  )
  const ptr = k.reserve_input(bytes.length)
  new Uint8Array(k.memory.buffer, ptr, bytes.length).set(bytes)
  assert.equal(k.run(), 1)
  const geometry = JSON.parse(
    new TextDecoder().decode(
      new Uint8Array(k.memory.buffer, k.output_ptr(), k.output_len()),
    ),
  )
  assert.ok(
    geometry.path.length > 500000 && geometry.path.length < 2000000,
    'Use actual large VectorCraft outline output',
  )
  const panel = {
    id: 'long-path-panel',
    native: true,
    nativeHeight: 562.5,
    activeRevision: 'native-long-path',
    label: 'Long pressure stroke',
  }
  const annotation = {
    ...geometry,
    id: 'stroke',
    revisionId: panel.activeRevision,
    type: 'pen',
    path: geometry.path,
    filled: true,
    color: '#172536',
    width: 0.004,
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    points: points.map((p) => [p[0] / 1000, p[1] / 562.5, p[2]]),
  }
  const render = (annotations) =>
    renderStoryboard(
      'M04 bounded vector export',
      [panel],
      { layout: 1, orientation: 'landscape' },
      async () => {
        throw Error('Native artwork must not request media')
      },
      annotations,
      async () => '',
    )
  const pdf = await render([annotation])
  assert.ok(pdf.length > 10000)
  fs.writeFileSync('/tmp/m04/finishing-long-vector.pdf', pdf)
  for (const path of ['M0 0<script>', 'M' + '0 '.repeat(1000001)])
    await assert.rejects(
      () => render([{ ...annotation, path }]),
      /Invalid vector path/,
    )
  console.log(
    `Actual1489-sample VectorCraft outline (${geometry.path.length}characters) exports as vector PDF; invalid syntax and over2MB paths remain rejected.`,
  )
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
