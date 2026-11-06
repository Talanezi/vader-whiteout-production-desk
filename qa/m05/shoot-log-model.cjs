const assert = require('assert/strict'),
  { randomUUID } = require('crypto'),
  {
    transitionLive,
    emptyLive,
    ledgerMetrics,
  } = require('/tmp/m032/runtime/server-dist/flows/live')
const s = {
  meta: {
    date: '2026-11-08',
    zone: 'America/Los_Angeles',
    listId: 'list',
    filmingStart: 540,
  },
  events: {},
  instructions: {},
}
for (const [i, id] of ['a', 'b', 'c', 'd'].entries())
  s.events[id] = {
    id,
    type: 'shot',
    order: i,
    timing: 'sequence',
    sourceListId: 'list',
    shotId: id,
    allottedMinutes: 10,
  }
const source = {
    scenes: { scene: { number: '10' } },
    shots: Object.fromEntries(
      ['a', 'b', 'c', 'd'].map((id) => [
        id,
        {
          id,
          sceneId: 'scene',
          number: id.toUpperCase(),
          estimatedMinutes: 8,
        },
      ]),
    ),
  },
  user = { id: 103, name: 'AD' },
  now = Date.parse('2026-11-08T22:00:00Z')
let live = emptyLive()
const metrics = () =>
  ledgerMetrics({ ...s, meta: { ...s.meta, liveState: live } }, source)
function stamp(id, minute, extra = {}) {
  const prior = live.blocks[id]
  const p = {
    id: randomUUID(),
    revision: live.revision,
    type: 'stamp',
    field: 'start',
    eventId: id,
    minute,
    expectedStartedAt: prior?.startedAt ?? null,
    expectedEndedAt: prior?.endedAt ?? null,
    ...extra,
  }
  live = transitionLive(live, p, s, source, user, now)
  return p
}
assert.equal(metrics().scheduleSeconds, null)
assert.equal(metrics().budgetSeconds, null)
assert.equal(metrics().recorded, 0)
stamp('c', 571)
stamp('a', 544)
assert.equal(metrics().rows[0].seconds, null, 'missing B is not bridged')
assert.equal(metrics().review, 1)
stamp('b', 558)
stamp('d', 584)
assert.equal(metrics().rows[0].seconds, 14 * 60)
assert.equal(metrics().rows[0].kind, 'Start-to-start')
assert.equal(metrics().rows[0].performance.zone, 'red')
stamp('a', 552, { field: 'end' })
let m = metrics()
assert.equal(m.rows[0].seconds, 480)
assert.equal(m.rows[0].kind, 'Confirmed block')
assert.equal(m.rows[0].performance.zone, 'green')
assert.equal(m.budgetSeconds, 240)
assert.equal(m.scheduleSeconds, 840)
assert.equal(m.inferred, 2)
assert.equal(m.confirmed, 1)
const beforeC = live.blocks.c.startedAt
stamp('c', 568)
assert.equal(
  live.audit[live.audit.length - 1].before.blocks.c.startedAt,
  beforeC,
)
assert.equal(live.audit[live.audit.length - 1].after.c.startMinute, 568)
const oldB = live.blocks.b.startedAt
stamp('b', null)
assert.equal(metrics().review, 1)
live = transitionLive(
  live,
  {
    id: randomUUID(),
    revision: live.revision,
    type: 'skip',
    eventId: 'b',
  },
  s,
  source,
  user,
  now,
)
assert.equal(live.blocks.b.startedAt, undefined)
assert.equal(live.blocks.b.status, 'skipped')
stamp('b', 558)
assert.equal(live.blocks.b.status, 'recorded')
assert.equal(
  live.activeId,
  null,
  'ledger stamps do not create a stopwatch',
)
const retry = stamp('d', 584)
assert.equal(transitionLive(live, retry, s, source, user, now), live)
assert.throws(
  () => stamp('b', 557, { expectedStartedAt: oldB - 1 }),
  /changed while/,
)
const guarded = stamp('d', 585, { revision: 0 })
assert.equal(
  live.blocks.d.startMinute,
  585,
  'unrelated stale revisions can merge with matching entry preconditions',
)
const lunch = {
  id: 'lunch',
  type: 'milestone',
  category: 'Lunch',
  description: 'Lunch',
  order: 1.5,
  timing: 'anchor',
  clockStart: 570,
  duration: 30,
}
s.events.lunch = lunch
m = metrics()
assert.equal(
  m.rows.find((r) => r.event.id === 'b').seconds,
  null,
  'unrecorded Lunch is not attributed to B',
)
stamp('lunch', 575)
m = metrics()
assert.equal(m.rows.find((r) => r.event.id === 'b').seconds, 17 * 60)
assert.equal(
  m.rows.find((r) => r.event.id === 'lunch').performance.label,
  'Review timestamps',
  'inconsistent actual chronology is flagged, not fabricated',
)
delete s.events.lunch
let midnight = emptyLive()
for (const [id, minute] of [
  ['a', 1430],
  ['b', 1450],
])
  midnight = transitionLive(
    midnight,
    {
      id: randomUUID(),
      revision: midnight.revision,
      type: 'stamp',
      eventId: id,
      field: 'start',
      minute,
      expectedStartedAt: null,
      expectedEndedAt: null,
    },
    s,
    source,
    user,
    now,
  )
const night = ledgerMetrics(
  { ...s, meta: { ...s.meta, liveState: midnight } },
  source,
)
assert.equal(night.rows[0].seconds, 1200)
assert.equal(midnight.blocks.b.startMinute, 1450)
const missing = structuredClone(source)
missing.shots.a.estimatedMinutes = ''
const no = ledgerMetrics(
  { ...s, meta: { ...s.meta, liveState: midnight } },
  missing,
)
assert.notEqual(no.rows[0].performance.zone, 'green')
console.log(
  'Shoot Log model: empty/uncomputed state, out-of-order C before B, backfill, recalculation, confirmed versus inferred duration, gaps/Lunch, separate budget/clock variance, corrections with before/after audit, clear/skip/revisit, no running timer, idempotence, row-level guarded concurrency, inconsistent chronology, missing thresholds and midnight passed.',
)
