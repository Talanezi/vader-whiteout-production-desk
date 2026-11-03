import {
  canonicalLabel,
  scenePrefix,
} from '../../../server/src/flows/scheduling'
import * as Y from 'yjs'

export const operationMeta = 'whiteout-shot-operation'
export function shotOperation(
  doc: Y.Doc,
  action: (transaction: Y.Transaction) => void,
  origin: unknown = 'local',
) {
  doc.transact((transaction) => {
    transaction.meta.set(operationMeta, true)
    action(transaction)
  }, origin)
}

export type RecordMap = Y.Map<unknown>
export const narrativeFields = [
  'coverage',
  'notes',
  'focusNotes',
  'lightingNotes',
]
export const fields = {
  number: 'Shot number',
  camera: 'Camera',
  framing: 'Framing',
  subject: 'Subject',
  angle: 'Camera angle',
  lens: 'Lens',
  equipment: 'Support / equipment',
  movement: 'Movement',
  coverage: 'Action / coverage',
  notes: 'Camera notes',
  focusNotes: 'Focus notes',
  lightingNotes: 'Lighting notes',
  scriptSeconds: 'Script duration · sec',
  setupMinutes: 'Setup · min',
  plannedTakes: 'Planned takes',
  estimatedMinutes: 'Estimated shooting · min',
  actualTakes: 'Actual takes / best take',
} as const
export type ShotField = keyof typeof fields
export const choices: Partial<Record<ShotField, string[]>> = {
  camera: ['CAM A', 'CAM B', 'CAM C', 'CAM D'],
  framing: [
    'ECU',
    'CU',
    'MCU',
    'MS',
    'CB',
    'FS',
    'LS',
    'ELS',
    'Wide',
    'OTS',
    'POV',
    'Insert',
  ],
  angle: [
    'Eye Level',
    'Low Angle',
    'High Angle',
    'Extreme Low',
    'Extreme High',
    'Dutch Angle',
    'POV',
    'Bird’s Eye View',
    'Worm’s Eye View',
  ],
  lens: [
    '14mm',
    '16mm',
    '21mm',
    '24mm',
    '35mm',
    '40mm',
    '50mm',
    '85mm',
    '135mm',
    '200mm',
    '16–35mm',
    '24–70mm',
    '70–200mm',
  ],
  equipment: [
    'Sticks',
    'Shoulder Mount',
    'Camera Strap',
    'Jib Arm',
    'Dolly',
    'Slider',
    'Steadicam',
    'Gimbal',
    'Technocrane',
    'Drone',
  ],
  movement: [
    'Static',
    'Handheld',
    'Pan Left',
    'Pan Right',
    'Tilt Up',
    'Tilt Down',
    'Dolly In',
    'Dolly Back',
    'Tracking',
    'Pedestal',
    'Crane',
  ],
}
export const str = (map: RecordMap | undefined, key: string) =>
  String(map?.get(key) ?? '')
