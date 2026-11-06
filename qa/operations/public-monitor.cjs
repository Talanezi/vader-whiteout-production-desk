// Public, read-only checks: no sessions, private data or production mutations.
const fs = require('fs'),
  dns = require('dns').promises
const targets = [
  ['website', 'https://vaderwhiteout.com/productiondesk/', 200],
  ['desk-ready', 'https://api.vaderwhiteout.com/api/ready', 200],
  [
    'upload-private-boundary',
    'https://uploads.vaderwhiteout.com/api/storyboards',
    401,
  ],
  [
    'desk-private-boundary',
    'https://api.vaderwhiteout.com/api/flows',
    401,
  ],
  [
    'scheduler-ready',
    'https://scheduler-api.vaderwhiteout.com/api/server-info/ready',
    200,
  ],
  [
    'scheduler-features',
    'https://scheduler-api.vaderwhiteout.com/api/server-info',
    200,
  ],
  [
    'scheduler-private-boundary',
    'https://scheduler-api.vaderwhiteout.com/api/me',
    401,
  ],
]
async function request(name, url, status) {
  const at = Date.now()
  try {
    const r = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        cache: 'no-store',
      }),
      body = name.endsWith('ready') ? await r.json() : null
    return {
      name,
      url,
      status: r.status,
      ms: Date.now() - at,
      pass: r.status === status && (!body || body.ok === true) && (name!=='desk-ready'||!process.env.GITHUB_SHA||body?.revision===process.env.GITHUB_SHA) && (!name.includes('private-boundary')||r.headers.get('cf-cache-status')!=='HIT'),
      revision: body?.revision || null,
      cache: r.headers.get('cf-cache-status'),
      requestId: r.headers.get('x-request-id'),
    }
  } catch (e) {
    return {
      name,
      url,
      pass: false,
      error: e.cause?.code || e.name,
      ms: Date.now() - at,
    }
  }
}
async function websocket() {
  return new Promise((resolve) => {
    const https = require('https'),
      crypto = require('crypto'),
      at = Date.now(),
      key = crypto.randomBytes(16).toString('base64'),
      r = https.request(
        'https://api.vaderwhiteout.com/api/shotlists/collaboration',
        {
          headers: {
            Connection: 'Upgrade',
            Upgrade: 'websocket',
            'Sec-WebSocket-Key': key,
            'Sec-WebSocket-Version': '13',
            Origin: 'https://vaderwhiteout.com',
          },
        },
      )
    r.setTimeout(10000, () => r.destroy(Error('timeout')))
    r.on('upgrade', (res, socket) => {
      socket.destroy()
      resolve({
        name: 'collaboration-transport',
        pass:
          res.statusCode === 101 &&
          res.headers['sec-websocket-accept'] ===
            crypto
              .createHash('sha1')
              .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
              .digest('base64'),
        ms: Date.now() - at,
        scope: 'TLS and validated upgrade only; no private document',
      })
    })
    r.on('response', (res) => {
      res.resume()
      resolve({
        name: 'collaboration-transport',
        pass: false,
        status: res.statusCode,
      })
    })
    r.on('error', (e) =>
      resolve({
        name: 'collaboration-transport',
        pass: false,
        error: e.code || e.message,
      }),
    )
    r.end()
  })
}
;(async () => {
  const results = await Promise.all(targets.map((v) => request(...v)))
  for (const host of [
    'api.vaderwhiteout.com',
    'scheduler-api.vaderwhiteout.com',
  ]) {
    try {
      results.push({
        name: 'system-dns',
        host,
        addresses: await dns.resolve4(host),
        pass: true,
      })
    } catch (e) {
      results.push({
        name: 'system-dns',
        host,
        error: e.code,
        pass: false,
      })
    }
    for (const [provider, url] of [
      ['cloudflare', 'https://cloudflare-dns.com/dns-query'],
      ['google', 'https://dns.google/resolve'],
    ]) {
      try {
        const r = await fetch(url + '?name=' + host + '&type=A', {
            headers: { Accept: 'application/dns-json' },
            signal: AbortSignal.timeout(10000),
          }),
          v = await r.json()
        results.push({
          name: 'external-dns',
          provider,
          host,
          pass: v.Status === 0 && v.Answer?.length > 0,
          status: v.Status,
        })
      } catch (e) {
        results.push({
          name: 'external-dns',
          provider,
          host,
          pass: false,
          error: e.name,
        })
      }
    }
  }
  results.push(await websocket())
  const report = {
    at: new Date().toISOString(),
    runner: process.env.GITHUB_ACTIONS ? 'github-actions' : 'local',
    commit: process.env.GITHUB_SHA || null,
    pass: results.every((r) => r.pass),
    results,
  }
  fs.writeFileSync(
    process.env.MONITOR_OUTPUT || 'public-monitor.json',
    JSON.stringify(report, null, 2),
  )
  for (const r of results)
    console.log(
      r.name,
      r.host || r.url || '',
      r.pass ? 'PASS' : 'FAIL',
      r.status || r.error || '',
      r.revision || '',
    )
  if (!report.pass) process.exitCode = 1
})()
