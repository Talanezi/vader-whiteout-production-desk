# VADER: WHITEOUT — MILESTONE 04
# STORYBOARDS
## Definitive Product, Interface, Engineering and Release Specification

**One milestone. One complete implementation. One thoroughly verified production release.**

---

# 0. YOUR ASSIGNMENT

You are Codex, implementing M04 Storyboards for VADER: WHITEOUT.

The owner and ChatGPT have already completed the product research, brainstorming and interface planning. **The product decisions in this specification are intentional and should not be reopened.**

Your job is to implement them faithfully, using the existing Whiteout codebase, established design system, appropriate proven libraries and existing application infrastructure.

This is not a request for:
- More product brainstorming.
- A comparison of storyboard applications.
- An alternative product proposal.
- A preliminary design report.
- A collection of disconnected prototypes.
- Another M03 correction.
- A new milestone roadmap.

**Implement the specified product.**

M03 Collaborative Shot Lists has been accepted and released. Preserve it as the approved baseline.

M04 is the complete Storyboards milestone. After its successful implementation, verification, deployment and owner acceptance, the next milestone is M05 Flow of the Day.

Do not introduce M04.1, M04.2 or another chain of numbered correction milestones.

## 0.1 Product objective

Build a beautiful, professional, collaborative storyboard workspace within Production Desk.

Its purpose is to let filmmakers:

- Import artwork they have already created.
- Preserve and view original storyboard PDFs.
- Extract individual panels from existing PDF sheets.
- Correct and organize those panels.
- Create storyboards from existing Shot Lists.
- Add, replace, reorder and review images.
- Apply beautiful, precise, non-destructive annotations.
- Connect panels to actual Shot List records.
- View storyboards and technical shots together.
- Collaborate and discuss compositions.
- Preserve artwork revisions.
- Present sequences to other filmmakers.
- Export clean, professionally formatted storyboard PDFs.

The primary objective is **excellent visual-production management**, not replacing the artist's illustration software.

This should feel substantially more visual than M03 Shot Lists while maintaining the same level of interface quality, reliability and consistency.

## 0.2 Core product identity

Whiteout Storyboards is:

**A visual filmmaking workspace connected directly to the production's technical shooting plan.**

It is not:
- Photoshop.
- Procreate.
- An infinite whiteboard.
- A full animation studio.
- An AI image-generation platform.
- A second independent Shot List database.

Do not implement a complete drawing engine, full animatic editor, 3D previs system, timeline, video export or automated generative-art workflow.

**The three primary modes are Grid, Split and Present.**

The original PDF is available through View Original, not as a fourth competing editing mode.

---

# 1. EXISTING SYSTEMS — PRESERVE THEM

Production Desk:

`/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/`

Website:

`/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-site/`

Scheduler remains the authentication and production-membership authority.

Inspect the actual latest repository state and existing components before implementation. Adapt to current paths; do not assume the code has remained unchanged since an earlier milestone.

## 1.1 Existing architecture

Build within the established:

- React / TypeScript / Vite frontend.
- NestJS backend.
- PostgreSQL.
- Yjs / Hocuspocus collaboration.
- Scheduler-backed identity and authorization.
- Existing Production Desk deployment architecture.
- Existing Whiteout UI component system.

Preserve the accepted M03 implementation, particularly:

- Shot Lists and their data model.
- Scene and shot UUIDs.
- All Scenes.
- Cinematography and other presets.
- Shot inspector.
- Cross-scene planning.
- Shooting-day assignments.
- Yjs persistence.
- Import and collaboration.
- Direct spreadsheet-style PDF printing.
- Live print preview and Download.
- Role-based preferences.
- Existing deletion and restoration behavior.

Also preserve Call Sheets, Roster, the global Create interaction, Copy Link, existing notification conventions, and unrelated applications.

**Do not rebuild, refactor or redesign M03 to implement M04.**

Only add small, deliberate M04 integration points where explicitly required.

---

# 2. VISUAL DESIGN — A PRIMARY RELEASE REQUIREMENT

This is not a secondary styling exercise.

**The Storyboards interface must be visually excellent.**

The owner specifically wants something as refined as the accepted M03 Shot Lists experience, but more image-forward, immersive and visually compelling.

## 2.1 Reuse the actual Whiteout design system

Inspect and reuse existing production components for:

- Navigation and sidebar.
- Page headers.
- Serif document titles.
- Body typography.
- The established dark navy palette.
- Borders and surfaces.
- Whiteout's cyan-blue accent.
- Menus and contextual dropdowns.
- Popovers and tooltips.
- Modal overlays.
- Confirmation dialogs.
- Buttons and icon buttons.
- The global Create / Metal treatment.
- DrawCheckbox.
- Compact dots loading indicators.
- Saved / Synchronizing state.
- Collaboration avatars and full-name tooltips.
- Copy Link and success animation.
- Notifications and restore actions.
- Keyboard focus states.

Do not create an unrelated Storyboards component library.

Do not restyle already approved shared components unnecessarily.

Do not introduce default-browser-looking controls, giant forms, decorative status badges or excessive explanatory text.

## 2.2 The visual difference from Shot Lists

Shot Lists is a precise data workspace.

Storyboards should be an **image-first workspace**.

The uploaded artwork must dominate the interface.

The grid should feel like a polished professional media gallery, with:

