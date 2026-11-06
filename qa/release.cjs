/* Local static publication for the existing GitHub Pages repository. No Git/deploy side effects. */
const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  crypto = require('node:crypto'),
  { spawnSync } = require('node:child_process')
const repo = path.resolve(__dirname, '..'),
  site = path.resolve(repo, '../vader-whiteout-site'),
  runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research',
  api = 'https://api.vaderwhiteout.com/api'
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex')
function tree(root, skipGit = false, prefix = '') {
  const out = {}
  for (const name of fs.readdirSync(path.join(root, prefix))) {
    if (skipGit && name === '.git') continue
    const rel = path.join(prefix, name),
      file = path.join(root, rel)
    if (fs.lstatSync(file).isSymbolicLink())
      throw Error('Unexpected symlink ' + file)
    if (fs.statSync(file).isDirectory())
      Object.assign(out, tree(root, skipGit, rel))
    else out[rel] = sha(fs.readFileSync(file))
  }
  return out
}
const schedulerArg = process.argv.indexOf('--scheduler-build'),
  scheduler = schedulerArg >= 0 ? process.argv[schedulerArg + 1] : null
if (schedulerArg >= 0 && !scheduler)
  throw Error('Supply the fresh Scheduler build path.')
const scopes = ['productiondesk', ...(scheduler ? ['scheduler'] : [])],
  before = tree(site, true)
const result = spawnSync(process.execPath, ['qa/m03/prepare.cjs'], {
  cwd: repo,
  stdio: 'inherit',
  env: { ...process.env, VITE_API_BASE_URL: api, NODE_ENV: 'production' },
})
if (result.status !== 0) process.exit(result.status || 1)
const fresh = path.join(runtime, 'client-dist'),
  html = fs.readFileSync(path.join(fresh, 'index.html'), 'utf8')
if (
  !html.includes('/productiondesk/assets/') ||
  !html.includes('Production Desk')
)
  throw Error('Wrong production base/title.')
let js = ''
for (const name of fs.readdirSync(path.join(fresh, 'assets')))
  if (name.endsWith('.js'))
    js += fs.readFileSync(path.join(fresh, 'assets', name), 'utf8')
if (
  !js.includes(api) ||
  /localhost|127\.0\.0\.1|local-qa-only|LOCAL POSTGRESQL/.test(js)
)
  throw Error('Wrong production API or local fixture leakage.')
const backup = fs.mkdtempSync(
  path.join(os.tmpdir(), 'whiteout-release-backup-'),
)
const outputs = {
  productiondesk: fresh,
  ...(scheduler ? { scheduler: path.resolve(scheduler) } : {}),
}
for (const [scope, source] of Object.entries(outputs)) {
  const index = fs.readFileSync(path.join(source, 'index.html'), 'utf8')
  if (!index.includes('/' + scope + '/'))
    throw Error('Wrong static base for ' + scope)
  const target = path.join(site, scope),
    files = tree(source)
  fs.cpSync(target, path.join(backup, scope), { recursive: true })
  fs.cpSync(source, target, { recursive: true })
  for (const rel of Object.keys(tree(target)))
    if (!(rel in files)) fs.rmSync(path.join(target, rel))
  if (JSON.stringify(tree(target)) !== JSON.stringify(files))
    throw Error('Copy verification failed: ' + scope)
}
const after = tree(site, true),
  unchanged = (m) =>
    Object.fromEntries(
      Object.entries(m).filter(
        ([p]) => !scopes.some((s) => p.startsWith(s + path.sep)),
      ),
    )
if (JSON.stringify(unchanged(before)) !== JSON.stringify(unchanged(after)))
  throw Error('Unexpected changes outside published application directories.')
const report = {
  pass: true,
  base: '/productiondesk/',
  api,
  scopes,
  backup,
  otherSiteFilesUnchanged: Object.keys(unchanged(before)).length,
  files: Object.fromEntries(scopes.map((s) => [s, tree(path.join(site, s))])),
}
fs.writeFileSync(
  path.join(backup, 'verification.json'),
  JSON.stringify(report, null, 2) + '\n',
)
console.log(
  JSON.stringify(
    {
      pass: true,
      scopes,
      backup,
      otherSiteFilesUnchanged: report.otherSiteFilesUnchanged,
    },
    null,
    2,
  ),
)
