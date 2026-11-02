VADER: WHITEOUT — MILESTONE M04/12
FINAL COMPLETION PASS — STUDIO RELIABILITY, PREMIUM UI POLISH, SHOT LIST INTEGRATION & PRODUCTION RELEASE
Codex model: GPT-6.1 Sol — High reasoning Task type: Full implementation, regression verification, visual QA, and validated production release Primary application: Vader: Whiteout Production Desk Milestone: M04 — Storyboards Current status: Substantially implemented and deployed, but NOT owner-accepted Objective: Resolve every remaining defect identified in the owner's comprehensive 20-screenshot live review and bring M04 to final product acceptance quality.

0. READ FIRST — THIS IS AN IMPLEMENTATION CONTRACT
You are Codex, the implementation engineer for Vader: Whiteout.
The owner and ChatGPT have completed the product research, visual planning, and technical design decisions.
Your responsibility is to implement those decisions comprehensively.
You are NOT being asked to propose a new design, invent another roadmap, restart M04, or reconsider the application's overall architecture.
This assignment is the final corrective pass on a substantially completed and deployed Storyboards application.
The previous major M04 recovery implementation successfully delivered important functionality:
* A substantially improved drawing system using selected VectorCraft-derived technology.
* A beautiful, functional creative-tool dock.
* Improved brush controls.
* Drawing from scratch.
* Imported artwork editing.
* Smooth, real-artwork panel dragging.
* Better gallery presentation.
* Animated artwork uploading.
* Functional Shot List linking.
* A much-improved presentation mode.
* Existing persistence, collaboration, revisions, exports, and production infrastructure.
Preserve these successes.
The remaining work is focused on actual defects, weak secondary interfaces, drawing-input reliability, missing production workflows, incomplete history functionality, and inconsistent controls.
The owner has now provided 20 screenshots and extensive first-hand testing on desktop and two different iPads.
Every reported defect is covered in this specification.
The governing rule
No requirement is optional merely because it appears small.
A 3px misalignment matters.
A redundant button matters.
An ugly secondary menu matters.
A scrollable panel that cannot actually scroll matters.
A visually attractive drawing engine that sometimes scrolls the browser instead of drawing matters.
Do not prioritize only the largest engineering tasks and neglect the small UI corrections.
Your role
The owner and ChatGPT determine:
* Product design.
* Interaction design.
* Visual language.
* Component choices.
* Feature scope.
* Expected behavior.
* Acceptance standards.
Codex determines:
* Technical implementation details within that specification.
* Actual source integration.
* Testing methodology.
* Safe migration details.
* Validated deployment execution.
Do not independently change the approved product direction.
Do not deliver another planning proposal.
Proceed through inspection, implementation, verification, and release.
Acceptance principle
A passing build does not mean M04 is accepted.
A successful deployment does not mean M04 is accepted.
A long implementation report does not mean M04 is accepted.
Only the owner can accept M04 after inspecting the actual application.

1. AUTHORITATIVE PROJECT CONTEXT
Vader: Whiteout is a connected filmmaking production platform.
The intended local workspace is:
/Users/thameralanezi/Developer/Vader-Whiteout/
Containing:
* vader-whiteout-site/
* vader-whiteout-production-desk/
* vader-whiteout-scheduler/
* Whiteout Equipment/
The parent folder is an organizational workspace, not one shared Git repository.
Relevant milestone status
* M01 Apps Hub — accepted.
* M02 Production Desk foundation — implemented.
* M03 Collaborative Shot Lists — accepted and closed.
* M04 Storyboards — deployed, still pending owner acceptance.
* M05 and later — outside this assignment.
Do not begin M05.
M03 is the visual and functional benchmark
M03 Shot Lists established the accepted Whiteout design system, including:
* Premium compact controls.
* Purposeful iconography.
* Animated duplication.
* Inline confirmation/deletion.
* Refined selected-item action bars.
* High-quality popovers and dropdowns.
* Animated checkboxes.
* Appropriate Liquid Metal usage.
* Smooth drag interactions.
* Consistent document interfaces.
* Actual collaboration/synchronization feedback.
* Direct spreadsheet-style PDF output.
Before implementing any Storyboards control, inspect whether M03 already has an equivalent component.
Reuse the actual M03 implementation whenever appropriate.
Do not merely imitate it superficially.
Do not recreate it using generic controls.
Do not rewrite accepted M03 functionality.
M04's existing infrastructure
Retain the current Storyboards system, including:
* Existing storyboard and panel records.
* Source-media references.
* Current creative-engine integration.
* Artwork revisions and persistence.
* Shot relationships.
* Yjs/Hocuspocus collaboration.
* Authentication and verified production membership.
* PostgreSQL records.
* Private R2 storage.
* Existing source/PDF import processing.
* Existing functional exports.
* Current production deployment structure.
Only extend these systems where the corrections genuinely require it.

2. REQUIRED PREFLIGHT — INSPECT THE CURRENT DEPLOYED IMPLEMENTATION
Before editing:
1. Read applicable AGENTS.md and repository instructions.
2. Confirm actual working directory.
3. Confirm repository identity, branch, HEAD, and Git status.
4. Identify any unrelated or pre-existing changes.
5. Inspect the current Storyboards source.
6. Identify the selected graphics engine actually used in production.
7. Inspect its brush, path, eraser, pointer, history, and serialization implementations.
8. Inspect shared M03 UI components.
9. Inspect current Storyboards inspector/comments/revision infrastructure.
10. Inspect document-level Shot List attachment and panel-to-shot relationships.
11. Inspect the existing Split data access and rendering.
12. Inspect the existing import dialog and scroll containers.
13. Inspect current QA/release scripts.
Preserve existing work.
Do not hard-reset, force-push, or discard user modifications.
Important source areas
Locate actual current equivalents of:
* Storyboards index and document pages.
* Panel viewer / Studio.
* Drawing-engine adapter.
* Brush properties and picker.
* Pointer/touch input.
* Eraser implementation.
* Shape/path tools.
* Panel inspector.
* Comments and replies.
* Artwork revisions/history.
* Storyboard Grid.
* Split workspace.
* Present mode.
* Shot linking.
* Upload/import dialog.
* Panel context menu.
* Selected-panel action toolbar.
* Production Desk global Create.
* Shared M03 controls and collaboration interfaces.
The historical filenames may have changed after the recent implementation. Inspect actual files instead of assuming old paths remain authoritative.
No architecture restart
Do not restart VectorCraft research.
Do not replace the graphics engine.
Do not revert to the old limited Konva implementation.
Do not embed the full VectorCraft application.
The current drawing engine is successful. We are improving it.

