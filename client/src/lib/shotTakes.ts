import { shotOperation } from './shotDocument'
import * as Y from 'yjs'
export type TakeContext = {
  flowId?: string
  eventId?: string
  date?: string
}
export type TakeRecord = {
  id: string
  label: string
  note: string
  usable: boolean
  at: number
  by: { id: number; name: string }
  context: TakeContext
}
export function takeRecords(shot: Y.Map<unknown>): TakeRecord[] {
  const map = shot.get('takes'),
    revisions = shot.get('takeRevisions')
  const edits =
    revisions instanceof Y.Map
      ? [...revisions.values()].sort(
          (a: any, b: any) => a.at - b.at || a.id.localeCompare(b.id),
        )
      : []
  return map instanceof Y.Map
    ? ([...map.values()] as TakeRecord[]).map((t) =>
        edits
          .filter((e: any) => e.takeId === t.id)
          .reduce(
            (v: any, e: any) => ({ ...v, note: e.note, usable: e.usable }),
            t,
          ),
      )
    : []
}
export function editTake(
  shot: Y.Map<unknown>,
  take: TakeRecord,
  by: TakeRecord['by'],
) {
  if (take.note.length > 500)
    throw Error('Use a note up to 500 characters.')
  shotOperation(
    shot.doc!,
    () => {
      let revisions = shot.get('takeRevisions') as Y.Map<unknown>
      if (!(revisions instanceof Y.Map)) {
        revisions = new Y.Map()
        shot.set('takeRevisions', revisions)
      }
      if (revisions.size >= 2000)
        throw Error('Take history limit reached.')
      const id = crypto.randomUUID()
      revisions.set(id, {
        id,
        takeId: take.id,
        by,
        at: Date.now(),
        note: take.note,
        usable: take.usable,
      })
    },
    'local',
  )
}
export function takeSelections(shot: Y.Map<unknown>) {
  const map = shot.get('takeSelections')
  return map instanceof Y.Map ? ([...map.values()] as any[]) : []
}
export function preferredTake(
  shot: Y.Map<unknown>,
  context?: TakeContext,
) {
  const events = takeSelections(shot)
    .filter(
      (e) => !context?.eventId || e.context?.eventId === context.eventId,
    )
    .sort((a, b) => a.at - b.at || a.id.localeCompare(b.id))
  const id = events[events.length - 1]?.takeId
  return takeRecords(shot).find((t) => t.id === id)
}
export function recordTake(
  shot: Y.Map<unknown>,
  payload: {
    label: string
    note: string
    usable: boolean
    preferred: boolean
  },
  by: TakeRecord['by'],
  context: TakeContext = {},
) {
  if (
    !payload.label.trim() ||
    payload.label.length > 32 ||
    payload.note.length > 500
  )
    throw Error(
      'Use a take number or short label and a note up to 500 characters.',
    )
  if (takeRecords(shot).length >= 500)
    throw Error('This shot has reached its take-record limit.')
  const id = crypto.randomUUID(),
    at = Date.now()
  shotOperation(
    shot.doc!,
    () => {
      let takes = shot.get('takes') as Y.Map<unknown>
      if (!(takes instanceof Y.Map)) {
        takes = new Y.Map()
        shot.set('takes', takes)
      }
      takes.set(id, {
        id,
        label: payload.label.trim(),
        note: payload.note,
        usable: payload.usable,
        at,
        by,
        context,
      })
      if (payload.preferred) selectTake(shot, id, by, context)
    },
    'local',
  )
  return id
}
export function selectTake(
  shot: Y.Map<unknown>,
  takeId: string | null,
  by: TakeRecord['by'],
  context: TakeContext = {},
) {
  if (takeId) {
    const take = takeRecords(shot).find((t) => t.id === takeId)
    if (!take) throw Error('This take is unavailable.')
    if (context.eventId && take.context.eventId !== context.eventId)
      throw Error('Choose a take recorded for this shooting occurrence.')
  }
  shotOperation(
    shot.doc!,
    () => {
      let map = shot.get('takeSelections') as Y.Map<unknown>
      if (!(map instanceof Y.Map)) {
        map = new Y.Map()
        shot.set('takeSelections', map)
      }
      if (map.size >= 2000)
        throw Error(
          'This shot has reached its preferred-take history limit.',
        )
      const id = crypto.randomUUID()
      map.set(id, { id, takeId, by, context, at: Date.now() })
    },
    'local',
  )
}
