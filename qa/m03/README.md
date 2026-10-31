# M03 local review and verification

Run from the Production Desk repository root with Node 22 and installed Chrome.
All commands below use a dedicated loopback PostgreSQL database and QA identities.
The existing Scheduler verifier runs unchanged against a separate local contract
stub. No production database, login, PDF renderer or mail delivery is used.

## Prepare isolated dependencies and builds

```sh
node qa/m03/prepare.cjs --install
```

The exact client/server/QA lockfiles are installed under
`/tmp/whiteout-m03-research`. The helper typechecks the frontend, compiles the
Nest backend, and builds the Vite application there. It leaves the repository's
tracked `node_modules`, TypeScript caches and published `dist` bundles alone.
Existing dependency versions were preserved; new collaboration/UI dependencies
are explicitly pinned. Without `--install`, it reuses the temporary dependencies.

On this Mac (macOS 26.0), the bundled Playwright 1.62.1 WebKit 26.5 crashed before
creating a page. WebKit 26.0 from Playwright 1.56.1 was used successfully instead:

```sh
npm --prefix /tmp/whiteout-m03-research/webkit-runtime install \
  --ignore-scripts --no-audit --no-fund playwright@1.56.1
node /tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright/cli.js install webkit
```

`M03_WEBKIT_PATH` can select another compatible Playwright module. Native Safari's
WebDriver is disabled by this Mac's settings; the tests did not change that setting.

## Start the local application

Terminal 1 — PostgreSQL, local identity authority and real Nest/Hocuspocus server:

```sh
NODE_PATH=/tmp/whiteout-m03-research/server/node_modules:/tmp/whiteout-m03-research/qa/node_modules \
node qa/m03/local-stack.cjs
```

Terminal 2 — frontend, explicitly pointed at that backend:

```sh
VITE_API_BASE_URL=http://127.0.0.1:4310/api \
NODE_PATH=/tmp/whiteout-m03-research/client/node_modules \
ESBUILD_BINARY_PATH=/tmp/whiteout-m03-research/client/node_modules/@esbuild/darwin-arm64/bin/esbuild \
node /tmp/whiteout-m03-research/client/node_modules/vite/bin/vite.js \
  --config /tmp/whiteout-m03-research/vite.config.mts
```

The explicit esbuild binary is the workaround for the existing tracked checkout
dependencies on this Mac. On another platform use its matching installed binary
or omit that override when normal esbuild resolution works.

Terminal 3 — seed a clean coverage plan and open visible Chrome:

```sh
node qa/m03/seed.cjs
node qa/m03/preview.cjs
```

The visible window uses `viewport: null`, so its content follows normal window
resizing. The LOCAL POSTGRESQL badge is injected by this launcher, outside app
source. The context is fresh/non-persistent; no real login or personal profile is
used. API operations and collaborative edits are real and persist in the isolated
PostgreSQL database. Open a second collaborator window with:

```sh
M03_USER=102 node qa/m03/preview.cjs
```

Use `M03_USER=103` for the third QA identity. Copy link produces an ordinary
authenticated internal deep link. It grants no access in an ordinary browser.
An ordinary browser continues to require normal Scheduler authentication.

Close the preview window or Ctrl+C its terminal to stop it. Stop the two local
server terminals with Ctrl+C after review. PostgreSQL's data directory is retained
under the temporary runtime, so restarting the stack preserves local documents.
QA session tokens rotate on stack restart; reopen the fixture browser afterward.
Do not delete that directory while it is running.

Ports: 5175 frontend; 4310 real Nest API/WebSocket; 4311 QA Scheduler contract;
4312 QA restart controller; 55432 PostgreSQL. All are dedicated local review
services. The QA authority/controller are outside `server/src`, are not copied by
the Dockerfile, and are never part of the frontend build. Local state/tokens stay
in a mode-0600 file under `/tmp`; no credentials are checked in.

## Run verification

With both servers running:

```sh
M03_WORKBOOK='/Users/thameralanezi/Downloads/Shot List - Vader_ Whiteout.xlsx' \
node qa/m03/verify.cjs
```

The runner stops on a failed command. It runs real multi-client synchronization,
server restart, authorization/revocation, reversible migrations, legacy API CRUD,
synthetic/actual workbook tests, UI workflows, remote carets, six viewport sizes,
WebKit, native Chrome 200% zoom, parser tests and the complete 21-group M02 suite.
Email delivery is never requested. M02's PDF test uses its original fixture blob,
which tests download behavior rather than server PDF rendering.

Evidence is in `client/qa/m03/artifacts/`; the root `M03-REVIEW.md` indexes it.
`M03_RUNTIME` overrides the temporary runtime directory; use the same value for
all commands and update the explicit paths in the shell commands accordingly.
`PLAYWRIGHT_PATH` overrides the browser automation package. `M03_WORKBOOK` must
point to the supplied workbook when running the consolidated verification.

The date picker and promise-feedback fixture is available only through the dev
server at `http://127.0.0.1:5175/productiondesk/qa/m03/controls.html`. It is a
separate Vite entry used for QA, not an application route or production entry.

## Deployment is separate

See `M03-REVIEW.md` for migration, membership, origin and single-replica
prerequisites. These commands do not configure Railway or deploy anything.
