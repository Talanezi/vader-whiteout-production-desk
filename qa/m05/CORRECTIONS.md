# VADER: WHITEOUT — M05 FINAL CORRECTIVE IMPLEMENTATION CONTRACT

## Flow of the Day — Complete UX Recovery, Production-Aware Scheduling, Shot List Integration, Time Map, Department Management, Print Studio, Permissions & Final Release

**Model:** GPT-6.1 Sol — High reasoning
**Assignment type:** Comprehensive corrective implementation, integration, QA, and validated production release
**Milestone:** M05 of the established 12-milestone roadmap
**Status:** Deployed, owner-tested, NOT ACCEPTED
**Primary application:** Vader: Whiteout Production Desk
**Objective:** Complete M05 to the accepted M03/M04 visual and functional standard.

---

# 0. READ THIS ENTIRE CONTRACT BEFORE IMPLEMENTING

You are Codex, the implementation engineer for Vader: Whiteout.

The owner and ChatGPT have completed an extensive design review of the deployed M05 Flow of the Day application.

This document contains the resulting **approved implementation specification**.

You are not being asked to brainstorm, independently redesign the product, propose another roadmap, or decide which requirements are worth implementing.

The owner and ChatGPT have already made those product decisions.

**Your responsibility is to implement them precisely, beautifully, comprehensively, and safely.**

This is the final planned corrective implementation for M05.

The owner intends to accept and close this milestone only after every specified issue has been resolved and the real application passes live acceptance testing.

## The most important instruction

**Do not rebuild M05 from scratch.**

The initial implementation already delivered substantial functionality:

- Native Flow documents.
- Department Flow editing.
- Real M03 Shot List relationships.
- Shot Rail.
- Time Map.
- Excel importing.
- PostgreSQL persistence.
- Real-time collaboration.
- Revision infrastructure.
- Direct PDF generation.
- Multiple print products.
- Authenticated production access infrastructure.
- Working production deployment.

Much of that implementation is valuable.

The problem is that the user-facing workflow is frequently unintuitive, visually inconsistent, unnecessarily complicated, or disconnected from how an actual film-production schedule should operate.

Your job is to correct those problems while preserving working systems.

## The quality standard

M03 Shot Lists and M04 Storyboards were accepted only after extensive design and functionality improvements.

Those applications now establish the official Whiteout standard for:

- Visual hierarchy.
- Typography.
- Color.
- Animations.
- Dropdowns.
- Context menus.
- Direct editing.
- Selection.
- Dragging.
- Responsive layouts.
- Secondary interfaces.
- Collaboration.
- Printing.
- Error recovery.
- Interaction consistency.

**Every single M05 interface must meet that same standard.**

This applies just as strictly to a tiny date picker or nested event popover as it does to the main document editor.

A beautiful main screen with primitive secondary interfaces is a failed implementation.

## One implementation assignment

The owner strongly prefers completing a milestone through one comprehensive Codex assignment.

This contract is intended to finish M05.

You should organize the work internally into sensible engineering phases, but do not ask the owner to separately initiate each phase.

Do not stop after implementing only the visual redesign.

Do not stop after implementing only automatic scheduling.

Do not stop after passing local unit tests.

Complete the full approved scope, verify it, and perform the established authorized release procedure.

If an actual external limitation prevents completion, preserve all work and document the precise blocker. Do not falsely report an incomplete requirement as finished.

---

# 1. PROJECT CONTEXT AND STRICT BOUNDARIES

The project historically uses these directories:

`/Users/thameralanezi/Developer/Vader-Whiteout/`

- `vader-whiteout-site/`
- `vader-whiteout-production-desk/`
- `vader-whiteout-scheduler/`
- `Whiteout Equipment/`

Inspect the actual workspace rather than assuming these paths remain unchanged.

The parent directory may not be a Git repository.

## Established milestone status

- M01 — Apps Hub: accepted.
- M02 — Production Desk foundation: implemented.
- M03 — Collaborative Shot Lists: accepted and closed.
- M04 — Storyboards: accepted and closed.
- M05 — Flow of the Day: deployed, currently under corrective review.
- M06 — Call Sheets: future milestone.
- M07–M08 — Scheduler modernization: future.
- M09–M11 — Equipment modernization: future.
- M12 — Final integration: future.

Do not create a new roadmap.

Do not begin M06.

Do not reopen unrelated M03/M04 work.

## Narrowly authorized cross-application changes

You may make targeted changes to M03/M04 where required for:

1. Canonical shot identifiers.
2. Authoritative shared estimate updates from M05.
3. Reuse or extraction of already accepted UI components.
4. A narrowly scoped visual improvement to the M04 New Storyboard creation dialog.
5. Production Desk-wide permission consistency.

These changes must preserve the existing accepted functionality.

Do not modify the M04 drawing engine, VectorCraft integration, artwork processing, or unrelated Storyboard workflows.

Do not redesign M03's grid.

Do not rewrite the existing authentication system.

---

# 2. MANDATORY PRE-IMPLEMENTATION AUDIT

Before editing source code, inspect:

1. Current Git branches, commits and working-tree changes.
2. All relevant `AGENTS.md` files.
3. The existing M05 source.
4. The existing M05 backend model and migrations.
5. Current production deployment state.
6. Existing M05 test fixtures and QA artifacts.
7. M03's authoritative Shot List model.
8. M03's shared grid and interaction components.
9. M03's existing duration-estimate fields.
10. M03/M04's accepted dragging and selected-action interfaces.
11. M04's shot-selection dialog.
12. M04's inspector, history, comments and contextual controls.
13. M04's New Storyboard creation interface.
14. Existing date/time component implementations.
15. Existing PDF rendering and preview architecture.
16. Existing Production Desk document-index components.
17. Scheduler production membership and role definitions.
18. Backend authorization and WebSocket admission rules.
19. Existing R2 storage adapter and export pipeline.
20. The established release instructions and deployment scripts.

Historical M05 deployment evidence included:

- Backend source revision `b83593d6`.
- Website revision `f4089e5`.

These are historical references, not guaranteed current HEAD values.

The previous Codex session was interrupted near a final loading-label correction. Determine whether any changes remain uncommitted or unpublished.

Do not overwrite existing work.

Do not redo completed functionality unnecessarily.

## Preserve production baselines

Record read-only production counts and integrity evidence before any migration.

Existing Shot Lists, Storyboards, artwork, Call Sheets, roster data and Flow documents must remain intact.

Use isolated QA fixtures for destructive testing.

Never treat real production documents as disposable test records.

---

# 3. PRODUCT PHILOSOPHY — WHAT FLOW OF THE DAY MUST BECOME

Whiteout Flow of the Day is a **specialized filmmaking production-day operating schedule**.

It is not a generic spreadsheet clone.

It is not a general calendar.

It is not a conventional project-management Gantt chart.

It is not a second technical Shot List editor.

Its primary user is often a 1st Assistant Director coordinating a real shooting day.

The application must make it easier to:

- Select actual shots.
- Organize shooting order.
- Establish the start of filming.
- Calculate subsequent shot times.
- Schedule breaks and milestones.
- Coordinate department preparation.
- Make adjustments during planning.
- Review timing relationships.
- Produce department-specific documents.
- Export beautiful printable schedules.
- Collaborate with legitimate production members.

The user should not need to understand database terminology, timestamps, event types, status machines, timezone identifiers, or scheduling algorithms.

**Those capabilities should exist beneath a simple, powerful interface.**

## Primary interaction principle

The AD establishes what is happening and when important anchors occur.

Whiteout calculates the predictable relationships.

The user can override things deliberately.

The application should never force the AD to manually reconstruct information that already exists in M03.

---

# 4. AUTHORITATIVE ARCHITECTURE

There must be one authoritative Flow document with coordinated views.

## M03 Shot List owns

- Canonical shot identity.
- Scene association.
- Shot labels.
- Action/coverage descriptions.
- Camera and technical metadata.
- Shared estimated shooting durations.
- Other existing M03 technical fields.

## M05 Flow owns

- Shoot date.
- Shooting-day sequence.
- Scheduled shot occurrences.
- Schedule anchors.
- Relative timing relationships.
- Department structure.
- Department instructions.
- Day-specific duration overrides.
- Independent production activities.
- Shared milestones.
- Print preferences.
- Flow revision history.

