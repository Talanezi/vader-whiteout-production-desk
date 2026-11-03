# M05 corrective acceptance evidence

This is the owner's final corrective contract, implemented on top of `9dfcf415`.
It does not replace or repeat the initial M05 implementation. The authoritative
requirement text remains in `CORRECTIONS.md`. Owner acceptance is reserved.

## Verification boundaries

All edit, import, restore, deletion, source-estimate, packaging and collaboration
checks use disposable loopback records, the real HTTP/WebSocket backend and local
private storage. The production smoke is read-only. No production test content is
created. Physical iPad/Pencil, printer hardware, and Sardor's own logged-in session
are unavailable; desktop WebKit and touch-sized layouts are not physical-device
verification. Zoom checks use 100/125/150/200% equivalent CSS viewports.

Evidence directory: `client/qa/m032/artifacts/m05/corrections/` (Git ignored).
Source test scripts live alongside this document. Build/runtime dependencies remain
isolated under `/tmp/m032/runtime`; no tracked compiled bundle or dependency tree
is used for release. Fresh publication uses `qa/release.cjs`.

## Test evidence keys

- **B** `corrective-browser.cjs`, Chromium + WebKit: real 60-shot creation,
  preselection, draft preview, pointer reorder, shared-estimate durable ACK,
  header/personnel editing, relative task, Time Map width, continuous actual-PDF
  first/last page and PDF/ZIP downloads.
- **I** `corrective-interactions.cjs`, Chromium + WebKit: actual clock/calendar,
  exact 9:00/9:20/9:35/10:00 sequence, fixed Lunch conflict/cancel/resolution,
  day override, shared column dragging, resize, presets, split/group, source-unknown,
  reload, checkbox geometry at four zoom-equivalent viewports.
- **S** `scheduling-corrections.cjs`: same compiled shared engine used by browser/PDF;
  root start/reorder, estimates, override, fixed conflict, relative/independent work,
  unknowns, midnight, cycles, legacy nonmutation. `labels-corrections.cjs` covers
  canonical labels, uniqueness, AA, prefix validation, original references and UUIDs.
- **W** `corrective-import.cjs`: actual original XLSX import UI, explicit mapping,
  62 events/52 instructions/nine original headings/personnel, exact original bytes,
  reload/offline recovery. `workbook-pdf.cjs` preserves source across four paper sizes.
- **H** `history-corrections.cjs`: real local PostgreSQL and controlled clock;
  five-minute checkpoint, no idle/concurrent duplicate, two clients, safe restore,
  metadata-only generated export records. No production clock manipulation.
- **P** `print.cjs`: eight paper/style configurations, 310 events/3,100 instruction
  markers, long-row continuation, small schedule, midnight/unknown, Focus/Rundown,
  deterministic bytes. Actual Poppler PNGs visually inspected. `pack-corrections.cjs`:
  subset ZIP CRC/names, consistent snapshot during edit, portrait PDFs, invalid
  scopes, cancellation/retry, file-count/32MB bounds. No new PDF runtime added.
- **A** `permissions-corrections.cjs`: Director, 1st/2nd AD, DP, Camera Operator,
  Storyboard Artist, Costume Designer and Actor verified access across five HTTP
  areas and three collaboration services; foreign/unverified/revoked/anonymous
  denied; active socket revoked by actual recheck; profile changes do not erase
  approved identity. Actual Scheduler membership code is used by local authority.
- **R** `connections.cjs`: actual empty-grid rail drop, shared Lens edit, source
  deletion/relink/disconnect preserving occurrence UUID and canonical historical
  reference. `qa/m04/regression.cjs`: M03 PDF preview/download byte equality,
  Call Sheets/Roster indexes. `callsheet.cjs`: unchanged LaTeX PDF.
  `qa/m04/from-shots.cjs`: two UUID-linked panels with unchanged M03 state.
  `qa/m04/export.cjs`: actual M04 preview/download parity and 1/2/4/6 layouts.
- **D** Release evidence records production data hashes, actual Railway revisions,
  served GitHub Pages bundle hashes and authenticated read-only UI smoke. It is
  written after publication; publication is never inferred from source push alone.

## Security and membership diagnosis

The real Director account was unverified in Scheduler's protected owner-admin
crew directory. The owner explicitly approved verifying that exact account; it
now shows Verified team member. No other accounts were granted access. Production
Desk accepts centrally verified identity for this production across all crew roles,
with matching account ID/email, verification timestamp and production identity.
Revocation/foreign production/unverified signup remain denied. Changing a signup
profile role cannot grant team membership. Production administration retains its
separate protected admin policy. No invitation per document, environment ID list,
SQL enrollment, production auth bypass or new credential is introduced.

## Scope and preservation

