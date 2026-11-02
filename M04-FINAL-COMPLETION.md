# M04 final completion review

Owner acceptance remains pending. `qa/m04/FINAL-COMPLETION-SPECIFICATION.md` is the current contract; the preceding Studio and original M04 specifications remain preservation baselines. This pass extends the deployed Studio implementation from `83a1c215`, without replacing VectorCraft, media storage, collaboration, imports, Present, or M03's PDF system.

## All 20 screenshot issues

| # | Correction | Verification |
|---|---|---|
| 1 | 18px preset/palette separation; pipette beside HEX; native EyeDropper API with authorized composition-buffer fallback | Chromium/WebKit sample both real Scene16 image pixels and visible vector strokes. OS screen-picker interaction remains a manual check. |
| 2 | One meaningful inspector toggle | Integrated viewer assertions and screenshots |
| 3 | Details/Comments/History tabs, identity, separate artwork action, compact linked shots and notes | Both browsers; independent scrolling and narrow drawer |
| 4 | Thread cards, author/time/avatar, focused inline replies, compact Send/Cancel, resolve/reopen | Real persisted replies, cancel, resolution and reload |
| 5 | Same Original/16:9/4:3/Square/Scope frames and explicit Fit/Crop for all artwork; obsolete Annotations control removed | Source bytes/objects unchanged; framing persists; actual PDF byte parity |
| 6 | Stable imported-panel toolbar | Actual rendered positions compared with native panels |
| 7 | Same native-panel controls and framing capabilities | Same geometry check, narrow widths and native browser zoom |
| 8 | Existing Create expansion now fits all three actions | Third row bounds and creation of two distinct local Storyboards |
| 9 | Link picker count and actions share a responsive aligned footer | Actual linked-shot journey and screenshot |
| 10 | Linked M03 identity by default; explicit custom title takes precedence; original label stays separate | Compared against M03's prefix/collision semantics; live linked-document journey |
| 11 | Grip, checkbox and ellipsis share a geometric centerline | Actual center coordinates differ by less than 1px |
| 12 | Split has bounded independent scroll panes; escaped hidden labels no longer create phantom height | Last actual shot, resizing, phone/tablet and 100/125/150/200% native Chrome zoom |
| 13 | Present Notes & shots is an icon control | Real open/dismiss journey; existing presentation composition preserved |
| 14 | Larger responsive initial dropzone; no redundant bottom Close; durable Done feedback | Both browsers, actual upload/commit journey |
| 15 | File list scrolls independently while footer remains visible | 1/5/20/50 real local files, short viewport, last-file access, failure/retry/removal |
| 16 | Anchored portal menu remains owned while pointer/focus moves into it | Pointer movement, Escape and viewport-edge checks |
| 17 | Established Whiteout menu icons, spacing, danger and hover states | Actual secondary-surface captures visually inspected |
| 18 | Actual M03 selected-action classes, blue duplicate success after durable acknowledgement, quiet Clear and inline Delete | Count/data checks, pending/success state and real cancel/delete/Restore |
| 19 | Same accepted M03 duplication/deletion foundation, including single-panel checkmark/X | Both browsers; source UUID, revision, links, label and notes survive Restore |
| 20 | History moved inside one inspector; real thumbnails, preview, Compare, Save version and Restore | Restoring creates a new current revision; the later edited revision and its objects remain available |

## Drawing reliability

The existing pinned VectorCraft WASM is unchanged: 764124 bytes, upstream `639c9d6ce989dd638ba3488cc26e36d907022bcb`; hashes and license provenance remain in `studio-engine/BUILD.json` and its notices.

- Auto distinguishes recognized pens from fingers; before pen use, touch can draw. Touch Drawing supports touch-reported passive styluses; two fingers navigate. Navigation Only makes touches navigate while mouse/pen tools remain available. Personal input and Shape Assistance preferences persist.
- Shared reference-counted document scroll ownership protects Studio and nested dialogs, restores the previous scroll position/styles, and leaves inspector/settings scrollers independent. Pointer capture, coalesced events, cancellation, lost capture and tool switching clear drafts safely. Missing/zero pressure has a usable 0.5 fallback; reported pressure is retained.
- Whole-stroke erasure intersects the continuous swept pointer path with editable geometry, including thin strokes crossed between input events. Partial erasure subtracts swept circular capsules from path samples, interpolates pressure at cut endpoints and retains style/transforms in editable fragments. Shapes/text/arrow heads deliberately use Whole Stroke; the UI states this limitation. One completed swipe is one Yjs/Undo transaction. Original raster artwork is never erased.
- An 800ms deliberate stationary hold invokes conservative geometric line, circle/ellipse, rectangle, triangle and arrow recognition. Low-confidence scribbles remain freehand. Conversion is a separate undoable operation, restoring the original gesture on Undo. No OCR/AI service or replacement engine was introduced.
- Safari-compatible sampling decodes the authorized raster and composites current editable SVG vectors into a DPR-aware bounded canvas. It samples the actual composition and respects frame/world coordinates. Escape cancels. Selected-object sampling changes that object; otherwise it changes the next brush color.

Synthetic pen/touch and real mouse journeys passed in Chromium/WebKit. This is not a claim of physical Apple Pencil Pro, passive-stylus palm rejection, or OS-wide screen-picker testing. Browsers cannot reliably distinguish a passive stylus from a finger; Touch Drawing is the explicit fallback.

## Inspector, history and connected Shot Lists

Details, Comments and History reuse Whiteout buttons, icons, menu, focus and typography; new components only compose the Storyboards-specific surfaces. Comments retain existing Yjs authors, timestamps, replies and resolved states. Revision checkpoints copy editable objects and reference the existing private binary rather than duplicating media per pointer sample. Restore creates a new revision, retaining later artwork, source history, panel UUID, links and comments. Concurrent active-revision changes are guarded. Missing historical media is shown honestly; revisions that never stored past geometry cannot reconstruct it.

