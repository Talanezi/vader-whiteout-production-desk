# VADER: WHITEOUT — Milestone 02 review

Completed locally on `ui/m02-production-desk-foundation`.
[Local Production Desk preview](http://127.0.0.1:5174/productiondesk/).
All saved visual evidence uses isolated QA fixtures, not saved production data.
The ordinary application continues to use its existing authenticated API.

## A. Implementation

The oversized website navigation is replaced with a 232px persistent workspace
sidebar, a stable 66px icon mode, and a compact context bar. At smaller widths,
navigation becomes a native modal drawer without shifting the page. Only real
Call Sheets, Roster, New Call Sheet and Apps destinations are shown. No fictional
account information or future modules were introduced. Collapse state survives
ordinary route changes and reloads.

Call sheets now occupy one searchable, status-filterable, sortable document
list with original open/edit, duplicate, PDF and confirmed-delete actions.
Distribution counts/details remain accessible. Loading, session, API error,
empty and no-results states are distinct. Counts derive from actual responses;
no updated-date column was invented where the API has no such field.

The roster is a directory with search, category filtering, contact links,
confirmed active-state switches and contextual actions. Add/edit opens a focused
side drawer with all original fields. Saving uses the returned record, and
failed saves retain the form. Unsaved edits have explicit close/Escape/backdrop
confirmation and browser-Back protection. A pending import also guards navigation.
Paste import has a parsed preview, progress, honest partial results and retained
unconfirmed rows. It still uses individual existing create requests. No CSV or
atomic-import guarantee is claimed.

The six existing template payloads and creation routes remain intact in a
matching entry screen. The existing editor itself was not redesigned. A small
scoped bridge constrains its implicit grid track and mobile header so fixed-size
PDF/email previews scroll locally instead of widening the page.

The existing hash paths are identical. React Router's existing package now uses
`createHashRouter`/`RouterProvider` in place of the declarative `HashRouter`, so
`useBlocker` can protect roster drafts and imports. No authentication, token
storage, API, model, server or deployment contract changed.

## B. Visual system

Tokens are scoped to `.pd-app` and portalled `.pd-ui` surfaces. `App.css` remains
byte-identical, and the legacy editor retains its original operational typography.

| Token | Value / role |
|---|---|
| `--pd-bg` | `#080b12` |
| `--pd-surface` | `#10151e` |
| `--pd-text` | `#f2f1ee` |
| `--pd-muted` | `#a9b4c3` |
| `--pd-rule` | `#293746` |
| `--pd-accent`, `--pd-focus` | `#87d8ff` |
| `--pd-edge`, `--pd-mid`, `--pd-low` | `#91a8bd`, `#53697f`, `#263546` |
| `--pd-hover`, `--pd-input`, `--pd-selection` | `#171f2b`, `#0c111a`, `#132633` |
| `--pd-danger`, `--pd-success` | `#f3aaa8`, `#b2d3c1` |
| Geometry / timing | 6px control radius; 180ms controls; 230ms drawer entry |

Crimson Text is reserved for the brand and page/dialog headings. Inter carries
operational text. New primitives include buttons/icon buttons, a fixed-width
async action treatment, origin-aware menus, native modal drawers/dialogs,
search, status indicators, loading rows, errors, session/empty states and toasts.
Menus support first-open focus, arrows, Home/End, typeahead, Escape, Tab,
outside dismissal, selected cues, viewport collision handling and focus return.
Native dialogs supply focus containment and an inert background. Motion is
removed under `prefers-reduced-motion`. No permanent processing effects run.

## C. Concrete research integration

All runtime component code was independently implemented in-project. No external
component package or proprietary source was imported. Public source for EasyUI
and Glisse was inspected, including dependency requirements, before implementation.

1. [Bencho Collapsing Sidebar](https://bencho.dev/blocks/collapsing-sidebar): the
   icon column remains fixed while words fade and the panel narrows; the active
   item keeps a precise rail and restrained surface. Used in `AppShell`.
2. [EasyUI OriginDropdown](https://easyui.site/components/origin-dropdown):
   trigger-edge transform origin, a small scale/translation and a connected
   selected-value trigger. Used by status/sort/category controls and row menus,
   with independently added collision handling and keyboard semantics.
3. [EasyUI Morphing Button](https://easyui.site/components/morphing-button):
   layout-stable idle→pending→saved/error treatment. Used in person saving and
   roster import. Success is set only after API confirmation.
4. [Glisse Menu](https://github.com/0kzh/glisse/blob/main/src/menu.tsx): compact
   overlay presentation with a finely edged, slightly translucent menu surface.
   This informed the small menu plate; tables and main work surfaces stay opaque.
   Glisse's segmented-control implementation was also reviewed; no unnecessary
   segmented widget or liquid-glass runtime was added.
5. [Libraries.dev Beam](https://libraries.dev/beam) and
   [accessibility guidance](https://libraries.dev/accessibility): a restrained
   moving trace appears only on an actually pending action, with textual status
   and reduced-motion support. This is CSS inspiration, not the Beam package.
   Metal was reviewed and its WebGL effect omitted from the dense workspace.

Bencho Dropdown, Command Bar, Selection Actions, Toast Stack, Inline Confirm and
Loading State were reviewed as public interaction references. Destructive actions
use an independent app confirmation dialog rather than copying Pro code. RareUI
was reviewed as a secondary reference; no unrelated duration picker was added.
Amicro was inaccessible behind a verification/403 response, and is not claimed
as an incorporated source. Hairline was not added to dense operational screens;
the approved local M01 palette/typography remain the authoritative brand source.

## D. Files changed

Only Production Desk frontend, QA and review files changed. Backend files,
`lib/api.ts`, data models, `CallSheetEditorPage.tsx`, `EditorSidebar.tsx`,
`App.css`, package files, Vite configuration and tracked compiled bundles were
verified unchanged against HEAD. Other projects were read-only. The existing
site `.DS_Store` remains untouched.

- [client/index.html](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/index.html)
- [client/src/App.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/App.tsx)
- [client/src/components/AppShell.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/components/AppShell.tsx)
- [client/src/main.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/main.tsx)
- [client/src/pages/CallSheetNewPage.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/pages/CallSheetNewPage.tsx)
- [client/src/pages/DashboardPage.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/pages/DashboardPage.tsx)
- [client/src/pages/RosterPage.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/pages/RosterPage.tsx)
- [client/qa/m02/README.md](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/README.md)
- [client/qa/m02/fixtures.cjs](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/fixtures.cjs)
- [client/qa/m02/parser.test.cjs](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/parser.test.cjs)
- [client/qa/m02/verify.cjs](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/verify.cjs)
- [client/src/components/whiteout/Button.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/components/whiteout/Button.tsx)
- [client/src/components/whiteout/Feedback.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/components/whiteout/Feedback.tsx)
- [client/src/components/whiteout/Icon.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/components/whiteout/Icon.tsx)
- [client/src/components/whiteout/Menu.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/components/whiteout/Menu.tsx)
- [client/src/components/whiteout/Overlay.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/components/whiteout/Overlay.tsx)
- [client/src/components/whiteout/Workspace.tsx](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/components/whiteout/Workspace.tsx)
- [client/src/lib/rosterImport.ts](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/lib/rosterImport.ts)
- [client/src/styles/whiteout.css](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/src/styles/whiteout.css)

This report is `M02-REVIEW.md`. All screenshot/result artifacts are listed in
[the complete artifact manifest](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/ARTIFACTS.md).

## E. Visual evidence

The final screenshots were visually inspected. All data below is fictitious QA
fixture data, and all mutations were intercepted inside isolated browser contexts.

- [Desktop call sheets](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/01-dashboard.png)
- [Status filter](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/02-status-menu.png)
- [Document actions](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/03-document-menu.png)
- [Desktop roster](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/04-roster.png)
- [Category filter](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/05-category-menu.png)
- [Person drawer](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/06-person-drawer.png)
- [Destructive confirmation](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/07-delete-confirmation.png)
- [Saving](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/08-saving.png)
- [Saved](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/09-saved.png)
- [Partial import](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/10-partial-import.png)
- [Template entry](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/11-new-call-sheet.png)
- [Mobile dashboard](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/mobile-dashboard-390.png)
- [Mobile roster](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/mobile-roster-390.png)
- [Mobile person editor](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/mobile-person-editor-390.png)
- [Existing editor](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/12-editor-regression-top.png)
- [Existing editor on mobile](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/13-mobile-legacy-editor-top.png)
- [200% zoom / nested menu](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/zoom-200-drawer-menu.png)

## F. Verification

- Existing npm build script passed: `tsc -b` and Vite production build, with the
  documented temporary Mac dependency workaround and output outside tracked bundles.
  Final output: 368.05 KB JavaScript / 110.21 KB gzip; 56.55 KB CSS / 11.44 KB gzip.
- Three parser unit tests passed: original delimiters, blank/name-less lines,
  aliases, unknown categories, optional fields and explicit quoted-CSV limitation.
- Full final Chrome run: **21 browser scenario groups passed**. Evidence is in
  [verification.json](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/artifacts/verification.json).
- Dashboard search, all stored statuses, sorting, details, duplicate, download,
  confirmation cancellation, delete failure/retry and focus return passed.
- Roster create/edit returned records, save failure preservation, genuine pending
  and saved states, fixed button width, active switch failure/retry, deletion,
  parsed preview, partial import and retry passed.
- Distinct signed-out, expired-token, API-error/retry, empty, no-results and slow
  loading states passed. Signed-out rendering issued no API requests.
- Dashboard, roster, person drawer and mobile navigation passed at 1440×900,
  1280×800, 1024×768, 768×1024, 390×844 and 360×800 without page overflow.
- Native 200% Chrome zoom passed, including the collision-aware category menu
  within the person drawer. Long names/emails, missing details, reduced motion
  and touch emulation passed.
- Keyboard focus, first-open menu focus, menu navigation/Escape, drawer/dialog
  containment/return, unsaved close confirmation, browser Back protection and
  scroll restoration passed.
- All six original template payloads created an editor route. Existing editor
  fields, section navigation, manual save, PDF interaction, distribution controls,
  mobile layout and route back to the list passed. No email operation ran.
- No uncaught browser errors. `git diff --check` passed.

The pre-existing checked-in `node_modules` lacks the Mac ARM Rollup binary.
The baseline ordinary build failed before editing. Exact locked dependencies
were installed in `/tmp`, without changing package files or tracked dependencies.
[QA instructions](/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk/client/qa/m02/README.md) contain the build and preview commands.
A clean platform-appropriate dependency install is still required to use ordinary
npm commands without that workaround. This is a checkout/runtime limitation.

## G. Git

Branch: `ui/m02-production-desk-foundation`.
HEAD remains `13ef5c58` (Polish email distribution workflow).
Changes are local and unstaged. No commit, push, merge or deployment occurred.
No other application source, hosted frontend bundles, Railway settings,
authentication infrastructure, database, PDF pipeline or email pipeline changed.

## H. Remaining limits

No known incomplete M02 feature after the final checks. Browser verification
used Chrome, with touch emulation and isolated API fixtures. Live authenticated
backend behavior, server-generated PDF rendering, real email delivery, physical
touch hardware, Safari/Firefox and screen-reader audio were not exercised.
The existing API/PDF/mail contracts were preserved. M03–M06 were not implemented.
