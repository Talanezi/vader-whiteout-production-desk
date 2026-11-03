const assert = require('node:assert/strict'),
  {
    resolveSchedule,
    canonicalLabel,
    parseClock,
    clockText,
  } = require('/tmp/m032/runtime/server-dist/flows/scheduling')
const state = {
  meta: {
    name: 'Set schedule',
    date: '2026-11-12',
    zone: 'America/Los_Angeles',
  },
  events: {},
  instructions: {},
  departments: { sound: { id: 'sound', name: 'Sound', order: 1 } },
  comments: {},
  imports: {},
}
const source = { shots: {}, scenes: { s: { number: '9' } } }
for (const [i, n] of [20, 15, 25, 10].entries()) {
  source.shots['s' + i] = {
    id: 's' + i,
    number: String.fromCharCode(65 + i),
    sceneId: 's',
    estimatedMinutes: n,
  }
  state.events['e' + i] = {
    id: 'e' + i,
    type: 'shot',
    shotId: 's' + i,
    sourceListId: 'list',
    order: i,
    start: null,
    timing: i ? 'sequence' : 'anchor',
    clockStart: i ? null : 540,
    duration: null,
    description: '',
  }
}
state.meta.listId = 'list'
let r = resolveSchedule(state, source)
assert.deepEqual(
  r.events.map((e) => e.minute),
  [540, 560, 575, 600],
)
source.shots.s1.estimatedMinutes = 10
r = resolveSchedule(state, source)
assert.deepEqual(
  r.events.map((e) => e.minute),
  [540, 560, 570, 595],
)
state.events.e1.duration = 30
r = resolveSchedule(state, source)
assert.equal(r.events[2].minute, 590)
assert.equal(source.shots.s1.estimatedMinutes, 10)
state.events.lunch = {
  id: 'lunch',
  type: 'milestone',
  description: 'Lunch',
  order: 1.5,
  timing: 'anchor',
  clockStart: 570,
  duration: 30,
  fixed: true,
}
r = resolveSchedule(state, source)
assert(
  r.conflicts.some((c) => c.eventId === 'e1' && c.anchorId === 'lunch'),
)
assert.equal(r.events.find((e) => e.id === 'e2').minute, 600)
assert.equal(r.events.find((e) => e.id === 'lunch').minute, 570)
state.instructions['e0:sound'] = {
  id: 'e0:sound',
  eventId: 'e0',
  departmentId: 'sound',
  text: 'Prepare sound',
  timing: 'relative',
  offsetMinutes: 10,
  duration: 5,
}
state.events.hmu = {
  id: 'hmu',
  type: 'department',
  order: 20,
  timing: 'anchor',
  clockStart: 500,
  duration: 10,
}
r = resolveSchedule(state, source)
assert.equal(r.instructions[0].minute, 550)
state.events.e0.clockStart = 560
r = resolveSchedule(state, source)
assert.equal(r.instructions[0].minute, 570)
assert.equal(r.events.find((e) => e.id === 'hmu').minute, 500)
state.events.e0.clockStart = 1410
delete state.events.lunch
state.events.e1.duration = null
r = resolveSchedule(state, source)
assert.deepEqual(
  r.events.slice(0, 4).map((e) => e.minute),
  [1410, 1430, 1440, 1465],
)
assert.equal(clockText(1465), '12:25 AM')
source.shots.s1.estimatedMinutes = ''
r = resolveSchedule(state, source)
assert.equal(r.events[2].minute, null)
assert.equal(r.events[3].minute, null)
state.events.e0.timing = 'relative'
state.events.e0.dependsOn = 'e1'
state.events.e1.timing = 'relative'
state.events.e1.dependsOn = 'e0'
assert.throws(() => resolveSchedule(state, source), /cycle/)
assert.equal(canonicalLabel('k', '9'), '09-K')
assert.equal(canonicalLabel('AA', '9'), '09-AA')
assert.equal(canonicalLabel('19-1.2', '19'), '19-1.2')
assert.equal(canonicalLabel('b', '123'), '123-B')
assert.equal(parseClock('12:45 am'), 45)
assert.equal(parseClock('9 pm'), 1260)
assert.throws(() => parseClock('13:00 PM'))
const legacy = {
  ...state,
  events: {
    old: {
      id: 'old',
      order: 1,
      type: 'custom',
      start: '2026-11-12T17:00:00Z',
      duration: 20,
    },
  },
}
assert.equal(resolveSchedule(legacy, null).events[0].minute, 540)
assert.equal(legacy.events.old.start, '2026-11-12T17:00:00Z')
const reordered = {
  ...state,
  meta: { ...state.meta, filmingStart: 540 },
  events: {
    a: {
      id: 'a',
      type: 'custom',
      order: 1,
      timing: 'sequence',
      duration: 20,
    },
    b: {
      id: 'b',
      type: 'custom',
      order: 0,
      timing: 'sequence',
      duration: 15,
    },
  },
  instructions: {},
}
assert.deepEqual(
  resolveSchedule(reordered, null).events.map((e) => e.minute),
  [540, 555],
)
reordered.events.a.order = -1
assert.deepEqual(
  resolveSchedule(reordered, null).events.map((e) => e.minute),
  [540, 560],
)
console.log(
  'Set-clock sequence, changed source estimates, day override, anchored Lunch/conflict, relative/independent department work, unknown durations, midnight, cycle rejection, canonical labels and non-mutating legacy compatibility passed.',
)
