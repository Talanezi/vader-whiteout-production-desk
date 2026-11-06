# VADER: WHITEOUT — FINAL M03–M05 CONTINUATION, CONNECTIVITY REMEDIATION & PRODUCTION RELIABILITY CONTRACT

**Classification:** Binding continuation and engineering contract  
**Execution:** Existing Codex implementation session  
**Scope:** Production Desk, Scheduler, their shared integration points, and required deployment infrastructure  
**Release target:** Complete and safely deploy the outstanding M03–M05 implementation and reliability improvements  
**Authority:** Owner-approved product decisions and existing implementation contracts

---

# 0. READ THIS FIRST — THIS IS A CONTINUATION, NOT A NEW PROJECT

You are continuing the substantial implementation work already underway on Vader: Whiteout.

Your previous execution ran for more than two hours, implementing and verifying significant M03–M05 improvements, including the new Shoot Log. The session ended before the final deployment could be completed.

The owner has now identified an additional production-readiness concern involving a collaborator who could load the main website but could not reliably access the functional applications.

This contract consolidates:

1. All unfinished requirements from the existing M03–M05 completion contract.
2. All approved refinements to M03 Shot Lists.
3. All approved additions to M04 Storyboards.
4. The M05 Flow of the Day completion requirements.
5. The separately approved three-workspace Shoot Log amendment.
6. The newly identified backend connectivity incident.
7. Broader application and infrastructure reliability requirements.
8. Final verification, production deployment, and handoff requirements.

**This contract is additive and corrective. It does not supersede unrelated existing requirements.**

The previous emergency instruction to prioritize immediate deployment was a response to usage limitations. That urgency is no longer the governing priority.

You may finish the remaining implementation properly, complete the necessary verification, investigate the connectivity issue, and deploy through the established release process.

There is no requirement to cut corners merely to deploy quickly.

## 0.1 Mandatory continuation behavior

- Continue from the exact current repository and implementation state.
- Preserve all completed and validated changes.
- Read the previous active implementation contract and the Shoot Log amendment.
- Treat historical prompts as evidence of decisions, not independent active instructions.
- Do not restart implementation from scratch.
- Do not create an unrelated roadmap.
- Do not revert accepted M03 or M04 functionality.
- Do not rewrite working systems merely because an alternative architecture seems attractive.
- Do not redo already completed work without identifying an actual defect.
- Do not discard successful tests or checkpoints.
- Do not force an immediate deployment before the implementation is ready.
- Do not stop at an investigation report when the problem can be safely corrected.
- Do not substitute a proposal for the implementation of requirements already approved.

**Your responsibility is to finish the existing assignment, address the new reliability concerns, verify the result, and release it safely.**

The owner will perform the final product acceptance review.

---

# 1. ESTABLISH THE EXACT CURRENT STATE BEFORE CHANGING ANYTHING

Do not assume that the previous session's last visible message precisely describes the current Git state.

The previous execution may have committed additional work, produced QA artifacts, staged frontend changes, or left partially completed modifications.

Begin by inspecting the actual state of the relevant repositories and deployment environments.

## 1.1 Repository recovery

Inspect the relevant existing repositories, including:

- `vader-whiteout-production-desk`
- `vader-whiteout-scheduler`
- `vader-whiteout-site`

Confirm their actual paths, branches, remotes, and responsibilities rather than assuming a working directory.

Determine:

- Latest local commits.
- Latest pushed commits.
- Uncommitted modifications.
- Untracked implementation files.
- Current source-tree consistency.
- Pending migrations.
- Existing test reports.
- Generated production frontend bundles.
- Previous release evidence.
- Current deployment revisions.
- Any changes made after the last successful test run.

Do not reset, clean, force-push, overwrite, or otherwise discard unfinished work.

If necessary, create a safe checkpoint of the current implementation before proceeding.

Respect the existing separation between the Production Desk source repository, the Scheduler authority, and the website publication repository.

Do not modify the Equipment application or unrelated website files.

## 1.2 Recover the previous implementation status

Review available session artifacts and repository documentation to determine which tasks are:

- Implemented and verified.
- Implemented but awaiting final testing.
- Partially implemented.
- Not yet implemented.
- Blocked by external infrastructure.
- Already deployed.
- Prepared for deployment but not published.

Do not equate an incomplete progress message with incomplete source code.

Similarly, do not assume that a test from before the final modifications remains sufficient evidence for the latest revision.

Reconcile the previous reported successes with the actual current code.

## 1.3 Preserve production data

Before any production mutation, establish a fresh read-only baseline for the existing data.

Include, where applicable:

- Shot Lists.
- Storyboards.
- Storyboard artwork and thumbnails.
- Call Sheets.
- Flow of the Day documents.
- Shoot Log records.
- Roster entries.
- Authentication-related records.
- Existing private storage assets.

Use appropriate counts, schema identifiers, and non-sensitive integrity hashes.

Preserve the existing PostgreSQL database and Cloudflare R2 data.

Do not reset fixtures against production, recreate production documents, replace real artwork, or use destructive migration techniques.

The production environment contains real work and must be treated accordingly.

---

# 2. PRESERVE THE OWNER-APPROVED PRODUCT CONTRACT

A critical distinction must be maintained:

**ChatGPT and the owner designed the application. Codex implements the approved specifications.**

The prior contracts contain deliberate product decisions concerning:

- Information architecture.
- Interaction patterns.
- Visual identity.
- Feature scope.
- Collaboration.
- Editing behavior.
- Film-production terminology.
- Document printing.
- Mobile behavior.
- Backend authority.
- Data synchronization.

You must not casually reinterpret those decisions.

Use engineering judgment to implement them correctly, but do not replace approved product behavior with an easier generic alternative.

## 2.1 Visual quality is universal

The accepted M03 and M04 interfaces remain the benchmark.

The visual standard applies to every interface, including secondary surfaces:

- Dashboards.
- Editors.
- Popovers.
- Dropdowns.
- Context menus.
- Dialogs.
- Side inspectors.
- Date/time pickers.
- Import workflows.
- Print previews.
- Bulk-action controls.
- Empty states.
- Loading states.
- Error states.
- Connection recovery.
- Authentication screens.
- Mobile interactions.

Use existing Whiteout components wherever appropriate.

Avoid oversized, primitive, redundant, or poorly aligned text buttons.

Preserve the established animation language, hierarchy, spacing, typography, focus behavior, motion and micro-interactions.

A feature that technically works but looks unfinished does not satisfy the contract.

## 2.2 Preserve the accepted M03/M04 functionality

M03 Shot Lists and M04 Storyboards are already accepted milestones.

They are receiving approved additions, not full redesigns.

Do not reopen old design decisions or rebuild either application.

Implement outstanding additions and preserve everything already accepted.

---

# 3. COMPLETE ALL REMAINING M03 SHOT LIST REQUIREMENTS

Retain every previously approved requirement.

At minimum, verify the following.

## 3.1 Row coloring

Provide the approved ability to color Shot List rows for organization.

The interaction must use the existing premium Whiteout visual language.

Color selections must persist and synchronize correctly.

Colors must not conflict with timing status or other semantic indicators.

Ensure that collaborators see the intended row styling.

## 3.2 Dedicated AD View

Complete the First Assistant Director-oriented Shot List view.

It should provide the information an AD actually needs without forcing the full cinematography/technical interface onto that role.

Preserve the specific approved field selections and editing behavior from the original contract.

Ensure Best Take is appropriately visible and editable.

## 3.3 Best Take synchronization

Best Take must use authoritative shared records.

Where the approved workflow requires edits from Flow of the Day or Shoot Log, those edits must synchronize correctly with M03.

Avoid disconnected duplicate values.

Preserve take provenance where repeated shots or multiple shooting days are involved.

## 3.4 Canonical shot identifiers

Preserve the established canonical scene-and-shot naming behavior.

Shot numbers should consistently include their scene identifier and letter suffix, following the accepted convention such as `09-A` or `10-B`.

Handle legitimate multi-letter suffixes under the previously agreed naming contract.

Do not destructively rewrite historical references without a migration-safe identifier mapping.

## 3.5 Regression protection

Do not damage:

- Existing Shot List document data.
- Collaborative editing.
- Layout modes.
- Shot reordering.
- Import/export.
- PDF rendering.
- The accepted M03 animation system.
- Shot references used by Storyboards and Flow.

---

# 4. COMPLETE ALL REMAINING M04 STORYBOARD ADDITIONS

The Storyboard application is already accepted.

Preserve its drawing engine, Studio, imports, collaboration, navigation and general interface.

## 4.1 Twelve-color palette

Complete the approved palette behavior.

The user must be able to maintain a stable set of colors without the palette unexpectedly shifting or evicting previously chosen colors.

Changing a selected palette slot must modify that slot rather than silently rearranging the palette.

Do not compromise the existing drawing performance or brush behavior.

## 4.2 Visual Description

Use the approved **Visual Description** terminology.

Ensure the field is convenient to access and edit.

It should not require unnecessarily navigating through multiple hidden interface layers.

Preserve synchronization and document persistence.

## 4.3 Storyboard printing

Preserve the established default portrait layout with six panels per page.

Provide the approved eight-panel option.

Include the appropriate shot number and Visual Description beneath each panel rather than showing only generic "Panel 1", "Panel 2", and similar labels.

Use the agreed print defaults and preserve the existing working PDF generation.

Do not introduce artwork cropping, rendering corruption, or pressure-stroke export regressions.

---

# 5. COMPLETE THE EXISTING M05 FLOW OF THE DAY CONTRACT

M05 has received extensive product planning and multiple implementation passes.

Do not rebuild it as a generic spreadsheet.

It is a filmmaking-specific production scheduling and departmental coordination system.

Preserve and complete its intended information architecture and functionality.

## 5.1 Department Flow

Preserve:

- The production-day schedule.
- Shot List integration.
- The authoritative scene/shot references.
- Editable departmental instructions.
- Appropriate department defaults.
- Custom departments.
- Department ordering and visibility.
- Inline editing.
- Collaboration.
- Schedule duration behavior.
- Search and bulk actions.
- The accepted visual layout.

Ensure Talent information derives appropriately from relevant Shot List subject/cast data.

Avoid unnecessarily duplicating talent information under Current Action when the intended destination is the Talent column.

Keep shot descriptions appropriately visible.

## 5.2 DP estimate and AD allotment

Preserve the distinct concepts:

- DP estimated duration.
- AD allotted duration.
- Planned start.
- Actual recorded timestamp.

Do not silently conflate them.

The AD must be able to adjust the daily allotment without destroying the original DP estimate.

Preserve the exact approved synchronization boundaries with M03.

## 5.3 Time Map

Preserve and complete:

- Accurate time positioning.
- Shot duration geometry.
- Adaptive visual density.
- Short-shot readability.
- Zoom and Fit Day.
- Department lanes.
- Activity timing relationships.
- Independent activity offsets.
- Responsive widths.
- No wasted horizontal space after closing Shot Rail.
- Correct unscheduled states.
- Appropriate editing and drag behavior.

A very short shot must not turn into unreadable overlapping labels.

Time Map should communicate the actual schedule effectively, not merely render fixed-size blocks.

## 5.4 Department layout controls

Preserve approved column customization.

Users must be able to:

- Add departments.
- Rename departments.
- Reorder departments.
- Show/hide departments.
- Manage personnel.
- Use appropriate presets.
- Access controls naturally from the relevant workspace.

Maintain the approved, refined menu design.

Avoid excessively literal repetitive menus such as large lists of "Hide Department" text actions without clear visual structure.

## 5.5 Document creation and activities

Preserve the revised creation workflow, custom Whiteout date/time controls, and simplified production-day semantics.

The production operates according to a single local shooting-day clock.

Do not reintroduce unnecessary user-facing timezone configuration.

Support AM/PM and correct date rollover across midnight.

Preserve the approved activity creation model.

