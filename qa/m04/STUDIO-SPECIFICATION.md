# VADER: WHITEOUT — MILESTONE M04/12
## Storyboards Studio — Final Recovery, Creative Engine Integration, Complete Visual Redesign & Production Release

**Implementation model:** GPT-6.1 Sol — High reasoning
**Assignment:** Full implementation and verified release
**Scope:** M04 Storyboards recovery and completion
**Existing milestone status:** Implemented and deployed, but explicitly rejected by the owner
**Objective:** Finish M04 comprehensively within this implementation assignment.

---

# 0. READ THIS FIRST — YOUR ROLE AND THE STANDARD OF WORK

You are Codex, the implementation engineer for **Vader: Whiteout**, a film-production platform containing several connected applications.

This assignment is the second major implementation pass for **Milestone M04: Storyboards**.

The first M04 implementation created considerable functional infrastructure and was successfully deployed, but the owner rejected the product experience after extensive live testing.

The problem was not simply missing functionality. It was a failure of interface design, component quality, interaction consistency, creative-tool capability, and workflow integration.

The owner and ChatGPT have now completed extensive design and technical planning. This document is the resulting implementation contract.

**Your responsibility is to implement these decisions, not redesign the product independently.**

## The division of responsibility

- The owner and ChatGPT establish product direction, visual design, component selections, interaction requirements, and feature scope.
- Codex examines the actual source code, resolves engineering implementation details, writes the software, tests it, and completes authorized release operations.
- You must not turn this assignment back into a high-level brainstorming exercise.
- You must not substitute generic UI patterns when the specification describes a particular interaction.
- You must not treat an unfamiliar technology as permission to implement an inferior substitute.
- You must not leave unfinished secondary screens simply because the main dashboard looks good.

You may make normal technical implementation decisions, but not fundamental product-design decisions contrary to this contract.

## Central product decision

**Build one unified Whiteout Storyboard Studio that supports both importing existing artwork and drawing panels from scratch.**

Use selected capabilities from the open-source **VectorCraft Rust engine**, integrated into Whiteout's own React interface through an appropriate browser/WebAssembly adapter.

Do NOT embed the complete VectorCraft application.

Do NOT build an Illustrator clone.

Do NOT revert to the existing limited Konva annotation system as the new primary drawing experience.

Do NOT build two disconnected editors called Markup and Draw.

The owner wants an excellent filmmaking-oriented drawing experience that incorporates appropriate mature graphics technology.

## The most important visual rule

**Every surface must be beautiful, refined, animated where appropriate, and functionally excellent.**

This applies equally to:

- Main document pages.
- Storyboard grids.
- Drawing workspaces.
- Import dialogs.
- PDF cropping.
- Review and ordering.
- Floating toolbars.
- Nested tabs.
- Dropdowns.
- Popovers.
- Color selectors.
- Sliders.
- Object inspectors.
- Selection controls.
- Empty states.
- Loading states.
- Error messages.
- Viewers.
- Presentation controls.
- Confirmation dialogs.
- Source management.
- Collaboration feedback.
- Responsive/mobile layouts.

A beautifully designed main page with ugly secondary interfaces is a failed implementation.

**No generic rectangular-button fallback. No inconsistent visual language. No 2010-style technical control panels.**

The goal is an application that feels purpose-built for directors, cinematographers, storyboard artists, and small production teams.

---

# 1. PROJECT HISTORY AND ACCEPTED BASELINE

This is part of an established 12-milestone modernization.

The relevant milestone statuses are:

| Milestone | Status |
|---|---|
| M01 — Apps Hub | Accepted |
| M02 — Production Desk foundation | Implemented and published |
| M03 — Collaborative Shot Lists | Accepted, closed, and visually authoritative |
| M04 — Storyboards | Implemented/deployed but NOT accepted; this assignment |
| M05 — Flow of the Day | Not started |
| M06 — Call Sheets/editor/distribution | Not started |

Do not create another roadmap or renumber the milestones.

Do not begin M05.

Do not perform the full M06 Call Sheet editor redesign.

## M01 — Visual identity

M01 established the Whiteout visual direction through original Hairline-inspired illustrations, coherent dark surfaces, refined colors, sophisticated component treatment, and carefully composed interactions.

Preserve that identity.

## M02 — Application foundation

M02 established the Production Desk shell, sidebar, document navigation, roster, common controls, and application structure.

Use the existing foundation.

The current legacy Call Sheet editor is NOT our visual benchmark. Its comprehensive redesign belongs to M06.

## M03 — The authoritative benchmark

M03 Collaborative Shot Lists is explicitly accepted by the owner.

The owner extensively used the deployed application and considered it more suitable for the intended production workflow than general-purpose spreadsheet tools.

M03 established:

- High-quality application controls.
- Refined menus and popovers.
- Precise layouts.
- Strong document interactions.
- Animated checkbox treatments.
- Thoughtful iconography.
- Appropriate Metal effects.
- Good drag interactions.
- Stable collaboration feedback.
- Direct spreadsheet-style PDF output.
- Powerful production-specific workflows.

**M03 is the minimum acceptable standard for M04.**

Preserve M03.

Do not rewrite Shot Lists, change its PDF engine, reopen accepted behaviors, or introduce regressions.

## Existing M04 infrastructure

The previous implementation already introduced significant functionality, reportedly including:

- Storyboards index and document model.
- PDF/image source import.
- Source storage.
- Crop extraction.
- Panel records.
- Panel ordering.
- Panel viewer.
- Basic annotations.
- Shot linking.
- Grid/Split/Present.
- Comments/revisions.
- Collaboration infrastructure.
- Storyboard exports.
- Backend migrations.
- Private object storage.
- Production deployment.

Verify the actual current source before proceeding.

**Do not discard working infrastructure merely because the interface needs redesign.**

However, do not preserve an inferior UI simply because it already exists.

---

# 2. WORKSPACE AND SCOPE

The intended workspace is:

`/Users/thameralanezi/Developer/Vader-Whiteout/`

Containing:

- `vader-whiteout-site/`
- `vader-whiteout-production-desk/`
- `vader-whiteout-scheduler/`
- `Whiteout Equipment/`

These are separate projects, not one parent Git repository.

The primary editable application is:

`vader-whiteout-production-desk/`

The site repository is relevant for publishing the compiled Production Desk frontend.

Scheduler is the existing authentication and production-membership authority.

Equipment is unrelated to this milestone.

## Initial inspection

Before making changes:

1. Read applicable `AGENTS.md` files and project instructions.
2. Confirm the actual workspace and Git status.
3. Identify the current Production Desk source branch and deployed frontend arrangement.
4. Inspect the current Storyboards implementation.
5. Inspect accepted M03 components and styling.
6. Identify reusable existing controls.
7. Inspect current database, collaboration, annotation, storage, and export contracts.
8. Identify the existing QA and release scripts.
9. Preserve pre-existing user changes and unrelated source files.

Do not assume historical paths or commit hashes are necessarily the current HEAD.

Do not restart from an old M04 commit.

Do not copy the old implementation into another project.

## Source areas to inspect

Locate the current equivalents of:

