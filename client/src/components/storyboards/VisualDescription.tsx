import { createPortal } from 'react-dom'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { usePopover } from '../whiteout/Popover'
import { Button } from '../whiteout/Button'
import CollaborativeText from '../shots/CollaborativeText'
import { panelNotes } from '../../lib/storyboards/model'
export default function VisualDescription({
  doc,
  id,
  provider,
  undo,
}: {
  doc: Y.Doc
  id: string
  provider: HocuspocusProvider
  undo: Y.UndoManager
}) {
  const p = usePopover(340)
  return (
    <>
      <button
        ref={p.trigger}
        className="sb-description-trigger"
        aria-label="Edit visual description"
        aria-expanded={p.open}
        onClick={(e) => {
          e.stopPropagation()
          p.setOpen(!p.open)
        }}
      >
        Visual description
      </button>
      {p.open &&
        createPortal(
          <div
            ref={p.panel}
            role="dialog"
            aria-label="Visual description"
            className="pd-ui sb-description-popover"
            style={p.style}
          >
            <strong>Visual description</strong>
            <CollaborativeText
              text={panelNotes(doc, id)}
              provider={provider}
              undo={undo}
              label="Visual description"
            />
            <Button onClick={() => p.close()}>Done</Button>
          </div>,
          p.target,
        )}
    </>
  )
}