## The scheduling layer calculates

- Effective start times.
- End times.
- Relative department activity times.
- Flexible sequential shifts.
- Conflicts.
- Derived timeline positions.

## The user interfaces display this same data

- Department Flow.
- Time Map.
- Shot Rail.
- Print Studio.

Do not maintain independent schedules in each view.

Do not duplicate M03 technical shots into a competing database.

Do not create a separate arbitrary timeline state that diverges from Department Flow.

Every derived time should have one clear calculation path.

---

# 5. SET-LOCAL CLOCK MODEL — FINAL OWNER DECISION

This replaces the previous timezone-heavy implementation.

**Flow of the Day is a physical film-set schedule, not a multi-timezone meeting application.**

The owner explicitly does not want production timezone configuration.

Do not present timezone inputs, timezone selectors, UTC offsets, or IANA timezone strings in the Flow user interface.

Do not automatically translate shooting times based on where a collaborator opens the document.

If a Flow says 9:00 AM, it must say 9:00 AM for everyone.

## Required conceptual model

Represent planned shooting times with:

- Shoot date.
- Local clock time.
- Calendar-day offset where necessary.

Example:

- November 12, 2026.
- 9:00 AM.
- Day offset 0.

For filming after midnight:

- November 13, 2026.
- 12:45 AM.
- Day offset 1.

The normal interface shows the time in 12-hour format, optionally adding a subtle Next day indicator.

Do not display full ISO timestamps for ordinary editing.

## Important implementation distinction

Administrative timestamps for collaboration, revision creation and document modification may continue using actual instants.

Those are different from scheduled shooting times.

Do not mix the two concepts.

Existing persisted records may use an older timezone-aware representation.

Provide a safe compatibility or migration strategy preserving the intended set-clock values.

Do not reinterpret saved times through a collaborator's device timezone.

Do not silently shift existing scheduled events.

## Midnight and ambiguity

If filming begins at 11:30 PM and the next sequential activity crosses midnight, calculate the following calendar day automatically.

If an independently anchored event is ambiguous, provide a compact Next day control where necessary.

No exposed timezone controls.

No unnecessary timezone-detection features.

Do not change Scheduler's separate timezone requirements for other applications.

---

# 6. SHARED DATE AND TIME COMPONENTS

Build or reuse one consistent Whiteout date/time control system.

## Date selection

Use a custom-styled calendar with:

- Month navigation.
- Clearly selectable days.
- Today action.
- Keyboard accessibility.
- Proper focus styling.
- Appropriate animated transitions.
- Typed-date support where useful.

Do not use an unstyled browser-native date input as the primary experience.

## Time selection

Use a reusable, compact Whiteout 12-hour picker.

Display:

- `9:00 AM`
- `12:30 PM`
- `6:45 PM`

Not:

- `09:00`
- `2026-11-12 09:00`
- `YYYY-MM-DD HH:mm`
- Raw timezone identifiers.

The user should be able to enter common human-readable time expressions predictably.

Support hour, minute and AM/PM editing.

Support small practical minute increments where useful without forbidding exact minute entry.

Use accessible controls and touch-friendly targets.

Support a small Next day indication for cross-midnight events.

## Reuse everywhere

This same system must appear in:

- New Flow creation.
- Shoot date editing.
- First shot timing.
- Individual timing overrides.
- Fixed milestones.
- Independent department activities.
- Time Map contextual timing.
- Other appropriate M05 schedule controls.

Do not independently create different time-input designs for each interface.

---

# 7. GLOBAL CREATE AND FLOW DOCUMENT INDEX

## 7.1 Preserve global Create

The sidebar Create menu now includes:

- New Call Sheet.
- New Shot List.
- New Storyboard.
- New Flow of the Day.

The owner likes the updated animation and interaction.

Preserve it.

Do not clip the fourth option.

## 7.2 Remove redundant New Flow button

Remove the additional `+ New Flow` button from the upper-right corner of the populated Flow index.

The global Create menu already fulfills this purpose.

Retain an attractive first-use creation invitation when no Flow documents exist.

## 7.3 Completely fix the index layout

The deployed index currently contains an excessively tall document row with a large unexplained blank region.

The Last modified/author heading is squeezed and wraps awkwardly.

Replace this with the accepted M03-style compact document index.

Appropriate information:

- Document title.
- Connected Shot List.
- Shoot date.
- Event count.
- Last updated information.
- Appropriate author metadata.
- Contextual actions.

Remove the unnecessary Status column.

Do not display `draft · 0 revisions` in the index.

Do not create giant blank card or table regions.

Metadata must align correctly and remain usable at narrower viewport widths.

## 7.4 Contextual actions

Provide:

- Open.
- Rename.
- Duplicate.
- Delete.

Reuse accepted M03/M04 menu behavior and animations.

## 7.5 Duplication replaces Previous Day creation

Remove Use Previous Day from the New Flow creation choices.

To reuse a previous Flow, the user duplicates an existing document from the index.

The new copy has its own stable identity.

Allow a new title and Shoot date.

Do not silently carry over inappropriate historical actual times, issuance statuses or publication claims.

Preserve intentional structure and useful source information.

---

# 8. COMPLETELY REDESIGN NEW FLOW CREATION

The current creation dialog is visually unacceptable.

The four option tiles are cramped, with words wrapping into one-word lines.

Its technical date/time fields make the first interaction feel like a developer tool.

Replace it with a premium Whiteout creation surface.

## Three creation routes

1. **From Shot List** — recommended/default highlighted route.
2. **Import Excel** — existing workbook.
3. **Start blank** — empty production schedule.

Remove Use Previous Day entirely.

Use attractive icons, consistent layout, subtle animation and correctly proportioned cards.

Do not reproduce the existing cramped four-tile arrangement.

## Common creation fields

Only:

- Flow title.
- Shoot date.

No production timezone.

No optional filming-start timestamp.

No status.

No technical IDs.

The first shooting time should be established within the created Flow.

## Creation workflow

The route selection should happen in a coherent interface.

Avoid a long chain of disconnected modals.

When the user selects From Shot List, use the accepted shot picker and ordering interface.

The creation draft must survive navigation, previewing, filtering and resizing.

No accidental loss of selections.

---

# 9. SHOT LIST SELECTION — REUSE M04, FIX ORDERING

The current underlying shot-selection functionality is valuable.

Reuse the accepted M04 Link Shots interface.

## Initial selection

Make it easy to select the complete relevant Shot List.

For the standard creation route, preselect the available shots and clearly show the count.

Allow scene filtering and individual deselection.

A Select shown shots control must make its filtered scope obvious.

Do not silently select hidden shots outside the currently indicated scope.

## Review selected shots

Each selected row must contain:

- Left drag handle.
- Canonical shot label.
- Short subject.
- Concise relevant metadata.
- Duration when actually available.
- Compact trash icon on the right.

Remove:

- Up button.
- Large Remove button.
- Any unnecessary duplicate ordering buttons.

Use the same excellent drag implementation already accepted in M03/M04.

Rows should move smoothly with correct insertion feedback.

Accessible keyboard reordering must remain possible without cluttering the normal interface.

## Clicking a shot

Currently, clicking a shot may navigate to M03 and destroy the New Flow creation state.

Fix this.

Normal click should open an inline preview or coordinated inspector within the creation experience.

Show relevant source-shot information without requiring navigation away.

If Open in Shot List exists, make it an explicit secondary action.

The selected sequence, filters, scroll position and draft form values must remain intact.

## Long lists

Test at least 50 selected shots.

The selected-shot list scrolls correctly.

The footer remains accessible.

Dragging near scroll edges works.

The selected count remains aligned.

No giant buttons.

No disappearing menus.

---

# 10. TARGETED M04 STORYBOARD CREATION POLISH

The owner identified one remaining visual inconsistency in M04:

The New Storyboard creation dialog still uses relatively primitive route-selection buttons.

Apply the new premium shared creation-choice treatment there.

Preserve its existing options and behavior:

- Import artwork.
- From Shot List.
- Start drawing.

Do not redesign the Storyboards system.

Do not modify the drawing engine.

Do not alter existing artwork, comments or saved documents.

This is a narrowly scoped shared visual improvement only.

---

# 11. CANONICAL SHOT LABELS — M03/M04/M05 CONSISTENCY