- Clean image previews.
- Correct artwork proportions.
- Carefully considered spacing.
- Subtle boundaries.
- Smooth, restrained hover feedback.
- Clear visual hierarchy.
- Contextual controls that appear when useful.
- Legible panel names and shot references.
- Minimal permanent text beneath thumbnails.
- High-quality empty and loading states.

Use the original artwork, not generic illustration or stock-image placeholders.

Technical information should be available when requested, not permanently occupy most of each card.

## 2.3 Motion and interaction quality

Use restrained transitions consistent with Whiteout.

Aim for quick, smooth changes without making the interface feel overly animated.

Important interactions include:

- Opening a panel.
- Reordering panels.
- Selecting a card.
- Switching Grid / Split / Present.
- Opening annotation tools.
- Resizing the Split divider.
- Loading a PDF page.
- Replacing an artwork revision.
- Showing a successful save.

Use stable layouts that don't unexpectedly jump or resize.

Respect reduced-motion preferences.

Do not use oversized rotating loaders, giant glowing effects, floating tutorials or decorative animations that interfere with editing.

## 2.4 Responsive design

Primary design target: desktop and laptop.

Also support:
- Narrow laptop windows.
- Tablet viewing and annotation.
- Phone viewing, comments and simple navigation.

Do not squeeze a full two-panel editing interface into a narrow phone layout.

Use responsive drawers or tabs when appropriate.

Verify actual interaction at normal zoom and higher browser zoom levels.

## 2.5 UI acceptance principle

A successful build is not proof of successful design.

Compare M04 beside the accepted M03 interface.

They must unmistakably belong to the same software.

M04 must be more visually expressive because artwork is its primary content, without becoming cluttered or stylistically inconsistent.

---

# 3. NAVIGATION AND STORYBOARDS INDEX

Add Storyboards as a first-class Production Desk destination.

Sidebar order:

1. Call Sheets
2. Shot Lists
3. Storyboards
4. Roster

Preserve the approved sidebar dimensions, behavior and navigation system.

Use an appropriate icon consistent with the current icon family.

## 3.1 Storyboards document index

Reuse the established document-index architecture from Call Sheets and Shot Lists.

Include:

- Storyboard title.
- Small, tasteful preview thumbnail where artwork exists.
- Associated Shot List, when linked.
- Relevant scenes, where known.
- Panel count.
- Last modified.
- Document actions.

Use the existing search and sorting patterns.

Search by storyboard title.

Sort by Last modified and Title A–Z.

The full ordinary document row should open the storyboard.

The three-dot actions menu must work independently.

Actions:
- Open.
- Rename.
- Duplicate.
- Delete.

Use the existing document-level confirmation and recoverable deletion pattern.

Do not introduce extra status columns, approval dashboards or oversized document cards.

An imported original-only PDF is a valid storyboard document, even if it has zero extracted panels.

## 3.2 Creation

Extend the existing global Create system with **New Storyboard**.

Offer exactly three initial workflows:

**Import artwork**
- PDF or image files.

**From Shot List**
- Select an existing Shot List, scenes or individual shots.
- Create linked empty storyboard panels.

**Blank storyboard**
- Start without artwork or a linked Shot List.

All three lead into the same Storyboards workspace.

Do not make a Shot List compulsory.

Do not create multiple incompatible document types for these starting paths.

---

# 4. IMPORTING — SOURCE-FIRST, REVERSIBLE AND RELIABLE

Importing existing storyboard artwork is a central M04 capability.

Two real production reference files have been supplied:

- `Scene 09.pdf`
- `Scene16_Storyboard(1).pdf`

Use these as mandatory visual and functional fixtures when their bytes are available.

They represent genuinely different production formats.

### Scene 09

A multipage hand-drawn storyboard with:
- Many individual framed compositions.
- Handwritten labels such as 9.1 and 9.2.
- Colored movement arrows.
- Notes inside and outside panel boundaries.
- Irregular framing.
- Some visually complex, wider compositions.

### Scene 16

A multipage storyboard combining:
- Drawn artwork.
- Photographic references.
- Lettered panel labels.
- Handwritten choreography notes.
- Visual references that may not fit a uniform panel template.

Scene 16 is also substantially larger than Scene 09.

**Do not build a PDF importer that only works for clean, uniform rectangular layouts.**

Do not rely solely on extracting embedded JPEGs. Some source pages contain drawing content that must be rendered as part of the complete PDF page.

## 4.1 Import screen

Use a focused Whiteout import dialog or workspace.

Provide:
- Drag-and-drop file upload.
- File picker.
- PDF, PNG, JPG and WebP support.
- Clear file progress and processing feedback.
- Preview thumbnails.
- File removal before confirmation.
- Appropriate validation messages.

Support reasonable production-sized uploads, including the supplied larger Scene 16 PDF.

Do not accept a file and then fail silently during processing.

## 4.2 Source preservation

An uploaded original PDF must remain intact.

Store the original securely.

Make it available through **View Original** and **Download Original**.

The user can save a storyboard containing only the original PDF.

Panel extraction may happen immediately or later.

**Do not force extraction before saving the document.**

A failed extraction must never destroy the original document.

## 4.3 Two import modes

Provide:

**Import pages as panels**
- Each original page becomes one visual panel.

**Organize individual panels**
- Review and crop individual storyboard frames from each page.

The importer should offer appropriate defaults without forcing either mode.

## 4.4 Assisted panel detection

For Organize individual panels:

