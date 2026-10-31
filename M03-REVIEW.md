# M03 — Collaborative Shot Lists + signature UI

Implemented locally from the user's M02 commit `d74ef1bcb0c273dd8a81b5210a0a9a2efc6dad31`
on `ui/m03-collaborative-shotlists`. The M02 baseline was clean before branching.
No commit, push, merge, production migration or deployment was performed. M04–M12
were not started.

## A. Implementation

Production Desk now has a persistent Shot Lists module, list creation, scenes,
inline shot editing and a complete detail inspector. The desktop workspace has a
searchable scene rail, a scrollable editable table and a resizable/collapsible
inspector. Narrow layouts use a focused native modal drawer. The mobile grid
becomes readable shot rows; actions have their own space above technical fields.

All Shots, Scene View and Planning Order are distinct views. Shots support exact
text labels, technical choices/custom values, narrative coverage and camera,
focus and lighting notes, durations, planned/actual takes, duplication, soft
deletion/restoration, earlier/later ordering, multiselect, TSV copy/paste,
column selection and local collaborative undo/redo. New shots focus their number
cell. Alt+arrows/Enter navigate cells; duration arrow keys adjust values without
interfering with Alt navigation. Scene detail editing and scene deep links work.
Scene choices carry UUID values independently of their displayed labels, including
when an import creates another scene with the same displayed number.

The M02 sidebar and custom SVG emblem remain. One global Create pill offers only
New Call Sheet and New Shot List, with an expanding panel at the pill's position.
Duplicate dashboard/mobile creation shortcuts were removed. Signed-out screens
retain one heading and one sign-in action. Existing hash routes and Scheduler
redirects remain. The legacy call-sheet editor, PDF and mail implementation files
were not changed.

M02 status/sort/context menus now use compact widths (status 228px, sort/context
208px by default) and approximately 37px options, with their original keyboard,
collision, dismissal and focus behavior. Closing menus leave the accessibility
tree immediately while their visual exit completes.

## B. Data architecture

The additive TypeORM migration `ShotLists1793426400000` creates:

| Table | Purpose |
|---|---|
| `shot_list_documents` | UUID, name, validated creator ID, authoritative Yjs binary `bytea`, server-created/server-updated timestamps. |
| `shot_list_members` | `(document_id, user_id)` membership boundary and lookup index. |

The Yjs document contains `meta`, `scenes`, `shots` and an import-batch ledger.
Scenes and shots are nested shared maps with permanent UUIDs. Narrative fields
are `Y.Text`. Structured fields are individual shared map entries, so one user's
lens edit does not replace another user's framing or narrative changes.

Shot numbers and scene numbers are strings. `9.1` and `9.10` remain distinct.
Scene-local `order` and creative `planningOrder` are separate, with deterministic
UUID tie resolution. Moving a row changes a position value rather than its ID or
number. Future storyboard links can retain that same UUID. No day-specific Flow
of the Day model was introduced.

Soft deletion retains the complete shot record and UUID. Confirmation waits for
durable server acknowledgement; a failure restores the visible shot and reports
the error. The toast can restore it, and the local Yjs undo history is available.

Document bytes are loaded with `Y.applyUpdate` and saved with
`Y.encodeStateAsUpdate`; they are never reconstructed from JSON. JSON export is
derived from the live authoritative document. Per-document save queues serialize
database writes. Unchanged reads/retries do not advance the server update time.
The durable receipt hashes a Yjs snapshot containing clocks **and deletions**;
it remains comparable when the client's undo history retains items that the
server has garbage-collected. A mere network receipt is not called Saved.

Schema synchronization is disabled. The new migration neither alters nor deletes
existing Call Sheet/Roster tables. Its up/down behavior was tested with sentinel
records in an isolated PostgreSQL schema.

## C. Collaboration and security

Yjs 13.6.27, Hocuspocus server/provider 2.15.3 and y-codemirror.next 0.3.6 provide
real WebSocket synchronization, awareness and CodeMirror text bindings. Avatars
represent active people, remote technical cells show a colored boundary, and
narrative fields render actual relative text carets and selections. Carets clear
when the local editor loses focus. Remote selection does not navigate or scroll
the local workspace.

The existing `AuthService.verifySchedulerToken` remains the authentication
authority. HTTP uses the existing Scheduler guard. WebSocket authentication sends
the token in the protocol message, never in a URL, and authorizes the requested
document before loading it. Each document requires both an approved Scheduler ID
and membership. Connections are rechecked on inbound messages and periodically
while idle. Revoked members are disconnected. Noncanonical/guessed document IDs,
uppercase UUID aliases, unapproved origins and query-string credentials are
rejected. Browser cross-tab unauthenticated document broadcasting is disabled.

