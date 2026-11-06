# Final M03–M05 completion and Shoot Log acceptance

The authoritative contract is CROSS-APPLICATION-SPECIFICATION.md. The in-chat
Shoot Log amendment supersedes the former Live Progress banner/stopwatch-first
presentation. All other scope remains. No M06 work is included.

Baseline: Production Desk `75cdd370`; Scheduler `4d442065`; website `e37666a5`.
Implementation branch: `ui/m05-cross-application-refinement`. Safe intermediate
checkpoints: `0510ef7f`, `a75b0a06`. Final release revision is the validated merge
on `main`; actual deployed source/site hashes and terminal deployment results are
recorded in the local release evidence and final owner report.

## Evidence keys and boundaries

- **Browser**: `refinement-browser.cjs`, Chromium and WebKit: DP colors, bulk,
  clear/undo/reload; AD preset/day context/day allotment/source estimate separation;
  shared takes; Layout; Time Map; twelve-slot replacement/reload; actual PDF preview;
  real Scheduler-backed local sign-out. Screens `01`–`07` in each browser folder.
- **Ledger browser**: `shoot-log-browser.cjs`, Chromium and WebKit: empty log,
  direct Enter navigation, current-time shortcut, C before B/backfill, correction,
  confirmed finish, preferred take, skip, audit, plot, reload, offline two-row queue,
  retry after failed acknowledgment, phone AM/PM/day sheet and midnight, tablet,
  native three-tab navigation and no old banner. `shoot-log-01`–`06` screenshots.
- **Ledger model**: `shoot-log-model.cjs`, `refinement-live.cjs`: exact green/yellow/red,
  absent/inconsistent thresholds, confirmed versus inferred intervals, gaps/Lunch,
  separate cumulative budget/clock variance, recovery, audit/undo, DST ambiguity,
  midnight, idempotence, stale-entry conflicts and no timer on opening.
- **HTTP**: `shoot-log-http.cjs`: real authorized HTTP and two WS clients; read-only
  legacy timestamp projection, audited overlay/clear/undo, parallel independent rows,
  stale same-row rejection, idempotent retries, forbidden signup/foreign access,
  raw WS timestamp forgery rejection, planning restoration and restart durability.
- **Shared**: `refinement-shared.cjs`: two authorized WS clients; colors and undo;
  repeated Take 3 with distinct occurrence UUIDs, primary/usable/note revisions,
  concurrent selection history without lost records, clear/reload; independent
  palette-slot updates preserve annotations; description uses existing Y.Text.
- **Flow PDF**: `refinement-backend.cjs`, `shoot-log-http.cjs`, existing `print.cjs`
  and `workbook-pdf.cjs`: ten-column Tabloid master one width, 8.5pt unchanged,
  balanced smaller-paper bands, title/date/page-number-only output; actual production
  log, Focus, Rundown, three-department ZIP/CRC; original workbook 62 events/52
  instructions/nine departments; existing 310-event/3,100-marker matrix reused.
- **Storyboard PDF**: `refinement-crops.cjs`, `refinement-storyboard.cjs`: actual
  Scene 09 and Scene 16 raw artwork crops, private-byte equality, six/eight-panel
  Letter portrait PDFs, canonical linked labels, no invented unlinked Panel N,
  descriptions default on; long descriptions wrap at words and continue completely.
  Actual pages visually inspected, including `storyboard-8.png` and long output.
- **Surfaces**: `refinement-surfaces.cjs`, both browsers: actual M03 preview/download,
  actual Flow log preview/download byte equality, direct description editing, hue
  and in-artwork eyedropper slot replacement, four shared empty-state fixtures,
  distinct backend errors and mobile account menu. Empty/error fixtures are browser
  interceptions only, never production or authentication bypasses.
- **Time Map pressure**: `refinement-pressure.cjs`, both browsers: fifty short shots,
  fifteen hours, 1/2/3/5/10/30/60/120-minute exact geometry, simultaneous tracks,
  unknown duration, adaptive Fit/ticks, keyboard detail, 125/150/200% equivalent
  viewports, tablet. Native OS zoom and physical hardware are not inferred.
