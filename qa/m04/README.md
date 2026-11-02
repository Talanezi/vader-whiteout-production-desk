# Current M04 Studio acceptance

FINAL-COMPLETION-SPECIFICATION.md is authoritative. The focused final acceptance runner is `node qa/m04/verify-finishing.cjs`; current completion results are in root M04-FINAL-COMPLETION.md. Native100/125/150/200% zoom: `M04_NATIVE_ZOOM=1 node qa/m04/studio-finishing-layout.cjs`. STUDIO-SPECIFICATION.md is the preceding baseline. SPECIFICATION.md is the preserved earlier baseline. Read root M04-REVIEW.md for the implementation/results and STATE.md for recovery history.

Node22 is required. Existing isolated dependencies: /tmp/m032/runtime. M04 local services: `node qa/m04/local.cjs` (API4314, Vite5176, private S3fixture4570, restart control4318, dedicated whiteout_m04 database). They reuse loopback PostgreSQL55432 and the existing local Scheduler authority4311. If that authority has expired while PostgreSQL persists, `node qa/m04/authority.cjs` resumes the existing private QA state; never run these fixture services in production.

`node qa/m04/verify.cjs` runs current integrated Studio acceptance; `node qa/m04/zoom.cjs` is the separate headed native Chrome zoom check. The individual scripts may be run to repeat only affected gates. `studio-engine.cjs` executes the checked WASM directly; Rust bridge tests/build instructions are in studio-engine/README.md. The whole current runner was not repeatedly executed just to duplicate already valid evidence.

Scene 09.pdf and Scene16_Storyboard.pdf are read from the owner's Downloads directory, never committed or imported into production. studio-import.cjs and studio-scene16.cjs are the current unified individual-panel workflows. Historical Konva and explicit full-page import proofs remain available for reference, but their old UI selectors are not the primary Studio acceptance.

Private screenshots/PDFs/logs live in /tmp/m04 and the ignored client/qa/m032/artifacts/m04 gallery. Fixture tokens remain in private local runtime state. No production credentials or artwork are distributed.

Fresh scoped publication: `M03_RUNTIME=/tmp/m032/runtime node qa/release.cjs`. It builds current source, validates production base/API, rejects fixture/localhost leakage, copies only productiondesk, backs up the previous bundle and hashes all unrelated website files. It does not itself commit or deploy.

The final bundled local preview is optional: build Vite with the loopback API into `/tmp/m04/final-preview`, then start the same fixture manager with `M04_PREVIEW_DIR=/tmp/m04/final-preview node qa/m04/local.cjs`. This serves static production-mode files, including PDF.js workers, on5176 with the same local authorization/storage fixtures. Never publish that loopback build; `qa/release.cjs` always builds fresh against production and rejects QA endpoints.

Final two UI refinements: `node qa/m04/comment-discovery.cjs` and `M04_BROWSER=webkit node qa/m04/comment-discovery.cjs` check only toolbar removal and collaborative comment discovery/direct navigation. They use disposable local records and an actual second authorized fixture client. No production comments or artwork are created for QA.
