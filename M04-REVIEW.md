# M04 — Storyboards Studio release review

Owner acceptance is pending. The current authoritative contract is qa/m04/FINAL-COMPLETION-SPECIFICATION.md. Read [M04-FINAL-COMPLETION.md](M04-FINAL-COMPLETION.md) for the final20-issue correction and verification report; the Studio review below is the preceding baseline. Existing accepted M03 functionality and its PDF renderer remain unchanged.

## Delivered experience

One document model supports imported artwork, native drawing and mixed sequences. The Storyboards index reuses the accepted document table/navigation/actions, with search/sort, useful previews, rename, duplication and recoverable deletion. Original Whiteout storyboard illustrations identify empty states and optional Shot List connection.

The image-first Grid has neutral artwork mounts, concise captions, selection/context actions and actual-artwork drag previews. Grid/Split/Present share the icon segmented control. Split uses the genuine M03 Yjs document and CollaborativeText editor without embedding the M03 page shell. UUID links remain many-to-many, bidirectional and independent of visual/shooting order.

Import starts transferring immediately after selection/drop with actual per-file progress, cancellation, error/retry and image ordering. The unified workspace contains source-page navigation, corrected crop editing and a draggable thumbnail sequence with synchronized selection and a resizable pane. All pages are processed sequentially; original bytes stay private and intact. Done commits reviewed individual panels. Repeating organization reuses matching panel/revision identities, and confirmed ordering preserves unrelated panels' relative order. Crops retain normalized coordinates, source/page/rotation and persistent crop IDs. No OCR or automatic technical-shot linking is claimed.

Studio opens immediately for blank creation and supports insertion after a chosen frame, including within imported sequences. Imported and native panels use the same creative workspace: select/move/uniform resize/rotate, pressure-aware brush, multi-anchor cubic Vector Pen with editable controls, curved arrows, line/rectangle/ellipse/callout, highlight, in-place Unicode/IME text, eraser, hand/pan, undo/redo, color/opacity/width and brush presets. The icon dock, contextual object actions, color interface, sliders and compact properties are Whiteout components. Brush defaults never restyle completed objects. New operations commit coherently through Yjs, not per pointer sample. Raw samples are bounded and preview rendering is coalesced to animation frames.

Viewer/Present use conventional icon navigation/fullscreen, Fit/zoom/pan, optional details, fading presentation controls, revision-associated overlays, comments/replies/resolution, notes, original source context and revision restoration. Missing media and unavailable WASM have real retry states. Source/crop thumbnails capture immutable pixels before releasing canvases, fixing deferred React updater corruption. Cross-document deep links reset transient UI state and cancel stale media results.

Organized PDFs use the existing M04 pdf-lib renderer and persisted authoritative snapshots: 1/2/4/6 panels, Letter/A4, portrait/landscape, all/selected scenes/selected panels, notes/links/annotation toggles, high-resolution sources and native vector artwork. Actual PDF bytes drive preview and download. Artwork is constrained to its frame. M03's direct spreadsheet PDF and legacy Call Sheet LaTeX renderer were not replaced.

## Actual VectorCraft integration

Pinned upstream: https://github.com/storytold/vectorcraft/tree/639c9d6ce989dd638ba3488cc26e36d907022bcb

Selected unmodified crate sources: vectorcraft-geom, vectorcraft-color, vectorcraft-doc and vectorcraft-brush (0.20.0), vendored under studio-engine with original MIT/Apache licenses and NOTICE. The local workspace omits application/desktop crates and test-only dependencies. No upstream UI or protected brand assets are shipped.

The Rust/WASM bridge actually executes VectorCraft pressure-profile calligraphic stroke_pieces, editable PathData, cubic geometry, shape creation and transforms. Whiteout owns the Pointer Events adapter, SVG compositing, text/IME, selection chrome and Yjs operations. It does not claim to use the full upstream engine/render/tools command stack. No Konva fallback is used when WASM fails. Legacy annotations retain their original editable parameters and geometry algorithms; new objects explicitly use the WASM path. The old Konva proof is retained only as historical QA, not the primary production editor.

The WASM is a separately hashed, lazily fetched Vite asset (about 746 KiB raw). Exact bytes, SHA-256, bridge source hash and pinned revision are in studio-engine/BUILD.json. The checked binary preserves the established Node-only website release. Rust 1.99.1/Cargo.lock reproduce the engine. Local build paths are remapped out of the published binary. Relevant kernel-only medians on this machine were approximately 0.9/1.5/2.0 ms for 100/400/1000 input samples; these are not physical stylus or end-to-end hardware measurements.

## Reuse and visual references

Direct reuse: Whiteout Button/IconButton, Menu, Overlay, DrawCheckbox, InlineDelete, document rows, M03 sync treatment, collaboration avatars/tooltips, CollaborativeText, dnd sensors and actual PDF preview.

Original adaptations: icon dock/tool feedback (EasyUI Floating Action Dock / Bencho Icon Bar principles), unified immediate-transfer uploader (EasyUI Animated File Upload), contextual object controls (Bencho Selection Actions), restrained view indicator and anchored selectors (existing M03 / EasyUI tab/select language), original Hairline-inspired storyboard folio illustration. No new UI/animation framework was installed, and no copied vendor application chrome is embedded. Existing Create/Metal/Copy Link/sidebar remain preserved.

