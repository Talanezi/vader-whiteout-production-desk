// Focused final-completion journeys; only disposable loopback records are mutated.
const fs = require('node:fs')
const { spawnSync } = require('node:child_process')
function run(name, env = {}) {
  const result = spawnSync(process.execPath, [`qa/m04/${name}.cjs`], {
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })
  if (result.status !== 0) process.exit(result.status || 1)
}
for (const file of [
  'studio-engine',
  'studio-long-path-pdf',
  'creative-geometry',
  'panel-identity',
  'collaboration-error',
])
  run(file)
if (!fs.existsSync('/tmp/m04/studio-import-record.json')) run('studio-import')
if (!fs.existsSync('/tmp/m04/studio-scene16-record.json')) run('studio-scene16')
for (const browser of ['chromium', 'webkit']) {
  for (const file of [
    'studio-final-controls',
    'studio-finishing-input',
    'studio-finishing-gestures',
    'studio-finishing-inspector',
    'studio-finishing-artwork',
    'studio-finishing-ecosystem',
    'studio-finishing-layout',
    'studio-finishing-upload',
  ])
    run(file, { M04_BROWSER: browser })
}
for (const file of ['collaboration', 'security', 'reconnect', 'regression'])
  run(file)
console.log(
  'Final-completion journeys passed. Physical stylus and operating-system screen eyedropper checks are manual; native Chrome zoom is a separate M04_NATIVE_ZOOM=1 node qa/m04/studio-finishing-layout.cjs run.',
)
