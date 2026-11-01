import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  inspectWorkbook,
  importPayload,
  mapRows,
  scheduleSheets,
} from '../../client/src/lib/shotImport'
const runtime = process.env.M03_RUNTIME || '/tmp/m032/runtime',
  state = JSON.parse(
    fs.readFileSync(path.join(runtime, 'local-state.json'), 'utf8'),
  ),
  out = path.resolve('client/qa/m032/artifacts')
assert.equal(new URL(state.api).hostname, '127.0.0.1')
const headers = {
  Authorization: 'Bearer ' + state.tokens[101],
  'Content-Type': 'application/json',
}
async function api(route: string, body?: unknown) {
  const r = await fetch(state.api + '/shotlists' + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  assert.ok(r.ok, await r.clone().text())
  return r.json()
}
async function main() {
  const input = fs.readFileSync(
      process.env.M03_WORKBOOK ||
        '/Users/thameralanezi/Downloads/Shot List - Vader_ Whiteout.xlsx',
    ),
    p = inspectWorkbook(input),
    initial = p.sheets
      .filter((s) => s.kind === 'scene')
      .flatMap((s) => s.rows)
      .filter((r) => !r.reviewed).length,
    corrections: { sheet: string; field: string; interpretation: string }[] = []
  // This is a controlled local interpretation profile, never approval of live production data.
  for (const sheet of p.sheets.filter((s) => s.kind === 'scene')) {
    for (const field of ['scriptSeconds', 'setupMinutes', 'estimatedMinutes'])
      if (sheet.units[field] === 'review') {
        const unit = field === 'scriptSeconds' ? 'seconds' : 'minutes'
        sheet.units[field] = unit
        if (field === 'scriptSeconds') sheet.scriptUnit = unit
        corrections.push({ sheet: sheet.name, field, interpretation: unit })
      }
    sheet.rows = mapRows(sheet)
    for (const row of sheet.rows) {
      if (!row.values.number?.trim()) {
        row.values.number = `UNLABELED-${sheet.sceneNumber}-ROW-${row.row}-QA`
        corrections.push({
          sheet: sheet.name,
          field: 'number',
          interpretation: `Explicit QA placeholder for missing source ID at row ${row.row}; raw source stays blank.`,
        })
      }
      row.reviewed = true
      row.include = true
    }
  }
  const payload = importPayload(p, crypto.randomUUID()),
    expected = payload.scenes.flatMap((s) => s.shots)
  assert.equal(expected.length, 129)
  const list = await api('', {
      name: 'Original workbook · 129 reviewed display labels · local QA',
    }),
    result = await api('/' + list.id + '/import', payload)
  assert.equal(result.shots, 129)
  const retry = await api('/' + list.id + '/import', payload)
  assert.deepEqual(result, retry)
  const actual = Object.values(
      (await api('/' + list.id + '/export')).shots,
    ) as Record<string, string>[],
    comparisons = []
  assert.equal(actual.length, 129)
  for (const row of expected) {
    const saved = actual.find((s) => s.source === row.source)
    assert.ok(saved)
    const source = JSON.parse(row.source),
      compared: string[] = []
    for (const [field, value] of Object.entries(row)) {
      assert.equal(
        saved[field],
        value,
        `${source.sheet} row ${source.row}: ${field}`,
      )
      compared.push(field)
    }
    comparisons.push({
      sheet: source.sheet,
      row: source.row,
      shot: row.number,
      fields: compared,
      allEqual: true,
      sourceSha256: createHash('sha256').update(row.source).digest('hex'),
    })
  }
  fs.writeFileSync(path.join(runtime,'completion-workbook-list.json'),JSON.stringify(list))
  fs.writeFileSync(path.join(out,'completion-workbook-source.json'),JSON.stringify({pass:true,sourceSha256:createHash('sha256').update(input).digest('hex'),shots:actual.length,corrections,comparisons},null,2))
  console.log('PASS fresh original workbook: all 129 source rows and fields match saved authoritative data; existing fixture retained')
}
main().catch(e=>{console.error(e);process.exitCode=1})
