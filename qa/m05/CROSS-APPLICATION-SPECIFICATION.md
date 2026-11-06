# VADER: WHITEOUT
# FINAL M03–M05 CROSS-APPLICATION REFINEMENT & M05 COMPLETION CONTRACT

**Assignment:** Comprehensive implementation, integration, visual refinement, regression testing, and production deployment  
**Recommended model:** GPT-6.1 Sol — High reasoning  
**Scope:** Production Desk shared shell, M03 Shot Lists, M04 Storyboards, and M05 Flow of the Day  
**Status:** M03 and M04 accepted; additional improvements authorized. M05 implemented but awaiting final acceptance.  
**Target:** Complete the remaining M05 requirements, deliver the newly approved cross-application features, and return the entire system for final owner verification.

---

# 0. MANDATORY INSTRUCTIONS — READ BEFORE STARTING

You are Codex, the implementation engineer for Vader: Whiteout.

The owner and ChatGPT have completed another extensive design review informed by the actual Director of Photography, Assistant Director, and hands-on testing of the deployed Production Desk.

This document is the **approved engineering and design contract** for the resulting implementation.

It is not a brainstorming request.

It is not an invitation to redesign the application independently.

It is not permission to restart previously completed milestones.

**Your responsibility is to implement every approved requirement faithfully, using the existing architecture and established visual system.**

The owner and ChatGPT design, research, evaluate, and approve product behavior. Codex implements those specifications and verifies that the resulting software works.

You must not substitute your own simplified workflows where a particular interaction has been explicitly specified.

## The most important boundary

**M03 Shot Lists and M04 Storyboards remain accepted.**

We are adding useful features and correcting a few targeted issues. We are not reopening their architecture or redesigning them.

**M05 remains the active milestone requiring final acceptance.**

The objective of this assignment is to finish M05 while incorporating the approved additions across M03/M04 and the shared Production Desk.

Do not begin M06.

Do not create another roadmap.

Do not rebuild the applications from scratch.

Do not create additional independent systems where the existing repository already contains working infrastructure.

## The quality standard

M03 and M04 established the official Whiteout standard for:

- Premium, cohesive interface design.
- Intentional typography and spacing.
- Beautifully animated, tactile controls.
- Smooth dragging and reordering.
- Precise contextual menus.
- Excellent direct editing.
- Deliberate selection behavior.
- Cohesive empty states.
- Reliable collaboration.
- Well-designed inspectors and secondary interfaces.
- Responsive layouts.
- Accessible iconography.
- High-quality PDF output.
- Reliable undo, recovery, and persistence.

Every new component must achieve that standard.

A beautiful main editor does not excuse primitive secondary interfaces.

A technically working feature with unacceptable interaction design is not complete.

An attractive UI backed by incorrect data or unreliable persistence is not complete.

**Both functionality and presentation are mandatory acceptance requirements.**

---

# 1. THIS CONTRACT EXTENDS THE PREVIOUS M05 CONTRACT

The previous M05 corrective contract specified, among other things:

- Unified Whiteout component design.
- Simplified New Flow creation.
- Custom date and 12-hour time controls.
- Production-local wall-clock scheduling.
- Canonical M03 shot labels.
- Automatic sequential scheduling.
- Fixed milestones.
- Relative department activities.
- Customizable departments.
- Improved Department Flow.
- Improved Time Map.
- Better Shot Rail behavior.
- Revision history.
- Excel import preservation.
- Continuous PDF preview.
- Clean printed headers and footers.
- Department Focus printing.
- Department ZIP exports.
- No unnecessary permanent R2 export storage.
- Production-member viewing permissions.
- Full M03/M04 regression preservation.

**All previously approved requirements remain active unless explicitly superseded below.**

Do not assume the previous Codex session finished every requirement.

The previous Codex run reached its usage limit after reportedly deploying a substantial amount of work.

The latest screenshots show several improvements already present.

You must audit the actual current repository and deployment before implementing changes.

### Explicitly superseded decisions

There are four important additions or clarifications:

**1. Estimated versus allotted durations**

The DP's estimated shot duration and the AD's allotted shot duration are distinct authoritative values.

The planned schedule uses the AD's allotment when available, otherwise the DP's estimate.

Editing the AD's allotment must not silently overwrite the DP's estimate.

**2. Actual production progress**

M05 now requires reliable actual shooting-time records, color-coded shot progress, and cumulative schedule tracking.

**3. Printed Flow title**

The printed title must use the format:

`Flow of the Day — [custom title]`

without duplicating that prefix when already present.

**4. Ten-department wide printing**

The current standard ten-department Cave Scene configuration must fit across one Tabloid landscape page width, with readable content.

Other previously approved behavior remains intact.

---

# 2. MANDATORY REPOSITORY AND DEPLOYMENT AUDIT

Before modifying source code, inspect the actual current workspace.

Historical project structure:

`/Users/thameralanezi/Developer/Vader-Whiteout/`

Relevant repositories historically include:

- `vader-whiteout-production-desk`
- `vader-whiteout-site`
- `vader-whiteout-scheduler`

These paths are historical references. Verify their existence and the current workspace rather than assuming they are unchanged.

## Required initial inspection

Read:

1. Applicable `AGENTS.md` files.
2. Current repository instructions.
3. Relevant M03 source and QA tests.
4. Relevant M04 source and QA tests.
5. Relevant M05 source and QA tests.
6. Latest M05 release documentation.
7. Current Git branches and commits.
8. Uncommitted changes.
9. Existing database migrations.
10. Production data and read-only integrity evidence.
11. Current API and authentication architecture.
12. Scheduler membership and authorization definitions.
13. Existing PDF generation and viewing code.
14. Existing R2 storage adapters.
15. Existing collaboration and revision infrastructure.
16. Existing Whiteout shared UI components.
17. The previous M05 corrective requirements, where available.
18. The nine latest screenshots supplied with this assignment.

## Do not destroy work from the interrupted session

Some changes may have been:

- Committed and pushed.
- Committed locally but not published.
- Built and deployed.
- Modified but not committed.
- Implemented but not tested.

Determine the actual state.

Preserve valid work.

Do not blindly replace current files with an older branch or release.

## Completion audit

For every requirement inherited from the previous M05 contract, classify the present implementation as:

- Implemented and verified.
- Implemented but defective.
- Partially implemented.
- Missing.
- Blocked by a demonstrated external dependency.

Then act accordingly.

Do not spend hours rebuilding already accepted, functioning features.

Do not skip incomplete previous requirements merely because this new contract emphasizes additional features.

---

# 3. SCREENSHOT EVIDENCE — NINE NEW REFERENCES

The owner supplied nine screenshots in order.

Use them as specific visual evidence, not merely general inspiration.

| Screenshot | Evidence |
|---|---|
| 01 | AD's existing spreadsheet: Time Stamps, Estimated Time, Allotted Time, Actual Time Stamp |
| 02 | Current Cave Scene Department Flow and Shot Rail |
| 03 | Current M05 Print Studio with ten departments |
| 04 | PDF split horizontally, leaving Production on another page |
| 05 | Repetitive Layout dropdown with Hide/Show commands |
| 06 | Time Map compressing short shots into illegible overlapping blocks |
| 07 | M04 Storyboard palette before editing a selected color |
| 08 | M04 palette after editing: unwanted swatch shifts and replacement failure |
| 09 | M04 Storyboard printing with six panels and generic panel names |

Inspect each screenshot closely.

The screenshot evidence does not prove the underlying code-level cause of every defect.

Reproduce each failure against the current implementation and identify the actual cause before patching it.

For Screenshots 07 and 08, reproduce the exact palette-editing sequence.

For Screenshot 04, reproduce the orphan Production column.

For Screenshot 06, reproduce the compressed short-duration blocks.

These are mandatory visual regression cases.

---

# 4. PRODUCT ARCHITECTURE — DO NOT BREAK THE ECOSYSTEM

Whiteout is a connected filmmaking production ecosystem.

Its applications are not isolated documents.

## M03 Shot Lists owns

- Stable shot identity.
- Scene relationships.
- Canonical shot number.
- Action/coverage.
- Subject and cast references where available.
- Technical shot metadata.
- DP estimated shooting duration.
- Shared row-color organization.
- Shot-linked preferred-take records.