- `client/src/pages/StoryboardsPage.tsx`
- `client/src/pages/StoryboardPage.tsx`
- `client/src/components/storyboards/ArtworkImport.tsx`
- `CropEditor.tsx`
- `ExtractionReview.tsx`
- `SortablePanel.tsx`
- `AnnotationCanvas.tsx`
- `PanelViewer.tsx`
- `ShotPicker.tsx`
- `OriginalViewer.tsx`
- `storyboards.css`
- Storyboards API and persistence modules.
- Storyboards database schema/migrations.
- Shared Whiteout buttons, icon controls, menus, overlays, tooltips, feedback, loaders, checkboxes, and synchronization components.
- M03's established draggable interactions and document controls.
- `RELEASING.md`
- `qa/release.cjs`
- `qa/m03/prepare.cjs`

These are historical source names. Locate actual current equivalents rather than failing because one file has moved.

Do not spend large amounts of time producing another generic architectural report. Inspect enough to implement correctly, then implement.

---

# 3. MANDATORY DESIGN REFERENCE LIBRARY

The following websites are not merely suggestions for visual inspiration.

They are established sources of component behavior and design patterns selected during owner/ChatGPT planning.

We have already decided their intended applications.

Your task is to integrate appropriate versions into Whiteout's design system.

## 3.1 EasyUI — primary interaction components

Website:

https://easyui.site/

### Animated File Upload

https://easyui.site/components/animated-file-upload

**Required application: Storyboard import.**

Adapt its:

- Animated file selection.
- Dropzone interaction.
- Per-file progress.
- Transfer-state feedback.
- Completion treatment.
- Retry and removal controls.
- Smooth visual transitions.

Connect everything to actual Whiteout upload operations.

No fake progress.

No redundant Upload Artwork button after files have already been transferred.

### Animated Tabs

https://easyui.site/components/animated-tabs

**Required application: Grid / Split / Present and appropriate nested mode selection.**

Use a sophisticated moving selection indicator and smooth content transitions.

Do not create plain rectangular tabs that abruptly change color.

Preserve clear keyboard/focus behavior.

### Floating Action Dock

https://easyui.site/components/floating-action-dock

**Required application: Storyboard Studio tool dock.**

Adapt:

- Compact tool arrangement.
- Responsive active selection.
- Subtle movement.
- Tooltips.
- Small-scale magnification or emphasis where useful.

Do not copy a giant macOS dock.

The result must feel appropriate for a professional creative application.

### SpringSelect

https://easyui.site/components/spring-select

**Required application: Compact selectors and dropdowns.**

Examples:

- Scene selector.
- Aspect ratio.
- Ordering mode.
- Brush presets.
- Other small settings.

Keep dropdown dimensions tight.

Avoid the excessive vertical padding and oversized menus previously criticized in M02/M03.

### Morphing Button

https://easyui.site/components/morphing-button

**Required application: Important asynchronous operations.**

Examples:

- Done after import review.
- Creating a new storyboard.
- Committing an operation that actually takes time.

Use real idle/loading/success/error states.

### DrawCheckbox

https://easyui.site/components/draw-checkbox

**Required application: Appropriate visibility and selection toggles.**

Preserve actual drawn transition animation.

Do not replace accepted Whiteout DrawCheckbox behavior with browser-native checkboxes.

### Gooey Menu

https://easyui.site/components/gooey-menu

Use selectively for a small number of signature interactions if appropriate.

Do not turn every menu into a gooey effect.

### Undo Toast

https://easyui.site/components/undo-toast

**Required application: Reversible structural actions.**

Provide clear recovery controls for supported undo operations.

The visual undo timer must match the real persistence semantics.

## 3.2 Bencho — specialized direct manipulation

Website:

https://bencho.dev/

### Icon Bar

https://bencho.dev/blocks/icon-bar

Use the animated selection-pill behavior as a reference for compact icon tool groups.

### Resizable Panels

https://bencho.dev/blocks/resizable-panels

Use its restrained drag-response and minimum-size behavior for:

- Import workspace panes.
- Split view.
- Contextual inspector layout.

### Split View

https://bencho.dev/blocks/split-view

Use appropriate resizable two-pane behavior.

### Selection Actions

https://bencho.dev/blocks/selection-actions

Use a contextual action-pill approach for selected editable objects where appropriate.

The toolbar must remain attached to the selected object and avoid obscuring its contents.

## 3.3 Rare UI — deliberate microinteractions

Website:

https://www.rareui.com/

### Delete Button

https://www.rareui.com/components/deletebutton

Use an adapted compact animated delete-confirmation pattern for suitable panel/object actions.

Do not replace every deletion with an oversized modal.

However, whole-document deletion must retain appropriate confirmation.

### Toasts

Use tasteful notification state transitions with genuine backend results.

Respect licensing/attribution requirements for adapted third-party components.

## 3.4 Libraries.dev — Liquid Metal

https://libraries.dev/metal

Liquid Metal is a valued Whiteout reference, and selected M03 treatments have already established its role.

Use it sparingly for a few distinctive signature controls or interactive accents.

Never apply constant expensive shaders to every card, button, or navigation element.

Avoid visual clutter and unnecessary rendering costs.

Reuse the established Whiteout implementation when available.

## 3.5 Hairline

https://hairline.lucasmarkes.com/skills

Hairline helped establish M01's accepted illustrated identity.

Use its principles for:

- Original feature illustrations.
- Empty-state identity.
- Carefully composed SVGs.
- Purposeful icons/geometry.
- Cohesive illustration-based interface details.

Do not use AI-generated raster imagery as a substitute for component design.

## 3.6 Other established research references

Preserve the original visual-reference context:

- https://glisse.kelvinzhang.com/
- https://amicro.dev/
- https://bencho.dev/
- https://libraries.dev/
- https://www.rareui.com/
- https://hairline.lucasmarkes.com/skills
- https://easyui.site/

Do not pretend an unidentified or inaccessible component has been verified.

Use the concrete, verified reference mappings above.

## Implementation rule for references

Do not indiscriminately install entire component libraries.

Inspect existing Whiteout implementations first.

Adapt selected interaction patterns into reusable Whiteout-compatible components.

Preserve licenses and notices.

Avoid duplicate animation frameworks, conflicting global styles, excessive client bundles, and vendor-specific styling that does not match Whiteout.

The final application must feel like ONE design system.

---

# 4. VISUAL SYSTEM — NON-NEGOTIABLE

The owner explicitly rejected the first M04 because many interfaces looked like old technical software.

This must be corrected throughout the application.

## 4.1 Visual direction

Preserve the accepted Whiteout palette, typography, spacing conventions, application surfaces, border treatments, and overall dark visual identity.

Do not generate a new independent brand system.

The result should feel refined, distinctive, tactile, creative, and genuinely professional.

Avoid:

- Generic SaaS dashboard styling.
- Giant rounded cards.
- Excessive borders.
- Heavy blue background strips.
- Large empty black gutters.
- Repeated eyebrow headings.
- Unnecessary instructional paragraphs.
- Oversized permanent action bars.
- Text-only boxes for conventional icon actions.
- Uncontrolled shader/glow effects.
- Clumsy button groupings.
- Default browser-looking widgets.
- Featureless technical forms.

## 4.2 Control hierarchy