The WebSocket endpoint shares the Nest HTTP server at
`/api/shotlists/collaboration`. An advisory lock enforces one collaboration writer
per database. No Redis or multi-replica document synchronization is claimed.

Connection loss is visible, local edits remain in memory, and reconnect reconciles
them. Navigation/unload warns while changes are unsaved; import reviews/requests
are also guarded. Database errors retain an unsaved state and are retried through
the persistence-status lifecycle. No durable offline editing is claimed.

Actual tests used two authenticated clients, a later third client, independent
structured edits, concurrent narrative edits, relative caret movement, order
changes, disconnect/reconnect, idle revocation and a real Nest process restart
against the same PostgreSQL state. The local Scheduler contract stub lives only
in `qa/m03`; the production verifier itself runs unchanged. These are actual
client/server/database tests, not mocked avatar demonstrations.

## D. Research integration

[THIRD-PARTY-M03.md](THIRD-PARTY-M03.md) records every requested reference, source
inspection, dependency/license decision and concrete use: Bencho Create, actual
Libraries.dev Metal, Rare UI deletion/toast behavior, Amicro sharing, EasyUI Gooey
Menu, Combobox, Calendar and Date Picker. The controls are independently implemented
except for the explicitly installed Metal and collaboration packages.

Metal uses the actual WebGL2 runtime only on Create, without glow, and pauses when
idle, hidden or offscreen. Reduced motion and unavailable WebGL retain a readable,
working static control. The button remains available if a shader frame is delayed.
Chrome and WebKit were checked. Required MIT/Apache notices are included as a
frontend static license asset. The inaccessible Amicro demo is explicitly recorded;
its specified authenticated-copy behavior uses an original restrained transition.

The custom date picker is delivered and tested in a dev-only real UI fixture,
ready for M05/M06. It does not add an artificial Shot List date field or change the
legacy editor. It supports direct ISO entry, validation, month navigation, roving
grid focus, arrow/Home/End/PageUp/PageDown keys, responsive placement and reduced
motion. Date-only behavior was checked in UTC+14, UTC−11 and Los Angeles.

## E. Visual evidence

All evidence is in [client/qa/m03/artifacts](client/qa/m03/artifacts/).

| Required surface | Screenshot |
|---|---|
| Refined call-sheet dashboard | [01-dashboard.png](client/qa/m03/artifacts/01-dashboard.png) |
| Compact status dropdown | [02-compact-status.png](client/qa/m03/artifacts/02-compact-status.png) |
| Compact sort dropdown | [03-compact-sort.png](client/qa/m03/artifacts/03-compact-sort.png) |
| Create closed / Metal | [05-metal-primary.png](client/qa/m03/artifacts/05-metal-primary.png) |
| Create expanded | [04-create-expanded.png](client/qa/m03/artifacts/04-create-expanded.png) |
| Collapsed sidebar/emblem/Create | [04-create-collapsed-sidebar.png](client/qa/m03/artifacts/04-create-collapsed-sidebar.png) |
| Reduced-motion / no-WebGL fallback | [Static](client/qa/m03/artifacts/05-metal-static-fallback.png), [WebGL unavailable](client/qa/m03/artifacts/05-metal-no-webgl-fallback.png) |
| Shot workspace | [06-shot-workspace.png](client/qa/m03/artifacts/06-shot-workspace.png) |
| Scene/mode switch | [07-scene-mode-menu.png](client/qa/m03/artifacts/07-scene-mode-menu.png) |
| Inspector / searchable technical combobox | [Inspector](client/qa/m03/artifacts/08-shot-inspector.png), [Combobox](client/qa/m03/artifacts/09-technical-combobox.png) |
| Inline delete confirmation | [10-inline-delete-confirm.png](client/qa/m03/artifacts/10-inline-delete-confirm.png) |
| Real collaborators / selected cell | [11-two-collaborators-cell.png](client/qa/m03/artifacts/11-two-collaborators-cell.png) |
| Actual remote caret and selected range | [12-live-caret-selection.png](client/qa/m03/artifacts/12-live-caret-selection.png) |
| Custom date picker | [13-custom-calendar.png](client/qa/m03/artifacts/13-custom-calendar.png) |
| Mobile shot list / inspector / combobox | [List](client/qa/m03/artifacts/14-mobile-shot-list.png), [Inspector](client/qa/m03/artifacts/15-mobile-inspector.png), [Combobox](client/qa/m03/artifacts/16-mobile-combobox.png) |
| Actual workbook mapping/review | [17-actual-workbook-review.png](client/qa/m03/artifacts/17-actual-workbook-review.png) |
| Interrupted connection | [18-connection-interrupted.png](client/qa/m03/artifacts/18-connection-interrupted.png) |
| Promise feedback | [Pending](client/qa/m03/artifacts/toast-pending.png), [Success](client/qa/m03/artifacts/toast-success.png), [Error](client/qa/m03/artifacts/toast-error.png) |
| WebKit | [Desktop](client/qa/m03/artifacts/webkit-desktop.png), [Create/Metal](client/qa/m03/artifacts/webkit-create-metal.png), [Mobile inspector](client/qa/m03/artifacts/webkit-mobile-inspector.png) |
| Native Chrome 200% zoom | [Inspector/combobox](client/qa/m03/artifacts/zoom-200-shot-inspector.png) |
| Visible local PostgreSQL preview | [19-interactive-local-postgres.png](client/qa/m03/artifacts/19-interactive-local-postgres.png) |