## M04 Storyboards owns

- Storyboard documents.
- Panel identity.
- Drawings and imported artwork.
- VectorCraft artwork state.
- Storyboard color palette.
- Visual Description.
- Panel ordering.
- Existing comments and history.
- Shot linkage.

## M05 Flow of the Day owns

- Shoot date.
- Shooting-day structure.
- Scheduled shot occurrences.
- AD allotted duration.
- Planned order and timing.
- Day-specific adjustments.
- Fixed milestones.
- Relative department activities.
- Department instructions.
- Department configuration.
- Actual production timestamps.
- Actual shot-block progress.
- Production-day timing log.
- Flow revision history.
- Printing preferences.

## Shared derived systems calculate

- Planned shot starts and ends.
- Actual elapsed duration.
- Estimate/allotment zone.
- Schedule variance.
- Shot-budget variance.
- Time recovered.
- Department-relative positions.
- Relevant conflict warnings.

## Non-negotiable rule

Do not create competing authoritative copies of M03 shots inside M05.

Do not store planned schedules independently in Department Flow and Time Map.

Do not create separate best-take fields that diverge between M03 and M05.

Do not make the printed schedule use a different scheduling algorithm.

All views must consume consistent, authoritative data.

---

# 5. M03 — SHARED SHOT ROW COLORING

The Director of Photography has specifically requested the ability to color Shot List rows for visual organization.

This is an approved feature.

## Required interaction

Add a compact Row color action using the accepted M03 contextual menu or selection toolbar.

Support:

- Coloring one shot.
- Coloring multiple selected shots.
- Changing an existing color.
- Clearing colors.
- Persisting color assignments.
- Displaying colors to authorized collaborators.

Use a refined palette of muted, accessible colors appropriate to the Whiteout dark theme.

The DP should not be forced to assign predefined meanings to the colors.

These colors are freeform organizational labels.

## Visual behavior

Prefer:

- Subtle row background tint.
- Clearer narrow color accent.
- Consistent text contrast.
- Preserved selected-row distinction.
- Preserved hover treatment.
- Preserved keyboard focus treatment.

Do not turn entire rows into aggressively saturated blocks.

Do not make selected text illegible.

Do not change row heights or the established grid layout.

## Interaction quality

Reuse accepted Whiteout popover positioning and animations.

No large generic color-selection modal.

No browser-default color picker as the only interface.

The existing custom Whiteout picker can be reused where appropriate.

## Persistence

Store the shared organizational color against the authoritative shot.

Preserve it through:

- Reload.
- Sorting.
- Filtering.
- Dragging.
- Collaboration.
- Shot editing.
- Source-linked views.

Support undo/redo through the existing model.

If current M03 print/export facilities represent row colors, preserve print legibility and avoid unexpectedly introducing saturated fills.

## Critical distinction

Organizational row colors must remain separate from M05's computed green/yellow/red production-timing status.

A blue organizational row stays blue.

An over-allotted shot may separately show a red timing indicator.

Do not overwrite the DP's color because of operational progress.

---

# 6. M03 — DEDICATED ASSISTANT DIRECTOR VIEW

The current M03 view system does not adequately address the AD's actual needs.

Add a dedicated preset:

**AD / On-Set**

Use the accepted M03 view-switching architecture.

Do not create a second Shot List editor.

Do not redesign other existing presets.

## Core AD fields

The default AD view should prioritize:

1. Shot number.
2. Scene.
3. Subject/Talent.
4. Action/Coverage.
5. DP estimated duration.
6. AD allotted duration when a shooting-day context exists.
7. Shooting progress when available.
8. Preferred take.
9. Relevant production notes.

Avoid displaying unnecessary cinematography-specific fields by default.

The AD does not need every lens, camera format, sensor setting, or other technical parameter in the default view.

Those remain available through the established technical view presets.

## Shooting-day context

An M03 shot can appear in multiple M05 Flows.

Therefore, day-specific allotted duration and actual progress must not be represented as timeless attributes of the source shot.

When the AD view needs shooting-day information, allow the user to select the relevant linked Flow where necessary.

If no Flow exists, show the source estimate and shot details without inventing actual timestamps or allotments.

## Visual requirements

Use the accepted M03 grid components.

No new incompatible table engine.

Maintain:

- Sorting.
- Filtering.
- Selection.
- Collaborative editing.
- Column alignment.
- Keyboard interaction.
- Smooth transitions.
- User-specific view preferences where supported.

The DP's selected view must not be unexpectedly changed when the AD switches to their own preset.

---

# 7. M03/M05 — AUTHORITATIVE PREFERRED TAKE

The AD reported that the existing Shot List AD workflow lacks a convenient Best Take field.

Implement a shared preferred-take system.

## Data behavior

A shot may have:

- One primary preferred take.
- Additional usable takes where needed.
- Optional concise notes.
- Author attribution.
- Relevant shooting-day or occurrence provenance.

Use stable shot IDs and durable take references.

Do not store a preferred take as a disconnected text label in multiple documents.

## Editing behavior

An authorized user can:

- Record a take.
- Mark it preferred.
- Mark additional takes usable.
- Change the preferred take.
- Clear a mistaken selection.
- Add a concise optional note.

The basic workflow should remain lightweight.

Do not build a full script-supervisor continuity suite.

Do not require extensive technical metadata for every take.

## M03 AD View

The preferred take must be visible and editable.

Example:

`Take 3` with a suitable preferred-take indicator.

No generic hidden notes field.

## M05 Flow

The same preferred-take information must be accessible from the corresponding shot occurrence.

The AD should be able to record or update the selection while using Flow on set.

M03 must reflect the change.

The information must remain connected to the correct shot and shooting occurrence.

## Multi-day behavior

A shot may be attempted on more than one date.

Preserve the relationship between source shot, take record, and actual shooting occurrence.

Do not confuse Take 3 from an earlier shooting day with another recording that reused the same local take number.

Keep source-shot identity stable.

## Collaboration

Updates must propagate to authorized viewers.

Conflicting updates must not silently overwrite one another without appropriate revision behavior.

Use existing permissions and collaboration infrastructure.

---

# 8. M05 — THREE DISTINCT PRODUCTION-TIME VALUES

This is the foundation of the new live production feature.

The AD's spreadsheet explicitly separates:

1. Estimated Time.
2. Allotted Time.
3. Time Stamps.
4. Actual Time Stamp.

Do not collapse them.

## 8.1 DP estimated time

Owned by the authoritative M03 shot.

Represents the DP's estimate of how long the shot should take.

Example: `8 min`.

## 8.2 AD allotted time

Owned by the M05 scheduled occurrence.

Represents the amount of schedule time the AD assigns.

Example: `10 min`.

## 8.3 Planned start

Calculated by M05.

Example: `6:20 PM`.

Derived from the shooting order, allotted durations, fixed milestones, gaps, and timing rules.

## 8.4 Actual start

Recorded during production.

Example: `6:23 PM`.

Represents the moment the AD begins calling for sound and camera for that shot block.

It is not necessarily the camera's literal Roll timestamp.

Do not mislabel it as confirmed camera rolling time.

## 8.5 Actual elapsed

Calculated from valid actual start/end information.

For a completed block:

`actual elapsed = actual end − actual start`

For an active block:

`live elapsed = current authoritative time − actual start`

Do not treat a still-active block as completed.

Do not fabricate an end timestamp when insufficient information exists.

---

# 9. M05 — SCHEDULED DURATION RULES

The previous M05 implementation used inherited shot estimates and day-specific overrides.

This contract clarifies the correct meaning.

## Effective planned duration

For a linked shot:

- Use AD allotted duration when explicitly defined.
- Otherwise use the authoritative M03 estimate.
- If neither exists, the duration remains unresolved.

Do not invent a duration.

## Editing the allotment

The AD may change the allotted duration directly from Flow.

This changes the shooting-day budget.

It must not overwrite the DP estimate.

## Editing the actual estimate

When an authorized user deliberately selects an action to edit the source estimate, use the authoritative M03 write path.

The distinction between Estimate and Allotted must be visually clear.

No hidden override ambiguity.

## Example

M03 estimate: 8 minutes.

M05 allotted: 10 minutes.