This requirement applies to the authoritative M03 Shot List.

A shot's normal canonical display must include:

**Scene number + hyphen + alphabetic shot code.**

Examples:

- Scene 9, entered `A` → `09-A`.
- Scene 9, entered `K` → `09-K`.
- Scene 9, entered `AA` → `09-AA`.
- Scene 12, entered `B` → `12-B`.

Use at least two digits for numeric scene numbers without truncating larger values.

Use uppercase letters for the suffix.

Sequential shot-code generation should support A–Z and further alphabetic combinations such as AA, AB, AC, etc.

## Do not use display labels as database identities

Shot UUIDs remain stable.

Existing Storyboard links and scheduled occurrences must remain intact.

## Existing duplicate/conflicting labels

The current test data includes two distinct shots labeled `B`.

Do not silently merge them.

Do not assign the same canonical label to two distinct shots in one scene without flagging the conflict.

Inspect the actual source records and provide safe correction behavior.

Preserve the original values until conflicts are resolved.

## New shot validation

Normal new-shot creation must enforce the canonical format.

A user entering only `K` within Scene 09 should end up with `09-K`.

Do not require them to type the scene prefix manually every time.

Invalid suffixes should receive understandable validation.

## Legacy/imported labels

Historical labels such as `19-1.2` may be meaningful source data.

Preserve those as original/imported references where they do not fit the canonical Whiteout convention.

Do not destroy historical label information.

M03, M04 and M05 should display a consistent resolved canonical label wherever appropriate.

---

# 12. CORE SCHEDULING ENGINE — MOST IMPORTANT FUNCTIONAL CHANGE

The current M05 requires excessive manual time entry.

This must fundamentally change.

**The AD sets the starting time of filming. Whiteout calculates the subsequent flexible shot schedule.**

## Example

Suppose:

- Shot 09-A: 20 min.
- Shot 09-B: 15 min.
- Shot 09-C: 25 min.
- Shot 09-D: 10 min.

The AD sets the first shot to 9:00 AM.

Whiteout calculates:

- 09-A — 9:00 AM.
- 09-B — 9:20 AM.
- 09-C — 9:35 AM.
- 09-D — 10:00 AM.

No individual manual start-time entry.

## Subsequent changes

If the AD changes 09-B from 15 to 10 minutes:

- 09-C becomes 9:30 AM.
- 09-D becomes 9:55 AM.

All relevant flexible events recalculate.

The system must remain dynamic; this is not a one-time fill operation.

## Internal timing relationships

Support:

1. Sequential timing.
2. Fixed clock-time anchors.
3. Relative timing to another event.
4. Unscheduled events.

These are internal concepts.

Do not force ordinary users through a technical four-mode configuration form.

## Unscheduled or unknown durations

If a shot's estimate is missing, preserve that uncertainty.

Do not fabricate 10, 15, 20 or 60 minutes.

Do not calculate a false precise schedule downstream of an unresolved duration.

Surface the missing estimate through a concise contextual action and Shot Rail issue.

## Investigate existing inherited estimates

The current New Flow screen says Duration unknown for shots that later appear with inherited durations such as 20, 10 and 13 minutes.

Trace where those values originate.

Verify that they genuinely belong to authoritative M03 estimate fields.

Correct any invented, mismapped or silently applied values.

---

# 13. SHARED SHOT ESTIMATES — OWNER'S FINAL DECISION

The normal duration edit for a linked M03 shot should update the authoritative M03 estimate.

The AD is responsible for establishing realistic shooting durations.

They should be able to correct a shared estimate directly from Flow.

## Required default behavior

The AD edits a linked shot from 20 to 15 minutes.

The change goes through M03's real authorized write path.

The actual M03 Shot List reflects 15 minutes.

Connected views receive the update.

The Flow schedule recalculates its flexible timings.

## Explicit day-only override

Also provide an intentional separate action:

**Use a different duration for this day**

This creates a day-specific M05 override without changing M03.

Make the distinction clear.

Do not create invisible day overrides through ordinary duration editing.

## Consistency

If an M03 write fails, do not pretend the shared estimate was successfully saved.

If an estimate changes while another Flow is open, preserve that Flow's fixed anchors and deliberate overrides.

Avoid overwriting other collaborators' unrelated changes.

## Persistence and authorization

Use M03's actual data contracts, validation and collaboration systems.

Do not create a second technical estimate authority in M05.

---

# 14. FIXED MILESTONES AND AUTOMATIC RESCHEDULING

The AD must be able to add events such as:

- General Call.
- Safety Debrief.
- Begin Filming.
- Lunch.
- Resume Filming.
- Location Move.
- Wrap.
- Custom production milestones.

A fixed milestone has a specified clock time.

## Lunch example

Lunch begins at 12:30 PM and lasts 30 minutes.

It must remain anchored unless the AD deliberately changes it.

After Lunch, following flexible filming events can continue at the appropriate calculated time.

## Conflicts

If a shot overlaps a fixed milestone:

- Detect the actual conflict.
- Explain it concisely.
- Preview sensible resolution choices.
- Never silently shorten the shot.
- Never secretly move the milestone.
- Never pretend the schedule has no conflict.

## Shift Following Activities

Remove the current separate Shift Following Activities dialog.

Remove its positive/negative minute input and explanatory paragraph.

Replace it with natural recalculation and contextual previews when a change has significant consequences.

For ordinary changes, the recalculation should be automatic and intuitive.

For conflicting anchored events, present an understandable before/after preview.

The operation must be undoable.

---

# 15. DEPARTMENT-SPECIFIC RELATIVE TIMING

This is a major filmmaking-specific capability.

Department instructions must be able to occur relative to filming, not merely duplicate the entire shot's time interval.

## Example

Shot 09-A starts at 9:00 AM and lasts 30 minutes.

Sound needs to begin preparation ten minutes into the shot.

The Sound instruction starts at 9:10 AM.

If 09-A moves to 9:20 AM, the Sound task moves to 9:30 AM.

The relative offset remains intact.

## Supported relationships

A department activity can be:

- Associated with an event without a separate timed interval.
- Started a specified number of minutes into an event.
- Started before or after an event.
- Independently scheduled at a fixed time.
- Unscheduled.

Optional duration can be specified.

Do not require every department note to have a separate timing record.

## Editing experience

Keep direct department-cell editing.

A small contextual timing control should appear only when needed.

The user should be able to specify the timing relationship without opening a large generic event form.

## Standalone activities

Support activities unrelated to a particular shot.

Examples:

- Early HMU preparation.
- Crew pickup.
- Equipment transport.
- Costume organization.
- Location preparation.
- Equipment strike.

These must not require dummy shot records.

---

# 16. DEPARTMENT FLOW — PRESERVE GRID, CORRECT UX

The current Department Flow grid provides useful behavior.

Preserve:

- Direct text editing.
- Multiline entry.
- Appropriate internal scrolling.
- Selection.
- Keyboard navigation.
- Collaboration.
- Working frozen-column behavior.
- Working persistence.

Implement the following targeted corrections.

## 16.1 Select All alignment

Move the Select All checkbox into a properly aligned dedicated selection gutter.

The Time label should not be awkwardly crowded by the checkbox.

Row checkboxes and drag handles should align consistently.

## 16.2 Visible text caret

The current caret is too dark against the dark editor.

Use a clearly visible, theme-appropriate caret color.

Also verify text-selection contrast and focus styling.

## 16.3 Remove description separator

The current action/coverage description sometimes has an unwanted leading dot.

Remove that decorative dot.

Preserve otherwise accepted typography, font size and description color.

## 16.4 Better row density

Short rows should be relatively compact.

Long content should wrap and expand appropriately.

Avoid unnecessary large empty cells and giant default row heights.

Do not break existing multiline editing.

## 16.5 Direct interactions

Basic row edits should happen directly in the grid.

Use accepted contextual insertion, deletion, duplication and dragging.

No giant generic form for routine changes.

## 16.6 Source update propagation

If an authorized M03 action/coverage description changes, M05 must reflect it.

Preserve the accepted M04 behavior for linked descriptions where already supported.

Test long descriptions and collaborative updates.

---

# 17. DEPARTMENT SYSTEM — FLEXIBLE, DIRECTLY EDITABLE

The current Departments and Layout modal is an oversized stack of textboxes, checkboxes, up/down controls and delete icons.