1. Render the actual PDF page faithfully using PDF.js or the existing supported PDF-rendering infrastructure.
2. Analyze a suitable raster representation for plausible framed regions.
3. Suggest crop rectangles when there is useful visual evidence.
4. Draw those rectangles over the original page.
5. Let the user adjust, remove or add regions.
6. Let the user review the extracted results and order.
7. Confirm only after the user has reviewed the proposed extraction.

Use lightweight image-processing methods appropriate to the source: line/contour detection, rectangle geometry and grouping where genuinely helpful.

Do not introduce paid AI, OCR dependencies or speculative computer-vision infrastructure.

Do not claim the system understands handwritten directions or identifies matching shots with certainty.

**Automatic detection is assistance, not authoritative interpretation.**

If detection is weak, show the complete page and let the user define crop regions manually.

A good manual workflow is preferable to confidently wrong automatic extraction.

## 4.5 Crop-region editor

The crop interface must feel polished and precise.

Requirements:
- Zoom and pan the source page.
- Create rectangular regions by dragging.
- Select existing regions.
- Move and resize regions.
- Delete a selected region.
- Undo/redo crop edits.
- Review the exact resulting crop.
- Reorder extracted panels.
- Retain handwritten captions or notes outside the main frame when deliberately included.

Regions must not unexpectedly snap to an incorrect drawing.

Some compositions contain multiple drawn elements inside one frame. Do not force those into separate panels.

Store:
- Source PDF reference.
- Page index.
- Page rotation/orientation.
- Normalized crop coordinates.
- Relevant extraction metadata.

Cropping must never mutate the original PDF.

Generated crops should be reproducible from the source.

## 4.6 Original numbering

Preserve storyboard labels separately from Shot List identifiers.

A hand-drawn panel labeled `9.2` is not automatically shot `09-B`.

A lettered panel labeled `A` is not automatically shot `09-A`.

Allow the user to enter or correct the original panel label.

Never invent a link from handwriting alone.

## 4.7 Import reliability

Support:
- Interrupted upload recovery where practical.
- Safe retries.
- Partial processing failures.
- Correct progress states.
- Idempotent confirmation.
- No duplicate panels from repeated requests.
- No loss of source files.
- Reasonable memory use for large PDFs.

Do not perform full-resolution processing continuously during every crop drag.

Use lower-resolution interactive previews, then produce high-quality derived artwork when confirmed.

---

# 5. GRID — THE DEFAULT WORKSPACE

The default Storyboards view is Grid.

It must be visually excellent and immediately understandable.

## 5.1 Page structure

**Main header**
- Back navigation.
- Storyboard title.
- Saved / Synchronizing state.
- Collaborator avatars.
- Copy Link.
- Download.

**Compact workspace toolbar**
- Scene filter.
- Search panels.
- Grid / Split / Present selector.
- Add Panel.
- Appropriate contextual actions.

Do not overload the toolbar with every possible feature.

View Original should be accessible contextually when a source PDF exists.

## 5.2 Panel cards

On normal desktop widths, aim for approximately three or four image cards per row.

Adapt gracefully to available space.

Each panel card contains:
- Artwork thumbnail, preserving its full proportions.
- Original label or concise panel number.
- Linked shot label when one exists.
- One short optional caption or visual note.
- Contextual actions.
- Dedicated drag grip.

The image should occupy the great majority of the card's visual area.

Do not force all source artwork into destructive 16:9 crops.

Use contain-style preview behavior and appropriately neutral backgrounds when aspect ratios differ.

Avoid gigantic padding or several permanent metadata lines under every image.

## 5.3 Grid interactions

Click panel → open focused viewer.

Drag using grip → reorder storyboard panels.

Click actions → Replace artwork, Duplicate, Link/Unlink shot, Delete.

Select multiple → compact bulk actions.

Drop artwork → launch import/review.

Filter scene → display relevant panels.

Change display order → optionally view Storyboard Order or Shot List Order.

**Changing the derived Shot List Order view must not rewrite the stored storyboard order.**

## 5.4 Empty states

An entirely blank storyboard should offer:

- Import artwork.
- Add panel.

Do not generate decorative statistics or unnecessary onboarding paragraphs.

An empty linked panel should show a carefully designed Add Image state, not a broken image or giant generic illustration.

## 5.5 Panel identity and ordering

Each panel has a permanent UUID.

Moving a panel changes ordering, not identity.

The original label remains associated with the panel.

Reordering storyboard panels never changes M03 scene membership or shooting order.

---

# 6. PANEL VIEWER — A PREMIUM MEDIA EXPERIENCE

Clicking a panel opens a spacious viewer.

The artwork must dominate the available space.

## 6.1 Layout

**Top**
- Back.
- Panel label.
- Previous/next context.
- Annotate.
- Artwork history.
- Relevant actions.

**Center**
- Large artwork.
- Fit-to-screen.
- Zoom.
- Pan.
- Previous/next panel navigation.

**Right contextual inspector**
- Linked shots.
- Visual notes.
- Comments.
- Artwork history.

The inspector scrolls independently from the image area.

At smaller widths, it becomes a drawer or tabbed panel rather than crushing the artwork.

## 6.2 Image interaction

Support:
- Fit image.
- Zoom in/out.
- Smooth trackpad or wheel zoom.
- Pan while zoomed.
- Keyboard panel navigation.
- Correct high-resolution viewing.
- Stable selection while switching Grid and Split.

Do not accidentally interpret a pan gesture as drawing.