The planned schedule advances by 10 minutes.

The live timing zone uses both thresholds.

If the DP later changes the estimate to 9 minutes, the allotment remains 10 unless deliberately changed.

## Missing data

Do not infer an estimate from a previous unrelated record.

Do not silently use generic defaults.

Surface unresolved timing through a concise Needs attention indication and contextual editing affordance.

---

# 10. M05 — LIVE PRODUCTION MODE

Create a dedicated but compact **Live Progress** capability inside Flow of the Day.

This is not a separate application.

This is not a new unrelated dashboard.

It should operate within the existing Flow workspace.

## Initial state

Before live logging begins, Flow remains a normal planning document.

The AD sees planned times and durations.

No fake active shot.

No automatically started production timer.

## Starting a shot

The AD selects the relevant shot occurrence and uses an obvious, compact Start shot control.

At that moment:

- Record the actual shot-block start.
- Record the responsible user.
- Persist the event.
- Mark the occurrence active.
- Begin deriving elapsed progress.
- Update other authorized collaborators.

## Start semantics

The logged actual start corresponds to the AD beginning to call for sound and camera.

Do not describe it as a verified physical camera Roll timestamp.

## Advancing to the next shot

When a shot is currently active and the AD chooses Start next shot, provide a fast transition.

For consecutive blocks, the transition may use the same recorded boundary to close the current block and start the next.

Do not require multiple unnecessary forms.

If an intentional gap occurs, support explicitly ending the current block separately.

Do not silently attribute breaks, delays, or unrelated waiting time to the preceding shot.

## Finishing a block

Allow an explicit Finish block operation.

The record becomes completed.

Its actual elapsed duration is calculated.

## Skipping a shot

Allow the AD to mark a planned shot skipped or not filmed without inventing actual timestamps.

The schedule must distinguish skipped from completed.

Do not automatically delete the shot from the planned Flow.

## Repeated shot occurrences

Support revisiting a shot later in the day.

Each occurrence must remain independently identifiable.

Do not merge separate actual shooting intervals.

## Manual timestamp corrections

The AD may forget to press Start.

Allow a previously recorded actual start or end to be corrected.

Use a clear 12-hour time picker consistent with Whiteout.

Preserve the previous value in an audit record.

Recalculate affected durations and variance.

## Undo and recovery

A mistaken Start/Finish action must be recoverable.

Do not use an irreversible destructive workflow for an ordinary timing mistake.

---

# 11. LIVE TRACKING MUST SURVIVE REAL ON-SET CONDITIONS

This system may remain open for hours.

It must withstand interruptions.

## Persistence

Do not implement the active timer only through temporary frontend state.

Store durable events.

A reloaded page reconstructs the current active block.

## Offline/reconnection

If the connection drops:

- Preserve locally pending supported actions safely.
- Clearly indicate unsynchronized actions.
- Reconcile when the connection returns.
- Avoid duplicate Start events.
- Avoid silent data loss.

Use the existing collaboration architecture.

Do not introduce an unnecessary new real-time service.

## Multiple collaborators

Only one active primary production shot block should be treated as authoritative for a given Flow unless the existing document explicitly supports independent simultaneous units.

Prevent conflicting concurrent start transitions.

If two authorized users act simultaneously, handle the conflict deterministically.

Do not create two contradictory active main blocks.

## Accurate elapsed time

Use reliable persisted event timestamps and an appropriate server-authoritative timing basis.

Do not accumulate elapsed time by repeatedly incrementing a frontend counter.

A browser tab going to sleep must not stop the elapsed calculation.

## Set-local display

The previous M05 owner decision remains:

No visible timezone selection.

No viewer-dependent conversion of the planned set schedule.

Persist the set-clock representation needed to display actual production times consistently, while retaining real instants for elapsed calculations and auditing.

Do not use a remote collaborator's device timezone to silently change displayed shooting times.

Handle midnight transitions correctly.

---

# 12. GREEN / YELLOW / RED SHOT PERFORMANCE

Implement the AD's proposed three-zone model.

## Green

Actual elapsed is at or below the DP estimate.

## Yellow

Actual elapsed exceeds the DP estimate but remains at or below the AD allotment.

## Red

Actual elapsed exceeds the AD allotment.

## Example

Estimated: 8 minutes.

Allotted: 10 minutes.

- 7:30 elapsed → Green.
- 8:45 elapsed → Yellow.
- 10:30 elapsed → Red.

The exact boundary at the estimate remains green.

The exact boundary at the allotment remains yellow.

Beyond the allotment becomes red.

## Visual treatment

Use premium, compact Whiteout components.

Appropriate examples:

- Small progress strip.
- Colored status marker.
- Numeric elapsed value.
- Remaining time.
- Accessible textual status.

Do not flood entire table rows with saturated warning colors.

Do not use flashing backgrounds.

Do not overwrite M03 organizational row colors.

Use semantic labels in addition to color.

## Missing thresholds

If the estimate is missing, do not fabricate a green threshold.

If the allotment is missing, do not fabricate a red threshold.

If the allotment is shorter than the estimate, flag the inconsistent budget and offer a clear correction or explicit acknowledgement rather than showing contradictory zone statuses.

---

# 13. LIVE PROGRESS UI — SPECIFIC DESIGN

The AD needs useful information without losing the main schedule.

Create a compact, collapsible live-progress surface integrated with the Flow workspace.

It should provide:

- Active shot number.
- Active shot description where appropriate.
- Actual start.
- Current elapsed.
- DP estimate.
- AD allotment.
- Current zone.
- Time remaining or overrun.
- Fast finish/advance control.
- Optional preferred-take access.
- Overall production variance.

Do not create a giant permanently visible dashboard occupying half the editor.

A compact live strip or well-anchored panel is preferred.

## Interaction priorities

Primary:

- Start.
- Finish.
- Advance to next shot.

Secondary:

- Correct actual time.
- Record preferred take.
- View detailed timing.

Use recognizable icons and concise labels.

Do not create large primitive text-only buttons for every action.

## The active shot must remain discoverable

A user should be able to identify the current live shot from:

- Department Flow.
- Time Map.
- A relevant shot inspector or compact live control.

Maintain one shared active-event state.

---

# 14. OVERALL PRODUCTION PERFORMANCE

The AD wants to know not merely whether a particular shot is late, but whether the entire shooting day is recovering time.

Implement two distinct metrics.

## 14.1 Shot-budget variance

Compare each completed shot block with its allotted duration.

For shot i:

`budget variance = actual elapsed − allotted duration`

Positive means time over budget.

Negative means time saved.

Cumulative shot-budget variance is the sum across valid completed blocks.

Do not include unfinished blocks in completed totals without clearly identifying a live projection.

## 14.2 Schedule-clock variance

Compare actual progress against the corresponding planned schedule checkpoint.

This includes effects of:

- Late initial start.
- Delays.
- Gaps.
- Fixed milestones.
- Lunch.
- Location moves.
- Reordered shots.
- Completed blocks.

A day may be behind the planned clock even while individual shots are using less than their allotted time.

Do not falsely label time saved against shot budgets as proof that the entire day is ahead.

## Example

One shot overruns by seven minutes.

Four subsequent shots save ten minutes.

The shot-budget position becomes three minutes ahead of allotment.

If the day had started twelve minutes late, the actual schedule may still be behind.

Both figures must remain understandable.

## Display

Show a compact numerical result such as:

`12 min behind schedule`

and, separately where relevant:

`3 min recovered against shot budgets`

Use appropriate progress indicators.

Avoid a complicated analytics dashboard.

The AD's request is for useful live production intelligence, not an entire reporting platform.

---

# 15. LIVE TIMING AND NON-SHOT ACTIVITIES

The Flow includes more than shots.

It may contain:

- Lunch.
- Safety Debrief.
- General Call.
- Location Move.
- Rehearsal.
- Equipment Strike.
- Wrap.
- Other custom milestones.

The live timing system must handle these without pretending they are shots.

## Break handling

An actual Lunch interval must be recorded separately when used in the live log.

Do not add Lunch time to the preceding shot's elapsed duration.

## Fixed milestones

Preserve planned fixed anchors.

Recording an actual time must not silently overwrite the original planned time.

