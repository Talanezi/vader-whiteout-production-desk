# Definitive M03 acceptance

This suite continues the existing isolated M03.2 harness. It changes only disposable **loopback** documents. Never point it at production. It intentionally supersedes old Focus, Generate/Refresh, expanded-report and searchable-preset assertions; the underlying import, scheduling, collaboration and authorization coverage remains.

Use the setup/stack commands in `qa/m032/README.md`: prepare the isolated client/server and QA Scheduler, run `qa/m03/local-stack.cjs` and Vite on 5175, and seed local state. Requirements: Node 22, local Postgres, Chrome, compatible Playwright WebKit, Poppler, and the existing Call Sheet TeX installation for its regression only. No Shot List PDF uses TeX. The Mac's compatible WebKit installation is `/tmp/whiteout-m03-research/webkit-runtime/node_modules/playwright`; browser scripts use the existing bundled Chromium installation.

Do not rebuild or edit the frontend while browser checks run: prepare rewrites Vite configuration and reloads the open tests. Run checks sequentially; collaboration deliberately restarts only the local API.

```sh
export M03_RUNTIME=/tmp/m032/runtime
export M03_WORKBOOK='/Users/thameralanezi/Downloads/Shot List - Vader_ Whiteout.xlsx'
PATH="/Library/TeX/texbin:$PATH" node qa/m03-completion/verify.cjs
```

Each `.cjs` can also run separately. `workbook-seed.ts` must precede `workbook.cjs`; `acceptance.cjs` must precede `paper.cjs`. The workbook's one missing identifier uses an explicit **local-only reviewed placeholder**, never an invented production rename. `proof.cjs` preserves the standalone measured Scene 05 experiment; `integration.cjs` verifies the same 14 source shots through the protected application endpoint. The reference has 19 physical columns, of which 17 carry named technical data. The integrated renderer prints those 17 fields.

Coverage: real six-scope selection, source order, automatic preview, independent print columns, paper/scaling, obsolete responses, controlled errors/Retry, byte-identical download; All Scenes/rail/isolation, cross-scene keyboard drag and identity preservation; native checkbox states and keyboard access; distinct column resets and resize/order; role defaults and private overrides/account switching; duplicate-number warning and explicit correction without automatic mutation; scheduling/pickup/day deletion without master deletion; import review and persistence; full-name tooltip; repeated document Delete/Cancel, error, Escape, archive/recovery and existing-socket closure. Three-client offline/restart, 500/2,000-shot stress and 125/150/200% Chrome zoom remain secondary tests. Eight verified roles and revoked/unauthorized HTTP/WS behavior, plus unchanged Call Sheet PDF, run through the existing suites.

Private artifacts are ignored at `client/qa/m032/artifacts/`: `completion-*`, `completion/`, and updated `final/` PDFs/matrices. `bounds.py` checks actual PDF text coordinates inside each physical page; visual inspection remains necessary for cell layout and shaping. Render with:

```sh
pdftoppm -f 1 -singlefile -scale-to 1800 -png client/qa/m032/artifacts/completion-scene05.pdf /tmp/scene05-current
open /tmp/scene05-current.png
open client/qa/m032/artifacts/completion-chrome-print.png
```

For interactive local review, reuse `M03_RUNTIME=/tmp/m032/runtime node qa/m03/preview.cjs`. Checkbox states have a Vite-only local fixture at `client/qa/m03-completion/controls.html`; it is outside the production entry graph and has no authentication/API bypass. Production release is the existing `M03_RUNTIME=/tmp/m032/runtime node qa/release.cjs`, followed by the separately authorized Git/deployment workflow.

Third-party research and attribution are in `RESEARCH.md`, `server/assets/licenses/`, the DejaVu license alongside its font and `client/public/licenses/easyui-draw-checkbox.txt`. Source workbook/PDF and private production evidence must stay untracked.
