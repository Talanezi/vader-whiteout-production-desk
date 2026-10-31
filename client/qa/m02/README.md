# M02 isolated frontend QA

All screenshots in `artifacts/` use clearly fictitious browser-intercepted API
responses. Fixture code is outside `src/` and is never imported by the application.
No authenticated production records were read, changed, or deleted. Email POSTs
return a disabled response from the interceptor. PDF checks use a local fixture blob,
so they verify the download interaction and naming, not server PDF rendering.

## Interactive local review without a real login

Start the local frontend using the Vite command below, then run from
`/Users/thameralanezi/Developer/Vader-Whiteout/vader-whiteout-production-desk`:

```sh
node client/qa/m02/preview.cjs
```

This opens visible Chrome in a fresh, isolated, non-persistent context. Playwright
is resolved from `PLAYWRIGHT_PATH`, a local installation, or this machine's bundled
Codex runtime. Installed Chrome is required. The URL must be loopback-only.

Review the populated Call sheets and Roster pages, open category/status/action
menus, add or edit a person, collapse the sidebar, and choose New call sheet.
Fixture edits survive page reloads within that window. Restart the launcher to
reset all fixtures. Close the browser or press Ctrl+C in its terminal to stop.

All API requests are intercepted by the existing fixture harness. Other external
requests are blocked except read-only Google font files. Email sending is
disabled. The visible LOCAL FIXTURES badge is injected by the launcher only.
This does not create a login endpoint, frontend test route, or deployable auth
bypass. Opening the same URL in an ordinary browser still uses normal Scheduler
authentication. No real login or browser profile is used by this preview.

## Automated verification

Run the parser tests from the Production Desk repository root:

```sh
node --test client/qa/m02/parser.test.cjs
```

Start the existing Vite frontend, then run the browser suite with a local
Playwright installation and installed Chrome:

```sh
PLAYWRIGHT_PATH=/absolute/path/to/playwright \
node client/qa/m02/verify.cjs
```

Run the final visual refinement checks and screenshot capture:

```sh
PLAYWRIGHT_PATH=/absolute/path/to/playwright \
node client/qa/m02/refinement.cjs
```

The latest refinement evidence is in `artifacts/refinement/`, with the complete
21-group regression run in `artifacts/refinement/regression/`. See
[REFINEMENT-REVIEW.md](REFINEMENT-REVIEW.md) for the screenshot index and results.

The default URL is `http://127.0.0.1:5174/productiondesk/`. Override with
`PD_PREVIEW_URL`. `PD_QA_OUTPUT` changes the screenshot/results directory.
`PD_QA_GROUPS` can select comma-separated groups: `dashboard,roster,states,
responsive,editor,motion,zoom,navigation`. The default executes all groups.
The native zoom group briefly opens a clean, isolated Chrome profile, changes
only that profile's zoom, verifies a 1440→720 CSS viewport change, then closes it.
It does not use or change the user's browser profile.

`verification.json` is the final complete run: 21 groups passed. Three parser
unit tests also passed. Screenshots cover the required desktop and mobile
surfaces, menus, drawer, confirmations, real pending/success UI, partial import,
loading/error/session/empty states, templates, legacy editor and native zoom.

## Existing checkout dependency issue

The repository checks in `node_modules` but lacks the Mac ARM Rollup binary.
The baseline `npm run build` failed before implementation. To avoid changing
tracked dependencies or lockfiles, the exact existing lockfile was installed
into `/tmp/whiteout-m02-research/runtime` for this session. Vite's cache, build
output and TypeScript build information were kept outside the source tree.

The final existing npm build script passed with:

```sh
cd client
NODE_PATH=/tmp/whiteout-m02-research/runtime/node_modules \
ESBUILD_BINARY_PATH=/tmp/whiteout-m02-research/runtime/node_modules/@esbuild/darwin-arm64/bin/esbuild \
npm run build -- --config /tmp/whiteout-m02-research/vite.config.mts \
  --outDir /tmp/whiteout-m02-research/final-dist --emptyOutDir
```

The temporary config imports the unchanged client Vite config and supplies only
`cacheDir: '/tmp/whiteout-m02-research/vite-cache'`. The tracked TypeScript build
cache was restored to its clean starting contents after npm's build completed.
The tracked `client/dist` bundles were not updated. No deployment files changed.

The local review server uses the same temporary runtime. To restart it while
that folder is available, run from `client/`:

```sh
NODE_PATH=/tmp/whiteout-m02-research/runtime/node_modules \
ESBUILD_BINARY_PATH=/tmp/whiteout-m02-research/runtime/node_modules/@esbuild/darwin-arm64/bin/esbuild \
node /tmp/whiteout-m02-research/runtime/node_modules/vite/bin/vite.js \
  --config /tmp/whiteout-m02-research/vite.config.mts \
  --host 127.0.0.1 --port 5174 --strictPort
```

A clean platform-appropriate dependency install is still needed to run the
original npm commands without this environment workaround. That pre-existing
checkout issue was not hidden or addressed by rewriting tracked dependencies.
