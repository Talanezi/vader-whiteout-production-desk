const fs = require('fs'),
  assert = require('assert/strict'),
  http = require('http'),
  path = require('path')
process.env.NODE_PATH =
  '/tmp/m032/runtime/client/node_modules:/tmp/m032/runtime/server/node_modules'
require('module').Module._initPaths()
const esbuild = require('esbuild'),
  out = '/tmp/m05/refinement'
for (const [name, file] of [
  ['network', 'client/src/lib/network.ts'],
  ['pending', 'client/src/lib/pendingDocument.ts'],
])
  esbuild.buildSync({
    entryPoints: [path.resolve(file)],
    outfile: out + '/' + name + '.cjs',
    platform: 'node',
    format: 'cjs',
    bundle: true,
    packages: 'external',
  })
const { networkFetch, responseFailure } = require(out + '/network.cjs'),
  Y = require('yjs'),
  { pendingDocument } = require(out + '/pending.cjs')
;(async () => {
  const calls = {}
  const server = http.createServer((req, res) => {
    calls[req.url] = (calls[req.url] || 0) + 1
    if (req.url === '/slow') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.write('{')
      return setTimeout(() => res.end('}'), 120)
    }
    if (req.url === '/limited' && calls[req.url] < 3) {
      res.writeHead(429, { 'Retry-After': '0' })
      return res.end('{}')
    }
    if (req.url === '/hang') return
    if (req.url === '/flaky' && calls[req.url] < 3) {
      res.writeHead(503)
      return res.end('{}')
    }
    if (req.url === '/lost') {
      res.writeHead(503)
      return res.end('{}')
    }
    const status = Number(req.url.slice(1))
    res.writeHead(status || 200, { 'Content-Type': 'application/json' })
    res.end('{}')
  })
  await new Promise((r) => server.listen(4329, '127.0.0.1', r))
  try {
    let r = await networkFetch('http://127.0.0.1:4329/flaky')
    assert(r.ok)
    assert.equal(calls['/flaky'], 3)
    r = await networkFetch('http://127.0.0.1:4329/slow', {}, { timeout: 500 })
    assert.deepEqual(await r.json(), {})
    assert.equal(calls['/slow'], 1)
    r = await networkFetch('http://127.0.0.1:4329/limited')
    assert(r.ok)
    assert.equal(calls['/limited'], 3)
    await assert.rejects(
      networkFetch(
        'http://127.0.0.1:4329/hang',
        {},
        { timeout: 30, retries: 1 },
      ),
      (e) => e.kind === 'timeout',
    )
    assert.equal(calls['/hang'], 2)
    r = await networkFetch('http://127.0.0.1:4329/lost', {
      method: 'POST',
    })
    assert.equal(r.status, 503)
    assert.equal(calls['/lost'], 1)
    for (const status of [401, 403, 429, 500, 503]) {
      r = await networkFetch(
        'http://127.0.0.1:4329/' + status,
        {},
        { retries: 0 },
      )
      const e = await responseFailure(r)
      assert.equal(e.status, status)
      assert.equal(e.message === 'UNAUTHORIZED', status === 401)
    }
    const c = new AbortController(),
      cancel = networkFetch('http://127.0.0.1:4329/hang', {
        signal: c.signal,
      })
    c.abort()
    await assert.rejects(cancel, (e) => e.kind === 'cancelled')
  } finally {
    server.closeAllConnections()
    server.close()
  }
  const tlsDir = out + '/tls'
  fs.mkdirSync(tlsDir, { recursive: true })
  require('child_process').execFileSync(
    'openssl',
    [
      'req',
      '-x509',
      '-newkey',
      'rsa:2048',
      '-keyout',
      tlsDir + '/key.pem',
      '-out',
      tlsDir + '/cert.pem',
      '-sha256',
      '-days',
      '1',
      '-nodes',
      '-subj',
      '/CN=localhost',
    ],
    { stdio: 'ignore' },
  )
  const tls = require('https').createServer(
    {
      key: fs.readFileSync(tlsDir + '/key.pem'),
      cert: fs.readFileSync(tlsDir + '/cert.pem'),
    },
    (req, res) => res.end('not trusted'),
  )
  await new Promise((r) => tls.listen(4330, '127.0.0.1', r))
  try {
    await assert.rejects(
      networkFetch('https://127.0.0.1:4330', {}, { retries: 0 }),
      (e) => e.kind === 'network',
    )
  } finally {
    tls.closeAllConnections()
    tls.close()
  }
  await assert.rejects(
    networkFetch('http://127.0.0.1:4329/refused', {}, { retries: 0 }),
    (e) => e.kind === 'network',
  )
  const map = new Map()
  global.localStorage = {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  }
  const serverDoc = new Y.Doc(),
    initial = new Y.Map()
  serverDoc.getMap('shots').set('a', initial)
  initial.set('coverage', new Y.Text('Base '))
  const a = new Y.Doc()
  Y.applyUpdate(a, Y.encodeStateAsUpdate(serverDoc))
  const errors = [],
    cache = pendingDocument(a, 'shots', 'document', 103, (e) =>
      errors.push(e),
    )
  cache.recover()
  a.getMap('shots').get('a').get('coverage').insert(5, 'local ')
  assert.equal(map.size, 1)
  serverDoc.getMap('shots').get('a').get('coverage').insert(5, 'peer ')
  cache.destroy()
  const b = new Y.Doc()
  Y.applyUpdate(b, Y.encodeStateAsUpdate(serverDoc))
  const other = pendingDocument(b, 'shots', 'document', 102, (e) =>
    errors.push(e),
  )
  other.recover()
  assert(
    !b
      .getMap('shots')
      .get('a')
      .get('coverage')
      .toString()
      .includes('local'),
  )
  other.destroy()
  const recover = pendingDocument(b, 'shots', 'document', 103, (e) =>
    errors.push(e),
  )
  recover.recover()
  assert(
    b
      .getMap('shots')
      .get('a')
      .get('coverage')
      .toString()
      .includes('local'),
  )
  assert(
    b.getMap('shots').get('a').get('coverage').toString().includes('peer'),
  )
  recover.confirm()
  assert.equal(map.size, 0)
  recover.destroy()
  assert.deepEqual(errors, [])
  console.log(
    'Request timeout/refusal recovery, bounded read retries, no blind mutation replay, status classification, cancellation; account-scoped pending CRDT deltas merge with newer peer changes after authorized synchronization and clear only on confirmation passed.',
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
