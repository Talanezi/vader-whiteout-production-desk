const assert = require('assert/strict'),
  runtime = '/tmp/m032/runtime'
process.env.NODE_PATH = runtime + '/client/node_modules'
require('module').Module._initPaths()
require(runtime + '/client/node_modules/esbuild').buildSync({
  entryPoints: ['client/src/lib/shotDocument.ts'],
  outfile: '/tmp/m05/corrections/shot-model.cjs',
  platform: 'node',
  format: 'cjs',
  bundle: true,
  packages: 'external',
})
const Y = require('yjs'),
  m = require('/tmp/m05/corrections/shot-model.cjs'),
  doc = new Y.Doc(),
  scene = m.addScene(doc, '9')
let a = m.addShot(doc, scene, 101)
assert.equal(m.displayShot(doc, m.shots(doc).get(a)), '09-A')
let b = m.addShot(doc, scene, 101)
assert.equal(m.displayShot(doc, m.shots(doc).get(b)), '09-B')
assert.throws(
  () => m.change(doc, m.shots(doc).get(b), 'number', 'a'),
  /already used/,
)
assert.throws(
  () => m.change(doc, m.shots(doc).get(b), 'number', '10-C'),
  /scene prefix/,
)
assert.throws(
  () => m.change(doc, m.shots(doc).get(b), 'number', '1.2'),
  /alphabetic/,
)
m.change(doc, m.shots(doc).get(b), 'number', 'aa')
assert.equal(m.displayShot(doc, m.shots(doc).get(b)), '09-AA')
m.shots(doc).get(b).set('number', '19-1.2')
m.change(
  doc,
  m.shots(doc).get(b),
  'coverage',
  'Historical content retained',
)
assert.equal(m.displayShot(doc, m.shots(doc).get(b)), '19-1.2')
m.shots(doc).get(b).set('number', 'A')
assert(m.hasShotNumberConflict(doc, m.shots(doc).get(a)))
assert.equal(m.shots(doc).get(a).get('id'), a)
console.log(
  'Canonical new alphabetic labels, scene prefix, uppercase, uniqueness, AA, legacy preservation, duplicate flag and permanent UUIDs passed.',
)