The measured direct Flow PDF renderer is retained; it now consumes the shared
set-clock result and clean print presentation. M03 PDF and M04 drawing/media
engines are unchanged. M04 changes are limited to the shared creation choice
presentation and canonical shot label display. No package/dependency changes,
new third-party code or license additions are required. The ZIP32 writer is
original bounded code. Existing source XLSX objects and historical PDF artifacts
remain intact; new generated Flow PDFs are temporary browser downloads with
small database metadata, not permanent R2 objects.

There is no production data migration in this correction. Legacy timezone/actual/
status/comment fields remain stored for compatibility and are not deleted. The
M05 surface uses set-local time and does not expose the old lifecycle/comment UI.

## Contract Section 41 — individual tracking

| Requirement | Status / evidence |
|---|---|
| Global Create | Implemented; B / I |
| Redundant New Flow | Implemented; B / I |
| Index row geometry | Implemented; B / I |
| Index metadata | Implemented; B / I |
| Index status | Implemented; B / I |
| Duplication | Implemented; B / I |
| Previous-day creation | Implemented; B / I |
| Creation interface | Implemented; B / I |
| Shoot date | Implemented; B / I |
| Timezone controls | Implemented; B / I / source audit |
| Set-local time | Implemented; S / I |
| Midnight | Implemented; S / I |
| Time picker | Implemented; B / I |
| Shot selection | Implemented; B / I |
| Shot order | Implemented; B / I |
| Up/Remove buttons | Implemented; B / I |
| Shot preview | Implemented; B / I |
| Canonical labels | Implemented; S / R |
| Duplicate labels | Implemented; S / R |
| Source UUIDs | Implemented; S / R |
| Automatic schedule | Implemented; S / I |
| Unknown duration | Implemented; S / I |
| Shared estimate | Implemented; S / I |
| Day-only override | Implemented; S / I |
| Fixed milestone | Implemented; S / I |
| Conflicts | Implemented; S / I |
| Shift Following dialog | Implemented; B / I |
| Relative department timing | Implemented; S / I |
| Independent tasks | Implemented; S / I |
| Department labels | Implemented; B / I / source audit |
| Talent default | Implemented; B / I / source audit |
| Camera/Grip/Electric | Implemented; B / I / source audit |
| Custom departments | Implemented; B / I / source audit |
| Personnel | Implemented; B / I |
| Column drag | Implemented; B / I |
| Column resize | Implemented; B / I |
| Column hide | Implemented; B / I |
| Layout presets | Implemented; B / I |
| Huge department modal | Implemented; B / I |
| Select All alignment | Implemented; B / I |
| Caret contrast | Implemented; B / I |
| Action separator dot | Implemented; B / I |
| Multiline editing | Implemented; B / I |
| Add activity | Implemented; B / I |
| Custom activity categories | Implemented; B / I |
| Start Now/Complete Now | Implemented; B / I |
| Event statuses | Implemented; B / I |
| Flow status lifecycle | Implemented; B / I |
| Event comments | Implemented; B / I |
| Time Map duration | Implemented; B / I / S |
| Time Map lanes | Implemented; B / I / S |
| Time Map source | Implemented; B / I / S |
| Time Map empty space | Implemented; B / I / S |
| Time Map toolbar | Implemented; B / I / S |
| Shot Rail | Implemented; B / I |
| Duplicate plus action | Implemented; B / I |
| Revisions | Implemented; H |
| Import | Implemented; W |
| PDF engine | Implemented; P / B |
| PDF header | Implemented; P / B |
| PDF branding | Implemented; P / B |
| PDF timezone | Implemented; P / B |
| PDF raw hash/status | Implemented; P / B |
| PDF time display | Implemented; P / B |
| PDF inherited label | Implemented; P / B |
| PDF unscheduled display | Implemented; P / B |
| PDF footer | Implemented; P / B |
| PDF milestone colors | Implemented; P / B |
| PDF column order | Implemented; P / B |
| Print preview | Implemented; P / B |
| Preview toolbar | Implemented; P / B |
| Print PDF | Implemented; P / B |
| Download PDF | Implemented; P / B |
| Department Focus | Implemented; P / B |
| Daily Rundown | Implemented; P / B |
| Department ZIP | Implemented; P / B |
| ZIP revision | Implemented; P / B |
| R2 usage | Implemented; P / B |
| Director access | Verified membership restored with explicit owner approval; local real HTTP/WS passes (A). Director-owned live login unavailable |
| 1st/2nd AD access | Implemented; A |
| DP/Camera/Storyboard access | Implemented; A |
| Other verified crew | Implemented; A |
| Cross-production security | Implemented; A |
| M03 regression | Implemented; R |
| M04 regression | Implemented; R |
| Production data integrity | Release verification recorded in D; verify before final handoff |
| Deployment | Release verification recorded in D; verify before final handoff |
| Owner acceptance | Reserved for owner; not claimed |
