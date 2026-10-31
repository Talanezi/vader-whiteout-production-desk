# M03.1 corrections and release

## Production access

The deployed Scheduler already contained membership support (commit 88aa3d3), but the production verification registry was empty. The authenticated Railway owner email matched the existing Scheduler account, Thamer Alanezi, with the eligible Production / Executive Producer assignment. The deployed verification command restored that owner's central membership and retained the audit record. A one-time audited bootstrap also enabled the verified owner as the production team administrator. No user password, signing secret or authentication timestamp was changed.

The production-managed roster cannot safely authorize new members: its write endpoints admit any authenticated Scheduler account. Equipment likewise relies on self-declared Scheduler roles/explicit owner configuration rather than an independently managed crew-membership source. Neither was silently promoted into an authorization authority.

Scheduler now provides an authenticated, admin-only `/api/production-team` workflow and `/scheduler/#/crew` screen. The protected administrator can review existing accounts, confirm assignment/account ownership with evidence, approve or revoke centrally, and see current verification status. Only the protected verified administrator can perform these operations. Ordinary verified crew and self-selected signup roles cannot grant themselves access. Candidate account IDs are bound inside the transaction, audit history is retained, and owner self-revocation is blocked. No per-list invitations, numeric Railway lists, routine database commands or new membership tables are needed.

`/api/me` returns the admin capability only after central membership and the protected admin record match the authenticated account. The existing session/JWT verification remains unchanged. Production Desk's common HTTP/WebSocket team policy is preserved; one approval grants equal editing across all existing and new shot lists. Production Scheduler target and exact WebSocket origin `https://vaderwhiteout.com` were checked on the real backend.

A live sign-in check also found that `/scheduler/login` returned the website 404. Production Desk's normal/expired-session sign-in links now use the actual hash route `/scheduler/#/login`, preserving the allowlisted returnTo destination.

## Visual corrections

Status menus now measure 164px against a 141px trigger; production-date sorting measures 184px against a 165px trigger. Rows measure 32px. Existing fonts, colors, icons, selection state, animations, typeahead and keyboard behavior remain. Equivalent menus use trigger-relative widths with additional space only where selected icons require it.

Create now morphs from the actual control's viewport rectangle into two compact action rows, with matching entry/exit geometry, rounded surface, edge collision handling and focus return. There is no duplicated Create heading or separate X. The semantic button remains permanently mounted while the shader loads, fixing cold-load first-click/focus loss. Both New Call Sheet and New Shot List routes work. Mobile and reduced motion are verified.

The existing licensed Metal runtime now uses its actual cursor-bend hook, strong silver WebGL reflections, an inner rim, and controlled deformation. The shader and cursor-deformation filter were observed active in Chrome. No halo causes responsive overflow; the effect pauses when idle/hidden/offscreen, and reduced motion/no-WebGL retain a usable static control. No application redesign or M04 feature was introduced.

References were inspected directly: [Bencho liquid Create](https://bencho.dev/?c=liq-create&theme=dark), [Metal](https://libraries.dev/metal). The Create implementation is original; no unavailable paid source was copied. Existing Metal notices remain in the released license bundle.

## Verification and publication

Production Desk TypeScript/backend/Vite builds, the actual Scheduler server build and production client build pass. Six focused visual groups and the full M03/M02 runner pass, including all 21 M02 groups, six viewport sizes, WebKit, native 200% zoom, import/persistence, collaboration/restart, revocation and new admin authorization/onboarding tests. The Scheduler client retains existing lint/Browserslist warnings; no new component warning remains.

The Scheduler repository's older CI workflow fails on an existing SQLite timestamp incompatibility in MeetingNotificationState.CreatorDigestPendingSince. The same error is present on the previous commit. This correction did not alter that schema or hide the failure. Actual PostgreSQL membership/admin tests and Railway production deployment pass.

A fresh production bundle uses `/productiondesk/` and the Railway HTTPS API. `qa/release.cjs` rejects localhost/QA leakage, backs up previous local bundles and copies verified fresh files into the website repository. The fresh Scheduler frontend is published alongside it so team administration is actually available on the custom domain. Apps, Equipment, ADConsole and other site files remain byte-identical.

Evidence: [focused screenshots and results](client/qa/m031/artifacts/), [full verification log](client/qa/m031/artifacts/verification.log), [visual metrics](client/qa/m031/artifacts/visual.json), [verification summary](client/qa/m031/artifacts/verification-summary.json). [RELEASING.md](RELEASING.md) records the autonomous Git/Railway/fresh-frontend workflow.

## Live verification boundary

Owner central verification and admin bootstrap completed against the real production database through the approved Railway connection; the new Scheduler deployment is healthy and its admin route rejects anonymous access. A normal production sign-in is still required to finish observing authenticated HTTP and WebSocket behavior through the actual owner's browser session. The sign-in tab is open. No support token was minted, no production test document was created, and mocked QA is not claimed as live-auth proof. Final URLs, commit hashes and deployed versions are reported with the release handoff.
