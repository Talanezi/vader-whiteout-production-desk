# M03 production-wide team access correction

This document supersedes the original M03 environment-ID allowlist and document-membership authorization design.

## Authorization

Every Shot Lists request still authenticates through the existing Scheduler `/api/me` session verifier. Scheduler now returns a separate, server-verified `productionMembership` claim. Production Desk requires that claim to match the authenticated account ID, normalized email, current department and current role, with a valid verification timestamp.

Eligible assignments, matching the actual Scheduler role catalogue:

| Department | Equal-access Shot Lists roles |
|---|---|
| Production | Executive Producer; Producer; Co-Producer; Associate Producer; 1st Assistant Director; 2nd Assistant Director |
| Creative | Director; Director of Photography |

Self-selected signup roles never grant access. Independently verified members in other roles remain denied. All eligible collaborators have the same editing rights across all documents.

List discovery queries all existing documents. Session, export, import and WebSocket authentication check central eligibility and document existence. Creation no longer enrolls members. `SHOTLIST_COLLABORATOR_IDS` is unused, and `shot_list_members` is no longer read or written by application authorization. Its original migration/table remains intact for safe history and rollback; no table or data is dropped or rewritten.

WebSocket authentication, inbound revalidation and idle revalidation use the same rule. Revalidation refreshes the entire identity, including membership and assignment, before allowing further messages after the 30-second freshness window. Idle revocation disconnects within that window (plus an in-flight Scheduler request). HTTP denial is effective on the next request. An authority outage fails closed; no fallback trusts profile roles or legacy grants. Exact origin checking, canonical document IDs, token transport, persistence and all other M03 behavior remain.

## Central verification and release requirements

Inspection of the actual Scheduler repository found no existing authoritative team-membership model. The smallest centralized mechanism uses its existing protected server `Config` table and a database-operator CLI. No new table, secret, admin UI or public membership-write endpoint is introduced.

A trusted production operator checks the person's actual crew membership, assignment and ownership of the Scheduler account against independent evidence, then verifies the account once by email. The CLI resolves/binds the immutable Scheduler account ID and records the operator, evidence reference and timestamp, with a separate audit entry. This is central crew onboarding, not per-document permission or an editing-approval workflow. Signup/email confirmation alone cannot establish it. See [Scheduler operator guide](../vader-whiteout-scheduler/PRODUCTION-TEAM.md) for exact commands and trust boundaries.

Before release: release Scheduler's membership response and this Production Desk policy, and verify the real confirmed team centrally. Empty/unverified registries intentionally deny Shot Lists access. The original M03 initial table migration, allowed-origin configuration and single-writer deployment prerequisites still apply if M03 has not yet been released. This correction adds no migration. No production changes were performed here. No new Railway variables or per-person deploys are required. The obsolete ID variable may be removed later but is ignored even if retained. Existing documents become accessible automatically with no membership backfill or production data migration.

## Local verification

```sh
node qa/m03/scheduler-prepare.cjs --install
node qa/m03/prepare.cjs
```

Then start the existing local stack/frontend as documented in [qa/m03/README.md](qa/m03/README.md). Its loopback-only identity authority uses the actual compiled Scheduler verification helper with controlled team records. The full runner includes `qa/m03/team-access.cjs`, which exercises actual Scheduler registry/admin/response/DTO code and the real Production Desk HTTP/WebSocket implementation. No production server, database or credentials are used.

Results: [team-access.json](client/qa/m03/artifacts/team-access.json), [access verification log](client/qa/m03/artifacts/access-verification.log), [access build log](client/qa/m03/artifacts/access-build.log).

No frontend source or visual design changed. No dependencies, existing migrations or published bundles changed. No commit, push, merge or deployment was performed.

Verification completed: actual Scheduler server build, Production Desk frontend/backend builds, five central team-access groups, nine collaboration groups, four security/migration groups, five UI workflow groups, browser/viewport/WebKit/zoom/Metal checks, three import tests, three roster parser tests and all 21 M02 groups passed. See [access-verification-summary.json](client/qa/m03/artifacts/access-verification-summary.json). The complete Scheduler authentication/calendar E2E suite was not run; its membership registry/admin/user-response/DTO code was exercised directly against disposable local PostgreSQL.