Keep planned and actual values distinct.

## Delays and gaps

Allow an actual period between shot blocks to remain identifiable.

Do not force every minute of the day into a shot duration.

## Rescheduling

If the AD deliberately changes planned future timing during production, keep the appropriate audit/revision history.

Do not silently rewrite past planned-versus-actual comparisons.

Maintain enough snapshot or baseline information to explain variance after a plan adjustment.

---

# 16. M05 DEPARTMENT FLOW — AUTOMATIC TALENT INFORMATION

The latest screenshot shows a source Subject value included in Current Action while the Talent column remains empty.

Fix this data-placement problem.

## Current Action

Show:

- Canonical shot number.
- Relevant action/coverage description.

Do not automatically prepend subject text as a redundant fragment.

Preserve the source action wording and existing accepted styling.

## Talent

When M03 provides recognizable cast/performer information, automatically expose it in the Talent department.

Use existing cast, roster, or source-shot relationships when available.

## Do not assume every Subject is a person

A subject might be:

- A performer.
- A prop.
- A vehicle.
- A location.
- An object.

Do not place non-person subjects under Talent merely because they occupy M03's Subject field.

When source information is ambiguous, allow a simple explicit association or correction.

## Separate linked Talent from department instructions

Display recognized Talent information from the source.

Allow the AD to add independent Talent department instructions.

Example:

Linked Talent: Ani.

Instruction: Ani ready in costume, standby at cave entrance.

The instruction must not disappear when the DP edits a source-shot description.

## Synchronization

Update relevant linked Talent information when the authoritative source changes.

Preserve manually authored department notes.

## Printing

Ensure linked Talent appears in:

- Department Flow.
- Master Flow PDF.
- Talent Department Focus.
- Relevant department ZIP exports.

No independent manually maintained cast list should be required for ordinary mapped shots.

---

# 17. M05 — DEFAULT TEN-DEPARTMENT CONFIGURATION

Use the owner's current Cave Scene configuration as the default for newly created Flow documents.

Order:

1. Camera & Lighting.
2. Grip & Electric.
3. Talent.
4. Sound.
5. Costume.
6. Hair & Makeup.
7. Props.
8. Choreography.
9. Director.
10. Production.

Preserve the configurable department model.

Users must still be able to:

- Add custom departments.
- Rename departments.
- Reorder departments.
- Hide/show departments.
- Resize columns.
- Configure personnel.
- Group or separate departments appropriately.

Existing documents must not be silently overwritten with the new defaults.

Retain previously approved direct-header editing.

Preserve imported workbook department names unless the user changes them.

Allow practical reuse of a department configuration without inventing a complicated new settings subsystem.

---

# 18. COMPLETELY REFINE THE M05 LAYOUT MENU

Screenshot 05 shows repetitive entries such as:

- Hide Camera & Lighting.
- Hide Grip & Electric.
- Hide Talent.
- Hide Sound.
- Hide Costume.
- Add department.

This is unacceptable interaction design.

Replace the repetitive text-command menu.

## Required layout

Provide compact presets:

- Core Crew.
- All Departments.
- Customize.

Below them, provide a clean list of departments with:

- Department name.
- Visibility checkbox or switch.
- Small drag handle where ordering is appropriate.
- Clear Add Department action positioned prominently.

The user should not need to read Hide/Show repeatedly.

## Add Department

Make it obvious and accessible near the top of the department list.

Use a compact premium action.

Do not hide it after ten existing departments where the user must scroll to discover it.

## Direct editing

The Layout menu must not become the only place where department information can be edited.

Preserve direct editing from the column headers.

## Display semantics

Distinguish:

- Shared department order.
- Personal screen visibility/width.
- Explicit PDF output selection/order.

Hiding a column on-screen must not automatically remove it from the Master PDF.

## Visual behavior

Use accepted Whiteout:

- Smooth popover opening.
- Proper anchoring.
- Consistent checkbox styles.
- Correct hover/focus states.
- Compact spacing.
- No oversized dropdown.
- No disappearing menu.
- No raw repetitive button labels.

---

# 19. TIME MAP — FIX EXTREMELY SHORT SHOT COMPRESSION

Screenshot 06 shows multiple short shots compressed into an illegible cluster.

The timeline grid itself is visually good.

Preserve that foundation.

Correct block presentation and interaction.

## Time geometry must remain truthful

Actual block width must correspond to effective planned duration.

Do not make a three-minute shot visually occupy the same time width as a thirty-minute shot.

At a scale of 120 pixels per 30 minutes, a three-minute block is genuinely narrow.

The solution is adaptive presentation, not false time geometry.

## Adaptive display density

When the time scale is compressed:

- Use compact blocks or ticks.
- Avoid rendering overlapping full labels.
- Reveal details through a refined tooltip/inspector.
- Provide usable selection targets.
- Keep adjacent events individually accessible.

When zoomed in:

- Reveal fuller labels.
- Show appropriate resize handles.
- Show relevant actions.
- Preserve proportional duration.

## Fit Day

Fit Day should calculate the real scheduled span.

It should adapt to a short or long production day.

Avoid huge empty regions where only a few minutes of actual scheduling exist.

Avoid cramming long schedules into illegible labels.

## Hit targets

Visible timed geometry and interactive hit targets may be different.

Preserve accurate temporal positioning while making short events selectable.

Do not solve clickability by falsifying duration width.

## No visual overlap

Fix:

- Overlapping labels.
- Overlapping controls.
- Indistinguishable small blocks.
- Unnecessary horizontal overflow.
- Incorrect scrolling.
- Broken lane alignment.

## Live integration

When a shot is active:

- Indicate its live state in the Production lane.
- Make its progress accessible.
- Show the actual start where useful.
- Preserve planned duration geometry.
- Avoid visually pretending the actual duration and planned duration are identical.

Keep the distinction between the planned block and actual progress clear.

## Pressure tests

Test:

- 1-minute shots.
- 2-minute shots.
- 3-minute shots.
- 5-minute shots.
- 10-minute shots.
- 30-minute shots.
- 2-hour activities.
- 50 consecutive short shots.
- 15-hour days.
- Simultaneous department activities.
- Missing durations.
- Shot Rail open/closed.
- Desktop/tablet/narrow viewport.
- Browser zoom 100–200%.

All event labels and controls must remain usable.

---

# 20. PRINT STUDIO — PRESERVE THE WORKING PDF FOUNDATION

The owner likes much of the revised PDF output and Print Studio.

Do not rebuild the PDF renderer from scratch.

Preserve:

- Current PDF generation.
- Continuous vertical page preview.
- Existing paper sizes.
- Existing print styles.
- Text wrapping.
- Correct vertical pagination.
- Department Focus.
- Daily Rundown.
- Download functionality.
- Preview/download consistency.
- Relevant import data.
- Existing export authorization.

Correct the specific deficiencies below.

---

# 21. MASTER FLOW PRINTING — TEN DEPARTMENTS ACROSS ONE WIDTH

Screenshot 04 shows Production appearing alone on a second horizontally separated page.

That is a serious printing defect for the standard configuration.

The current normal ten-department Flow must fit on **one Tabloid landscape page width**, while remaining legible.

The document may naturally continue over multiple pages vertically.

Do not create a second horizontal page solely for one leftover department.

## Required solution

Implement more intelligent, content-aware PDF column layout.

Measure and allocate width for:

- Time.
- Current Action.
- Camera & Lighting.
- Grip & Electric.
- Talent.
- Sound.
- Costume.
- Hair & Makeup.
- Props.
- Choreography.
- Director.
- Production.

The ten department columns are in addition to Time and Current Action.

Do not accidentally omit Choreography or Director merely to satisfy the width requirement.

## Width allocation

- Reserve a usable width for Time.
- Preserve enough width for Current Action.
- Allocate department widths based on available space and content requirements.
- Allow long department names to wrap deliberately in headers.
- Reduce excessive padding before reducing text size.
- Use Tabloid's physical width effectively.
- Avoid unnecessary minimum widths that force orphan sections.
- Maintain legible print font sizes.

## Do not cheat

Do not:

- Hide Production.
- Drop empty departments without permission.
- Truncate content silently.
- Use unreadably microscopic text.
- Make a giant unprintable virtual canvas.

