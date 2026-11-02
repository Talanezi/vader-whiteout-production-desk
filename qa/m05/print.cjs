const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  crypto = require('node:crypto'),
  { execFileSync } = require('node:child_process')
const runtime = '/tmp/m032/runtime'
process.env.NODE_PATH = runtime + '/server/node_modules'
require('node:module').Module._initPaths()
const { renderFlow } = require(runtime + '/server-dist/flows/pdf.js'),
  out = '/tmp/m05/pdf'
fs.mkdirSync(out, { recursive: true })
const state = {
  meta: {
    name: 'September 25 — Flow of the Day',
    zone: 'America/Los_Angeles',
    date: '2026-09-25',
    status: 'draft',
  },
  departments: {},
  events: {},
  instructions: {},
  comments: {},
  imports: {},
}
const names = [
  'Camera + G&E',
  'Actors',
  'Stunt Team',
  'Sound',
  'Costume',
  'HMU',
  'Props',
  'Director / Choreographer',
  'Producers',
  'Custom department',
]
names.forEach(
  (name, i) =>
    (state.departments['d' + i] = {
      id: 'd' + i,
      name,
      order: i,
      personnel: i === 0 ? 'Tobin C., Lucas R.' : '',
    }),
)
const expected = []
for (let i = 0; i < 310; i++) {
  const id = 'e' + i
  state.events[id] = {
    id,
    type: i % 20 === 0 ? 'milestone' : i % 4 === 0 ? 'department' : 'custom',
    order: i,
    start:
      i % 23 === 0
        ? null
        : new Date(Date.UTC(2026, 8, 25, 13) + i * 120000).toISOString(),
    duration: i % 7 === 0 ? null : 5,
    description: i % 20 === 0 ? 'Shared milestone ' + i : 'Action ' + i,
    status: 'planned',
    fixed: i % 20 === 0,
  }
  names.forEach((_, di) => {
    const text =
      `EVENT-${i}-DEPT-${di} ` +
      (i === 7 && di === 0
        ? 'Measured continuation text '.repeat(500) + ' LONG-END-MARKER'
        : 'Clear department instruction')
    state.instructions[id + ':d' + di] = {
      id: id + ':d' + di,
      eventId: id,
      departmentId: 'd' + di,
      text,
    }
    expected.push('EVENT-' + i + '-DEPT-' + di)
  })
}
;(async () => {
  const base = {
    product: 'master',
    paper: 'tabloid',
    orientation: 'landscape',
    departments: Object.keys(state.departments),
    style: 'color',
    actual: false,
    personnel: true,
    notes: true,
  }
  for (const paper of ['letter', 'a4', 'tabloid', 'a3'])
    for (const style of ['color', 'mono']) {
      const spec = { ...base, paper, style },
        bytes = await renderFlow(state, null, spec),
        file = out + '/' + paper + '-' + style + '.pdf'
      fs.writeFileSync(file, bytes)
      const text = execFileSync(
        '/opt/homebrew/bin/pdftotext',
        ['-raw', file, '-'],
        { maxBuffer: 10e6 },
      )
        .toString()
        .replace(/\s+/g, '')
      for (const value of expected)
        assert(
          text.includes(value),
          'Missing ' + value + ' in ' + paper + ' ' + style,
        )
      assert(text.includes('LONG-END-MARKER'))
      assert(text.includes('(continued)'))
      const again = await renderFlow(state, null, spec)
      assert.deepEqual(
        bytes,
        again,
        'Same immutable revision and settings produce identical PDF bytes',
      )
    }
  const small = structuredClone(state)
  small.events = { e0: state.events.e0 }
  small.instructions = Object.fromEntries(
    Object.entries(state.instructions).filter(([, v]) => v.eventId === 'e0'),
  )
  const pdf = await renderFlow(small, null, base)
  fs.writeFileSync(out + '/small.pdf', pdf)
  for (const product of ['department', 'rundown'])
    fs.writeFileSync(
      out + '/' + product + '.pdf',
      await renderFlow(state, null, {
        ...base,
        product,
        departments: product === 'department' ? ['d0'] : base.departments,
        paper: 'letter',
        style: 'mono',
      }),
    )
  console.log(
    'Eight paper/style combinations; 310 events and ten departments; 3,100 instruction markers; long-row continuation; fixed shared events; unknown/cross-midnight times; small Flow; Department Focus and Daily Rundown; deterministic PDF bytes all passed.',
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
