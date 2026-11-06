const assert = require('assert/strict'),
  {
    transitionLive,
    emptyLive,
    timingZone,
    liveMetrics,
    clockInstant,
  } = require('/tmp/m032/runtime/server-dist/flows/live'),
  {
    resolveSchedule,
  } = require('/tmp/m032/runtime/server-dist/flows/scheduling'),
  { randomUUID } = require('crypto')
const start = Date.parse('2026-11-08T17:00:00Z'),
  state = {
    meta: {
      date: '2026-11-08',
      zone: 'America/Los_Angeles',
      listId: 'list',
      filmingStart: 540,
    },
    events: {
      a: {
        id: 'a',
        type: 'shot',
        shotId: 's1',
        sourceListId: 'list',
        order: 0,
        timing: 'sequence',
        allottedMinutes: 10,
      },
      b: {
        id: 'b',
        type: 'shot',
        shotId: 's2',
        sourceListId: 'list',
        order: 1,
        timing: 'sequence',
        allottedMinutes: 10,
      },
      lunch: {
        id: 'lunch',
        type: 'milestone',
        description: 'Lunch',
        order: 2,
        timing: 'anchor',
        clockStart: 720,
        fixed: true,
        duration: 30,
      },
    },
    instructions: {},
  },
  source = {
    shots: {
      s1: { number: 'A', sceneId: 's', estimatedMinutes: 8 },
      s2: { number: 'B', sceneId: 's', estimatedMinutes: 8 },
    },
    scenes: { s: { number: '10' } },
  },
  u = { id: 1, name: 'QA AD' }
let live = emptyLive()
function act(type, eventId, now, extra = {}) {
  live = transitionLive(
    live,
    { id: randomUUID(), revision: live.revision, type, eventId, ...extra },
    state,
    source,
    u,
    now,
  )
  return live
}
assert.deepEqual(
  resolveSchedule(state, source)
    .events.slice(0, 2)
    .map((e) => e.minute),
  [540, 550],
)
assert.equal(source.shots.s1.estimatedMinutes, 8)
assert.equal(timingZone(480, 8, 10).zone, 'green')
assert.equal(timingZone(481, 8, 10).zone, 'yellow')
assert.equal(timingZone(600, 8, 10).zone, 'yellow')
assert.equal(timingZone(601, 8, 10).zone, 'red')
assert.equal(timingZone(100, null, null).zone, 'unknown')
assert.equal(timingZone(100, 8, 5).zone, 'inconsistent')
assert.equal(timingZone(500, 8, null).zone, 'unknown')
act('start', 'a', start + 12 * 60000)
const started = live
assert.equal(live.activeId, 'a')
assert.throws(
  () =>
    transitionLive(
      live,
      { id: randomUUID(), revision: 0, type: 'start', eventId: 'b' },
      state,
      source,
      u,
      start + 1000,
    ),
  /changed/,
)
assert.throws(
  () =>
    transitionLive(
      live,
      {
        id: randomUUID(),
        revision: live.revision,
        type: 'start',
        eventId: 'b',
      },
      state,
      source,
      u,
      start + 1000,
    ),
  /active/,
)
const request = {
  id: randomUUID(),
  revision: live.revision,
  type: 'advance',
  eventId: 'b',
}
live = transitionLive(live, request, state, source, u, start + 20 * 60000)
assert.equal(live.blocks.a.endedAt, live.blocks.b.startedAt)
assert.equal(live.blocks.a.status, 'completed')
assert.equal(liveMetrics(live, start + 21 * 60000).budgetSeconds, -120)
assert.equal(liveMetrics(live, start + 21 * 60000).scheduleSeconds, 600)
assert.equal(
  transitionLive(live, request, state, source, u, start + 30 * 60000),
  live,
  'retry is idempotent',
)
act('finish', 'b', start + 27 * 60000)
let m = liveMetrics(live, start + 27 * 60000)
assert.equal(m.budgetSeconds, -300)
assert.equal(m.scheduleSeconds, 420)
act('start', 'lunch', start + 180 * 60000)
act('finish', 'lunch', start + 210 * 60000)
assert.equal(
  liveMetrics(live, start + 210 * 60000).budgetSeconds,
  -300,
  'Lunch excluded from shot budget',
)
act('correct', 'b', start + 220 * 60000, {
  endMinute: 570,
  reason: 'AD corrected missed finish',
})
assert.equal(live.blocks.b.endMinute, 570)
act('undo', null, start + 221 * 60000)
assert.equal(live.blocks.b.endMinute, 567)
assert(live.audit.some((x) => x.reason === 'AD corrected missed finish'))
assert.throws(() =>
  transitionLive(
    live,
    {
      id: randomUUID(),
      revision: live.revision,
      type: 'finish',
      eventId: 'a',
    },
    state,
    source,
    u,
    start + 1000,
  ),
)
assert.equal(clockInstant(540, state.meta, start), start)
assert.throws(
  () =>
    clockInstant(
      90,
      { date: '2026-11-01', zone: 'America/Los_Angeles' },
      start,
    ),
  /twice/,
)
const restored = JSON.parse(JSON.stringify(started))
assert.equal(liveMetrics(restored, start + 20 * 60000).elapsedSeconds, 480)
console.log(
  'Separate DP estimate/allotment; exact threshold boundaries/missing/inconsistent budgets; server-clock elapsed; atomic advance/finish; late-start vs budget recovery; Lunch/gaps; correction audit/undo; duplicate retry; stale concurrent action denial; DST ambiguity and refresh reconstruction passed.',
)
