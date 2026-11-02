# Current M04 Studio acceptance

STUDIO-SPECIFICATION.md is authoritative. SPECIFICATION.md is the preserved earlier baseline. Read root M04-REVIEW.md for the implementation/results and STATE.md for recovery history.

Node22 is required. Existing isolated dependencies: /tmp/m032/runtime. M04 local services: `node qa/m04/local.cjs` (API4314, Vite5176, private S3fixture4570, restart control4318, dedicated whiteout_m04 database). They reuse loopback PostgreSQL55432 and the existing local Scheduler authority4311. If that authority has expired while PostgreSQL persists, `node qa/m04/authority.cjs` resumes the existing private QA state; never run these fixture services in production.

`node qa/m04/verify.cjs` runs current integrated Studio acceptance; `node qa/m04/zoom.cjs` is the separate headed native Chrome zoom check. The individual scripts may be run to repeat only affected gates. `studio-engine.cjs` executes the checked WASM directly; Rust bridge tests/build instructions are in studio-engine/README.md. The whole current runner was not repeatedly executed just to duplicate already valid evidence.

Scene 09.pdf and Scene16_Storyboard.pdf are read from the owner's Downloads directory, never committed or imported into production. studio-import.cjs and studio-scene16.cjs are the current unified individual-panel workflows. Historical Konva and explicit full-page import proofs remain available for reference, but their old UI selectors are not the primary Studio acceptance.

Private screenshots/PDFs/logs live in /tmp/m04 and the ignored client/qa/m032/artifacts/m04 gallery. Fixture tokens remain in private local runtime state. No production credentials or artwork are distributed.

Fresh scoped publication: `M03_RUNTIME=/tmp/m032/runtime node qa/release.cjs`. It builds current source, validates production base/API, rejects fixture/localhost leakage, copies only productiondesk, backs up the previous bundle and hashes all unrelated website files. It does not itself commit or deploy.