Responsive screenshots additionally cover 1440×900, 1280×800, 1024×768, 768×1024,
390×844 and 360×800. Typography, rendered emblem, menus, narrative carets and
mobile geometry were visually reviewed at rendered sizes.

## F. Supplied workbook and import

The actual workbook at `~/Downloads/Shot List - Vader_ Whiteout.xlsx` was read,
not modified. It has 10 sheets: shooting order, seven scenes (09, 05, 08, 06, 19,
16, 01), the template and dropdown options. The parser found 129 shot rows, including
technical fields, coverage, notes, per-sheet timing columns and take notation.

Import inspects sheets, excludes reference/template sheets, presents scene/column
mapping and row selection, preserves displayed text, flags missing/duplicate or
ambiguous identifiers, supports manual corrections and confirms before writing.
Unknown technical values and empty cells survive. Original row values remain in
source metadata. Unspecified script-time units require a choice; confirmed minutes
convert explicitly to seconds. Shooting-order sheets remain reference material;
their day/start-time data is not silently repurposed as M03 creative order.

There are 96 flagged rows in the original workbook. The actual import test selected
only the 32 unambiguous Scene 19 rows with explicit units, persisted them through
the real local API, and read every mapped field/source record back identically.
The other 97 rows remain for owner review of labels or unspecified timing units.
Values whose original trailing zeros have already been lost cannot be recovered
with certainty; the implementation does not invent `9.10` from `9.1`.

Synthetic workbooks additionally test multiple sheets/scenes, formatting, exact
text `9.1`/`9.10`, recoverable formatted numeric labels, numeric ambiguity, duplicate
labels, empty cells, missing IDs, custom choices and excluded reference/template
sheets. The import is append-only and idempotent by batch UUID, validated before
mutation and applied as one transaction on the same live CRDT document. A failed
or unknown-result retry retains its originally confirmed payload.

## G. Verification

The frontend strict TypeScript check, Vite production build and backend TypeScript
build passed. Final production chunks are below the warning threshold; the shot
workspace, workbook parser and Metal runtime load separately. The build uses the
isolated exact-lockfile runtime documented in [qa/m03/README.md](qa/m03/README.md)
because the pre-existing tracked checkout lacks the native Mac Rollup binary.
No existing locked dependency version was changed. Tracked build caches,
`node_modules` and published bundles remain unchanged.

| Evidence | Result |
|---|---|
| [Build log](client/qa/m03/artifacts/build.log) | Pass, no warnings |
| [Real collaboration integration](client/qa/m03/artifacts/integration.json) | 9 groups passed |
| [Migration/security](client/qa/m03/artifacts/security-and-migration.json) | 4 groups passed |
| [Existing real backend API regression](client/qa/m03/artifacts/legacy-api.json) | Pass |
| [Chrome UI / carets / responsive / motion](client/qa/m03/artifacts/browser.json) | 7 groups passed |
| [Creation/edit/import/clipboard/undo workflows](client/qa/m03/artifacts/workflows.json) | 5 groups passed |
| [Chrome sizing and six WebKit layouts](client/qa/m03/artifacts/engines-and-viewport.json) | Pass |
| [Native 200% zoom](client/qa/m03/artifacts/zoom.json) | Pass, 1440→720 CSS viewport and doubled DPR |
| [Metal unavailable/paused](client/qa/m03/artifacts/metal-fallback.json) | Pass |
| [Actual workbook inspection](client/qa/m03/artifacts/workbook-inspection.json) / [persistence](client/qa/m03/artifacts/workbook-persistence.json) | Pass; safe subset only |
| Synthetic/actual import tests | 3 passed |
| Existing roster parser tests | 3 passed |
| [Complete M02 suite](client/qa/m03/artifacts/m02-regression/verification.json) | All 21 groups passed |

