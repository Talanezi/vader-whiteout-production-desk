import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import * as Y from 'yjs'
import { flowRequest } from '../../lib/flow/api'
import { useFlowCollaboration } from '../../lib/flow/useFlowCollaboration'
import Menu from '../whiteout/Menu'
import PreferredTake from './PreferredTake'
const Context = createContext<{ id: string; doc?: Y.Doc }>({ id: '' })
function Connected({ id, children }: { id: string; children: ReactNode }) {
  const c = useFlowCollaboration(id)
  return (
    <Context.Provider value={{ id, doc: c.synced ? c.doc : undefined }}>
      {children}
    </Context.Provider>
  )
}
export default function ADContext({
  listId,
  user,
  enabled,
  children,
}: {
  listId: string
  user: number
  enabled: boolean
  children: ReactNode
}) {
  const key = `whiteout:ad-context:${user}:${listId}`,
    [id, setId] = useState(() => localStorage.getItem(key) || ''),
    [flows, setFlows] = useState<any[]>([]),
    [error, setError] = useState('')
  useEffect(() => {
    if (enabled)
      flowRequest<any>('')
        .then((r) =>
          setFlows(
            (r.items || r).filter(
              (f: any) => f.sourceListId === listId || f.listId === listId,
            ),
          ),
        )
        .catch((e) => setError(e.message))
  }, [listId, enabled])
  const content = (
    <>
      {enabled && (
        <div className="pd-ad-context">
          <Menu
            label={
              flows.find((f) => f.id === id)?.name ||
              'Choose production day'
            }
            ariaLabel="AD production day"
            value={id}
            items={[
              { value: '', label: 'No day context' },
              ...flows.map((f) => ({
                value: f.id,
                label: [f.name, f.date].filter(Boolean).join(' · '),
              })),
            ]}
            onChange={(v) => {
              setId(v)
              localStorage.setItem(key, v)
            }}
          />
          {error && <small role="alert">{error}</small>}
        </div>
      )}
      {children}
    </>
  )
  return id && enabled ? (
    <Connected key={id} id={id}>
      {content}
    </Connected>
  ) : (
    <Context.Provider value={{ id: '' }}>{content}</Context.Provider>
  )
}
export function ADCell({
  field,
  shot,
  user,
}: {
  field: string
  shot: Y.Map<unknown>
  user: { id: number; name: string }
}) {
  const c = useContext(Context),
    [occurrence, setOccurrence] = useState(''),
    events = c.doc
      ? [...c.doc.getMap<Y.Map<unknown>>('events').values()].filter(
          (e) => e.get('shotId') === shot.get('id') && !e.get('deletedAt'),
        )
      : [],
    event =
      events.find((e) => e.get('id') === occurrence) ||
      (events.length === 1 ? events[0] : undefined),
    eventId = String(event?.get('id') || ''),
    live = c.doc?.getMap('meta').get('liveState') as any
  if (field === 'productionNotes')
    return (
      <input
        className="pd-cell-input"
        aria-label="Production notes"
        value={String(shot.get('productionNotes') || '')}
        onChange={(e) =>
          shot.doc!.transact(
            () => shot.set('productionNotes', e.target.value),
            'local',
          )
        }
      />
    )
  const picker =
    events.length > 1 ? (
      <Menu
        compact
        label={
          event
            ? `Occurrence ${events.indexOf(event) + 1}`
            : 'Choose occurrence'
        }
        items={events.map((e, i) => ({
          value: String(e.get('id')),
          label: `Occurrence ${i + 1}`,
        }))}
        onChange={setOccurrence}
      />
    ) : null
  if (field === 'preferredTake')
    return (
      <>
        {picker}
        {events.length > 1 && !event ? (
          <small>Choose occurrence</small>
        ) : (
          <PreferredTake
            shot={shot}
            user={user}
            context={
              c.id
                ? {
                    flowId: c.id,
                    eventId,
                    date: String(c.doc?.getMap('meta').get('date') || ''),
                  }
                : undefined
            }
          />
        )}
      </>
    )
  if (!c.id) return <small>Choose production day</small>
  if (!event)
    return (
      <>
        {picker}
        <small>
          {events.length ? 'Choose occurrence' : 'Not scheduled'}
        </small>
      </>
    )
  if (field === 'adProgress')
    return (
      <>
        {picker}
        <span>{live?.blocks?.[eventId]?.status || 'Not started'}</span>
      </>
    )
  return (
    <>
      {picker}
      <input
        className="pd-cell-input"
        type="number"
        min="0"
        max="10080"
        aria-label="AD allotted minutes"
        placeholder={String(
          shot.get('estimatedMinutes') || 'Use estimate',
        )}
        value={
          event.get('allottedMinutes') == null
            ? ''
            : String(event.get('allottedMinutes'))
        }
        onChange={(e) => {
          const n = e.target.value === '' ? null : Number(e.target.value)
          if (n == null || (Number.isFinite(n) && n >= 0 && n <= 10080))
            c.doc!.transact(() => {
              event.set('allottedMinutes', n)
              event.set('duration', null)
            }, 'local')
        }}
      />
    </>
  )
}
