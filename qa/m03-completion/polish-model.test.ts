import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Y from 'yjs'
import {
  presets,
  printPresets,
  readColumnPreferences,
} from '../../client/src/lib/shotColumns'
import {
  addScene,
  addShot,
  shots,
  choices,
} from '../../client/src/lib/shotDocument'
import {
  documentChoices,
  updateDocumentChoice,
  removeDocumentChoice,
} from '../../client/src/lib/shotChoices'
const exact = [
  'coverage',
  'camera',
  'framing',
  'subject',
  'angle',
  'lens',
  'equipment',
  'movement',
  'notes',
  'focusNotes',
  'lightingNotes',
  'scriptSeconds',
  'setupMinutes',
  'estimatedMinutes',
]
test('exact DP grid preset migrates recognized standard preferences; customized order and PDF preset remain intact', () => {
  assert.deepEqual(presets.Cinematography, exact)
  let saved: any
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => JSON.stringify(saved) },
  })
  saved = {
    preset: 'Cinematography',
    visible: printPresets.Cinematography,
    order: printPresets.Cinematography,
    sizes: { coverage: 430 },
  }
  assert.deepEqual(readColumnPreferences('x')!.visible, exact)
  assert.equal(readColumnPreferences('x')!.sizes.coverage, 430)
  saved = { ...saved, order: [...saved.order].reverse() }
  assert.deepEqual(readColumnPreferences('x')!.order, saved.order)
  assert.equal(readColumnPreferences('x')!.preset, 'Custom')
  saved = {
    preset: 'Custom',
    visible: ['subject', 'camera'],
    order: ['camera', 'subject'],
  }
  assert.deepEqual(readColumnPreferences('x')!.order, saved.order)
  assert.deepEqual(printPresets.Cinematography, [
    'subject',
    'framing',
    'angle',
    'camera',
    'lens',
    'equipment',
    'movement',
    'notes',
    'focusNotes',
    'lightingNotes',
  ])
})
test('shared choices reuse document values; normalized duplicates, rename and remove preserve historical data/builtins', () => {
  const d = new Y.Doc(),
    s = addScene(d, '09'),
    id = addShot(d, s, 101),
    shot = shots(d).get(id)!
  shot.set('subject', 'VADER')
  assert.ok(documentChoices(d, 'subject').includes('VADER'))
  assert.ok(!documentChoices(d, 'subject').includes('LUKE'))
  updateDocumentChoice(d, 'subject', ' LOTUS  ')
  assert.throws(
    () => updateDocumentChoice(d, 'subject', 'lotus'),
    /already exists/,
  )
  updateDocumentChoice(d, 'subject', 'LOTUS II', 'LOTUS')
  assert.ok(!documentChoices(d, 'subject').includes('LOTUS'))
  assert.equal(shot.get('subject'), 'VADER')
  removeDocumentChoice(d, 'subject', 'VADER')
  assert.ok(!documentChoices(d, 'subject').includes('VADER'))
  assert.equal(shot.get('subject'), 'VADER')
  const other = new Y.Doc()
  Y.applyUpdate(other, Y.encodeStateAsUpdate(d))
  assert.ok(documentChoices(other, 'subject').includes('LOTUS II'))
  assert.deepEqual(documentChoices(d, 'camera'), choices.camera)
  assert.throws(() => removeDocumentChoice(d, 'camera', 'CAM A'), /Built-in/)
  d.destroy()
  other.destroy()
})