Do not reintroduce obsolete status fields, meaningless Start Now actions, redundant comments, or backend-like technical forms.

## 5.6 Print Studio

Printing is a primary feature, not an afterthought.

Preserve:

- Master Departmental Flow.
- Department Focus.
- Daily Rundown.
- Relevant production-log output.
- Correct department order.
- Department selection.
- Beautiful typesetting.
- Appropriate page numbering.
- Continuous page previews.
- PDF downloads.
- ZIP packaging where approved.

Ensure the approved Tabloid layout can present the intended departmental composition without unnecessary overflow onto a second horizontal section.

Preserve print readability, meaningful column widths, and appropriate pagination.

Use the standardized title format:

`Flow of the Day - [document title]`

Do not add internal revision hashes, unnecessary status labels, or technical timezone strings to printed headers.

Avoid unnecessary storage of generated PDFs or ZIP files in persistent R2 storage.

Prefer the established on-demand export behavior, ensuring private files are not exposed and temporary resources are cleaned up.

## 5.7 Shared application shell

Complete the approved consistency improvements:

- Unified empty states.
- Consistent Create menu.
- Appropriate sign-out/account access.
- Consistent animations.
- Consistent component spacing.
- Correct loading and error states.

Preserve existing role-based security while ensuring authorized production-team collaborators have the intended application visibility.

Do not confuse broad view access with unrestricted editing or administrative privileges.

---

# 6. SHOOT LOG — THE THREE-WORKSPACE AMENDMENT IS FINAL

The previously approved Shoot Log design supersedes the old Live Progress banner.

M05 must have three connected workspaces:

1. **Department Flow:** Plan the production day.
2. **Time Map:** Visualize planned timing and department activities.
3. **Shoot Log:** Record actual production timestamps and evaluate progress.

The old oversized Live Progress banner above Department Flow must not return.

Shoot Log is a dedicated workspace.

It is not merely a stopwatch attached to the scheduling document.

## 6.1 Primary recording model

The AD records actual shot-start timestamps.

These may be entered:

- At the moment a shot begins.
- A few minutes afterward.
- Later in the day.
- After the shoot.
- Out of chronological entry order.

A running timer is not required.

An optional Use Current Time shortcut may exist.

## 6.2 Desktop Shoot Log

Provide the approved structure:

- Compact production summary.
- Directly editable timestamp ledger.
- Optional contextual inspector.
- Best Take access.
- Planned-versus-actual comparisons.
- Cumulative variance visualization.
- Missing and inconsistent entry indicators.

The ledger should prominently show:

- Shot number.
- Action description.
- Planned start.
- DP estimate.
- AD allotment.
- Actual start.
- Calculated interval.
- Timing performance.
- Best Take.

Prioritize fast editing and excellent keyboard behavior.

Do not require a separate modal for every timestamp.

## 6.3 Mobile Shoot Log

The mobile interface is a major requirement.

Use an intentionally designed, vertically scrolling shot-card interface rather than shrinking the desktop spreadsheet.

Provide:

- Compact summary information.
- Prominent shot identities.
- Planned and actual times.
- Easy timestamp entry.
- Corrections.
- Preferred-take access.
- Large touch targets.
- A custom Whiteout time-entry sheet.
- No required horizontal scrolling for core logging.

Preserve an excellent tablet experience as well.

## 6.4 Timestamp integrity

Support:

- Backfilling.
- Out-of-order entries.
- Corrections.
- Skipped shots.
- Midnight rollover.
- Breaks and gaps.
- Repeated shooting occurrences.
- Audit history.
- Reload persistence.
- Concurrent editing.
- Safe reconnection.

Distinguish start-to-start intervals from confirmed shooting-block durations.

Do not classify an interval containing an unrelated break as pure shooting duration.

## 6.5 Timing zones

Preserve:

- Green: Within DP estimate.
- Yellow: Above DP estimate but within AD allotment.
- Red: Beyond AD allotment.

Distinguish:

- Shot-budget variance.
- Schedule-clock variance.

Never calculate invented lateness from the user's current device clock when no actual production progress has been recorded.

## 6.6 Current implementation

The previous session reported successful tests for substantial portions of Shoot Log.

Inspect and preserve those implementations.

Do not rewrite functioning timing infrastructure merely to satisfy the visual amendment.

Complete only the remaining defects and any requirements not actually implemented.

---

# 7. NEW RELEASE-CRITICAL ISSUE — PUBLIC BACKEND REACHABILITY

The owner has received direct evidence of a significant connectivity failure affecting an external collaborator.

The issue must be investigated as a potential product-wide reliability concern, not dismissed as a single user's problem.

The intended product is a professional collaborative platform.

Users should not ordinarily need to change DNS providers, install VPN software, or troubleshoot infrastructure to access it.

## 7.1 Confirmed incident evidence

The main website was accessible:

`https://vaderwhiteout.com`

A terminal HTTPS test returned HTTP 200 in approximately 0.21 seconds.

However, Safari reported:

`A server with the specified hostname could not be found.`

It also reported an unsuccessful Fetch API request to:

`https://vader-whiteout-production-desk-production.up.railway.app/api/callsheets`

The browser additionally displayed an access-control-related fetch error.

Both Safari and Chrome exhibited application-loading problems.

The authentication flow through Scheduler also experienced endless loading and a fetch-like failure.

The exact Scheduler error and failing endpoint remain unverified.

The failure occurred on a normal residential internet connection. Other websites generally worked, although some media-heavy services loaded relatively slowly.

A cellular-hotspot test was attempted, but its result was inconclusive.

The primary website's successful DNS and HTTPS tests do not establish connectivity to the separate backend hostname.

## 7.2 Critical interpretation rules

Do not assume:

- CORS is the root cause.
- Railway was globally down.
- The user's device is defective.
- The residential network is solely responsible.
- Scheduler has the identical failure.
- Redeployment will fix the problem.
- Changing DNS settings is an acceptable permanent remedy.
- A custom domain necessarily solves every problem.