Remove that particular interface.

Most department operations should happen directly in the grid.

## 17.1 Inline header editing

Click a department heading to rename it.

Click its personnel subheader to edit personnel.

Hover/focus the heading to reveal subtle contextual controls.

Use a compact anchored menu for less frequent operations.

## 17.2 Reordering

Drag department columns horizontally.

Use smooth animated displacement.

Persist the canonical department order.

The default Master PDF must follow this shared order.

## 17.3 Resizing

Use accepted M03 column-resize behavior.

Respect frozen columns and header geometry.

## 17.4 Adding departments

Allow arbitrary custom department names.

Common presets may be offered as suggestions, but should not be mandatory.

## 17.5 Suggested defaults for new Flows

- Camera.
- Grip & Electric.
- Talent.
- Sound.
- Costume.
- Hair & Makeup.
- Props.
- Stunts.
- Director/Choreography.
- Production.

These are defaults, not permanent restrictions.

Use Talent rather than Actors in newly created templates.

## 17.6 Separate and grouped departments

Camera, Grip, Electric and Lighting must be individually configurable.

On smaller productions, departments may be intentionally grouped.

On larger productions, they may be separate.

Grouping and splitting must preserve meaningful instructions.

Do not delete data when changing a department's display configuration.

## 17.7 Existing imports

Preserve original workbook headings such as Camera + G&E and Actors until the user deliberately changes them.

Do not silently rewrite imported historical documents.

## 17.8 Department presets

Provide:

- Core Crew.
- All Departments.
- Customize.

These change display scope, not the underlying data.

Hiding does not delete.

## 17.9 Separate three layout concepts

1. Shared canonical department order.
2. Personal on-screen visibility and widths.
3. Explicit print selection and ordering.

Do not conflate them.

A hidden personal screen column must not silently disappear from the Master PDF.

---

# 18. REPLACE THE EVENT CREATION SYSTEM

The existing Add Event interface is unnecessarily complicated.

Its four options lead to repeated event editors with redundant controls.

Replace it with a coherent **Add activity** interaction.

## Common workflow

The user inserts a row at the relevant point.

Focus moves to Current Action or the appropriate department cell.

The user types the activity.

An optional compact category selector provides common suggestions:

- Lunch.
- General Call.
- Safety Debrief.
- Rehearsal.
- Transport.
- Location Move.
- Equipment Strike.
- Wrap.
- Custom activity.

Do not require selecting a category before entering ordinary text.

## Shared milestone

Allow the user to mark an activity as a shared milestone.

Apply the appropriate full-width treatment.

Retain department-specific instructions associated with that milestone.

## Department activity

An activity created from a department cell should automatically understand that department association.

Do not require a duplicate form.

## Remove redundant controls

Remove from ordinary M05 editing:

- Start Now.
- Complete Now.
- Actual start/completion form fields.
- Event status.
- Draft/Ready/Issued status.
- Comments.
- Generic event-type selector repeated inside a preselected event-type editor.
- Technical timestamp fields.
- Redundant Schedule Shots action that merely opens Shot Rail.

The Shot Rail or actual shot picker already handles inserting shots.

## Preserve data

Existing status/comment/actual-time fields may remain internally for compatibility.

Do not destructively delete production data merely because the UI is simplified.

Do not remove comments from accepted M04 Storyboards.

---

# 19. TIME MAP — COMPLETE FUNCTIONAL CORRECTION

The current Time Map is visibly inconsistent.

It can:

- Omit department instructions that lack manually entered time values.
- Display confusing duplicate blocks.
- Stack shots in a staircase-like arrangement.
- Misrepresent durations.
- Leave a huge unused area after Shot Rail closes.
- Present oversized, generic controls.

Correct all of these.

## 19.1 Lane model

Use:

**Production lane:** Shooting sequence and major shared milestones.

**Department lanes:** Actual department-specific activities.

A shot should normally appear once in the Production lane.

Do not duplicate an entire filming shot into every department merely because those departments have instructions associated with it.

## 19.2 Time geometry

Block width reflects actual effective duration.

A 10-minute shot must not occupy a default hour-long block.

A 20-minute shot occupies twice the horizontal duration of a 10-minute shot at the same scale.

Missing durations remain unresolved.

Use one coordinate system for:

- Time ruler.
- Grid lines.
- Events.
- Dragging.
- Snapping.
- Zooming.

## 19.3 Automatic sequence

Shots scheduled sequentially must appear chronologically.

Do not create a staircase because each shot is treated as an independent unrelated event.

Allow real overlaps where the schedule actually contains them.

## 19.4 Department work

Timed department instructions must appear in their correct lanes.

Relative tasks follow the relevant shot.

Independent tasks use their own start.

Untimed notes associated with a shot should remain discoverable without being assigned fake full-shot duration blocks.

## 19.5 Shared source of truth

Editing a department instruction or its timing in Department Flow must update Time Map immediately.

Do not require unrelated manual time edits or page reloads to make content appear.

## 19.6 Responsive viewport

Closing Shot Rail must expand the timeline into the available space.

The ruler, grid, blocks, background and scrolling surface must all expand.

No phantom black empty region.

No unnecessary horizontal document overflow.

## 19.7 Better toolbar

Replace the oversized buttons for Zoom In, Zoom Out, Edit Timing and Show in Department Flow.

Use compact Whiteout icons, a combined zoom control, Fit Day and contextual selected-event actions.

Keep appropriate tooltips and keyboard accessibility.

## 19.8 Editing

Users should be able to:

- Select.
- Drag to move.
- Resize duration.
- Edit an anchored time.
- Inspect a department relationship.
- Jump to the corresponding Department Flow row.

Show meaningful timing previews.

Make changes undoable.

## 19.9 Unscheduled shelf

Keep an accessible unscheduled area for unresolved events.

Make it compact and collapsible.

Explain genuine issues such as a missing estimate.

Hide it when empty.

Do not occupy a large permanent portion of the screen.

---

# 20. SHOT RAIL — REPURPOSE IT

The current Shot Rail redundantly lists scheduled shots and displays plus icons that can accidentally create duplicate occurrences.

Change its primary purpose.

## Groups

### Needs scheduling

Available or selected shots not properly included in the daily schedule.

### Needs attention

Missing estimates, unresolved source references and relevant scheduling issues.

### Scheduled

Collapsed or expandable summary of existing scheduled occurrences.

## Required behavior

A scheduled shot normally navigates to its existing occurrence.

It should not present a generic Add action.

Duplicating a scheduled occurrence remains possible through an explicit contextual operation.

Keep useful:

- Search.
- Scene filters.
- M03 linkage.
- Short descriptions.
- Source-shot inspection.

When the selected shots are all scheduled and no issues remain, the rail should not dominate the editor.

Closing it must restore editor width.

---

# 21. REVISION HISTORY — AUTOMATIC MEANINGFUL CHECKPOINTS

Retain continuous saving through existing collaboration services.

Add automatic historical checkpoints approximately every five minutes **while a Flow is actively open and meaningful changes have occurred**.

Do not generate duplicate revisions during inactivity.

Do not save identical history snapshots every five minutes forever.

## Required behavior

- Track meaningful changes.
- Group routine edits into useful revisions.
- Support simultaneous collaborators without redundant duplicate history.
- Capture suitable recovery points before significant structural operations.
- Preview earlier versions.
- Restore safely.
- Preserve the current state before restoration.

Reuse accepted M04 history UI patterns.

Revision history should not be a fake display of the last modification timestamp.

Remove the Draft/Ready/Issued lifecycle UI.

Do not expose raw revision hashes to ordinary users.

---

# 22. PRINT STUDIO — PRESERVE ENGINE, REDESIGN PRESENTATION

The owner has now inspected the actual M05 PDF output.

The underlying PDF renderer is genuinely useful.

**Do not rewrite the PDF generation engine from scratch.**

Preserve working:

- Direct PDF rendering.
- Page measurement.
- Text wrapping.
- Horizontal/vertical pagination.
- Department filtering.
- Multiple paper sizes.
- Color and monochrome styles.
- Preview/download consistency.
- Original workbook support.

Focus on correcting document composition and the surrounding Print Studio UI.

---

# 23. PRINTED HEADER — CLEAN EDITORIAL DESIGN

Remove technical application metadata from the PDF.