Implement a consistent hierarchy:

### Primary actions

Short descriptive label, useful icon, strong but restrained visual emphasis, tactile interaction.

Examples:

- Add panel.
- Import artwork.
- Done.
- Create storyboard.

### Secondary actions

Compact, well-designed text/icon combinations.

### Utility actions

Icon-first with accessible labels/tooltips.

Examples:

- Fullscreen.
- Close.
- Next/previous.
- Undo/redo.
- Duplicate.
- Remove.
- Fit.
- Zoom.
- More actions.

### Contextual actions

Appear beside or within the relevant object.

Examples:

- Selected drawing object.
- Selected crop.
- Hovered panel.
- Multi-selected panel group.

Do not force every action to be text-free. Clarity remains important.

However, **never use a large generic rectangular button containing an action name where a conventional compact icon control would be better.**

## 4.3 Motion language

Use a coherent motion system rather than individually improvised animations.

Initial targets, reconciled with existing M03 components:

| Interaction | Motion |
|---|---|
| Hover/focus | 100–160 ms |
| Button press | 120–180 ms tactile response |
| Dropdown | 160–220 ms anchored spring |
| Tabs | 180–260 ms moving indicator |
| Tooltip | 100–160 ms |
| Dialog/drawer | 220–320 ms |
| Panel settle after dragging | 180–280 ms |
| View transition | 180–280 ms |
| Tool selection | 140–220 ms |

These values are guidelines, not overrides for established accepted design tokens.

Use animation to communicate:

- Selection.
- Relationship.
- Reordering.
- Processing.
- Completion.
- State change.
- Object movement.
- Error/recovery.

Do not animate merely to decorate.

Respect reduced-motion preferences.

Animations must not compromise accessibility, input latency, layout stability, or persistence correctness.

## 4.4 Reusable components

Create or refine a coherent Storyboards component layer for:

- Icon buttons.
- Primary buttons.
- Segmented controls.
- Dropdowns.
- Tool docks.
- Floating object toolbars.
- Popovers.
- Tooltips.
- Custom sliders.
- Custom color selector.
- Animated checkboxes.
- Confirmation interactions.
- Loading states.
- Upload progress.
- Error/retry states.
- Notifications.
- Empty states.
- Drag previews.
- Resizable pane handles.
- Context menus.
- Selection indicators.

Do not duplicate nearly identical components across Storyboards subviews.

Use the accepted shared Whiteout components wherever appropriate.

---

# 5. THE COMPLETE STORYBOARDS PRODUCT

Implement one connected experience:

**Create → Import or Draw → Organize → Edit → Link → Collaborate → Present → Export**

The underlying persistent storyboard document must support:

- Imported artwork.
- Hand-drawn artwork.
- Mixed imported/drawn sequences.
- Multiple scenes.
- Multiple panels.
- Panels without Shot List links.
- Multiple shots associated with one panel.
- Multiple panels associated with one shot.
- Independent artwork revisions.
- Notes/comments.
- Stable source references.

Do not create separate incompatible document models for imported and native artwork.

---

# 6. STORYBOARDS INDEX AND CREATION

## 6.1 Index

Reuse M03's accepted document-index conventions.

Support:

- Search.
- Sort.
- Open.
- Rename.
- Duplicate.
- Delete.
- Document status.
- Updated context.
- Panel count.
- Scene/shot-link context where available.
- A useful thumbnail/preview where available.
- Full-row navigation.

Do not introduce ghost action controls or change M03 document deletion behavior.

## 6.2 Empty state

The currently deployed Storyboards empty state reportedly uses an incorrect Call Sheets/file icon.

Fix this.

Use original Storyboards-specific iconography consistent with the sidebar and M01's illustrated identity.

Make the two fundamental creation possibilities obvious:

- Import existing artwork.
- Start drawing.

Also preserve the existing **From Shot List** creation route, where appropriate, so a user can create shot-linked storyboard placeholders.

These three routes must converge into the same storyboard model.

## 6.3 Creation behavior

Support:

**Import artwork:** Start from a PDF or image.

**Start drawing:** Create a blank editable panel immediately.

**From Shot List:** Start with real linked shots/scenes and optional empty artwork placeholders.

Shot List association is optional.

Do not force an elaborate wizard for basic creation.

Use beautiful, compact creation choices, appropriate animation, and clear loading/error states.

---

# 7. MAIN GRID — GALLERY REDESIGN

The existing broad density and approximately three-column desktop arrangement are acceptable.

Do not replace the gallery with enormous cards, a generic tile dashboard, or a totally different information architecture.

## 7.1 Artwork presentation

Improve the card composition.

The current deployed gallery has:

- Awkward black bands.
- Inconsistent framing.
- Excessive dark gutters.
- Heavy blue caption areas.
- Weak visual harmony between cards.

Replace these with carefully balanced artwork mounts.

Preserve:

- Original artwork proportions.
- Handwritten marks.
- Actual image boundaries.
- Source context.
- Non-standard aspect ratios.

Do not destructively crop drawings to force uniform cards.

Use a consistent neutral stage with restrained caption treatment.

Allow irregular artwork to look intentional rather than trapped inside arbitrary boxes.

## 7.2 Card content

Keep concise:

- Panel sequence label.
- Original source label when meaningful.
- Useful linked-shot information.
- Optional concise note/indicator.
- Appropriate contextual controls.

Avoid repeated explanatory text and permanent action rows.

## 7.3 Contextual interaction

On hover, focus, or selection, reveal refined actions for:

- Open/edit.
- Link/inspect.
- Duplicate.
- Delete.
- Reorder.
- More actions.

Use accessible equivalents on touch devices.

## 7.4 Drag and reorder — critical

The deployed implementation used a rectangular overlay reading **"Moving panel"**.

This is expressly rejected.

When dragging:

1. The ACTUAL artwork follows the pointer.
2. The preview remains recognizable.
3. The dragged card visually lifts.
4. Neighboring cards move smoothly.
5. The intended insertion point is obvious.
6. Release settles the card naturally.
7. Order saves correctly.
8. Keyboard alternatives exist without giant permanent controls.

Reuse the accepted M03 direct-manipulation principles.

Do not implement a generic text drag banner.

Do not implement giant Earlier/Later arrow banks.

## 7.5 Identity preservation

Reordering must not mutate:

- Permanent panel UUID.
- Original source reference.
- Original source label.
- Linked shot UUIDs.
- Artwork revision identity.
- Annotation ownership.
- Comments.
- Scene association.

Sequence order is separate from identity, original labels, and Shot List shooting order.

---

# 8. COMPLETE ARTWORK IMPORT WORKSPACE

The existing import function is one of the largest reasons M04 was rejected.

It eventually produces panels, but the workflow is confusing and visually poor.

We are replacing its interaction structure, not abandoning working import/backend foundations.

## 8.1 Core interaction

Implement **one coherent import workspace**, not disconnected crop and review pages.

Recommended desktop composition:

**Left:** Original source/page navigation.

**Center:** Faithfully rendered source page with editable crop regions.

**Right:** Resulting panel sequence, with actual thumbnails.

**Persistent footer:** Status and one clear Done action.

Use independently scrollable and resizable panes where useful.