The hostname-not-found error is an important diagnostic clue, not a proven infrastructure diagnosis.

A browser may report an access-control failure when the underlying request failed before a valid HTTP response was received.

Reference:

https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS/Errors/CORSDidNotSucceed

**Diagnose the actual failing layer before modifying infrastructure.**

---

# 8. INVESTIGATE THE COMPLETE BROWSER-TO-BACKEND ARCHITECTURE

This investigation must cover Production Desk and Scheduler together while distinguishing their individual failure paths.

## 8.1 Discover the actual architecture

Inspect the running configuration and relevant source code.

Determine:

- Frontend public origins.
- Production Desk API origin.
- Scheduler API origin.
- Authentication redirect destinations.
- OAuth/session callbacks, if applicable.
- WebSocket destinations.
- Internal service-to-service paths.
- Public Railway domains.
- Existing custom domains.
- Cloudflare DNS and proxy configuration.
- Relevant environment variables.
- Deployed frontend URL construction.
- Currently active backend revisions.

Do not rely on assumptions from historical prompts.

Identify the actual deployed endpoints used by the current frontend bundles.

## 8.2 Detect stale or invalid URLs

Check for:

- Hardcoded old Railway hostnames.
- Incorrect environment variables.
- Build-time URL mismatches.
- Inconsistent HTTP and WebSocket origins.
- Outdated authentication callbacks.
- Incorrect hostname handling.
- Incorrect Railway port or routing configuration.
- Stale frontend assets referring to deprecated services.

A healthy backend does not help if the frontend calls an invalid hostname.

Correct any verified configuration defect at its source.

## 8.3 Verify each network layer

For each relevant public backend, test:

1. DNS resolution.
2. HTTPS connection establishment.
3. TLS handshake and certificate validity.
4. HTTP response.
5. API route behavior.
6. Authentication.
7. WebSocket upgrade.
8. Authenticated WebSocket communication.
9. Reconnection behavior.

Distinguish the following failure classes:

- DNS failure.
- TCP or routing failure.
- TLS failure.
- HTTP 404.
- HTTP 401/403.
- HTTP 429.
- HTTP 5xx.
- CORS misconfiguration.
- Client timeout.
- WebSocket negotiation failure.
- Authentication/session failure.
- Application runtime failure.

A protected API returning an appropriate 401 response can demonstrate network reachability, even though it does not demonstrate successful authorization.

Do not treat every unsuccessful HTTP response as an outage.

## 8.4 Compare independent resolution paths

Where useful, compare:

- System resolver.
- Independent public DNS resolvers.
- IPv4.
- IPv6.
- Working network.
- Different external network.
- Browser behavior.
- Command-line HTTPS behavior.

Record observations without logging credentials.

If one DNS resolver fails while another works, investigate that difference.

If DNS succeeds but the connection times out, investigate routing or TLS.

If requests reach the backend but fail authorization, investigate session handling.

Do not solve a network-layer failure by randomly changing CORS settings.

## 8.5 Investigate Scheduler independently

Trace the complete sign-in path:

Production Desk → Scheduler → authentication service → session establishment → return to Production Desk → protected API → collaboration connection.

Identify the actual failing step.

Prevent endless loading or redirect loops.

Preserve existing authentication authority and session security.

Do not replace Scheduler or build a second authentication system.

---

# 9. ESTABLISH STABLE, CONTROLLED PUBLIC BACKEND ACCESS

A key objective is to minimize avoidable exposure to unreliable or uncontrolled public endpoint configurations.

The owner specifically wants robust, professional infrastructure suitable for broader use.

**Evaluate and, where technically justified, implement stable first-party backend access.**

This does not mean automatically adding an unnecessary proxy or replacing Railway.

## 9.1 Candidate architecture

A controlled first-party API hostname is a serious option.

For example:

`api.vaderwhiteout.com`

A separate appropriate authentication hostname may also be useful.

These are examples, not assumed existing production records.

Determine the correct architecture based on the actual services.

Potential options include:

- Railway custom domains.
- Cloudflare-proxied first-party API domains.
- A validated same-origin API routing layer.
- Retaining the existing route with corrected configuration if evidence shows that a migration is unnecessary.

Prefer the simplest architecture that measurably improves reachability and maintainability.

## 9.2 Railway requirements

Follow current Railway documentation:

https://docs.railway.com/networking/domains/working-with-domains

Verify:

- Correct service-domain association.
- Correct CNAME.
- Required ownership-verification TXT record.
- Actual listening port and target port.
- Domain verification.
- TLS behavior.
- Hostname compatibility.
- Successful routing to the intended active revision.

Do not invent DNS record values.

Do not assume adding a DNS record means the domain is ready.

Do not delete existing working domains until replacements are validated and rollback is feasible.

## 9.3 Cloudflare requirements

If using Cloudflare proxying, inspect:

- Proxy status.
- DNS resolution.
- Railway's current Cloudflare integration requirements.
- TLS mode.
- Certificate validation.
- WebSocket support.
- WAF challenges.
- Rate limits.
- Cache rules.
- Authentication redirects.
- Cookie behavior.
- Header forwarding.
- Origin behavior.

Reference:

https://developers.cloudflare.com/network/websockets/

https://developers.cloudflare.com/cache/troubleshooting/dynamic-content-and-login-issues/

Do not broadly change global TLS settings without evaluating their effect on unrelated site services.

Do not disable security protections merely to make an error disappear.

## 9.4 No incorrect API caching

Authenticated API responses, private documents, session responses, and collaboration traffic must not be incorrectly cached.

Static versioned frontend assets may continue using their established caching strategy.

Ensure private information is never cached across users.

Do not cache authentication callbacks or session-establishment responses in a way that strips or corrupts cookies.

Test real sign-in and session continuity after any routing changes.

## 9.5 WebSocket compatibility

Production Desk's collaboration relies on persistent connections.

If the public routing changes, verify:

- Successful WebSocket upgrades.
- Authentication and authorization.
- Correct origin checks.
- Heartbeats/keepalives.
- Reconnection after interruption.
- Appropriate close handling.
- Multiple-client synchronization.
- Recovery from temporary connection loss.

