# M05 owner corrective pass — execution checkpoint

Authoritative contract: qa/m05/CORRECTIONS.md, supplied with 27 owner screenshots.
Do not reopen design decisions or restart implementation. Current source branch
ui/m05-final-corrections; baseline source/main9dfcf415, site/main5449092. Both prior
releases verified served; latest Railway success b06da2ab-b1ae-4c90-ad3a-b86aee16eccb.
This corrective source is NOT yet deployed or acceptance tested end-to-end.

Implemented foundation in this pass (working source, typecheck/test where noted):
- Pure shared server/src/flows/scheduling.ts imported by client: set-clock wall
  minutes/explicit anchors/sequence/relative timing; nonmutating legacy IANA/ISO
  conversion; actual unknowns; fixed conflicts; cycles; canonical labels. Focused
  qa/m05/scheduling-corrections.cjs passes compiled real function.
- New Flow 3-route CreationChoices, reused actual DatePicker, no zone/start/previous
  day; selected-shot DND+inline source preview, default preselection, duplicate
  date/title dialog, compact index/status removal and TD/flex root-cause correction.
- Shared ClockPicker 12h, TimeEditor shared M03 estimate writes await durable ACK;
  explicit day override; grid selection gutter/header direct rename/personnel,
  department drag/resize/hide/group/split, relative instruction timing and insertion.
- FlowPage derives events from shared schedule; removes shift dialog, status/comments,
  original giant dept modal; natural row insert; conflict resolution; source links.
- TimeMap corrected block widths, production vs department lanes, relative activities,
  untimed notes, compact zoom/fit, available width; ShotRail groups/navigation.
- Flow-only continuous actual PDF viewer; existing measured PDF engine clean header,
  AM/PM/TBD, page numeral only, scoped department dropdown, no Print PDF; bounded
  server ZIP writer + department pack; new exports store metadata/zero bytes instead
  of permanent PDFs (old immutable artifacts left intact); originals still private.
- Automatic five-minute changed-active-document checkpoints, canonical no-op helpers.
- Backend production-member central guard removes narrow role eligibility; ALL private
  HTTP routes now require trusted membership. Still checks ID/email/revocation/date
  and explicit production; dedicated legacy Whiteout claims supported.
- Scheduler source on separate clean branch ui/m05-production-member-access: membership
  identity independent of self-selected profile role; approved registry assignment
  remains authoritative; productionId claim added. Owner admin policy unchanged.
- Narrow M04 creation route visual shares CreationChoices; drawing engine untouched.

Live diagnosis: owner-admin Scheduler crew page shows Director Sardor Danier
(sardordanier@gmail.com) was UNVERIFIED. Owner explicitly approved verification via async reply. Used existing
protected owner-admin UI; account now shows Verified team member (crewTab/tab4).
Evidence client/qa/m032/artifacts/m05/director-membership-verified.jpg. No other
accounts approved, no production document/content changes. Actual Director login
session is unavailable; do not claim impersonated/authenticated Director smoke.

Production new baseline /tmp/m05/correction-baseline.json includes 3 Flow records,
1 Shot List/15shots,4Storyboards/83assets,7CallSheets,26roster. Shot hash changed by
owner estimate edits during review; old zero-Flow baseline is stale. Preserve this
new baseline, no production QA writes. All destructive tests stay loopback.

Remaining substantial work: finish integrating/formatting, source/backend/client
compile; run actual browser journeys against fresh local build and FIX real defects.
Add tests for schedules/source ACK/undo, presets+dept DND, relative tasks, histories,
canonical label conflicts, source-unavailable, all-role/cross-production/revoked
HTTP+WS, XLSX62/52 preservation, PDF/ZIP full matrix/continuous preview. Inspect actual
screenshots and PDFs; do not assume new UI quality from typechecks. Fix any leftover
24h/raw timestamp/old status references in exposed corrective controls. Verify
source duration edits and timeline resizing semantics. Check instruction record IDs
and canonical shared print order. Original code remains reusable; do not redo engine.

Need review Scheduler guard changes with actual director membership diagnosis;
no silent role-only enrollment. Specific Director membership confirmation completed; no broad enrollment.
Check latest test/typecheck command completion. Then report Section41 line-by-line,
source/site/Scheduler builds+release, backend dependency order, safe source data
compatibility (no destructive production migration), actual served hashes and
read-only production verification. No M06. Do not claim owner acceptance.

Latest real Chromium corrective-browser.cjs passed creation60, preview/draft/DND,
automatic first clock/shared source durable ACK, rename/personnel, relative task,
TimeMap rail expansion, continuous PDF through last page and Master download.
ZIP then failed on empty department-focus scope; renderer patched to retain
production sequence/shared activity context even when department instructions
are empty. Must rebuild/restart local backend and rerun affected journey/ZIP.