On narrower screens, adapt the same workflow into coordinated tabs/drawers rather than squeezing everything into unusable columns.

## 8.2 File selection

Support:

- PDF.
- PNG.
- JPEG.
- WebP.

Use actual animated drag/drop and file-selection interactions.

File transfer begins when the user selects or drops the file.

Provide:

- Real progress.
- File names/previews.
- Per-file state.
- Cancel.
- Retry.
- Compact removal.
- Recoverable errors.
- Validation.
- Accessible status information.

**Do not require another Upload Artwork click after selection.**

## 8.3 Source preservation

Store the original uploaded source privately and durably.

Preserve the original bytes for download.

The original source must remain accessible through Sources/View Original.

Failed extraction must not destroy the original.

Allow an original-only document with zero extracted panels when appropriate.

## 8.4 Panel detection

PDF pages are source pages, not necessarily storyboard panels.

Render faithful pages using the existing PDF processing infrastructure.

Detect reasonable composition regions across all pages.

Do not treat embedded PDF images alone as complete storyboard extraction.

Do not use an external paid AI/OCR service.

Do not invent handwriting interpretation or confident panel counts.

Automatic regions are suggestions.

## 8.5 Crop editing

Each detected region must have:

- Visible but refined outline.
- Readable panel number.
- Drag handles.
- Resize/move behavior.
- Add region.
- Remove region.
- Duplicate region where appropriate.
- Zoom/pan.
- Undo/redo.
- Immediate thumbnail update.
- Clear selected/verified states.

Regions must be easy to see over light and dark artwork.

Preserve user corrections when detection is rerun.

Allow inclusion of handwritten margin notes and irregular compositions.

Store normalized source coordinates with page index, source reference, rotation/transform information, and persistent crop identity.

## 8.6 Review and ordering

This must happen **inside the same workspace**.

Selecting a crop highlights its sequence thumbnail.

Selecting a thumbnail navigates to its source page and crop.

Support actual thumbnail dragging.

Use smooth movement and clear insertion feedback.

No giant arrows.

No separate blue review page.

No repeated Earlier/Later buttons.

No long vertical sequence of technical steps.

## 8.7 Completion

The user reviews and clicks **Done**.

Done means the source has already been ingested and the user is confirming the selected/corrected panel sequence.

Show actual validation and saving status.

Commit reviewed panels idempotently.

Prevent duplicate panels from repeated confirmation.

Return to Grid with correct individual panels.

## 8.8 Edge cases

Handle:

- Single images.
- Multi-page PDFs.
- Multiple file selection.
- Large source PDFs.
- Irregular panels.
- Overlapping suggestions.
- Missing automatic suggestions.
- No regions.
- Cancel during upload.
- Failed transfer.
- Reconnecting.
- Source page rotation.
- Manual correction.
- Repeated Done.
- Partial processing failure.
- Returning to unfinished review where persistence permits.

Use realistic artwork, not placeholder rectangles, for actual interaction validation.

---

# 9. VECTORCRAFT — SELECTED RUST ENGINE INTEGRATION

This is a binding architectural decision.

Repository:

https://github.com/storytold/vectorcraft

Documentation:

https://github.com/storytold/vectorcraft/blob/main/docs/architecture.md

The repository is a Rust workspace with distinct layers such as:

- `vectorcraft-geom`
- `vectorcraft-doc`
- `vectorcraft-brush`
- `vectorcraft-pathops`
- `vectorcraft-tools`
- `vectorcraft-engine`
- `vectorcraft-render`
- `vectorcraft-svg`

And a separate `ui-egui` frontend.

This separation is the opportunity.

## 9.1 What we are building

A **Whiteout-specific browser drawing adapter** using selected VectorCraft engine capabilities, compiled into an appropriate WebAssembly module.

React remains responsible for the visible interface.

The drawing engine provides appropriate geometry, brush, path, command, rendering, and editing operations.

Do not embed the full VectorCraft UI.

Do not redirect users into a VectorCraft website.

Do not reproduce the complete Illustrator feature set.

## 9.2 Required engineering approach

1. Pin an exact compatible VectorCraft source revision.
2. Inspect the actual relevant crate APIs, dependency layering, browser compatibility, and licenses.
3. Select the minimum meaningful subset.
4. Build a focused Rust/WASM integration package or bridge.
5. Define a narrow TypeScript adapter.
6. Integrate it with the existing Whiteout editor.
7. Preserve stable geometry and editable object identities.
8. Add deterministic serialization, reload, and output.
9. Connect completed editing operations to collaboration/persistence.
10. Test actual drawing and full round trips.

The existing repository documents an engine-first architecture, but does not guarantee an already packaged React-compatible bridge.

Building the necessary bridge is part of your engineering assignment.

## 9.3 Intended engine capabilities

Prioritize:

- Freehand brush strokes.
- Smooth path generation.
- Pressure-aware input where supported.
- Vector paths.
- Bézier editing.
- Object transforms.
- Basic shapes.
- Arrows.
- Text objects.
- Selection/hit testing.
- Undoable drawing operations.
- Deterministic saved geometry.
- Rendering/export support.

Reuse mature engine internals where practical.

Whiteout-specific glue is acceptable.

Do not ship an unrelated full VectorCraft menu system.

## 9.4 Scope exclusions

No requirement for:

- Illustrator's full effects library.
- Gradient mesh tooling.
- Complex appearance stacks.
- 3D systems.
- Image tracing studio.
- Animatics.
- Keyframe animation.
- Audio/video timelines.
- AI image generation.
- Entire desktop publishing workflow.

## 9.5 No silent fallback

Do not quietly abandon VectorCraft and simply re-skin the old Konva canvas.

If some specific crate cannot compile to the selected browser target or exposes unsuitable APIs:

- Determine the exact technical limitation.
- Reuse the largest viable selected engine subset.
- Implement a compatible Whiteout-specific adapter for the missing layer.
- Preserve the required user-facing behavior.
- Document any genuine remaining limitation.

Do not claim an engine capability is integrated simply because source code was downloaded or compiled.

The final browser must actually use it.

## 9.6 Integration isolation

Keep the engine integration isolated from ordinary Storyboards UI components.

Avoid bundling unnecessary VectorCraft application assets.

Lazy-load editor-specific WASM where appropriate.

Measure startup and bundle size.

Preserve any required copyright/license notices.

Do not import brand assets or protected logos that are outside the project's code license.

---

# 10. STYLUS, APPLE PENCIL, TOUCH AND INPUT

Excellent stylus support is one of the main reasons the owner selected VectorCraft.

Inspect and adapt the actual relevant browser input implementation, including its pen/touch handling.

## Required behavior

### Mouse

- Smooth drawing.
- Reliable pointer capture.
- No gaps from fast movement where coalesced samples are available.
- Correct cursor and tool feedback.

### Stylus

- Pressure-aware drawing where supported.
- Smooth stroke construction.
- Correct coordinate transforms.
- Predictable start/end behavior.
- Reliable interruption/cancellation.

### Apple Pencil

Support the browser-exposed Apple Pencil capabilities available on compatible iPad/Safari hardware.

Pay particular attention to:

- Pressure.
- Pen/finger distinction.
- Coalesced pointer events.
- Palm rejection.
- Finger-based navigation.
- Hover where actually supported.

Do not claim tilt-sensitive dynamics or hardware capabilities that have not been independently verified.

### Touch

- One-finger drawing according to active input/tool policy.
- Appropriate two-finger pan/zoom.
- No accidental drawing when navigating.
- Correct pointer cancellation.
- No stuck tool states.

### Trackpad

- Smooth zoom/pan.
- No accidental drawing triggered by navigation.
- Predictable wheel behavior.

## Verification

Automated pointer-event tests are useful but do NOT prove physical Apple Pencil performance.

Run real hardware tests if compatible hardware is available.

If physical hardware is unavailable, report that honestly and preserve a specific outstanding verification item.

Do not represent synthetic pressure input as actual hardware validation.

---

# 11. UNIFIED STORYBOARD STUDIO

There is ONE editor.

Imported panels and blank hand-drawn panels use the same creative workspace.

Drawing is not a hidden technical feature.

## 11.1 Studio layout

Use:

- Large central artwork.
- Compact floating or edge-attached creative tool dock.
- Contextual tool settings.
- Discreet navigation and zoom.
- Optional inspector.
- Beautiful object-selection controls.
- Clear save/sync feedback.

Do not recreate Illustrator's entire toolbar and panels.

Do not clutter the artwork with permanent instructional text.

## 11.2 Tools

Implement:

### Select

Select, move, resize, rotate, and edit appropriate objects.

Show tasteful selection handles and contextual properties.

### Brush

Create smooth freehand strokes.

Support configurable width, opacity, color, and selected brush behaviors.

Pressure sensitivity when available.

### Vector Pen

Create/edit paths and Bézier control points.

### Arrow

Directly draw and reshape arrows, including relevant curved arrows.

This is especially important for camera movement and blocking annotations.

### Shapes

Line, rectangle, ellipse, and simple callout geometry.

### Text

Click directly on artwork to create a live editable text object.

Support:

- Caret.
- Unicode.
- Composition/IME input.
- In-place editing.
- Movement.
- Resize/transform.
- Color.
- Font size and relevant basic properties.

No detached textarea followed by Insert.

### Eraser

Erase/remove the relevant editable drawing content without destructively modifying source artwork.

### Hand/Pan

Navigate the canvas independently of drawing.

## 11.3 Custom creative controls

### Tool dock

Adapt Floating Action Dock / Bencho Icon Bar principles.

Use:

- Original or consistent SVG glyphs.
- Animated selected state.
- Compact tooltips.
- Meaningful keyboard shortcuts.
- Comfortable touch/stylus target sizes.
- Responsive collapsed arrangement.

No giant buttons labeled "Pen", "Arrow", "Text" in ordinary rectangles.

### Brush properties

Use a beautiful compact popover containing:

- Width control.
- Current value.
- Color.
- Opacity.
- Appropriate presets.

### Color selector

Create a Whiteout-styled color interface.

Include:

- Useful curated swatches.
- Recent colors.
- Custom color selection.
- Opacity.
- HEX entry where appropriate.

Do not make the default browser color picker the primary interaction.

### Object controls

Use a contextual animated selection toolbar.

Avoid unnecessary permanent inspector panels when a small contextual action is sufficient.

## 11.4 Critical brush-state bug

The current implementation reportedly changes previously drawn content when the pen-width slider moves.

This is explicitly unacceptable.

Enforce separate state ownership:

**Active Brush → width/color changes affect future strokes.**

**Selected existing object → property controls explicitly change that object only.**

A completed object owns persisted geometry and styling.

Changing a global brush default must never restyle old marks.

Write regression tests for this exact behavior.

## 11.5 Text correctness

Text editing must remain anchored to the artwork under:

- Zoom.
- Pan.
- Resize.
- Rotation.
- Viewport changes.
- Save/reload.

No position drift.

No detached editor.

Preserve exact user-entered text and supported Unicode.

## 11.6 Undo/redo

Treat meaningful completed actions as coherent undo units.

Do not create a separate undo step for every raw pen sample.

Support undo/redo for:

- Stroke creation.
- Object movement.
- Property changes.
- Text editing.
- Shape transforms.
- Object deletion.
- Relevant grouping/structural changes.

Define how local undo interacts with collaborative state.

Do not undo another user's unrelated edits.

## 11.7 Original artwork preservation

Imported sources remain untouched.

Drawings/annotations are editable layers or objects associated with the panel's artwork revision.

The user may toggle annotation visibility.

Replacing artwork creates an appropriate revision rather than destructively replacing historical content.

Do not silently move annotations onto unrelated new source geometry.

---

# 12. DRAWING FROM SCRATCH AND MIXED STORYBOARDS

This is an explicitly approved new capability.

A user must be able to make a storyboard without uploading anything.

## 12.1 Blank storyboard

Start with a clean editable panel.

Use a sensible widescreen default.

Allow appropriate frame/aspect settings.

Avoid an excessive setup wizard.

Enter Studio immediately.

## 12.2 Adding a blank panel later

Example:

The user imports a Scene 09 PDF and creates nine panels.

They later want a tenth panel.

They select an insertion position and choose Add panel → Draw new panel.

Whiteout inserts a blank panel at the intended sequence position.

Studio opens.

The user draws using the same tools.

The resulting panel belongs to the same storyboard, sequence, collaboration model, exports, and presentation modes.

## 12.3 Mixed source types

Support a single sequence containing:

- Cropped PDF panels.
- Imported image panels.
- Native hand-drawn panels.
- Panels with additional vector annotations.

All participate equally in:

- Grid.
- Reordering.
- Shot linking.
- Split.
- Present.
- Export.
- Collaboration.
- Revisions.

Do not introduce incompatible imported/drawn document types.

---

# 13. PANEL VIEWER AND NAVIGATION

The existing panel viewer has reasonable artwork space but poor control composition.

Redesign its chrome.

## Viewer requirements

- Back navigation.
- Panel identity.
- Compact sequence counter.
- Previous/next navigation.
- Conventional fullscreen icon.
- Fit/zoom.
- Direct access to editing.
- Optional notes/shot inspector.
- Annotation visibility.
- Correct loading/error feedback.

Use recognizable icons.

No large ordinary rectangle labeled "Full screen".

No row of equally weighted unrelated utility boxes.

No permanently intrusive notes/sidebar controls.

Preserve actual artwork dimensions and quality.

Maintain zoom/pan and selected panel state appropriately.

The user should not have to discover annotation functionality through an obscure hidden control.

---

# 14. SPLIT VIEW

Grid, Split, and Present remain the principal storyboard views.

## 14.1 Connected Split

Display real linked Shot List context beside the artwork.

Use the M03 source of truth.

Do not duplicate independently editable camera/lens/framing/coverage records.

Do not embed an entire second M03 application shell.

Support resizable panes with sensible minimum dimensions.

Keep personal split sizing as user preference.

Synchronize selection between related shot and panel content.

## 14.2 No linked Shot List

The current deployed Split displays a plain instruction resembling:

"Link a panel to a Shot List to use Split view."

This is explicitly rejected.

Create a beautiful **Connect a Shot List** empty state.

