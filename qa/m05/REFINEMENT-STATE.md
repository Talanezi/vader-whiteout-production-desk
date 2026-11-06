# Final M03–M05 release checkpoint

The complete product implementation is preserved in `7fcf4723`, pushed to main and
running on Railway deployment `889f505e-774f-4875-8b1b-40f2bdf79c95`.
The product acceptance matrix is `REFINEMENT-ACCEPTANCE.md`; its earlier pending
statements are superseded by the completed evidence there. No M06.

The owner's later connectivity contract is copied in `RELIABILITY-SPECIFICATION.md`.
Desk recovery checkpoint `90ce0b25` and Scheduler checkpoint `9836947` preserve the
new hardening. Final callback failure recovery, AccountMenu and M03 PDF request
transport changes have passed focused Chromium/WebKit recovery tests and Chromium
PDF preview/download/empty-state regression. Both Desk TypeScript checks and the
request/auth model regressions pass. Scheduler uses its own locked compiler and
isolated fresh frontend/backend builds. Existing broad product evidence is reused.
See `RELIABILITY-REVIEW.md` for incident findings, changes and honest limits.

First-party API/Scheduler domains have valid Railway certificates and Cloudflare
proxying. DNS-only uploads preserve the existing 128MiB upload limit; no public
bucket or weakened permissions. Existing Google callback retains its registered
Railway URL. The original residential failure cannot be independently reproduced.

Next: commit/push final reliability branches; fast-forward Scheduler master and
verify new readiness/revision, then Desk main and readiness/revision; run external
GitHub monitor; freshly build/publish both frontends to the site main branch;
verify served hashes; authenticated read-only UI/PDF/collaboration smoke; compare
production hashes and save final deployed revision evidence. Do not publish the
older prepared site bundle. No production test writes or migrations.

Baseline: 4 Flows, 2 Shot Lists/23 active shots, 5 Storyboards/84 assets,
7 Call Sheets, 26 roster entries. Read-only snapshots in
`/tmp/m05/refinement/production-before.json` and `production-pre-release.json`
match. Temporary local fixtures/runtimes are preserved in `.local-qa-m05`.
