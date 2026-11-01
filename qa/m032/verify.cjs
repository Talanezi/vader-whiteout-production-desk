/* Real local QA only. Start the documented isolated stack first. */
const fs = require('node:fs'),
  path = require('node:path'),
  { spawnSync } = require('node:child_process')
const runtime = process.env.M03_RUNTIME || '/tmp/m032/runtime',
  root = path.resolve(__dirname, '../..'),
  out = path.join(root, 'client/qa/m032/artifacts')
const state = JSON.parse(
  fs.readFileSync(path.join(runtime, 'local-state.json')),
)
for (const key of ['root', 'api', 'databaseUrl'])
  if (new URL(state[key]).hostname !== '127.0.0.1')
    throw Error('Disposable loopback stack required')
fs.mkdirSync(out, { recursive: true })
const tsx = path.join(runtime, 'qa/node_modules/.bin/tsx'),
  tsargs = ['--tsconfig', path.join(runtime, 'client-tsconfig.json')]
const commands = [
  [tsx, [...tsargs, '--test', 'qa/m032/domain.test.ts']],
  [tsx, [...tsargs, '--test', 'qa/m03/import.test.ts']],
  ...['team-access', 'integration', 'security-and-migration', 'legacy-api'].map(
    (n) => [process.execPath, ['qa/m03/' + n + '.cjs']],
  ),
  ...['collaboration', 'legacy-pdf', 'browser', 'indexes'].map((n) => [
    process.execPath,
    ['qa/m032/' + n + '.cjs'],
  ]),
  [tsx, [...tsargs, 'qa/m032/workbook-persistence.ts']],
  ...[
    'print',
    'print-ui',
    'api',
    'touch',
    'viewports',
    'zoom',
    'performance',
  ].map((n) => [process.execPath, ['qa/m032/' + n + '.cjs']]),
  ...['browser', 'workflows', 'engines', 'zoom', 'fallback'].map((n) => [
    process.execPath,
    ['qa/m03/' + n + '.cjs'],
  ]),
  [process.execPath, ['--test', 'client/qa/m02/parser.test.cjs']],
  [process.execPath, ['client/qa/m02/verify.cjs']],
  [process.execPath, ['qa/m031/visual.cjs']],
]
const results = []
for (const [cmd, args] of commands) {
  console.log('RUN', args.at(-1))
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      M03_RUNTIME: runtime,
      PD_PREVIEW_URL: state.root,
      PD_QA_OUTPUT: path.join(out, 'm02'),
    },
  })
  results.push({ script: args.at(-1), pass: r.status === 0 })
  fs.writeFileSync(
    path.join(out, 'suite.json'),
    JSON.stringify(results, null, 2),
  )
  if (r.error) throw r.error
  if (r.status !== 0) process.exit(r.status || 1)
}