For the supplied standard ten-department Cave Scene example, the one-width-page requirement is mandatory.

For extreme custom configurations, use controlled, balanced horizontal sections when physically necessary.

Repeat Time and Current Action in those sections.

Do not produce an almost empty orphan page.

## Mandatory PDF regression

Generate an actual PDF from the supplied Cave Scene configuration or an equivalent exact QA fixture.

Confirm that all ten departments appear in the same horizontal section on Tabloid landscape.

Visually inspect the actual rendered PDF.

Do not treat a valid PDF file as proof that layout is acceptable.

---

# 22. PRINTED FLOW TITLE — EXACT FORMAT

The user's saved document title may be:

`Cave Scene`

The printed title must be:

**Flow of the Day — Cave Scene**

Apply this consistently to:

- Master Departmental Flow.
- Department Focus.
- Daily Rundown.
- Department ZIP PDFs.

## Avoid duplicate prefixes

If the user saved the document as:

`Flow of the Day - Cave Scene`

or:

`Flow of the Day — Cave Scene`

the printed result must not repeat the generic prefix.

Normalize display presentation without destructively rewriting the saved document title.

## Header content

Include primarily:

- Standardized document title.
- Shoot date.

Department Focus may include a small appropriate department subtitle.

Do not print:

- Whiteout branding.
- Raw revision hash.
- Draft/Ready/Issued status.
- Timezone.
- Internal diagnostic metadata.
- Unnecessary application identifiers.

## Footer

Preserve the previous owner's requirement:

**The PDF footer contains only the page numeral.**

Example:

`1`

Not:

`Page 1 of 2`

Not:

`Section 1/1`

Not a list of departments.

---

# 23. PRINTING — ACTUAL PRODUCTION LOG

Extend existing M05 printing carefully to support recorded on-set progress.

Do not create a completely separate PDF engine.

Provide an optional:

**Include production log**

or another equally simple print option.

The default pre-production schedule should remain clean.

When the production log is included, show relevant:

- Planned start.
- Actual start.
- Estimated duration.
- Allotted duration.
- Confirmed actual elapsed.
- Optional progress indication where useful.

Do not display an active block as a completed duration.

Do not mix planned and actual timestamps into one ambiguous column.

Do not require all departments to become narrower merely because a user wants actual timing; use a deliberate print layout or an appropriate compact log section.

Preserve PDF legibility.

The AD should be able to distribute the original planned schedule without live-record fields if desired.

---

# 24. DEPARTMENT PRINTING AND ZIP EXPORTS

Retain the three approved print products.

## Master Departmental Flow

Full production schedule with included departments.

Follow canonical department order.

## Department Focus

One selected department and relevant shared production context.

Use the previously approved single searchable department selector, not an unwieldy repeated checkbox list.

## Daily Rundown

Concise production sequence.

Do not display irrelevant department controls.

## Department ZIP pack

The previous M05 contract required exporting selected department PDFs into one ZIP.

If not already completed, implement it.

Requirements:

- Choose all or selected departments.
- Generate through the existing authoritative PDF renderer.
- Use one consistent Flow revision.
- Include correctly named PDF files.
- Preserve source content.
- Provide usable progress/error feedback.
- Deliver one downloadable ZIP.

## Storage

Do not automatically archive every generated PDF or ZIP permanently in R2.

Generate on demand.

Release temporary resources appropriately.

Preserve existing private source assets and imported workbooks.

## Preview

Retain continuous vertical actual-PDF viewing.

Do not regress to single-page arrow-only navigation.

Keep the functioning Download PDF control.

Do not reintroduce the previously broken redundant Print PDF button.

---

# 25. M04 STORYBOARDS — FIX THE TWELVE-SWATCH PALETTE

The owner tested the existing M04 color palette.

Screenshot 07 shows the palette before changing a selected swatch.

Screenshot 08 shows the result after choosing a replacement color.

The wrong swatch changes or swatches shift.

Correct the underlying interaction and state-management behavior.

## Fixed twelve slots

The visible palette must contain twelve stable swatch positions.

Do not automatically create a thirteenth swatch when editing a selected color.

Do not push older colors out because a new value was chosen.

Do not reorder swatches according to recent usage.

## Editing behavior

When the user selects a swatch and changes its color through HEX, color controls, or intentional eyedropper replacement:

**The selected swatch changes color in its existing position.**

The other eleven swatches remain unchanged.

The selected brush uses the new value for subsequent marks.

## Separate selecting from editing

Clicking a swatch selects that color.

Editing the active swatch changes its stored color.

Sampling a color should not silently rearrange the palette.

Make the interaction understandable and consistent.

## Palette persistence

The customized twelve-color palette must survive:

- Reload.
- Navigation.
- Saving.
- Drawing-tool changes.
- Continued editing.
- Collaboration where applicable.

## Existing artwork

Previously drawn strokes retain their actual saved colors.

Changing a swatch must not recolor all past marks that happened to use the old color.

Do not regress the previously fixed behavior where changing brush properties must not unexpectedly mutate old artwork.

## Preserve M04 drawing quality

Do not rewrite:

- VectorCraft.
- Apple Pencil handling.
- Generic stylus support.
- Existing drawing tools.
- Eraser modes.
- Shape assistance.
- Artwork history.
- Imported artwork handling.
- Existing panel collaboration.

This is a targeted palette-state and UI correction.

## Required regression

Reproduce the screenshot 07 → 08 sequence.

Change a selected red swatch into blue.

Verify that same swatch becomes blue in place.

Verify all other positions are stable.

Verify twelve slots remain.

Verify existing drawings remain unchanged.

Verify reload persistence.

---

# 26. M04 STORYBOARDS — VISUAL DESCRIPTION

Rename the user-facing **Visual notes** field to:

**Visual description**

Preserve existing field content.

This is not permission to delete or recreate historical panel metadata.

## Improve accessibility

The Visual Description must be easy to reach from the normal Storyboard grid and panel viewer.

Do not require opening a panel, opening a hidden inspector, switching tabs, and searching for the input.

Provide a compact contextual affordance.

For example:

- A short description preview in the panel card's metadata area.
- A small Add description action when empty.
- Inline or anchored editing.
- Direct access from the panel viewer.

Do not add a permanently expanded giant textbox to every panel.

Preserve the accepted card layout, animations and spacing.

## Field semantics

Visual Description describes what the frame depicts or what happens visually.

It is distinct from:

- Comments.
- Artwork annotations.
- Shot List technical metadata.
- Panel history.

Comments remain collaborative and should not automatically print as visual descriptions.

---

# 27. M04 STORYBOARD PDF — SIX AND EIGHT PANELS

The owner wants the existing six-panel portrait output retained as the default.

Add eight panels per page as a supported alternative.

## Default

- US Letter.
- Portrait.
- Six panels per page.
- Visual Description included automatically.

## Additional density

- Eight panels per page.
- Appropriate two-column/four-row composition where viable.

Preserve artwork aspect ratios.

Do not crop artwork just to fit more panels.

Do not silently truncate long descriptions.

If necessary, allow content-aware pagination rather than forcing unreadably small text.

## Printed labels

Replace generic:

- Panel 1.
- Panel 2.
- Panel 3.

with actual canonical linked shot identifiers where available.

Example:

`09-A`

Below or alongside the artwork, include its Visual Description.

If multiple shots are linked, show an appropriately concise set of identifiers.

If a panel has no linked shot, do not invent one.

Do not print an unnecessary generic Panel number merely to fill space.

## Descriptions are default content

Visual Description must be included automatically.

The user should not have to discover and enable a hidden Notes checkbox.

Remove or repurpose redundant print controls carefully.

Do not confuse Visual Description with comments or drawing annotations.

## Tests

Generate actual PDFs containing:

- Linked panels.
- Unlinked panels.
- Imported artwork.
- Drawn artwork.
- Multiple linked shots.
- Short descriptions.
- Long descriptions.
- Six-panel pages.
- Eight-panel pages.
- Multiple pages.

Inspect actual PDF page images.

Verify download and preview consistency.

---

# 28. PRODUCTION DESK — SHARED EMPTY STATES

Different Production Desk applications currently have inconsistent first-use screens.

Standardize them.

## One shared design component

Use common:

- Layout.
- Illustration treatment.
- Typography.
- Spacing.
- Action placement.
- Animation.
- Focus behavior.
- Responsive behavior.

Each application can use its own appropriate illustration and message.

## Standard application states

Shot Lists:

`No shot lists yet`

Storyboards:

`No storyboards yet`

Flow of the Day:

`No production days yet`

Call Sheets:

`No call sheets yet`

Use the correct application icon/illustration.

Do not reuse a Call Sheet icon for Storyboards.

## State distinctions

Do not confuse:

- Empty document collection.
- Signed-out state.
- No selected production.
- Insufficient authorization.
- Loading.
- Error.

A signed-out user should not see a misleading Create Storyboard invitation as if their account had no documents.

## Preserve the visual standard

Derive the component from accepted Whiteout designs.

No generic emoji illustrations.

No random incompatible layouts.

No oversized generic buttons.

This should feel like one application suite.

---

# 29. PRODUCTION DESK — ACCOUNT MENU AND SIGN OUT

The owner reports that signing out or switching accounts is not discoverable.

Add a discreet account control near the bottom-left sidebar.

## Preferred placement

Near existing:

- All applications.
- Collapse sidebar.

Use a compact avatar/user icon or equivalent.

## Popover behavior

Show:

- Current signed-in account.
- Sign out.
- Switch account or return to sign-in through the supported auth flow.

Do not create a useless empty Settings page.

Do not add unrelated account-management features.

## Authentication behavior

Scheduler remains the authentication authority.

Use the actual supported sign-out mechanism.

When signing out:

- Invalidate or clear the correct session.
- Disconnect authenticated collaboration sessions.
- Prevent stale private production data from remaining accessible.
- Return to a proper signed-out experience.
- Preserve saved documents.
- Allow another authorized account to sign in.

Do not merely hide the interface while retaining an authenticated session.

Do not indiscriminately delete unrelated browser storage.

## Visual behavior

Consistent with Whiteout popovers.

Correct expanded/collapsed sidebar behavior.

Keyboard accessible.

Proper focus restoration.

No giant settings button.

---

# 30. PREVIOUS M05 REQUIREMENTS THAT MUST STILL BE VERIFIED

Before final release, verify the previous corrective contract's unresolved requirements.

This includes:

## Creation

- Shared global Create menu.
- No redundant populated-index New Flow button.
- Premium three-route New Flow selection.
- Custom date picker.
- No user-facing timezone bureaucracy.
- Proper selected-shot dragging.
- No Up/Remove buttons.
- No lost creation draft.
- Good long-list scrolling.

## M03 integration

- Canonical shot identifiers.
- Stable shot UUIDs.
- Existing duplicate-label safety.
- Authoritative source updates.
- No incorrect source-shot merging.
- Correct long descriptions.

## Scheduling

- Automatic sequential timing.
- Correct fixed milestones.
- Relative department activity timing.
- Independent tasks.
- Cross-midnight behavior.
- Deterministic recalculation.
- Conflict detection.
- Undo/redo.
- No fake durations.

## Department Flow

- Direct editing.
- Visible text caret.
- Correct selection alignment.
- No unwanted separator dot.
- Good row density.
- Smooth department dragging.
- Correct personal visibility.
- Correct canonical order.

## Time Map

- Accurate duration geometry.
- Correct department lanes.
- No duplicate entire-shot blocks.
- Functional Shot Rail.
- No phantom negative space.
- Correct zoom and scrolling.

## History

- Meaningful change-based automatic checkpoints.
- Approximately five-minute active-edit checkpoint behavior.
- No duplicate idle revisions.
- Preview and restore.
- Appropriate collaboration safety.

## Excel import

- Preserve original workbook mapping and source data.
- Preserve ambiguous time-column review.
- Preserve imported department instructions.
- Preserve existing source provenance.
- Prevent unintended data loss.

## Printing

- Clean headers.
- Correct AM/PM.
- No raw metadata.
- Only page numerals in footer.
- Continuous PDF preview.
- Department Focus.
- Daily Rundown.
- Department ZIP.
- No unnecessary permanent R2 exports.

## Permissions

- Broad viewing access for verified production members.
- Appropriate authorized editing.
- Cross-production isolation.
- Revocation.
- Backend/API/WebSocket consistency.
- Roster privacy boundaries.
- Export authorization.

Do not undo any completed correction.

If an item is still defective, finish it within this assignment.

---

# 31. GLOBAL WHITEOUT VISUAL CONTRACT

This requirement applies to every changed component.

The design must remain consistent with accepted M03/M04.

## Buttons

Use deliberate iconography.

Primary actions may retain concise labels.

Do not use large, primitive text buttons for trivial controls.

## Dropdowns

Use compact, correctly anchored menus.

No excessive widths.

No disappearing floating menus.

No bad pointer transitions.

No repeated Hide/Show text when a visibility control is clearer.

## Forms

Use custom Whiteout date/time components.

Avoid raw ISO timestamp fields.

Avoid unnecessary technical terminology.

Avoid browser-native appearance differences in primary editing workflows.

## Dragging

Actual items move smoothly.

Clear insertion positions.

No generic Up/Down controls where dragging is the intended interaction.

## Selection

Aligned selection counts.

Consistent checkboxes.

Consistent bulk action bars.

Accepted animated delete/duplicate feedback.

## Empty states

Use the new shared design.

## Panels

No unnecessary negative space.

No conflicting scroll ownership.

No redundant control pairs.

## Typography

Respect the established Whiteout hierarchy.

Keep small supporting metadata visually subordinate.

Avoid default-looking browser typography.

## Animations

Purposeful, subtle, tactile.

Respect reduced-motion settings.

Avoid excessive animation in time-sensitive AD operations.

## Secondary interfaces

Inspect:

- Color pickers.
- Row-color menus.
- Take-selection popovers.
- Actual-time editors.
- Live progress controls.
- Department layout menus.
- Print settings.
- Description editors.
- Account menu.
- Confirmation states.
- Error states.
- Narrow viewport layouts.

Do not polish only the primary pages.

---

# 32. IMPLEMENTATION ARCHITECTURE AND MIGRATIONS

Prefer additive, backward-compatible changes.

## Preserve existing identities

Maintain:

- Shot UUIDs.
- Panel UUIDs.
- Scheduled occurrence IDs.
- Document IDs.
- Source links.
- Existing revision references.

## Add only necessary fields or related records

Potential new concepts include:

- Shared row-color token.
- Preferred-take records.
- AD allotted duration.
- Production actual-event log.
- Active shot-block state.
- Progress snapshot/revision metadata.
- Storyboard palette slots.

The actual schema design must follow existing conventions.

Do not create parallel duplicate tables without a legitimate reason.

## Migration safety

Use additive migrations where possible.

Keep historical data recoverable.

Do not convert existing estimated durations into allotted durations unless the migration preserves their original meaning and source.

Do not silently create actual timestamps for old Flows.

Do not discard existing palette colors.

Do not overwrite existing department notes.

## Source-of-truth clarity

Each important field must have a documented authority.

M03 controls source shots.

M04 controls artwork and descriptions.

M05 controls the shooting-day schedule and actual operational log.

Derived metrics should be recomputed from authoritative data rather than becoming independent editable truths.

---

# 33. LIVE LOGGING DATA INTEGRITY

The production log is operational data, so it deserves stronger guarantees than a decorative timer.

## Durable events

Use stable event IDs and appropriate server validation.

Record:

- Relevant Flow.
- Scheduled occurrence.
- Event type.
- Actual timestamp.
- Recorded-by attribution.
- Correction metadata where applicable.

## Event sequence validation

Do not allow impossible silent transitions such as:

- Finishing a block that never started.
- Completing the same block twice with conflicting times.
- Starting two active primary blocks simultaneously.
- Recording an end earlier than its start without explicit correction handling.

## Corrections

Corrections should preserve history.

Recompute derived metrics.

Prevent duplicate actions during network retries.

## Clock synchronization

Do not rely on a continuously incremented client-side database value.

Use durable actual timestamps and an appropriate authoritative elapsed calculation.

Display the same recorded set-local clock values consistently across collaborators.

## Performance

A progress display may update frequently.

That does not require writing to the database every second.

