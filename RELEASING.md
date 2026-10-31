# Production Desk release workflow

Routine completed work may be committed, pushed and deployed using the existing repositories and integrations. Never force-push, erase production data, run destructive migrations or weaken authentication. Unavailable credentials and material product decisions still require the owner.

1. Inspect working trees and preserve unrelated work. Implement on the relevant existing deployment branch or merge a tested feature branch normally.
2. Run builds, applicable M03/M02 regression scenarios and browser QA. Scheduler changes must also build/test against its actual source.
3. Commit and push required backend dependencies first. Scheduler deploys from `master`; Production Desk deploys from `main` through Railway project `wonderful-insight`, production environment. Monitor the actual deployment status before publishing dependent clients. Inspect required migrations and apply tested additive migrations with the deployed runner before declaring the backend ready (Production Desk container: `cd /app/server && node dist/shotlists/migrate.js`). Check existing data counts before/after. Never run a revert or destructive migration without explicit authorization.
4. Always build a fresh Production Desk frontend with `/productiondesk/` and `https://vader-whiteout-production-desk-production.up.railway.app/api`. The tracked `client/dist` is not a release input.
5. Run `node qa/release.cjs`. It uses the existing exact isolated dependencies, builds current source, rejects localhost/QA leakage, backs up the old local bundle, replaces only `vader-whiteout-site/productiondesk/`, and verifies every copied hash and all other site files. No Git or deployment action occurs inside this helper.
6. If Scheduler UI changed, build it fresh with its production API and `/scheduler/` base, then pass `--scheduler-build /absolute/fresh/build` to publish both application directories. Do not overwrite Apps, Equipment, ADConsole or site configuration.
7. Commit and push the website repository's `main` branch. That is the actual `vaderwhiteout.com` frontend release; pushing Production Desk source alone does not publish it.
8. Check GitHub Pages/Railway terminal statuses, live HTML/asset hashes, routing, and normal authenticated production HTTP/WebSocket behavior. Do not manufacture sessions or use mocked QA responses as live-auth evidence. Keep credentials out of reports/logs.
9. Report URLs, source/site commit hashes, deployed versions, tests and genuine verification limits.

The production owner is the protected Scheduler team administrator. Routine crew onboarding is through `/scheduler/#/crew`, not database CLI commands or per-list grants. Sign-in return links use `/scheduler/#/login` because the published Scheduler uses hash routing.
