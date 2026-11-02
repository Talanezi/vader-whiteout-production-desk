# VADER: WHITEOUT — MILESTONE M05/12
## FLOW OF THE DAY
### Complete Production-Day Scheduling Application, Authoritative Shot List Integration, Departmental Flow Editor, Time Map, Spreadsheet Import, Collaboration & Professional Print Studio

**Implementation model:** GPT-6.1 Sol — High reasoning  
**Assignment:** Full milestone implementation, integration, QA, and validated production release  
**Milestone:** M05 of the established 12-milestone roadmap  
**Primary application:** Vader: Whiteout Production Desk  
**Product:** Flow of the Day  
**Status:** New milestone, not yet implemented or owner-accepted

---

# 0. READ FIRST — YOUR ROLE AND THE REQUIRED STANDARD

You are Codex, the implementation engineer for **Vader: Whiteout**, a connected filmmaking production platform.

The owner and ChatGPT have completed the product research, architecture planning, visual direction, interaction specifications, and feature-scope decisions for M05.

This document is the authoritative implementation contract resulting from that work.

**Your job is to implement the specified application—not redesign it, produce another proposal, or independently simplify its requirements.**

The owner and ChatGPT make the major product-design decisions. Codex makes the engineering decisions needed to implement those specifications correctly.

You may determine exact component internals, state-management details, schema implementations, file organization, testing mechanisms, and safe migration procedures based on the actual source.

You must not independently replace the approved product with a generic spreadsheet, calendar, Gantt chart, or scheduling dashboard.

## Our central objective

Build **Whiteout Flow of the Day**, a beautiful, collaborative, department-oriented production-day scheduling application.

It must:

1. Connect directly to an existing M03 Shot List.
2. Make selecting and scheduling real production shots straightforward.
3. Coordinate shots, shared milestones, and department-specific activities in one coherent schedule.
4. Provide a powerful, exceptionally well-designed Department Flow editor.
5. Provide an integrated Shot Rail and complementary Time Map.
6. Preserve the relationship between the authoritative Shot List and the day's operational schedule.
7. Import existing Excel Flow documents faithfully.
8. Support direct editing, smooth manipulation, real-time collaboration, comments, and revisions.
9. Produce **exceptionally beautiful, accurate, readable, professionally composed printed PDFs**.
10. Feel visually and functionally as polished as the accepted M03 Shot Lists and M04 Storyboards applications.

**Printing is a first-class product requirement, equal in importance to the interactive editor.**

## Most important visual requirement

Every interface must be exceptionally designed.

This includes:

- The document index.
- Global Create menu.
- New Flow creation.
- Shot List selection.
- Department Flow.
- Shot Rail.
- Time Map.
- Inline cell editors.
- Date/time selectors.
- Department configuration.
- Row context menus.
- Dragging and selection.
- Comments.
- Revision history.
- Excel import and mapping.
- Print Studio.
- PDF preview.
- Export settings.
- Responsive layouts.
- Empty states.
- Loading states.
- Error recovery.
- Confirmation interactions.
- All nested popovers, tabs, menus, buttons, and secondary interfaces.

**A beautiful main screen with primitive secondary interfaces is a failed implementation.**

This was a major problem in the first M04 release, and significant corrective work was required to resolve it.

We are not repeating that experience.

---

# 1. AUTHORITATIVE PROJECT CONTEXT

The local development workspace has historically been:

`/Users/thameralanezi/Developer/Vader-Whiteout/`

Containing separate projects:

- `vader-whiteout-site/`
- `vader-whiteout-production-desk/`
- `vader-whiteout-scheduler/`
- `Whiteout Equipment/`

The parent directory is not necessarily a Git repository.

The primary implementation target is:

`vader-whiteout-production-desk/`

Inspect the actual working environment and repository instructions before proceeding.

## Milestone status

The project has an established 12-milestone roadmap.

Relevant status:

- M01 — Apps Hub: accepted.
- M02 — Production Desk foundation: implemented.
- M03 — Collaborative Shot Lists: **accepted and closed**.
- M04 — Storyboards Studio: **accepted and closed** after extensive live desktop and iPad testing.
- M05 — Flow of the Day: **this assignment**.
- M06 — Call Sheets/editor/distribution: future milestone.
- M07–M08 — Scheduler modernization: future milestones.
- M09–M11 — Equipment modernization: future milestones.
- M12 — Final platform integration: future milestone.

Do not create another roadmap.

Do not renumber milestones.

Do not reopen M03 or M04.

Do not begin M06.

## M03 is the primary implementation framework

M03 already provides an unusually good foundation for this application.

Its accepted functionality includes:

- Advanced document/grid interactions.
- Frozen columns.
- Direct cell editing.
- Selection and keyboard interaction.
- Column sizing.
- Contextual controls.
- Animated duplication and deletion.
- Beautiful menus and dropdowns.
- Drag interactions.
- Collaboration and synchronization.
- Document persistence.
- Professional direct PDF output.

**Inspect and reuse actual M03 components and engineering patterns wherever appropriate.**

Do not build an unrelated generic spreadsheet engine merely because M05 contains rows and columns.

## M04 is the second benchmark

M04 establishes:

- Premium secondary interfaces.
- Consistent inspector and sidebar design.
- Excellent drag-and-drop interactions.
- Direct connections to actual M03 shot records.
- Beautiful import/upload experiences.
- Contextual commenting.
- Functional revision history.
- Artwork previews.
- Thoughtful iconography.
- Reliable document relationships.
- Strong responsive behavior.

Reuse these actual implementations when they fit M05.

M04's final accepted implementation is the standard, not its earlier rejected design.

## Preserve existing production infrastructure

Whiteout already has:

- Scheduler-based authentication and production membership.
- Established real-time collaboration infrastructure.
- PostgreSQL-backed persistence.
- Production Desk API.
- Existing private source/media storage where appropriate.
- Frontend publication through the site repository.
- Railway deployment processes.
- Existing release and QA tooling.

Use those systems.

Do not create competing authentication, collaboration, or storage infrastructure.

---

# 2. MANDATORY SOURCE PREFLIGHT

Before changing code:

1. Read all relevant `AGENTS.md` files and repository instructions.
2. Confirm the actual workspace and Git branch.
3. Inspect uncommitted changes and preserve unrelated work.
4. Inspect the current Production Desk document architecture.
5. Inspect the accepted M03 Shot Lists editor.
6. Inspect M03's grid, selection, column, and editing primitives.
7. Inspect M03's PDF generation and preview/download architecture.
8. Inspect M03's actual Shot List and shot data contracts.
9. Inspect M04's Shot List picker and canonical document linkage.
10. Inspect M04's comments, history, import, popovers, and contextual controls.
11. Inspect the global Production Desk Create menu.
12. Inspect authorization and collaboration services.
13. Inspect the actual release scripts.
14. Locate and inspect the real Flow of the Day source workbook.

Do not assume historical file paths have remained unchanged.

Prefer existing approved components.

You are authorized to extract genuinely reusable logic into shared components if this improves maintainability without changing existing M03/M04 behavior.

Do not make large unrelated refactors.

## Important engineering principle

**M05 is being built from scratch as a new product, but Whiteout's existing application foundation must not be rebuilt from scratch.**

We need a new Flow data model and new film-specific scheduling interfaces, built on the existing excellent Whiteout architecture.

---

# 3. THE REAL SOURCE DOCUMENT — REQUIRED ACCEPTANCE FIXTURE

The owner provided a genuine Flow of the Day workbook:

`Flow-Of-The-Day September 25th [Vader _ Whiteout] Fall 2026(2).xlsx`

This document is a mandatory product-design and regression fixture.

Locate it in available project files, conversation attachments, or the supplied implementation workspace.

If it is not locally accessible, use the documented structure below to continue implementation, but explicitly identify the missing original fixture in the verification report. Do not invent a successful real-file import test.

## Known workbook characteristics

The example is a single populated production-day schedule using approximately 121 occupied worksheet rows and a roughly 14-column layout.

It includes:

- Two time-related columns whose exact distinct meanings are not clearly labeled.
- A central **Current Action** column.
- Departmental instructions.
- A **Time Estimate** column.
- Department headings and personnel information.
- Color-coded shared production events.
- Individual shot entries.
- Independent department activities.
- Long stretches of chronological operational information.

The nine identified departmental headings are:

1. Camera + G&E.
2. Actors.
3. Stunt Team.
4. Sound.
5. Costume.
6. HMU.
7. Props.
8. Director/Choreographer.
9. Producers.

These must be treated as source-specific defaults, not hardcoded limitations.

## Actual kinds of activities

The workbook includes examples such as:

- Choreography practice.
- Begin makeup.
- Crew pickup.
- General call.
- Department setup.
- Safety debrief.
- Begin filming.
- Individual numbered shots.
- Lunch.
- Resume filming.
- Equipment strike.
- Final dismissal.

The source includes shot-like labels such as `19-1.1`, `19-1.2`, and related variations.

**The shots appear in the central Current Action column—not a dedicated leftmost shot-number column.**

Do not transform the workbook into an ordinary shot-only schedule and discard department instructions.

## Important ambiguity

The workbook contains two time columns whose precise original meanings are uncertain.

Do not assume they represent Planned and Actual merely because that would be convenient.

Preserve both source values during import.

Provide explicit mapping controls and retain original provenance.

New native Flow documents should support clearly named planned and optional actual time fields, but original ambiguous values must never be silently reinterpreted.

## Formatting matters

Inspect actual:

- Cell contents.
- Merged ranges.
- Background colors.
- Font styles.
- Department headings.
- Personnel subheaders.
- Column widths.
- Blank spacing rows.
- Time formats.
- Duration formats.
- Embedded formulas and cached results.
- Row order.
- Print settings.
- Hidden rows/columns if any.

The workbook is not merely a collection of strings.

Formatting communicates production meaning, particularly full-width milestone bands.

Do not assume every colored row has a known event type without review.

## Use the workbook to validate the product

The complete workbook should be imported into M05 without losing meaningful instructions.

The resulting Flow should be editable, printable, and recognizable to somebody familiar with the original.

It should demonstrate why a purpose-built film-production application is better than manually maintaining the Excel document.

---

# 4. THE PRODUCT WE ARE BUILDING

**Whiteout Flow of the Day** is a connected, collaborative, production-day operating schedule.

Its central purpose is:

> Help an AD coordinate what happens throughout a shooting day, when it happens, and what each department needs to do.

It is NOT:

- Another technical Shot List editor.
- A generic spreadsheet clone.
- A normal meeting calendar.
- A complete replacement for Movie Magic Scheduling.
- A task-management platform.
- An AI-generated production scheduler.
- A Call Sheet distribution platform.
- A general-purpose Gantt chart app.

It is a specialized Whiteout application for filmmaking.

## The information hierarchy

M03 answers:

**What shots exist, and how will they be filmed?**

M04 answers:

**What do those shots look like?**

M05 answers:

**When will the shots and related production activities happen, and what does each department need to do?**

This distinction governs every interface and data relationship.

## Primary intended users

- 1st Assistant Director.
- Director.
- Director of Photography.
- Department heads.
- Producers.
- Other authorized production collaborators.

The interface must be practical for people who do not need or understand every technical Shot List field.

A department head should immediately find the time, relevant activity, associated shot, and their department's instructions.

Do not overwhelm the Flow with lenses, aperture, coverage metadata, frame rates, or unrelated technical fields.

Those remain available through connected shot inspection where relevant.

---

# 5. DEFINITIVE APPLICATION STRUCTURE

Build one authoritative Flow document with these coordinated surfaces:

## A. Department Flow — primary view

A premium, directly editable, department-oriented matrix.

Chronological time and Current Action are visible alongside department instructions.

This is the core experience.

## B. Time Map — complementary view

A spatial time representation with department lanes, activity blocks, overlaps, durations, milestones, and controlled schedule adjustments.

It must edit the same document.

## C. Connected Shot Rail

An integrated collapsible planning rail available in the appropriate Flow views.

Users select, inspect, schedule, reorder, and find real M03 shots.

It is not a separate Shot List database.

## D. Print Studio

A dedicated workspace for producing professionally composed PDF schedules.

It must use the same authoritative Flow data.

## E. Supporting interfaces

- Flow document index.
- Creation.
- Shot List connection.
- Department configuration.
- Spreadsheet import.
- Comments.
- Revision history.
- Activity inspector.
- Time/duration editors.
- Export and revision snapshots.

**Do not create separate underlying schedules for these surfaces.**

The product has one data model and multiple specialized representations.

---

# 6. FLOW DOCUMENT INDEX AND GLOBAL CREATE

## 6.1 Global Create menu

Extend the existing accepted Production Desk Create menu to include:

**New Flow of the Day**

Preserve the current styling and behavior of the other creation actions.

Use:

- The existing animation.
- The accepted typography.
- Correct Whiteout iconography.
- Matching menu dimensions and spacing.
- Proper keyboard/focus behavior.
- The existing navigation logic.

Do not reproduce the old M04 bug where the Create menu's fixed height clipped additional items.

The menu must expand correctly for the new option.

## 6.2 Flow index

Use the established M03/M04 document-list patterns.

Support:

- Create.
- Search.
- Sort.
- Open.
- Rename.
- Duplicate.
- Delete.
- Document date.
- Relevant revision/status information.
- Connected Shot List identity.
- Last updated metadata.
- Appropriate author/context information.

Use the same interaction quality as the accepted document indices.

Do not build generic oversized dashboard cards.

## 6.3 Empty state

Use an original Whiteout Flow-specific illustration.

The empty state should invite creating a production-day schedule, prominently offering connection to an existing Shot List.

Do not use a Call Sheet or Storyboard illustration as a placeholder.

No AI-generated raster imagery.

## 6.4 Document duplication

Duplicating a Flow must preserve chosen structural information safely.

Support carrying over department configuration and selected schedule content.

Do not silently duplicate dates, issue statuses, actual timestamps, or historical publication claims without an intentional user choice.

A duplicated Flow receives a new stable document identity.

---

# 7. CREATION WORKFLOW — SHOT LIST FIRST

The preferred creation route is:

**From Shot List**

Other routes remain available:

- Import Excel.
- Use a previous day.
- Start blank.

All routes converge into the same native Flow document.

## 7.1 From Shot List

Use the actual M04 Shot List picker patterns.

The creation flow should allow the user to:

1. Choose an existing authorized Shot List.
2. Browse/filter its scenes.
3. Select specific shots.
4. Select whole scenes where appropriate.
5. Search by shot label or subject.
6. Review the chosen shooting sequence.
7. Reorder the selected shots for this particular day.
8. Review available duration estimates.
9. Choose a filming start time if desired.
10. Create the initial Flow.

The experience should be a coherent creation workspace, not five disconnected wizard pages.

## 7.2 Show useful shot context