Persist transitions and corrections, not repetitive timer ticks.

## Revisions

Do not generate a full document history snapshot for every elapsed second.

Meaningful log transitions and corrections may be auditable independently of periodic Flow revision checkpoints.

---

# 34. REQUIRED END-TO-END TEST — DP WORKFLOW

Create an isolated authorized QA scenario.

The DP opens an M03 Shot List.

They:

1. Assign a blue organizational color to a shot.
2. Bulk-color several other shots.
3. Clear one color.
4. Change a DP estimated duration.
5. Switch view presets.
6. Reload.
7. Open the same document in another authorized session.

Verify:

- Colors persist.
- Colors synchronize.
- Text contrast remains correct.
- Existing selected-row behavior works.
- Estimates save correctly.
- Existing M03 functionality remains unchanged.

Do not use real production documents as destructive test fixtures.

---

# 35. REQUIRED END-TO-END TEST — AD WORKFLOW

The AD opens M03 AD / On-Set View.

Verify relevant columns and appropriate source context.

They open a linked M05 Flow.

Set:

- DP estimate: 8 minutes.
- AD allotment: 10 minutes.

Verify the schedule uses 10 minutes.

Start the shot.

Verify the live zone:

- Green through 8:00.
- Yellow after 8:00 through 10:00.
- Red after 10:00.

Advance to the next shot.

Verify correct actual timestamps and duration.

Record a preferred take.

Verify M03 displays the correct take.

Simulate:

- Late start.
- Early completed shot.
- Over-allotted shot.
- Short recovery sequence.
- Lunch.
- Gap between blocks.
- Timestamp correction.
- Reconnection.
- Page refresh.
- Second authorized collaborator.

Verify:

- Correct shot-budget variance.
- Correct schedule-clock variance.
- No duplicate actual events.
- No lost active state.
- Correct provenance.
- No broken collaboration.

---

# 36. REQUIRED END-TO-END TEST — FLOW LAYOUT AND PRINTING

Create or safely fixture a Flow matching the current Cave Scene configuration.

It must include all ten default departments.

Add recognized Talent and custom department instructions.

Verify Current Action does not display redundant subject fragments.

Verify Talent information appears automatically.

Open Layout.

Verify:

- Presets.
- Visibility controls.
- Obvious Add Department.
- Department reordering.
- No repeated Hide/Show menu.
- No loss of instructions.

Open Print Studio.

Select:

**Master Departmental Flow → Tabloid → Landscape**

Generate actual PDF.

Verify all ten departments fit on one horizontal section.

Verify no Production-only orphan page.

Verify:

- Standardized title.
- Correct Shoot date.
- Readable headers.
- Correct descriptions.
- Talent content.
- Correct department order.
- No raw metadata.
- Only page numeral footer.

Then test Department Focus, Daily Rundown, and department ZIP exports.

Inspect actual PDF pages, not only file validity.

---

# 37. REQUIRED END-TO-END TEST — TIME MAP

Use a synthetic Flow containing:

- 1-minute shot.
- 2-minute shot.
- 3-minute shot.
- 5-minute shot.
- 10-minute shot.
- 30-minute shot.
- 60-minute shot.
- 120-minute activity.
- Several simultaneous department tasks.
- Fifty short consecutive shots.
- Missing-duration shots.

Verify:

- Proportional temporal geometry.
- No overlapping unreadable labels.
- Usable selection.
- Correct zoom.
- Correct Fit Day.
- Correct lane placement.
- Correct timeline expansion.
- Correct interactions when Shot Rail is closed.
- Active-shot visibility.
- Appropriate live progress.
- No fabricated time values.

Test Chromium and WebKit where available.

Test 100%, 125%, 150%, and 200% zoom.

---

# 38. REQUIRED END-TO-END TEST — STORYBOARDS

Open a QA Storyboard with existing artwork.

Select a red palette swatch.

Change its value to blue.

Verify:

- Same slot changes.
- Other eleven slots remain stable.
- No new thirteenth slot.
- No old artwork recoloring.
- New brush marks use blue.
- Reload preserves palette.

Edit Visual Description through the new direct interaction.

Open Storyboard PDF.

Verify default:

- US Letter.
- Portrait.
- Six panels.
- Descriptions included.

Switch to eight panels.

Verify:

- Correct layout.
- Correct canonical shot numbers.
- All descriptions.
- No clipping.
- Preserved artwork aspect ratio.
- Correct PDF download.

Check accepted M04 drawing and input regressions.

---

# 39. SHARED SHELL TESTS

Verify all Production Desk applications use consistent empty states.

Test:

- No documents.
- Signed out.
- No selected production.
- Insufficient authorization.
- Loading.
- Error.

Verify the account menu.

Sign out.

Confirm session invalidation.

Sign in as another account.

Verify the new account's actual production access.

No stale private content.

No unexpected changes to documents.

---

# 40. SECURITY AND PRODUCTION DATA SAFETY

Preserve all accepted authentication rules.

Production Desk viewing should remain available to verified members of the relevant production, including Director, ADs, DP, Camera, Storyboard Artist, and other legitimate crew.

Do not introduce arbitrary role-based viewing restrictions.

Do not make private production content public.

Use actual backend authorization, not frontend-only checks.

## Production safeguards

Before deployment:

- Record current production data baselines.
- Record appropriate integrity hashes/counts.
- Preserve existing database content.
- Use isolated fixtures for destructive tests.
- Verify migrations.
- Verify private R2 behavior.
- Verify access controls.
- Verify regression baselines.

Do not change unrelated website files.

Do not rewrite existing M03/M04 architecture.

Do not perform unsafe destructive operations on live production data.

---

# 41. PERFORMANCE REQUIREMENTS

The application must remain practical during real production.

## Live tracking

Avoid unnecessary per-second database writes.

Avoid expensive full-grid rerenders for every timer tick.

Keep updates responsive.

## Time Map

Large numbers of short shots must remain navigable.

Do not render hundreds of overlapping labels.

Use appropriate memoization/virtualization where necessary without sacrificing interaction accuracy.

## PDFs

Avoid unnecessary server-side persistent export storage.

Preserve preview/download consistency.

Large documents should not exhaust server memory.

## Collaboration

Avoid flooding WebSocket channels with redundant timer updates.

Persist meaningful transitions and distribute appropriate shared state.

---

# 42. COMPLETE ACCEPTANCE MATRIX

Every requirement below must be implemented or conclusively verified.

| Area | Required result |
|---|---|
| M03 Row colors | Shared persistent coloring |
| M03 Bulk color | Functional |
| M03 Clear color | Functional |
| M03 AD View | Dedicated useful preset |
| AD View source context | Correct |
| Best take | Authoritative shared record |
| Best take provenance | Correct per shooting occurrence |
| M03/M05 best-take synchronization | Functional |
| DP estimate | Authoritative M03 value |
| AD allotted | Separate M05 value |
| Planned duration | Allotment first, estimate fallback |
| Actual start | Explicit durable record |
| Actual end | Correct block close |
| Active shot | Clearly visible |
| Green zone | Within estimate |
| Yellow zone | Over estimate, within allotment |
| Red zone | Over allotment |
| Missing threshold | No fabricated classification |
| Overall budget variance | Correct |
| Overall schedule variance | Correct |
| Time recovery | Correct |
| Breaks/gaps | Not attributed incorrectly |
| Timestamp correction | Auditable |
| Refresh/reconnect | No loss of active record |
| Concurrent logging | No contradictory active state |
| Talent mapping | Source-linked where valid |
| Current Action | No redundant subject |
| Department notes | Preserved |
| New department defaults | Correct ten departments |
| Layout menu | Compact, intuitive |
| Add Department | Discoverable |
| Column ordering | Preserved |
| Tabloid printing | Ten departments on one width |
| Production orphan page | Eliminated |
| PDF title | Standardized prefix |
| Duplicate title prefix | Prevented |
| PDF footer | Page numeral only |
| Actual-time printing | Optional and accurate |
| Department Focus | Preserved |
| Daily Rundown | Preserved |
| Department ZIP | Functional |
| Persistent export storage | No unnecessary R2 use |
| Time Map short shots | Legible/discoverable |
| Time Map geometry | Accurate |
| Time Map Fit Day | Adaptive |
| Time Map active shot | Correct |
| M04 palette | Exactly twelve stable slots |
| Palette replacement | In place |
| Palette persistence | Correct |
| Previous artwork | Unchanged by swatch editing |
| Visual notes label | Visual Description |
| Description entry | Easily accessible |
| Storyboard default PDF | Six panels, portrait |
| Storyboard eight-panel PDF | Functional |
| Printed shot labels | Canonical |
| Printed descriptions | Included by default |
| Empty states | Unified |
| Account menu | Functional |
| Sign out | Real authentication logout |
| Existing M05 corrective requirements | All verified or finished |
| M03 regressions | Passed |
| M04 regressions | Passed |
| Production integrity | Preserved |
| Deployed assets | Verified |
| Final owner acceptance | Reserved for owner |