3. ABSOLUTE VISUAL AND COMPONENT STANDARD
This is one of the most important requirements.
The owner has repeatedly identified the same failure pattern:
The main interface looks beautiful, but nested menus, side panels, secondary screens, buttons, and other less-visible areas contain primitive, inconsistent controls.
That is unacceptable.
Every part of Storyboards must meet the accepted M03 visual standard.
3.1 What is forbidden
Do not use generic, oversized rectangular buttons where the action is better represented by a recognizable icon or a compact contextual control.
Do not create:
* Unnecessary text-only utility buttons.
* Duplicate controls for the same function.
* Default browser-looking primary widgets.
* Excessively tall dropdown menus.
* Cramped buttons touching text fields.
* Unaligned icon groups.
* Awkward hover panels.
* Menus that detach from their triggers.
* Huge instruction paragraphs.
* Inconsistent typography.
* Primitive loading buttons.
* Redundant Close controls.
* Unstyled comments.
* Floating action boxes with weak visual relationships.
* Dead features or buttons without meaningful functionality.
Text is not banned. Clear primary actions such as Done, Create, and Import may have short labels.
The objective is thoughtful control hierarchy, not removing all words.
3.2 Reuse approved component sources
The established design reference catalog includes:
* https://easyui.site/
* https://bencho.dev/
* https://libraries.dev/metal
* https://www.rareui.com/
* https://hairline.lucasmarkes.com/skills
* https://glisse.kelvinzhang.com/
* https://amicro.dev/
Relevant previously selected component patterns:
* EasyUI Animated File Upload.
* EasyUI Animated Tabs.
* EasyUI Floating Action Dock.
* EasyUI SpringSelect.
* EasyUI Morphing Button.
* EasyUI Undo Toast.
* EasyUI DrawCheckbox.
* Bencho Icon Bar.
* Bencho Selection Actions.
* Bencho Resizable Panels.
* Bencho Split View.
* Rare UI Delete Button.
* Libraries.dev Liquid Metal.
* Hairline original illustration/icon treatment.
Most importantly, the current Production Desk repository already contains beautiful examples.
Use those first.
Specific reuse requirements:
Feature	Required component foundation
Global Create	Existing accepted Whiteout Create component
Duplicate panel	M03 animated blue Duplicate treatment
Delete individual panel	M03 inline checkmark/X confirmation
Bulk actions	M03 selected-item action system
Clear selection	M03-compatible quiet utility action
Sync status	Existing M03 synchronization presentation
Menus	Established Whiteout menu/popover primitives
Dropdown positioning	Existing anchored portal system where available
Checkbox where appropriate	Existing animated DrawCheckbox
Upload	Newly successful M04 animated uploader
Studio dock	Newly successful M04 tool dock
Present	Newly successful M04 presentation system
3.3 Animation
Use restrained, purposeful animation.
Hover, press, dropdown expansion, tab selection, action confirmation, contextual menu appearance, and panel transitions should feel consistent.
Preserve existing accepted animations.
Do not introduce perpetual decorative animation.
Respect reduced-motion preferences.
Do not sacrifice performance for visual effects.
The final design must feel like one coherent product.

4. COMPLETE ISSUE LEDGER — ALL 20 OWNER SCREENSHOTS
Treat this as the coverage checklist.
The screenshots may not be physically accessible in the Codex working directory. Their exact problems are documented here, so do not depend on having the original image files to understand the requirements.
#	Observed defect	Mandatory result
1	Brush preset dropdown nearly touches color swatches; no eyedropper	Proper spacing and functional color sampling
2	Two icons beside Studio open the same inspector	Remove redundant control
3	Panel inspector has weak hierarchy, cramped Replace artwork, primitive sections	Full premium inspector redesign
4	Comment threads/replies look like basic forms; awkward Cancel reply	Proper discussion-thread UI
5	Frame selector inconsistent; Annotations checkbox unclear	Shared frame behavior; remove redundant annotations control
6	Imported panel toolbar uses different positioning	Stable universal toolbar
7	Native panel changes toolbar positions and exposes frame control inconsistently	Same layout and frame capabilities
8	Global Create omits New Storyboard	Add third option
9	Link Shots selected count/footer misaligned	M03-consistent alignment and styling
10	Linked panel still prominently titled Panel #	Automatic linked-shot-based display name
11	Drag grip vertically misaligned with selection/ellipsis	Exact alignment
12	Split creates enormous blank scrolling region	Correct independently bounded scroll panes
13	Present's Notes & shots is generic text rectangle	Refined icon-first control only
14	Import dropzone cramped; Close redundant; Done primitive	Responsive larger dropzone and refined Done
15	Uploaded file list cannot be fully scrolled before Done	Internal list scrolling and persistent footer
16	Panel menu disappears/detaches during pointer movement	Stable anchored menu
17	Panel menu appearance/hover state is inconsistent	Reuse Whiteout dropdown behavior
18	Bulk selected actions unlike M03	Reuse exact M03 duplication/deletion/action treatment
19	M03 already shows superior selected-item actions	Treat this as the authoritative example
20	History icon/function is redundant or nearly useless	One inspector entry point and real version preview/restore
In addition, the owner explicitly requires:
* Reliable Apple Pencil drawing without accidental page scrolling.
* Better third-party stylus and touch-input support.
* Two functional eraser modes.
* Draw-and-hold shape recognition.
* Easy document-level Shot List disconnection.
* Correct propagation of edits from Split to the same real Shot List.
* No regressions to working M04/M03 behavior.
No issue in this ledger may be silently omitted.

5. STUDIO POINTER, TOUCH AND STYLUS RELIABILITY
This is a high-priority functional correction.
The owner tested two iPads.
One used Apple Pencil Pro, with generally excellent drawing but rare cases where the stylus scrolled the page instead of drawing.
Another used an inexpensive third-party stylus and struggled to draw reliably.
Do not assume all styluses report themselves as pointerType: "pen".
5.1 Studio gesture ownership
When Studio opens:
* Lock normal background-document scrolling.
* Keep the artwork viewport responsible for drawing/navigation gestures.
* Prevent browser scrolling from stealing drawing gestures.
* Keep toolbars, inspector, popovers, dropdowns, and comments independently scrollable.
* Preserve focus and scroll restoration.
* Restore normal document scrolling when Studio closes or unmounts.
Inspect actual gesture surfaces and pointer event handling.
Apply appropriate touch-action, pointer capture, touch cancellation, and overscroll behavior to the correct elements.
Do not blindly disable scrolling throughout the entire application.
5.2 Pointer cancellation
Handle:
* pointerdown
* pointermove
* Coalesced pointer samples where supported.
* pointerup
* pointercancel
* Lost pointer capture.
* Browser gesture interruption.
* Opening/closing Studio during an active gesture.
* Tool switching during or immediately after a gesture.
Do not leave malformed strokes or permanently locked input state.
5.3 Input policy
Implement one compact Studio input preference with three behaviors.
Auto — default
Recognized pens draw.
Finger navigation is supported alongside recognized pen use.
For devices without recognized pen input, sensible single-touch drawing and two-touch navigation behavior should remain possible.
Touch Drawing
One touch draws with the selected tool even if the hardware reports the stylus as ordinary touch.
Two-finger gestures pan/zoom.
This is important for generic capacitive styluses and diverse tablet hardware.
Navigation Only
Touch gestures navigate rather than draw.
Mouse and recognized-pen drawing remain possible according to the active tool.
Use a compact settings popover, not another large toolbar.
Persist this as a personal preference.
5.4 Pressure fallback
When real pressure data is available, preserve it.
When it is unavailable, generate a consistent usable stroke.
Do not reject drawing or create effectively invisible marks because pressure is missing or constant.
Any velocity-derived variation must be restrained and predictable.
5.5 Palm rejection
Implement the best possible pen/finger distinction allowed by the browser.
Do not falsely claim perfect palm rejection on a passive stylus that is indistinguishable from a finger.
Physical-device limitations must be reported accurately.
5.6 Testing
Test:
* Studio open/close scroll locking.
* Actual canvas drawing versus page scrolling.
* Pen-like input.
* Touch-only input.
* Multi-touch pan/zoom.
* Rapid drawing.
* Pointer cancellation.
* Switching tools.
* Inspector scrolling.
* Brush-dropdown scrolling.
* Returning to Grid.
Use browser automation and synthetic events where applicable.
Do not claim actual Apple Pencil hardware verification unless compatible hardware was physically tested.