Do not distort artwork.

Do not re-download full-resolution media on every minor viewer interaction.

## 6.3 Visual notes

Each panel has a simple editable Visual Notes field.

Autoscave through the established collaboration system.

Do not create duplicate editable Camera, Lens, Framing, Movement or Coverage fields inside Storyboards.

Those belong to the actual linked Shot List.

---

# 7. ANNOTATION EDITOR — PREMIUM AND NON-DESTRUCTIVE

This feature must be exceptionally well executed.

**A limited toolset with excellent interaction quality is preferable to dozens of mediocre drawing tools.**

## 7.1 Preferred implementation

Use established, compatible open-source building blocks.

Primary candidates:

- React Konva for interactive canvas rendering and shape transformations.
- Perfect Freehand for smooth, pressure-aware pen strokes.
- Existing PDF.js infrastructure for PDF page artwork.
- Existing Whiteout components for the annotation toolbar, popovers, tooltips, buttons and controls.

References:

https://konvajs.org/docs/react/index.html

https://konvajs.org/docs/react/Transformer.html

https://github.com/steveruizok/perfect-freehand

https://mozilla.github.io/pdf.js/examples/

Verify actual package compatibility and licenses before integration, then implement directly.

Do not spend a large part of M04 comparing alternative drawing frameworks.

Do not introduce an expensive SDK or a full whiteboard product.

## 7.2 Annotation mode

Click Annotate in the panel viewer.

Display a small, elegant floating toolbar.

The artwork remains central.

Use exactly these primary tools:

**Select**
- Select existing annotation objects.
- Move them.
- Resize or adjust them.
- Change relevant properties.

**Pen**
- Smooth freehand drawing.
- Rounded strokes.
- Appropriate stylus pressure support.
- Clean mouse drawing without requiring a graphics tablet.

**Arrow**
- Draw directional arrows.
- Reposition endpoints.
- Adjust stroke.
- Support a simple curved arrow when needed.

**Highlight**
- Semi-transparent strokes over artwork.

**Text**
- Add concise editable text labels.
- Move and resize appropriately.
- Preserve typed Unicode text.

**Erase**
- Remove annotation objects.
- Never erase source-image pixels.

Keep color selection and stroke thickness compact.

Provide Undo and Redo.

Do not add brush libraries, professional painting layers, filters, gradient tools, animated camera paths or dozens of shape types.

## 7.3 Interaction quality

Requirements:

- Smooth pointer movement.
- Accurate stroke rendering.
- Predictable object selection.
- Easy arrow endpoint adjustment.
- Appropriate snapping only when useful.
- Small, well-designed transform handles.
- Stable zoom/pan.
- No cursor or object jumps.
- No distorted strokes on resize.
- Proper high-DPI rendering.
- Usable mouse, trackpad, touch and supported stylus interaction.
- Visible keyboard focus.
- Reduced-motion support.

Implement local interactive stroke rendering without generating a persistent network update for every pointer sample.

Commit completed annotation objects to the collaborative document.

## 7.4 Coordinate model

Store vector annotations in the artwork's own normalized coordinate system.

Never permanently store them in transient browser-viewport coordinates.

An arrow must stay at the same location on the actual image when:
- The user zooms.
- The viewer resizes.
- The window changes.
- A tablet opens the panel.
- The image is exported.

Use a consistent transformation pipeline between source artwork, displayed view and exported output.

## 7.5 Non-destructive behavior

The original image must remain untouched.

Annotations are separate editable vector objects.

Support:
- Hide/show annotations.
- Select/edit/delete annotation objects.
- Undo/redo.
- Autosave.
- Reload.
- High-resolution export with annotations.
- Original-only export where chosen.

Never flatten annotations permanently into the only existing image.

## 7.6 Artwork revisions and annotation association

Annotations belong to the relevant artwork revision.

When a panel image is replaced:
- Preserve the previous image.
- Preserve its annotations.
- Preserve the panel UUID.
- Preserve panel comments and shot links.

The new revision may start with its own annotation layer.

If the user wants to transfer annotations from an older revision, provide an explicit option.

Do not silently transfer coordinates from an unrelated composition.

## 7.7 Collaboration

Use the established collaborative architecture for annotation objects.

Multiple authorized users should see committed changes without refreshing.

Avoid conflicts that duplicate or corrupt annotation IDs.

When two users edit different objects, both changes should survive.

If both attempt to change the same object, use a clear, deterministic synchronization policy.

Do not attempt to implement real-time collaborative brush-cursor broadcasting at every pointer sample unless existing infrastructure supports it safely and efficiently.

## 7.8 The annotation quality gate

Before completing the whole interface, demonstrate using an extracted production panel:

1. Draw a smooth pen stroke.
2. Draw an arrow.
3. Curve or reposition the arrow.
4. Add text.
5. Move a selected annotation.
6. Zoom and pan.
7. Undo and redo.
8. Save and reload.
9. Hide annotations.
10. Export annotations over the original artwork.

Inspect actual interaction recordings or equivalent visual evidence.

**Do not declare annotations complete merely because Konva renders a line.**

---

# 8. SHOT LIST INTEGRATION — THE DEFINING WHITEOUT FEATURE

**The Shot List owns technical truth. Storyboards owns visual interpretation.**

This rule is permanent.

## 8.1 Identity

Use actual M03 shot UUIDs.

Do not link using display labels as database identifiers.

