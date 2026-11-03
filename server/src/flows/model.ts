import {resolveSchedule} from './scheduling';
import * as Y from 'yjs';
import { BadRequestException } from '@nestjs/common';
export const DEFAULT_DEPARTMENTS = ['Camera','Grip & Electric','Talent','Sound','Costume','Hair & Makeup','Props','Stunts','Director/Choreography','Production'];
export const collections = [
  'meta',
  'departments',
  'events',
  'instructions',
  'comments',
  'imports',
];
export function setRecord(
  d: Y.Doc,
  k: string,
  id: string,
  data: Record<string, unknown>,
) {
  const m = new Y.Map();
  d.getMap(k).set(id, m);
  Object.entries({ id, ...data }).forEach(([field, value]) =>
    m.set(
      field,
      typeof value === 'string' &&
        ((k === 'events' && ['description', 'notes'].includes(field)) ||
          (k === 'instructions' && field === 'text'))
        ? new Y.Text(value)
        : value,
    ),
  );
  return m;
}
export function capture(d: Y.Doc): any {
  return Object.fromEntries(collections.map((k) => [k, d.getMap(k).toJSON()]));
}
export function validateMeta(m: any) {
  if (typeof m.name !== 'string' || m.name.length > 180 || !m.name.trim())
    throw new BadRequestException('Enter a Flow title up to 180 characters.');
  if (typeof m.zone !== 'string' || !m.zone.trim())
    throw new BadRequestException('Choose a named production timezone.');
  try {
    new Intl.DateTimeFormat('en', { timeZone: m.zone }).format();
  } catch {
    throw new BadRequestException('Choose a valid named production timezone.');
  }
  if (
    m.date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(m.date) ||
      !Number.isFinite(Date.parse(m.date + 'T12:00:00Z')) ||
      new Date(m.date + 'T12:00:00Z').toISOString().slice(0, 10) !== m.date)
  )
    throw new BadRequestException('Choose a valid production date.');
}
export function validateFlow(s: any) {
  validateMeta(s.meta);
  if (JSON.stringify(s).length > 12 * 1024 * 1024)
    throw new BadRequestException('Flow exceeds the 12 MB document limit.');
  for (const k of collections) {
    if (!s[k] || typeof s[k] !== 'object')
      throw new BadRequestException('Invalid Flow state.');
    if (Object.keys(s[k]).length > (k === 'events' ? 5000 : 20000))
      throw new BadRequestException('Flow collection limit exceeded.');
  }
  for (const d of Object.values(s.departments) as any[])
    if (
      typeof d.name !== 'string' ||
      !d.name.trim() ||
      d.name.length > 100 ||
      !Number.isFinite(d.order) ||
      (d.personnel != null &&
        (typeof d.personnel !== 'string' || d.personnel.length > 1000))
    )
      throw new BadRequestException(
        'Departments need a name up to 100 characters and valid order/personnel.',
      );
  for (const e of Object.values(s.events) as any[]) {
    if (
      !['shot', 'milestone', 'department', 'custom'].includes(e.type) ||
      !Number.isFinite(e.order)
    )
      throw new BadRequestException('Invalid event.');
    if(e.clockStart!=null&&(!Number.isFinite(e.clockStart)||Math.abs(e.clockStart)>10080)) throw new BadRequestException('Clock time is outside the seven-day schedule.');
    if(e.offsetMinutes!=null&&(!Number.isFinite(e.offsetMinutes)||Math.abs(e.offsetMinutes)>10080)) throw new BadRequestException('Invalid relative offset.');
    if(e.timing&&!['sequence','anchor','relative','unscheduled'].includes(e.timing)) throw new BadRequestException('Invalid timing relationship.');
    for (const k of ['description', 'notes', 'reference'])
      if (e[k] != null && (typeof e[k] !== 'string' || e[k].length > 30000))
        throw new BadRequestException(
          'Event text is limited to 30,000 characters.',
        );
    for (const k of ['start', 'actualStart', 'actualEnd'])
      if (
        e[k] != null &&
        (!Number.isFinite(Date.parse(e[k])) || typeof e[k] !== 'string')
      )
        throw new BadRequestException('Invalid event time.');
    if (
      e.duration != null &&
      (!Number.isFinite(e.duration) || e.duration < 0 || e.duration > 10080)
    )
      throw new BadRequestException(
        'Duration must be between zero and seven days.',
      );
    if (
      e.actualStart &&
      e.actualEnd &&
      Date.parse(e.actualEnd) < Date.parse(e.actualStart)
    )
      throw new BadRequestException('Actual completion precedes start.');
  }
  try{resolveSchedule(s,null);}catch(e){throw new BadRequestException((e as Error).message)}
  for (const i of Object.values(s.instructions) as any[]) {
    if (
      (i.clockStart!=null&&(!Number.isFinite(i.clockStart)||Math.abs(i.clockStart)>10080)) ||
      (i.offsetMinutes!=null&&(!Number.isFinite(i.offsetMinutes)||Math.abs(i.offsetMinutes)>10080)) ||
      (i.duration!=null&&(!Number.isFinite(i.duration)||i.duration<0||i.duration>10080)) ||
      !s.events[i.eventId] ||
      !s.departments[i.departmentId] ||
      typeof i.text !== 'string' ||
      i.text.length > 30000
    )
      throw new BadRequestException('Invalid department instruction.');
  }
}

/** Canonical JSON keeps revision and artifact identity stable across CRDT reloads. */
export function stableJSON(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, v[k]]),
        )
      : v,
  );
}