Each candidate shot should display appropriate concise information:

- Shot label.
- Scene.
- Short subject.
- Existing estimate where available.
- Optional storyboard indicator.
- Selection status.

Do not recreate the complete M03 technical grid inside the creation interface.

## 7.3 No invented timing

Selecting shots does not mean they magically have complete schedules.

If the Shot List contains valid estimates, they may be used to prepare a proposed timed sequence.

If estimates are missing, leave durations explicitly unknown or require user input for timing calculations.

Do not assign arbitrary fifteen-minute defaults without identifying them as user-chosen template values.

Do not fabricate start times or automatically position Lunch and Safety Debrief based on assumptions.

## 7.4 Allow unscheduled sequences

The user must be able to create the Flow with selected shots in an ordered, unscheduled state.

This is essential because many ADs determine the shooting order before settling all times.

## 7.5 Start blank

A Flow without a connected Shot List must remain completely usable.

The user may add manual activities and later connect a Shot List.

Do not force technical shot planning when a production only needs a departmental schedule.

---

# 8. SHOT LIST AUTHORITY — CRITICAL ARCHITECTURAL CONTRACT

This is one of the most important technical requirements.

**M03 Shot Lists remains the authoritative source of shot technical information.**

M05 may reference and edit permitted fields through the actual M03 services.

M05 must not independently duplicate technical shot records.

## 8.1 One connected document relationship

Each Flow has one primary connected Shot List at a time.

All Flow surfaces use the same document-level relationship.

There is no separate Shot List chosen for Time Map or Shot Rail.

## 8.2 Scheduled shot occurrences

Each scheduled instance needs its own identity.

It references the original M03 shot UUID.

A scheduled occurrence may store M05-specific information such as:

- Position in today's shooting order.
- Scheduled start.
- Day-specific estimated duration.
- Actual start/end.
- Activity status.
- Department instructions.
- Day-specific notes.

It must not create a second independent copy of:

- Lens.
- Framing.
- Camera.
- Shot subject.
- Coverage.
- Technical notes.
- Other M03-owned fields.

## 8.3 Real-time updates

If an authoritative shot field changes in M03, the connected Flow should reflect the updated value.

If an allowed technical field is edited contextually from Flow, use the actual M03 write/collaboration/validation path.

Do not create local-only copies that can diverge.

## 8.4 Scope of inline technical editing

Allow relevant contextual edits only where useful.

Do not embed the complete Shot Lists editor.

Examples include permitted updates to subject, camera/lens/framing and relevant notes, using the existing M03 data contracts.

Complex Shot List operations remain accessible by opening the actual Shot List.

## 8.5 Canonical versus daily order

The order of shots in today's Flow belongs to M05.

The canonical order inside M03 remains separate.

Reordering scheduled shots must not reorder the original Shot List.

## 8.6 Unscheduled new shots

If another user adds a new shot to M03, it appears in the Flow's connected Shot Rail as available and unscheduled.

It must not automatically insert itself into the current day's timed schedule.

## 8.7 Modified estimates

When an inherited M03 duration estimate changes:

- Occurrences still inheriting the estimate should reflect the update.
- Occurrences with explicit day-specific overrides retain those overrides.
- The user should be able to distinguish the inherited value from the override.

## 8.8 Missing or deleted shots

If a referenced shot becomes unavailable:

- Preserve the scheduled occurrence.
- Preserve schedule timing and departmental instructions.
- Preserve historical references when permitted.
- Show a clear disconnected/missing-shot state.
- Offer an authorized relinking path.

Do not silently delete the Flow event.

## 8.9 Disconnect

Allow a simple document-level Disconnect Shot List action.

Disconnecting must not delete:

- The Shot List.
- Its scenes.
- Its shots.
- The Flow.
- Flow activities.
- Original notes.
- Published PDF snapshots.

Preserve existing Flow entries safely.

Remove the active relationship and identify former shot-linked entries appropriately.

Reconnection uses the standard document connection flow.

Do not create multiple independent Shot List switches inside the editor.

---

# 9. DEPARTMENT FLOW — MAIN EDITOR

This is the most important on-screen interface.

Build it using M03's proven grid editing principles, extended for film-production scheduling.

It should be information-dense, sophisticated, readable, and highly interactive.

**Do not make it look like an ordinary spreadsheet simulator.**

## 9.1 Primary columns

Pin:

- Time.
- Current Action.

The department columns extend horizontally.

Time Estimate and optional Actual information may be presented through carefully considered additional columns/settings rather than making the default layout excessively wide.

The primary columns remain visible during horizontal scrolling.

Headers remain visible during vertical scrolling.

## 9.2 Department headings

Support:

- Department name.
- Optional personnel assignments.
- Column resize.
- Reorder.
- Add.
- Rename.
- Group.
- Hide/show.
- Relevant department settings.

Use the existing Whiteout header and column controls.

Do not hardcode nine departments as the only valid configuration.

## 9.3 Row types

Implement distinct semantic event types:

### Shot event

A scheduled occurrence linked to an M03 shot when available.

Displays appropriate shot identity, useful short subject, timing, and departmental instructions.

### Shared milestone

Examples:

- General Call.
- Safety Debrief.
- Lunch.
- Begin Filming.
- Resume Filming.
- Wrap.

Use a distinct full-width visual treatment.

### Department activity

An activity relevant to a particular department, potentially without a central Current Action value.

Example: HMU begins makeup while another department prepares equipment.

### Custom action

A general production event such as crew pickup, rehearsal, transport, location move, or equipment strike.

Allow custom categories and descriptions.

## 9.4 Milestones

Milestone rows should use deliberate visual emphasis, inspired by the source workbook.

Use tasteful, muted event colors consistent with Whiteout.

Do not use garish full-width fills.

A shared milestone may still have individual departmental instructions.

The data model and print renderer must preserve those instructions.

Do not flatten the entire milestone into one string and lose department-specific content.

## 9.5 Independent department activities

A department activity must be possible at a time when no shot is occurring.

Do not require every activity to reference a shot.

Do not invent dummy shot records.

Do not hide independent activities merely because they occupy an otherwise empty Current Action row.

## 9.6 Direct editing

Use accepted M03 behavior for:

- Click to edit.
- Keyboard navigation.
- Tab/Enter/Escape.
- Selection.
- Multiline content.
- Clipboard.
- Undo/redo.
- Appropriate paste behavior.
- Contextual actions.

Simple text editing should happen directly in the grid.

Do not require a modal for every small update.

## 9.7 Row height

Use content-aware row heights.

Long instructions must wrap.

Avoid clipping.

Do not permanently create huge empty rows for short activities.

Do not recreate source Excel blank spacing as meaningless database records.

## 9.8 Selection

Use M03's selection conventions.

Selection should be visually precise and keyboard accessible.

Appropriate bulk actions should reuse M03's existing animated selected-action toolbar.

## 9.9 Row dragging

Use real row representations during dragging.

Rows should lift smoothly.

Neighboring rows should respond naturally.

Insertion positions should be clear.

Do not display a text-only "Moving row" bar.

Do not use oversized Earlier/Later buttons.

## 9.10 Timing-aware reorder

A Flow is chronological, so row manipulation must be semantically correct.

For untimed entries, reordering changes sequence order.

For timed entries, moving a row across time positions must explicitly update its intended timing or show a preview of the proposed move.

Do not silently create contradictions where a 10:30 event is displayed between 08:00 and 08:15 without a clear reason.

The primary chronological sort uses planned time where available, with stable sequence keys for equal-time and unscheduled items.

