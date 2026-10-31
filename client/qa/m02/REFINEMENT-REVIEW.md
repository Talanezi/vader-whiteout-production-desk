# M02 final visual refinement

This refines the completed M02 implementation. M03 was not started.

## Changes

- Removed the dashboard and creation subtitles, roster subtitle, redundant
  drawer descriptions, generic empty-state instructions and duplicate current
  page breadcrumbs. Validation, import guidance, consequential-action text,
  template distinctions and substantive call-sheet content remain.
- Replaced the plain W with an original inline SVG folio: three offset document
  layers, an open diagonal negative-space gutter, fine technical creases and
  navy/ice-blue edges. The same accessible brand link and emblem are used in
  expanded and collapsed navigation; the mobile brand uses it too. No dependency
  was added, and the Whiteout identity in other applications was not changed.
- Brand hover/keyboard focus separates the layers subtly; pointer exit returns
  them to rest. Reduced motion retains resting geometry and a static highlight.
- Preserved sidebar widths and the fixed icon column. Active rails/surfaces,
  hover/focus icon feedback, label timing and the rotating collapse control now
  share restrained transitions. Removed the desktop context bar and duplicate
  sidebar creation shortcut; the dashboard retains its primary creation action.
  Mobile navigation retains its useful creation destination.
- Signed-out pages show one heading and one Sign in action. The existing
  Scheduler login URL, return destination, token mechanism and API are unchanged.
- Extracted the existing Node-only QA interceptor into `browser-harness.cjs` and
  reused it in `verify.cjs`, `refinement.cjs` and the visible `preview.cjs` launcher.
  No fixture code is imported by the frontend or present in the built bundle.

## Interactive review

With the local Vite server running, execute from the Production Desk repository:

```sh
node client/qa/m02/preview.cjs
```

This opens a clean visible Chrome window populated with fixtures, without a real
login. Dashboard, roster, dropdowns, person drawers, creation and editor flows are
interactive. API changes live only in memory and survive reload within that
window; restarting resets them. Email is disabled. Other external requests are
blocked except Google font GETs. The injected LOCAL FIXTURES badge identifies the
window. Close Chrome or use Ctrl+C to stop. An ordinary browser continues to
require real authentication. See [README.md](README.md) for the server command,
Playwright resolution and the existing local dependency workaround.

## Screenshots

All final screenshots are in [artifacts/refinement](artifacts/refinement/).

| Surface | Screenshot |
|---|---|
| Expanded dashboard | [01-expanded-dashboard.png](artifacts/refinement/01-expanded-dashboard.png) |
| Emblem at actual 28px and 48px | [02-emblem-actual-sizes.png](artifacts/refinement/02-emblem-actual-sizes.png) |
| Layer separation on hover | [03-emblem-hover.png](artifacts/refinement/03-emblem-hover.png) |
| Keyboard focus | [04-brand-keyboard-focus.png](artifacts/refinement/04-brand-keyboard-focus.png) |
| Navigation hover and active rail | [05-navigation-hover.png](artifacts/refinement/05-navigation-hover.png) |
| Collapsed sidebar | [06-collapsed-dashboard.png](artifacts/refinement/06-collapsed-dashboard.png) |
| Roster | [07-roster.png](artifacts/refinement/07-roster.png) |
| Open category dropdown | [08-roster-category-menu.png](artifacts/refinement/08-roster-category-menu.png) |
| Add person | [09-add-person.png](artifacts/refinement/09-add-person.png) |
| Edit person | [10-edit-person.png](artifacts/refinement/10-edit-person.png) |
| New call sheet | [11-new-call-sheet.png](artifacts/refinement/11-new-call-sheet.png) |
| Signed out | [12-signed-out.png](artifacts/refinement/12-signed-out.png) |
| Mobile dashboard | [390px](artifacts/refinement/13-mobile-dashboard-390.png), [360px](artifacts/refinement/13-mobile-dashboard-360.png) |
| Mobile navigation | [390px](artifacts/refinement/14-mobile-navigation-390.png), [360px](artifacts/refinement/14-mobile-navigation-360.png) |
| Mobile roster | [390px](artifacts/refinement/15-mobile-roster-390.png), [360px](artifacts/refinement/15-mobile-roster-360.png) |
| Visible interactive preview | [16-interactive-preview.png](artifacts/refinement/16-interactive-preview.png) |

Rendered SVG silhouette/linework and typography were inspected at actual sizes,
including expanded/collapsed desktop, focus, dropdowns, person form, creation,
signed-out and mobile surfaces.

## Verification and limits

- Production build passed (`tsc -b` and Vite), with no warnings. Output was kept
  under `/tmp/whiteout-m02-research/refinement-dist`; published bundles were not
  changed. The existing checkout lacks the Mac ARM Rollup binary, so the same
  temporary exact-lockfile runtime documented in README was used. The tracked
  TypeScript cache was restored to its starting contents.
- All [21 original M02 regression groups](artifacts/refinement/regression/verification.json)
  passed: CRUD, import partial failures/retry, unsaved guards, template payloads,
  legacy editor routes/save/download/distribution, keyboard/focus, touch, six
  responsive sizes, 200% native zoom, reduced motion and distinct error states.
- [Focused refinement checks](artifacts/refinement/refinement-verification.json)
  passed: concise copy, 28/48px emblem, hover/focus/settling, stable icon position,
  66px collapsed width, routes, single desktop creation action, unchanged sign-in
  redirect, mobile and reduced-motion geometry.
- After the last CSS cleanup, [dashboard/roster/200% zoom checks](artifacts/refinement/final-checks/verification.json)
  passed again. All three roster parser tests passed. No uncaught browser errors
  occurred. `git diff --check` passed.
- Snapshot comparison against the start of this refinement confirmed changes
  stay in Production Desk `client/src` and `client/qa`. Backend, database, auth,
  API/models, legacy editor source, M01 site, other repositories and published
  bundles were unchanged. No commit, push, merge or deployment was performed.

The preview validates frontend behavior against fictitious responses. It does
not test live authentication, server PDF rendering or email delivery. Chrome,
Playwright and a running loopback Vite server are required; the temporary runtime
path is specific to this workstation/session.
