import * as Y from 'yjs';
import { BadRequestException } from '@nestjs/common';
export const DEFAULT_DEPARTMENTS = [
  'Camera + G&E',
  'Actors',
  'Stunt Team',
  'Sound',
  'Costume',
  'HMU',
  'Props',
  'Director/Choreographer',
  'Producers',
];
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
  Object.entries({ id, ...data }).forEach(([k, v]) => m.set(k, v));
  return m;
}
export function capture(d: Y.Doc): any {
  return Object.fromEntries(collections.map((k) => [k, d.getMap(k).toJSON()]));
}
export function validateMeta(m: any) {
  if (typeof m.name !== 'string' || m.name.length > 180 || !m.name.trim())
    throw new BadRequestException('Enter a Flow title up to 180 characters.');
  try {
    new Intl.DateTimeFormat('en', { timeZone: m.zone }).format();
  } catch {
    throw new BadRequestException('Choose a valid named production timezone.');
  }
  if (m.date && !/^\d{4}-\d{2}-\d{2}$/.test(m.date))
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
  for (const e of Object.values(s.events) as any[]) {
    if (
      !['shot', 'milestone', 'department', 'custom'].includes(e.type) ||
      !Number.isFinite(e.order)
    )
      throw new BadRequestException('Invalid event.');
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
  for (const i of Object.values(s.instructions) as any[]) {
    if (
      !s.events[i.eventId] ||
      !s.departments[i.departmentId] ||
      typeof i.text !== 'string' ||
      i.text.length > 30000
    )
      throw new BadRequestException('Invalid department instruction.');
  }
}
