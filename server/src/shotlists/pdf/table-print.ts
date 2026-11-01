import type {
  ShotSnapshot,
  ReportRecord,
  PrintOptions,
} from './shotlist-report';
export type PrintField =
  | 'number'
  | 'scene'
  | 'coverage'
  | 'camera'
  | 'framing'
  | 'subject'
  | 'angle'
  | 'lens'
  | 'equipment'
  | 'movement'
  | 'notes'
  | 'focusNotes'
  | 'lightingNotes'
  | 'scriptSeconds'
  | 'setupMinutes'
  | 'plannedTakes'
  | 'estimatedMinutes'
  | 'actualTakes'
  | 'sequence'
  | 'assignmentNotes'
  | 'assignmentStatus'
  | 'shootDates'
  | 'assignmentCount'
  | 'scheduleStatus';
export type PrintReference = { shotId: string; assignmentId?: string };
export type TablePrintSpec = {
  version: 2;
  scope: 'entire' | 'current' | 'selected' | 'area' | 'scenes' | 'day';
  layout: 'table' | 'expanded' | 'exact' | 'report';
  rows: PrintReference[];
  columns: { field: PrintField; width: number }[];
  sceneIds?: string[];
  dayId?: string;
  paper: 'letter' | 'a4' | 'a3' | 'tabloid';
  orientation: 'landscape' | 'portrait';
  margins: 'normal' | 'narrow';
  scaling: 'fit-width' | 'actual' | 'readable';
  text: 'wrap' | 'single-line';
  groupScenes: boolean;
  report?: PrintOptions;
};
export const printFields: Record<PrintField, string> = {
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
};
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
function invalid(message: string): never {
  throw Error(message);
}
export function validatePrintSpec(raw: TablePrintSpec) {
  if (
    !raw ||
    raw.version !== 2 ||
    !['entire', 'current', 'selected', 'area', 'scenes', 'day'].includes(
      raw.scope,
    ) ||
    !['table', 'expanded', 'exact', 'report'].includes(raw.layout) ||
    !['letter', 'a4', 'a3', 'tabloid'].includes(raw.paper) ||
    !['portrait', 'landscape'].includes(raw.orientation) ||
    !['normal', 'narrow'].includes(raw.margins) ||
    !['fit-width', 'actual', 'readable'].includes(raw.scaling) ||
    !['wrap', 'single-line'].includes(raw.text) ||
    typeof raw.groupScenes !== 'boolean'
  )
    invalid('Choose a valid print configuration.');
  if (
    !Array.isArray(raw.rows) ||
    (!raw.rows.length && !['entire', 'current'].includes(raw.scope)) ||
    raw.rows.length > 5000
  )
    invalid('Choose between 1 and 5,000 printable rows.');
  const references = new Set<string>();
  for (const row of raw.rows) {
    if (
      !row ||
      !uuid.test(row.shotId) ||
      (row.assignmentId !== undefined && !uuid.test(row.assignmentId))
    )
      invalid('Invalid print-area row reference.');
    const key = row.assignmentId || row.shotId;
    if (references.has(key))
      invalid('The print area contains a repeated row reference.');
    references.add(key);
  }
  if (
    !Array.isArray(raw.columns) ||
    !raw.columns.length ||
    raw.columns.length > 26
  )
    invalid('Choose printable columns.');
  const seen = new Set<string>();
  for (const column of raw.columns) {
    if (
      !column ||
      !(column.field in printFields) ||
      !Object.prototype.hasOwnProperty.call(printFields, column.field) ||
      !Number.isFinite(column.width) ||
      column.width < 40 ||
      column.width > 1200 ||
      seen.has(column.field)
    )
      invalid('Invalid or repeated print column.');
    seen.add(column.field);
  }
  if (
    raw.sceneIds &&
    (!Array.isArray(raw.sceneIds) ||
      raw.sceneIds.length > 100 ||
      raw.sceneIds.some((id) => !uuid.test(id)))
  )
    invalid('Invalid scene selection.');
  if (raw.scope === 'day' && (!raw.dayId || !uuid.test(raw.dayId)))
    invalid('Choose a shoot day.');
  return raw;
}
export function resolvePrintArea(data: ShotSnapshot, raw: TablePrintSpec) {
  const spec = validatePrintSpec(raw);
  if (
    !spec.rows.length &&
    Object.values(data.shots).some((shot) => !shot.deleted)
  )
    invalid(
      'There are no rows in this print area. Choose shots or a different scope.',
    );
  const rows = spec.rows.map((reference, index) => {
    const shot = data.shots[reference.shotId],
      scene = shot && data.scenes[String(shot.sceneId)],
      assignment = reference.assignmentId
        ? data.shootAssignments[reference.assignmentId]
        : undefined;
    if (!shot || shot.deleted || !scene || scene.deleted)
      invalid(
        'A selected shot is no longer available. Refresh the print selection.',
      );
    if (
      reference.assignmentId &&
      (!assignment ||
        assignment.deleted ||
        assignment.shotId !== reference.shotId ||
        !data.shootDays[String(assignment.dayId)] ||
        data.shootDays[String(assignment.dayId)].deleted)
    )
      invalid(
        'A selected day assignment is no longer available. Refresh the print selection.',
      );
    if (
      spec.scope === 'day' &&
      (!assignment || assignment.dayId !== spec.dayId)
    )
      invalid('Print rows must belong to the selected shoot day.');
    if (
      spec.scope === 'scenes' &&
      (!spec.sceneIds?.length || !spec.sceneIds.includes(String(shot.sceneId)))
    )
      invalid('Print rows must belong to the selected scenes.');
    return { reference, shot, scene, assignment, index, data };
  });
  const columns = spec.columns.some((c) => c.field === 'number')
    ? spec.columns
    : [{ field: 'number' as const, width: 106 }, ...spec.columns];
  let budget = 0;
  for (const row of rows)
    for (const column of columns) {
      const value = printValue(row, column.field);
      if (value.length > 20000)
        invalid(
          'A selected field exceeds 20,000 characters. Choose a smaller print area.',
        );
      budget += value.length;
      if (budget > 2_000_000)
        invalid(
          'The selected print area exceeds the 2 MB text budget. Choose fewer rows or fields.',
        );
    }
  return { spec, rows, columns };
}
type PrintRow = {
  reference: PrintReference;
  shot: ReportRecord;
  scene: ReportRecord;
  assignment?: ReportRecord;
  index: number;
  data: ShotSnapshot;
};
export function printValue(row: PrintRow, field: PrintField) {
  if (['shootDates', 'assignmentCount', 'scheduleStatus'].includes(field)) {
    const records = Object.values(row.data.shootAssignments).filter(
      (assignment) =>
        !assignment.deleted &&
        assignment.shotId === row.shot.id &&
        row.data.shootDays[String(assignment.dayId)] &&
        !row.data.shootDays[String(assignment.dayId)].deleted,
    );
    if (field === 'assignmentCount') return String(records.length);
    if (field === 'scheduleStatus')
      return [
        ...new Set(
          records.map((record) => String(record.status || '')).filter(Boolean),
        ),
      ].join(', ');
    return records.length
      ? [
          ...new Set(
            records.map((record) =>
              String(row.data.shootDays[String(record.dayId)].date || ''),
            ),
          ),
        ]
          .sort()
          .join(', ')
      : 'Not scheduled';
  }
  if (field === 'number') {
    const n = String(row.shot.number || ''),
      scene = String(row.scene.number || '');
    if (!scene || !/^[A-Za-z]+$/.test(n)) return n;
    const full = `${scene}-${n}`,
      collision = Object.values(row.data.shots).some(
        (other) =>
          other.id !== row.shot.id &&
          !other.deleted &&
          other.sceneId === row.shot.sceneId &&
          other.number === full,
      );
    return collision ? `${full} [${n}]` : full;
  }
  if (field === 'scene') return String(row.scene.number ?? '');
  if (field === 'sequence') return String(row.index + 1);
  if (field === 'assignmentNotes') return String(row.assignment?.notes ?? '');
  if (field === 'assignmentStatus') return String(row.assignment?.status ?? '');
  if (field === 'estimatedMinutes' && row.assignment?.estimatedMinutes)
    return String(row.assignment.estimatedMinutes);
  return String(row.shot[field] ?? '');
}