6. BRUSH SETTINGS — SPACING, COLOR AND EYEDROPPER
Preserve the attractive new brush popover.
Do not redesign it into an unrelated component.
6.1 Brush selector spacing
The brush preset dropdown currently sits too close to the color swatches.
Provide a proper spatial division between:
1. Brush preset.
2. Color palette.
3. Custom color/HEX.
4. Width.
5. Opacity.
Initial visual target: approximately 16–20px between the preset selector and color group, reconciled with existing spacing tokens.
Ensure wrapped swatches remain correctly spaced at narrower widths.
Keep the existing popover's successful styling.
6.2 Eyedropper placement
Add a pipette/eyedropper icon button directly beside the HEX field.
Use:
* Proper tooltip.
* Hover/active animation.
* Clear cursor feedback.
* Escape cancellation.
* Correct selected-color updates.
6.3 Cross-browser behavior
Use the browser EyeDropper API where supported and permitted, allowing screen-level color selection.
Where unavailable—including Safari/iPadOS—provide an in-canvas sampling fallback.
The fallback must sample the actual rendered storyboard composition, including imported artwork and visible editable drawing content.
Do not accidentally sample only a transparent overlay.
Use the correct image source, render buffer, and coordinate transform.
Ensure private media loading and CORS behavior preserve valid sampling without compromising source authorization.
Provide a small magnifier/preview where appropriate.
The brush's current color should update immediately after a valid sample.
Unsupported system-wide sampling must not cause the eyedropper button to become dead or useless.

7. ERASER — TWO FUNCTIONAL MODES
The current eraser requires individual contact/clicks and is unreliable when attempting to erase thin strokes by swiping.
Replace that behavior with two real modes inside the existing eraser tool.
Do not build a separate editor.
7.1 Whole-Stroke Eraser
The user swipes across drawing strokes.
Every editable stroke intersected by the gesture is removed.
Requirements:
* Continuous pointer-path tracking.
* Use all available coalesced samples.
* Test the swept segment between pointer positions, not just isolated points.
* Zoom-aware hit tolerance.
* Reliable interaction with extremely thin strokes.
* Efficient candidate filtering.
* Geometry-level intersection.
* Live indication of affected strokes.
* Multi-stroke removal during one swipe.
* One coherent undoable transaction.
* Proper collaboration and persistence.
A fast swipe through ten thin strokes must be capable of removing all ten, without ten individual taps.
7.2 Partial Circular Eraser
Provide an adjustable-radius circular eraser.
The visible cursor should show the true erasing footprint.
Dragging it across strokes removes only the portions of editable stroke geometry inside its swept region.
Requirements:
* Size/width adjustment.
* Smooth continuous erasure.
* Correct canvas coordinates under zoom/pan.
* Stroke/path segmentation or trimming.
* Remaining editable segments retain their style.
* Multiple paths can be partially erased during one gesture.
* Undo/redo.
* Save/reload.
* Collaboration.
* Correct export.
Do not fake partial erasure by painting white over a drawing.
Do not destroy the original imported PDF/image pixels.
For editable shapes/text whose geometry cannot appropriately support partial erasure, define deliberate behavior rather than corrupting the object. Whole-object erasure remains available.
7.3 Eraser settings UI
Provide two attractive compact choices:
* Partial.
* Whole stroke.
Use meaningful icons or concise descriptions.
Keep the current selected mode visibly clear.
Reuse the existing Studio popover design language.
Avoid large ordinary action rectangles.
7.4 Eraser regression tests
Test:
* Thin strokes.
* Thick strokes.
* Fast swipes.
* Slow swipes.
* Dense overlapping marks.
* Multiple strokes in one gesture.
* Partial path splitting.
* Zoomed canvas.
* Pan transforms.
* Undo.
* Redo.
* Reload.
* Export.
* Reconnect.
* Original media protection.

8. DRAW-AND-HOLD SHAPE ASSISTANCE
Add the practical drawing gesture used by note-taking applications such as Notability.
The user draws a shape and briefly holds at the end of the stroke to convert it into an accurate editable geometry.
8.1 Supported shapes
Prioritize:
* Straight lines.
* Rectangles.
* Squares.
* Circles.
* Ellipses.
* Triangles.
* Arrows.
Do not implement handwriting recognition or a general AI shape generator.
8.2 Gesture behavior
1. User starts a normal freehand stroke.
2. User reaches the end.
3. Pointer remains down and sufficiently stationary.
4. After a short threshold, a corrected shape is previewed.
5. User lifts to accept the shape.
6. Result becomes a regular editable vector object.
Use an initial threshold around 0.7–1 second, with testing and tuning.
Avoid forcing an unnecessarily long two-second hold if a shorter gesture feels more natural.
8.3 Recognition correctness
Use real geometry analysis:
* Line fitting.
* Closure detection.
* Corner detection.
* Shape deviation.
* Orientation and bounding geometry.
* Appropriate confidence thresholds.
Do not convert arbitrary scribbles merely because the user paused.
Preserve the user's original drawing if confidence is low.
8.4 Undo semantics
Shape conversion should be one meaningful action.
Undo must restore the original freehand stroke when appropriate.
Saved recognized geometry should remain editable after reload.
8.5 Gesture conflict
Ensure shape hold does not conflict with:
* Browser context menus.
* Stylus long-press behavior.
* Object selection.
* Pan gestures.
* Eraser gestures.
* Touch navigation.
8.6 Preference
Add a compact Shape Assistance toggle to Studio settings.
Enabled by default.
Persist the personal setting.
Do not require users to navigate an elaborate configuration panel.

9. CONSISTENT PANEL TOOLBAR
Imported and hand-drawn panels currently display different toolbar compositions.
Some controls move toward the center when navigating between panel types.
This must be eliminated.
9.1 One toolbar contract
All panel types should share stable positions for:
* Back.
* Panel identity.
* Sequence position.
* Previous/next.
* Studio.
* Inspector.
* Frame settings.
* Fullscreen.
Use fixed layout regions and intentional responsive behavior.
Do not allow controls to shift simply because one button appears or disappears.
9.2 Duplicate inspector buttons
The two icons beside Studio reportedly open exactly the same right-hand panel.
Consolidate them into ONE inspector toggle.
Use a meaningful icon, selected state and tooltip.
Do not retain a second icon merely because its glyph suggests another function.
History belongs inside the inspector, not as a useless duplicate top-level action.
9.3 Frame settings
Implement consistent frame behavior for imported and native panels.
Native drawings may default to 16:9.
Imported artwork should default to Original.
Both should support the same meaningful framing interface.
Suggested options:
* Original.
* 16:9.
* 4:3.
* Additional supported custom format.
Do not disable the selector merely because the panel was imported.
Frame changes must be non-destructive.
For imported artwork, offer explicit fitting/padding versus intentional cropping behavior.
For native drawings, preserve editable object positions and transforms across frame changes.
Avoid silent cropping, stretched images, or source modification.
9.4 Remove Annotations checkbox
The existing Annotations checkbox is redundant and confusing.
Drawing marks, arrows, text and other creative objects are part of the storyboard artwork.
Remove the checkbox from the main panel viewer, Studio, and Present toolbar.
Do not delete historical annotation data.
Do not flatten editable objects merely to remove this toggle.
Sources/View Original can provide a meaningful way to inspect untouched imported artwork.
Comments belong in the inspector; do not replace the obsolete checkbox with another permanent comments checkbox.

