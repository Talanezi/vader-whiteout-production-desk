import { resolveSchedule, wallParts } from './scheduling';
export type ActualBlock = {
  id: string;
  eventId: string;
  kind: string;
  label: string;
  date?: string;
  zone?: string;
  status: 'active' | 'completed' | 'skipped' | 'recorded';
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
      60000 +
    (((now % 60000) + 60000) % 60000) / 60000
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
  const fraction = (minute - Math.floor(minute)) * 60000;
  const target =
    Date.parse(meta.date + 'T00:00:00Z') + Math.floor(minute) * 60000;
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
  return candidates[fold || 0] + fraction;
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
  if (
    !p ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      p.id || '',
    )
  )
    throw Error('A stable action ID is required.');
  if (old.audit.some((a) => a.id === p.id)) return old;
  const prior = old.blocks[p.eventId];
  const guardedStamp =
    p.type === 'stamp' &&
    Object.prototype.hasOwnProperty.call(p, 'expectedStartedAt') &&
    Object.prototype.hasOwnProperty.call(p, 'expectedEndedAt');
  if (
    guardedStamp &&
    ((prior?.startedAt ?? null) !== p.expectedStartedAt ||
      (prior?.endedAt ?? null) !== p.expectedEndedAt)
  )
    throw Error(
      'This actual time changed while you were editing. Review the latest entry.',
    );
  if (p.revision !== old.revision && !guardedStamp)
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
    b.endMinute = actualMinute(at.instant, {
      date: b.date || state.meta.date,
      zone: b.zone || state.meta.zone,
    });
    next.activeId = null;
  }
  if (p.type === 'stamp') {
    if (
      !['start', 'end', undefined].includes(p.field) ||
      (p.useCurrent !== undefined && typeof p.useCurrent !== 'boolean')
    )
      throw Error('Choose a valid timestamp field.');
    if (!state.meta.date)
      throw Error('Assign the Shoot date before recording actual times.');
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
    const b: ActualBlock = existing
      ? structuredClone(existing)
      : {
          id: p.id,
          eventId: p.eventId,
          date: state.meta.date,
          zone: state.meta.zone,
          kind: event.type,
          label: planned?.label || event.description || 'Activity',
          status: 'recorded',
          plannedMinute: planned?.minute ?? null,
          plannedEnd:
            planned?.minute != null && planned.effectiveDuration != null
              ? planned.minute + planned.effectiveDuration
              : null,
          estimate: Number.isFinite(estimate) ? estimate : null,
          allotted: event.allottedMinutes ?? event.duration ?? null,
          by: user,
        };
    if(b.plannedMinute==null){b.plannedMinute=planned?.minute??null;b.plannedEnd=planned?.minute!=null&&planned.effectiveDuration!=null?planned.minute+planned.effectiveDuration:null;b.estimate=Number.isFinite(estimate)?estimate:null;b.allotted=event.allottedMinutes??event.duration??null}
    const context = {
      date: b.date || state.meta.date,
      zone: b.zone || state.meta.zone,
    };
    if (p.field !== 'end') {
      if (p.minute === null) {
        if (b.endedAt != null)
          throw Error(
            'Clear the confirmed finish before clearing its start.',
          );
        delete b.startedAt;
        delete b.startMinute;
      } else {
        const at = p.useCurrent
          ? { instant: occurred, minute: actualMinute(occurred, context) }
          : {
              instant: clockInstant(p.minute, context, now, p.fold),
              minute: p.minute,
            };
        b.startedAt = at.instant;
        b.startMinute = at.minute;
      }
    } else if (p.minute === null) {
      delete b.endedAt;
      delete b.endMinute;
    } else {
      if (b.startedAt == null)
        throw Error('Record an actual start before a confirmed finish.');
      const at = p.useCurrent
        ? { instant: occurred, minute: actualMinute(occurred, context) }
        : {
            instant: clockInstant(p.minute, context, now, p.fold),
            minute: p.minute,
          };
      b.endedAt = at.instant;
      b.endMinute = at.minute;
    }
    if (
      b.startedAt != null &&
      b.endedAt != null &&
      b.endedAt < b.startedAt
    )
      throw Error('Actual finish cannot precede actual start.');
    b.status = b.endedAt != null ? 'completed' : 'recorded';
    next.blocks[p.eventId] = b;
    // A timestamp ledger never silently closes a prior block or allocates a gap.
    if (next.activeId) {
      const active = next.blocks[next.activeId];
      if (active?.status === 'active') active.status = 'recorded';
      next.activeId = null;
    }
    p = {
      ...p,
      reason:
        p.reason ||
        (existing
          ? 'Actual timestamp corrected'
          : 'Actual timestamp recorded'),
    };
  } else if (p.type === 'start' || p.type === 'advance') {
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
      date: state.meta.date,
      zone: state.meta.zone,
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
    if (existing?.startedAt!=null)
      throw Error(
        'Clear or correct the actual timestamp before skipping this occurrence.',
      );
    next.blocks[p.eventId] = {
      id: p.id,
      eventId: p.eventId,
      date: state.meta.date,
      zone: state.meta.zone,
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
        (b as any)[field] = clockInstant(
          p[k],
          {
            date: b.date || state.meta.date,
            zone: b.zone || state.meta.zone,
          },
          now,
          p.fold,
        );
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
    .filter(
      (b) =>
        b.startedAt != null && ['active', 'completed'].includes(b.status),
    )
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
    after: Object.fromEntries(
      Object.keys(before.blocks).map((id) => [
        id,
        next.blocks[id] || null,
      ]),
    ),
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

/** Timestamp-ledger projection. No device clock or running timer is required.
 * Missing intermediate stamps never get bridged implicitly. Confirmed blocks
 * exclude unrecorded gaps; inferred intervals are always labelled as such. */
export function ledgerMetrics(state: any, source: any) {
  const live: LiveState = state.meta.liveState || emptyLive(),
    planned = resolveSchedule(state, source).events.filter(
      (e: any) => e.type !== 'department',
    );
  const rows = planned.map((event: any, index: number) => {
    const block = live.blocks[event.id],
      shot =
        event.sourceListId === state.meta.listId
          ? source?.shots?.[event.shotId]
          : undefined;
    const estimate =
      shot &&
      !shot.deleted &&
      !shot.deletedAt &&
      shot.estimatedMinutes !== '' &&
      shot.estimatedMinutes != null &&
      Number.isFinite(Number(shot.estimatedMinutes)) &&
      Number(shot.estimatedMinutes) >= 0
        ? Number(shot.estimatedMinutes)
        : null;
    const allotted = event.allottedMinutes ?? event.duration ?? null;
    let nextIndex = index + 1;
    while (
      nextIndex < planned.length &&
      live.blocks[planned[nextIndex].id]?.status === 'skipped'
    )
      nextIndex++;
    const nextEvent = planned[nextIndex],
      next = nextEvent ? live.blocks[nextEvent.id] : undefined;
    let seconds: number | null = null,
      kind = '',
      issue = '';
    if (block?.startedAt != null) {
      if (block.endedAt != null) {
        seconds = (block.endedAt - block.startedAt) / 1000;
        kind = 'Confirmed block';
      } else if (next?.startedAt != null) {
        seconds = (next.startedAt - block.startedAt) / 1000;
        kind = 'Start-to-start';
      }
      if (seconds != null && seconds < 0) {
        seconds = null;
        issue = 'Next timestamp precedes this start';
      }
      const previous = planned
        .slice(0, index)
        .reverse()
        .map((e: any) => live.blocks[e.id])
        .find((b: any) => b?.startedAt != null);
      if (previous && block.startedAt < previous.startedAt!)
        issue = 'Start precedes an earlier recorded activity';
      if (
        block.endedAt != null &&
        next?.startedAt != null &&
        block.endedAt > next.startedAt
      )
        issue = 'Confirmed finish overlaps the next start';
    }
    // Never classify a shot using a following break's duration or a missing start.
    const budgetIssue =
      estimate != null && allotted != null && allotted < estimate;
    const performance = event.type!=='shot'?{zone:'unknown',label:issue?'Review timestamps':block?.status==='skipped'?'Skipped':block?.startedAt==null?'Not recorded':'Activity logged'}:budgetIssue
      ? { zone: 'inconsistent', label: 'Allotment below estimate' }
      : issue
        ? { zone: 'unknown', label: 'Review timestamps' }
        : seconds == null
          ? {
              zone: 'unknown',
              label:
                block?.status === 'skipped'
                  ? 'Skipped'
                  : block?.startedAt == null
                    ? 'Not recorded'
                    : 'Awaiting next timestamp',
            }
          : timingZone(seconds, estimate, allotted);
    return {
      event,
      block,
      estimate,
      allotted,
      seconds,
      kind,
      issue,
      budgetIssue,
      performance,
      coverage: String(shot?.coverage || ''),
    };
  });
  const lastRecorded = rows.reduce(
    (n: any, r: any, i: number) => (r.block?.startedAt != null ? i : n),
    -1,
  );
  const review = rows.filter(
    (r: any, i: number) =>
      r.issue ||
      r.budgetIssue ||
      (i <= lastRecorded &&
        r.block?.startedAt == null &&
        r.block?.status !== 'skipped'),
  );
  const measured = rows.filter(
    (r: any) =>
      r.event.type === 'shot' &&
      !r.issue &&
      !r.budgetIssue &&
      r.seconds != null &&
      r.allotted != null,
  );
  const budgetSeconds = measured.length
    ? measured.reduce(
        (n: number, r: any) => n + r.seconds - r.allotted * 60,
        0,
      )
    : null;
  const checkpoints = rows
    .filter(
      (r: any) =>
        !r.issue &&
        r.block?.startedAt != null &&
        (r.block.plannedMinute ?? r.event.minute) != null,
    )
    .map((r: any) => ({
      id: r.event.id,
      label: r.event.label || r.event.description,
      at: r.block.endedAt ?? r.block.startedAt,
      variance:
        (r.block.endedAt != null && r.block.plannedEnd != null
          ? r.block.endMinute - r.block.plannedEnd
          : r.block.startMinute -
            (r.block.plannedMinute ?? r.event.minute)) * 60,
    }))
    .sort((a: any, b: any) => a.at - b.at);
  return {
    rows,
    review: review.length,
    recorded: rows.filter(
      (r: any) => r.event.type === 'shot' && r.block?.startedAt != null,
    ).length,
    total: rows.filter((r: any) => r.event.type === 'shot').length,
    budgetSeconds,
    inferred: measured.filter((r: any) => r.kind === 'Start-to-start')
      .length,
    confirmed: measured.filter((r: any) => r.kind === 'Confirmed block')
      .length,
    scheduleSeconds: checkpoints.length
      ? checkpoints[checkpoints.length - 1].variance
      : null,
    checkpoints,
  };
}
