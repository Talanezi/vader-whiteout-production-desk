/* Reproducible isolated builds. Does not install into tracked node_modules. */
const fs = require('node:fs'),
  path = require('node:path'),
  os = require('node:os'),
  { spawnSync } = require('node:child_process')
const root = path.resolve(__dirname, '../..'),
  runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research'
if (Number(process.versions.node.split('.')[0]) !== 22)
  throw new Error('Use Node 22 (see .nvmrc).')
function run(cmd, args, cwd = root, extra = {}) {
  const result = spawnSync(cmd, args, {
    cwd,
    env: { ...process.env, ...extra },
    stdio: 'inherit',
  })
  if (result.status !== 0) throw new Error(`${cmd} failed (${result.status})`)
}
fs.mkdirSync(runtime, { recursive: true })
for (const part of ['client', 'server', 'qa']) {
  const source =
      part === 'qa' ? path.join(root, 'qa/m03') : path.join(root, part),
    destination = path.join(runtime, part)
  fs.mkdirSync(destination, { recursive: true })
  for (const file of ['package.json', 'package-lock.json'])
    fs.copyFileSync(path.join(source, file), path.join(destination, file))
  if (process.argv.includes('--install'))
    run(
      'npm',
      [
        'ci',
        '--cache',
        path.join(runtime, 'npm-cache'),
        '--no-audit',
        '--no-fund',
        ...(part === 'qa' ? [] : ['--ignore-scripts']),
      ],
      destination,
    )
  if (!fs.existsSync(path.join(destination, 'node_modules')))
    throw new Error('Dependencies missing. Run with --install.')
}
for (const part of ['client', 'server']) {
  const config = {
    extends: path.join(
      root,
      part,
      part === 'client' ? 'tsconfig.app.json' : 'tsconfig.json',
    ),
    compilerOptions: {
      baseUrl: path.join(root, part),
      paths: {
        '*': [
          path.join(runtime, part, 'node_modules/*'),
          path.join(runtime, 'qa/node_modules/*'),
        ],
      },
      tsBuildInfoFile: path.join(runtime, part + '.tsbuildinfo'),
      typeRoots: [
        path.join(runtime, part, 'node_modules/@types'),
        path.join(runtime, 'qa/node_modules/@types'),
      ],
    },
    include: [path.join(root, part, 'src/**/*')],
    exclude: ['node_modules', 'dist'],
  }
  if (part === 'client')
    Object.assign(config.compilerOptions.paths, {
      react: [
        path.join(runtime, 'client/node_modules/@types/react/index.d.ts'),
      ],
      'react/*': [path.join(runtime, 'client/node_modules/@types/react/*')],
      'react-dom': [
        path.join(runtime, 'client/node_modules/@types/react-dom/index.d.ts'),
      ],
      'react-dom/*': [
        path.join(runtime, 'client/node_modules/@types/react-dom/*'),
      ],
    })
  else config.compilerOptions.outDir = path.join(runtime, 'server-dist')
  fs.writeFileSync(
    path.join(runtime, part + '-tsconfig.json'),
    JSON.stringify(config, null, 2),
  )
}
const deps = Object.keys(
  JSON.parse(fs.readFileSync(path.join(root, 'client/package.json')))
    .dependencies,
)
const alias = deps.map((find) => ({
  find,
  replacement: path.join(runtime, 'client/node_modules', find),
}))
alias.unshift({
  find: 'react-dom/client',
  replacement: path.join(runtime, 'client/node_modules/react-dom/client.js'),
})
fs.writeFileSync(
  path.join(runtime, 'vite.config.mts'),
  `import config from ${JSON.stringify(path.join(root, 'client/vite.config.ts'))};\nexport default {...config,root:${JSON.stringify(path.join(root, 'client'))},cacheDir:${JSON.stringify(path.join(runtime, 'vite-cache'))},resolve:{alias:${JSON.stringify(alias)}},server:{host:'127.0.0.1',port:5175,strictPort:true}}\n`,
)
run(process.execPath, [
  path.join(runtime, 'client/node_modules/typescript/bin/tsc'),
  '-p',
  path.join(runtime, 'client-tsconfig.json'),
  '--noEmit',
])
run(process.execPath, [
  path.join(runtime, 'server/node_modules/typescript/bin/tsc'),
  '-p',
  path.join(runtime, 'server-tsconfig.json'),
])
const binary = path.join(
  runtime,
  `client/node_modules/@esbuild/${process.platform}-${process.arch}/bin/esbuild`,
)
const env = {
  NODE_PATH: path.join(runtime, 'client/node_modules'),
  ...(fs.existsSync(binary) ? { ESBUILD_BINARY_PATH: binary } : {}),
}
run(
  process.execPath,
  [
    path.join(runtime, 'client/node_modules/vite/bin/vite.js'),
    'build',
    '--config',
    path.join(runtime, 'vite.config.mts'),
    '--outDir',
    path.join(runtime, 'client-dist'),
    '--emptyOutDir',
  ],
  root,
  env,
)
console.log(
  'M03 isolated builds complete. Source dependencies, caches and bundles remain untouched.',
)
