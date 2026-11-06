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
export function takeRecords(shot: Y.Map<unknown>) {
  const map = shot.get('takes')
  return map instanceof Y.Map ? ([...map.values()] as TakeRecord[]) : []
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
  shot.doc!.transact(() => {
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
  }, 'local')
  return id
}
export function selectTake(
  shot: Y.Map<unknown>,
  takeId: string | null,
  by: TakeRecord['by'],
  context: TakeContext = {},
) {
  shot.doc!.transact(() => {
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
  }, 'local')
}
