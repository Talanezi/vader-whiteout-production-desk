# M05 — Flow of the Day

M03 and M04 remain the accepted preservation baseline. M05 is implemented and
locally acceptance-tested; owner acceptance is a separate decision. Final deployed
revisions/status and live evidence are recorded in the local evidence gallery's
RELEASE.md/RELEASE.json after publication.

## Delivered workspace

- Established document index, full-row links, title search, production-date/title/
  modified sorting, rename, duplicate for another day, recoverable delete, author/
  status/revision metadata; original code-based Flow illustration and fourth Create
  destination. Existing Create/Metal interaction remains intact.
- Creation from the real Shot List with scene/subject search, technical context,
  selection, daily sequence review and optional filming start; Excel import,
  previous-day copy, or blank. A blank Flow can connect without scheduling shots.
  Copies receive new Flow/event/department UUIDs and reset date, actuals and issued
  status unless a new date is explicitly chosen.
- Department Flow pins Time/Current Action and repeats headers. Direct shared text
  editing uses existing M03 CodeMirror/Yjs, Tab/Enter/Escape navigation, TSV paste,
  undo/redo, selection, copy, duplicate, recoverable delete and handle-only dragging.
  Milestones, independent department activities and custom categories/notes are
  distinct. Shared milestones retain per-department instructions.
- Shared department names/personnel/groups/order, add/remove/restore with preserved
  instructions; personal visibility/width preferences are separate and user-scoped.
  Print scope is independently configured.
- Connected Shot Rail uses canonical M03 UUIDs and live fields; scheduled/available
  groups, scene/subject search, contextual technical editing through actual M03
  validation/collaboration, optional linked Storyboard context and real row drops.
  A repeated shot creates a new occurrence, never another source shot. Missing
  sources retain events; deliberate relinking/disconnect preserves schedule and
  historical identity. Daily order never changes master order.
- Time Map shares the exact events, with lanes, overlapping tracks, selection,
  zoom/pan, move/resize previews and navigation to Department Flow. Moving preserves
  estimate inheritance; resizing is an explicit day override. Shift previews keep
  fixed milestones anchored and are one undoable operation.
- Named production-local time display uses stored instants; DST gaps are rejected
  and folds require a choice. Unknown times/durations remain unknown; cross-midnight
  uses explicit calendar dates. Actual start/complete are intentional actions or
  manual corrections. Opening a document does not manufacture actuals.
- Existing M04 discussions provide comments/replies/resolution and active indicators.
  Presence, reconnection, unsaved navigation protection and persisted digest ACKs
  govern Saved state. Actual recoverable revision snapshots support preview and
  non-destructive restore, preserving the replaced state as another revision.

## Authority, persistence and security

Four additive tables: flow_documents, flow_revisions, flow_sources and flow_prints.
Yjs owns Flow metadata/departments/events/instructions/comments/import provenance;
SQL owns durable document identity/archive, revision states and immutable artifacts.
M03 alone owns technical shots. Flow stores permanent references, daily timing,
notes/instructions and historical labels. It does not contain a second shot database.

HTTP/WebSocket access reuses current Scheduler verification and the existing eligible
verified Production Desk collaborator policy. No role-only authorization, ID allowlist,
per-document invitations, mock login or public workbook URL exists. Origin checks,
periodic revocation rechecks, one-replica collaboration leases, bounded candidate-state
validation and ordered update application are retained/enforced. Native shared text
is created with events/imports, avoiding competing lazy text conversion.

Original XLSX files use the existing private R2/S3 adapter and namespace. Files are
bounded to 12 MB/60 MB declared expanded ZIP content, fewer than 2,500 source rows/100 columns
and 2,000 archive entries. Macro-enabled workbooks are rejected; formulas are not executed. Imports stage
an atomic delta below the existing 2 MiB transport bound before original preservation
and apply. Bad input never silently truncates the schedule. See qa/m05/WORKBOOK.md.

## Print Studio

Three products: Master Departmental Flow, Department Focus (shared milestones retained),
and clearly labeled condensed Daily Rundown. Letter/A4/Tabloid/A3, landscape/portrait,
Editorial Color/Production Monochrome, explicit department/personnel/notes/actual scope.

