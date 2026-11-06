process.env.NODE_PATH = '/tmp/m032/runtime/server/node_modules'
require('module').Module._initPaths()
const assert = require('assert/strict'),
  {
    AuthService,
  } = require('/tmp/m032/runtime/server-dist/auth/auth.service'),
  {
    collaborationError,
  } = require('/tmp/m032/runtime/server-dist/collaboration-error'),
  auth = new AuthService(),
  original = global.fetch
;(async () => {
  try {
    for (const status of [401, 403, 429, 500, 503]) {
      global.fetch = async () => new Response('{}', { status })
      await assert.rejects(
        auth.verifySchedulerToken('isolated-fixture'),
        (e) => {
          assert.equal(
            e.getStatus(),
            status === 401 || status === 403 ? 401 : 503,
          )
          assert.equal(
            collaborationError(e).code,
            status === 401 || status === 403 ? 4401 : 1013,
          )
          return true
        },
      )
    }
    global.fetch = async () => {
      throw TypeError('local network interruption')
    }
    await assert.rejects(
      auth.verifySchedulerToken('isolated-fixture'),
      (e) => e.getStatus() === 503,
    )
    global.fetch = async () =>
      new Response(
        JSON.stringify({
          userID: 103,
          email: 'fixture@example.invalid',
          name: 'QA AD',
          role: '1st Assistant Director',
        }),
      )
    assert.equal(
      (await auth.verifySchedulerToken('isolated-fixture')).userID,
      103,
    )
    console.log(
      'Scheduler 401/403 denies access; 429/5xx/network outages remain retryable 503/WS1013, never false session revocation; valid claims preserved.',
    )
  } finally {
    global.fetch = original
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