The current output includes:

- Whiteout / Flow of the Day.
- Timezone.
- Date unconfirmed.
- Raw revision hash.
- Draft status.
- Print-product diagnostic text.

The printed report should primarily contain:

**Flow title**

**Shoot date**

Optionally, an actual production title supplied by the document, if appropriate.

Do not automatically print Whiteout branding.

The app may eventually serve productions unrelated to Vader: Whiteout.

Do not assume the film title is Whiteout.

## Example

Scene 9 — Shoot Day
Thursday, November 12, 2026

Then the departmental table.

Use elegant, restrained typography.

No arbitrary raw identifiers.

No draft or ready status.

No timezone.

## Missing Shoot date

The current printed output says Date unconfirmed even when date-related values exist elsewhere.

Fix the source-of-truth issue.

For a document genuinely missing its Shoot date, prompt the user to assign one or use a clearly intentional missing-date indication.

Do not fabricate the date from a random event timestamp.

---

# 24. PDF TIME FORMATTING AND CONTENT

Use human-readable 12-hour times.

Examples:

- 9:00 AM.
- 9:15 AM.
- 12:30 PM.
- 8:45 PM.

Do not print a repeated full calendar date under every time.

The Shoot date belongs in the header.

For cross-midnight work, use a compact next-day indication where needed.

## Unscheduled rows

The current word Unscheduled wraps awkwardly in narrow cells.

Use a compact intentional label such as `TBD`.

The schedule's automatic timing engine should also reduce unnecessary unresolved rows.

## Estimated durations

Do not print technical metadata such as:

`20 min · inherited`

Print:

`20 min`

Do not expose internal inheritance mechanics to crew members.

## Description text

Use canonical shot labels.

Preserve actual source descriptions.

Wrap long notes properly.

Do not print unwanted decorative separators.

## Department instructions

Every instruction within the selected print scope must be preserved.

Relative department timing should appear in a useful, human-readable way.

Do not silently omit instructions.

---

# 25. PDF VISUAL COMPOSITION AND MILESTONES

Preserve the clean white-paper approach.

Improve:

- Typography.
- Grid hierarchy.
- Column padding.
- Row heights.
- Milestone spacing.
- Department header clarity.
- Contrast.
- Print legibility.

## Color

Keep tasteful muted color.

Possible treatment:

- General Call/Safety: cool blue.
- Begin/Resume Filming: subtle cyan.
- Lunch: restrained warm neutral.
- Wrap: clear concluding band.
- Ordinary shots: white.
- Department notes: white with subtle grid rules.

Do not create a garishly colorful spreadsheet.

Maintain a properly readable monochrome style.

## Row sizing

Short rows remain compact.

Long notes wrap and expand appropriately.

Shared milestones have a deliberate visual presence without excessive blank height.

Do not clip or truncate information.

---

# 26. PDF FOOTERS — OWNER'S EXACT REQUIREMENT

The current PDF footer contains:

- Section numbering.
- Department names.
- Range numbering.
- Page numbering.

Remove all of the unnecessary information.

**The printed footer must contain only the page number.**

For example:

`1`

On the next page:

`2`

Prefer a quiet, right-aligned numeral.

No department enumeration.

No Section 1/1.

No Range 1/2.

No Page 1/2 text.

The renderer may continue tracking internal pagination information, but that information must not appear in the printed footer.

---

# 27. PRINT STUDIO — CONTINUOUS MULTI-PAGE PREVIEW

The current viewer displays one PDF page at a time.

The owner only discovered the second page after downloading.

This is a major usability issue.

Replace page-by-page preview navigation with **continuous vertical PDF scrolling**.

## Required experience

- Display actual generated PDF pages in a vertical sequence.
- Scroll naturally from page one to page two and onward.
- Maintain visible page separation.
- Support Fit Width.
- Support zoom.
- Maintain sensible scroll position during zoom.
- Render longer documents efficiently.
- Allow reaching the last page without hidden navigation.
- Preserve exact preview/download bytes.

Use existing PDF viewer infrastructure where possible.

Do not generate an HTML approximation of the PDF.

## Toolbar

Remove the ugly isolated previous/next arrow controls.

Remove the line visually cutting through the arrow area.

Use compact Whiteout document-viewer controls.

A small current-page indicator may update while scrolling, but navigation must not depend on it.

The Fit Width dropdown must use the accepted Whiteout visual system.

No primitive default-looking button.

---

# 28. REMOVE BROKEN PRINT PDF ACTION

The owner tested the Print PDF button and found it nonfunctional.

Download PDF works.

Remove the broken Print PDF control entirely.

Keep Download PDF.

The downloaded PDF can be printed using the user's ordinary document viewer.

Do not replace a working download mechanism with a new print implementation.

Do not add another redundant button merely to fill space.

---

# 29. THREE PRINT PRODUCTS — EXACT BEHAVIOR

Retain:

1. Master Departmental Flow.
2. Department Focus.
3. Daily Rundown.

## 29.1 Master Departmental Flow

Includes:

- Time.
- Current Action.
- Selected departments, all by default.
- Department instructions.
- Personnel where enabled.
- Milestones.
- Relevant timing.
- Shot context.

Default department ordering follows the shared canonical Department Flow order.

Allow explicit print-scope changes.

Personal on-screen hidden columns must not silently disappear from Master output.

## 29.2 Department Focus

This is a targeted department report.

Replace the existing long department-checkbox list with **one searchable department dropdown**.

Select Sound, Talent, Costume, Camera, HMU or any custom department.

The PDF includes:

- Shoot title/date.
- Time.
- Current Action.
- Chosen department.
- Relevant shared milestones.
- Associated instructions.
- Necessary shot context.

No irrelevant department columns.

Names must follow current canonical department definitions.

## 29.3 Daily Rundown

A concise chronological production summary.

Do not show a department checklist when it has no meaning.

Preserve important filming events and shared milestones.

Clearly distinguish it from the full departmental master.

## Output formats

Retain:

- US Letter.
- A4.
- Tabloid.
- A3.

Retain appropriate portrait/landscape behavior.

Retain Editorial Color and Production Monochrome.

Do not regress pagination.

---

# 30. DEPARTMENT ZIP PACK — NEW REQUIRED FEATURE

Add **Download department pack** to Print Studio.

The purpose is to export one Department Focus PDF per selected department without requiring separate manual downloads.

## Workflow

1. Choose department pack.
2. Select all departments or a subset.
3. Generate one PDF per selected department.
4. Package them into one ZIP.
5. Download one ZIP file.

Default to all configured departments.

Allow searching and selecting a subset.

Optional inclusion of Master Flow or Daily Rundown is acceptable if it remains a simple configuration rather than an additional complicated workflow.

## Naming

Use meaningful filenames based on:

- Flow title.
- Shoot date.
- Department.

Sanitize filenames.

Avoid duplicate names.

## One revision

All PDFs in one ZIP must use the same captured Flow revision and configuration.

If a collaborator edits during generation, the package must not mix different schedule versions.

## Reuse renderer

Generate Department Focus PDFs through the existing PDF engine.

Do not create a separate lower-quality batch renderer.

## Large packages

Support realistic department counts.

Provide progress and error feedback.

Avoid excessive memory consumption.

Use bounded streaming or temporary generation where necessary.

Do not allow one large ZIP request to exhaust the application.

---

# 31. EXPORT STORAGE — NO UNNECESSARY CLOUDFLARE R2 CONSUMPTION

The owner explicitly does not want generated PDFs and ZIP packages permanently accumulating in cloud storage.

**Generated exports should be on-demand downloadable artifacts, not automatically archived media.**

Preferred behavior:

- Generate from a captured Flow snapshot.
- Preview the actual PDF.
- Deliver the PDF/ZIP to the browser.
- Release temporary bytes after completion or expiration.
- Preserve necessary lightweight revision/export metadata.
- Do not automatically upload generated PDF/ZIP files to persistent R2 buckets.

The original imported workbook and existing artwork/source assets must remain preserved privately.

Do not delete actual source files.

## Preview consistency

If the preview is based on a captured revision, Download must deliver the same revision and print settings.

Avoid stale-preview/current-download mismatches.

If a user changes the live Flow, provide a clear refresh mechanism rather than silently changing a previously previewed document.

## Security

Generated exports remain private.