A single panel can link to multiple shots.

A single shot can link to multiple panels.

Panels may remain unlinked.

A Shot List may have shots without artwork.

Never require a one-to-one relationship.

## 8.2 Link Shot picker

A panel's Linked Shots area offers:

**Link shot**

Open a compact searchable picker showing:
- Shot number.
- Scene.
- Action / coverage.
- Appropriate distinguishing context.

Search existing authorized production shots.

Support multi-link selection.

Distinguish records that share the same displayed shot label.

Do not create a new technical shot when a link is added.

Do not silently assign links based on OCR or handwritten labels.

## 8.3 Technical information

Show relevant authoritative information:

- Shot number.
- Action / coverage.
- Camera.
- Framing.
- Lens.
- Camera angle.
- Support / equipment.
- Movement.
- Relevant technical notes.

This information comes from the actual M03 data.

Do not create a second editable copy of these fields in Storyboards.

## 8.4 Bidirectional navigation

From a storyboard panel:
- Open linked shot in M03.
- Highlight the correct shot.
- Preserve the relevant scene context.

From a shot's M03 inspector:
- Show a restrained Storyboards section with linked thumbnails.
- Open the appropriate storyboard and panel.

Do not redesign the Shot Lists toolbar or Cinematography grid to expose this.

Use the approved inspector and contextual navigation style.

## 8.5 Data-change behavior

When a shot changes its technical fields, linked storyboard details update.

When a shot is renamed, links remain intact.

When a shot changes order, panel references remain intact.

When a panel changes order, M03 shooting order remains untouched.

When a shot is soft-deleted, its storyboard panels survive and indicate that the link is unavailable.

Provide Relink where appropriate.

When a storyboard is deleted, linked shots remain intact.

---

# 9. SPLIT VIEW — A REAL CONNECTED WORKSPACE

Split view is a mandatory M04 deliverable.

It must be more than two unrelated widgets displayed beside one another.

## 9.1 Layout

Use a resizable two-pane workspace.

**Left:** The actual Shot List content, based on M03's authoritative data and editing infrastructure.

**Right:** Storyboard panels corresponding to the current shot selection.

The divider is adjustable.

Remember the user's preferred split ratio as a personal view preference.

Do not store that preference in shared production document state.

## 9.2 Selection synchronization

Selecting a shot reveals linked storyboard panels.

Selecting a panel highlights its linked shot or shots.

If one shot has several panels, show all of them in the relevant order.

If one panel links to several shots, show those relationships clearly.

If a panel has no linked shot, offer Link Shot without forcing a new record.

## 9.3 Editing behavior

Where Shot List editing is supported in Split view, updates must go through the existing M03 editing and authorization model.

Do not create a separate Shot List replica that can diverge from the actual document.

Reusing a compact presentation of existing M03 grid components is acceptable.

Duplicating M03 business logic is not.

Maintain independent scroll positions where appropriate.

Do not cause linked panels to reset unnecessarily when unrelated information changes.

## 9.4 Narrow-screen behavior

At insufficient widths, replace the side-by-side arrangement with a clear Shot List / Storyboard switch or drawer.

Do not shrink both interfaces into unusable miniature panes.

---

# 10. PRESENT VIEW

Present is a clean, distraction-free way to review the visual sequence.

It is not an animatic editor.

Provide:

- Large image display.
- Previous/next navigation.
- Keyboard arrows.
- Touch navigation.
- Full-screen mode.
- Panel label.
- Optional notes.
- Optional linked shot information.
- Show/hide annotations.
- Accurate panel count.

Preserve image proportions.

Avoid unnecessary editing controls while presenting.

No timeline, audio editor, MP4 renderer, playback speed, keyframing or cinematic transitions.

---

# 11. COMMENTS AND ARTWORK HISTORY

## 11.1 Comments

Support lightweight panel-specific comments:

- Add comment.
- Reply.
- Resolve.
- View resolved discussion.
- Author name.
- Date/time.

Use existing authenticated identity information.

Show comments contextually in the panel viewer.

Do not create:
- Formal approval stages.
- Status dashboards.
- Compulsory sign-offs.
- A new notification bureaucracy.
- Image-coordinate comment pins.

## 11.2 Artwork revisions

Replacing artwork creates a new version.

Each revision includes:
- Asset reference.
- Uploader.
- Creation date/time.
- Revision order.
- Associated annotation data.

Allow viewing an older revision and restoring it as active.

Restoration must preserve panel identity, comments, notes and shot links.

Avoid deleting an asset still referenced by another valid revision.

---

# 12. DATA MODEL AND PERSISTENCE

Implement a clean, maintainable model that extends the existing architecture.

## 12.1 Core entities

**Storyboard**
- UUID.
- Production.
- Title.
- Optional originating Shot List.
- Creator.
- Created/updated timestamps.
- Recoverable deletion metadata.

**Panel**
- UUID.
- Storyboard reference.
- Optional original label.
- Optional source page/crop.
- Associated artwork revisions.
- Appropriate ordering reference.

**Panel–Shot Link**
- Panel UUID.
- Source Shot List UUID.
- Shot UUID.
- Link position when needed.

**Media Asset**
- UUID.
- Private storage key.
- MIME type.
- Dimensions when applicable.
- Byte size.
- Source metadata.
- Processing state.

**Artwork Revision**
- Panel UUID.
- Asset/source reference.
- Revision metadata.
- Uploader.
- Creation time.
- Annotation association.

