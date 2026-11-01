# M04 Storyboards release review

M04 adds an integrated, private, collaborative Storyboards workspace to the accepted M03 baseline. Production release evidence will be appended after deployment; owner acceptance is pending.

## Delivered

- Storyboards index, search/sort, full-row navigation, import/from-Shot-List/blank creation, rename, duplicate and recoverable archive.
- Original PDF/image preservation, private authenticated media, source viewer/download, assisted and manual normalized crop editing, all-pages thumbnail review and user-confirmed ordering. Individual-panel extraction is the default; original-only and explicit source-sheet import remain available.
- Image-first responsive Grid, grip-only pointer/keyboard/touch ordering, multi-selection, duplicate/delete/restore, restrained icon view switcher and composed Whiteout toolbar.
- Compact integrated Split pane using the actual M03 Yjs document and CollaborativeText editor, permanent UUID many-to-many links, synchronized selection, personal divider preference and narrow-screen tabs. M03's application shell is not embedded.
- Immersive viewer, zoom/pan/Fit, revision history/restoration, per-revision vector annotations, collaborative Y.Text visual notes, comments/replies/resolution and distraction-free Present/fullscreen navigation.
- Reused proven Konva/Perfect Freehand annotation editor: pen, editable curved arrow, highlight, Unicode text, selection/erase, undo/redo, layer visibility and normalized high-DPI coordinates.
- Separate organized PDF renderer using existing pdf-lib/font infrastructure, 1/2/4/6 panels, paper/orientation, selected panels/scenes, notes/shot/annotation toggles. Actual generated PDF is previewed and the same bytes downloaded. M03 PDF code is unchanged.

## Security and persistence

Scheduler's existing verified production-membership authorization is reused for HTTP and WebSocket access; self-selected roles alone never grant access. Upload authorization runs before multipart buffering. Media is private, byte-validated and content-addressed; original bytes remain unchanged, optimized thumbnails are separate. No public object URLs or storage credentials enter the frontend. Per-document asset ownership is checked on every read.

Two additive tables (storyboard_documents/storyboard_assets) and an index are registered in the existing transactional migration runner. No existing production table/data is rewritten. Yjs state persists in PostgreSQL with durable-save digests, a separate authenticated Hocuspocus instance, single-writer advisory lease, and periodic membership revocation. PDF generation captures a consistent persisted snapshot. Source images/binaries stay in private R2, outside Yjs.

## Acceptance evidence

Evidence is local and excluded from publication: client/qa/m032/artifacts/m04 and /tmp/m04. Reproducible scripts and the specification are in qa/m04.

- Scene 09: all 3 original pages preserved, 22 individually reviewed/extracted regions; manually entered labels, cross-page reorder, source-page mapping. Chromium and WebKit passed.
- Scene 16: both original pages preserved, 7 assisted first-page regions plus 2 separate manual photographic/drawn regions on page 2, including captions. Chromium and WebKit passed.
- Crop move/resize/undo/redo, idempotent confirmation, original-only and explicit page import passed. Suggestions are conservative, not exhaustive detection or OCR.
- Pen/curved-arrow handle editing/highlight/Unicode, undo/redo, zoom, persistence, per-revision overlays, replacement/restore, comments and concurrent Y.Text edits passed.
- UUID linking in both directions, duplicate-number disambiguation, live master changes, independent ordering, from-shot creation without altering source shots passed.
- Pointer/native-touch/keyboard grip ordering, actual fullscreen, responsive viewer and narrow Split passed. Segmented transition frame sampling passed in Chromium and WebKit; reduced motion removes transition.
- Actual Chrome native zoom 100/125/150/200 percent passed layout/crop/viewer checks.
- Actual backend restart and offline edit/reconnect preserved complete state; unapproved users, unauthenticated media and cross-document asset requests rejected; HTTP and idle WebSocket revocation passed.
- Actual PDF preview/download byte equality passed in Chromium and WebKit. All 1/2/4/6 layouts, selected panels/scenes, vector overlays and Unicode inspected. The 22-panel organized list renders 6 landscape Letter pages at 4 panels/page. Actual PDF pages were rendered and visually inspected.
- M03 actual PDF preview/download byte equality, Call Sheet LaTeX regression, Roster and Call Sheet indexes passed. Final frontend/backend typechecks and focused PDF regressions passed.
- Production R2: signed bucket access, tiny private PNG write/read byte equality verified; unsigned reads rejected. No supplied artwork or test application documents were created in production.

## Dependencies and limits

Konva/React Konva/Perfect Freehand MIT; AWS SDK/sharp Apache-2.0. Original notices accompany the client public licenses and server assets. Existing PDF libraries/fonts retain their notices. Dependency versions and lockfiles are pinned.

Frame suggestions require human crop review, especially Scene 16 page 2. No OCR or automatic technical-shot assignment is claimed. PDF fonts explicitly reject unsupported glyphs rather than silently dropping them. Pointer, native-touch automation and keyboard were tested; physical stylus hardware was unavailable. Production smoke tests are read-only to preserve owner content; destructive/import/revision workflows were exercised locally. Owner acceptance remains pending.
