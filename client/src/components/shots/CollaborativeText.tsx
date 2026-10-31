import { useEffect, useRef } from 'react'
import * as Y from 'yjs'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next'
import type { HocuspocusProvider } from '@hocuspocus/provider'

export default function CollaborativeText({
  text,
  provider,
  undo,
  label,
  onFocus,
  compact = false,
}: {
  text: Y.Text
  provider: HocuspocusProvider
  undo: Y.UndoManager
  label: string
  onFocus?: () => void
  compact?: boolean
}) {
  const editor = useRef<EditorView | null>(null)
  const host = useRef<HTMLDivElement>(null),
    focus = useRef(onFocus)
  focus.current = onFocus
  useEffect(() => {
    undo.addToScope(text)
    const view = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: text.toString(),
        extensions: [
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            'aria-label': label,
            role: 'textbox',
            'aria-multiline': 'true',
          }),
          keymap.of(yUndoManagerKeymap),
          yCollab(text, provider.awareness, { undoManager: undo }),
          EditorView.domEventHandlers({
            blur: () => {
              provider.setAwarenessField('cursor', null)
              return false
            },
            focus: () => {
              focus.current?.()
              return false
            },
          }),
          EditorView.theme({
            '&': {
              fontSize: '12px',
              background: 'transparent',
              color: '#f2f1ee',
            },
            '.cm-content': {
              fontFamily: 'Inter,system-ui,sans-serif',
              padding: '7px 8px',
            },
            '.cm-gutters': { display: 'none' },
            '&.cm-focused': { outline: 'none' },
            '.cm-cursor': { borderLeftColor: '#87d8ff' },
            '.cm-selectionBackground': { background: '#294252 !important' },
          }),
        ],
      }),
    })
    editor.current = view
    return () => {
      editor.current = null
      view.destroy()
    }
  }, [text, provider, undo])
  useEffect(() => {
    editor.current?.contentDOM.setAttribute('aria-label', label)
  }, [label])
  return (
    <div
      ref={host}
      className={`pd-collab-text ${compact ? 'is-compact' : ''}`}
    />
  )
}
