# M05 local acceptance

All tests use disposable loopback data and the existing isolated M03/M04 fixture
infrastructure. No QA endpoint, token or login bypass is imported by the application.

Runtime: `/tmp/m032/runtime`, Node 22. Build with
`M03_RUNTIME=/tmp/m032/runtime node qa/m03/prepare.cjs`.
The existing `qa/m04/authority.cjs` and `qa/m04/local.cjs` serve local Scheduler
membership, PostgreSQL, private S3, API4314 and frontend5176. The additive Flow
migration is included in the existing migration runner. Never point these tests
at production.

Run from the source repository:

```sh
NODE_PATH=/tmp/m032/runtime/client/node_modules:/tmp/m032/runtime/server/node_modules node qa/m05/verify.cjs
node qa/m05/browser.cjs
node qa/m05/journeys.cjs
node qa/m05/drag.cjs
M05_BROWSER=webkit node qa/m05/browser.cjs
M05_BROWSER=webkit node qa/m05/journeys.cjs
M05_BROWSER=webkit node qa/m05/drag.cjs
node qa/m05/connections.cjs
node qa/m05/shift.cjs
node qa/m05/surfaces.cjs
node qa/m05/security.cjs
NODE_PATH=/tmp/m032/runtime/server/node_modules node qa/m05/print.cjs
node qa/m05/workbook-pdf.cjs
node qa/m05/callsheet.cjs
node qa/m04/regression.cjs
```

The actual supplied workbook remains in Downloads. Set `M05_WORKBOOK` for the
contract script if its location changes. The browser journey uses the original
user-supplied filename; it never uploads the workbook to production. Sheet1
contains 223 nonempty cells through row121 (A1:AB1032 includes empty formatting).
62 meaningful events and 52 department instructions are expected; no formulas
are present. Both source time columns require explicit mapping and clock review.

`/tmp/m05` holds results, actual PDFs and browser screenshots. The final evidence
is copied into the Git-ignored `client/qa/m032/artifacts/m05/` gallery. Capture
screenshots from actual authenticated local interactions; do not use production
records for edit, deletion, import, restore or drag tests.

The print test verifies all 3,100 instruction markers across 310 events and ten
departments, eight size/style combinations, continuation behavior and exact
byte determinism. Browser tests compare the actual downloaded PDF bytes with
the PDF response used for preview. Physical iPad/Pencil and printer hardware
are separate owner acceptance; desktop WebKit/touch emulation are not hardware tests.

## Final owner corrective pass

Use `CORRECTIONS.md` and `CORRECTIVE-ACCEPTANCE.md`. The original scripts above
record the first M05 release and may assert superseded timezone/status/actual-time
UI. Current corrective scripts are `scheduling-corrections.cjs`,
`labels-corrections.cjs`, `corrective-fixture.cjs`, `corrective-browser.cjs`,
`corrective-interactions.cjs`, `corrective-import.cjs`, `history-corrections.cjs`,
`pack-corrections.cjs`, `permissions-corrections.cjs` and the adjusted
`connections.cjs`. Start `qa/m05/authority.cjs` in place of the earlier M04
loopback authority to exercise the actual current Scheduler membership function.
It is never imported by deployable application code.