Third-party notices include the selected VectorCraft licenses and all 51 resolved Rust dependency license records/texts, plus the existing Konva/Perfect Freehand/AWS/sharp notices. No private storyboard PDF, image, token or production credential is committed or published.

## Verified journeys and evidence

Individual targeted scripts were run against real local authenticated HTTP/WebSocket services and private S3-compatible storage. The current reusable runner is qa/m04/verify.cjs; it was updated for Studio rather than the obsolete upload/page-review controls. Individual logs and screenshots are in the ignored client/qa/m032/artifacts/m04 directory and /tmp/m04. The entire orchestration was not redundantly repeated after the final focused checks.

- Real Scene 09: all 3 pages/original bytes preserved; 22 individually reviewed crops, corrected labels, all-page sequence and Done. Repeated organization preserves existing panel/revision UUIDs without duplication. Chromium/WebKit.
- Real Scene 16: both pages/25.99 MB original preserved; 7 assisted regions plus 2 manual photographic/drawn crops on page 2, including captions; 9-panel Grid. Chromium/WebKit. Thumbnail image decoding is asserted; corrected screenshots inspected.
- Native drawing: actual browser WASM execution, narrow/thick stroke ownership, in-place Unicode text, arrows/shapes, Saved/reload, native gallery and PDF. Chromium/WebKit.
- Vector paths: actual multi-segment WASM cubic geometry, editable handles, selected-object property isolation/undo and pointer cancellation. Chromium/WebKit. Legacy move retains source geometry, identities and editable handles without flattening.
- Mixed sequence: 9 to 10 panels inserted at a chosen position; 4:3 native frame, retained original identities/revisions/links, actual-artwork drag, source/crop context, Present/fullscreen, PDF preview/download byte equality, and 1280/1024/768/390 layouts. Chromium/WebKit.
- Index: real UI Start drawing creation, practical row navigation, independent actions, rename, duplicate, recoverable Delete and search.
- Revisions: native duplication, collaborative Y.Text notes, comments/reply/resolution, real image replacement, old vector retention and restoration.
- Linking: many-to-many picker, compact genuine Shot List pane, both navigation directions, stable UUIDs and unchanged master shot data.
- Security/collaboration: two authorized clients, independent objects and concurrent notes, durable reload; unapproved and unauthenticated requests rejected; wrong-document assets rejected; immediate HTTP and idle WebSocket revocation.
- Recovery: actual offline edit/reconnect and backend restart preserve the full saved snapshot; upload failure/retry, private-media retry, explicit engine failure/retry without a fallback preserve saved artwork.
- Actual Chrome zoom 100/125/150/200 percent passed grid/viewer/crop geometry. Final crop/sequence tabs retain usable canvas and footer at short/narrow viewports; correct native 200% viewport capture uses CDP rather than the incorrectly scaled Playwright capture. Stale source fetch/render cancellation is guarded during reopen/cleanup. Actual transition sampling and reduced-motion checks passed for the view selector. Artwork drag and fullscreen were exercised, not inferred from screenshots.
- PDF pages were rendered and visually inspected: individual-panel organized output, native drawings, selected scopes, vector overlays and Unicode. The original 22-panel, four-per-page reference is six landscape Letter pages.
- M03 actual preview/download byte equality, Call Sheets/Roster indexes and the existing Call Sheet LaTeX regression passed. Frontend/backend typechecks and actual WASM/Rust bridge tests passed.

## Data and release safety

Existing verified Scheduler production membership authorizes HTTP and WebSocket access. No public signup role alone grants access. Upload checks run before multipart buffering; private media is authenticated and scoped to its document. R2 credentials remain server-only. The established private bucket configuration is preserved.

Two additive Storyboards tables/index were applied once through the transactional migration history. No existing table was rewritten. The backend uses an independent Hocuspocus instance and advisory single-writer lease, queued PostgreSQL persistence and durable-save digests. Binary artwork remains outside Yjs.

The observed pre-release production baseline was one Shot List with 20 active shots, seven Call Sheets and 26 roster entries. These are actual current owner data, not the obsolete historical counts. Canonical hashes are checked around release. No reference PDFs or arbitrary test application records are created in production.

The source and website releases use existing GitHub/Railway/GitHub Pages integration. Fresh frontend publication is scoped to productiondesk; 142 unrelated site files are hash-checked. Exact release identifiers and live verification are recorded in the final delivery report and ignored release evidence JSON.

## Honest limits

Detection is conservative and requires human correction; Scene 16 page 2 uses manual crops. No OCR/automatic shot assignment is claimed. Frame proportions can be chosen before the first drawing mark. PDF fonts explicitly reject unsupported glyphs instead of silently dropping content. Physical Apple Pencil/stylus/tilt hardware was unavailable; synthetic pressure and pointer checks are not hardware certification. The selected bridge is intentionally smaller than the complete VectorCraft application.

Production smoke tests preserve real records. R2 signed storage/pipeline checks use tiny private probes, while full import/revision/destructive journeys use disposable local records. A real production Storyboard upload/edit collaboration cannot be claimed without creating or changing owner content; owner acceptance supplies that final real-content review. Only the owner may accept M04.