**Comment**
- UUID.
- Panel reference.
- Author.
- Parent/reply reference.
- Content.
- Resolved state.
- Timestamps.

**Annotations**
- Permanent object IDs.
- Object type.
- Geometry.
- Style.
- Relevant text/stroke data.
- Artwork revision reference.

Use current project conventions for schemas, migrations, controllers and services.

## 12.2 Ownership of data

Use PostgreSQL for durable document, panel, asset, revision, linking and comment metadata where appropriate.

Use Yjs/Hocuspocus for collaborative editing concerns such as panel order, visual notes, annotation-object changes and presence, consistent with existing implementation patterns.

Avoid two independently editable authoritative copies of the same field.

Choose a clear owner for each value and enforce that boundary.

Binary PDFs and images must remain outside Yjs.

Implement idempotent creation and processing so retries or reconnects don't duplicate panels and assets.

## 12.3 Private durable media storage

First inspect the existing system for appropriate durable private object storage.

Reuse it if suitable.

Otherwise implement a small provider-independent S3-compatible storage adapter, with a supported service such as Cloudflare R2 as a reasonable deployment target.

Do not build an entire media-management platform.

Do not use temporary Railway application storage as the permanent image repository.

Do not store production images as Base64 in Yjs or ordinary PostgreSQL text fields.

Use:
- Private objects.
- Authorized upload/download operations.
- Short-lived access where appropriate.
- Server-side MIME/size validation.
- Safe file handling.
- Optimized thumbnails.
- Original retention.
- Appropriate cache policy.

Presigned URLs are bearer credentials; limit their permissions and lifetime appropriately.

Never expose bucket credentials to the frontend.

If production storage credentials are genuinely unavailable, implement and test the storage integration with a local S3-compatible fixture and identify the exact deployment blocker. Do not silently replace private storage with public URLs or temporary local files.

## 12.4 Performance

Optimize for realistic projects first.

A storyboard with dozens of panels should feel fluid.

Use:
- Lazy image loading.
- Thumbnail variants.
- Appropriate image caching.
- Deferred full-resolution loading.
- Controlled PDF processing memory.
- Proper cancellation and cleanup.
- Efficient collaboration updates.

Test a larger project as a reliability regression, not as the main visual-design benchmark.

## 12.5 Authentication

Reuse verified Scheduler-backed production membership and roles.

Do not introduce hardcoded user allowlists.

Do not expose artwork across productions.

Do not assume a media URL is authorized solely because someone knows an asset UUID.

Every relevant operation must enforce production access, including:
- Original download.
- Thumbnails.
- Crops.
- Artwork revisions.
- Panel links.
- Comments.
- PDF exports.

---

# 13. EXPORT — A PROFESSIONAL PDF EXPERIENCE

Support two separate actions.

## 13.1 Download Original

When a storyboard contains a source PDF, allow downloading it unchanged.

No re-rendering or modification.

## 13.2 Export Storyboard

Generate an organized storyboard PDF.

Use the accepted M03 print-experience principles:

**Open Download → See actual preview → Change options → Preview updates → Download PDF once.**

Do not require separate Generate and Refresh buttons.

## 13.3 Export controls

Support:

**Content**
- Entire storyboard.
- Selected scenes.
- Selected panels.

**Layout**
- One panel per page.
- Two panels per page.
- Four panels per page.
- Six panels per page.

**Paper**
- US Letter.
- A4.
- Portrait.
- Landscape.

**Options**
- Show/hide notes.
- Show/hide linked shot information.
- Show/hide annotations.
- Preserve complete artwork by default.

The actual generated PDF should appear in the preview.

Downloaded bytes must match the current preview.

Do not generate a low-resolution screenshot of the Grid.

Use appropriately detailed source artwork and the correctly transformed annotation layers.

No clipping, distorted imagery, missing labels or technical data invented from the artwork.

Do not change the existing M03 PDF renderer to implement this.

---

# 14. IMPLEMENTATION SEQUENCE — ONE MILESTONE, INTERNAL QUALITY GATES

This order is deliberate.

Do not build the whole interface around an unproven media or annotation foundation.

These are internal work packages, **not separate public milestones and not separate prompts**.

## Stage A — Baseline and foundations

Inspect current M03 architecture, UI primitives, authentication and persistence.

Choose the existing appropriate storage service or implement the durable private storage adapter.

Define authoritative entity ownership and shot-link contracts.

Preserve unrelated work.

## Stage B — Two difficult proofs

**Proof 1: Real PDF import**

Using both supplied production PDFs:
- Render all original pages.
- Preserve originals.
- Propose crop regions.
- Adjust regions manually.
- Extract correct panels.
- Preserve handwritten context.
- Maintain source-page references.

**Proof 2: Annotation quality**

Using a real extracted panel:
- Smooth pen.
- Editable arrow.
- Text.
- Selection.
- Zoom/pan.
- Undo/redo.
- Save/reload.
- High-resolution export.

Inspect the results visually.

Resolve fundamental defects before integrating the remaining UI.

Do not stop after the proofs and claim M04 is complete.

## Stage C — Core Storyboards application

Implement:
- Sidebar navigation.
- Storyboards index.
- Creation flows.
- Original document viewer.
- Import review.
- Grid.
- Panel viewer.
- Media handling.
- Panel management.

Use the approved design system.

## Stage D — Shot List integration

