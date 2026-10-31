const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  vm = require('vm')
const ts = require('../../node_modules/typescript')
const source = fs.readFileSync(
  path.join(__dirname, '../../src/lib/rosterImport.ts'),
  'utf8',
)
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText
const exported = {}
vm.runInNewContext(compiled, { exports: exported })
const parse = (text) =>
  JSON.parse(JSON.stringify(exported.parseRosterLines(text)))
test('imports existing pipe and comma formats, ignores empty/name-less lines, and keeps source rows for retry', () => {
  const rows = parse(
    '\n Maya | crew | Camera | m@example.test | 123 | Lens prep\r\nElias,actor,Lead,e@example.test,,\n ,crew,No name\n',
  )
  assert.equal(rows.length, 2)
  assert.equal(rows[0].person.notes, 'Lens prep')
  assert.equal(rows[1].person.category, 'cast')
  assert.equal(rows[1].person.active, true)
  assert.equal(
    rows[0].source,
    'Maya | crew | Camera | m@example.test | 123 | Lens prep',
  )
})
test('normalizes original aliases and defaults unknown categories without dropping contacts', () => {
  assert.deepEqual(
    parse('A,actress\nB,emergency contact\nC,contact\nD,new-category').map(
      (x) => x.person.category,
    ),
    ['cast', 'emergency', 'emergency', 'other'],
  )
})
test('preserves optional empty fields; the existing parser does not pretend to handle quoted CSV', () => {
  const row = parse('No contact details')[0]
  assert.equal(row.person.email, '')
  assert.equal(row.person.phone, '')
  assert.equal(row.person.notes, '')
  const unsupported = parse('Person,crew,"Camera, Lighting"')[0]
  assert.equal(unsupported.person.roleOrDepartment, '"Camera')
})