## 9.11 Insertion

Allow a new event:

- Before/after a selected row.
- At a specific time.
- Within a department.
- From the Shot Rail.
- As a shared milestone.

Use compact contextual insertion affordances.

No giant permanent insertion controls.

---

# 10. DEPARTMENT CONFIGURATION

The original nine departments are useful initial defaults.

The document must support additional structures.

## Requirements

- Add department.
- Rename department.
- Reorder department.
- Hide department from personal view.
- Restore hidden department.
- Resize columns.
- Add/edit optional personnel.
- Group closely related responsibilities where appropriate.
- Remove department with proper data-preservation safeguards.

Hiding is not deletion.

Personal visibility/width preferences should remain distinct from the shared department definitions.

Removing a department that contains instructions must not silently destroy those instructions.

Use an appropriate contextual confirmation or reassignment workflow.

## Print relationship

Personal screen visibility must not automatically determine printed department scope.

The Print Studio controls which departments appear in each output.

This distinction is mandatory.

---

# 11. CONNECTED SHOT RAIL

Build a collapsible rail beside Department Flow and available in relevant Time Map contexts.

Use the accepted M04 inspector/sidebar design language.

It should feel like an integrated production planning tool.

## Core groups

### Scheduled

Shots already included in the Flow.

### Not scheduled

Available shots from the connected M03 Shot List not currently included in this Flow.

## Capabilities

- Search.
- Filter by scene.
- Select.
- Inspect shot context.
- Insert into Flow.
- Reorder daily sequence.
- Show existing scheduled occurrences.
- Open authoritative M03 shot where useful.
- Indicate available storyboard artwork.

## Drag behavior

An unscheduled shot can be dragged into an appropriate insertion point in the Flow.

The operation creates a new scheduled occurrence referencing the real M03 UUID.

The visual drag should match M03/M04 quality.

No fake ghost bar.

No page jumping.

No duplicate creation from accidental repeat drop.

## Multiple occurrences

A shot may be deliberately scheduled more than once.

Support this without creating duplicate source shot records.

Display duplicate scheduled occurrences clearly enough to avoid confusion.

## Storyboard context

If the shot has linked M04 artwork, show a tasteful indicator or optional preview.

Do not embed the entire drawing editor.

Do not load every full-resolution image into the rail.

## Responsive behavior

On desktop, the rail can remain docked.

On narrower screens, use a well-designed overlay/drawer.

Keep the grid usable when the rail is closed.

Do not introduce phantom horizontal/vertical scrolling.

---

# 12. TIME MAP — COMPLEMENTARY SCHEDULING VIEW

Build a spatial representation of the same Flow events.

Time runs horizontally.

Departments occupy lanes.

Events appear as points or duration blocks.

Shared milestones appear across the relevant day context.

## Required behaviors

- Horizontal time navigation.
- Zoom.
- Pan.
- Select event.
- Resize duration.
- Move event.
- Inspect department assignments.
- View overlapping activities.
- Navigate to corresponding Department Flow entry.
- Display planned versus actual timing where relevant.

## Use one source of truth

Time Map must read and modify the same canonical Flow event records.

Do not create an independent timeline database.

Updates must synchronize with Department Flow and Print Studio.

## Timing interaction

Dragging an activity changes its planned time through a validated operation.

Resizing changes its duration.

Do not commit invalid or ambiguous changes silently.

## Scheduling conflict behavior

Show useful warnings for:

- Department overlaps that may be contradictory.
- Invalid durations.
- Events outside intended schedule bounds.
- Important fixed-time conflicts.
- Missing duration when an operation depends on one.

Not every overlap is an error.

Parallel departmental work is normal in film production.

Do not flag every simultaneous task as a conflict.

## Shift following activities

Provide an explicit operation for shifting eligible following activities.

Preview affected events.

Allow fixed milestones to remain anchored.

Do not silently shift Lunch, Safety Debrief, General Call, or other fixed events.

Make changes undoable.

## Unscheduled events

Keep untimed activities in an accessible unscheduled area.

Do not fabricate a visual position for an event without a meaningful time.

## Technical reference

Consider:

https://visjs.github.io/vis-timeline/examples/timeline/

Its grouped lanes, editable ranges, snapping, and event callbacks are relevant.

But do not adopt its default UI wholesale or introduce a competing design language.

Inspect the existing app and choose the narrowest technically suitable approach.

---

# 13. TIME MODEL — PRODUCTION-CORRECT SEMANTICS

Scheduling correctness matters as much as visual quality.

Each event should support applicable fields:

- Planned start.
- Planned duration.
- Planned end or derived end.
- Actual start.
- Actual completion.
- Event status.
- Optional timing notes.

Do not store contradictory independent values without defined precedence.

## 13.1 Start/end/duration

Define one consistent editing contract.

For example, when start and duration are authoritative, end is derived.

If an end time is manually edited, calculate the resulting duration deliberately.

Prevent negative durations and invalid intervals.

## 13.2 Optional values

A shot without a confirmed estimate must remain visibly unscheduled or unestimated as appropriate.

Do not fabricate timing.

## 13.3 Planned versus actual

Actual times are not automatically set merely because the user opens the document.

Provide intentional start/complete actions and manual correction.

## 13.4 Cross-midnight

Support production days extending past midnight.

Store date-aware production-local times and corresponding instants.

A 01:30 AM activity after an 11:30 PM event belongs to the next calendar date, not earlier in the schedule.

## 13.5 Timezones and DST

Use the production's named timezone.

Handle ambiguous or nonexistent local times during daylight-saving transitions explicitly rather than silently shifting them.

Display times consistently across collaborators in different locations.

## 13.6 Duration formatting

Allow practical film-production duration input and display.

Support clear minute/hour formats and typed input.

No unnecessary native browser time controls.

## 13.7 Planned/Actual display

The main Flow may expose actual time through an optional column or compact status treatment.

Do not overload the default sheet with excessive telemetry.

The printed document includes actual values only when explicitly configured.

---

# 14. COMMENTS, PRESENCE AND REVISION HISTORY

Reuse the successful M04 collaboration design.

## Comments

Allow context-specific comments on Flow events.

Use the accepted M04 discussion interface:

- Author/avatar.
- Timestamp.
- Thread.
- Replies.
- Resolve/reopen.
- Inline composer.
- Comment indicator.
- Direct navigation to discussion.

Do not create generic textarea forms.

Do not create a separate comments backend.

## Comment discoverability

A row with active comments should have a subtle indicator.

Clicking it should open the correct discussion immediately.

Do not require the user to navigate through unrelated tabs.

## Presence

Use existing Whiteout collaborator-presence conventions.

Do not add unnecessarily complex lockouts.

## History

Use actual recoverable Flow revisions.

Show:

- Revision identity.
- Author.
- Timestamp.
- Summary where available.
- Preview.
- Restore.

Restoration should be non-destructive.

The previous current state remains recoverable.

Do not show a fake revision history containing only timestamps with no real recovery.

## Undo/redo

Local undo should not erase another collaborator's unrelated changes.

Complex operations such as moving several activities or shifting the schedule should be coherent transactional actions.

---

# 15. EXCEL IMPORT — COMPLETE SOURCE-FAITHFUL WORKFLOW

Importing existing Flow workbooks is part of M05, not an optional future enhancement.

Support `.xlsx` as the primary format.

Use the supplied September 25 workbook as the main regression fixture.

## 15.1 Upload

Reuse M04's successful animated upload interactions.

