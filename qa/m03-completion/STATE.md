# Definitive M03 checkpoint

Implementation and local verification are complete in this same workspace. Do not restart, recreate the proof or repeat research. `M03-FINAL-REVIEW.md`, `README.md`, `RESEARCH.md` and the tests describe the current authoritative state.

Preserved standalone Scene 05 proof/measurements/reference: `/tmp/m03-completion/{scene05-proof.pdf,proof.png,reference.png,measurement.json}`. Original workbook remains in Downloads. Integrated Scene 05: `client/qa/m032/artifacts/completion-scene05.pdf`, 14 shots/17 named fields/one Letter-landscape page. Full129: 6 wrapped table/7 technical/5 explicit one-line pages. All Shot List LaTeX removed; Call Sheet regression passes.

Local stack `/tmp/m032/runtime`: Vite5175/API4310/QA Scheduler4311/restart4312/Postgres55432. Never build/edit frontend while browser tests run. Tests/logs `/tmp/m03-completion`; private artifacts `client/qa/m032/artifacts/completion-*`, `completion/`, and selected `final/` files. Generated evidence stays untracked.

Before release: source main baseline a9c91b2d, website797a8e1, both remote0/0 at last fetch. Existing website untracked.DS_Store must remain. Production read-only baseline `/tmp/m03-completion/production-before.json`: one doc/two scenes/11 active shots/7 Call Sheets/26 roster; full-state hash43238391f3b4b9628bb4653c8103db3fc1d64ae2f425c750d9e72c4dcd663e0a. No production writes by QA. Immediate pre-push read matched the baseline exactly. Final extreme-width guards, 18-PDF/36-page bounds and Chromium/WebKit full acceptance rerun passed.

Remaining at this checkpoint: source commit/push, Railway main deployment health, fresh `M03_RUNTIME=/tmp/m032/runtime node qa/release.cjs`, websiteproductiondesk-only commit/push, Pages byte checks, signed-in owner live navigation/print/download/grid/presence read-only smoke, production baseline comparison, final release evidence/report. Do not claim owner acceptance or start M04. Routine Git/deployment is authorized. No force push, production imports/deletes/testdocuments or destructive migrations.