Cloudflare may terminate long-lived connections during infrastructure events, so reconnect behavior must be robust.

Do not make a frontend API-domain migration that silently breaks the collaboration layer.

## 9.6 Measure actual improvement

A first-party hostname is not inherently proof of better network reliability.

Compare the old and new paths.

Document:

- DNS behavior.
- TLS behavior.
- HTTPS reachability.
- Browser access.
- WebSocket functionality.
- Login flow.
- Performance.
- Known limitations.

If the proposed architecture cannot demonstrate a meaningful improvement or introduces serious compatibility risks, do not deploy it merely for cosmetic domain consistency.

Document the evidence-supported alternative and complete the appropriate fix.

---

# 10. FRONTEND NETWORK RELIABILITY — NO INDEFINITE LOADING

Regardless of the original incident's cause, the ecosystem must handle ordinary backend failures intelligently.

An unreachable API must not leave an application loading forever without useful feedback.

Establish a shared Whiteout networking and request-state contract.

## 10.1 Required user-visible states

Support appropriately distinct states for:

- Initial loading.
- Delayed loading.
- Network unavailable.
- Backend temporarily unavailable.
- Request timeout.
- Authentication expired.
- Access denied.
- Rate limited.
- Save pending.
- Save failed.
- Reconnecting.
- Connection restored.
- Recoverable conflict.

Do not show generic technical error strings directly to ordinary users when a useful human explanation is possible.

Do not treat a network failure as a permission denial.

Do not treat a permission denial as a network failure.

Do not create endless authentication loops.

## 10.2 Timeouts

Use explicit, appropriate timeout and cancellation behavior for network operations.

Different operations may need different limits:

- Initial data requests.
- Ordinary reads.
- Saves.
- Uploads.
- PDF generation.
- Long-lived WebSocket connections.

Do not apply one arbitrarily short timeout to all operations.

Do not abort a legitimate large upload or PDF process merely because it takes longer than a simple API read.

Users should not encounter endless spinners without progress, timeout handling, or meaningful recovery options.

## 10.3 Retry policy

Use bounded retry behavior with backoff and jitter where appropriate.

Be careful about mutation safety.

Safe reads may generally be retried.

Authenticated requests must preserve security.

Do not blindly repeat a POST or collaboration mutation if its first attempt may already have succeeded.

Use appropriate operation identifiers, deduplication, or reconciliation.

Retrying must not produce:

- Duplicate shots.
- Duplicate Flow activities.
- Duplicate Shoot Log timestamps.
- Duplicate comments.
- Duplicate artwork uploads.
- Duplicate documents.

Do not overload a failing backend through aggressive retries.

## 10.4 Recovery without destroying the workspace

When a transient connection failure occurs:

- Preserve previously loaded valid data where safe.
- Indicate that the connection is interrupted.
- Preserve recoverable pending edits.
- Allow appropriate retry.
- Recover when connectivity returns.
- Do not unexpectedly reset the user's entire workspace.
- Do not falsely display Saved.
- Do not silently discard edits.

The UI must distinguish local pending state from server-confirmed state.

## 10.5 Consistent visual quality

Use the accepted Whiteout visual component system for connection and error states.

Do not introduce:

- Default browser alerts.
- Ugly generic error pages.
- Oversized warning banners.
- Primitive retry buttons.
- Unnecessary technical explanations.
- Poorly aligned dialogs.

A serious backend failure still deserves an elegant, understandable recovery interface.

---

# 11. DURABLE EDITING DURING INTERRUPTIONS

Production Desk is a collaborative editing application.

Temporary connection failures must not routinely destroy user work.

This is especially important for:

- Shot List editing.
- Storyboard drawing.
- Flow of the Day instructions.
- Shoot Log timestamp recording.
- Comments.
- Department configurations.

## 11.1 Verify existing save semantics

Inspect the current persistence and collaboration systems.

Identify what happens when:

- A request times out.
- A WebSocket disconnects.
- Railway restarts.
- The browser briefly loses connectivity.
- A user reloads while changes are pending.
- Two users change the same field.
- An operation succeeds server-side but its acknowledgment is lost.

Correct verified gaps.

## 11.2 Pending data handling

Where supported, preserve pending work until it can be confirmed or explicitly recovered.

Use the existing collaboration architecture wherever possible.

Do not claim durable offline support unless the data actually survives the expected interruption scenarios.

Do not create a second disconnected document store.

Any local persisted drafts must remain appropriately scoped to the authenticated user and production.

Prevent cross-account data leakage.

Respect logout and session-revocation semantics.

## 11.3 Concurrency

Preserve the existing multi-user collaboration rules.

Do not solve reconnect problems by overwriting the newest server document with a stale client snapshot.

Do not silently erase another collaborator's changes.

Preserve conflict-resolution behavior and revision integrity.

Do not make the application appear connected when its collaboration channel has permanently failed.

---

# 12. SCHEDULER AUTHENTICATION RELIABILITY

Scheduler is the authoritative sign-in system for Whiteout.

This relationship must remain intact.

## 12.1 Recoverable login

If authentication cannot reach a backend:

- Show an appropriate recoverable state.
- Do not redirect forever.
- Do not lose the intended return destination unnecessarily.
- Do not treat one timeout as confirmed revocation.
- Do not authorize a user without valid verification.
- Allow an appropriate retry.
- Preserve valid sessions where their security semantics permit.

## 12.2 Cross-application session handling

Verify that the Production Desk–Scheduler integration works after any domain or routing change.

Test:

- Fresh login.
- Existing session.
- Expired session.
- Sign-out.
- Account switching.
- Redirect continuation.
- Unauthorized access.
- Revoked access.
- Safari cookie behavior.
- Chrome cookie behavior.
- Authenticated API calls.
- Authenticated WebSockets.

Do not expand user permissions as a workaround for an authentication failure.

Do not loosen origin validation or cookie security merely to suppress an error.

## 12.3 Availability separation

