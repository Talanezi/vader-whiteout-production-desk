# Definitive M03 engineering review

This completes the definitive M03 specification in the existing implementation. It supersedes this file's earlier report-first/Focus description. Owner product acceptance remains pending. M04 is not included.

## Spreadsheet PDF and reference

Shot Lists now draw directly with **pdf-lib 1.17.1**, **@pdf-lib/fontkit 1.1.1**, embedded DejaVu Sans and **bidi-js 1.0.3**. The Shot List TeX compiler and narrative source generator are removed. Call Sheets retains its established LaTeX renderer unchanged.

The existing standalone Scene 05 proof, original workbook and measured Google Sheets reference were retained. Reference: 792×612 pt Letter landscape, roughly 33.5 pt side margins, approximately 4 pt body/6 pt metadata, 14 populated shots, 19 physical columns (17 named technical fields plus blank/X). Standalone proof retains all physical columns; the integrated authenticated endpoint prints all **14 shots / 17 named fields on one page**, at 4.2 pt. Full original long coverage is retained, including material clipped in the source reference. This is a measured compact spreadsheet replacement, not pixel parity: typeface/alignment, calculated row heights, small header and omitted empty trailing rows differ. The source workbook's duplicate numeric 5.1 is preserved rather than silently inventing 5.10.

GridCraft's actual layout, cell-drawing, PDF primitive, geometry/quadrant and print test sources informed explicit print ranges, cumulative rectangles, font measurement, repeated headers and page bands. No GridCraft source, Rust runtime or spreadsheet engine is distributed. Exact research commits/files are recorded in `qa/m03-completion/RESEARCH.md`.

Saved authoritative Yjs state → validated ordered shot/assignment UUID references and fields → measured cells → pagination → direct PDF drawing → actual PDF.js preview and download. Client-supplied shot contents are never authoritative. Rows and column headers are measured before drawing; tiled bands share heights and row breaks. Normal rows stay intact. Exceptional tall rows continue with identity and all text. Fit-width continues vertically; actual-size/readable modes deliberately tile columns with repeated shot identity. Field proportions follow the chosen widths. Unprintably narrow columns fail explicitly; oversized identity widths cannot create negative band widths. Only explicitly selected fields are rendered. One-line mode is opt-in, measured and labeled as truncated; wrapping is complete by default.

Letter, A4, A3 and Tabloid, both orientations, normal/narrow margins are supported. Dense technical fit uses reference-based 4.2 pt, 6 pt for intermediate widths, 8 pt for narrow tables; paper below the 4 pt bound is blocked with adjustments. This deliberately replaces the previous arbitrary 8 pt floor that prevented matching the supplied spreadsheet. Embedded supported international names/symbols, including mixed Latin/Arabic shaping and normalized extraction, were checked. Unsupported font characters fail clearly; DejaVu is not universal CJK/emoji coverage.

Original **129-shot** workbook through the actual import/saved-state path: six essential fields/wrapped = **6 pages**; all 21 selected technical fields/wrapped = **7 pages**; six essential fields/explicit one-line = **5 pages**. Five selected shots and a ten-row/four-field selected area each produce one page. Physical text bounds pass across 18 generated PDFs/36 pages. No historical workbook was imported into production. Actual PDFs were rendered and visually inspected (Scene 05, first/middle/last technical pages, narrow selections, Unicode and exceptional long text). Poppler physical-coordinate checks and field/content assertions supplement visual review, rather than replacing it.

## Print interaction

Download opens the stable settings/preview workspace and immediately requests the actual PDF. Settings debounce, obsolete response rejection, last-page retention, revision signatures/cache and genuine-error Retry are preserved. No Generate/Refresh step remains. Download uses exactly the displayed PDF bytes and is unavailable while settings/snapshot/preview are stale. Zoom/page navigation do not regenerate.

Entire Shot List, Current View/Current Scene, Selected Shots, rectangular Selected Area, Selected Scenes and Selected Shoot Day share one scope model. Existing selection/order is recognized. Unavailable scopes are disabled. Print-only Essentials/Cinematography/AD Planning/Full Technical/Custom columns and individual inclusion/order do not mutate grid preferences. Compact Table is default; Exact Grid exposes intentional bands. Obsolete expanded/report API layout values use the same direct grid, never the old narrative engine.

## Workspace and interface