The Chrome preview defect was isolated to the former fixed emulated viewport:
outer windows of 1280 and 1600 both retained a 1440px inner viewport. With
`viewport: null`, outer/inner/application widths track 1280 and 1600 exactly.
Chrome and WebKit also filled all six identical test viewports. No misleading
production root-width/background workaround was added.

Native Safari automation was attempted and denied by the existing “Allow remote
automation” setting; that setting was not changed. Compatible WebKit 26.0 passed.
The newer bundled WebKit 26.5 crashed before page creation on this macOS 26.0 host;
the compatible engine and exact commands are documented.

## H. Files and boundaries

[M03-FILES.md](M03-FILES.md) and the scope-audit artifact list every changed file.
Only the Production Desk repository changed. Backend authentication, legacy
Call Sheet/Roster/PDF/mail implementation files, the M02 emblem, M01 site,
Scheduler, Equipment and published bundles were preserved. No input workbook
or real production record was changed. No real email was sent.

## I. Deployment prerequisites — not performed

1. Use Node **22.x** in the root engine declaration, `.nvmrc` and both Docker
   stages. The existing Nest 11 dependency already requires Node 20+; the old
   Node 18 declaration was incompatible. No Nest/React/TypeORM major upgrade was
   introduced. Install the updated client/server lockfiles in normal clean builds.
2. Keep the existing production `DATABASE_URL`, Scheduler authority and frontend
   API base configuration. Back up the database before any later deployment.
3. Apply the additive migration explicitly, from the built server:
   `npm run migration:run --prefix server`. It only creates the new tables and
   migration ledger. Existing Call Sheet/Roster schema must already exist;
   automatic schema synchronization is disabled. No migration runs on app startup.
4. Set `SHOTLIST_COLLABORATOR_IDS` to comma-separated **validated real Scheduler
   user IDs**, and `SHOTLIST_ALLOWED_ORIGINS` to exact comma-separated frontend
   origins, including protocol and without paths/trailing slashes. No real values
   or secrets were invented or configured. An empty allowlist denies Shot Lists.
5. New lists enroll the configured collaborators. To add a person to an existing
   list, explicitly add its `(document_id, user_id)` membership as well. Removing
   membership revokes that document; removing an ID from the allowlist revokes
   Shot Lists globally. All approved members can edit; no role tiers exist.
6. Run **one collaboration replica**. Preserve HTTP WebSocket upgrades for
   `/api/shotlists/collaboration` on the same public backend port. The advisory
   lock intentionally prevents a second independent writer from starting.
7. For an application rollback, retain the new tables/state. The explicit
   `migration:revert` command drops only the new Shot List tables and should be
   used only after backing up any new shot-list data. Up/down sentinel tests
   confirmed legacy data survives, but reverting intentionally removes new data.

`HOST=127.0.0.1` is used by local QA. Production's default listen host remains
`0.0.0.0`. The QA authority, test identities and temporary database configuration
are never production prerequisites.

## J. Git state

Branch: `ui/m03-collaborative-shotlists`. HEAD remains the user's M02 commit
`d74ef1bcb0c273dd8a81b5210a0a9a2efc6dad31`. M03 is present as modified/new files for
review. Codex did not commit, stage, push, merge or deploy any changes.

## K. Limits and review access

The requested M03 software is implemented locally. Native Safari GUI automation
remains unverified because it is disabled; WebKit 26.0 was verified. The 97 excluded
workbook rows still need the production owner's review before a complete original
workbook import. No claim is made about recovering identifiers already damaged
by spreadsheet numeric storage.

Offline edits are retained only while the browser document remains in memory;
there is no IndexedDB offline database. Horizontal collaboration scaling is not
implemented. Production Scheduler sessions, Railway migrations, production PDF
rendering and mail delivery were not exercised. Existing PDF download behavior
and distribution UI were regression-tested with the isolated M02 fixtures.

For interactive review without a real login, use [qa/m03/README.md](qa/m03/README.md).
The visible preview operates the real local PostgreSQL-backed application, with
clearly marked QA identities and an ordinary resizing browser viewport. It adds
no application login bypass or production test route.

Two isolated Chrome review windows are open for Maya Chen and Elias Moreno on a
clean coverage plan. Their edits synchronize through the local backend. The
remaining local review services are bound to loopback; no production login is
needed in those windows. Close them after review and stop the local servers when
finished, using the commands in the QA README.