10. COMPLETE RIGHT-HAND INSPECTOR REDESIGN
This is a major visual-polish requirement.
The current inspector contains flat sections and basic form controls:
* Original label.
* Linked shots.
* Visual notes.
* Replace artwork.
* Artwork history.
* Comments.
The layout feels like a technical settings form rather than a professional creative workspace.
Redesign it as one coherent Panel Details inspector.
10.1 Structure
Use three clearly organized inspector tabs:
* Details.
* Comments.
* History.
Use an animated, compact tab treatment consistent with Whiteout.
Do not expose three competing toolbar buttons for these surfaces.
10.2 Details
Organize:
Panel identity
Show the effective display title.
Maintain separately editable original source label and custom title where relevant.
Do not force large multiline inputs for short values.
Linked shots
Display real linked shots with useful identifiers.
Provide contextual add/remove/link actions.
Reuse existing Shot List linking infrastructure.
Visual notes
Use a restrained note editor with adequate internal padding.
Auto-grow appropriately or scroll within sensible bounds.
Do not permanently consume excessive height when empty.
Artwork
Show a small preview/identity area where appropriate.
Move Replace artwork here.
Use a compact image-replacement action with meaningful iconography and feedback.
Do not leave Replace artwork touching the bottom border of Visual notes.
10.3 Layout
Use consistent meaningful section spacing, initially around 20–24px subject to established tokens.
Create a clear hierarchy between:
* Section heading.
* Content.
* Metadata.
* Contextual action.
The inspector must scroll independently from the artwork.
Keep its desktop width appropriate.
On narrow screens use a proper drawer or adapted view.
10.4 No generic buttons
Do not fill this inspector with ordinary rectangular buttons labeled with every possible action.
Use compact contextual controls and the accepted shared Whiteout component library.
Every hover, focus, loading, error and disabled state should be visually considered.

11. COMMENTS — PROFESSIONAL THREAD INTERFACE
The existing comments/replies UI is one of the owner's strongest remaining visual objections.
It currently resembles plain text, basic textareas, and awkward Reply/Resolve/Cancel reply controls.
Rebuild its presentation while preserving the actual comment backend.
11.1 Thread presentation
Use a refined discussion-card or sidebar-thread arrangement inspired by the clarity of Google Docs-style commenting.
Each thread should clearly display:
* Author identity/avatar.
* Timestamp.
* Comment content.
* Reply relationship.
* Resolved/unresolved state.
* Contextual actions.
Avoid large isolated paragraphs floating in empty space.
11.2 Replies
Clicking Reply should expand an inline reply composer beneath that thread.
Requirements:
* Smooth expansion.
* Automatic appropriate focus.
* Good textarea spacing.
* Comfortable internal padding.
* Compact Send action with icon.
* Clear disabled/loading state.
* Small cancel control or Escape behavior.
* No oversized Cancel reply rectangle.
* No composer touching neighboring controls.
After submission, the reply should appear in the same thread naturally.
Avoid large layout jumps.
11.3 Resolve/reopen
Provide an elegant compact Resolve action.
Resolved threads remain available through View resolved.
Use real persistent status.
Do not fake comment resolution through local-only UI state.
11.4 Thread placement
Comments should feel connected to the current panel and accessible from the inspector.
Do not invent a separate page or complex approval workflow.
Do not require formal production signoff bureaucracy.
11.5 Data preservation
Reuse current authors, timestamps, replies, resolved status and authorization.
Do not introduce an incompatible second comments backend.

12. ARTWORK HISTORY — REAL VERSION HISTORY
The current history feature appears to show little more than a revision label and timestamp.
That is not sufficient.
The owner wants meaningful history similar in principle to Google Docs or presentation/design software.
12.1 History belongs in the inspector
Remove the redundant or ineffective top toolbar history icon.
Use the inspector's History tab.
12.2 Required history functionality
Display actual available artwork revisions with:
* Revision identity.
* Author.
* Timestamp.
* Artwork thumbnail.
* Meaningful change information where available.
* Current/previous distinction.
Selecting a revision must provide a real read-only preview.
12.3 Restore
Implement a genuine Restore action.
Restoration must:
* Preserve the current version as historical data.
* Create a new current revision based on the restored artwork.
* Preserve panel UUID.
* Preserve source history.
* Preserve comments.
* Preserve shot links.
* Avoid silently overwriting concurrent valid edits.
* Work after reload.
A side-by-side or toggle-based comparison with current artwork is sufficient.
A full pixel-difference engine is not required.
12.4 Checkpoint policy
Inspect the existing revision storage first.
Avoid creating a full binary snapshot for every pointer movement.
Use coherent durable checkpoints or existing revision infrastructure.
Major artwork replacement should always preserve the previous version.
Where appropriate, named/manual checkpoints may be supported without cluttering the editor.
12.5 Historical limitations
If old records never contained sufficient editable historical data, do not fabricate it.
Provide honest availability states for historical revisions.
For newly created revisions, the implemented history mechanism must genuinely preserve enough data to support preview and restore.
If the underlying model requires a safe additive migration, implement it.
A label-only history interface is not an acceptable completion.

13. GLOBAL CREATE MENU — ADD NEW STORYBOARD
This is a concrete missing product feature.
The existing Production Desk Create menu currently shows:
* New Call Sheet.
* New Shot List.
Add:
* New Storyboard.
Use the exact established Create component.
Preserve:
* Existing animated expansion.
* Liquid Metal treatment where present.
* Typography.
* Icons.
* Row dimensions.
* Hover interactions.
* Focus behavior.
* Menu placement.
Do not rebuild the menu from scratch.
Use the established Storyboards icon.
The third option must be fully functional.
It must work whether zero, one, or many storyboards already exist.
It should enter the current creation experience with the existing options for importing artwork, drawing from scratch, or creating from Shot List where appropriate.
Do not require users to delete an existing storyboard to create another.

