# Final M03 product acceptance

This is the final M03 correction, not another milestone. Reuses the disposable stack and runtime documented in `qa/m032/README.md`. No test in this directory may run against production; helpers enforce loopback API/browser origins. Browser scripts use existing isolated Playwright packages, including the macOS-compatible WebKit runtime. Artifacts remain ignored under `client/qa/m032/artifacts/final/` because the original workbook contains private production material.

With the isolated stack and Vite already running, freeze application source while running browser checks. `prepare.cjs` rewrites Vite configuration and reloads pages; never build concurrently with acceptance tests.

```sh
export M03_RUNTIME=/tmp/m032/runtime
export M03_WEBKIT_PATH=/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright
PATH="/Library/TeX/texbin:$PATH" node qa/m03-final/verify.cjs
```

`verify.cjs` runs the new interaction matrix, product/day lifecycle, mobile and physical-paper checks, plus domain assertions. Broader retained coverage is available separately: `qa/m03/team-access.cjs`, `qa/m032/collaboration.cjs` (restarts the local backend), `qa/m032/legacy-pdf.cjs`, `qa/m032/performance.cjs`, `client/qa/m02/verify.cjs`, and `qa/m031/visual.cjs`. The previous M03.2 `print-ui.cjs` expects Generate/Refresh and is superseded by this directory's actual-browser acceptance matrix.

`workbook-pdf.cjs` reuses the saved local original-workbook fixture from `qa/m032/workbook-persistence.ts`; it never imports that workbook into production. `renderer-comparison.cjs` is a disposable evaluation harness, requiring pdfmake 0.2.20 in `/tmp/m03-final-pdf-comparison/node_modules`. It is not an application dependency or required regression command. See the final review for the bounded comparison and engine decision.

Actual PDFs and screenshots:

```sh
open client/qa/m032/artifacts/final/chrome-expanded-preview.png
open client/qa/m032/artifacts/final/shooting-order.png
open client/qa/m032/artifacts/final/xelatex-25-technical.pdf
open client/qa/m032/artifacts/final/workbook-129-table.pdf
```

## Recovering an archived document

Delete uses the approved inline confirmation and archives the document in its existing Yjs metadata. Its PostgreSQL row and full document state are retained. The active index omits it; session/export/PDF/import and new WebSocket sessions deny it, and current sockets are closed after persistence.

An authenticated, centrally verified eligible production collaborator can restore a known document UUID with the existing management API:

`POST /api/shotlists/:id/manage` with JSON `{ "action": "restore" }` and the normal Scheduler Bearer session. Use the same authenticated application API client; do not paste tokens into terminal history. There is no public restore link, mock login, SQL operation, numeric allowlist, or per-document grant. `rename` and `archive` use that same endpoint, normal authorization and validated action payloads. Restoring does not renumber shots or alter assignments. The single-writer collaboration process caches archive authorization state; it is reloaded from saved metadata after a restart.
