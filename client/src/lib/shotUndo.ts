import * as Y from 'yjs'
import { scenes, shots, operationMeta } from './shotDocument'
import { days, assignments } from './shotSchedule'
/** Typing can group briefly; deliberate commands always get their own undo item. */
export function createShotUndo(doc: Y.Doc) {
  const manager: Y.UndoManager = new Y.UndoManager(
    [scenes(doc), shots(doc), days(doc), assignments(doc)],
    {
      trackedOrigins: new Set(['local']),
      captureTimeout: 400,
      captureTransaction: (transaction) => {
        if (transaction.meta.has(operationMeta)) manager.stopCapturing()
        return true
      },
    },
  )
  doc.on('afterTransaction', (transaction) => {
    if (transaction.meta.has(operationMeta)) manager.stopCapturing()
  })
  return manager
}