Use original Whiteout illustration/iconography.

Provide a clear connection action.

Preserve the surrounding layout's visual balance.

Do not waste half the screen on raw instruction text.

## 14.3 Narrow layouts

Use adaptive tabs/drawers rather than microscopic side-by-side panels.

Preserve usability under browser zoom and small screens.

---

# 15. PRESENT MODE

Present must look like a polished director-facing presentation tool.

## Required behavior

- Artwork-dominant stage.
- Dark restrained presentation background.
- Minimal floating navigation.
- Compact counter.
- Standard fullscreen icon.
- Keyboard arrows.
- Escape handling.
- Swipe/touch navigation.
- Optional notes and annotations.
- Consistent panel sequence.
- Smooth, understated transitions.

Controls can fade when inactive and reappear when needed.

Do not render enormous text buttons.

Do not show editing chrome in presentation mode.

Do not build an animatic editor, audio timeline, or video export system.

---

# 16. SOURCES, LINKING, NOTES, COMMENTS AND REVISIONS

These are first-class secondary surfaces and must be designed accordingly.

## Sources

Implement a coherent source viewer for:

- Original source PDF/image.
- Page navigation.
- Original download.
- Source labels.
- Related extracted panels.
- Original/cropped context.

Use high-fidelity rendering.

Do not create a fourth competing main editing mode.

## Shot linking

Support many-to-many links:

- One panel → multiple shots.
- Multiple panels → one shot.
- Unlinked panels.
- Shots without artwork.

Use stable UUIDs.

Do not infer links from handwritten labels.

Use a compact searchable shot picker with meaningful scene and shot context.

Preserve M03 technical authority.

A deleted/unavailable shot must not cause storyboard artwork to disappear.

## Notes and comments

Support lightweight production comments/replies and the existing revision/comment model.

Provide real author/time information.

Do not create a complicated approval system for a small team.

The layout must remain elegant even when comments are empty or numerous.

## Revisions

Preserve original artwork and prior versions.

Allow inspection and appropriate restoration.

Maintain stable panel identities and links.

Use clear visual revision status rather than raw technical storage details.

Do not let concurrent operations silently overwrite valid artwork revisions.

---

# 17. COLLABORATION, DATA AND PERSISTENCE

Preserve the existing production-membership authorization system and Yjs/Hocuspocus collaboration foundation.

## Required invariants

- Stable storyboard UUID.
- Stable panel UUID.
- Stable shot UUID relationship.
- Stable artwork revision identity.
- Stable original source metadata.
- Explicit sequence-order semantics.
- Independent original labels and display order.
- Per-user UI preferences separated from shared production data.

## Collaboration

Small-team editing should feel natural.

Do not introduce per-edit approval bureaucracy.

Multiple collaborators must be able to work without losing unrelated changes.

Persist completed drawing operations in coherent transactions.

Do not put raw binary artwork, large media files, or unbounded pointer-sample streams directly into Yjs.

Use appropriate object-level shared state and durable media storage.

## Conflict behavior

Independent object creation should coexist.

Same-object conflicts require deterministic handling.

Disconnect/reconnect must not silently discard acknowledged edits.

Undo must respect local authoring semantics.

## Legacy annotations

The existing annotations are production data.

Support a tested migration/adapter or backward-compatible rendering route.

Do not delete them or silently convert them into a lower-quality flattened result.

## Media

Keep private R2/object storage and the existing authenticated access mechanisms.

The bucket and Railway configuration were already set up during the first M04 implementation.

**Do not ask the owner to repeat R2 configuration unless an actual verified new failure requires action.**

Do not expose credentials or convert private source objects into public links.

---

# 18. STORYBOARD EXPORTS

Preserve existing working export functionality and improve it only where required for the new native drawings and annotations.

Do not rewrite M03's accepted Shot List PDF system.

## Required export behavior

- Original source download.
- Organized storyboard PDF.
- Actual automatic preview.
- Preview/download parity.
- Whole storyboard.
- Selected scenes.
- Selected panels.
- 1/2/4/6 panels per page where existing product settings support them.
- Letter/A4.
- Portrait/landscape.
- Notes toggle.
- Linked shot details toggle.
- Annotation visibility toggle.
- High-resolution artwork.
- Undistorted proportions.

Native hand-drawn panels must export correctly.

Preserve annotation compositing and source fidelity.

Do not use a screenshot of the grid as the export renderer.

Do not create Generate → Refresh Preview → Download busywork.

Existing successful printing behavior should not regress.

---

# 19. EMPTY, LOADING, ERROR AND CONFIRMATION STATES

This section is mandatory because secondary states were particularly neglected previously.

Create proper visual treatments for:

- No Storyboards.
- No panels.
- No imported artwork.
- No connected Shot List.
- No detected crop regions.
- Upload pending.
- Upload failed.
- Processing source.
- Extraction partial failure.
- Drawing engine loading.
- Drawing engine unavailable.
- Media access denied.
- Missing source.
- Revision unavailable.
- Syncing.
- Saved.
- Reconnecting.
- Interrupted persistence.
- Deleting.
- Recoverable deletion.
- Export processing.
- Export failure.

Each must be visually consistent with Whiteout.

Use useful wording and concrete recovery actions.

Do not show raw exception strings as the primary interface.

## Saved indicator

The current plain "Saved" text beside the avatar is rejected.

Reuse M03's established synchronization treatment and actual state semantics.

Do not invent a new, inferior indicator.

## Skeletons

Loading placeholders should resemble the structure they replace.

Avoid generic full-page loading blocks.

## Destructive actions

Use context-sensitive inline confirmation for small object removal.

Preserve appropriate whole-document confirmation.

Cancel must restore state correctly.

Never produce ghost buttons after cancellation.

---

# 20. ACCESSIBILITY AND RESPONSIVENESS

High visual quality does not excuse inaccessible interactions.

Support:

- Keyboard operation.
- Meaningful focus visibility.
- Screen-reader labels for icon-only controls.
- Accessible upload status.
- Correct tab semantics.
- Escape cancellation.
- Accessible menus/popovers.
- Keyboard reorder alternatives.
- Touch targets appropriate for fingers/stylus.
- Reduced-motion preference.
- High-DPI rendering.
- Browser zoom.
- Responsive desktop/tablet/narrow layouts.

Test important views around:

- 1440px desktop.
- 1280px desktop.
- 1024px.
- 768px tablet.
- Narrow mobile width.
- 200% browser zoom.

Do not simply shrink a desktop three-column editor until controls are unusable.

Use intentional layout changes.

---

# 21. PERFORMANCE AND ENGINE RELIABILITY

The selected VectorCraft engine integration should not make the ordinary Storyboards index slow.

Requirements:

- Lazy-load editor-specific WASM when appropriate.
- Keep normal document navigation responsive.
- Avoid loading every full-resolution PDF page into memory simultaneously.
- Use sensible source-rendering and thumbnail caches.
- Cancel obsolete processing.
- Release canvas and WASM resources when appropriate.
- Prevent memory leaks during repeated editor open/close cycles.
- Avoid giant shader bundles for ordinary interface controls.
- Maintain smooth drawing interactions.
- Avoid pointer lag caused by synchronous persistence.
- Avoid excessive network writes for raw pointer samples.