Implement:
- Stable many-to-many UUID links.
- Searchable shot picker.
- Bidirectional navigation.
- M03 inspector thumbnails.
- Split view.
- Selection synchronization.

Test against real existing Shot List behavior without modifying production records.

## Stage E — Collaborative production capabilities

Implement:
- Collaborative notes and panel order.
- Annotation synchronization.
- Comments.
- Artwork revisions.
- Present.
- Organized PDF export.

## Stage F — Full acceptance and visual QA

Test the actual journeys below.

Inspect screenshots, rendered PDFs, interactions and failure states.

Correct issues before release.

## Stage G — Release

Build, commit, deploy and verify the final integrated application.

Do not publish an unfinished proof of concept as the completed M04 release.

---

# 15. MANDATORY PRODUCT ACCEPTANCE

The following are release requirements, not optional test suggestions.

## 15.1 Real source import

**Scene 09**

- Original three-page PDF preserved.
- Complete original pages view correctly.
- Detection suggestions are reviewable.
- Irregular frames can be cropped manually.
- Handwritten annotations can be included in panel crops.
- Panel labels can be entered or corrected.
- Resulting panels appear in the correct reviewed sequence.

**Scene 16**

- Original mixed-media PDF preserved.
- Photographs, drawings and handwritten notes render faithfully.
- Large file processing succeeds without crashes.
- Crop selection works even when photographs and hand-drawn elements are mixed.
- Derived panels retain the intended visual information.

Do not assert a fixed number of detected panels if the source geometry doesn't support that number confidently.

Review the actual output visually.

## 15.2 Creating documents

- Import artwork creates a working storyboard.
- From Shot List creates linked placeholders.
- Blank creation works independently.
- Rename, duplicate and recoverable Delete work.
- Entire-row document navigation works.
- Search and sorting work.

## 15.3 Grid

- Artwork appears promptly.
- Different aspect ratios display without distortion.
- Panels can be reordered.
- Empty panels can receive artwork.
- Selection and contextual actions work.
- Grid order persists.
- Panel identity remains stable.

## 15.4 Panel viewer

- Full-resolution viewing works.
- Zoom/pan feel smooth.
- Viewer navigation works.
- Notes save correctly.
- Inspector sections remain usable.
- Narrow-screen layout behaves correctly.

## 15.5 Annotation

- Pen is visibly smooth.
- Arrows can be edited after drawing.
- Highlight and text work.
- Annotations remain aligned under zoom and resize.
- Undo/redo work.
- Save/reload preserves objects.
- Two collaborators don't silently lose independent changes.
- Original image remains untouched.
- Previous artwork revisions retain their annotations.
- Export includes/excludes annotations correctly.

## 15.6 Shot List integration

- Link one panel to one shot.
- Link one panel to several shots.
- Link several panels to one shot.
- Keep panels unlinked where intended.
- Duplicate displayed shot labels remain distinguishable.
- Renaming shots preserves links.
- Shot List changes appear in linked panel details.
- Selecting a shot reveals its relevant artwork.
- Selecting a panel highlights the correct shots.
- Reordering panels does not change shooting order.
- Unlinking does not delete panel content.
- Soft-deleted shots do not delete artwork.

## 15.7 Collaboration

- Two authorized users open the same storyboard.
- Edits synchronize.
- Presence updates.
- Notes persist.
- Panel order persists.
- Uploads remain available after reload.
- Reconnection doesn't create duplicate panels.
- Concurrent edits preserve unrelated work.
- Unauthorized production access fails.

## 15.8 Present

- Correct image sequence.
- Next/previous navigation.
- Full-screen operation.
- Annotation visibility toggle.
- Optional notes and shot information.
- No unnecessary editor clutter.

## 15.9 Export

- Original PDF downloads unchanged.
- Organized layouts render correctly.
- Selected panels and scenes export correctly.
- Notes and linked shot labels follow settings.
- Artwork proportions remain intact.
- High-resolution annotation overlay is correct.
- Preview and download match.
- No clipping or blank surprise pages.

## 15.10 Regression

Verify that M04 does not change or damage:

- M03 Shot Lists.
- Shot UUIDs and scene membership.
- M03 PDF printing.
- M03 collaboration.
- Shooting-day assignments.
- Call Sheets.
- Roster.
- Scheduler authentication.
- Existing global Create behavior.
- Unrelated production applications.

---

# 16. VISUAL QA — REQUIRED BEFORE DEPLOYMENT

Do not treat visual quality as complete because automated tests pass.

Capture and inspect the actual UI at realistic desktop and narrower sizes.

Required views:

1. Storyboards index.
2. Import dialog.
3. Original Scene 09 PDF viewer.
4. Scene 09 crop editor.
5. Scene 16 crop editor.
6. Extracted panel review.
7. Populated Grid.
8. Empty Grid.
9. Panel viewer.
10. Annotation mode.
11. Selected annotation and transform handles.
12. Split view.
13. Link Shot picker.
14. Comments.
15. Artwork revisions.
16. Present mode.
17. Live PDF export.
18. Responsive tablet/narrow view.
19. Shared M03 Shot Lists after integration.
20. Existing Create/Copy Link components, unchanged.

Compare against the accepted Whiteout visual system.

Reject:
- Giant forms.
- Excessively spacious cards.
- Generic filler text.
- Inconsistent button sizes.
- Clipped artwork.
- Low-resolution thumbnails.
- Unnecessary status badges.
- Default-looking browser controls.
- Unresponsive canvas actions.
- Awkward modal heights.
- Overlapping toolbars.
- Broken scroll behavior.
- Visually inconsistent menus.
- Large empty areas without purpose.

