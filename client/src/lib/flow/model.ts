import {
  resolveSchedule,
  clockText,
} from '../../../../server/src/flows/scheduling'
import * as Y from 'yjs'
export type Department = {
  id: string
  name: string
  order: number
  personnel?: string
  group?: string
  removedAt?: string
}
export type FlowEvent = {
  id: string
  type: 'shot' | 'milestone' | 'department' | 'custom'
  order: number
  category?: string
  description: string
  notes?: string
  start: string | null
  allottedMinutes?: number | null
  duration: number | null
  actualStart?: string | null
  actualEnd?: string | null
  fixed: boolean
  status: string
  shotId?: string
  sourceListId?: string
  reference?: string
  deletedAt?: string
  timing?: 'sequence' | 'anchor' | 'relative' | 'unscheduled'
  clockStart?: number | null
  dependsOn?: string
  offsetMinutes?: number
  relativeEdge?: 'start' | 'end'
  minute?: number | null
  effectiveDuration?: number | null
  sourceMissing?: boolean
  label?: string
  provenance?: unknown
}
export function records<T>(d: Y.Doc, k: string): T[] {
  return [...d.getMap<Y.Map<unknown>>(k).values()].map(
    (m) => m.toJSON() as T,
  )
}
export function put(
  d: Y.Doc,
  collection: string,
  id: string,
  value: Record<string, unknown>,
) {
  d.transact(() => {
    let m = d.getMap<Y.Map<unknown>>(collection).get(id)
    if (!m) {
      m = new Y.Map()
      d.getMap(collection).set(id, m)
      m.set('id', id)
    }
    Object.entries(value).forEach(([k, v]) => {
      if (v === undefined) return
      if (
        typeof v === 'string' &&
        (((k === 'description' || k === 'notes') &&
          collection === 'events') ||
          (k === 'text' && collection === 'instructions'))
      ) {
        const existing = m!.get(k)
        if (existing instanceof Y.Text) {
          if (existing.toString() !== v) {
            existing.delete(0, existing.length)
            existing.insert(0, v)
          }
        } else m!.set(k, new Y.Text(v))
      } else if (m!.get(k) !== v) m!.set(k, v)
    })
  })
}
export function orderedEvents(d: Y.Doc) {
  return records<FlowEvent>(d, 'events')
    .filter((e) => !e.deletedAt)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}
export function departments(d: Y.Doc) {
  return records<Department>(d, 'departments')
    .filter((e) => !e.removedAt)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
}
export function text(d: Y.Doc, k: string, id: string, field: string) {
  let m = d.getMap<Y.Map<unknown>>(k).get(id)
  if (!m) {
    put(d, k, id, {})
    m = d.getMap<Y.Map<unknown>>(k).get(id)!
  }
  const v = m.get(field)
  if (v instanceof Y.Text) return v
  const t = new Y.Text(String(v || ''))
  d.transact(() => m!.set(field, t))
  return t
}
export function instruction(d: Y.Doc, e: string, dep: string) {
  const id = e + ':' + dep
  if (!d.getMap('instructions').has(id))
    put(d, 'instructions', id, {
      eventId: e,
      departmentId: dep,
      text: new Y.Text(),
    })
  return text(d, 'instructions', id, 'text')
}
export function addEvent(d: Y.Doc, value: Partial<FlowEvent> = {}) {
  const id = value.id || crypto.randomUUID()
  d.transact(() => {
    put(d, 'events', id, {
      type: 'custom',
      description: '',
      notes: '',
      start: null,
      duration: null,
      fixed: value.type === 'milestone',
      status: 'planned',
      timing: value.type === 'department' ? 'unscheduled' : 'sequence',
      order: Math.max(0, ...orderedEvents(d).map((e) => e.order)) + 1024,
      ...value,
    })
    for (const dep of departments(d)) instruction(d, id, dep.id)
  })
  return id
}
export function duration(e: FlowEvent, shot?: Y.Map<unknown>) {
  if(e.allottedMinutes!=null)return e.allottedMinutes
  if (e.duration != null) return e.duration
  const n = shot?.get('estimatedMinutes')
  return n !== '' &&
    n != null &&
    Number.isFinite(Number(n)) &&
    Number(n) >= 0
    ? Number(n)
    : null
}
export function localParts(value: string, zone: string) {
  if (!value) return ''
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const v = (k: string) => p.find((p) => p.type === k)?.value || ''
  return `${v('year')}-${v('month')}-${v('day')} ${v('hour')}:${v(
    'minute',
  )}`
}
/** Resolve every possible offset around the local day. DST folds/gaps require an explicit choice. */
export function localCandidates(local: string, zone: string) {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(local))
    throw Error('Use YYYY-MM-DD HH:mm.')
  const target = Date.parse(local.replace(' ', 'T') + ':00Z')
  if (!Number.isFinite(target)) throw Error('Enter a valid date and time.')
  const offsets = new Set<number>()
  for (let h = -36; h <= 36; h++) {
    const sample = target + h * 3600000,
      shown = localParts(new Date(sample).toISOString(), zone)
    offsets.add(Date.parse(shown.replace(' ', 'T') + ':00Z') - sample)
  }
  return [...offsets]
    .map((o) => new Date(target - o).toISOString())
    .filter((v) => localParts(v, zone) === local)
    .sort()
}
export function parseDuration(s: string) {
  if (!s.trim()) return null
  const t = s.trim().toLowerCase()
  let n: number
  if (/^\d+(\.\d+)?$/.test(t)) n = Number(t)
  else if (
    /^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in)?)?$/.test(t)
  ) {
    const m = t.match(
      /^(?:(\d+(?:\.\d+)?)\s*h)?\s*(?:(\d+(?:\.\d+)?)\s*m(?:in)?)?$/,
    )!
    n = Number(m[1] || 0) * 60 + Number(m[2] || 0)
  } else throw Error('Use minutes, 1h 20m, or leave blank for unknown.')
  if (!Number.isFinite(n) || n < 0 || n > 10080)
    throw Error('Duration must be between zero and seven days.')
  return n
}
export function moveEvent(d: Y.Doc, e: FlowEvent, target: FlowEvent) {
  d.transact(() => {
    const all = orderedEvents(d).filter((x) => x.id !== e.id),
      i = all.findIndex((x) => x.id === target.id),
      before = all[i - 1]
    put(d, 'events', e.id, {
      order: ((before?.order || target.order - 2048) + target.order) / 2,
    })
  })
}

export { resolveSchedule, clockText }
export function scheduleState(doc: Y.Doc, source?: Y.Doc) {
  return resolveSchedule(
    Object.fromEntries(
      [
        'meta',
        'departments',
        'events',
        'instructions',
        'comments',
        'imports',
      ].map((k) => [k, doc.getMap(k).toJSON()]),
    ),
    source
      ? {
          id: doc.getMap('meta').get('listId'),
          shots: source.getMap('shots').toJSON(),
          scenes: source.getMap('scenes').toJSON(),
        }
      : null,
  )
}
