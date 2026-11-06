const fs = require('fs'),
  assert = require('assert/strict'),
  { randomUUID } = require('crypto'),
  path = require('path')
process.env.NODE_PATH =
  '/tmp/m032/runtime/client/node_modules:/tmp/m032/runtime/server/node_modules'
require('module').Module._initPaths()
const esbuild = require('esbuild'),
  Y = require('/tmp/m032/runtime/client/node_modules/yjs'),
  { join, until } = require('../m04/collaboration.cjs'),
  auth = JSON.parse(fs.readFileSync('/tmp/m032/runtime/local-state.json')),
  f = JSON.parse(fs.readFileSync('/tmp/m05/refinement/fixture.json')),
  board = JSON.parse(
    fs.readFileSync('/tmp/m05/refinement/storyboard.json'),
  ),
  out = '/tmp/m05/refinement'
for (const [file, source] of [
  ['takes', 'client/src/lib/shotTakes.ts'],
  ['undo', 'client/src/lib/shotUndo.ts'],
  ['document', 'client/src/lib/shotDocument.ts'],
])
  esbuild.buildSync({
    entryPoints: [path.resolve(source)],
    outfile: out + '/' + file + '.cjs',
    platform: 'node',
    format: 'cjs',
    bundle: true,
    packages: 'external',
  })
const { shotOperation } = require(out + '/document.cjs')
const {
    recordTake,
    selectTake,
    preferredTake,
    takeRecords,
    takeSelections,
    editTake,
  } = require(out + '/takes.cjs'),
  { createShotUndo } = require(out + '/undo.cjs')
;(async () => {
  const a = await join(f.listId, '102', 'shotlists'),
    b = await join(f.listId, '103', 'shotlists'),
    sa = a.doc.getMap('shots').get(f.shotIds[0]),
    sb = b.doc.getMap('shots').get(f.shotIds[0]),
    u = createShotUndo(a.doc)
  try {
    shotOperation(a.doc, () => sa.set('rowColor', '#497797'), 'local')
    await until(() => sb.get('rowColor') === '#497797', 'shared row color')
    shotOperation(a.doc, () => sa.delete('rowColor'), 'local')
    await until(() => !sb.has('rowColor'), 'shared clear color')
    u.undo()
    await until(() => sb.get('rowColor') === '#497797', 'undo color clear')
    const one = { flowId: f.flowId, eventId: f.eventIds[0], date: f.date },
      two = {
        flowId: randomUUID(),
        eventId: randomUUID(),
        date: '2026-11-06',
      },
      t1 = recordTake(
        sa,
        { label: '3', note: 'Day one', usable: false, preferred: true },
        { id: 102, name: 'DP' },
        one,
      ),
      t2 = recordTake(
        sa,
        {
          label: '3',
          note: 'Separate day',
          usable: true,
          preferred: true,
        },
        { id: 102, name: 'DP' },
        two,
      )
    await until(
      () => takeRecords(sb).some((t) => t.id === t2),
      'shared day takes',
    )
    assert.equal(preferredTake(sb, one).id, t1)
    assert.equal(preferredTake(sb, two).id, t2)
    editTake(
      sb,
      {
        ...takeRecords(sb).find((t) => t.id === t1),
        usable: true,
        note: 'Reviewed usable take',
      },
      { id: 103, name: 'AD' },
    )
    await until(
      () => takeRecords(sa).find((t) => t.id === t1).usable,
      'shared usability revision',
    )
    assert.throws(
      () => selectTake(sa, t2, { id: 102, name: 'DP' }, one),
      /shooting occurrence/,
    )
    const t3 = recordTake(
      sa,
      {
        label: '4',
        note: 'Alternative same-day take',
        usable: true,
        preferred: false,
      },
      { id: 102, name: 'DP' },
      one,
    )
    await until(
      () => takeRecords(sb).some((t) => t.id === t3),
      'alternative take sync',
    )
    const count = takeSelections(sa).length
    selectTake(sa, t1, { id: 102, name: 'DP' }, one)
    selectTake(sb, t3, { id: 103, name: 'AD' }, one)
    await until(
      () =>
        takeSelections(sa).length === count + 2 &&
        takeSelections(sb).length === count + 2,
      'both simultaneous selections retained',
    )
    assert.equal(preferredTake(sa, one).id, preferredTake(sb, one).id)
    selectTake(sa, null, { id: 102, name: 'DP' }, one)
    await until(() => !preferredTake(sb, one), 'clear preferred selection')
    assert.equal(preferredTake(sb, two).id, t2)
    const reload = await join(f.listId, '103', 'shotlists')
    assert.equal(
      preferredTake(reload.doc.getMap('shots').get(f.shotIds[0]), two).id,
      t2,
    )
    reload.close()
  } finally {
    u.destroy()
    a.close()
    b.close()
  }
  const x = await join(board.id, '101'),
    z = await join(board.id, '103')
  try {
    const before = x.doc.getMap('annotations').toJSON(),
      meta = x.doc.getMap('meta')
    x.doc.transact(() => {
      meta.set('studioPalette2', '#ffaa00')
    }, 'local')
    z.doc.transact(
      () => z.doc.getMap('meta').set('studioPalette9', '#3300aa'),
      'local',
    )
    await until(
      () =>
        meta.get('studioPalette9') === '#3300aa' &&
        z.doc.getMap('meta').get('studioPalette2') === '#ffaa00',
      'independent palette slots',
    )
    assert.deepEqual(x.doc.getMap('annotations').toJSON(), before)
    const panel = x.doc.getMap('panels').get(board.panelIds[0]),
      notes = panel.get('notes')
    x.doc.transact(
      () => notes.insert(notes.length, ' Shared visual description.'),
      'local',
    )
    await until(
      () =>
        z.doc
          .getMap('panels')
          .get(board.panelIds[0])
          .get('notes')
          .toString()
          .includes('Shared visual description.'),
      'same existing notes field',
    )
  } finally {
    x.close()
    z.close()
  }
  console.log(
    'Two real authorized WS clients: row color/clear/undo; stable UUID take records, repeated Take 3 on separate days, usable/note revisions, concurrent preference history without lost records, clear and reload; independent shared palette-slot edits preserve annotations; Visual Description synchronizes through the original notes field.',
  )
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
