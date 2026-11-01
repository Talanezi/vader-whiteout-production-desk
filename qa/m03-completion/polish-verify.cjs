/* Final ten-correction acceptance only; no workbook, stress or PDF benchmark reruns. */
const { spawnSync } = require('node:child_process'),
  path = require('node:path'),
  runtime = process.env.M03_RUNTIME || '/tmp/m032/runtime'
function run(command, args) {
  const r = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, M03_RUNTIME: runtime },
  })
  if (r.status !== 0) process.exit(r.status || 1)
}
run(path.join(runtime, 'qa/node_modules/.bin/tsx'), [
  '--tsconfig',
  path.join(runtime, 'client-tsconfig.json'),
  '--test',
  'qa/m03-completion/polish-model.test.ts',
])
for (const name of [
  'polish',
  'polish-index',
  'polish-layout',
  'polish-animation',
  'polish-errors',
  'polish-preferences',
  'roles',
  'polish-zoom',
  'days',
  'import-ui',
])
  run(process.execPath, ['qa/m03-completion/' + name + '.cjs'])