Do not expose private PDFs through permanent public object URLs.

Enforce authorized production access on all export requests.

Do not introduce paid storage services.

Do not create an unnecessary background document distribution subsystem.

Full email distribution remains a future milestone.

---

# 32. PRODUCTION DESK PERMISSIONS — RELEASE-BLOCKING CORRECTION

The owner invited the director to test the application.

The director signed in and received:

`Verified production team member in an eligible role is required.`

This is unacceptable for legitimate crew collaboration.

## New policy

**Every verified member of a production should be able to access and view that production's Production Desk content, regardless of ordinary crew department title.**

This includes:

- Director.
- 1st Assistant Director.
- 2nd Assistant Director.
- Director of Photography.
- Camera crew.
- Storyboard artists.
- Production department.
- Other verified production crew members.

Do not restrict normal viewing merely because someone is not assigned to a narrow eligible-role list.

## Scope

Apply consistent viewing access to the relevant Production Desk areas:

- Shot Lists.
- Storyboards.
- Flow of the Day.
- Call Sheets.
- Roster, subject to genuinely sensitive personal-data restrictions.
- Normal Production Desk navigation.

## Viewing versus sensitive actions

Broad viewing access does not mean public access.

Only authenticated, verified members of the relevant production may view private production documents.

Normal collaboration/editing should be available to authorized crew without arbitrary departmental exclusions.

Sensitive actions such as membership administration or destructive production-wide operations can retain appropriate permission checks.

## Inspect actual cause

Do not guess that the entire problem is simply a frontend role check.

Inspect:

- Scheduler roles.
- Role naming/aliases.
- Membership verification.
- Production association.
- Frontend guards.
- Backend authorization.
- WebSocket admission.
- API permissions.

Fix the actual mismatch centrally.

Do not add an insecure frontend-only bypass.

Do not disable authentication.

## Tests

Verify access for:

- Director.
- 1st AD.
- 2nd AD.
- DP.
- Camera department.
- Storyboard Artist.
- Another verified department member.

Also verify:

- Unauthenticated user denied.
- Member of another production denied.
- Revoked member denied.
- Unauthorized API read denied.
- Unauthorized export denied.
- Unauthorized WebSocket access denied.

The director's reported failure must be reproduced and resolved.

Do not declare this requirement complete solely because the owner account works.

---

# 33. UNIFIED WHITEOUT COMPONENT CONTRACT

This is a non-negotiable global requirement.

**Every interface, including secondary and nested interfaces, must use the accepted M03/M04 design language.**

Do not imitate only the colors.

Inspect and reuse actual accepted components and implementation patterns.

## Component references

| Interface | Required foundation |
|---|---|
| Global Create | Accepted sidebar Create system |
| Document index | M03/M04 document index |
| New Flow choices | New refined shared selection controls |
| Storyboard creation | Same targeted refined selection controls |
| Shot List picker | M04 Link Shots |
| Shot ordering | M03/M04 smooth dragging |
| Department Flow | M03 editing and selection patterns |
| Column resizing | M03 grid primitives |
| Column dragging | Accepted Whiteout drag interactions |
| Delete/duplicate | Accepted animated actions |
| Context menus | M03/M04 menus |
| Date picker | Shared Whiteout calendar |
| Time picker | Shared Whiteout 12-hour control |
| Event timing | Compact anchored popovers |
| Shot Rail | M04 inspector/sidebar style |
| Time Map | Corrected M05 timeline with Whiteout controls |
| History | M04 revision preview/restore |
| Import | Existing M05 import + accepted M04 visual treatment |
| Print Studio | Whiteout controls + continuous actual-PDF viewer |
| ZIP export | Refined Whiteout export interaction |
| Errors | Existing Whiteout feedback patterns |

## Absolute visual rules

### Buttons

Use recognizable icons for compact actions.

Short labels are appropriate for meaningful primary actions.

Do not use large generic text buttons for routine utilities.

### Dropdowns

Properly anchored.

Smoothly animated.

Correct spacing.

No disappearing floating menus.

No clipping.

No excessive height.

### Inputs

Clear focus states.

Visible carets.

Good typography.

No browser-default technical forms as principal interfaces.

### Dragging

Smooth actual-item movement.

Clear insertion markers.

No giant Up/Down buttons.

No placeholder "Moving row" bars.

### Panels

Appropriate widths.

No redundant controls.

No phantom scroll ranges.

Reclaim unused space when closed.

### Modals

Use for substantial workflows.

Do not open huge forms for routine inline edits.

### Animations

Tasteful, purposeful and responsive.

Respect reduced-motion preferences.

Do not overanimate common editing operations.

### Secondary interfaces

Every tab, popover, picker, confirmation, upload screen, export setting and responsive state must be reviewed.

Do not deliver another application with a polished main dashboard and primitive nested controls.

---

# 34. SPECIFIC VISUAL DEFECTS TO PREVENT

The owner has repeatedly rejected the following patterns during M03/M04/M05 development.

They must not reappear:

1. Generic text-only utility buttons.
2. Oversized dropdowns.
3. Misaligned buttons and selection counts.
4. Redundant buttons performing the same function.
5. Large Up/Remove controls.
6. Buttons with one word per line.
7. Disappearing floating context menus.
8. Native browser date/time inputs.
9. Raw timestamp fields.
10. Unnecessary timezone strings.
11. Weak focus styling.
12. Dark text carets on dark editors.
13. Huge confirmation dialogs for small actions.
14. Giant repeated forms.
15. Fake history interfaces.
16. Comments placed in irrelevant screens.
17. Start Now and Complete Now in planning workflows.
18. Unnecessary document-status bureaucracy.
19. Unnecessary explanatory taglines.
20. Oversized empty table rows.
21. Huge unexplained blank regions.
22. Incorrect scroll ownership.
23. Detached toolbar controls.
24. Primitive PDF navigation.
25. Redundant Close next to an X.
26. Unnecessary technical metadata in printed documents.
27. Inconsistent typography between views.
28. Controls that exist but do not function.
29. Main-page quality that is not carried into secondary interfaces.
30. Features marked complete merely because an endpoint or button exists.

Treat this list as an explicit QA checklist.

---

# 35. EXCEL IMPORT — PRESERVE THE SUCCESSFUL IMPLEMENTATION

The original real-world workbook is:

`Flow-Of-The-Day September 25th [Vader _ Whiteout] Fall 2026(2).xlsx`

The earlier M05 implementation reportedly imported:

- 62 meaningful events.
- 52 department instructions.
- No populated source cells left unmapped.

Preserve and verify that behavior.

## Do not rebuild import unnecessarily

Keep existing:

- XLSX parsing.
- Cell-value extraction.
- Formatting analysis.
- Department mappings.
- Milestone identification.
- Source preservation.
- Ambiguous time-column review.
- Private storage.
- Import validation.
- Idempotent confirmation.

The original workbook's two time columns have ambiguous meanings.

Do not silently reinterpret them.

Preserve source values.

## Integration with the new clock model

Convert reviewed mapped times into the shoot-date wall-clock representation safely.

Do not infer a timezone from imported workbook values.

Do not invent one.

Do not discard original values.

## Integration with department customization

Imported department names should appear as they existed in the workbook.

The user may subsequently rename, split, group, reorder or hide them.

Preserve associated instructions.

## Integration with printing

The imported Flow must remain printable through the corrected Print Studio.

No meaningful source instructions may disappear because of the new PDF formatting.

---

# 36. COLLABORATION AND REVISION SAFETY

Use existing production authentication, persistence and real-time collaboration services.

Do not create competing infrastructure.

## Concurrent editing

Two authorized collaborators should be able to make independent changes.

Structural schedule changes must remain coherent.

Avoid lost updates and unintended overwrites.

## Scheduling updates

Automatic recalculation should be deterministic.

Avoid having different clients independently persist contradictory derived results.

Relative activity timing must update correctly when its parent event changes.

Prevent circular timing dependencies.

## Undo/redo

Routine edits and structural schedule operations should be undoable.

Undoing one user's operation must not indiscriminately erase another collaborator's unrelated work.

## Revision restoration

Restoration preserves a recovery copy of the previous current state.

Source M03 records should not be overwritten merely because an older M05 schedule revision is restored.

Handle references to changed/deleted M03 shots explicitly.

---

