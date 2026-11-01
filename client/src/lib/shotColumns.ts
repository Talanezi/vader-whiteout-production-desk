import { fields, type ShotField } from './shotDocument'
export type GridField =
  | ShotField
  | 'scene'
  | 'shootDates'
  | 'assignmentCount'
  | 'scheduleStatus'
export const widths: Record<GridField, number> = {
  number: 106,
  scene: 110,
  shootDates: 190,
  assignmentCount: 100,
  scheduleStatus: 150,
  coverage: 330,
  framing: 118,
  camera: 104,
  lens: 100,
  movement: 150,
  subject: 160,
  angle: 145,
  equipment: 200,
  notes: 260,
  focusNotes: 260,
  lightingNotes: 260,
  scriptSeconds: 110,
  setupMinutes: 110,
  plannedTakes: 110,
  estimatedMinutes: 110,
  actualTakes: 150,
}
export const presets: Record<string, GridField[]> = {
  Essentials: [
    'coverage',
    'framing',
    'camera',
    'lens',
    'movement',
    'estimatedMinutes',
  ],
  Cinematography: [
    'coverage',
    'camera',
    'framing',
    'subject',
    'angle',
    'lens',
    'equipment',
    'movement',
    'notes',
    'focusNotes',
    'lightingNotes',
    'scriptSeconds',
    'setupMinutes',
    'estimatedMinutes',
  ],
  'AD / Planning': [
    'scene',
    'shootDates',
    'assignmentCount',
    'scheduleStatus',
    'setupMinutes',
    'estimatedMinutes',
    'plannedTakes',
    'scriptSeconds',
  ],
  'Full Technical': Object.keys(widths).filter(
    (f) => f !== 'number',
  ) as GridField[],
}
// Print presets are deliberately independent of editing-grid preset migrations.
export const printPresets: Record<string, GridField[]> = {
  ...presets,
  Cinematography: [
    'subject',
    'framing',
    'angle',
    'camera',
    'lens',
    'equipment',
    'movement',
    'notes',
    'focusNotes',
    'lightingNotes',
  ],
}
const previousCinematography = printPresets.Cinematography
export const label = (field: string) =>
  (
    ({
      scene: 'Scene',
      shootDates: 'Shoot dates',
      assignmentCount: 'Assignments',
      scheduleStatus: 'Schedule status',
    }) as Record<string, string>
  )[field] ||
  fields[field as ShotField] ||
  field
export const preferenceKey = 'whiteout.shot-grid.v2'
/** Local, per-account presentation. Ignore stale or malformed browser preferences. */
export function readColumnPreferences(key: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null')
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return null
    const allowed = new Set(Object.keys(widths)),
      visible = Array.isArray(saved.visible)
        ? ([
            ...new Set(
              saved.visible.filter(
                (field: unknown) =>
                  typeof field === 'string' &&
                  allowed.has(field) &&
                  field !== 'number',
              ),
            ),
          ] as GridField[])
        : presets.Essentials,
      order = Array.isArray(saved.order)
        ? ([
            ...new Set(
              saved.order.filter(
                (field: unknown) =>
                  typeof field === 'string' &&
                  allowed.has(field) &&
                  field !== 'number',
              ),
            ),
          ] as string[])
        : undefined,
      sizes = Object.fromEntries(
        Object.entries(saved.sizes || {}).filter(
          ([field, size]) =>
            allowed.has(field) &&
            typeof size === 'number' &&
            Number.isFinite(size) &&
            size >= 80 &&
            size <= 760,
        ),
      )
    const chosenOrder =
      order?.filter((field) => visible.includes(field as GridField)) || visible
    const standardCinematography =
      saved.preset === 'Cinematography' &&
      [previousCinematography, presets.Cinematography].some(
        (standard) =>
          visible.length === standard.length &&
          standard.every((field) => visible.includes(field)) &&
          JSON.stringify(chosenOrder) === JSON.stringify(standard),
      )
    // Only a recognized standard preset migrates; an old manual order is genuinely custom.
    if (standardCinematography)
      return {
        visible: presets.Cinematography,
        order: [
          ...presets.Cinematography,
          ...(order || []).filter(
            (field) => !presets.Cinematography.includes(field as GridField),
          ),
        ],
        sizes: sizes as Record<string, number>,
        preset: 'Cinematography',
      }
    return {
      visible,
      order,
      sizes: sizes as Record<string, number>,
      preset:
        typeof saved.preset === 'string' &&
        (saved.preset === 'Custom' || presets[saved.preset])
          ? saved.preset === 'Cinematography'
            ? 'Custom'
            : saved.preset
          : 'Custom',
    }
  } catch {
    return null
  }
}