Measure actual performance and bundle sizes.

Distinguish initial editor loading from normal document navigation.

Handle failed WASM initialization with an honest recoverable state.

Do not silently report a successful drawing engine integration when the browser is actually using the legacy path.

---

# 22. VISUAL QA — EVERY SURFACE, NOT JUST THE MAIN PAGE

Do not consider this complete after inspecting the gallery and one editor screenshot.

Create a systematic visual QA matrix.

## Required screenshot/interaction evidence

Inspect:

1. Storyboards index populated.
2. Storyboards index empty.
3. Create menu open.
4. Blank storyboard creation.
5. Main Grid with actual artwork.
6. Hovered panel.
7. Selected panel.
8. Panel dragged with actual artwork overlay.
9. Import initial dropzone.
10. Upload in progress.
11. Upload error/retry.
12. Source page/crop editor.
13. Selected editable crop.
14. Panel sequence/reorder.
15. Import ready-to-confirm.
16. Native drawing panel.
17. Imported panel with annotations.
18. Active brush tool.
19. Brush settings popover.
20. Custom color picker.
21. Selected vector object.
22. Direct text editing.
23. Shape/arrow editing.
24. Viewer normal.
25. Viewer fullscreen.
26. Split with linked shots.
27. Split unlinked empty state.
28. Present with controls visible.
29. Present with controls faded.
30. Sources viewer.
31. Shot link picker.
32. Notes/comments.
33. Revision/history interface.
34. Save/sync/reconnect states.
35. Delete confirmation.
36. Export preview/settings.
37. Narrow/tablet editor.
38. Reduced-motion behavior.

Use the actual existing design system.

Do not substitute isolated component-demo screenshots for real integrated application screenshots.

## Animation verification

Static screenshots do not prove motion.

Observe or record:

- Tab selection.
- Dock selection.
- Dropdown opening.
- Popover positioning.
- Panel lifting.
- Neighbor displacement.
- Thumbnail dragging.
- Crop manipulation.
- Upload progression.
- Button state morphing.
- Checkbox transition.
- Toast/undo behavior.
- Presentation navigation.

The specific rejected "Moving panel" text overlay must not survive.

---

# 23. FUNCTIONAL REGRESSION JOURNEYS

Run complete end-to-end journeys.

## Journey A — Blank creation

1. Create blank storyboard.
2. Start drawing.
3. Create brush strokes.
4. Create text.
5. Draw/edit arrows.
6. Save.
7. Reload.
8. Confirm artwork and object properties are preserved.

## Journey B — Real Scene 09 import

1. Upload `Scene 09.pdf`, if available.
2. Render every source page.
3. Detect candidate panels.
4. Correct crop regions.
5. Review all actual panels.
6. Reorder panels.
7. Confirm Done.
8. Inspect Grid.
9. Verify original page reference and labels.
10. Export organized artwork.

## Journey C — Scene 16 mixed-content import

Use the real `Scene16_Storyboard(1).pdf` / `Scene16_Storyboard.pdf` fixture where available.

Test large file behavior, mixed photos and drawings, handwritten notes, and imperfect detection.

Manual cropping must work when automation is uncertain.

## Journey D — Nine panels to ten

1. Open an imported nine-panel storyboard.
2. Insert a blank panel at a chosen position.
3. Draw on the blank panel.
4. Return to Grid.
5. Confirm ten panels.
6. Reorder.
7. Reload.
8. Verify stable identities.
9. Verify export and Present.

## Journey E — Brush regression

1. Draw a narrow stroke.
2. Change the brush width.
3. Draw a thick stroke.
4. Confirm the first stroke is unchanged.
5. Select the first stroke.
6. Explicitly edit its width.
7. Confirm only that object changes.
8. Undo.
9. Save/reload.

## Journey F — Text geometry

1. Insert text directly on artwork.
2. Edit it in place.
3. Move it.
4. Zoom.
5. Pan.
6. Resize viewport.
7. Save/reload.
8. Confirm its position and content are correct.

## Journey G — Collaboration

1. Open the same storyboard in two authorized sessions.
2. Add independent drawing objects.
3. Edit notes and order where supported.
4. Disconnect one session.
5. Reconnect.
6. Verify no silent loss.
7. Test same-object conflict policy.
8. Confirm actual sync feedback.

## Journey H — Linked Shot Lists

1. Link panels to real shots.
2. Verify many-to-many relationships.
3. Inspect Split.
4. Rename/reorder a shot.
5. Verify links survive.
6. Disconnect a link.
7. Verify panel artwork persists.
8. Confirm no duplicated technical truth.

## Journey I — Presentation and export

1. Enter Present.
2. Navigate mouse/keyboard/touch.
3. Fullscreen.
4. Toggle annotations/notes where supported.
5. Exit cleanly.
6. Preview PDF.
7. Download.
8. Confirm preview/download parity and artwork fidelity.

## Journey J — Recovery

Test cancellation, upload failure, retry, deletion cancellation, missing media, interrupted synchronization, repeated confirmation, and unavailable editor initialization.

No false success states.

---

# 24. AUTOMATED TESTS AND ACCEPTANCE GATES

Implement automated tests for:

- Drawing object geometry.
- Brush default/object style separation.
- Pen pressure input adapter where synthetic testing is possible.
- Pointer interruption.
- Text coordinate transforms.
- Undo/redo.
- Source crop normalization.
- Detection correction persistence.
- Stable panel IDs across reorder.
- Import idempotency.
- Mixed panel source types.
- Collaboration transactions.
- Revision retention.
- Authorized media access.
- Export rendering.
- Existing M03 regressions.
- Build and migration behavior.

A green build is not sufficient.

A successful WASM compile is not sufficient.

A working upload endpoint is not sufficient.

A visually attractive screenshot is not sufficient.

**The complete user experience must be correct.**

Only the owner can accept M04.

---

# 25. IMPLEMENTATION EXECUTION ORDER — ONE ASSIGNMENT

This must be one continuous implementation assignment, not six new milestone prompts.

Use the following order internally.

## Phase A — Preserve and inspect

Establish source truth, accepted M03 components, existing M04 data boundaries, release procedure, and exact integration scope.

## Phase B — Shared visual system

Create/refine the reusable components and motion rules that will be consumed by every M04 surface.

Avoid creating one-off inconsistent controls later.

## Phase C — Rust/WASM creative engine

Build and validate the selected VectorCraft integration.

Prove a real draw/edit/save/reload/export round trip.

Connect the input layer and Whiteout object model.

## Phase D — Storyboard creation and Studio

Implement blank drawing, the unified tool dock, creative tools, object editing, stylus/touch handling, annotations, and contextual properties.

## Phase E — Import and Grid

Rebuild the integrated importer, source/crop/sequence workflow, gallery framing, and real-artwork dragging.

## Phase F — Remaining surfaces

Complete viewer, Split, Present, Sources, linking, notes, revisions, and all secondary states.

## Phase G — QA and integration

Run actual source fixtures, complete user journeys, collaboration tests, visual testing, accessibility, responsiveness, and M03 regression checks.

## Phase H — Release

Complete a validated, scoped production release following existing project tooling.