export const scenes = (doc: Y.Doc) => doc.getMap<RecordMap>('scenes')
export const shots = (doc: Y.Doc) => doc.getMap<RecordMap>('shots')
export function ordered(
  map: Y.Map<RecordMap>,
  key = 'order',
  includeDeleted: Set<string> = new Set(),
) {
  return [...map.values()]
    .filter((x) => !x.get('deleted') || includeDeleted.has(str(x, 'id')))
    .sort(
      (a, b) =>
        Number(a.get(key) || 0) - Number(b.get(key) || 0) ||
        str(a, 'id').localeCompare(str(b, 'id')),
    )
}
export function change(
  doc: Y.Doc,
  map: RecordMap,
  key: string,
  value: unknown,
  user?: number,
) {
  doc.transact(() => {
    if (key === 'number' && String(value).trim() !== str(map, 'number')) {
      const v = String(value).trim(),
        scene = str(scenes(doc).get(str(map, 'sceneId')), 'number')
      if (!/^(?:.+-)?[a-z]+$/i.test(v))
        throw Error(
          'Use an alphabetic shot code, such as A or AA. Existing imported references are preserved until edited.',
        )
      value = canonicalLabel(v, scene)
      if (
        scenePrefix(scene) &&
        !String(value).startsWith(scenePrefix(scene) + '-')
      )
        throw Error('The shot code must use its current scene prefix.')
      if (
        [...shots(doc).values()].some(
          (other) =>
            other !== map &&
            !other.get('deleted') &&
            str(other, 'sceneId') === str(map, 'sceneId') &&
            canonicalLabel(str(other, 'number'), scene) === value,
        )
      )
        throw Error('That shot code is already used in this scene.')
    }
    map.set(key, value)
    map.set('updatedAt', new Date().toISOString())
    if (user) map.set('updatedBy', user)
  }, 'local')
}
export function addScene(doc: Y.Doc, number: string, title = '') {
  const id = crypto.randomUUID(),
    map = new Y.Map<unknown>()
  shotOperation(
    doc,
    () => {
      scenes(doc).set(id, map)
      map.set('id', id)
      map.set('number', number)
      map.set('title', title)
      map.set(
        'order',
        Math.max(
          0,
          ...ordered(scenes(doc)).map((s) => Number(s.get('order')) || 0),
        ) + 1024,
      )
    },
    'local',
  )
  return id
}
export function nextShotNumber(doc: Y.Doc, sceneId: string) {
  const scene = str(scenes(doc).get(sceneId), 'number'),
    used = new Set(
      [...shots(doc).values()]
        .filter((s) => str(s, 'sceneId') === sceneId)
        .map((s) => displayShot(doc, s)),
    )
  for (let i = 0; i < 100000; i++) {
    let n = i + 1,
      label = ''
    while (n) {
      n--
      label = String.fromCharCode(65 + (n % 26)) + label
      n = Math.floor(n / 26)
    }
    const number =
      (scenePrefix(scene) ? scenePrefix(scene) + '-' : '') + label
    if (!used.has(number)) return number
  }
  throw Error('Too many shot identifiers.')
}
export function addShot(
  doc: Y.Doc,
  sceneId: string,
  user: number,
  from?: RecordMap,
) {
  const id = crypto.randomUUID(),
    map = new Y.Map<unknown>()
  const all = ordered(shots(doc))
  const order =
    Math.max(
      0,
      ...all
        .filter((s) => s.get('sceneId') === sceneId)
        .map((s) => Number(s.get('order')) || 0),
    ) + 1024
  const plan =
    Math.max(0, ...all.map((s) => Number(s.get('planningOrder')) || 0)) +
    1024
  shotOperation(
    doc,
    () => {
      shots(doc).set(id, map)
      for (const key of Object.keys(fields)) {
        const value = from
          ? str(from, key)
          : key === 'camera'
          ? 'CAM A'
          : ''
        map.set(
          key,
          narrativeFields.includes(key) ? new Y.Text(value) : value,
        )
      }
      map.set('number', nextShotNumber(doc, sceneId))
      if (from?.get('source')) map.set('source', str(from, 'source'))
      map.set('id', id)
      map.set('sceneId', sceneId)
      map.set('order', order)
      map.set('planningOrder', plan)
      map.set('createdAt', new Date().toISOString())
      map.set('createdBy', user)
      map.set('deleted', false)
    },
    'local',
  )
  return id
}
export function reorder(
  doc: Y.Doc,
  list: RecordMap[],
  index: number,
  delta: number,
  planning: boolean,
) {
  const target = index + delta
  if (target < 0 || target >= list.length) return
  const key = planning ? 'planningOrder' : 'order'
  // Move just this UUID. Equal concurrent positions are resolved by UUID, and
  // labels are never renumbered. Scene order and planning order stay separate.
  const rest = list.filter((_, i) => i !== index)
  const before = rest[target - 1],
    after = rest[target]
  const low = before
    ? Number(before.get(key))
    : after
    ? Number(after.get(key)) - 2048
    : 0
  const high = after ? Number(after.get(key)) : low + 2048
  shotOperation(
    doc,
    () => change(doc, list[index], key, (low + high) / 2),
    'local',
  )
}

export function hasShotNumberConflict(doc: Y.Doc, shot: RecordMap) {
  const identity = (record: RecordMap) => {
    const number = str(record, 'number'),
      scene = str(scenes(doc).get(str(record, 'sceneId')), 'number')
    return canonicalLabel(number, scene)
  }
  const number = identity(shot)
  return (
    !!number &&
    [...shots(doc).values()].some(
      (other) =>
        other !== shot &&
        !other.get('deleted') &&
        identity(other) === number,
    )
  )
}

export function displayShot(doc: Y.Doc, shot: RecordMap) {
  return canonicalLabel(
    str(shot, 'number'),
    str(scenes(doc).get(str(shot, 'sceneId')), 'number'),
  )
}