# 37. RESPONSIVENESS AND ACCESSIBILITY

Test:

- Desktop.
- Laptop.
- Tablet.
- Narrow viewport.
- Browser zoom at 100%, 125%, 150% and 200%.

## Main editor

Frozen columns remain usable.

Horizontal scrolling does not create phantom page height.

Vertical scrolling behaves correctly.

## Time Map

Responsive lane layout.

Correct geometry when Shot Rail opens/closes.

No blank region occupying the former rail width.

## Print Studio

Settings pane remains accessible.

Preview scrolls independently and correctly.

All pages reachable.

## Accessibility

Support:

- Keyboard navigation.
- Visible focus.
- Accessible icon labels.
- Drag alternatives.
- Appropriate screen-reader semantics.
- Escape-to-dismiss.
- Correct focus restoration.
- Touch targets.
- Reduced motion.
- High-contrast critical inputs.

Do not sacrifice accessibility merely to remove visually ugly text buttons.

Use accessible behavior beneath refined icon-based controls.

---

# 38. REQUIRED ENGINEERING QA

Create real automated tests for the corrected behavior.

Do not rely only on manually inspecting the application.

## Scheduling tests

- First-shot time calculation.
- Sequential shots.
- Changed shared estimate.
- Day-only override.
- Fixed Lunch.
- Fixed-event conflict.
- Unknown duration.
- Relative department task.
- Independent department task.
- Cross-midnight calculation.
- Reordering.
- Undo/redo.
- Concurrent updates.
- No circular dependencies.

## Shot integration tests

- Source UUID remains stable.
- Canonical label formatting.
- Existing duplicate labels.
- Long source descriptions.
- Shared estimate write-through.
- Failed source writes.
- Cross-view synchronization.
- Source shot deletion/unavailability.
- Reconnection behavior.

## Creation tests

- Three creation routes.
- Default shot selection.
- Deselect/filter.
- Drag selected shots.
- Delete selected shot from draft.
- Preview without navigation loss.
- Long list scrolling.
- Draft preservation.
- Duplication from index.
- Proper Shoot date persistence.

## Department tests

- Rename.
- Add custom.
- Add personnel.
- Reorder.
- Resize.
- Group/split.
- Hide/show.
- Print order.
- Preserve instructions.
- No accidental deletion.

## Time Map tests

- Correct duration widths.
- Correct lane.
- Correct relative offsets.
- No duplicate shot blocks.
- Correct ruler alignment.
- Zoom.
- Drag.
- Resize.
- Open/close Shot Rail.
- No phantom overflow.
- Correct unscheduled shelf.

---

# 39. PRINT AND ZIP QA — FULL MATRIX

Printing remains a first-class release requirement.

Test:

- Original September 25 workbook.
- Small Flow.
- Large Flow.
- Long department instructions.
- All departments.
- Custom departments.
- Reordered departments.
- Hidden personal columns.
- Fixed milestones.
- Relative department activities.
- Independent activities.
- Missing times.
- Cross-midnight.
- Canonical shot identifiers.
- Multiple PDF pages.
- Master Flow.
- Department Focus.
- Daily Rundown.
- Letter.
- A4.
- Tabloid.
- A3.
- Landscape and supported portrait configurations.
- Editorial Color.
- Production Monochrome.

## PDF visual inspection

Render actual PDF pages and inspect:

- Header.
- Shoot date.
- Typography.
- Department widths.
- Column order.
- Row heights.
- Text wrapping.
- Milestone bands.
- Page boundaries.
- Footer.
- Continuation pages.
- No clipping.
- No missing text.
- No repeated technical metadata.
- No unintended blank pages.

## Content verification

Every instruction within the selected print scope must be represented.

Do not declare success because the PDF file is valid if the printed content is wrong.

## Continuous preview

Verify all pages appear in one scrollable sequence.

Verify reaching page two and the final page.

Verify Fit Width.

Verify zoom and scroll position.

Verify preview/download content consistency.

## ZIP tests

Verify:

- Correct selected departments.
- One PDF per department.
- Correct filenames.
- No duplicate names.
- No missing department content.
- All files based on the same revision.
- Valid ZIP archive.
- Successful download.
- Reasonable memory behavior.
- Cancellation/error handling.
- No unexpected persistent R2 exports.

---

# 40. COMPLETE LIVE USER JOURNEY — RELEASE-BLOCKING

Implement and test this entire journey.

## Stage A — Create

The AD opens global Create.

Selects New Flow.

Chooses From Shot List.

Enters title and Shoot date.

Selects shots.

Previews a shot without losing progress.

Drags selected shots into order.

Creates the document.

No timezone.

No raw timestamps.

No Up/Remove buttons.

## Stage B — Calculate schedule

Sets first shot to 9:00 AM.

All following valid shots receive calculated times from real estimates.

Changes one shared estimate.

M03 reflects the new value.

M05 recalculates.

## Stage C — Add milestones

Adds Lunch at 12:30 PM for 30 minutes.

Lunch remains fixed.

Following flexible timing is handled appropriately.

Conflicts are visible and resolvable.

## Stage D — Departments

Renames Actors to Talent.

Separates Camera and Grip & Electric.

Adds custom department.

Adds personnel directly under heading.

Reorders departments.

Enters multiline instructions.

## Stage E — Relative timing

Adds Sound preparation ten minutes into a shot.

Adds an independent HMU task.

Moves the shot.

Dependent Sound time recalculates.

Independent HMU time remains appropriate.

## Stage F — Time Map

Opens Time Map.

Shots occupy correct durations.

Sound activity appears at correct offset.

No duplicate shot blocks.

Closes Shot Rail.

Timeline fills available width.

Navigates back to Department Flow correctly.

## Stage G — Revisions

Makes meaningful edits.

Allows an automatic checkpoint.

Verifies no duplicate idle checkpoints.

Previews and restores safely.

## Stage H — Printing

Opens Print Studio.

Sees all pages with continuous scrolling.

Uses clean title/date.

Sees no timezone, draft status or raw revision hash.

Sees AM/PM times.

Sees canonical department order.

Sees only page numeral in footer.

Downloads Master PDF.

Chooses Sound Department Focus.

Downloads Sound PDF.

Generates a multi-department ZIP.

All files are correct and do not permanently accumulate in R2.

## Stage I — Access

Signs in as a verified Director.

Opens Production Desk.

Views Shot Lists, Storyboards, Flow, Call Sheets and appropriate Roster data.

Repeats with representative crew roles.

Unauthorized users remain blocked.

## Stage J — Regression

Reopens accepted M03.

Reopens accepted M04.

Verifies drawing, Storyboards, Shot List editing, source links and printing are unchanged except for the narrowly approved improvements.

---

# 41. COMPLETE REQUIREMENT ACCEPTANCE MATRIX

Every line must be tracked as implemented, tested, or explicitly blocked.

Do not silently omit requirements.

