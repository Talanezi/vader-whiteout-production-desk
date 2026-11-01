import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Y from 'yjs'
import {
  addScene,
  addShot,
  shots,
  hasShotNumberConflict,
  str,
} from '../../client/src/lib/shotDocument'
test('conflicting source labels are flagged without mutation and clear after an explicit edit', () => {
  const d = new Y.Doc(),
    scene = addScene(d, '09'),
    a = shots(d).get(addShot(d, scene, 101))!,
    b = shots(d).get(addShot(d, scene, 101))!
  a.set('number', 'B')
  b.set('number', 'B')
  let updates = 0
  d.on('update', () => updates++)
  assert.equal(hasShotNumberConflict(d, a), true)
  assert.equal(str(a, 'number'), 'B')
  assert.equal(updates, 0)
  b.set('number', '09-B')
  assert.equal(hasShotNumberConflict(d, a), true)
  b.set('deleted', true)
  assert.equal(hasShotNumberConflict(d, a), false)
  b.set('deleted', false)
  b.set('number', '09-C')
  assert.equal(hasShotNumberConflict(d, a), false)
  d.destroy()
})