14. SHOT LIST INTEGRATION — FINAL AUTHORITATIVE RULES
THIS SECTION OVERRIDES ANY EARLIER SUGGESTION TO ADD A SEPARATE SHOT LIST SWITCHER INSIDE SPLIT.
The owner has explicitly clarified the intended relationship.
There is ONE authoritative connected Shot List document.
Split must show and edit that same Shot List.
There is no independent Shot List selected only for Split.
There is no duplicated Shot List data model inside Storyboards.
There is no separate change-list selector inside Split.
14.1 One document, one source of truth
A storyboard may be connected to a Shot List.
Split uses that existing document-level connection.
The connected Shot List is the actual M03 Shot List.
Shot Lists owns the authoritative technical data. Storyboards provides a connected visual editing and review surface.
This is what makes Whiteout an integrated filmmaking ecosystem rather than unrelated applications.
14.2 Edits made in Split must modify the actual Shot List
The owner expects a director and director of photography to review the storyboard and make useful shot adjustments while looking at the visual panels.
Allow appropriate inline editing of existing Shot List fields.
Reuse the actual M03 authorization, validation, collaboration and persistence model.
Where those fields exist and are editable in M03, support a focused appropriate subset such as:
* Subject/action/description.
* Shot notes.
* Camera information.
* Lens.
* Framing.
* Coverage.
* Movement.
* Other relevant established editable shot details that fit the compact Split surface.
Do not invent separate versions of those fields in Storyboards.
Do not create a full duplicate of the Shot Lists application.
Do not bring over the entire spreadsheet grid, scheduling interface, print system, column manager, or unrelated controls.
Do not permit destructive structural changes such as deleting shots from this compact surface unless they are explicitly part of an established authorized workflow.
14.3 Persistence and synchronization
When a user changes an allowed shot field in Split:
1. Apply the same validation rules as M03.
2. Write through the existing authoritative M03 data/collaboration layer.
3. Persist to the real Shot List.
4. Reflect changes in the main Shot Lists application.
5. Reflect changes in other connected sessions.
6. Display real save/sync feedback.
7. Preserve existing shot identities, relationships, and ordering.
Editing a shot's subject from Split must produce the same persisted result as editing that subject in M03.
Opening the actual Shot List afterward must show the change.
Do not implement local-only changes or stale duplicated objects.
14.4 No independent Split document switcher
Do not add:
* Change Shot List inside Split.
* Select a different list for Split.
* Copy a Shot List into the storyboard.
* A second authoritative Shot List state.
* An independent Split-only Shot List relationship.
If a storyboard is connected to Shot List A, Split displays Shot List A.
The user may edit permitted fields on Shot List A.
There should be no separate Split-specific list selection.
14.5 Disconnect Shot List — the ONLY required relationship-management action
The owner needs a straightforward way to undo an accidental connection.
Provide a compact Disconnect Shot List action at the storyboard document level, discoverable from the linked-document control or appropriate existing menu.
This does NOT mean deleting the Shot List.
Disconnecting must:
* Remove the storyboard's connection to that Shot List.
* Leave the actual M03 Shot List intact.
* Leave all its shots intact.
* Leave the storyboard document intact.
* Leave the storyboard panels and artwork intact.
* Preserve comments and artwork revisions.
* Remove or safely detach panel-to-shot relationships that depend on that disconnected document, consistently with the existing data model.
* Avoid dangling references.
* Return Split to its designed disconnected state.
If unlinking affects existing panel-shot associations, explain this succinctly in an appropriate contextual confirmation.
Do not add an unnecessary long warning ceremony.
Do not silently delete panel relationships without accounting for them.
The operation should be reversible by reconnecting the appropriate document where the model permits, but restoration of an association must not invent historical link data.
14.6 Reconnection
After disconnection, the user can use the existing storyboard connection flow to attach the intended Shot List.
This is NOT a request for a separate Change Shot List action inside Split.
The simple intended sequence is:
Connected Shot List → Disconnect → Connect the correct Shot List.
The owner specifically does not want multiple independent Shot List associations competing within the same Split workspace.
14.7 Split scrolling — critical bug
The deployed Split view creates enormous empty vertical space and prevents useful scrolling through actual shots.
Fix the underlying layout.
Use one bounded workspace below the document header with:
* Independently scrollable Shot List pane.
* Independently scrollable storyboard pane.
* Proper resizable divider.
* Correct minimum dimensions.
* Stable selection.
* No phantom page height.
* No unbounded body overflow.
Inspect actual parent layout, nested flex/grid structures, sticky headers, min-height, and overflow ownership.
Do not merely hide the bug with overflow: hidden while making content inaccessible.
Users must be able to scroll to the final shot.
Test long shot lists, many panels, multiple viewport sizes, browser zoom and collapsed sidebar.
14.8 The design goal
A director should be able to review storyboard panels, adjust an existing shot's permitted technical details, and trust that the same Shot List has been updated.
That is the intended ecosystem integration.

15. LINK SHOTS PICKER — FOOTER POLISH
The existing Link Shots picker is generally attractive and functional.
Preserve its main design.
Fix the footer alignment.
The selected-count label currently appears misaligned relative to the buttons, with typography that looks inconsistent with Whiteout's accepted controls.
Requirements:
* Consistent baseline alignment.
* Correct horizontal padding.
* Proper typography and weight.
* Aligned button heights.
* Responsive footer behavior.
* Correct selected-count updates.
* Proper empty-selection state.
* No layout jumps.
* Clear selection remains functional.
Reuse M03 footer and selected-action geometry wherever appropriate.
Do not redesign the entire picker.

16. PANEL NAMING — LINKED SHOT DEFAULTS
The current gallery may prominently display "Panel 2" despite a linked shot being available.
The owner wants the linked shot to be the default visible identity.
Implement this precedence:
1. Explicit user-defined custom panel title.
2. Primary/only linked shot's actual display label.
3. If several shots are linked, primary shot label plus a concise additional-count indicator.
4. Meaningful original source label where available.
5. Generic Panel # only when no better identity exists.
Where useful, include a secondary subject line from the actual Shot List.
The generic sequence number can remain discreet metadata.
Do not rename the persistent panel UUID.
Do not overwrite handwritten original labels.
Do not store an automatically derived shot label as an irreversible custom title.
If the authoritative shot label changes in M03, the derived default should update.
If the user deliberately assigns a custom title, preserve it.
The same naming rules should be reflected appropriately across Grid, viewer, Split and Present without causing layout inconsistency.

17. GALLERY HOVER CONTROLS — PRECISION FIX
The gallery's hover-revealed grip, selection checkbox and ellipsis are already a good interaction pattern.
Preserve hover reveal.
However, the drag grip is vertically misaligned with the other two controls.
Use one common layout row and optical alignment.
Requirements:
* Same visual centerline.
* Consistent button hit areas.
* Predictable hover background geometry.
* Proper spacing.
* No arbitrary vertical offsets between controls.
* Correct behavior with selected and hovered states.
* Consistent appearance across cards.
A small optical adjustment is acceptable after proper layout alignment.
This must be visually inspected, not simply assumed correct from CSS compilation.

18. PANEL CONTEXT MENUS — NO DETACHED FLOATING BOXES
The current panel ellipsis menu sometimes disappears or becomes detached when moving the pointer from the trigger into the menu.
Fix this properly.
18.1 Opening and ownership
Use the established Whiteout dropdown/menu primitives with appropriate anchored portal positioning.
Once the menu opens, it must remain open during normal interaction with its content.
Do not tie the menu's existence to the parent card's hover state.
18.2 Positioning
Handle:
* Pointer movement from trigger to menu.
* Card hover changes.
* Scroll.
* Viewport collision.
* Clipping boundaries.
* Stacking context.
* Small screens.
* Keyboard focus.
The menu must not become a disconnected floating panel when the trigger disappears or the card changes hover state.
Use proper anchor positioning and controlled open state.
18.3 Keyboard
Support arrow navigation, Escape dismissal, appropriate focus return, and reliable outside-click behavior.
18.4 Visual treatment
Keep the existing actions:
* Draw panel after.
* Replace artwork.
* Duplicate.
* Link/unlink shots.
* Delete.
Use:
* Meaningful leading icons.
* Consistent row height.
* Proper typography.
* Tight but comfortable spacing.
* Smooth selected-row highlight.
* Refined opening/closing transitions.
* Clear destructive-action color.
Do not use a new oversized generic menu style.
Reuse the accepted Whiteout system.

