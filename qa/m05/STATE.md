# M05 execution checkpoint

Branch ui/m05-flow-of-the-day; baseline main c8f8593d (M04 owner accepted).
Checkpoint commit 10aa5d91 plus current preserved changes. No deployment yet.

Integrated: Flow index and four creation paths; canonical Shot List UUID link;
shared Yjs event/department/instruction/comment model; Department Flow, keyboard
and TSV editing, selected actions/recoverable delete, dedicated drag handles,
Shot Rail, timed move previews, Time Map and explicit shift, department layout,
real M04 discussions, recoverable revision preview/restore, source-faithful Excel
review, private original storage, measured direct PDF/actual PDF.js Print Studio
and immutable authenticated print artifacts. Reused accepted app components.
Native Y.Text is created with new/imported content, avoiding concurrent lazy
conversion. Imports now stage a bounded CRDT delta before private upload/apply.

Passing evidence in /tmp/m05: contract-final.log, security.log, print.log,
browser-webkit.log, journeys-webkit.log, drag-webkit.log, drag-chromium.log,
m03-regression.log. Chromium browser/journeys passed before the last narrowly
scoped staged-import/selection changes and should be refreshed. WebKit passed
matrix, comments, actual PDF/download bytes, history, 100/125/150/200% CSS zoom,
tablet/mobile, actual creation/import/TSV/delete/restore/reconnect and pointer
row/rail/timeline dragging. Do not confuse CSS zoom with native Chrome zoom or
physical iPad testing. Real workbook: 62 events/52 instructions/zero unmapped
populated data cells; file retained exactly through local private storage.
Print: 310 events, ten departments, 3,100 markers; all four papers/two styles,
long-row continuation and deterministic bytes. Actual real-workbook Tabloid and
Letter pages rendered and visually inspected. No overlap/clipping observed.

Fresh production read-only baseline at /tmp/m05/production-before.json:
4 Storyboards,83 assets,1 Shot List/15 active shots,7 Call Sheets,26 roster.
The newer Scene16 and artwork were created by owner creator2 at 16:41–16:43 UTC,
before this M05 session; see production-origin.json. This explains the older
3/71 baseline discrepancy; no records were altered to reconcile it.

Remaining: finish final diff review, targeted remaining shift/source checks,
final build and relevant regression refresh; copy evidence/report; commit/push
validated source, normal integration to main, Railway deployment + additive
migration + health; fresh qa/release.cjs site publication; commit/push website;
confirm Pages hashes and authenticated read-only live Flow index (no production
Flow test records), unchanged before/after existing-data hashes and R2 health.
Existing IAB authenticated production tab handle live (id3) is available through
cua_repl. Railway read-only wrapper /tmp/m05/read-production.py works with raw
command argument (do not shell-quote the whole argv command twice).
Do not declare completed/deployed based on this checkpoint. Do not begin M06.
