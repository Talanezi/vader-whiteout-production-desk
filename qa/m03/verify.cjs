const path = require('node:path'),
  fs = require('node:fs'),
  os = require('node:os'),
  { spawnSync } = require('node:child_process')
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research',
  root = path.resolve(__dirname, '../..')
const bundled = path.join(
  os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright',
)
const env = {
  ...process.env,
  NODE_PATH: [
    path.join(runtime, 'server/node_modules'),
    path.join(runtime, 'client/node_modules'),
    path.join(runtime, 'qa/node_modules'),
  ].join(path.delimiter),
  PLAYWRIGHT_PATH:
    process.env.PLAYWRIGHT_PATH ||
    (fs.existsSync(path.join(runtime, 'qa/node_modules/playwright'))
      ? path.join(runtime, 'qa/node_modules/playwright')
      : bundled),
  PD_PREVIEW_URL: 'http://127.0.0.1:5175/productiondesk/',
  PD_QA_OUTPUT: path.join(root, 'client/qa/m03/artifacts/m02-regression'),
}
if (!env.M03_WORKBOOK || !fs.existsSync(env.M03_WORKBOOK))
  throw new Error('Set M03_WORKBOOK to the supplied .xlsx file.')
const commands = [
  [process.execPath, ['qa/m03/integration.cjs']],
  [process.execPath, ['qa/m03/security-and-migration.cjs']],
  [process.execPath, ['qa/m03/legacy-api.cjs']],
  [
    path.join(runtime, 'qa/node_modules/.bin/tsx'),
    [
      '--tsconfig',
      path.join(runtime, 'client-tsconfig.json'),
      '--test',
      'qa/m03/import.test.ts',
    ],
  ],
  [
    path.join(runtime, 'qa/node_modules/.bin/tsx'),
    [
      '--tsconfig',
      path.join(runtime, 'client-tsconfig.json'),
      'qa/m03/workbook-persistence.ts',
    ],
  ],
  [process.execPath, ['qa/m03/browser.cjs']],
  [process.execPath, ['qa/m03/workflows.cjs']],
  [process.execPath, ['qa/m03/engines.cjs']],
  [process.execPath, ['qa/m03/zoom.cjs']],
  [process.execPath, ['qa/m03/fallback.cjs']],
  [process.execPath, ['--test', 'client/qa/m02/parser.test.cjs']],
  [process.execPath, ['client/qa/m02/verify.cjs']],
]
for (const [command, args] of commands) {
  console.log('RUN', args.at(-1))
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status || 1)
}
console.log('All M03 and M02 verification passed.')
