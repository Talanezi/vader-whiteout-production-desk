# M05 release checkpoint

Baseline accepted M04 main c8f8593d. Feature ui/m05-flow-of-the-day preserves checkpoints
10aa5d91 and 52d3a561 plus the final verified implementation. Source release pending.

All integrated subsystems and acceptance evidence are described in M05-REVIEW.md.
Latest Chromium browser, drag and secondary-surface checks passed after the final
PDF readiness/config guard and timeline inheritance changes. Existing WebKit,
workbook, security, collaboration, print, source-link and M03/Call Sheet evidence
is retained; no full-suite restart is needed. Final isolated build passes.

Original source workbook is unchanged in Downloads. Evidence is copied to ignored
client/qa/m032/artifacts/m05/. It contains actual screenshots, PDF outputs and test
logs, never session tokens or the original workbook. Final release identities and
production verification will be written to RELEASE.md/RELEASE.json in that gallery.

Pre-release production: 4 Storyboards/83 assets,1 Shot List/15 active shots,
7 Call Sheets,26 roster. Before hashes /tmp/m05/production-before.json. The older
3/71 discrepancy is explained by owner-created Scene16 before this M05 session.
No production test content is permitted. Existing authenticated IAB tab3 is live.

Remaining release sequence: reviewed source commit/main integration/push, Railway
success and additive Flows1793685600000 migration; fresh qa/release.cjs production
build/scoped site publication, site main push, Pages asset SHA checks, authenticated
read-only Flow index/creation and existing-app smoke, existing-data hash comparison
and private R2 read-only health. Do not declare owner acceptance or begin M06.
