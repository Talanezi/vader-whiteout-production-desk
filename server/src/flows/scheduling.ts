/** Pure set-clock scheduling shared by the browser and PDF service. Derived times
 * are never written by competing clients. UUIDs, anchors and order are the inputs. */
export const DAY = 1440;
export function scenePrefix(value: unknown) {
  const s = String(value || '').trim();
  return /^\d+$/.test(s) ? s.padStart(2, '0') : s;
}
export function canonicalLabel(number: unknown, scene: unknown) {
  const n = String(number || '').trim(),
    p = scenePrefix(scene);
  if (/^[a-z]+$/i.test(n))
    return p ? p + '-' + n.toUpperCase() : n.toUpperCase();
  const match = n.match(/^(.+)-([a-z]+)$/i);
  return match ? scenePrefix(match[1]) + '-' + match[2].toUpperCase() : n;
}
export function sourceLabel(shot: any, source: any) {
  return canonicalLabel(
    shot?.number,
    source?.scenes?.[shot?.sceneId]?.number,
  );
}
export function clockText(minute: number | null | undefined) {
  if (minute == null || !Number.isFinite(minute)) return 'TBD';
  const m = ((Math.round(minute) % DAY) + DAY) % DAY,
    h = Math.floor(m / 60);
  return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${
    h < 12 ? 'AM' : 'PM'
  }`;
}
export function parseClock(value: string) {
  if (!value.trim()) return null;
  const m = value
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(a(?:m)?|p(?:m)?)?$/i);
  if (!m) throw Error('Enter a time such as 9:00 AM.');
  let h = Number(m[1]);
  const min = Number(m[2] || 0),
    suffix = m[3]?.toLowerCase();
  if (min > 59 || h > (suffix ? 12 : 23) || (suffix && h < 1))
    throw Error('Enter a valid clock time.');
  if (suffix) h = (h % 12) + (suffix[0] === 'p' ? 12 : 0);
  return h * 60 + min;
}
export function wallParts(value: string, zone: string) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const v = (key: string) => p.find((x) => x.type === key)?.value || '';
  return `${v('year')}-${v('month')}-${v('day')}T${v('hour')}:${v(
    'minute',
  )}:00.000Z`;
}
export function legacyMinute(
  value: string | null,
  meta: any,
  base: string,
) {
  if (!value) return null;
  return (
    (Date.parse(wallParts(value, meta.zone || 'America/Los_Angeles')) -
      Date.parse(base + 'T00:00:00Z')) /
    60000
  );
}
export function effectiveDuration(e: any, source: any) {
  if (e.allottedMinutes != null) return Number(e.allottedMinutes);
  if (e.duration != null) return Number(e.duration);
  const shot =
    e.sourceListId === source?.id || !source?.id
      ? source?.shots?.[e.shotId]
      : undefined;
  const v =
    shot && !shot.deleted && !shot.deletedAt
      ? shot.estimatedMinutes
      : null;
  return v !== '' &&
    v != null &&
    Number.isFinite(Number(v)) &&
    Number(v) >= 0
    ? Number(v)
    : null;
}
export function resolveSchedule(state: any, source: any) {
  if (source) source = { ...source, id: state.meta?.listId };
  const meta = state.meta || {},
    original = Object.values(state.events || {}) as any[];
  const first = original.find((e) => e.start)?.start;
  // A compatibility base is used for arithmetic only, never invented as Shoot date.
  const base =
    meta.date ||
    (first
      ? wallParts(first, meta.zone || 'America/Los_Angeles').slice(0, 10)
      : '2000-01-01');
  const input = original
    .filter((e) => !e.deletedAt)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  const positions = new Map(input.map((e, i) => [e.id, i]));
  const byId = new Map(input.map((e) => [e.id, e])),
    output = new Map<string, any>(),
    visiting = new Set<string>();
  function anchor(e: any) {
    return e.clockStart !== undefined
      ? e.clockStart
      : legacyMinute(e.start, meta, base);
  }
  function resolve(e: any): any {
    if (output.has(e.id)) return output.get(e.id);
    if (visiting.size > 256)
      throw Error('The activity timing chain is too deep.');
    if (visiting.has(e.id))
      throw Error(
        'Activities cannot depend on themselves or form a timing cycle.',
      );
    visiting.add(e.id);
    const i = positions.get(e.id)!,
      timing =
        e.timing ||
        (e.start || e.clockStart != null
          ? 'anchor'
          : e.type === 'department'
          ? 'unscheduled'
          : 'sequence');
    let minute: number | null = null;
    if (timing === 'anchor') minute = anchor(e);
    if (timing === 'relative') {
      const parent = byId.get(e.dependsOn);
      if (!parent) throw Error('The related activity is unavailable.');
      const p = resolve(parent);
      if (
        p.minute != null &&
        (e.relativeEdge !== 'end' || p.effectiveDuration != null)
      )
        minute =
          p.minute +
          (e.relativeEdge === 'end' ? p.effectiveDuration : 0) +
          Number(e.offsetMinutes || 0);
    }
    if (timing === 'sequence') {
      let j = i - 1;
      while (
        j >= 0 &&
        (input[j].type === 'department' || input[j].timing === 'relative')
      )
        j--;
      if (j >= 0) {
        const p = resolve(input[j]);
        if (p.minute != null && p.effectiveDuration != null)
          minute = p.minute + p.effectiveDuration;
      } else minute = meta.filmingStart ?? null;
      if (
        e.type === 'shot' &&
        !input.slice(0, i).some((x) => x.type === 'shot') &&
        meta.filmingStart != null
      )
        minute =
          minute == null
            ? meta.filmingStart
            : Math.max(meta.filmingStart, minute);
    }
    const n = effectiveDuration(e, source),
      label =
        e.type === 'shot'
          ? sourceLabel(source?.shots?.[e.shotId], source) ||
            e.reference ||
            'Shot unavailable'
          : '';
    const result = {
      ...e,
      sourceMissing:
        e.type === 'shot' &&
        (!source?.shots?.[e.shotId] ||
          source.shots[e.shotId].deleted ||
          source.shots[e.shotId].deletedAt),
      timing,
      minute,
      effectiveDuration: n,
      label,
      start:
        minute == null
          ? null
          : new Date(
              Date.parse(base + 'T00:00:00Z') + minute * 60000,
            ).toISOString(),
    };
    visiting.delete(e.id);
    output.set(e.id, result);
    return result;
  }
  const events = input.map(resolve),
    conflicts: any[] = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (
      e.minute == null ||
      e.effectiveDuration == null ||
      e.type === 'department'
    )
      continue;
    for (const a of events.slice(i + 1))
      if (
        a.fixed &&
        a.minute != null &&
        a.minute >= e.minute &&
        a.minute < e.minute + e.effectiveDuration
      )
        conflicts.push({
          eventId: e.id,
          anchorId: a.id,
          overlap: e.minute + e.effectiveDuration - a.minute,
        });
  }
  const instructions = Object.values(state.instructions || {}).map(
    (v: any) => {
      const parent = output.get(v.eventId);
      let minute: number | null = null;
      if (v.timing === 'anchor') minute = v.clockStart ?? null;
      if (
        v.timing === 'relative' &&
        parent?.minute != null &&
        (v.relativeEdge !== 'end' || parent.effectiveDuration != null)
      )
        minute =
          parent.minute +
          (v.relativeEdge === 'end' ? parent.effectiveDuration : 0) +
          Number(v.offsetMinutes || 0);
      return { ...v, minute };
    },
  );
  return { events, instructions, conflicts, base };
}