Distinguish:

- Scheduler frontend availability.
- Scheduler backend availability.
- Production Desk API availability.
- Production Desk collaboration availability.

A successful HTML response does not prove that the complete application is functioning.

---

# 13. BACKEND SERVICE HEALTH AND RECOVERY

Inspect each relevant Railway service's production configuration.

Verify:

- Runtime startup.
- Correct listening port.
- Healthcheck path.
- Database dependencies.
- Deployment readiness.
- Resource utilization.
- Startup failures.
- Service restarts.
- Backend error rates.
- Public endpoint connectivity.
- Collaboration service availability.

## 13.1 Readiness versus uptime

Railway deployment healthchecks are useful for determining whether a new deployment is ready.

They do not provide continuous post-deployment uptime monitoring.

Reference:

https://docs.railway.com/deployments/healthchecks

Maintain that distinction.

A deployment marked healthy is not proof that the application remains reachable to external clients afterward.

## 13.2 Safe restart behavior

Test how the system behaves when a backend restarts.

Existing clients should not remain permanently broken.

Verify:

- Reconnection.
- Session continuity where valid.
- Resubscription.
- State reconciliation.
- Pending edit preservation.
- Collaboration recovery.
- Correct UI feedback.

Do not automatically redeploy or restart services merely to clear unexplained errors.

Find the cause where possible.

---

# 14. EXTERNAL MONITORING AND OPERATIONAL VISIBILITY

Implement a modest but meaningful production monitoring strategy.

Do not build a new administrative product.

Use existing provider capabilities and a suitable external monitoring mechanism.

## 14.1 Required monitoring coverage

Monitor publicly accessible services for:

- DNS reachability where supported.
- HTTPS availability.
- Readiness endpoints.
- Unexpected service errors.
- Authentication availability.
- Appropriate synthetic login behavior.
- WebSocket connectivity or representative collaboration health.
- Active deployment revision.

Use low-cost, appropriately scoped monitoring.

Avoid excessive polling that creates unnecessary infrastructure expense.

## 14.2 Independent monitoring locations

At least one monitoring path must originate outside Railway.

Where practical, use more than one independent network or geographic source.

The problem under investigation may not be visible from inside the hosting provider.

Monitoring only the application's internal database or service process would miss important client-facing failures.

## 14.3 Actionable signals

Monitoring should help answer:

- Which service is failing?
- Is DNS resolving?
- Is HTTPS responding?
- Is authentication functioning?
- Did a new deployment introduce the failure?
- Is the problem intermittent?
- Is there an elevated error rate?
- Has the service recovered?

Do not collect unnecessary user data.

## 14.4 Error classification

Improve structured diagnostics where needed.

Capture appropriate non-sensitive metadata such as:

- Service.
- Deployment revision.
- Timestamp.
- Request category.
- Error class.
- Status code.
- Request/correlation identifier.
- Relevant network failure category.

Never expose:

- Passwords.
- Authentication tokens.
- Session secrets.
- Full private document contents.
- Sensitive user information.

Do not log raw private collaboration payloads as a general debugging measure.

---

# 15. TEST FROM DIFFERENT NETWORK ENVIRONMENTS

A product working on the developer's computer is not sufficient evidence of general accessibility.

The owner expects Whiteout to work across ordinary consumer, university, residential and cellular internet connections.

Test as much of this as can be verified using your available tools.

## 15.1 Required environment categories

Evaluate:

- Existing working network.
- Independent external network.
- Residential network where accessible.
- University network where accessible.
- Cellular network where accessible.
- External synthetic-monitoring environment.

Do not claim to have tested a network you cannot actually access.

If the original failing environment cannot be retested directly, explicitly report that limitation.

Do not manufacture test results.

## 15.2 Browser coverage

Test representative behavior in:

- Safari/WebKit.
- Chrome/Chromium.
- Mobile Safari where available.
- Mobile Chromium-based browser where available.

Use actual devices when available, and label emulated browser tests accurately.

## 15.3 End-to-end journey

The full representative test should cover:

1. Opening the homepage.
2. Opening Production Desk.
3. Reaching Scheduler.
4. Completing authentication.
5. Returning to Production Desk.
6. Loading an authorized Shot List.
7. Opening a Storyboard.
8. Opening Flow of the Day.
9. Reading permitted content.
10. Completing a permitted test edit.
11. Confirming the edit is saved.
12. Disconnecting or simulating a connection failure.
13. Recovering after reconnection.
14. Confirming the data remains correct.
15. Signing out.

Use isolated authorized test data.

Do not mutate real production documents for routine smoke testing.

## 15.4 Slow-network testing

Also test intentional high latency and packet interruption.

Slow networks should not automatically be treated as offline.

The application should provide understandable feedback while requests are still running.

It should handle temporary failure without causing repeated destructive actions.

Check that important controls remain responsive where appropriate.

---

# 16. NETWORK AND AUTHENTICATION FAILURE TEST MATRIX

The following cases must be represented in automated or controlled manual testing.

| Scenario | Required result |
|---|---|
| Backend DNS unavailable | Clear connection error; no infinite loading |
| Backend connection refused | Recoverable service error |
| HTTPS timeout | Bounded timeout and appropriate retry |
| Invalid TLS certificate | Safe failure without bypassing TLS checks |
| API returns 401 | Appropriate authentication handling |
| API returns 403 | Accurate authorization message |
| API returns 429 | Bounded backoff behavior |
| API returns 500/503 | Service error and recovery |
| Scheduler unavailable | No endless redirect loop |
| Auth callback fails | Clear recoverable state |
| WebSocket drops | Appropriate reconnect and state reconciliation |
| Backend restarts | Client resumes safely where possible |
| Save succeeds but acknowledgment is lost | No duplicate mutation |
| User goes offline while editing | Recoverable work preserved where supported |
| User reconnects | No silent overwrites or duplicates |
| Existing session revoked | Access is properly rejected |
| Different user signs in | No prior user's private cached content |
| API routed through Cloudflare | Correct authentication and cache behavior |
| WebSocket routed through Cloudflare | Correct upgrade, authorization and recovery |