- All Scenes is the default continuous workspace. Scene-rail clicks navigate to a scene without hiding the rest. Deliberate Isolate Scene and return remain. Focus and its conflicting restoration state are removed; rail and inspector retain independent controls.
- Existing Planning Order supports cross-scene handle drag and Move Earlier/Later, with UUID, original label and scene association preserved. Shooting Order remains independent. Keyboard/touch/pointer infrastructure, undo, clipboard, inspector, import and collaboration are reused.
- Shooting Order opens on the readable selected day, compact day/change controls and sequence; Add/Edit Day and Assign Shots use focused dialogs with search/scene/multi-select/unscheduled/pickup controls. Day deletion leaves master shots intact.
- Shot Lists reuses Call Sheets table classes/components and hierarchy: Document | Scenes / Shots | Planned shoot date | Actions. Open/Rename/Delete reuse the actual shared Confirm modal. Repeated Cancel, Escape, error and successful archive/recovery leave no inline ghost button. InlineDelete remains inside the editor. Call Sheets source/editor/PDF is unchanged.
- Shared EasyUI-derived DrawCheckbox uses native semantics, drawn SVG, mixed/disabled/focus/Space states and reduced motion across Shot Lists only. The exact MIT attribution is distributed. SVG bounds are explicitly 16 px in dense controls.
- Columns and Layout is compact with a dedicated grip, keyboard ordering and focus/hover alternatives. Reset column widths preserves visibility/order; Restore default layout restores the role-based layout. Its header/footer remain fixed while fields scroll. Repetitive resets/filler are removed.
- Grid presets are a compact five-item nonsearchable selected-state menu. Verified Scheduler role initializes DP→Cinematography, 1st/2nd AD→AD / Planning, others→Essentials. Existing per-user overrides win and survive account changes without entering Yjs state.
- Actual collaborator full-name tooltips support own/peer hover/focus and viewport edges. Shared complete identifier presentation preserves raw labels/UUIDs. The inspector flags duplicate canonical numbers and points to the existing editable Shot number field; explicit correction changes only the chosen shot. Merely inspecting never renames source data. Permanent keyboard/filler instructions are removed.
- Approved Create/Metal, Copy Link, sidebar, inline shot deletion and unrelated applications are preserved.

## Executed verification

Reproducible sources: `qa/m03-completion/README.md` and sequential `verify.cjs`. Private workbook/PDF/screenshots/logs are ignored under `client/qa/m032/artifacts/`, with definitive outputs named `completion-*` and `completion/`; do not confuse older artifacts under `final/` with this release.

- TypeScript/Nest/Vite isolated builds; clean portable server `npm ci`. Existing locked dependency versions preserved; machine-local lock paths removed. Font/license assets packaged in Docker.
- Chromium and compatible WebKit: six scopes/content/order, stable automatic preview, independent technical columns, paper/scaling/bands, rapid/outdated requests, genuine-error retry, identical preview/download SHA-256, no uncaught browser errors.
- Actual All Scenes/rail/isolation/cross-scene keyboard drag/reload and unchanged identities; role defaults/manual override/account switching; column resize/reset/restore/order; checkbox mixed/Space/disabled states and dialog geometry.
- Scheduling create/edit/switch/multiassign/pickups/reorder/remove/reload/day deletion preserving masters; own/peer tooltip; CSV review/mapping/checkboxes and once-only import. Original129 import compares every mapped source field and idempotent retry.
- Document repeated Delete/Cancel, Escape, simulated failure, successful archive/restore; old WebSocket closed and new denied on archive.
- Three real authenticated clients: offline/concurrent master/scheduling changes converge, backend restart persistence, personal widths do not enter collaborative state. All eight eligible verified roles and unverified/ineligible/revoked HTTP/WebSocket enforcement pass.
- 18 domain/import/identifier tests; unchanged actual authenticated Call Sheet PDF regression.
- Chrome/WebKit mobile 390×844; real Chrome 125/150/200% zoom; 500/2,000-shot stress. Latest 2,000-shot sample: load 1,196 ms, preset 180 ms, saved edit 347 ms, resize 203 ms, 2,243 DOM nodes (local measurements).

Physical Safari/iOS hardware was not tested. Compatible macOS WebKit was. Local disposable records cover destructive and multi-user write scenarios; production smoke is read-only. Product acceptance belongs to the owner, not the test suite.

## Release record

Release publication and normal authenticated live checks are recorded after deployment in the final release evidence. No production migrations, membership-policy changes, test imports/documents/deletions, Scheduler changes or unrelated application publication are required. Pre-release read-only observation: one Shot List, two scenes, 11 active shots, seven Call Sheets, 26 roster entries. This current observed baseline supersedes earlier stale empty-document/eight-call-sheet assumptions; concurrent owner changes must never be reverted to force a count.
