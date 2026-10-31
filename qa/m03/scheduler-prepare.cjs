// Isolated build of the actual Scheduler source; never writes its dependencies/dist.
const fs = require('node:fs'),
  path = require('node:path'),
  { spawnSync } = require('node:child_process')
const scheduler = path.resolve(
  __dirname,
  '../../../vader-whiteout-scheduler/server',
)
const runtime =
  process.env.M03_SCHEDULER_RUNTIME || '/tmp/whiteout-membership-scheduler'
fs.mkdirSync(runtime, { recursive: true })
for (const file of ['package.json', 'package-lock.json'])
  fs.copyFileSync(path.join(scheduler, file), path.join(runtime, file))
if (process.argv.includes('--install')) {
  const r = spawnSync(
    'npm',
    [
      'ci',
      '--cache',
      path.join(runtime, 'npm-cache'),
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
    ],
    { cwd: runtime, stdio: 'inherit' },
  )
  if (r.error) throw r.error
  if (r.status !== 0) process.exit(r.status ?? 1)
}
const config = {
  extends: path.join(scheduler, 'tsconfig.build.json'),
  compilerOptions: {
    rootDir: scheduler,
    outDir: path.join(runtime, 'build'),
    incremental: false,
    baseUrl: scheduler,
    paths: { '*': [path.join(runtime, 'node_modules/*')] },
    typeRoots: [path.join(runtime, 'node_modules/@types')],
  },
  include: [path.join(scheduler, 'src/**/*.ts')],
  exclude: ['**/*.spec.ts'],
}
for (const name of fs.readdirSync(path.join(runtime, 'node_modules/@types'))) {
  const pkg = path.join(runtime, 'node_modules', name, 'package.json')
  if (fs.existsSync(pkg)) {
    const meta = JSON.parse(fs.readFileSync(pkg))
    if (!meta.types && !meta.typings) {
      config.compilerOptions.paths[name] = [
        path.join(runtime, 'node_modules/@types', name, 'index.d.ts'),
      ]
      config.compilerOptions.paths[name + '/*'] = [
        path.join(runtime, 'node_modules/@types', name, '*'),
      ]
    }
  }
}
const file = path.join(runtime, 'tsconfig.json')
fs.writeFileSync(file, JSON.stringify(config, null, 2))
const r = spawnSync(
  process.execPath,
  [path.join(runtime, 'node_modules/typescript/bin/tsc'), '-p', file],
  { stdio: 'inherit' },
)
if (r.error) throw r.error
process.exitCode = r.status ?? 1
if (r.status === 0) console.log('Actual Scheduler server TypeScript build passed in the isolated runtime.')
