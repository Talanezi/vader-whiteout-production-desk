/* Sequential, disposable local QA. See README before running. */
const { spawnSync } = require('node:child_process'),
  path = require('node:path')
const runtime = process.env.M03_RUNTIME || '/tmp/m032/runtime'
if (!process.env.M03_WORKBOOK)
  throw Error('Set M03_WORKBOOK to the original local workbook.')
function run(command, args) {
  console.log('\nRUN', command, ...args)
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, M03_RUNTIME: runtime },
  })
  if (result.status !== 0) process.exit(result.status || 1)
}
run(path.join(runtime, 'qa/node_modules/.bin/tsx'), [
  '--tsconfig',
  path.join(runtime, 'client-tsconfig.json'),
  '--test',
  'qa/m032/domain.test.ts',
  'qa/m03-final/identifier.test.ts',
  'qa/m03-completion/identifier.test.ts',
  'qa/m03/import.test.ts',
])
run(path.join(runtime, 'qa/node_modules/.bin/tsx'), [
  '--tsconfig',
  path.join(runtime, 'client-tsconfig.json'),
  'qa/m03-completion/workbook-seed.ts',
])
for (const name of [
  'integration',
  'workbook',
  'pdf-edges',
  'unicode',
  'browser',
  'workspace',
  'duplicate',
  'roles',
  'columns',
  'days',
  'day-lifecycle',
  'import-ui',
  'acceptance',
  'paper',
  'mobile',
  'collaboration',
  'performance',
  'zoom',
])
  run(process.execPath, ['qa/m03-completion/' + name + '.cjs'])
run(process.execPath, ['qa/m03/team-access.cjs'])
run(process.execPath, ['qa/m032/legacy-pdf.cjs'])
run('python3', ['qa/m03-completion/bounds.py'])