Provide real progress, validation, removal, error/retry, and proper scrolling.

Do not use an ugly generic file-input interface.

## 15.2 Source processing

Inspect:

- Worksheets.
- Merged cells.
- Values.
- Formatted times.
- Durations.
- Formulas and cached results.
- Header rows.
- Department names.
- Personnel subheaders.
- Cell formatting.
- Row order.
- Notes.
- Shared milestone regions.
- Relevant source metadata.

Do not execute spreadsheet formulas as code.

Treat file content as untrusted.

Protect against malformed or excessively large XLSX archives.

## 15.3 Mapping

Suggest candidate mappings for:

- Planned time.
- Actual/secondary time.
- Current Action.
- Time Estimate.
- Department columns.
- Personnel rows.
- Milestone categories.
- Shot-like entries.

Allow explicit correction before import.

Do not assign meaning to the two unlabeled time columns automatically.

## 15.4 Shot matching

If a Shot List is connected, offer to reconcile candidate shot labels with real M03 UUIDs.

Do not automatically assume all similar labels are the same shot.

Ambiguous matches require a meaningful review state.

Unmatched entries remain valid manual Flow activities.

## 15.5 Review workspace

Use a coordinated import review:

- Original source preview.
- Mapped Flow preview.
- Field mapping controls.
- Ambiguity notices.
- Clear final confirmation.

Keep it in one coherent workspace.

Do not create multiple disconnected, poorly styled review screens.

## 15.6 Lossless meaning

Preserve meaningful text, time data, department assignments, and original labels.

Retain the original workbook privately for reference.

Source provenance should identify relevant worksheet/cell/range locations where useful.

Do not duplicate empty formatting rows as meaningless operational events.

## 15.7 Import idempotency

Repeated confirmation must not create duplicate events.

Cancellation must not leave partially attached production data.

## 15.8 Import QA

Compare source values and resulting Flow events.

Verify that every meaningful department instruction was imported or explicitly identified as unmapped.

A visually attractive import preview is insufficient if it silently loses information.

---

# 16. PRINTING IS A FIRST-CLASS PRODUCT

This section is as important as the Department Flow editor.

The actual Flow of the Day is often emailed and printed for crews.

A beautiful digital editor with an ugly or unreliable PDF export is a failed M05.

## The print design objective

Create production schedules that look professionally typeset, remain legible on real paper, and communicate the day's information clearly.

Do NOT:

- Print a screenshot of the web application.
- Use browser screenshot capture as the main PDF pipeline.
- Compress all departments into microscopic text.
- Force every Flow into one page.
- Clip long instructions.
- Omit departments silently.
- Break important event rows across pages arbitrarily.
- Produce different preview/download layouts.
- Use heavy full-page dark backgrounds that waste ink.
- Add unnecessary decorative cover pages.

The printed schedule should remain recognizable as an improved version of the owner's existing departmental Flow.

---

# 17. PRINT PRODUCTS — THREE DELIBERATE PRESETS

Implement exactly three core print products.

## 17.1 Master Departmental Flow

The full production-day schedule.

Includes:

- Time.
- Current Action.
- Selected department columns, all by default.
- Department personnel subheaders where enabled.
- Shared milestones.
- Independent department activities.
- Shot entries.
- Estimates.
- Relevant notes.
- Optional actual times.
- Revision identification.

This most closely corresponds to the owner's original spreadsheet.

## 17.2 Department Focus

Print a specific department's work while preserving:

- Chronological time.
- Central action context.
- All relevant department instructions.
- Shared milestones.
- Appropriate shoot-day identification.

Do not remove General Call, Lunch, Safety Debrief, or Wrap merely because they are shared events.

## 17.3 Daily Rundown

A concise chronological summary for broader crew communication.

Include essential shared events and filming sequence.

Clearly identify that this is a condensed rundown, not the complete departmental master.

Do not silently present it as equivalent to the full Flow.

---

# 18. PRINT SIZES AND PAGE GEOMETRY

Support:

- US Letter.
- A4.
- Tabloid (11×17).
- A3.

Support appropriate portrait/landscape orientations.

## Recommended defaults

Master Departmental Flow:

- Tabloid landscape.
- A3 landscape equivalent.

Department Focus:

- Letter/A4 based on locale and content.

Daily Rundown:

- Letter/A4.

These are defaults, not restrictive limitations.

## Critical horizontal pagination

The full departmental Flow may be too wide for Letter/A4.

Do not shrink everything to unreadable sizes.

For smaller paper:

1. Divide departments into coherent horizontal groups.
2. Repeat Time and Current Action columns.
3. Repeat relevant document identifiers.
4. Preserve the same event sequence.
5. Identify each department section clearly.
6. Prevent department information from being omitted.

Allow user-configured department groups where appropriate.

## Critical vertical pagination

Long schedules require multiple pages.

The renderer must:

- Measure actual text.
- Wrap instructions.
- Calculate row heights.
- Repeat headers.
- Keep logical events together.
- Avoid orphaned milestone bands.
- Control page breaks.
- Preserve chronological continuity.
- Number pages.
- Avoid large accidental blank regions.

## Consistent page ranges

When the master Flow is split horizontally, coordinate the event/time ranges across corresponding department sections.

Use stable event boundaries and clear page/section numbering.

Do not create confusing PDFs where one department's page covers a different arbitrary portion of the day without indication.

## Overflow

If a single event contains too much content to fit on one page, handle it deliberately through continuation behavior.

Never clip or silently discard the text.

---

# 19. PRINT VISUAL DESIGN

The printed design should be as thoughtfully designed as the Whiteout application.

Use a light-paper editorial style.

## Primary visual characteristics

- Elegant restrained typography.
- Strong document title hierarchy.
- Clear production date.
- Compact revision metadata.
- Carefully measured margins.
- Refined department header bands.
- Readable personnel subheaders.
- Hairline grid rules.
- Clear time typography.
- Proper text wrapping.
- Visually distinct milestone categories.
- Consistent footer/pagination.

## Editorial Color

A light, beautiful production-document style.

Use restrained colored bands for meaningful events.

Preserve the source workbook's conceptual hierarchy while improving aesthetics.

## Production Monochrome

A black-and-white printer-friendly style.

Differentiate events through typography, spacing, rules, and grayscale—not only color.

## Avoid

- Giant logos.
- Huge decorative titles.
- Oversized margins wasting paper.
- Heavy background fills.
- Arbitrary colorful badges.
- Microscopic body text.
- Dense blocks with no hierarchy.
- Overdesigned corporate-report graphics.

This is a working film-production document, not an investor presentation.

---

# 20. DIRECT PDF RENDERING — TECHNICAL CONTRACT

Inspect the existing M03 direct-PDF implementation first.

Reuse or extract appropriate:

- Font handling.
- Text measurement.
- Page geometry.
- Row/cell layout.
- Preview infrastructure.
- PDF response handling.
- Download behavior.
- Authentication.
- Error reporting.

Do not rewrite M03's accepted PDF renderer.

## 20.1 Rendering architecture

Use a deterministic layout model:

**Flow data → Print configuration → Measured page layout → PDF bytes**

Do not use editor DOM screenshots.

Use actual text and vector drawing primitives.

Embed appropriate legally available fonts.

## 20.2 Page measurement

Before rendering, calculate:

- Available page dimensions.
- Margins.
- Header/footer space.
- Column widths.
- Text widths.
- Wrapped line counts.
- Row heights.
- Milestone spans.
- Vertical page breaks.
- Horizontal department groups.