---

# 43. IMPLEMENTATION PHASES — ONE ASSIGNMENT

Use internal phases to organize work, but complete this contract as one implementation assignment.

## Phase 1 — Audit and checkpoint

Verify source, deployment, tests, previous M05 completion, and current production data.

## Phase 2 — M03 shared data

Implement row colors, AD View, preferred-take records, and shared estimate/allotment integration.

## Phase 3 — M05 live production model

Implement actual event logging, state transitions, timing thresholds, variance calculations, and persistence.

## Phase 4 — M05 user interface

Implement compact live progress, Talent mapping, refined Layout, and contextual actual-time editing.

## Phase 5 — Time Map and printing

Correct short-shot display, live visualization, Tabloid composition, standardized titles, and optional actual-time printing.

## Phase 6 — M04 refinements

Correct palette replacement/persistence, Visual Description, and six/eight-panel printing.

## Phase 7 — Shared shell

Implement consistent empty states and account sign-out.

## Phase 8 — Complete older M05 requirements

Finish any verified incomplete item from the previous corrective contract.

## Phase 9 — Comprehensive QA

Run all end-to-end scenarios, accessibility checks, collaboration checks, source regressions, and PDF visual inspections.

## Phase 10 — Controlled release

Follow the existing authorized backend/frontend deployment process.

Verify actual served revisions and production integrity.

---

# 44. CODEX USAGE-LIMIT AND CHECKPOINT RULES

A previous Codex run exhausted its usage allowance during a long implementation.

Avoid losing work or leaving the release in an unknown state.

## Checkpoint discipline

After each substantial phase:

- Preserve valid source changes.
- Maintain clear local test evidence.
- Commit coherent implementation checkpoints according to repository conventions.
- Record remaining requirements.
- Avoid leaving partially incompatible frontend/backend changes deployed.

## If interrupted

Do not claim the milestone is finished.

Produce a precise continuation record including:

- Current commit.
- Working-tree status.
- Completed requirements.
- Unfinished requirements.
- Tests already passed.
- Tests still required.
- Deployment state.
- Safe next action.

Do not force a release simply because usage is almost exhausted.

Do not deploy unverified breaking schema changes.

A coherent partial implementation is preferable to an untraceable broken production release.

---

# 45. FINAL VISUAL REVIEW — MANDATORY

Before release, inspect actual screenshots of:

1. M03 Shot List with colored rows.
2. M03 AD View.
3. Best-take editing.
4. M05 Department Flow with Talent information.
5. Live shooting progress.
6. Green/yellow/red threshold presentation.
7. Overall production variance.
8. Layout menu.
9. Tabloid Master PDF with all departments.
10. Actual-time PDF option.
11. Time Map with many short shots.
12. Active shot on Time Map.
13. M04 twelve-swatch palette before and after replacement.
14. M04 direct Visual Description editing.
15. Six-panel Storyboard PDF.
16. Eight-panel Storyboard PDF.
17. Empty states across all applications.
18. Account menu and sign-out state.

Inspect not only visual appearance but alignment, spacing, clipping, scroll behavior, menu anchoring, typography, and consistent animation.

A screenshot should not be considered acceptable merely because it contains the requested component.

Compare it against the established M03/M04 quality benchmark.

---

# 46. FINAL RELEASE REQUIREMENTS

Follow actual current repository instructions.

Do not invent deployment commands or assume historical source revisions remain current.

When backend changes are required:

1. Build and test.
2. Verify additive migrations.
3. Release backend safely.
4. Confirm health.
5. Confirm production data integrity.
6. Publish matching frontend.
7. Verify live asset hashes.
8. Perform signed-in authorized smoke testing.

If deployment is blocked by access or another external limitation, preserve completed work and report the precise blocker.

Do not claim deployment succeeded if the new assets are not actually being served.

Do not treat a local Vite test as proof of live production success.

---

# 47. FINAL REPORT — REQUIREMENT-BY-REQUIREMENT EVIDENCE

When finished, return a factual report containing:

## A. Source state

- Repositories changed.
- Commits.
- Branches.
- Uncommitted work, if any.

## B. Previous M05 completion audit

State which previous corrective requirements were already complete and which required additional changes.

## C. New features

Explain:

- M03 row colors.
- AD View.
- Best-take records.
- Estimate/allotment separation.
- Actual production logging.
- Zone classification.
- Overall variance.
- Talent automation.
- Department Layout refinements.
- Time Map correction.
- Flow PDF correction.
- Storyboard palette.
- Visual Description.
- Storyboard printing.
- Shared empty states.
- Account menu.

## D. Real visual evidence

Provide relevant screenshots and actual PDF evidence.

## E. Test results

Report exact passed/failed tests.

Distinguish automated browser simulation from physical-device testing.

## F. Security and integrity

Report access tests, relevant production data checks, and private export behavior.

## G. Deployment

Report actual deployed backend/frontend revisions and verification results.

## H. Acceptance matrix

Address every row in Section 42.

Do not substitute a generic "all tests passed" summary.

## I. Remaining limitations

Explicitly identify any incomplete, blocked, or unverified requirements.

Do not misrepresent partial implementation as complete.

---

# 48. FINAL NON-NEGOTIABLE ACCEPTANCE CONTRACT

This assignment is intended to complete the remaining M05 work and add the approved improvements to accepted M03/M04.

The following outcomes are mandatory.

**For the Director of Photography:**

They can organize Shot Lists with persistent row colors without sacrificing the accepted M03 interface.

**For the Assistant Director:**

They have a dedicated useful Shot List view, can record preferred takes, and can operate an intuitive live Flow during actual production.

**For scheduling:**

DP estimates, AD allotments, planned starts, and actual timestamps remain distinct and correctly connected.

**For live progress:**

The application can accurately show whether a shot is within estimate, within allotment, or over allotment, and can distinguish shot-budget recovery from true schedule-clock variance.

**For departments:**

Talent information flows from authoritative source data, and department customization remains intuitive.

**For printing:**

The standard ten-department Flow fits across one Tabloid landscape width, the printed title is correct, and the existing professional PDF capabilities remain intact.

**For Time Map:**

Short shots remain usable without falsifying the time scale.

**For Storyboards:**

The palette is stable, descriptions are accessible, and printed Storyboards use actual shot numbers and descriptions with six- and eight-panel options.

**For Production Desk:**

Empty states are visually unified, and authenticated users can discoverably sign out or switch accounts.

**For engineering:**

Previously accepted functionality remains intact, real production data is preserved, and all tests and deployment claims are evidence-based.

Do not begin M06.

Do not restart M03 or M04.

Do not create an unrelated redesign.

Do not omit secondary interfaces.

Do not substitute primitive controls for approved Whiteout interactions.

Do not falsely declare acceptance.

The owner will personally test the deployed system and decide whether M05 is complete.

---

# 49. EXECUTION DIRECTIVE

This contract is the final approved cross-application refinement specification.

The owner and ChatGPT have already completed the product planning.

Codex implements.

Start by auditing the actual current codebase and deployed revisions.

Then implement every requirement, protect the existing ecosystem, execute the full acceptance tests, inspect the visual output, preserve production data, and complete the authorized deployment.

**The desired outcome is a genuinely production-ready M03–M05 ecosystem that serves the DP during preparation, the AD during the shoot, and the entire crew through reliable, beautifully printed production documents.**

**BEGIN THE COMPLETE IMPLEMENTATION NOW.**