This sequencing is internal. Do not require separate owner prompts between ordinary steps.

## Important continuation rule

If a tool session or usage window is interrupted, preserve the actual state of work and precise next steps.

Do not restart implementation or rediscover completed work on continuation.

Do not spend the entire allowance polishing one component while leaving half the product unfinished.

Do not lower the visual standard to satisfy a superficial completion checklist.

---

# 26. DEPLOYMENT AND GIT RULES

The owner previously authorized normal automated commits, pushes, and deployments for validated milestone implementations.

That later authorization supersedes the older M01/M02 manual-only workflow.

You may use established scoped release processes once the implementation is ready.

However:

- Do not force push.
- Do not hard reset or discard unrelated work.
- Do not weaken authentication.
- Do not reveal secrets.
- Do not create destructive migrations.
- Do not create arbitrary production test records.
- Do not edit Scheduler/Equipment without a genuinely necessary, explicitly scoped dependency.
- Do not deploy knowingly broken code.

## Production Desk publication

The editable source is in the Production Desk repository.

The deployed frontend is published through the site repository's `productiondesk/` output.

Use the actual verified build/release tooling.

Historical tooling includes:

- `qa/m03/prepare.cjs`
- `qa/release.cjs`
- `RELEASING.md`

Confirm their current behavior.

Use exact existing commands and proper dependencies rather than inventing a new release process.

Verify:

1. Relevant source build passes.
2. Tests pass.
3. Required migrations are safe and applied once.
4. Railway runtime is healthy.
5. Fresh frontend assets are produced.
6. Correct API/WebSocket endpoints are used.
7. Site publication actually includes the new assets.
8. Unrelated site files remain unchanged.
9. GitHub Pages serves the current bundle.
10. Real authenticated production smoke checks pass where safely possible.

Publishing source without publishing the frontend does not complete release.

Do not confuse Railway deployment IDs with Git commit hashes.

Do not reopen settled R2 setup.

---

# 27. REQUIRED DELIVERABLES

At the end, provide a clear, factual implementation report.

Include:

## A. What changed

Summarize by actual feature and surface, not merely file counts.

## B. VectorCraft integration

State:

- Pinned source revision.
- Selected crates.
- Actual integration approach.
- WASM output.
- Used engine functionality.
- Whiteout-specific adapter behavior.
- Tests performed.
- Real limitations.

Do not imply hardware compatibility from synthetic tests.

## C. Visual components

List the actual implemented components and the precise reference influences.

Distinguish components directly reused from components adapted or newly authored.

## D. Functionality

Report complete user journeys and their results.

## E. Screenshots / interaction evidence

Provide organized real integrated captures, not only isolated demo components.

Include secondary interfaces and active states.

## F. Persistence and compatibility

Describe legacy annotation compatibility, data protection, revisions, storage and collaboration verification.

## G. Performance

Report relevant build sizes, lazy-loading behavior, render/input checks and known limits.

## H. QA

List tests run and actual outcomes.

Clearly mark skipped tests and the reason.

## I. Release

Identify:

- Source commit.
- Site commit.
- Branches.
- Backend deployment outcome.
- Frontend publication outcome.
- Production smoke-check results.

Only provide identifiers that were actually observed.

## J. Outstanding issues

Report genuinely unresolved issues without disguising them as complete.

Do not call M04 owner-accepted.

---

# 28. FINAL FAILURE CONDITIONS

The following outcomes constitute failure to satisfy this specification:

1. Main gallery polished but import remains ugly.
2. Drawing works but its toolbar is generic text buttons.
3. VectorCraft is mentioned but not actually integrated into the browser drawing path.
4. The full VectorCraft application replaces Whiteout's viewer.
5. Konva remains the sole primary creative engine despite the selected architecture.
6. Changing brush width modifies existing strokes unintentionally.
7. Text insertion still depends on a detached side textarea.
8. Upload needs redundant technical confirmation before transfer.
9. Crop and review remain disconnected page-based workflows.
10. Reordering uses giant arrows rather than actual draggable artwork.
11. Gallery dragging displays a "Moving panel" text bar.
12. Fullscreen is an ordinary text-only rectangular button.
13. Split has an unattractive raw instruction in place of a designed empty state.
14. The Storyboards empty state still uses the wrong Call Sheets icon.
15. Saved status is a plain inconsistent text label.
16. The creative tools remain hidden or difficult to discover.
17. Imported artwork and blank drawings use incompatible workflows.
18. Source media or existing annotation data is lost.
19. Shot links break when visual order changes.
20. Preview and download differ.
21. M03 accepted functionality regresses.
22. Secondary interfaces visibly lack the care given to primary screens.
23. Native-looking controls replace selected Whiteout components.
24. Animations are implemented as decorative gimmicks rather than meaningful interaction feedback.
25. The source is committed but the production frontend is stale.
26. Codex declares owner acceptance without the owner's review.

---

# 29. THE EXPERIENCE YOU ARE EXPECTED TO DELIVER

Imagine a director or cinematographer opening Whiteout Storyboards for the first time.

They should immediately understand that they can bring in existing drawings or start sketching.

They can import a real storyboard PDF and see its source pages and detected panels in one thoughtfully designed interface.

They can correct panel boundaries without confusion.

They can reorder illustrated panels by physically dragging the artwork.

They can insert a new blank panel in the middle of an imported sequence and draw directly onto it.

The drawing experience should feel natural with a mouse or compatible stylus, using smooth strokes, vector tools, arrows, shapes and direct text editing.

The controls should feel carefully designed and animated—not like ordinary rectangular forms.

The user should never be surprised by a sudden visual-quality drop when opening a crop editor, color picker, inspector, viewer, source panel, or presentation mode.

The artwork should remain beautiful and central.

Panel identities, revisions, links and collaboration must remain reliable.

Present and export should feel polished and straightforward.

The application should be especially good because it is built specifically for filmmaking, rather than attempting to reproduce a general-purpose graphics suite.

That is the standard.

---

# 30. FINAL EXECUTION INSTRUCTION

**Implement M04 Storyboards Studio comprehensively.**

This is not a research-only task.

This is not a request for another design proposal.

This is not permission to start M05.

This is not permission to rebuild accepted M03.

The owner and ChatGPT have already chosen the major design direction, component influences, user workflows and creative-engine strategy.

Use the existing Whiteout source as the starting point.

Implement the complete approved direction using the selected VectorCraft Rust/WebAssembly technology where applicable, preserve existing production data and collaboration systems, and apply the same high-quality visual/interaction design to EVERY surface.

Test real user journeys.

Inspect real interactions.

Run relevant regressions.

Complete the validated release through existing processes.

If a genuine technical limitation prevents a mandatory capability, identify it accurately, preserve completed work, implement everything compatible with the chosen design, and report the remaining blocker explicitly. Do not silently substitute a lower-quality product.

**Your task is not to make M04 merely functional. Your task is to deliver the beautiful, sophisticated, reliable, genuinely useful Storyboards application we have specified.**

Begin with source inspection, then proceed through implementation, integration, validation, and release within this assignment.

**Stop only after delivering the implemented result and a factual verification report. The owner will decide whether M04 is accepted.**