Split opens the single canonical `meta.originatingList` through the existing `useShotCollaboration`. Coverage uses M03 `CollaborativeText`; Subject, Camera, Framing, Lens, Camera angle, Support/equipment, Movement and Camera notes reuse M03 choices, validation, change tracking and authorization. Another authorized M03 session receives these same changes. No independent Split list selector or technical-data copy exists. Disconnect removes the relationship/links only, preserves the real plan, shots, artwork and revisions, and offers guarded Restore. Normal reconnection is tested.

Actions reuse actual M03 `Button`, `InlineDelete`, selection-feedback classes and durable persistence acknowledgement. An observed raw database-driver string error at the Hocuspocus/ws boundary is normalized to a legal private retryable close code; authentication denial remains intact. This is transport error containment, not a new collaboration architecture or a claim of database high availability.

## Verification and preservation

Fresh production-mode local UI (no Vite HMR) and compiled backend were used for final integrated checks. The loopback preview's `.mjs` MIME type was corrected so PDF.js workers are tested under production-style static serving.

Passing focused gates: `studio-engine`, `creative-geometry`, `panel-identity`, `collaboration-error`, all seven `studio-finishing-*` journeys in Chromium/WebKit, native Chrome 100/125/150/200% layout, two-client collaboration, security/revocation, actual offline/backend-restart recovery, and M03 PDF/Call Sheets/Roster regression. `verify-finishing.cjs` reproduces these journeys; native zoom remains separate. At 200%, the legitimate header and useful minimum-height Split pane may require normal page scrolling; no unexplained blank document region remains.

Valid prior fixture evidence was reused: Scene09's three original pages produce 22 reviewed individual regions; Scene16 has seven assisted plus two deliberately manual photo/drawing crops, with original PDFs byte-exact. The current Scene09 organization/idempotency test and 1/5/20/50-file uploader checks passed after the Done changes. No reference artwork was imported into production for QA.

Actual PDF preview bytes equal downloaded bytes. The final framed native PDF was rendered through Poppler and visually inspected; custom title, unchanged geometry and non-destructive frame are retained. M03's direct spreadsheet renderer and Call Sheet LaTeX renderer are unchanged. No new runtime dependency or licensing obligation was introduced in this final pass; existing VectorCraft and 51 Rust dependency notices remain shipped.

Private evidence: `/tmp/m04/finishing-*.log`, PNG/PDF captures, and the ignored `client/qa/m032/artifacts/m04/` gallery. Failure captures are excluded from that curated gallery. Source PDFs, production artwork, tokens and credentials are not committed or published.

The pre-release read-only baseline is 3 Storyboards, 71 asset records, 1 Shot List/15 active shots, 7 Call Sheets and 26 roster entries. Canonical full-document/media metadata hashes are stored privately in `/tmp/m04/final-production-before.json` and compared after release. No new migration is required; the existing Storyboards migration is already present.

Fresh frontend publication uses `qa/release.cjs`, `/productiondesk/`, production HTTPS API and derived WSS; unrelated website files are hash-checked. Observed deployment identifiers, exact source/site commits, live asset hash results and the normal authenticated read-only smoke are recorded in final release evidence and the delivery report. Owner acceptance is not implied by deployment.

The actual owner-authenticated live smoke exposed a valid631KB pressure-stroke outline rejected by the prior500KB PDF guard. The narrowly scoped backend correction accepts up to2,000,000 characters, consistent with the bounded collaboration payload, while retaining SVG syntax and oversize rejection. A real1489-sample VectorCraft outline regression exports successfully, invalid/oversize paths still fail, and its actual vector PDF was rendered and visually inspected. No saved artwork was rewritten. Final live preview is rechecked after the corrective backend deployment.


## Final live verification and owner icon correction

The deployed PDF correction at source `9d8ed6cd7a2d3ac14c86facc97db526528d83a96` was observed healthy in Railway deployment `25f5e1cf-60a5-42fb-99d0-a91f381442ba`. The exact existing production Scene9 storyboard automatically rendered all40panels into10pages with annotations enabled. Two normal UI downloads of the ready preview were byte-identical: SHA-256 `debfdbc69f03f17905c3b2742c7ad71c5662c87b34667e172410c0a374ced61b`,4,211,818bytes. Poppler parsed the downloaded PDF and page10 was rendered and visually inspected, including the previously failing pressure stroke. No production records or artwork were changed.

Read-only post-smoke counts and canonical hashes exactly matched `/tmp/m04/final-production-before.json`:3Storyboard records/71assets,1Shot List with15active shots,7Call Sheets and26roster entries. Full logical document content, comments/revisions/links, asset metadata and other production records are unchanged.

The owner's additional screenshot correction is implemented: the main inspector uses a sidebar glyph, while a distinct gear inside the established creative dock opens Input and Shape Assistance. The floating right-side sliders button is removed. Existing personal preferences, keyboard/Escape behavior and anchored Whiteout menus remain. `studio-final-controls.cjs` passes real mouse and simulated tablet touch in Chromium/WebKit, including persistence, popup containment, no duplicate floating control, and inspector operation. Physical iPad hardware remains unverified.

The live smoke also exposed print-dialog root scrolling at720px height, clipping its title when Download received focus. Scoped Storyboards flex/min-height rules now assign scrolling to settings and the actual PDF canvas, keeping the existing header, footer, controls and generated PDF unchanged. The dialog is verified at720/600/650/401px heights and390px width. Existing1/2/4/6-layout preview/download checks pass in both browsers; M03's PDF regression passes. New dock screenshots and live PDF evidence are private in the existing evidence directory.