- **Preservation**: `callsheet.cjs` unchanged authenticated LaTeX PDF, M03 actual
  five-shot PDF and preview, `studio-engine.cjs` and `studio-long-path-pdf.cjs`
  preserve actual VectorCraft geometry and bounded 2MB syntax-validated PDF paths.
- **Prior corrective pass**: `CORRECTIVE-ACCEPTANCE.md` individually records all
  older contract rows. Its successful import/DND/history/access/immutable export
  evidence is reused; obsolete two-view/banner-oriented assertions are superseded.

All destructive or edit tests use disposable loopback records. No production
workbook import, source/timestamp/take edit, deletion, restoration or new test
record is authorized by these tests. Production smoke is read-only.

## Section 42 matrix

| Contract area | Result | Evidence |
|---|---|---|
| M03 Row colors | Implemented, shared/persistent | Browser, Shared |
| M03 Bulk color | Implemented and exercised | Browser |
| M03 Clear color | Implemented, undo and peers | Shared |
| M03 AD View | AD / On-Set preset, actual source grid | Browser |
| AD View source context | Flow/day and repeated-occurrence choice | Browser, Shared |
| Best take | Shared source-shot UUID record | Browser, Shared |
| Best take provenance | Flow/event/date retained; wrong occurrence rejected | Shared |
| M03/M05 best-take synchronization | Same source record, no second field | Ledger browser, Shared |
| DP estimate | Source M03 value preserved | Browser, HTTP |
| AD allotted | Independent per M05 event | Browser, HTTP |
| Planned duration | Allotment, then legacy duration, then estimate | Ledger model, Flow PDF |
| Actual start | Direct durable timestamp, optional now | Ledger browser, HTTP |
| Actual end | Optional confirmed finish, interval validation | Ledger model/browser |
| Active shot | Superseded by timestamp-ledger recording; no mandatory stopwatch | Ledger browser |
| Green zone | Within actual DP threshold | Ledger model/browser |
| Yellow zone | Above estimate, within allotment | Ledger model |
| Red zone | Beyond allotment | Ledger model/browser |
| Missing threshold | Neutral/review, no fabricated threshold | Ledger model |
| Overall budget variance | Separate measured-shot sum with basis disclosed | Ledger model |
| Overall schedule variance | Latest valid recorded checkpoint only | Ledger model/browser |
| Time recovery | Budget recovery and clock delay remain distinct | Ledger model |
| Breaks/gaps | Confirmed gaps excluded, inferred intervals labelled | Ledger model |
| Timestamp correction | Audited before/after, clear, undo | HTTP, Ledger browser |
| Refresh/reconnect | Durable records and pending FIFO retained | HTTP, Ledger browser |
| Concurrent logging | Different-row merge, same-row guarded conflict | HTTP |
| Talent mapping | Production-managed Cast, explicit override | HTTP, source inspection |
| Current Action | Coverage independent of Subject | Browser, Flow PDF |
| Department notes | Existing instruction Y.Text retained | Prior corrective pass |
| New department defaults | Exact ten, new documents only | HTTP |
| Layout menu | Compact presets/customize/checkboxes | Browser |
| Add Department | Near top, existing creation flow | Browser, Prior corrective pass |
| Column ordering | Existing shared order and independent print order | Prior corrective pass, source inspection |
| Tabloid printing | Ten departments plus Time/Action one width | Flow PDF, visual master |
| Production orphan page | Eliminated for normal ten departments | Flow PDF |
| PDF title | Flow of the Day — custom title | Flow PDF |
| Duplicate title prefix | Normalized before composition | Flow PDF |
| PDF footer | Page numeral only | Flow PDF, visual review |
| Actual-time printing | Optional timestamp ledger/audit appendix | HTTP, Surfaces |
| Department Focus | Preserved | Flow PDF, Prior corrective pass |
| Daily Rundown | Preserved | Flow PDF, Prior corrective pass |
| Department ZIP | Three PDFs/CRC, bounded safe names | HTTP, Prior corrective pass |
| Persistent export storage | No new R2 export objects | Source inspection; unchanged transient artifact path |
| Time Map short shots | Exact bars and separate accessible hit targets | Time Map pressure |
| Time Map geometry | No inflated short-shot duration | Time Map pressure |
| Time Map Fit Day | Actual scheduled span, adaptive scale | Time Map pressure |
| Time Map active shot | Optional legacy marker preserved; logging stays in Shoot Log | Source inspection, amended scope |
| M04 palette | Exactly twelve stable slots | Browser, Surfaces |
| Palette replacement | HEX/hue/intentional sample in place | Browser, Surfaces |
| Palette persistence | Reload and independent shared slot writes | Browser, Shared |
| Previous artwork | Existing vector objects unchanged | Shared, Preservation |
| Visual notes label | Visual description, same stored notes | Browser, Surfaces |
| Description entry | Direct Grid and viewer actions | Browser, Surfaces |
| Storyboard default PDF | Six panels, Letter portrait | Storyboard PDF, Browser |
| Storyboard eight-panel PDF | Two columns/four rows, measured continuation | Storyboard PDF |
| Printed shot labels | Existing canonical linked identities | Storyboard PDF |
| Printed descriptions | On by default; full content retained | Storyboard PDF |
| Empty states | Actual shared component across four indexes | Surfaces |
| Account menu | Expanded/collapsed/mobile existing shell | Browser, Surfaces, source inspection |
| Sign out | Existing Scheduler API, token cleared, private runtime unloaded | Browser |
| Existing M05 corrective requirements | Preserved; individual prior evidence retained | Prior corrective pass |
| M03 regressions | Grid/source/shared fields and actual PDF | Browser, Shared, Preservation |
| M04 regressions | Artwork/annotations/VectorCraft/PDF | Shared, Storyboard PDF, Preservation |
| Production integrity | Before/after counts and content hashes compared | Read-only release evidence |
| Deployed assets | Fresh scoped build; actual served SHA verification | Release evidence |
| Final owner acceptance | Reserved for owner | No automated acceptance claim |