19. SINGLE-PANEL DELETION — EXACT M03 INTERACTION
The owner explicitly prefers the accepted M03 inline delete confirmation.
Do not open a large separate confirmation popup for every individual panel.
Reuse M03's compact checkmark/X interaction family.
The flow should be:
1. User activates Delete.
2. Contextual confirm/cancel state appears.
3. Confirm removes the panel.
4. Cancel restores the normal controls.
5. No ghost actions remain.
6. Appropriate undo/recovery is provided where supported.
Deleting a storyboard panel must not delete the linked Shot List or underlying shot record.
Whole-document deletion retains the appropriate existing document-level confirmation.

20. BULK PANEL ACTIONS — MATCH M03
The current Storyboards multi-selection toolbar visually regressed compared with the accepted Shot Lists version.
Reuse the actual M03 selected-action components.
Required hierarchy
Left:
* Selected count.
Right:
* Quiet Clear selection.
* Animated Duplicate.
* Delete selected.
Duplicate and Delete should be grouped naturally.
Clear selection should not visually dominate.
Duplicate
Use M03's accepted blue animated duplication treatment.
Do not use a generic rectangular Duplicate button.
Clear selection
Use an appropriate compact control with subtle transition and accessible name.
Do not invent an excessive animation.
Delete selected
Use established selected-item deletion semantics.
Do not add unnecessary document-level confirmation UI for ordinary selected-panel operations.
Preserve stable panel IDs, linked-shot relationships, artwork history and correct duplication semantics.
Responsiveness
Maintain control alignment and sensible wrapping on narrow screens.
Do not allow action buttons to overflow or overlap the selected count.

21. IMPORT ARTWORK — FINAL LAYOUT CORRECTIONS
The newly deployed animated upload interaction is good.
Preserve it.
Do NOT rewrite the upload engine or reintroduce old fragmented import workflows.
The remaining issues concern layout and action hierarchy.
21.1 Dropzone
Make the initial dropzone more generous.
On a roomy desktop, target approximately 1.5–2x the currently cramped usable target area, adjusted responsively.
When uploaded files accumulate, the dropzone may compact to give more room to the file list.
Do not permanently waste excessive vertical space.
21.2 Multi-file scrolling
The uploaded-file list currently extends beyond the visible dialog, preventing the user from seeing all selected files before Done.
Fix the layout.
Use:
* Fixed/sticky dialog header.
* Properly bounded content region.
* Independently scrollable file list.
* Persistent action footer.
Ensure the modal fits within the viewport.
Avoid an unbounded list that pushes the footer offscreen.
Use correct flex/grid minimum dimensions and overflow ownership.
Test 1, 5, 20, and 50 files with realistic names and thumbnail sizes.
21.3 Remove redundant Close
The modal already has an X in the top-right.
Remove the bottom Close button.
Do not leave an empty space where it used to be.
The X handles dismissal/cancellation consistently.
If closing would interrupt an active operation, use an appropriate concise confirmation only when necessary.
21.4 Improve Done
Replace the current primitive Done button styling with the established Whiteout premium primary-action treatment.
Use meaningful idle/loading/success/error feedback.
The action should not abruptly resize or jump during processing.
Do not fake success before the operation actually completes.
21.5 Real upload semantics
Preserve:
* Immediate file transfer.
* Correct progress.
* Per-file completion.
* File previews.
* Error/retry.
* Removal.
* Existing authenticated source storage.
* Existing crop/extraction capabilities.
Do not reintroduce a redundant Upload Artwork action.
Do not break imported-panel review.
21.6 Important edge cases
Test:
* Many files.
* Large filenames.
* Mixed image/PDF selection.
* Failed upload.
* Retry.
* Cancellation.
* Removing a file.
* Keyboard navigation.
* Small viewport height.
* Browser zoom.
* Done while processing.
* Reopening the dialog.

22. PRESENT MODE — PRESERVE THE SUCCESS
The owner considers the current Present mode effectively excellent.
Do not redesign Present.
Do not change its layout, artwork framing, navigation flow, fullscreen behavior, or existing successful interactions without a concrete necessary reason.
There is only one requested visual correction:
The Notes & shots action is an ordinary unattractive text rectangle.
Replace it with a compact icon-first contextual action consistent with Whiteout.
Use a meaningful notes/details icon, tooltip, animated active state, and an appropriate notes/shot information overlay or drawer.
Preserve accessible labeling.
Ensure it closes/dismisses cleanly.
Everything else should remain visually and functionally intact.

23. USER EXPERIENCE INVARIANTS
The following rules must remain true throughout implementation.
Editing and drawing
* Native drawings remain editable.
* Imported artwork remains intact.
* Brush settings affect future strokes unless an existing object is explicitly selected.
* Erasing does not destructively modify original source images.
* Shape assistance is optional and conservative.
* Stylus input works without accidentally scrolling the webpage where preventable.
* Mouse drawing remains excellent.
* Touch-drawing fallback works on browsers that do not identify a passive stylus as a pen.
Documents
* Panel UUIDs do not change because of sequence order.
* Shot UUIDs remain authoritative.
* Original labels remain separate from display names.
* Custom titles remain respected.
* Artwork revisions remain recoverable.
* Comments remain attached to appropriate panels.
* Source files remain private and durable.
Shot Lists
* One connected authoritative Shot List.
* Split never has an independently selected list.
* Permitted Split edits update the real M03 document.
* Disconnect removes only the relationship.
* No Shot List deletion through disconnection.
* No duplicate technical truth.
UI
* No duplicated inspector buttons.
* No obsolete Annotations checkbox.
* No unstable toolbar repositioning.
* No dead history button.
* No primitive reply form.
* No disappearing card menus.
* No redundant upload Close.
* No huge Split blank region.
* No generic replacement of accepted M03 components.

