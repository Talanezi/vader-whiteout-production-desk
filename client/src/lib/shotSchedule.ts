import * as Y from 'yjs'
import {
  ordered,
  shotOperation,
  shots,
  scenes,
  str,
  type RecordMap,
} from './shotDocument'
export const days = (doc: Y.Doc) => doc.getMap<RecordMap>('shootDays')
export const assignments = (doc: Y.Doc) =>
  doc.getMap<RecordMap>('shootAssignments')
export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + 'T12:00:00Z')
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}
export function addDay(doc: Y.Doc, date: string, title = '') {
  if (!validDate(date)) throw Error('Choose a valid calendar date.')
  const id = crypto.randomUUID(),
    map = new Y.Map<unknown>()
  shotOperation(
    doc,
    () => {
      days(doc).set(id, map)
      Object.entries({ id, date, title, order: days(doc).size * 1024 }).forEach(
        ([k, v]) => map.set(k, v),
      )
      doc.getMap('meta').set('schemaVersion', 2)
    },
    'local',
  )
  return id
}
export function assignShots(
  doc: Y.Doc,
  dayId: string,
  ids: string[],
  pickup = false,
) {
  if (!days(doc).has(dayId) || days(doc).get(dayId)?.get('deleted'))
    throw Error('Select a shoot day.')
  const existing = ordered(assignments(doc)).filter(
      (a) => str(a, 'dayId') === dayId,
    ),
    created: string[] = []
  shotOperation(
    doc,
    () => {
      let order = Math.max(
        0,
        ...existing.map((a) => Number(a.get('order')) || 0),
      )
      for (const shotId of ids) {
        if (!shots(doc).has(shotId) || shots(doc).get(shotId)?.get('deleted'))
          continue
        if (!pickup && existing.some((a) => str(a, 'shotId') === shotId))
          continue
        const id = crypto.randomUUID(),
          map = new Y.Map<unknown>()
        assignments(doc).set(id, map)
        Object.entries({
          id,
          dayId,
          shotId,
          order: (order += 1024),
          notes: '',
          estimatedMinutes: '',
          status: 'planned',
          pickup,
        }).forEach(([k, v]) => map.set(k, v))
        created.push(id)
      }
    },
    'local',
  )
  return created
}
export function validAssignments(doc: Y.Doc, dayId?: string) {
  return ordered(assignments(doc)).filter(
    (a) =>
      !a.get('deleted') &&
      days(doc).has(str(a, 'dayId')) &&
      !days(doc).get(str(a, 'dayId'))?.get('deleted') &&
      (!dayId || str(a, 'dayId') === dayId) &&
      !!shots(doc).get(str(a, 'shotId')) &&
      !shots(doc).get(str(a, 'shotId'))?.get('deleted'),
  )
}
export function moveRecords(
  doc: Y.Doc,
  list: RecordMap[],
  moving: string[],
  targetId: string,
  key = 'order',
  anchorId?: string,
) {
  const selected = new Set(moving),
    target = list.find((x) => str(x, 'id') === targetId)
  if (!target || selected.has(targetId)) return
  const block = list.filter((x) => selected.has(str(x, 'id'))),
    rest = list.filter((x) => !selected.has(str(x, 'id')))
  let at = rest.indexOf(target)
  if (
    list.findIndex((x) => str(x, 'id') === (anchorId || moving[0])) <
    list.indexOf(target)
  )
    at++
  shotOperation(
    doc,
    () => {
      let low = at
          ? Number(rest[at - 1].get(key))
          : Number(rest[0]?.get(key) || 1024) - 1024,
        high =
          at < rest.length
            ? Number(rest[at].get(key))
            : low + 1024 * (block.length + 1)
      if (
        !Number.isFinite(low) ||
        !Number.isFinite(high) ||
        high - low < Number.EPSILON * Math.max(1, Math.abs(low)) * 100
      ) {
        rest.forEach((x, i) => x.set(key, (i + 1) * 1024))
        low = at ? at * 1024 : 0
        high = (at + 1) * 1024
      }
      const step = (high - low) / (block.length + 1)
      block.forEach((x, i) => x.set(key, low + step * (i + 1)))
    },
    'local',
  )
}
export function daySummary(doc: Y.Doc) {
  const dates = [
    ...new Set(
      validAssignments(doc)
        .map((a) => str(days(doc).get(str(a, 'dayId')), 'date'))
        .filter(validDate),
    ),
  ].sort()
  return {
    sceneCount: ordered(scenes(doc)).length,
    shotCount: ordered(shots(doc)).length,
    dates,
  }
}
export function assignmentContract(doc: Y.Doc, dayId: string) {
  return validAssignments(doc, dayId).map((a) => {
    const shot = shots(doc).get(str(a, 'shotId'))!
    return {
      assignmentId: str(a, 'id'),
      shootDayId: dayId,
      shotId: str(shot, 'id'),
      sceneId: str(shot, 'sceneId'),
      number: str(shot, 'number'),
      coverage: str(shot, 'coverage'),
      camera: str(shot, 'camera'),
      technical: Object.fromEntries(
        ['framing', 'angle', 'lens', 'movement', 'equipment'].map((k) => [
          k,
          str(shot, k),
        ]),
      ),
      estimatedMinutes:
        str(a, 'estimatedMinutes') || str(shot, 'estimatedMinutes'),
      notes: str(a, 'notes'),
      order: Number(a.get('order')),
    }
  })
}
