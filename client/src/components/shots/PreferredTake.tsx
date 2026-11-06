import { useState } from 'react'
import type * as Y from 'yjs'
import {
  preferredTake,
  recordTake,
  selectTake,
  takeRecords,
  takeSelections,
  type TakeContext,
} from '../../lib/shotTakes'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import DrawCheckbox from '../whiteout/DrawCheckbox'
import { ErrorNotice } from '../whiteout/Feedback'
export default function PreferredTake({
  shot,
  user,
  context = {},
}: {
  shot: Y.Map<unknown>
  user: { id: number; name: string }
  context?: TakeContext
}) {
  const [open, setOpen] = useState(false),
    [label, setLabel] = useState(''),
    [note, setNote] = useState(''),
    [usable, setUsable] = useState(false),
    [preferred, setPreferred] = useState(true),
    [error, setError] = useState('')
  const current = preferredTake(shot, context),
    records = takeRecords(shot)
      .filter(
        (t) => !context.eventId || t.context.eventId === context.eventId,
      )
      .sort((a, b) => a.at - b.at)
  return (
    <>
      <button
        className="pd-take-trigger"
        onClick={() => setOpen(true)}
        title={current?.note || 'Record or choose a preferred take'}
      >
        {current ? '★ Take ' + current.label : 'Choose take'}
      </button>
      {open && (
        <Overlay
          title="Preferred take"
          onClose={() => setOpen(false)}
          footer={
            <Button
              variant="primary"
              icon="plus"
              disabled={!label.trim()}
              onClick={() => {
                try {
                  recordTake(
                    shot,
                    { label, note, usable, preferred },
                    user,
                    context,
                  )
                  setLabel('')
                  setNote('')
                  setError('')
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              Record take
            </Button>
          }
        >
          <div className="flow-form">
            {error && <ErrorNotice>{error}</ErrorNotice>}
            {context.date && <small>Shoot date · {context.date}</small>}
            {records.map((t) => (
              <div className="pd-take-record" key={t.id}>
                <Button
                  icon={current?.id === t.id ? 'check' : 'plus'}
                  onClick={() => selectTake(shot, t.id, user, context)}
                >
                  Take {t.label}
                </Button>
                <span>
                  {t.usable ? 'Usable · ' : ''}
                  {t.note}
                  <small>
                    {t.by.name} · {t.context.date || 'No day assigned'}
                  </small>
                </span>
              </div>
            ))}
            {current && (
              <Button
                onClick={() => selectTake(shot, null, user, context)}
              >
                Clear preferred take
              </Button>
            )}
            <label>
              Take
              <input
                aria-label="Take"
                value={label}
                maxLength={32}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label>
              Note · optional
              <input
                aria-label="Take note"
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <label className="flow-check">
              <DrawCheckbox
                checked={preferred}
                onChange={(e) => setPreferred(e.target.checked)}
              />
              Preferred
            </label>
            <label className="flow-check">
              <DrawCheckbox
                checked={usable}
                onChange={(e) => setUsable(e.target.checked)}
              />
              Also usable
            </label>
            <details>
              <summary>
                Selection history · {takeSelections(shot).length}
              </summary>
              {takeSelections(shot)
                .sort((a, b) => b.at - a.at)
                .slice(0, 30)
                .map((e) => (
                  <p key={e.id}>
                    {e.by.name} · {new Date(e.at).toLocaleString()} ·{' '}
                    {e.takeId
                      ? takeRecords(shot).find((t) => t.id === e.takeId)
                          ?.label
                      : 'Cleared'}
                  </p>
                ))}
            </details>
          </div>
        </Overlay>
      )}
    </>
  )
}