| Requirement | Required result |
|---|---|
| Global Create | Preserved and functional |
| Redundant New Flow | Removed |
| Index row geometry | Compact and properly aligned |
| Index metadata | No squeezed author column |
| Index status | Removed |
| Duplication | Available from document context |
| Previous-day creation | Removed |
| Creation interface | Premium three-route design |
| Shoot date | Custom calendar |
| Timezone controls | Removed from M05 UI |
| Set-local time | No viewer-dependent conversion |
| Midnight | Correct next-day handling |
| Time picker | 12-hour Whiteout control |
| Shot selection | Select all/deselect/filter |
| Shot order | Animated dragging |
| Up/Remove buttons | Removed |
| Shot preview | No lost draft |
| Canonical labels | Scene-prefixed uppercase letters |
| Duplicate labels | Safely handled |
| Source UUIDs | Preserved |
| Automatic schedule | Correct sequential calculation |
| Unknown duration | No invented estimate |
| Shared estimate | Writes to M03 |
| Day-only override | Separate explicit operation |
| Fixed milestone | Remains anchored |
| Conflicts | Meaningful preview/resolution |
| Shift Following dialog | Removed |
| Relative department timing | Correct offsets |
| Independent tasks | Supported |
| Department labels | Configurable |
| Talent default | Implemented for new documents |
| Camera/Grip/Electric | Separately configurable |
| Custom departments | Supported |
| Personnel | Inline header editing |
| Column drag | Correct animation |
| Column resize | Preserved |
| Column hide | Non-destructive |
| Layout presets | Core Crew/All/Customize |
| Huge department modal | Removed |
| Select All alignment | Corrected |
| Caret contrast | Corrected |
| Action separator dot | Removed |
| Multiline editing | Preserved |
| Add activity | Contextual workflow |
| Custom activity categories | Easy to discover |
| Start Now/Complete Now | Removed |
| Event statuses | Removed |
| Flow status lifecycle | Removed |
| Event comments | Removed from M05 UI |
| Time Map duration | Accurate block width |
| Time Map lanes | Correct production/department separation |
| Time Map source | Same Flow document |
| Time Map empty space | Fixed |
| Time Map toolbar | Premium compact controls |
| Shot Rail | Needs scheduling/attention/scheduled |
| Duplicate plus action | Removed for already scheduled shots |
| Revisions | Automatic meaningful checkpoints |
| Import | Source-complete and preserved |
| PDF engine | Preserved |
| PDF header | Flow title/date only as primary metadata |
| PDF branding | No automatic Whiteout label |
| PDF timezone | Removed |
| PDF raw hash/status | Removed |
| PDF time display | AM/PM |
| PDF inherited label | Removed |
| PDF unscheduled display | Compact TBD |
| PDF footer | Page numeral only |
| PDF milestone colors | Refined |
| PDF column order | Shared canonical order |
| Print preview | Continuous vertical pages |
| Preview toolbar | Whiteout component quality |
| Print PDF | Removed |
| Download PDF | Preserved |
| Department Focus | Single department selector |
| Daily Rundown | No irrelevant department checklist |
| Department ZIP | Functional |
| ZIP revision | Consistent snapshot |
| R2 usage | No automatic permanent export files |
| Director access | Fixed |
| 1st/2nd AD access | Fixed |
| DP/Camera/Storyboard access | Fixed |
| Other verified crew | Appropriate viewing access |
| Cross-production security | Enforced |
| M03 regression | Passed |
| M04 regression | Passed |
| Production data integrity | Preserved |
| Deployment | Actually served and verified |
| Owner acceptance | Reserved for owner's review |

---

# 42. IMPLEMENTATION SEQUENCE — ONE COMPREHENSIVE ASSIGNMENT

Organize internally into these phases.

They are not separate requests.

## Phase 1 — Audit and preserve

Inspect current repository and deployment.

Preserve working changes.

Establish baseline data and QA.

## Phase 2 — Scheduling architecture

Implement set-local clock handling, sequential calculations, fixed anchors, relative tasks, shared estimate write-through and safe overrides.

Implement canonical shot-label behavior.

## Phase 3 — Creation and grid UX

Redesign New Flow, selected-shot ordering, date/time controls, index, direct department editing and contextual activity creation.

Apply narrowly scoped Storyboards creation polish.

## Phase 4 — Time Map and Shot Rail

Correct timeline geometry, activity relationships, block durations, scrolling, responsive expansion and planning rail interactions.

## Phase 5 — Printing

Preserve PDF rendering.

Redesign PDF header/footer/content formatting.

Implement continuous preview.

Simplify Department Focus.

Remove Print PDF.

Implement department ZIP exports without persistent storage.

## Phase 6 — Permissions and history

Fix verified-production-member viewing across Production Desk.

Implement automatic meaningful revisions.

Remove unnecessary status/comment UI safely.

## Phase 7 — Visual QA

Inspect every primary and secondary interface.

Correct spacing, animation, iconography, responsive behavior and consistency.

## Phase 8 — Full regression and release

Run all required tests.

Inspect actual generated PDFs.

Verify source and production integrity.

Complete the established authorized backend/frontend release sequence.

Do not declare the milestone accepted.

---

# 43. DEPLOYMENT AND RELEASE REQUIREMENTS

Follow the actual current repository release documentation.

Do not assume historical script names remain unchanged.

Use the existing backend and site publication workflows.

If backend changes are required:

1. Verify builds.
2. Verify additive migrations.
3. Release backend.
4. Confirm backend health.
5. Confirm production data integrity.
6. Publish matching frontend.
7. Verify served asset hashes.
8. Perform authorized live smoke tests.

If a change is frontend-only, do not unnecessarily redeploy unrelated backend systems.

Do not force-push.

Do not alter unrelated website files.

Do not introduce paid services.

Do not publish an incompatible frontend before its backend requirements are available.

Do not perform destructive QA on actual production records.

Use the established repository's authorized commit/push/deployment practices.

If additional authorization is genuinely required by the environment, preserve the completed source and report the precise release boundary rather than falsely claiming deployment.

---

# 44. MANDATORY FINAL REPORT

When implementation is complete, deliver a detailed factual report.

## A. Source state

- Actual commits.
- Branches.
- Relevant changed files.
- Outstanding uncommitted work, if any.

## B. Functional implementation

Explain what changed in:

- Creation.
- Scheduling.
- M03 integration.
- Departments.
- Time Map.
- Shot Rail.
- Event creation.
- Revision history.
- Printing.
- ZIP exports.
- Permissions.

## C. Visual QA

Provide real integrated screenshots, not generic component demos.

Include:

- New Flow creation.
- Selected-shot ordering.
- Main Department Flow.
- Department header editing.
- Date/time controls.
- Timing recalculation.
- Time Map.
- Shot Rail.
- Activity creation.
- Print Studio.
- Multi-page preview.
- Department Focus.
- ZIP selection.
- Index.
- M04 creation polish.

## D. PDF evidence

Provide representative actual PDFs or PDF render evidence.

Confirm all output products and supported sizes.

Report missing/clipped-content tests.

## E. Security evidence

Report verified member access, cross-production denial, revoked access and export authorization checks.

## F. Regression

Report M03/M04 test outcomes.

## G. Production release

Confirm actual deployed backend and served frontend revisions.

Report real health and asset verification.

## H. Acceptance matrix

Address every requirement in Section 41.

Do not replace this with a generic "all tests passed" statement.

## I. Genuine limitations

Identify any actual incomplete behavior or unverified device/browser condition.

Do not claim tests were run on physical hardware if only automated browser simulation was performed.

Do not claim a PDF looks excellent merely because it was technically generated; include visual evidence.

Do not claim the milestone was accepted by the owner.

---

# 45. FINAL NON-NEGOTIABLE QUALITY RULES

M05 is not finished merely because it compiles.

M05 is not finished because the backend is deployed.

M05 is not finished because a PDF downloads.

M05 is not finished because each requested feature has a button.

M05 is complete for handoff only when:

- The AD can create and manage a production day intuitively.
- Shooting times mostly calculate themselves.
- M03 remains authoritative.
- Department work behaves correctly.
- Time Map truly reflects the schedule.
- Department editing is direct and flexible.
- The user never encounters unnecessary timezone/status bureaucracy.
- Every interface follows the accepted Whiteout design system.
- Printing is beautiful, understandable and accurate.
- Department PDFs can be obtained individually or as a ZIP.
- Generated exports do not unnecessarily consume R2 storage.
- Real verified production members can access their production's documents.
- M03/M04 remain stable.
- The release is genuinely verified.

**Do not simplify an essential requirement because its implementation is difficult.**

Use the available coding capacity to implement the established design.

Do not produce another design plan.

Do not begin M06.

Do not invent new product features instead of completing these.

Do not independently substitute primitive UI for an approved refined interaction.

---

# 46. FINAL EXECUTION INSTRUCTION

The owner and ChatGPT have already completed the research, planning and design decisions.

This contract defines the final corrective implementation of **Vader: Whiteout M05 — Flow of the Day**.

Your role is to implement it faithfully.

Inspect the existing source.

Preserve the substantial work already completed.

Correct the scheduling engine.

Correct the user experience.

Correct the Time Map.

Correct department interaction.

Correct the print presentation.

Implement department ZIP downloads.

Fix production-member permissions.

Reuse accepted M03/M04 design patterns everywhere.

Verify every requirement.

Preserve production data.

Complete the authorized release process.

Deliver actual evidence and a requirement-by-requirement implementation report.

**The owner will personally test the deployed application and determine final milestone acceptance.**

The goal is to deliver an application so polished, intuitive and reliable that no further major corrective cycle is required.

**BEGIN THE COMPLETE M05 CORRECTIVE IMPLEMENTATION NOW.**
