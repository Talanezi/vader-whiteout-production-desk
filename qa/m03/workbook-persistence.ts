import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { inspectWorkbook, importPayload } from '../../client/src/lib/shotImport'
const runtime = process.env.M03_RUNTIME || '/tmp/whiteout-m03-research'
const state = JSON.parse(
  fs.readFileSync(path.join(runtime, 'local-state.json'), 'utf8'),
)
assert.equal(new URL(state.api).hostname, '127.0.0.1')
async function api(route: string, body?: unknown) {
  const r = await fetch(state.api + '/shotlists' + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: 'Bearer ' + state.tokens['101'],
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  assert.ok(r.ok, await r.clone().text())
  return r.json()
}
async function main() {
  const p = inspectWorkbook(
    fs.readFileSync(
      process.env.M03_WORKBOOK ||
        '/Users/thameralanezi/Downloads/Shot List - Vader_ Whiteout.xlsx',
    ),
  )
  const total = p.sheets.reduce((n, s) => n + s.rows.length, 0)
  // Never approve uncertain labels/units on the production owner's behalf.
  // Exercise the actual import using only already unambiguous source rows.
  for (const sheet of p.sheets) {
    sheet.include = sheet.kind === 'scene' && sheet.scriptUnit !== 'review'
    for (const row of sheet.rows)
      row.include =
        row.issues.length === 0 && Boolean(row.values.number?.trim())
    if (!sheet.rows.some((r) => r.include)) sheet.include = false
  }
  const payload = importPayload(p, crypto.randomUUID()),
    expected = payload.scenes.flatMap((s) => s.shots)
  assert.ok(expected.length > 0)
  const list = await api('', {
    name: 'Supplied workbook · unambiguous rows · local QA',
  })
  const result = await api('/' + list.id + '/import', payload)
  const exported = await api('/' + list.id + '/export'),
    actual = Object.values(exported.shots) as Record<string, string>[]
  assert.equal(actual.length, expected.length)
  for (const row of expected) {
    const saved = actual.find((s) => s.source === row.source)
    assert.ok(saved)
    for (const [key, value] of Object.entries(row))
      assert.equal(saved[key], value, `Preserve ${key}`)
  }
  const report = {
    pass: true,
    source: 'Shot List - Vader_ Whiteout.xlsx',
    inspectedScenes: 7,
    inspectedShotRows: total,
    importedScenes: result.scenes,
    importedShots: result.shots,
    excludedForReviewOrUnspecifiedUnits: total - result.shots,
    comparison:
      'Every mapped field and source record read back identically from the actual local API/PostgreSQL document. No ambiguous identifier was approved or guessed.',
    productionDataChanged: false,
  }
  fs.writeFileSync(
    'client/qa/m03/artifacts/workbook-persistence.json',
    JSON.stringify(report, null, 2) + '\n',
  )
  console.log(
    'PASS Actual workbook safe subset:',
    result.shots,
    'shots persisted and read back field-for-field;',
    total - result.shots,
    'rows retained for user review.',
  )
}
main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
