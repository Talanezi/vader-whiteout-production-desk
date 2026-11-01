# M04 acceptance and release

Read SPECIFICATION.md for the authoritative scope and M04-REVIEW.md at repository root for results. STATE.md preserves the implementation history.

Use Node 22. Existing isolated dependencies live in /tmp/m032/runtime. Start the isolated fixture services with `node qa/m04/local.cjs`; it uses API4314, frontend5176, private S3 fixture4570, and loopback restart control4318. This QA control is never part of the deployed application. Original M03 fixture services remain independent.

Run individual scripts in this directory against that local stack. `node qa/m04/verify.cjs` is the broader integrated suite; `node qa/m04/zoom.cjs` tests real headed Chrome zoom, and `node qa/m04/pointer-drag.cjs` tests pointer/native-touch grip ordering. Do not run all *.cjs indiscriminately (local.cjs is a service manager).

Scene 09.pdf and Scene16_Storyboard.pdf are read from the owner's Downloads directory. They are not committed or published. Individual extraction acceptance is individual-panels.cjs and scene16-individual.cjs, not the optional whole-page journey.cjs regression. Detection is conservative; manual regions and review are required where uncertain.

Screenshots, actual PDFs and logs are under /tmp/m04 and copied to ignored client/qa/m032/artifacts/m04 for owner review. Sources, tokens, production credentials and private artwork are never published as fixtures. Local authenticated test tokens stay in the private runtime state file.

Fresh production publication uses the existing mechanism: `M03_RUNTIME=/tmp/m032/runtime node qa/release.cjs`. It verifies production base/API, rejects local endpoint leakage, backs up the old bundle and checks all unrelated website files remain unchanged. It does not commit/push/deploy automatically.