The renderer must understand actual content rather than guessing heights.

## 20.3 Font minimums and legibility

Define sensible default/minimum font size constraints.

If a layout cannot fit without becoming illegible, add pages rather than shrinking indefinitely.

Do not consider a PDF successful merely because all characters technically fit.

## 20.4 Preview/download parity

The preview must display the exact PDF artifact used for download/printing.

Do not maintain a separately implemented HTML approximation of the PDF.

The server/client architecture may cache generated bytes appropriately.

Ensure content and revision settings are part of cache identity.

## 20.5 Determinism

The same immutable Flow revision and print settings should produce equivalent content/layout.

If byte-level determinism is practical within the existing renderer, test it.

Do not let hidden current-time values or nondeterministic font/layout behavior cause unexpected PDF differences.

## 20.6 Security

Escape and safely render all user text.

Do not allow source workbook content to inject executable PDF instructions, HTML, or filesystem paths.

Protect exports with existing production authorization.

---

# 21. PRINT STUDIO — PREMIUM UI

Build a dedicated Print Studio.

The visual quality must equal the accepted M03/M04 secondary interfaces.

## Layout

Use a two-pane desktop composition:

**Settings pane:**

- Print product.
- Paper size.
- Orientation.
- Department scope.
- Optional included fields.
- Style.
- Revision/snapshot details.

**Preview pane:**

- Actual PDF pages.
- Page thumbnails where useful.
- Zoom.
- Page navigation.
- Fit-to-width/page.
- Download.
- Print.

## Controls

Use:

- Compact Whiteout dropdowns.
- Animated selections.
- Purposeful iconography.
- Appropriate tooltips.
- Clear primary actions.
- Proper loading indicators.
- Consistent popover spacing.

No generic oversized text buttons.

No redundant Close button next to an existing X.

No primitive browser form controls as the central UI.

## Live preview

Update the preview when print settings change, with sensible debouncing/caching.

Do not regenerate a large PDF on every keystroke while the user is still typing.

Use honest processing feedback.

## Failure recovery

An export error should show a meaningful recoverable state.

Do not leave the user with a blank iframe or generic error text.

## Print actions

Support:

- Download PDF.
- Print actual PDF.
- Relevant authenticated link/copy workflow where supported.

Do not implement the full M06 email-sending system.

---

# 22. PRINTED REVISIONS AND DISTRIBUTION SEMANTICS

A downloaded PDF represents a specific schedule state.

The live Flow can continue changing, but previously exported snapshots must remain historically understandable.

## Required behavior

- Capture the exported Flow revision.
- Preserve relevant print settings.
- Record export metadata.
- Include meaningful revision identity on the PDF.
- Prevent a link to a historical snapshot from silently serving an unrelated current version.

Do not claim an email was sent merely because a PDF was generated.

M06 owns the full Call Sheet email distribution system.

M05 should provide excellent PDF preparation and download.

If existing authenticated sharing infrastructure supports immutable document links safely, reuse it.

Otherwise, do not invent an unverified public sharing system.

---

# 23. DOCUMENT DATA MODEL

Implement a coherent native data model.

Suggested conceptual entities:

## Flow document

- Stable UUID.
- Production association.
- Shoot date.
- Production timezone.
- Title.
- Connected Shot List UUID.
- Status.
- Revision metadata.
- Permissions.

## Department

- Stable UUID.
- Flow UUID.
- Name.
- Sequence order.
- Optional personnel.
- Display metadata.

## Event

- Stable UUID.
- Flow UUID.
- Semantic event type.
- Sequence key.
- Planned time/duration.
- Optional actual timing.
- Description.
- Status.
- Notes.
- Milestone/category metadata.

## Department instruction

- Stable identity.
- Event reference.
- Department reference.
- Instruction text.
- Relevant optional timing.
- Ordering information when needed.

## Scheduled shot occurrence

- Stable occurrence UUID.
- Event reference.
- Actual M03 shot UUID where linked.
- Day-specific schedule metadata.
- Optional duration override.
- Source state.

## Comments

Use established comment/presence infrastructure.

## Revisions

Recoverable Flow states and revision metadata.

## Print snapshots

Immutable revision plus print configuration and export metadata.

## Import provenance

Preserved source workbook and mapping information.

These are conceptual requirements, not mandatory SQL table names.

Codex must inspect and adapt to the actual backend architecture.

## Required invariants

- Every persistent object has a stable identity.
- Order is separate from identity.
- Day-specific timing is separate from M03 technical shot data.
- Department visibility is separate from department deletion.
- Original imported values are preserved.
- Unlinked activities remain valid.
- One event can affect multiple departments.
- One shot can have multiple scheduled occurrences.
- Print layouts do not mutate schedule data.

---

# 24. COLLABORATION AND AUTHORIZATION

Reuse Scheduler's actual authentication and production-membership authority.

Reuse existing Production Desk collaboration infrastructure.

## Required behavior

Two authorized collaborators must be able to edit a Flow concurrently.

Independent edits should coexist.

Conflicts must be handled deterministically according to the actual model.

Avoid persisting every pointer movement as a heavyweight transaction.

Structural operations should be coherent and undoable.

## Access control

All reads, writes, imports, source attachments, revisions, comments, snapshots, and PDFs must enforce authorized production access.

Do not trust production identifiers supplied solely by the client.

Do not expose private imported workbooks through public object URLs.

## No lockout bureaucracy

The owner expects small-team collaboration.

Do not add per-cell approval flows or exclusive edit locks without a concrete requirement.

---

# 25. RESPONSIVE AND ACCESSIBLE EXPERIENCE

Test desktop, laptop, tablet, and narrow screens.

## Desktop

Use the full Department Flow with pinned columns.

Allow Shot Rail docking.

Use a bounded viewport with proper horizontal and vertical scrolling.

## Tablet

Preserve touch-friendly editing, dragging, department navigation, and Shot Rail access.

Do not compress every column to an unusable width.

## Mobile/narrow

Provide a usable adaptive mode.

The user should be able to navigate activities, inspect departmental information, and perform appropriate edits without horizontal overflow destroying navigation.

A focused event/department layout is acceptable on narrow screens, as long as it uses the same authoritative data.

## Accessibility

Support:

- Keyboard navigation.
- Visible focus.
- Screen-reader labels.
- Accessible icon actions.
- Appropriate grid semantics.
- Drag alternatives.
- Reduced motion.
- Touch hit targets.
- Browser zoom.
- Tooltip accessibility.
- Proper popover dismissal.
- No hidden focus traps.

---

# 26. PERFORMANCE

The real workbook is not enormous, but the application must handle larger days.

Test:

- Small days.
- The original sample.
- Hundreds of activities.
- Additional departments.
- Long notes.
- Dense concurrent events.
- Long Shot Lists.

Avoid unnecessary virtualized-grid complexity if the actual workload performs well.

Use row/column virtualization when profiling justifies it.

If used, maintain correct:

- Selection.
- Focus.
- Keyboard navigation.
- Pinned columns.
- Row height.
- Drag behavior.
- Accessibility.
- Print output.

Do not virtualize away data required by the PDF renderer.

Print rendering must use complete canonical data, not only mounted viewport rows.

Avoid excessive network writes and expensive full-document rerenders.

---

# 27. COMPLETE SECONDARY-INTERFACE INVENTORY

Every one of these requires visual and functional QA:

1. Empty Flow index.
2. Populated Flow index.
3. Global Create menu.
4. New Flow options.
5. Shot List picker.
6. Shot selection.
7. Scene filters.
8. Sequence review.
9. Start-time configuration.
10. Department Flow normal state.
11. Frozen headers/columns.
12. Cell editing.
13. Multiline editing.
14. Time picker.
15. Duration picker.
16. Row hover actions.
17. Row selection.
18. Bulk actions.
19. Row dragging.
20. Row deletion confirmation.
21. Milestone insertion.
22. Department configuration.
23. Column resizing.
24. Shot Rail open.
25. Shot Rail collapsed.
26. Shot drag/insertion.
27. Shot context inspector.
28. Missing-linked-shot state.
29. Time Map.
30. Timing drag/resize.
31. Scheduling conflict.
32. Shift-following preview.
33. Comments.
34. Replies.
35. History.
36. Revision preview.
37. Revision restore.
38. Excel upload.
39. Import column mapping.
40. Import ambiguity handling.
41. Import review.
42. Print Studio.
43. Print settings.
44. PDF preview.
45. PDF loading/error state.
46. Snapshot/revision controls.
47. Offline/reconnect.
48. Empty schedule.
49. Responsive tablet layout.
50. Narrow/mobile layout.

**No interface may be left with generic placeholder styling simply because it is secondary.**

---

# 28. END-TO-END FUNCTIONAL TESTS

Implement and run complete user journeys.

## Journey A — Create from Shot List

1. Open global Create.
2. Choose New Flow.
3. Connect an actual authorized M03 Shot List.
4. Select relevant scenes/shots.
5. Review their daily sequence.
6. Reorder selected shots.
7. Establish appropriate initial timing.
8. Create Flow.
9. Reload.
10. Verify stable source links and schedule.

## Journey B — Add department activities

1. Create a shared milestone.
2. Add an independent HMU task.
3. Add a Costume preparation instruction.
4. Add Camera/G&E instructions to a shot.
5. Edit multiline notes.
6. Verify timing and display.
7. Reload.
8. Print.

## Journey C — M03 integration

1. Open connected M03 Shot List.
2. Change an allowed technical field.
3. Verify Flow reflects the change.
4. Reorder the Flow's daily shot occurrences.
5. Verify M03's canonical shot order is unchanged.
6. Add an M03 shot.
7. Verify it becomes available but unscheduled.
8. Disconnect/reconnect safely.

## Journey D — Time Map

1. Open Time Map.
2. Move an activity.
3. Resize duration.
4. Inspect overlapping departments.
5. Preview shifting following events.
6. Preserve fixed milestones.
7. Apply change.
8. Return to Department Flow.
9. Verify same schedule values.

## Journey E — Workbook import

1. Import the original September 25 XLSX.
2. Inspect source mappings.
3. Resolve ambiguous time columns explicitly.
4. Review departmental instructions.
5. Preserve milestone meaning.
6. Confirm.
7. Verify meaningful source content.
8. Reload.
9. Export Master Flow.

## Journey F — Collaboration

1. Open Flow in two authorized sessions.
2. Edit separate department instructions.
3. Reorder an event.
4. Change event timing.
5. Add a comment.
6. Disconnect/reconnect one session.
7. Verify persistence and expected conflict behavior.

## Journey G — Print

1. Open Print Studio.
2. Choose Master Flow.
3. Preview Tabloid landscape.
4. Change to Letter.
5. Verify departmental continuation pages.
6. Select Department Focus.
7. Verify relevant milestones remain.
8. Select Daily Rundown.
9. Preview color/monochrome.
10. Download PDF.
11. Confirm output content and page layout.
12. Compare preview/download.

## Journey H — History

1. Save a meaningful revision.
2. Modify timing and department notes.
3. Preview earlier version.
4. Restore it.
5. Verify current version remains recoverable.
6. Verify associated Shot List source data was not overwritten.

---

# 29. PRINT REGRESSION MATRIX — MANDATORY

This is separate from ordinary application tests.

Test at least:

- Original September 25 workbook.
- Very small Flow.
- Long Flow with hundreds of events.
- All nine sample departments.
- Additional custom departments.
- Long department names.
- Long crew names.
- Long notes.
- Simultaneous department tasks.
- Shared milestones with departmental instructions.
- Missing times.
- Cross-midnight events.
- No Shot List connection.
- Missing shot reference.
- Repeated scheduled occurrence.
- Letter landscape.
- A4 landscape.
- Tabloid landscape.
- A3 landscape.
- Department Focus.
- Daily Rundown.
- Color.
- Monochrome.
- Multiple horizontal department sections.
- Multiple vertical pages.

## Visual PDF inspection

Render generated PDFs to page images and inspect:

- Header alignment.
- Typography.
- Minimum readable font size.
- Text wrapping.
- Department column widths.
- Repeated time/action columns.
- Repeated headings.
- Milestone spans.
- Page breaks.
- Footers.
- Page numbers.
- Contrast.
- Unexpected blank areas.
- Clipping.
- Missing instructions.
- Overlapping text.

## Content verification

Compare canonical schedule content against the printed output.

Every included event/department instruction must appear exactly where its selected print scope requires.

An export that looks beautiful but omits instructions fails.

An export that includes everything but uses illegible text also fails.

## Preview/download consistency

Test the actual generated PDF bytes/content, not an HTML approximation.

---

# 30. VISUAL QA — M03/M04 QUALITY GATE

Run visual QA against real integrated application screens.

Do not validate only isolated component demos.

Use the accepted M03/M04 interfaces as the benchmark.

Review:

- Typography.
- Density.
- Spacing.
- Alignment.
- Button treatment.
- Iconography.
- Popover sizes.
- Dropdown anchoring.
- Animation.
- Loading.
- Error recovery.
- Disabled states.
- Hover controls.
- Drag overlays.
- Resizing.
- Responsive behavior.
- Scroll boundaries.

## Specific previously rejected defects to prevent

- Generic text-only utility buttons.
- Overly large dropdowns.
- Hidden menus that disappear while navigating.
- Duplicate buttons for the same function.
- Unaligned selection counts.
- Oversized deletion confirmations.
- Redundant Close alongside X.
- Basic textarea-style comments.
- Fake history controls.
- Incorrect imported labels.
- "Moving row" placeholder overlays.
- Enormous phantom scroll space.
- Primitive print settings.
- Stale PDF previews.
- Beautiful main screen but unfinished nested interfaces.

Codex must inspect these proactively before reporting completion.

---

# 31. SOURCE AND DATA SAFETY

Do not modify accepted M03/M04 source except for narrowly scoped reusable-component extraction or necessary integration changes.

Do not alter authoritative shot records merely by scheduling them.

Do not delete original imported workbooks.

Do not create destructive database migrations.

Use additive migrations and safe constraints.

Do not expose production secrets.

Do not create public access to private source data.

Do not use real production documents as disposable test fixtures.

Run destructive tests against local isolated fixtures.

Production smoke tests should be read-only unless explicit permission exists for a specific safe write.

---

# 32. EXECUTION STRATEGY — ONE COMPREHENSIVE ASSIGNMENT

The owner prefers finishing each milestone through one thoroughly specified Codex implementation prompt.

This is that prompt.

Use internal phases rather than requesting separate implementation instructions.

## Phase 1 — Inspect foundation

Understand actual repository architecture and the accepted M03/M04 components.

Inspect the real workbook.

Confirm technical integration paths.

## Phase 2 — Native Flow model

Implement schema, services, authorization, event/departments, scheduling logic, revisions, and relationships.

## Phase 3 — Creation and Shot List connection