Do not make all of these tests depend on the live production environment.

Prefer controlled fixtures, network interception, and authorized staging or isolated tests.

---

# 17. VERIFY ALL PRODUCT REGRESSIONS

The reliability work must not break the existing applications.

Preserve and verify:

## M03

- Shot List creation.
- Row editing.
- Row coloring.
- AD View.
- Best Take.
- Collaboration.
- Canonical shot identifiers.
- PDF generation.
- Source-shot integration.

## M04

- Storyboard creation.
- Artwork import.
- Canvas drawing.
- Apple Pencil-compatible behavior.
- Generic stylus handling.
- Erasers.
- Shape assistance.
- Palette behavior.
- Visual Description.
- Comments.
- History.
- PDF printing.
- Artwork storage.
- Collaboration.

Do not claim physical stylus testing unless actual devices were used.

## M05

- Flow creation.
- Shot List import.
- Department editing.
- Department layout.
- Talent integration.
- Time Map.
- Shoot Log.
- Timestamp backfilling.
- Best Take synchronization.
- Planned/actual variance.
- Mobile entry.
- Print Studio.
- Department ZIP.
- Revision history.
- Collaboration.
- Reload persistence.

## Shared services

- Scheduler login.
- Authentication.
- Authorization.
- Account switching.
- Sign-out.
- Application navigation.
- Error recovery.
- Backend reconnection.
- Production data integrity.

A successful build alone is not sufficient.

Browser journeys and actual data persistence must be verified.

---

# 18. PERFORMANCE AND RESPONSIVENESS

Reliability includes usable performance under ordinary, imperfect internet conditions.

Inspect for avoidable:

- Excessive initial API requests.
- Serial requests that could safely run concurrently.
- Repeated authentication calls.
- Unbounded polling.
- Excessive document refetching.
- Large unnecessary response payloads.
- Repeated reconnection loops.
- Blocking loading states.
- Redundant media downloads.

Do not optimize prematurely by replacing established architecture.

Target meaningful bottlenecks that affect the real user journey.

The application should load progressively where appropriate.

Avoid fetching large private documents, artwork, or entire production datasets before displaying a lightweight document index when not necessary.

Preserve correctness and authorization.

Performance improvements must not introduce stale collaborative data or unsafe caching.

---

# 19. SECURITY MUST NOT BE WEAKENED

Backend reachability is not a justification for reducing security.

Preserve:

- Scheduler as the authentication authority.
- Existing user and production identities.
- Role-based permissions.
- Authorization checks.
- WebSocket authentication.
- Session revocation.
- Private document access.
- Private artwork access.
- Secure cookies and credentials.
- Appropriate CORS/origin rules.
- Rate limiting.
- Request validation.

Do not:

- Use permissive wildcard CORS with authenticated sessions.
- Make private APIs anonymous.
- Disable certificate validation.
- Store credentials in frontend code.
- Expose private Railway secrets.
- Remove authorization middleware.
- Turn off meaningful WAF protections globally.
- Make R2 assets publicly accessible for convenience.
- Cache authenticated responses across users.

If a proposed infrastructure correction requires security-sensitive changes, analyze its consequences carefully and test the result.

Prefer a different safe architecture over an insecure shortcut.

---

# 20. CONTROL INFRASTRUCTURE COMPLEXITY AND COST

The owner wants professional reliability, not unnecessary complexity.

Preserve the existing Railway/PostgreSQL/Cloudflare architecture unless evidence supports a specific change.

Do not introduce:

- Kubernetes.
- Unnecessary microservices.
- A second authentication system.
- A second document database.
- Full multi-region replication.
- A complete offline-first rewrite.
- Expensive monitoring stacks.
- Unnecessary permanent file storage.
- Additional proxy layers without demonstrated value.

Keep operational costs proportionate to the project's actual scale.

A modest, well-designed infrastructure with reliable monitoring is preferable to a complicated architecture that is difficult to maintain.

---

# 21. RELEASE PREPARATION — NO IMMEDIATE-DEPLOYMENT SHORTCUT

The earlier emergency deployment instruction is superseded.

The owner now authorizes normal completion and controlled release.

First complete:

- Outstanding implementation.
- Connectivity diagnosis.
- Evidence-supported corrections.
- Reliability improvements.
- Appropriate QA.
- Release preparation.

Do not rush the release simply because a previous usage limit interrupted the work.

At the same time, do not endlessly polish unrelated details once all requirements are satisfied.

Proceed efficiently toward deployment.

## 21.1 Source checkpoint

Before publishing:

- Confirm the final source diff.
- Verify intended repository boundaries.
- Commit completed work.
- Push the appropriate branches.
- Record commit hashes.
- Confirm build reproducibility.
- Preserve QA evidence.

Avoid including generated files in the wrong repository.

## 21.2 Database migrations

If new migrations are required:

- Review them for destructive behavior.
- Confirm compatibility with current production data.
- Validate their order.
- Test against appropriate fixtures.
- Preserve rollback or recovery options.
- Apply only through the established deployment process.

Do not reset production data.

## 21.3 Backend deployment

Deploy the relevant backend services in a dependency-safe order.

Verify:

- New revision is actually running.
- Application health is good.
- Database migration completed.
- Public API hostname resolves.
- HTTPS works.
- Authentication works.
- WebSocket behavior works.
- Existing records remain intact.

Do not equate a successful Railway build with a successful release.

## 21.4 Scheduler changes

If Scheduler requires a deployment, protect authentication compatibility.

Do not change public callback addresses or cookie domains casually.

If migrating public hostnames, preserve the previous functioning path until the replacement is verified where technically feasible.

Do not strand Production Desk on incompatible authentication endpoints.

## 21.5 Frontend deployment

Publish the matching Production Desk frontend bundle through the established website release process.

Verify:

- Actual served HTML.
- Compiled asset hashes.
- Correct backend URLs.
- Correct active backend revisions.
- No stale API hostnames.
- No unrelated site file modifications.
- No broken Scheduler redirect.
- No missing assets.

