import { resolveSchedule, wallParts } from './scheduling';
export type ActualBlock = {
  id: string;
  eventId: string;
  kind: string;
  label: string;
  status: 'active' | 'completed' | 'skipped';
  startedAt?: number;
  endedAt?: number;
  startMinute?: number;
  endMinute?: number;
  plannedMinute: number | null;
  plannedEnd: number | null;
  estimate: number | null;
  allotted: number | null;
  by: { id: number; name: string };
};
export type LiveState = {
  version: 1;
  revision: number;
  activeId: string | null;
  blocks: Record<string, ActualBlock>;
  audit: any[];
};
export const emptyLive = (): LiveState => ({
  version: 1,
  revision: 0,
  activeId: null,
  blocks: {},
  audit: [],
});
export function actualMinute(now: number, meta: any) {
  const day =
    meta.date ||
    wallParts(
      new Date(now).toISOString(),
      meta.zone || 'America/Los_Angeles',
    ).slice(0, 10);
  return (
    (Date.parse(
      wallParts(
        new Date(now).toISOString(),
        meta.zone || 'America/Los_Angeles',
      ),
    ) -
      Date.parse(day + 'T00:00:00Z')) /
    60000
  );
}
export function clockInstant(
  minute: number,
  meta: any,
  now: number,
  fold?: number,
) {
  if (!Number.isFinite(minute) || Math.abs(minute) > 10080)
    throw Error('Choose a valid set time within this production week.');
  if (!meta.date)
    throw Error('Assign the Shoot date before recording an actual time.');
  const target = Date.parse(meta.date + 'T00:00:00Z') + minute * 60000;
  let guess = target;
  for (let i = 0; i < 4; i++)
    guess +=
      target -
      Date.parse(
        wallParts(
          new Date(guess).toISOString(),
          meta.zone || 'America/Los_Angeles',
        ),
      );
  const candidates = [guess - 3600000, guess, guess + 3600000]
    .filter(
      (v, i, a) =>
        a.indexOf(v) === i &&
        Date.parse(
          wallParts(
            new Date(v).toISOString(),
            meta.zone || 'America/Los_Angeles',
          ),
        ) === target,
    )
    .sort((a, b) => a - b);
  if (!candidates.length)
    throw Error(
      'This set time does not exist because the clocks advance.',
    );
  if (candidates.length > 1 && fold !== 0 && fold !== 1)
    throw Error(
      'This set time occurs twice. Select its first or second occurrence.',
    );
  return candidates[fold || 0];
}
/** Pure transition. The service serializes and durably saves it before acknowledging. */
export function transitionLive(
  previous: LiveState | undefined,
  p: any,
  state: any,
  source: any,
  user: { id: number; name: string },
  now = Date.now(),
): LiveState {
  const old = previous || emptyLive();
  if (!p || !/^[0-9a-f-]{36}$/i.test(p.id || ''))
    throw Error('A stable action ID is required.');
  if (old.audit.some((a) => a.id === p.id)) return old;
  if (p.revision !== old.revision)
    throw Error(
      'The production log changed. Review the latest state before applying this action.',
    );
  if (old.audit.length >= 10000)
    throw Error('This production log has reached its safe action limit.');
  const next: LiveState = structuredClone(old),
    before = {
      activeId: old.activeId,
      blocks: {} as Record<string, ActualBlock | null>,
    };
  const event = state.events?.[p.eventId],
    existing = next.blocks[p.eventId];
  if (!['undo'].includes(p.type) && (!event || event.deletedAt))
    throw Error('This activity is unavailable.');
  const occurred = p.occurredAt ?? now;
  if (
    !Number.isFinite(occurred) ||
    occurred > now + 300000 ||
    occurred < now - 7 * 86400000
  )
    throw Error(
      'This recorded time is outside the safe retry window. Review and correct the log.',
    );
  const stamp = (minute?: number) =>
    minute == null
      ? { instant: occurred, minute: actualMinute(occurred, state.meta) }
      : { instant: clockInstant(minute, state.meta, now, p.fold), minute };
  function finish(
    eventId: string,
    at: { instant: number; minute: number },
  ) {
    const b = next.blocks[eventId];
    if (!b || b.status !== 'active' || b.startedAt == null)
      throw Error('This block has not started or is already finished.');
    if (at.instant < b.startedAt)
      throw Error('Actual finish cannot precede actual start.');
    b.status = 'completed';
    b.endedAt = at.instant;
    b.endMinute = at.minute;
    next.activeId = null;
  }
  if (p.type === 'start' || p.type === 'advance') {
    if (existing)
      throw Error(
        'This occurrence already has a production record. Correct it or schedule a separate occurrence.',
      );
    if (!state.meta.date)
      throw Error('Assign the Shoot date before starting production.');
    const at = stamp(p.clockMinute);
    if (next.activeId) {
      if (p.type !== 'advance')
        throw Error('Finish the active block or use Start next shot.');
      finish(next.activeId, at);
    }
    const planned = resolveSchedule(state, source).events.find(
        (e: any) => e.id === p.eventId,
      ),
      shot =
        event.sourceListId === state.meta.listId
          ? source?.shots?.[event.shotId]
          : null;
    const estimate =
      shot &&
      !shot.deleted &&
      !shot.deletedAt &&
      shot.estimatedMinutes !== '' &&
      shot.estimatedMinutes != null &&
      Number(shot.estimatedMinutes) >= 0
        ? Number(shot.estimatedMinutes)
        : null;
    next.blocks[p.eventId] = {
      id: p.id,
      eventId: p.eventId,
      kind: event.type,
      label: planned?.label || event.description || 'Activity',
      status: 'active',
      startedAt: at.instant,
      startMinute: at.minute,
      plannedMinute: planned?.minute ?? null,
      plannedEnd:
        planned?.minute != null && planned.effectiveDuration != null
          ? planned.minute + planned.effectiveDuration
          : null,
      estimate: Number.isFinite(estimate) ? estimate : null,
      allotted: event.allottedMinutes ?? event.duration ?? null,
      by: user,
    };
    next.activeId = p.eventId;
  } else if (p.type === 'finish') {
    if (next.activeId !== p.eventId)
      throw Error('Only the active block can be finished.');
    finish(p.eventId, stamp(p.clockMinute));
  } else if (p.type === 'skip') {
    if (existing)
      throw Error(
        'Correct the existing production record before skipping this occurrence.',
      );
    next.blocks[p.eventId] = {
      id: p.id,
      eventId: p.eventId,
      kind: event.type,
      label: event.reference || event.description || 'Activity',
      status: 'skipped',
      plannedMinute: null,
      plannedEnd: null,
      estimate: null,
      allotted: null,
      by: user,
    };
  } else if (p.type === 'correct') {
    if (!existing || existing.status === 'skipped')
      throw Error('There is no actual interval to correct.');
    if (
      typeof p.reason !== 'string' ||
      !p.reason.trim() ||
      p.reason.length > 500
    )
      throw Error('Add a concise reason for this correction.');
    const b = next.blocks[p.eventId];
    for (const [k, field] of [
      ['startMinute', 'startedAt'],
      ['endMinute', 'endedAt'],
    ])
      if (p[k] != null) {
        if (field === 'endedAt' && b.status !== 'completed')
          throw Error(
            'Finish the active block before correcting its end.',
          );
        (b as any)[field] = clockInstant(p[k], state.meta, now, p.fold);
        (b as any)[k] = p[k];
      }
    if (
      b.endedAt != null &&
      b.startedAt != null &&
      b.endedAt < b.startedAt
    )
      throw Error('Actual finish cannot precede actual start.');
  } else if (p.type === 'undo') {
    const last = [...old.audit]
      .reverse()
      .find(
        (a) =>
          a.type !== 'undo' &&
          !old.audit.some((u) => u.type === 'undo' && u.target === a.id),
      );
    if (!last?.before)
      throw Error('There is no production action to undo.');
    next.activeId = last.before.activeId;
    for (const [id, value] of Object.entries(last.before.blocks)) {
      if (value) next.blocks[id] = structuredClone(value) as ActualBlock;
      else delete next.blocks[id];
    }
    p = { ...p, target: last.id };
  } else throw Error('Choose a supported production action.');
  // Validate the complete main-block chronology, including manual corrections.
  const intervals = Object.values(next.blocks)
    .filter((b) => b.startedAt != null && b.status !== 'skipped')
    .sort((a, b) => a.startedAt! - b.startedAt!);
  for (let i = 1; i < intervals.length; i++)
    if ((intervals[i - 1].endedAt ?? Infinity) > intervals[i].startedAt!)
      throw Error(
        'Actual production blocks cannot overlap. Correct the adjacent boundary first.',
      );
  for (const id of new Set([
    ...Object.keys(old.blocks),
    ...Object.keys(next.blocks),
  ]))
    if (JSON.stringify(old.blocks[id]) !== JSON.stringify(next.blocks[id]))
      before.blocks[id] = old.blocks[id] || null;
  next.revision++;
  next.audit.push({
    id: p.id,
    type: p.type,
    eventId: p.eventId || null,
    target: p.target || null,
    reason: p.reason || '',
    at: now,
    by: user,
    before,
  });
  return next;
}
export function timingZone(
  elapsed: number | null,
  estimate: number | null,
  allotted: number | null,
) {
  if (elapsed == null) return { zone: 'unknown', label: 'Not started' };
  if (estimate != null && allotted != null && allotted < estimate)
    return {
      zone: 'inconsistent',
      label: 'Allotment is shorter than estimate',
    };
  if (allotted != null && elapsed > allotted * 60)
    return { zone: 'red', label: 'Over allotment' };
  if (estimate != null && elapsed <= estimate * 60)
    return { zone: 'green', label: 'Within estimate' };
  if (estimate != null && allotted != null)
    return { zone: 'yellow', label: 'Within allotment' };
  return {
    zone: 'unknown',
    label: estimate == null ? 'Estimate missing' : 'Allotment missing',
  };
}
export function liveMetrics(live: LiveState | undefined, now: number) {
  const blocks = Object.values(live?.blocks || {}),
    completed = blocks.filter(
      (b) =>
        b.status === 'completed' &&
        b.startedAt != null &&
        b.endedAt != null,
    ),
    shots = completed.filter(
      (b) => b.kind === 'shot' && b.allotted != null,
    );
  const budgetSeconds = shots.reduce(
    (n, b) => n + (b.endedAt! - b.startedAt!) / 1000 - b.allotted! * 60,
    0,
  );
  const last = completed
    .filter((b) => b.endMinute != null && b.plannedEnd != null)
    .sort((a, b) => b.endedAt! - a.endedAt!)[0];
  const active = live?.activeId ? live.blocks[live.activeId] : undefined;
  return {
    budgetSeconds,
    completedBudgeted: shots.length,
    scheduleSeconds: last
      ? (last.endMinute! - last.plannedEnd!) * 60
      : null,
    active,
    elapsedSeconds:
      active?.startedAt != null
        ? Math.max(0, (now - active.startedAt) / 1000)
        : null,
  };
}
