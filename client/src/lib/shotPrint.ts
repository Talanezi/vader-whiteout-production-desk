import type { ShotField } from './shotDocument'
export type PrintField =
  | ShotField
  | 'scene'
  | 'sequence'
  | 'assignmentNotes'
  | 'assignmentStatus'
  | 'shootDates'
  | 'assignmentCount'
  | 'scheduleStatus'
export type PrintReference = { shotId: string; assignmentId?: string }
export type PrintColumn = { field: PrintField; width: number }
export type PrintArea = {
  rows: PrintReference[]
  columns: PrintColumn[]
  label: string
}
export type PrintView = {
  label: string
  rows: PrintReference[]
  columns: PrintColumn[]
  area?: PrintArea
  dayId?: string
  groupScenes: boolean
}
export type PrintSpec = {
  version: 2
  scope: 'entire' | 'current' | 'selected' | 'area' | 'scenes' | 'day'
  layout: 'table' | 'expanded' | 'exact' | 'report'
  rows: PrintReference[]
  columns: PrintColumn[]
  sceneIds?: string[]
  dayId?: string
  paper: 'letter' | 'a4' | 'a3' | 'tabloid'
  orientation: 'landscape' | 'portrait'
  margins: 'normal' | 'narrow'
  scaling: 'fit-width' | 'actual' | 'readable'
  text: 'wrap' | 'single-line'
  groupScenes: boolean
  report?: {
    mode: 'creative' | 'shooting' | 'both'
    profile: 'compact' | 'standard' | 'detailed'
    notes: boolean
    summaries: boolean
  }
}
export const shootingColumns: PrintColumn[] = [
  { field: 'sequence', width: 65 },
  { field: 'number', width: 106 },
  { field: 'scene', width: 80 },
  { field: 'coverage', width: 290 },
  { field: 'camera', width: 100 },
  { field: 'estimatedMinutes', width: 104 },
  { field: 'assignmentNotes', width: 240 },
  { field: 'assignmentStatus', width: 120 },
]
export const printLabels: Record<PrintField, string> = {
  number: 'Shot',
  scene: 'Scene',
  coverage: 'Coverage',
  camera: 'Camera',
  framing: 'Framing',
  subject: 'Subject',
  angle: 'Angle',
  lens: 'Lens',
  equipment: 'Support',
  movement: 'Movement',
  notes: 'Camera notes',
  focusNotes: 'Focus notes',
  lightingNotes: 'Lighting notes',
  scriptSeconds: 'Script sec',
  setupMinutes: 'Setup min',
  plannedTakes: 'Takes',
  estimatedMinutes: 'Est. min',
  actualTakes: 'Actual / best',
  sequence: 'Order',
  assignmentNotes: 'Schedule notes',
  assignmentStatus: 'Status',
  shootDates: 'Shoot dates',
  assignmentCount: 'Assignments',
  scheduleStatus: 'Schedule status',
}
export function printFit(
  columns: PrintColumn[],
  paper: 'letter' | 'a4' | 'a3' | 'tabloid',
  orientation: 'landscape' | 'portrait',
  margins: 'normal' | 'narrow',
) {
  const page =
      paper === 'a3'
        ? orientation === 'landscape'
          ? [1190.55, 841.89]
          : [841.89, 1190.55]
        : paper === 'tabloid'
          ? orientation === 'landscape'
            ? [1224, 792]
            : [792, 1224]
          : paper === 'letter'
            ? orientation === 'landscape'
              ? [792, 612]
              : [612, 792]
            : orientation === 'landscape'
              ? [841.89, 595.28]
              : [595.28, 841.89],
    available = page[0] - (2 * (margins === 'narrow' ? 8 : 12) * 72) / 25.4,
    scale = Math.min(
      1,
      (available - columns.length * 4.8) /
        columns.reduce(
          (sum, c) =>
            sum + Math.max(c.field === 'number' ? 58 : 34, c.width * 0.65),
          0,
        ),
    )
  return { font: 9 * scale, page, readable: 9 * scale >= 8 }
}
