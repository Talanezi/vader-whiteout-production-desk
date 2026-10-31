/* Local QA only. No production module imports this Scheduler test authority. */
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http')
const { randomBytes } = require('node:crypto'),
  { spawn } = require('node:child_process')
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research'
const stateFile = path.join(runtime, 'local-state.json')
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
async function main() {
  const { default: EmbeddedPostgres } = await import(
    path.join(runtime, 'qa/node_modules/embedded-postgres/dist/index.js')
  )
  const databaseDir = path.join(runtime, 'pg-data')
  const pg = new EmbeddedPostgres({
    databaseDir,
    port: 55432,
    user: 'whiteout_qa',
    password: 'local-qa-only',
    persistent: true,
    postgresFlags: ['-h', '127.0.0.1'],
    onLog: () => {},
    onError: (e) => console.error(String(e)),
  })
  if (!fs.existsSync(path.join(databaseDir, 'PG_VERSION')))
    await pg.initialise()
  await pg.start()
  const client = pg.getPgClient()
  await client.connect()
  if (
    !(
      await client.query(
        "SELECT 1 FROM pg_database WHERE datname='whiteout_m03'",
      )
    ).rowCount
  )
    await pg.createDatabase('whiteout_m03')
  await client.end()
  const users = [
    { userID: 101, name: 'Maya Chen', email: 'director@example.test' },
    { userID: 102, name: 'Elias Moreno', email: 'dp@example.test' },
    { userID: 103, name: 'Samira Okafor', email: 'ad@example.test' },
    { userID: 999, name: 'Unapproved User', email: 'unapproved@example.test' },
  ]
  const tokens = Object.fromEntries(
    users.map((user) => [String(user.userID), randomBytes(24).toString('hex')]),
  )
  const revoked = new Set()
  const authority = http.createServer((req, res) => {
    if (req.url === '/api/me') {
      const token = (req.headers.authorization || '').replace(/^Bearer /, '')
      const user = users.find(
        (u) => tokens[String(u.userID)] === token && !revoked.has(u.userID),
      )
      res.writeHead(user ? 200 : 401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(user || { message: 'Invalid QA session' }))
      return
    }
    // Test-controller endpoint is bound to loopback in this QA process only.
    if (req.url?.startsWith('/qa/revoke/') && req.method === 'POST') {
      revoked.add(Number(req.url.split('/').pop()))
      res.end('ok')
      return
    }
    if (req.url?.startsWith('/qa/restore/') && req.method === 'POST') {
      revoked.delete(Number(req.url.split('/').pop()))
      res.end('ok')
      return
    }
    res.writeHead(404)
    res.end()
  })
  await new Promise((r) => authority.listen(4311, '127.0.0.1', r))
  const databaseUrl =
    'postgresql://whiteout_qa:local-qa-only@127.0.0.1:55432/whiteout_m03'
  await require('./legacy-bootstrap.cjs')(databaseUrl,runtime)
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    SCHEDULER_API_BASE_URL: 'http://127.0.0.1:4311',
    PORT: '4310',
    HOST: '127.0.0.1',
    SHOTLIST_COLLABORATOR_IDS: '101,102,103',
    SHOTLIST_ALLOWED_ORIGINS: 'http://127.0.0.1:5175,http://localhost:5175',
    NODE_PATH: [
      path.join(runtime, 'server/node_modules'),
      path.join(runtime, 'qa/node_modules'),
    ].join(path.delimiter),
  }
  const run = (file, args = []) =>
    spawn(process.execPath, [file, ...args], {
      env,
      stdio: ['ignore', 'inherit', 'inherit'],
    })
  const migration = run(path.join(runtime, 'server-dist/shotlists/migrate.js'))
  await new Promise((resolve, reject) =>
    migration.on('exit', (code) =>
      code ? reject(new Error('Local migration failed')) : resolve(),
    ),
  )
  let server
  const launch = async () => {
    server = run(path.join(runtime, 'server-dist/main.js'))
    for (let i = 0; i < 100; i++) {
      try {
        await fetch('http://127.0.0.1:4310/api/shotlists', {
          headers: { Authorization: `Bearer ${tokens['101']}` },
        })
        return
      } catch {}
      await wait(150)
    }
    throw new Error('Local backend did not start')
  }
  await launch()
  // A loopback-only control socket lets integration tests restart the actual
  // Nest process while keeping the database and test authority alive.
  const control = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/restart') {
      server.kill('SIGTERM')
      await new Promise((r) => server.once('exit', r))
      await launch()
      res.end('restarted')
      return
    }
    res.writeHead(404)
    res.end()
  })
  await new Promise((r) => control.listen(4312, '127.0.0.1', r))
  fs.writeFileSync(
    stateFile,
    JSON.stringify(
      {
        tokens,
        users,
        databaseUrl,
        api: 'http://127.0.0.1:4310/api',
        root: 'http://127.0.0.1:5175/productiondesk/',
      },
      null,
      2,
    ),
    { mode: 0o600 },
  )
  console.log(
    'M03 LOCAL STACK READY · isolated PostgreSQL + real Nest/Hocuspocus + QA identity authority. No production services.',
  )
  const stop = async () => {
    control.close()
    authority.close()
    const stopped=server && server.exitCode===null ? new Promise(resolve=>server.once('exit',resolve)) : Promise.resolve()
    server?.kill('SIGTERM')
    await stopped
    await pg.stop()
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