Use real storyboard imagery from the authorized fixtures, not decorative generated artwork.

Correct observable defects before release.

---

# 17. EFFICIENCY AND EXECUTION DISCIPLINE

The owner has already experienced excessive Codex usage and repeated milestone corrections.

Be efficient without compromising quality.

Do not:
- Repeat our product research.
- Reconsider the three working views.
- Build a new design system.
- Reimplement M03.
- Install a full drawing suite.
- Spend excessive time benchmarking unrelated libraries.
- Generate enormous progress documents during development.
- Run unrelated stress tests after every small CSS change.
- Introduce optional features outside this specification.

Instead:
- Reuse proven components.
- Resolve technical risks early.
- Use focused realistic fixtures.
- Run targeted tests while developing.
- Execute one integrated regression before release.
- Perform visual review of actual workflows.
- Correct real defects at their source.

Use one coherent implementation cycle.

If execution context or tool limits interrupt the work, preserve an accurate checkpoint and continue from the existing state. Do not repeat completed research or recreate functioning code.

Only ask the owner for input when a genuinely non-resolvable external requirement exists, such as missing private storage credentials. Do not request approval for ordinary code, Git or design decisions already covered here.

---

# 18. AUTONOMOUS DEPLOYMENT

The owner authorizes normal implementation, Git changes, builds, commits, pushes and deployment.

Preserve existing source and production content.

Do not force-push.

Do not erase production documents.

Do not import the supplied reference PDFs into live production as test data without explicit authorization.

Do not create destructive production test records.

Do not expose secrets.

Do not weaken Scheduler-backed authentication.

Do not run destructive migrations.

## 18.1 Backend

Implement safe additive schema and service changes.

Deploy through the established Railway process.

Verify health and authorized media access.

## 18.2 Frontend

Build a fresh Production Desk frontend.

Use the existing:

`/productiondesk/`

base path and current production API/WSS configuration.

Publish the fresh bundle through:

`vader-whiteout-site/productiondesk/`

Preserve all unrelated website files and applications.

Do not publish stale build artifacts.

## 18.3 Deployment verification

Confirm:
- Railway deployment healthy.
- GitHub Pages deployment successful.
- Correct new frontend assets published.
- Storyboards navigation loads.
- Authenticated owner session works.
- Import and media access work through the production configuration.
- Existing Shot Lists continue working.
- No unintended production data modifications.

Use authorized read-only checks on existing production data. Keep destructive workflow testing in disposable fixtures.

---

# 19. FINAL REPORT

Provide one clear, factual completion report.

Include:

**Product**
- Storyboards index and creation.
- Import and source preservation.
- Assisted extraction and crop editor.
- Grid, Split and Present.
- Panel viewer and annotations.
- Shot List linking.
- Comments and revisions.
- PDF export.

**Engineering**
- Relevant architecture and dependencies.
- Media storage solution.
- Collaboration and persistence model.
- Security and authorization.
- Data migrations.
- Important technical decisions.

**Verification**
- Actual Scene 09 import results.
- Actual Scene 16 import results.
- Annotation quality demonstration.
- Bidirectional Shot List integration.
- Collaboration and reconnection.
- Browser and visual QA.
- Regression tests.
- Any genuine limitations.

**Deployment**
- Production Desk source commit.
- Website commit.
- Railway deployment status.
- GitHub Pages status.
- Live URL.

Do not claim a feature works if it hasn't been exercised.

Do not substitute the number of files changed or tests executed for actual product quality.

Do not label M04 as owner-approved on the owner's behalf.

---

# 20. FINAL DEFINITION OF DONE

A Director opens Whiteout and sees Storyboards alongside Call Sheets, Shot Lists and Roster.

They create a storyboard by uploading an existing production PDF.

The original document remains completely preserved.

Whiteout displays its pages, assists with identifying individual storyboard frames and lets the user correct crop boundaries elegantly.

The extracted artwork becomes a beautiful visual Grid with clear labels and reliable ordering.

The Director opens a panel, zooms into the composition and draws a smooth movement arrow with professional interaction quality.

They can reposition the arrow, add text, undo changes and hide annotations without affecting the original artwork.

Their changes save reliably.

Another authorized collaborator can review the same work and leave a comment.

The DP opens Split view and sees the real Shot List beside its linked storyboard panels.

Technical information comes from M03, not a duplicate database.

The Director replaces a drawing without losing the previous version or the panel's comments and shot relationships.

The team opens Present mode and reviews the sequence visually.

They can download the untouched original PDF or export a clean, beautifully formatted new storyboard PDF.

Existing Shot Lists, Call Sheets, production data and authentication remain intact.

The entire experience looks and feels like a premium part of Whiteout—not an unrelated drawing demo or a basic file gallery.

**These results, not just successful compilation, define M04 implementation completion.**

After implementation, testing and verified deployment, present the completed M04 release for the owner's final acceptance.

**Do not begin M05 until the owner accepts M04.**

## EXECUTE

Implement the complete M04 Storyboards milestone using this specification.

Do not return with another product plan.

Do not stop at a prototype.

Do not invent unrelated features.

**Build the product, make it visually excellent, verify the actual filmmaking workflows, preserve M03, deploy the finished release, and report the result.**