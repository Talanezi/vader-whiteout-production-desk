const fs = require('node:fs'),
  path = require('node:path'),
  assert = require('node:assert/strict'),
  { randomUUID } = require('node:crypto')
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research'
async function seed(
  state = JSON.parse(fs.readFileSync(path.join(runtime, 'local-state.json'))),
) {
  assert.equal(new URL(state.api).hostname, '127.0.0.1')
  const headers = {
    Authorization: 'Bearer ' + state.tokens['101'],
    'Content-Type': 'application/json',
  }
  const response = await fetch(state.api + '/shotlists', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Whiteout · creative coverage' }),
  })
  assert.equal(response.status, 201)
  const list = await response.json()
  const imported = await fetch(
    state.api + '/shotlists/' + list.id + '/import',
    {
      method: 'POST',
      headers,
      body: JSON.stringify(require('./fixtures.cjs')(randomUUID())),
    },
  )
  assert.equal(imported.status, 201)
  fs.writeFileSync(
    path.join(runtime, 'preview-list.json'),
    JSON.stringify(list),
  )
  return list
}
module.exports = seed
if (require.main === module)
  seed()
    .then(() => console.log('Clean local coverage fixture ready for review.'))
    .catch((e) => {
      console.error(e)
      process.exitCode = 1
    })
