# M03.2 local review and regression

Run from the Production Desk repository using Node 22. These commands use disposable local PostgreSQL and the existing QA-only Scheduler authority. They never create a production mock login or change the production authentication policy. Keep `local-state.json` private; it contains temporary loopback credentials.

The current review stack is running at `http://127.0.0.1:5175/productiondesk/`. Open a populated, isolated visible Chrome session without a real login:

```sh
M03_RUNTIME=/tmp/m032/runtime node qa/m03/preview.cjs
```

This launcher blocks production requests, injects only the local test authority's session, displays a local-PostgreSQL badge, and opens the current seeded document. It is outside the deployable application. Close its Chrome window to stop the preview. For another local collaborator use `M03_USER=102` or `103`.

To prepare a fresh isolated environment, without changing source dependency directories or tracked client/dist:

```sh
export M03_RUNTIME=/private/tmp/m032/runtime
node qa/m03/prepare.cjs --install
node qa/m03/scheduler-prepare.cjs --install
```

Install Chrome, Playwright's matching browser dependencies, XeLaTeX/DejaVu and Poppler if they are absent. On this Mac, bundled Playwright supplies Chrome and `/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright` (1.56.1) supplies a compatible WebKit 26.0 build. Set `M03_WEBKIT_PATH` where supported for an alternate compatible installation. `PATH` must include `/Library/TeX/texbin` for the Mac TeX installation. The local stack's Scheduler build defaults to `/tmp/whiteout-membership-scheduler/build`; `M03_SCHEDULER_BUILD` can point to the equivalent isolated compiled `src/users/production-membership.js`.

Start the API/QA authority in one terminal:

```sh
export M03_RUNTIME=/tmp/m032/runtime
export NODE_PATH="$M03_RUNTIME/server/node_modules:$M03_RUNTIME/qa/node_modules"
PATH="/Library/TeX/texbin:$PATH" node qa/m03/local-stack.cjs
```

Start the actual Vite frontend in another terminal:

```sh
export M03_RUNTIME=/tmp/m032/runtime
NODE_PATH="$M03_RUNTIME/client/node_modules" \
ESBUILD_BINARY_PATH="$M03_RUNTIME/client/node_modules/@esbuild/darwin-arm64/bin/esbuild" \
VITE_API_BASE_URL=http://127.0.0.1:4310/api \
node "$M03_RUNTIME/client/node_modules/vite/bin/vite.js" --config "$M03_RUNTIME/vite.config.mts"
```

The generated config uses 127.0.0.1:5175. Seed ordinary local review data, then open the visible preview:

```sh
M03_RUNTIME=/tmp/m032/runtime node qa/m03/seed.cjs
M03_RUNTIME=/tmp/m032/runtime node qa/m03/preview.cjs
```

Run the full sequential matrix (some tests intentionally restart the isolated API; do not run another edit test in parallel):

```sh
export M03_RUNTIME=/tmp/m032/runtime
export M03_WORKBOOK='/Users/thameralanezi/Downloads/Shot List - Vader_ Whiteout.xlsx'
export M03_WEBKIT_PATH=/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright
PATH="/Library/TeX/texbin:$PATH" node qa/m032/verify.cjs
```

Tests can also run individually. `print.cjs` and `print-ui.cjs` need `workbook-persistence.ts` first; its original-workbook interpretation is **local QA only**, including an explicitly labeled placeholder for the one missing source identifier. No test imports this workbook into production.

Artifacts are in `client/qa/m032/artifacts/`. They are ignored by Git because they include private workbook content. Open the local gallery:

```sh
open client/qa/m032/review.html
```

Render an actual selected-area PDF page:

```sh
pdftoppm -f 1 -singlefile -png client/qa/m032/artifacts/print-ten-row-area-portrait.pdf /tmp/m032/selected-area
open /tmp/m032/selected-area.png
```

Production publishing remains `M03_RUNTIME=/tmp/m032/runtime node qa/release.cjs`. It makes a fresh production build, backs up the previous website application directory in /tmp, copies only Production Desk, checks file hashes and leaves other site applications unchanged. It has no Git side effects; the authorized release separately commits/pushes source and website and verifies Railway/GitHub Pages.