24. COMPLETE ACCEPTANCE MATRIX
All items must be checked through actual source/runtime evidence.
A. Drawing and input
* Brush preset has proper spacing above color swatches. 
* Eyedropper appears beside HEX. 
* Supported system-wide eyedropper works where available. 
* Safari/iPad canvas eyedropper fallback works. 
* Studio prevents accidental document scrolling while drawing. 
* Studio close restores normal document scrolling. 
* Inspector and settings remain independently scrollable. 
* Apple Pencil-compatible pointer flow is handled correctly. 
* Generic touch-reported stylus can draw in Touch Drawing mode. 
* Pressure-unaware input still produces usable marks. 
* Multi-touch navigation works. 
* Pointer cancellation does not corrupt stroke state. 
* Whole-stroke eraser works by swiping across strokes. 
* Thin strokes are erased reliably. 
* Partial circular eraser actually removes stroke segments. 
* Partial eraser size matches visual cursor. 
* Eraser operations survive undo/redo/reload. 
* Shape assistance recognizes intended lines and common shapes. 
* Low-confidence scribbles remain unchanged. 
* Shape assistance can be disabled. 
* Brush width does not retroactively change old strokes. 
B. Studio toolbar
* Exactly one meaningful inspector toggle remains. 
* Imported and native panels use stable toolbar positions. 
* Frame selector is available consistently. 
* Imported artwork frame changes are non-destructive. 
* Native artwork remains editable after frame changes. 
* Annotations checkbox is removed. 
* Historical annotations are not lost. 
* Fullscreen and navigation remain functional. 
C. Inspector
* Details / Comments / History are organized clearly. 
* Inspector has consistent typography and spacing. 
* Original label input is appropriately sized. 
* Linked shots display correctly. 
* Visual notes editor is properly sized. 
* Replace artwork is not attached to the notes field. 
* Replace artwork uses a refined contextual action. 
* Inspector scrolls independently. 
* Narrow inspector layout remains usable. 
D. Comments
* Comment threads have proper author/timestamp layout. 
* Reply opens inline. 
* Reply composer has sufficient spacing. 
* Send action is compact and polished. 
* Cancellation is intuitive. 
* Resolve/reopen work. 
* Resolved comments remain accessible. 
* Comments persist across reload. 
* Existing comment data is preserved. 
E. History
* No redundant top-level history icon remains. 
* Revision list shows actual stored history. 
* Previous revision preview works. 
* Current/previous comparison works. 
* Restore works where revision data is available. 
* Restoration preserves the later version. 
* Panel identity and links survive restoration. 
* Unsupported historical recovery is honestly represented. 
* No fake or dead Restore action exists. 
F. Creation and Shot Lists
* Global Create includes New Storyboard. 
* Existing Create animation/style is preserved. 
* Multiple storyboards can be created. 
* Linked shot supplies default panel display identity. 
* Custom panel titles take precedence. 
* Original source labels remain separate. 
* Link Shots modal footer is properly aligned. 
* Connected Shot List is the same document as M03. 
* Split has NO independent Shot List switcher. 
* Permitted edits from Split update M03. 
* Changes propagate to other connected sessions. 
* Disconnect Shot List is easy to find. 
* Disconnect does not delete actual Shot Lists/shots. 
* Disconnect preserves storyboard artwork/panels. 
* Reconnecting through the normal document connection flow works. 
* Split scrolling has no giant blank region. 
* Users can scroll to the last actual shot. 
* Split resize and selection remain stable. 
G. Gallery controls
* Grip/checkbox/ellipsis are precisely aligned. 
* Existing beautiful artwork drag remains intact. 
* Context menu remains open during pointer navigation. 
* Context menu stays anchored. 
* Context menu avoids clipping/collision. 
* Menu animations and typography match Whiteout. 
* Single-panel delete uses M03 inline checkmark/X. 
* Multi-select duplicate uses M03 blue animation. 
* Clear selection is appropriately compact. 
* Duplicate/Delete grouping matches M03. 
* Bulk action bar is responsive. 
* No stale or ghost actions remain. 
H. Import and Present
* Upload dropzone is more generous. 
* Dropzone adapts when many files exist. 
* All uploaded files remain scroll-accessible before Done. 
* Footer remains visible. 
* Redundant bottom Close removed. 
* Done uses premium animated state feedback. 
* Actual upload progress remains correct. 
* Existing extraction/crop functionality survives. 
* Present retains its successful design. 
* Notes & shots uses an appropriate icon-first control. 
* Presentation navigation/fullscreen remain intact. 
I. Preservation and release
* Existing data is preserved. 
* Existing artwork is preserved. 
* M03 has no regressions. 
* Existing M04 drawing quality is preserved. 
* Existing import animations are preserved. 
* Existing gallery dragging is preserved. 
* Source/media authorization is preserved. 
* Collaboration still persists correctly. 
* Frontend builds successfully. 
* Backend builds successfully where changed. 
* Relevant tests pass. 
* Visual captures inspect all corrected surfaces. 
* Production frontend is actually updated. 
* Production runtime is healthy. 
* No unrelated project files are changed. 
* Real unresolved limitations are disclosed. 

25. REAL USER JOURNEY TESTS
Do not validate only isolated functions.
Journey 1 — Apple Pencil-style drawing
Open Studio, draw repeatedly, alternate pen/touch navigation, access the inspector, and close Studio.
Confirm no accidental background page scrolling and normal scrolling after exit.
Journey 2 — Generic stylus
Simulate touch-reported drawing input and verify the dedicated Touch Drawing mode.
Test continuous strokes and two-finger navigation.
Clearly distinguish simulated compatibility from real hardware testing.
Journey 3 — Eraser
Draw many thin and thick strokes.
Swipe rapidly across them in Whole Stroke mode.
Switch to Partial.
Erase sections from multiple paths.
Undo/redo.
Reload.
Confirm persistence and original-media protection.
Journey 4 — Shape correction
Draw a crooked line and hold.
Draw a circle and hold.
Draw a rectangle and hold.
Verify snapping and editable geometry.
Draw an unrelated scribble and verify it is not forcibly converted.
Disable assistance and repeat.
Journey 5 — Inspector and comments
Open the inspector.
Edit visual notes.
Replace artwork safely.
Open Comments.
Reply, cancel, resolve, reopen.
Inspect History.
Preview and restore a prior revision.
Reload.
Journey 6 — Shot List ecosystem
Create a storyboard from global Create.
Connect a real existing Shot List.
Open Split.
Modify a permitted shot field.
Open the main Shot Lists application in another authorized session.
Verify the same value updates.
Disconnect the Shot List from the storyboard.
Verify the real Shot List and all its shots remain intact.
Verify the storyboard panels remain intact.
Reconnect through the standard connection flow.
Journey 7 — Split scrolling
Use a realistic Shot List with enough shots to require scrolling.
Scroll from the first to last shot.
Resize panes.
Navigate panels.
Change viewport size and browser zoom.
Confirm there is no giant blank vertical area.
Journey 8 — Gallery interactions
Hover a card.
Inspect control alignment.
Open its menu and move the pointer into it.
Scroll while menu is open.
Close menu.
Select multiple panels.
Duplicate and clear selection.
Delete a single panel and cancel.
Verify no floating orphan controls or ghost actions.
Journey 9 — Import
Open Import.
Inspect the improved dropzone.
Select many files.
Scroll through all selected files before confirming.
Remove one.
Retry a simulated failure.
Confirm Done with actual state feedback.
Verify existing source extraction and panel organization still work.
Journey 10 — Present
Enter Present.
Verify navigation, artwork framing, fullscreen and existing transitions.
Open and dismiss the revised notes/shot details control.
Confirm the rest of Present is unchanged.

26. VISUAL QA — DO NOT SKIP SECONDARY INTERFACES
Capture and inspect real integrated screenshots for:
1. Brush settings.
2. Eyedropper.
3. Eraser mode selector.
4. Eraser cursor.
5. Shape-assistance toggle.
6. Unified Studio toolbar on imported panel.
7. Unified Studio toolbar on native panel.
8. Frame selector.
9. Inspector Details.
10. Inspector Comments.
11. Inline reply composer.
12. Inspector History.
13. Revision preview/restore.
14. Global Create with New Storyboard.
15. Link Shots picker/footer.
16. Gallery with linked-shot title.
17. Hover control alignment.
18. Context menu open.
19. Context menu near viewport edge.
20. Selected-panel toolbar.
21. Single-panel inline delete confirmation.
22. Split with real content.
23. Split after scrolling.
24. Split disconnected state.
25. Import initial.
26. Import with many files.
27. Import footer/Done.
28. Present revised details control.
29. Tablet/narrow layouts.
30. Loading/error/disabled states affected by these changes.
Compare against actual existing M03 and the newly successful M04 screens.
Check spacing, typography, alignment, animation, clipping, scrolling and interaction.
Do not claim a visually correct result solely because screenshot automation completed.
Static screenshots alone cannot verify motion.
Inspect actual animations and transitions.