Preserve unrelated website applications.

## 21.6 Custom-domain cutover

If implementing first-party backend domains:

1. Verify Railway-side configuration.
2. Verify DNS ownership records.
3. Verify Cloudflare configuration.
4. Verify TLS.
5. Verify public HTTP.
6. Verify authentication.
7. Verify WebSockets.
8. Verify cache behavior.
9. Verify affected browser flows.
10. Publish or activate the matching frontend configuration.
11. Confirm cross-network behavior.
12. Preserve a rollback path.

Do not change all networking components simultaneously without intermediate verification.

## 21.7 Post-deployment integrity

Compare the production baseline with post-deployment data.

Confirm that unrelated documents, artwork, assets and users were preserved.

A deployed service that silently alters production data is unacceptable.

---

# 22. EXPLICIT RELEASE GATES

Use three separate completion gates.

## Gate A — Implementation complete

All approved M03–M05 tasks and the Shoot Log amendment are implemented.

Required builds and focused tests pass.

Visual consistency is verified.

No known release-blocking code defects remain.

## Gate B — Technically deployed and verified

The correct frontend and backend revisions are live.

Migrations are confirmed.

Authentication works.

Public API requests work.

Collaboration works.

PDF workflows work.

Production data remains intact.

The deployed application is not merely displaying a previous successful revision.

## Gate C — External reliability confidence

Public endpoints are verified from independent environments.

Backend failure states recover appropriately.

Independent monitoring is functioning where implemented.

The original failure mechanism is either corrected and verified or explicitly documented as not yet independently reproducible or fully retested.

**Do not claim that the original residential-network failure has been resolved unless supporting tests establish that conclusion.**

If the exact original network is unavailable, use independent verification and report the limitation.

Do not fabricate certainty.

The broader launch-readiness decision remains separate from deploying completed, safely verified improvements.

---

# 23. FINAL REPORT REQUIREMENTS

After implementation and release, provide a concise but technically complete report.

Include:

## A. Implementation

- Completed M03 items.
- Completed M04 additions.
- Completed M05 items.
- Shoot Log status.
- Shared UI changes.
- Remaining limitations, if any.

## B. Incident investigation

- Actual backend origins discovered.
- Relevant DNS findings.
- HTTPS/TLS findings.
- Scheduler findings.
- WebSocket findings.
- Evidence-supported root cause or strongest remaining hypothesis.
- Specific corrections made.
- What was ruled out.
- What remains unverified.

## C. Infrastructure

- Public hostname strategy.
- Any domain or proxy changes.
- Railway deployment configuration changes.
- Cloudflare changes.
- Monitoring changes.
- Security considerations.
- Rollback provisions.

## D. QA

- Automated tests.
- Browser tests.
- Collaboration tests.
- Authentication tests.
- Network-failure tests.
- PDF tests.
- Mobile tests.
- External reachability tests.
- Tests that were not possible.

Clearly distinguish actual physical-device tests from emulation.

## E. Release

- Source commit hashes.
- Website commit hash.
- Railway active revisions.
- Confirmed migration status.
- Active public endpoints.
- Deployment verification.
- Production integrity comparison.
- Remaining blockers or owner follow-ups.

Do not report deployment as complete until the actual public revisions are confirmed.

---

# 24. EXECUTION PRIORITIES

Use this priority order:

**Priority 1 — Preserve and recover existing progress.**

Do not lose the previous implementation.

**Priority 2 — Finish genuinely incomplete M03–M05 requirements.**

Complete the approved product contract without rebuilding successful features.

**Priority 3 — Diagnose and correct the connectivity failure.**

Treat the observed backend hostname failure as a serious release concern, but follow evidence.

**Priority 4 — Strengthen shared network and authentication reliability.**

Prevent avoidable endless loading, failed recovery, duplicated mutations and misleading save states.

**Priority 5 — Verify external reachability and monitor service health.**

Test public access rather than relying only on internal deployment checks.

**Priority 6 — Execute the controlled release.**

Deploy backend and frontend safely, validate production data, and confirm actual public operation.

These priorities can overlap when doing so is technically efficient and safe.

Do not make duplicate changes in multiple repositories when a shared correction is sufficient.

---

# 25. FINAL OWNER DIRECTIVE

The purpose of Vader: Whiteout is to build an exceptionally well-designed, interconnected filmmaking production system.

M03 Shot Lists and M04 Storyboards have already demonstrated the required level of product quality.

M05 Flow of the Day, including its new Shoot Log, must reach the same standard.

The infrastructure must support that quality.

A beautiful application that fails to load on an ordinary residential connection is not ready for broader adoption.

A backend that works only under ideal network conditions is not sufficiently robust.

An application that loses edits or gets stuck indefinitely after a temporary failure is not sufficiently reliable.

However, no system can guarantee connectivity through every possible outage or restrictive network. The objective is to eliminate avoidable architectural failures, support ordinary mainstream networks, provide sensible recovery, and distinguish genuine external limitations from product defects.

The new reliability requirement does not authorize abandoning successful implementation or rebuilding Whiteout.

It requires finishing the system properly.

**Continue from the existing work. Complete all outstanding requirements. Diagnose and correct the real connectivity issue. Improve the ecosystem's resilience. Preserve security and production data. Verify the result. Deploy through the established procedure.**

Do not treat this as a fresh brainstorming assignment.

Do not stop at a written plan.

Do not ask for reapproval of already accepted product decisions.

Use sound engineering judgment for routine implementation details, and surface only genuine high-impact blockers or architectural/security decisions that cannot safely be resolved within this contract.

The owner will review the final deployed application and determine milestone acceptance.

**PROCEED WITH THE CURRENT IMPLEMENTATION, INCORPORATING THIS CONTRACT IN FULL, UNTIL THE COMPLETION AND RELEASE REQUIREMENTS HAVE BEEN SATISFIED OR A GENUINE BLOCKER HAS BEEN CLEARLY DOCUMENTED.**