The direct pdf-lib renderer reuses M03's embedded DejaVu font, Unicode shaping and
measured wrapping. It computes column groups, common event boundaries across horizontal
sections, wrapped row heights, repeated headers, page footers and deliberate continuation.
Body text stays8.5pt; additional pages replace illegible shrinking. A60000-cell/2000-page
safety limit produces an actionable error rather than clipping. Unsupported glyphs are
rejected explicitly. M03 and Call Sheet renderers are unchanged.

PDF.js previews the actual immutable bytes used for download/printing. Downloads are
available only for the current settings and successfully rendered artifact. Server-side
snapshot/source/settings records and authenticated historical artifact retrieval prevent
historical links from silently serving a new schedule. No email-sent claim or M06 system
was introduced.

## Verification

- Chromium and WebKit actual matrix, timing, direct editing, selection, TSV paste,
  comments, real XLSX mapping/import/reload, deletion/cancel/restore, offline/reconnect,
  actual PDF preview/download equality, revision preview, index/search and responsive
  layouts;100/125/150/200% CSS scaling checked. Native hardware zoom is not inferred.
- Real pointer row moves, rail insertion including an empty Flow, timeline resize,
  source technical write, live missing-source state, single-shot relink/disconnect;
  source order/technical data remain unchanged by schedule operations.
- Two authorized collaborative clients, character-level shared text, independent
  instructions, inheritance/override, reload, real revision preview/restore and undo.
  Unverified HTTP/WS, bad origin, invalid duration updates and unauthorized private
  source/print reads are rejected. Immutable artifact bytes survive later edits.
- Actual workbook:223 nonempty cells,62 operational records,52 instructions, nine
  departments/personnel, no unmapped populated data cells; raw values/mappings retained
  and private original byte equality verified.
- Four-paper/eight color-style print matrix over310 events/ten departments, all3100
  instruction markers, long-row continuation, unknown/cross-midnight timing, small
  Flow, Department Focus/Rundown and deterministic bytes. Actual PDF pages rendered
  and inspected, including horizontal Letter sections and full Tabloid master.
- Actual M03 PDF preview/download byte equality and normal Call Sheets/Roster indexes;
  the unchanged Call Sheet LaTeX renderer compiled a disposable local PDF successfully.
- Final isolated frontend/backend TypeScript/production builds pass. Existing large
  PDF.js chunk advisory remains; no build/type error or known release-blocking defect.

Scripts and reproducible local review: qa/m05/README.md. Screenshots/PDFs/results are
in Git-ignored client/qa/m032/artifacts/m05/; the original workbook is not committed.

## Release boundaries and limitations

Production smoke is read-only. No workbook import, test Flow, document deletion or
source edit is performed in production. The fresh baseline is4 Storyboards/83 assets,
1 Shot List/15 active shots,7 Call Sheets and26 roster entries. The newer Scene16 and
assets were created by owner2 before this M05 session, explaining the older3/71 record.
Compare all existing-data hashes before/after the additive release.

Physical iPad/Pencil, hardware keyboard/trackpad combinations and printer hardware
remain owner acceptance checks; desktop Chromium/WebKit and viewport QA do not establish
physical-device behavior. With no production Flow seeded, authenticated live acceptance
covers the index/creation surfaces and existing apps; edit/import/print/collaboration
journeys use the actual local backend and disposable records. R2 production health and
existing private media are checked without writing test content.

Source push alone is not publication. Follow RELEASING.md: main source release/Railway,
additive migration, fresh production /productiondesk/ bundle, scoped website commit/push,
Pages asset-hash verification and authenticated live smoke. Do not begin M06.


## Final owner corrective contract

The subsequent comprehensive correction is tracked in
[CORRECTIVE-ACCEPTANCE.md](qa/m05/CORRECTIVE-ACCEPTANCE.md), including every
Section 41 requirement, precise verification boundaries, and runnable evidence.
The implementation replaces the initial timezone/report/status-led presentation
with the owner-approved set-local production-day model, direct department editing,
shared authoritative estimates and compact continuous Print Studio. The original
measured PDF engine, Shot Lists architecture, Storyboards drawing engine and private
original artwork are preserved. No new package or destructive migration is needed.

The source branch is `ui/m05-final-corrections`, based on `9dfcf415`. Scheduler's
paired trusted-membership correction is `4d44206`. Final source/site revisions,
Railway status, served bundle verification and read-only production hashes are
recorded in the release evidence after publication and in the final owner report.
No owner acceptance is claimed.
