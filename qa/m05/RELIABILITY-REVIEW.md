# Connectivity remediation and release evidence

This continues `7fcf4723` and the complete M03–M05 acceptance matrix. The first
application release is preserved, not rebuilt. The owner's new reliability
contract supersedes the earlier emergency publishing priority. The prepared
website bundle was held locally while this work was completed.

## Incident and evidence

The reported Safari hostname-not-found failure concerns the separate Railway API,
not the successful main-site HTML. An accompanying CORS message is not proof of a
CORS configuration defect (MDN CORS request-did-not-succeed guidance).

Here, the existing Desk/Scheduler Railway origins resolve through the system,
Cloudflare and Google resolvers, have valid public TLS and return appropriate
unauthenticated 401s. Thus the original residential failure is not independently
reproduced. A resolver/filter/routing failure affecting the Railway hostname remains
a hypothesis, not a proven diagnosis. No claim is made that the original home
network has been retested or fixed. Residential/university/cellular networks and
physical iOS devices are unavailable. External GitHub runner evidence is separate
from this local network; two DNS resolver checks are not two physical networks.

## Public routing

- Website: `https://vaderwhiteout.com/productiondesk/` (GitHub Pages, existing Cloudflare).
- Desk API/WSS: `https://api.vaderwhiteout.com/api` (existing Desk service, port8080).
- Scheduler API: `https://scheduler-api.vaderwhiteout.com` (existing service, port3000).
- Large artwork uploads: `https://uploads.vaderwhiteout.com/api/storyboards`
  (same Desk service, DNS only). Files above90MiB use this route, preserving the
  established128MiB server limit despite Cloudflare's100MB proxy ceiling.
- Existing Railway hostnames remain configured and working for rollback. Desk's
  server-to-Scheduler verification configuration remains unchanged.
- Existing Google registered callback remains the original Railway `/redirect/google`
  URL. It was not silently changed without updating Google's registration. Normal
  frontend API calls use the new first-party hostname; Microsoft is not enabled.

Railway issued the actual CNAME and ownership TXT values. DNS-only configuration
was verified and valid origin certificates issued before API/Scheduler proxying.
Cloudflare already used Full encryption, IPv6 support and WebSockets enabled; no
zone-wide TLS downgrade, WAF disable or unrelated DNS/site change was made. The
working root GitHub Pages and email records are preserved. Private APIs send
`Cache-Control: no-store, private`; actual proxy checks must remain DYNAMIC/BYPASS,
never a shared cache hit. No public R2 bucket or second document store is added.
The owned hostnames provide an alternative to the reported Railway-domain DNS path,
Cloudflare edge routing and IPv6; they are not proof against every external outage.

## Implemented recovery

Production Desk now has shared bounded requests:20s ordinary reads, longer PDF,
source and artwork deadlines; two bounded safe-read retries with jitter and capped
Retry-After. Mutations are not automatically replayed. Cancellation remains active
through response-body consumption. Network/timeout/401/403/429/5xx/conflict outcomes
remain distinct; only actual401 enters the expired-session presentation.

Scheduler requests have a20s bound. Server-info outages offer a native recovery
panel/Retry, preserve the route and return destination, and do not spin forever.
Profile/Settings transient failures no longer redirect as if access were revoked.
RTK online/focus listeners are registered. Token removal remains restricted to
actual401 or successful sign-out. Diagnostic logs no longer include callback
nonce values, raw session errors or URL query strings.

Desk no longer turns Scheduler429/5xx/network failures into401. Verification is
bounded and fails closed with503, keeping the session distinguishable from revoked
access. Collaboration revalidation closes transient failures with retryable1013;
real401/403 remains4401/4403. One redundant `/auth/me` verification was removed:
the controller reuses its already-verified guard result.

