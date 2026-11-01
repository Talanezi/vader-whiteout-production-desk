import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Y from 'yjs'
import {
  addScene,
  addShot,
  shots,
  displayShot,
  nextShotNumber,
  str,
} from '../../client/src/lib/shotDocument'
test('legacy letters gain complete presentation without rewriting values or allocating duplicate visible identities', () => {
  const d = new Y.Doc(),
    scene = addScene(d, '09'),
    a = addShot(d, scene, 101),
    b = addShot(d, scene, 101)
  shots(d).get(a)!.set('number', 'A')
  shots(d).get(b)!.set('number', 'B')
  let updates = 0
  d.on('update', () => updates++)
  assert.equal(displayShot(d, shots(d).get(a)!), '09-A')
  assert.equal(nextShotNumber(d, scene), '09-C')
  assert.equal(str(shots(d).get(a), 'number'), 'A')
  assert.equal(updates, 0)
  const existing = addShot(d, scene, 101)
  shots(d).get(existing)!.set('number', '09-A')
  assert.equal(displayShot(d, shots(d).get(a)!), '09-A [A]')
  assert.equal(str(shots(d).get(a), 'number'), 'A')
  d.destroy()
})
