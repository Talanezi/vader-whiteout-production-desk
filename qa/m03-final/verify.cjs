/* Disposable loopback stack only; sequential because browser checks share services. */
const { runtime, out } = require('../m032/helpers.cjs')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs'),
  path = require('node:path')
const root = path.resolve(__dirname, '../..')
const commands = [
  [
    path.join(runtime, 'qa/node_modules/.bin/tsx'),
    [
      '--tsconfig',
      path.join(runtime, 'client-tsconfig.json'),
      '--test',
      'qa/m032/domain.test.ts',
      'qa/m03-final/identifier.test.ts',
    ],
  ],
  ...['acceptance', 'preview-races', 'product', 'day-lifecycle', 'mobile', 'paper'].map(
    (name) => [process.execPath, ['qa/m03-final/' + name + '.cjs']],
  ),
]
const results = []
fs.mkdirSync(path.join(out, 'final'), { recursive: true })
for (const [cmd, args] of commands) {
  console.log('RUN', args.at(-1))
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  results.push({ script: args.at(-1), pass: result.status === 0 })
  fs.writeFileSync(
    path.join(out, 'final', 'suite.json'),
    JSON.stringify(results, null, 2),
  )
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status || 1)
}
