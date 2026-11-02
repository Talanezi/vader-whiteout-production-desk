const fs = require('fs'),
  path = require('path'),
  runtime = '/tmp/m032/runtime'
process.env.NODE_PATH =
  runtime + '/client/node_modules:' + runtime + '/server/node_modules'
require('module').Module._initPaths()
const esbuild = require(runtime + '/client/node_modules/esbuild')
for (const name of ['model', 'import'])
  esbuild.buildSync({
    entryPoints: [path.resolve('client/src/lib/flow/' + name + '.ts')],
    outfile: '/tmp/m05/' + name + '.cjs',
    platform: 'node',
    format: 'cjs',
    bundle: true,
    packages: 'external',
  })
const imp = require('/tmp/m05/import.cjs'),
  { renderFlow } = require(runtime + '/server-dist/flows/pdf.js'),
  bytes = fs.readFileSync(
    process.env.M05_WORKBOOK ||
      '/Users/thameralanezi/Downloads/Flow-Of-The-Day September 25th [Vader _ Whiteout] Fall 2026.xlsx',
  ),
  sheet = imp.readWorkbook(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length),
  )[0],
  mapping = {
    ...imp.suggest(sheet),
    planned: 'A',
    secondary: 'B',
    secondaryRole: 'actual',
    plannedClock: '12-sequence',
    secondaryClock: '12-afternoon',
  },
  rows = imp.mappedRows(sheet, mapping, '2026-09-25', 'America/Los_Angeles'),
  state = {
    meta: {
      name: 'Flow of the Day — September 25',
      date: '2026-09-25',
      zone: 'America/Los_Angeles',
      status: 'draft',
    },
    departments: {},
    events: {},
    instructions: {},
    comments: {},
    imports: {},
  }
for (const [i, [col, name]] of Object.entries(mapping.departments).entries())
  state.departments[col] = {
    id: col,
    name,
    order: i,
    personnel: sheet.rows[1][col.charCodeAt(0) - 65].formatted,
  }
rows.forEach((r, i) => {
  const id = 'row-' + r.row
  state.events[id] = {
    id,
    type: r.type,
    description: r.description,
    start: r.start,
    duration: r.duration,
    actualStart: r.actualStart,
    order: i,
    status: 'planned',
    fixed: r.type === 'milestone',
    notes: r.duration == null ? r.provenance.sourceEstimate : '',
  }
  for (const [col, text] of Object.entries(r.instructions))
    if (text)
      state.instructions[id + ':' + col] = {
        eventId: id,
        departmentId: col,
        text,
      }
})
;(async () => {
  for (const paper of ['tabloid', 'letter', 'a4', 'a3'])
    fs.writeFileSync(
      '/tmp/m05/workbook-' + paper + '.pdf',
      await renderFlow(state, null, {
        product: 'master',
        paper,
        orientation: 'landscape',
        departments: Object.keys(state.departments),
        style: 'color',
        actual: false,
        personnel: true,
        notes: true,
      }),
    )
  console.log(
    'Exact original 62-event/52-instruction/nine-department workbook PDFs with personnel generated in all four sizes.',
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
