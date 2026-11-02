import { useState } from 'react'
import type * as Y from 'yjs'
import type { HocuspocusProvider } from '@hocuspocus/provider'
import { Overlay } from '../whiteout/Overlay'
import { Button } from '../whiteout/Button'
import Menu from '../whiteout/Menu'
import { ErrorNotice } from '../whiteout/Feedback'
import PanelDiscussion from '../storyboards/PanelDiscussion'
import CollaborativeText from '../shots/CollaborativeText'
import ShotChoice from '../shots/ShotChoice'
import { change, str, fields, type ShotField } from '../../lib/shotDocument'
import { validateValue } from '../../lib/shotClipboard'
import {
  put,
  text,
  localParts,
  localCandidates,
  type FlowEvent,
} from '../../lib/flow/model'
export default function EventInspector({
  doc,
  event,
  provider,
  undo,
  user,
  source,
  sourceDoc,
  listId,
  zone,
  initialTab,
  onClose,
  onRelink,
}: {
  doc: Y.Doc
  event: FlowEvent
  provider: HocuspocusProvider
  undo: Y.UndoManager
  user: { id: number; name: string }
  source?: Y.Map<unknown>
  sourceDoc?: Y.Doc
  listId: string
  zone: string
  initialTab: string
  onClose: () => void
  onRelink: () => void
}) {
  const [tab, setTab] = useState(initialTab),
    [error, setError] = useState('')
  function actual(key: string, value: string) {
    try {
      const all = value ? localCandidates(value, zone) : []
      if (value && all.length !== 1)
        throw Error('Choose an unambiguous production-local time.')
      const next = all[0] || null
      const start = key === 'actualStart' ? next : event.actualStart,
        end = key === 'actualEnd' ? next : event.actualEnd
      if (start && end && Date.parse(end) < Date.parse(start))
        throw Error('Completion cannot precede actual start.')
      put(doc, 'events', event.id, { [key]: next })
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <Overlay
      kind="drawer"
      title={event.reference || event.description || 'Production event'}
      onClose={onClose}
      className="flow-event-inspector"
    >
      <div className="flow-segments">
        {['details', 'comments'].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t === 'details' ? 'Details' : 'Comments'}
          </button>
        ))}
      </div>
      {error && <ErrorNotice>{error}</ErrorNotice>}
      {tab === 'comments' ? (
        <PanelDiscussion doc={doc} panelId={event.id} user={user} />
      ) : (
        <div className="flow-form">
          <label>
            Event type
            <Menu
              label={event.type}
              value={event.type}
              onChange={(v) => put(doc, 'events', event.id, { type: v })}
              items={['shot', 'milestone', 'department', 'custom'].map((v) => ({
                value: v,
                label:
                  {
                    shot: 'Shot',
                    milestone: 'Shared milestone',
                    department: 'Department activity',
                    custom: 'Custom action',
                  }[v] || v,
              }))}
            />
          </label>
          <label>
            Current Action
            <CollaborativeText
              text={text(doc, 'events', event.id, 'description')}
              provider={provider}
              undo={undo}
              label="Current Action"
            />
          </label>
          <label>
            Production notes
            <CollaborativeText
              text={text(doc, 'events', event.id, 'notes')}
              provider={provider}
              undo={undo}
              label="Event notes"
            />
          </label>
          <label>
            Status
            <Menu
              label={event.status}
              value={event.status}
              onChange={(v) => put(doc, 'events', event.id, { status: v })}
              items={[
                'planned',
                'in-progress',
                'complete',
                'held',
                'cancelled',
              ].map((v) => ({ value: v, label: v }))}
            />
          </label>
          <div className="flow-inline">
            <Button
              icon="play"
              onClick={() =>
                put(doc, 'events', event.id, {
                  actualStart: new Date().toISOString(),
                  status: 'in-progress',
                })
              }
            >
              Start now
            </Button>
            <Button
              icon="check"
              disabled={!event.actualStart}
              onClick={() =>
                put(doc, 'events', event.id, {
                  actualEnd: new Date().toISOString(),
                  status: 'complete',
                })
              }
            >
              Complete now
            </Button>
          </div>
          {(['actualStart', 'actualEnd'] as const).map((k) => (
            <label key={k}>
              {k === 'actualStart' ? 'Actual start' : 'Actual completion'} ·{' '}
              {zone}
              <input
                key={event[k]}
                defaultValue={event[k] ? localParts(event[k]!, zone) : ''}
                placeholder="YYYY-MM-DD HH:mm"
                onBlur={(e) => actual(k, e.target.value)}
              />
            </label>
          ))}
          {event.type === 'shot' && (
            <section className="flow-source-context">
              <h3>Authoritative Shot List</h3>
              {source && !source.get('deleted') && sourceDoc ? (
                <>
                  {' '}
                  {(
                    ['subject', 'camera', 'framing', 'lens'] as ShotField[]
                  ).map((field) => (
                    <label key={field}>
                      {fields[field]}
                      <ShotChoice
                        doc={sourceDoc}
                        field={field}
                        label={fields[field]}
                        value={str(source, field)}
                        onChange={(v) => {
                          try {
                            validateValue(field, v)
                            change(sourceDoc, source, field, v, user.id)
                          } catch (e) {
                            setError((e as Error).message)
                          }
                        }}
                      />
                    </label>
                  ))}
                  <a
                    className="pd-button"
                    href={`#/shotlists/${listId}?shot=${event.shotId}`}
                  >
                    Open Shot List
                  </a>
                </>
              ) : (
                <p className="flow-muted">
                  This occurrence is preserved. Its source shot is disconnected
                  or unavailable.
                </p>
              )}
              <Button icon="shots" onClick={onRelink}>
                Relink shot
              </Button>
            </section>
          )}
          {Boolean(event.provenance) && (
            <details>
              <summary>Original import values</summary>
              <pre className="flow-provenance">
                {JSON.stringify(event.provenance, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </Overlay>
  )
}
