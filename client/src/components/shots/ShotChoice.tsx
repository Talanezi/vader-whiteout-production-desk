import { useState } from 'react'
import * as Y from 'yjs'
import Combobox from '../whiteout/Combobox'
import { Overlay } from '../whiteout/Overlay'
import { Button, IconButton } from '../whiteout/Button'
import { ErrorNotice } from '../whiteout/Feedback'
import { fields, type ShotField } from '../../lib/shotDocument'
import {
  documentChoices,
  choiceKey,
  builtInChoice,
  updateDocumentChoice,
  removeDocumentChoice,
} from '../../lib/shotChoices'
export default function ShotChoice({
  doc,
  field,
  ...props
}: {
  doc: Y.Doc
  field: ShotField
  label: string
  value: string
  onChange: (v: string) => void
  onFocus?: () => void
}) {
  const [open, setOpen] = useState(false),
    [added, setAdded] = useState(''),
    [editing, setEditing] = useState<string | null>(null),
    [draft, setDraft] = useState(''),
    [error, setError] = useState('')
  const options = documentChoices(doc, field)
  const selectable = options.map((option) =>
    choiceKey(option) === choiceKey(props.value) ? props.value : option,
  )
  const act = (run: () => void) => {
    try {
      run()
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <>
      <Combobox
        {...props}
        options={selectable}
        onEditChoices={() => setOpen(true)}
      />
      {open && (
        <Overlay
          title={`Edit ${fields[field].toLowerCase()} choices`}
          className="pd-choice-editor"
          onClose={() => setOpen(false)}
          footer={<Button onClick={() => setOpen(false)}>Done</Button>}
        >
          {error && <ErrorNotice>{error}</ErrorNotice>}
          <form
            className="pd-choice-add"
            onSubmit={(e) => {
              e.preventDefault()
              act(() => {
                updateDocumentChoice(doc, field, added)
                setAdded('')
              })
            }}
          >
            <input
              aria-label="New choice"
              value={added}
              onChange={(e) => setAdded(e.target.value)}
              maxLength={160}
              placeholder="Add a choice…"
            />
            <Button type="submit" disabled={!added.trim()}>
              Add
            </Button>
          </form>
          <div className="pd-choice-list">
            {options.map((option) => (
              <div className="pd-choice-row" key={option}>
                {editing === option ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      act(() => {
                        updateDocumentChoice(doc, field, draft, option)
                        setEditing(null)
                      })
                    }}
                  >
                    <input
                      aria-label={`Rename ${option}`}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      maxLength={160}
                    />
                    <IconButton
                      type="submit"
                      name="check"
                      label={`Save choice ${option}`}
                    />
                    <IconButton
                      name="close"
                      label="Cancel choice rename"
                      onClick={() => setEditing(null)}
                    />
                  </form>
                ) : (
                  <>
                    <span>{option}</span>
                    {!builtInChoice(field, option) && (
                      <>
                        <IconButton
                          name="edit"
                          label={`Rename choice ${option}`}
                          onClick={() => {
                            setEditing(option)
                            setDraft(option)
                          }}
                        />
                        <IconButton
                          name="trash"
                          label={`Remove choice ${option}`}
                          onClick={() =>
                            act(() => removeDocumentChoice(doc, field, option))
                          }
                        />
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </Overlay>
      )}
    </>
  )
}