27. IMPLEMENTATION SEQUENCE — ONE CONTINUOUS ASSIGNMENT
Use this internal sequence.
These are not additional milestones or separate prompts.
Phase A — Source and component inspection
Map each required correction to current source and existing accepted components.
Establish exact changes needed.
Avoid broad research unrelated to the corrections.
Phase B — Studio correctness
Implement:
* Gesture ownership.
* Touch/stylus modes.
* Pointer cancellation.
* Eyedropper.
* Brush spacing.
* Eraser modes.
* Shape assistance.
* Stable toolbar.
* Frame behavior.
* Removal of obsolete annotations toggle.
Phase C — Inspector and history
Implement:
* Unified inspector entry.
* Details layout.
* Comments.
* Replies.
* Version timeline.
* Real restoration.
Preserve current data.
Phase D — Shot List ecosystem
Implement:
* New Storyboard in Create.
* Panel naming.
* Link picker alignment.
* Canonical Split editing.
* Document-level disconnect.
* Split scroll fix.
Phase E — Visual finishing
Implement:
* Hover alignment.
* Anchored card menu.
* M03 inline delete.
* M03 duplication.
* Bulk controls.
* Import layout/Done.
* Present action refinement.
Phase F — Verification
Complete all acceptance-matrix and user-journey tests.
Capture real UI evidence.
Check regressions.
Phase G — Validated release
Use the project's existing release infrastructure.
Publish the actual frontend.
Verify runtime state.
Usage interruption
If the execution environment is interrupted:
* Preserve completed source changes.
* Preserve exact progress.
* Document verified and unverified requirements.
* Identify the next precise implementation action.
* Do not restart from the beginning.
* Do not falsely report the milestone as complete.
The aim is to finish everything in this one comprehensive assignment.

28. GIT, DEPLOYMENT AND PRODUCTION SAFETY
The owner has previously authorized Codex to perform normal validated Git and release operations.
Use the current repository release process rather than asking the owner to perform unnecessary routine manual work.
Historical tooling includes:
* qa/m03/prepare.cjs
* qa/release.cjs
* RELEASING.md
Verify actual current paths and behavior.
Rules:
* No force push.
* No destructive reset.
* No discarding unrelated changes.
* No leaking secrets.
* No weakening authentication.
* No destructive production migration.
* No unapproved production test imports.
* No unrelated Scheduler/Equipment redesign.
* No unnecessary R2 reconfiguration.
* No changing accepted M03 features.
Apply only safe migrations genuinely necessary for the completed features.
Verify real backend health, not merely a successful build.
Confirm fresh frontend assets are published to the actual site repository.
A source push alone does not mean the production website updated.
Verify that unrelated site files remain unchanged.
Preserve production artwork, documents, comments and Shot List data.

29. REQUIRED FINAL REPORT
After implementation and release, provide:
1. Implementation summary
For every major issue group, explain what was changed.
2. Complete issue coverage
Report the status of all 20 screenshot issues.
Do not omit small alignment fixes.
3. Drawing improvements
Report actual eraser algorithms, stylus/touch input behavior, shape assistance and eyedropper implementations.
Distinguish physical hardware tests from simulated tests.
4. Shot List integration
Explain:
* How Split uses the actual M03 document.
* Which shot fields can be edited.
* How those edits persist.
* How real-time synchronization works.
* How disconnect behaves.
* Why no independent Split Shot List selection was introduced.
5. Visual components
Identify reused M03 components and any newly created Storyboards-specific components.
6. History
State what revisions are actually stored, previewable, restorable and protected.
Do not claim unavailable old history is recoverable.
7. QA
List exact tests and results.
Provide real integrated screenshots/recordings where produced.
8. Regression preservation
Confirm successful drawing, dragging, importing, presentation and M03 behavior remain intact.
9. Release
Provide observed source/site commit identifiers, branches, backend status and frontend publication results.
Do not invent hashes or deployment identifiers.
10. Outstanding limitations
Clearly identify any genuinely unresolved hardware or technical limitations.
Do not call M04 accepted.

30. FINAL FAILURE CONDITIONS
The implementation is incomplete if any of these remain:
* Brush preset still touches the palette.
* Eyedropper is missing or dead on Safari without a canvas fallback.
* Studio drawing causes preventable page scrolling.
* Generic touch styluses cannot use an appropriate drawing mode.
* Whole Stroke eraser still requires individual clicks.
* Partial eraser merely paints over strokes.
* Shape assistance does not actually work.
* Duplicate inspector controls remain.
* Toolbar positions jump between imported/native panels.
* Imported panels cannot use consistent frame settings.
* Obsolete Annotations checkbox remains.
* Inspector remains an ugly stack of generic forms.
* Replace artwork is cramped against Visual notes.
* Comments/replies remain primitive.
* Artwork history provides no meaningful preview/restore.
* New Storyboard is absent from Create.
* Link Shots footer remains misaligned.
* Linked panels still default to Panel # despite a usable linked-shot identity.
* Card grip remains misaligned.
* Panel action menus disappear during ordinary pointer movement.
* Single-panel deletion still uses the rejected oversized confirmation.
* Bulk duplication lacks accepted M03 animation.
* Split has phantom empty scrolling space.
* Split contains an independent Shot List switcher.
* Split changes do not persist to the actual M03 Shot List.
* Disconnecting a Shot List deletes or damages the real document.
* Import files remain inaccessible when the list grows.
* Redundant bottom Close remains.
* Done retains primitive styling.
* Present's Notes & shots remains a generic button.
* Successful existing M04 features regress.
* M03 accepted behavior regresses.
* Source is committed but the published frontend remains stale.
* Codex reports completion without verifying the integrated user experience.

31. FINAL EXPECTED RESULT
The owner should open the deployed Storyboards application and find that the new creative workflow is not only beautiful, but genuinely reliable.
Drawing should feel natural with Apple Pencil, ordinary styluses, mouse and touch-based input within the capabilities of each device.
The eraser should behave like a proper drawing application.
Shapes should straighten naturally after a deliberate hold.
Colors should be easy to sample.
The inspector should be as attractive and carefully designed as the main application.
Comments should resemble professional collaboration threads rather than basic web forms.
History should actually let users recover prior artwork.
Storyboard creation should be available from the global Create menu.
Panels should use meaningful linked-shot identities.
Split should scroll properly, show the one authoritative connected Shot List, permit appropriate direct edits to that same document, and allow easy disconnection without ever deleting production data.
Contextual controls should align perfectly and remain usable.
Import should remain beautifully animated while handling large file lists.
Present should retain everything that already makes it excellent.
All of these corrections should feel like the work of one consistent design system.
Do not ship another result where the main screen is beautiful but a secondary tab or hidden dialog contains primitive controls.

32. EXECUTE NOW
Implement the complete M04 finishing specification.
Do not begin another design brainstorm.
Do not restart or replace the working graphics architecture.
Do not create another roadmap.
Do not begin M05.
Do not ask the owner to repeat requirements already contained here.
Inspect the current repository, reuse accepted Whiteout components, implement every correction, test the full user journeys, perform exhaustive visual QA, and complete the existing validated release process.
Preserve working functionality and production data throughout.
If a genuinely unavoidable technical limitation prevents a specified behavior, implement all compatible requirements, preserve progress, document the exact blocker and evidence, and do not misrepresent the missing capability as complete.
The objective is one comprehensive, high-quality correction pass that resolves every identified issue and makes M04 ready for the owner's final inspection.
Only the owner can declare the milestone accepted.
BEGIN IMPLEMENTATION.
