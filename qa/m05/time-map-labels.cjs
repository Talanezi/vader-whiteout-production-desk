// Legacy stored references remain untouched; every visual block uses resolved identity.
const fs = require('fs'),
  assert = require('assert/strict'),
  crypto = require('crypto'),
  { join, until } = require('../m04/collaboration.cjs'),
  Y = require('/tmp/m032/runtime/client/node_modules/yjs'),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  headers = {
    Authorization: 'Bearer ' + auth.tokens['101'],
    'Content-Type': 'application/json',
  },
  base = 'http://127.0.0.1:4314/api'
async function api(path, b) {
  const r = await fetch(base + path, {
    method: b ? 'POST' : 'GET',
    headers,
    body: b && JSON.stringify(b),
  })
  assert(r.ok, await r.clone().text())
  return r.json()
}
;(async () => {
  const list = await api('/shotlists', {
      name: 'Legacy duplicate code Time Map proof',
    }),
    s = await join(list.id, '101', 'shotlists'),
    scene = crypto.randomUUID(),
    ids = [crypto.randomUUID(), crypto.randomUUID()]
  function put(doc, k, id, v) {
    const m = new Y.Map()
    doc.getMap(k).set(id, m)
    Object.entries({ id, ...v }).forEach(([k, v]) => m.set(k, v))
  }
  s.doc.transact(() => {
    put(s.doc, 'scenes', scene, { number: '9', order: 1 })
    ids.forEach((id, i) =>
      put(s.doc, 'shots', id, {
        number: i ? '09-B' : 'B',
        sceneId: scene,
        order: i,
        estimatedMinutes: '20',
        deleted: false,
      }),
    )
  })
  await new Promise((r) => setTimeout(r, 400))
  const id = crypto.randomUUID()
  await api('/flows', {
    id,
    name: 'Legacy shot references proof',
    date: '2026-11-12',
    listId: list.id,
    shotIds: ids,
  })
  const f = await join(id, '101', 'flows')
  f.doc.transact(() => {
    f.doc.getMap('meta').set('filmingStart', 540)
    for (const e of f.doc.getMap('events').values())
      e.set('reference', 'B')
  })
  await new Promise((r) => setTimeout(r, 400))
  try {
    for (const kind of ['chromium', 'webkit']) {
      const pw = require(kind === 'webkit'
          ? '/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright'
          : '/Users/thameralanezi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),
        browser = await pw[kind].launch(),
        p = await browser.newPage({
          viewport: { width: 1440, height: 1000 },
        })
      try {
        await p.addInitScript(
          (t) => localStorage.setItem('token', t),
          auth.tokens['101'],
        )
        await p.goto('http://127.0.0.1:5176/productiondesk/#/flows/' + id)
        await p.getByText('Saved', { exact: true }).waitFor()
        await p
          .getByRole('button', { name: 'Time Map', exact: true })
          .click()
        const labels = await p
          .locator('.flow-time-block>button:first-child')
          .allTextContents()
        assert.equal(labels.length, 2)
        for (const key of ids)
          assert(
            labels.some(
              (t) => t.includes('09-B') && t.includes(key.slice(0, 8)),
            ),
          )
        await p.screenshot({
          path:
            '/tmp/m05/corrections/' +
            kind +
            '/20-legacy-canonical-map.png',
        })
      } finally {
        await browser.close()
      }
    }
    const stored = (await api('/flows/' + id + '/snapshot')).state
    assert(Object.values(stored.events).every((e) => e.reference === 'B'))
    console.log(
      'Chromium/WebKit: legacy B and 09-B source records display canonical 09-B with distinct UUID suffixes in Time Map; stored references remain byte-for-byte unchanged.',
    )
  } finally {
    s.close()
    f.close()
  }
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