Pending M03/M04/M05 edits use bounded account/document-scoped CRDT deltas in device
storage. Recovery occurs only after fresh authorization and initial server sync,
then merges through the existing Yjs provider. No stale full snapshot overwrites a
newer document. Clear occurs only after matching durable server acknowledgment.
The Shoot Log retains its separate idempotent server-action FIFO. Quota failure
explicitly requires keeping the window open; this is not an unlimited offline app.
Different accounts never automatically apply another account's pending deltas.

Both services have DB-aware readiness endpoints with bounded SELECT1, deployment
revision and no secrets/private data. Railway healthcheck configuration is tracked.
This checks rollout readiness, not continuous uptime. Safe structured diagnostics
include request ID/category/status/duration/revision, never tokens or document
payloads. CORS is restricted to established frontend origins and explicitly
configured development origins; credentials and permissions are not weakened.

## Focused evidence

- `reliability-model.cjs`: bounded retries/deadline/cancel,401/403/429/5xx,
  connection refusal, invalid self-signed TLS safely rejected, no blind mutation
  retry; account-isolated CRDT recovery merging newer peer edits.
- `reliability-auth.cjs`: authoritative401/403 versus temporary429/5xx/network
  failure; correct503/WS1013 and valid claims.
- `reliability-browser.cjs`, Chromium/WebKit: real browser503 and DNS failures,
  bounded attempts,403 no retry, preserved token, successful recovery; M03 offline
  edit survives reload/authorization/confirmation; Scheduler DNS failure and Retry
  preserve login return destination; invalid callback is rejected with a recoverable
  sign-in message and no acceptance of the supplied token (both browsers).
- `reliability-drafts.cjs`: actual offline Flow instruction and completed VectorCraft
  brush stroke survive reload and merge; browser coverage is reported per result.
- Existing `shoot-log-http.cjs` and `refinement-shared.cjs` rerun: authoritative
  logging/HTTP/WS/restart/idempotence, source take/color/palette/description sharing,
  M03/Flow PDF and ZIP preservation.
- Earlier full M03–M05, print, import, scheduling and Chromium/WebKit acceptance
  remains valid and is linked in REFINEMENT-ACCEPTANCE.md. No unrelated stress rerun.

Scheduler exact isolated frontend/backend builds are used. The existing six unused
availability-template lint warnings remain; the normal production build succeeds.
Using a different TypeScript version exposed baseline Buffer typing conflicts;
verification uses Scheduler's actual locked4.9 compiler, not an unrelated newer one.
Temporary cleanup removed dependency files during this pass; the exact locked
runtimes were restored, with Desk's runtime preserved in `.local-qa-m05/runtime`.
No source, production database or artwork was reset.

## External operations

`.github/workflows/public-service-monitor.yml` runs from GitHub-hosted infrastructure
outside Railway, twice hourly and on demand. No secrets or private data are required.
It checks website HTML, readiness/revisions, protected401 boundaries, DNS through
system/Cloudflare/Google, TLS and a validated WebSocket upgrade. It records sanitized
JSON artifacts for seven days and uses ordinary GitHub Actions failure notifications.
The transport probe does not claim authenticated collaboration or synthetic login.
Real authorized smoke is separate; no unattended owner credentials are stored.

## Release gates and limits

A: Product implementation and focused reliability tests/builds must pass.
B: Scheduler/Desk readiness and revisions, fresh scoped website build, actual served
asset hashes, authorized read-only app/PDF/WS smoke and unchanged production hashes.
C: Independent monitor run and explicit uncertainty about the original network.

Production write/destructive tests remain isolated locally. Baseline4 Flows,
2 Shot Lists/23 active shots,5 Storyboards/84 assets,7 Call Sheets,26 roster entries
must be compared without changing records. No SQL migration is introduced here.
No M06 or owner-acceptance claim. Final actual deployed revisions/monitor outcomes
are saved with the release evidence and final report, not assumed from a build.

Final transport smoke: Chromium actual M03 PDF and Flow production-log preview/download
byte consistency, shared empty/error states and phone account menu pass after the
shared request helper was wired into PDF and sign-out. Both Desk typechecks pass.