## Shoot Log amendment — 24 scenarios

| # | Scenario | Evidence |
|---|---|---|
| 1 | No records means no clock lateness or timer | Ledger browser 01, model |
| 2 | Direct desktop time entry | Ledger browser |
| 3 | Optional current-time shortcut | Ledger browser |
| 4 | C entered before B | Ledger browser/model |
| 5 | B backfilled later | Ledger browser/model |
| 6 | Affected intervals/variance recalculate | Ledger browser/model |
| 7 | Historical correction and audit | HTTP, Ledger browser |
| 8 | Skip has no fabricated timestamp | Ledger browser/model |
| 9 | Breaks/gaps not treated as pure shooting | Ledger model |
| 10 | Midnight day offsets | Ledger browser/model |
| 11 | Missing thresholds remain neutral | Ledger model |
| 12 | Separate cumulative budget/clock metrics | Ledger model |
| 13 | Recorded variance graph | Ledger browser |
| 14 | Preferred take reaches M03 source UUID | Ledger browser, Shared |
| 15 | Refresh persistence | Ledger browser, HTTP restart |
| 16 | Guarded simultaneous edits | HTTP |
| 17 | Offline/failed ACK retained, retry, no false Saved | Ledger browser |
| 18 | Enter advances timestamp cells, Tab preserved | Ledger browser |
| 19 | Phone cards/time sheet, no horizontal scroll | Ledger browser 04–05 |
| 20 | Tablet/narrow layout | Ledger browser 06, Time Map pressure |
| 21 | Department Flow has no Live Progress banner | Ledger browser |
| 22 | Time Map remains functional | Ledger browser, Time Map pressure |
| 23 | Optional actual-time Print Studio output | HTTP, Surfaces byte parity |
| 24 | M03/M04/M05 preservation | Browser, Preservation, prior evidence |

## Honest remaining verification limits

Physical iPhone/iPad/Pencil, hardware zoom/input combinations and printer hardware
are not available. Phone/tablet acceptance uses real Chromium/WebKit browser
interactions with responsive viewports; it is not a physical-device claim.
Sardor's account was owner-authorized and verified through Scheduler's protected
owner-admin workflow previously. We do not possess or impersonate his own login.
Production write journeys intentionally remain local: no owner data is changed to
prove deployment. An ambiguous daylight-saving wall time is rejected for review
rather than guessed; normal/midnight entry and gap/fold validation are tested.
The existing Vite large PDF-worker chunk advisory remains non-blocking.