Implement global Create, document index, Shot List selection, daily shot occurrences, and the initial Flow.

## Phase 4 — Department Flow

Implement the core editor with actual grid behavior, row types, department configuration, direct editing, selection, and dragging.

## Phase 5 — Shot Rail and Time Map

Implement connected shot planning and timing visualization.

Integrate all operations into the same canonical model.

## Phase 6 — Excel import

Build file processing, mappings, review, source preservation, and source-based tests.

## Phase 7 — Printing

Implement print presets, measured pagination, direct PDF rendering, preview parity, and snapshots.

## Phase 8 — Complete UI polish

Finish comments, history, responsive states, icons, dropdowns, animations, error states and all nested interfaces.

## Phase 9 — Full QA

Run real workbook, editing, collaboration, integration, responsiveness, PDF, and regression tests.

## Phase 10 — Release

Use the verified existing production process.

Do not stop at a local build.

## Interruption handling

If usage or session limits interrupt execution:

- Preserve completed source work.
- Save a precise progress checkpoint.
- Identify remaining requirements.
- Record test outcomes.
- Avoid restarting implementation.
- Continue from actual repository state.

Do not falsely mark untested requirements complete.

---

# 33. RELEASE AND DEPLOYMENT

Use the actual current `RELEASING.md` and project QA/release tooling.

Historical scripts include:

- `qa/m03/prepare.cjs`
- `qa/release.cjs`

Confirm current usage rather than assuming old commands remain valid.

## Release requirements

- Correct source branch.
- Relevant builds pass.
- Tests pass.
- Migrations are safe.
- Backend starts successfully.
- Production permissions work.
- Frontend output is current.
- Site repository receives correct assets.
- Unrelated site files remain unchanged.
- Railway runtime is healthy.
- GitHub Pages serves the new bundle.
- Existing M03/M04 functionality remains intact.

Do not force-push.

Do not discard unrelated changes.

Do not weaken authentication.

Do not claim deployment success solely because a source commit was pushed.

Perform the authorized scoped release through established procedures.

---

# 34. REQUIRED FINAL DELIVERABLES

At completion, provide a factual report.

## A. Implemented functionality

Describe:

- Flow index.
- Creation.
- Shot List linking.
- Department Flow.
- Shot Rail.
- Time Map.
- Excel import.
- Comments.
- Revisions.
- Print Studio.
- PDF outputs.

## B. Architecture

Explain actual source-of-truth boundaries and persistence.

Identify reused M03/M04 components and any new shared components.

## C. Workbook import

State whether the actual September 25 source workbook was available and tested.

Report import completeness and unresolved mappings honestly.

## D. Print quality

Provide generated PDF evidence.

Identify tested paper sizes and presets.

Explain horizontal and vertical pagination behavior.

Report text/content validation.

## E. Visual QA

Provide organized screenshots of real integrated interfaces, including nested and secondary states.

## F. Functional QA

List actual user journeys and their pass/fail results.

Do not replace evidence with generic statements.

## G. Security and collaboration

Report authentication/authorization, real-time persistence, source protection, and revision checks.

## H. Regression preservation

Confirm accepted M03 and M04 behaviors were not broken.

## I. Deployment

Provide observed source/site commits, branches, backend deployment and actual served frontend evidence.

## J. Outstanding limitations

Identify genuine blockers or unverified behavior.

Do not report something as implemented if only its UI shell exists.

---

# 35. NON-NEGOTIABLE FAILURE CONDITIONS

M05 is incomplete if any of the following occur:

1. The application is a generic spreadsheet clone.
2. The application is only a generic Gantt chart.
3. Shot List connection is missing or unnecessarily difficult.
4. Selected shots must be retyped manually.
5. Technical shot data is duplicated into a separate competing database.
6. Daily shot reordering changes the canonical M03 shot order.
7. Department tasks cannot exist without a filming shot.
8. Full-width milestones destroy their department-specific instructions.
9. The main editor has weak grid navigation or poor direct editing.
10. Row dragging uses generic text placeholders.
11. Hidden departments are accidentally deleted.
12. Time Map and Department Flow maintain separate schedules.
13. Timing moves silently shift fixed milestones.
14. Cross-midnight events sort incorrectly.
15. Missing estimates are replaced by fabricated values.
16. Excel import loses important original instructions.
17. The two ambiguous source time columns are guessed without review.
18. Shot matching invents incorrect authoritative relationships.
19. The original workbook is discarded.
20. Comments/history are primitive or nonfunctional.
21. Secondary interfaces have inferior visual quality.
22. Print Studio uses generic browser controls.
23. PDF output uses an editor screenshot.
24. Full departmental reports omit departments silently.
25. Letter/A4 output uses unreadably tiny fonts.
26. Long notes are clipped.
27. Milestones are broken awkwardly across pages.
28. Horizontal departmental pages lose time/action context.
29. PDF preview and download differ.
30. Printed revision identity is misleading.
31. The export works technically but looks unprofessional.
32. M03 or M04 regresses.
33. Production data is modified by unsafe QA.
34. Source changes are committed but frontend publication is stale.
35. Codex declares owner acceptance without the owner's review.

---

# 36. FINAL PRODUCT STANDARD

Imagine a 1st AD starting work on tomorrow's filming day.

They open Whiteout Flow.

They connect the existing Shot List rather than copying shot numbers into a spreadsheet.

They select the appropriate scenes and shots, arrange their daily shooting sequence, establish planned timing and add all relevant production milestones.

They can enter Camera, Sound, Costume, HMU, Props, Actors and other departmental instructions directly beside the actual schedule.

The document remains readable and enjoyable to edit.

They can drag activities, adjust times, inspect overlapping preparation, make changes collaboratively and trust that the linked Shot List remains authoritative.

The director can inspect relevant shots without leaving the ecosystem.

The DP can change permitted technical shot information without creating duplicate records.

A department head can immediately find their instructions without navigating technical camera fields.

When the AD opens Print Studio, the same schedule becomes a genuinely beautiful, accurately paginated PDF.

The printout looks intentionally designed for filmmaking.

Every included department instruction is present.

Nothing is clipped.

The font remains readable.

The chosen paper size is used intelligently.

The PDF preview matches the document that gets downloaded and printed.

The application feels like the same family as Whiteout Shot Lists and Storyboards, including every menu, selector, contextual control, notification and secondary interface.

**This is not another spreadsheet. It is a specialized, connected, beautifully designed filmmaking production-day application.**

---

# 37. FINAL EXECUTION INSTRUCTION

Implement **Vader: Whiteout M05 — Flow of the Day** comprehensively.

Use the current accepted Production Desk architecture as the foundation.

Reuse actual M03/M04 components wherever appropriate.

Build the native departmental Flow, authoritative Shot List integration, Shot Rail, Time Map, Excel import, collaboration, revisions, and professional Print Studio.

Preserve existing production data.

Test real user workflows.

Validate every PDF at actual page level.

Inspect secondary interfaces as rigorously as the main editor.

Complete the existing authorized release process.

Do not create a new roadmap.

Do not begin M06.

Do not independently redesign the product.

Do not substitute inferior generic UI or simplify essential requirements without explicit technical justification.

If a genuinely unavoidable limitation blocks a capability, implement everything compatible with the specification, preserve all completed work, document the exact blocker and evidence, and do not falsely report completion.

**The objective is one exceptional implementation assignment that delivers a production-ready Flow of the Day application, at the same standard as accepted M03 Shot Lists and M04 Storyboards.**

**BEGIN IMPLEMENTATION NOW.**
