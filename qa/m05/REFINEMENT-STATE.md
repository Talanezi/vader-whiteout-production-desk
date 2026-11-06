# Cross-application refinement checkpoint

Baseline: `75cdd370` on `ui/m05-cross-application-refinement`. No new release yet.

Implemented in progress: separate AD allotted duration; bounded server-owned actual-production log with durable acknowledgment, revision concurrency, idempotence, interval validation, correction audit and undo; live UI with calibrated clock and persisted pending requests; AD / On-Set preset with explicit production-day/occurrence selection; shared source-shot take records and preference history; row coloring; cast-derived Talent with explicit override; compact Layout controls; adaptive Time Map; ten-department Tabloid width allocation and optional production log; stable twelve-slot shared Studio palette; direct visual-description editing; six/eight-panel description-first PDFs; shared empty states; Scheduler-backed account sign-out.

Validation so far: client and backend TypeScript; isolated production build; focused pure live-model regression. Browser, HTTP concurrency/durability/security, actual PDF visual inspection and full new acceptance matrix remain required. Do not claim these passed yet.

Local test infrastructure recovery: temporary PostgreSQL files were partially removed outside this task. Old incomplete files preserved; new disposable database at `../.local-qa-m05/pg-data`, loopback 55432. Production untouched. Existing local fixture IDs need reseeding; preserved original PDFs/workbook and historical QA evidence remain available. Local application uses existing `qa/m04/local.cjs`, membership authority `qa/m05/authority.cjs`, and `/tmp/m032/runtime` dependencies.

Production baseline captured read-only at `/tmp/m05/refinement/production-before.json`: 4 Flows, 2 Shot Lists / 23 active shots, 5 Storyboards / 84 assets, 7 Call Sheets, 26 roster entries. Owner's Cave Scene work accounts for changes since old milestones. Preserve all records.

Remaining: complete targeted browser interactions and visual review, fix defects, check every Section 42 matrix row, preserve M03/M04 regressions, review final diff, commit/push validated source, await Railway health, publish fresh site build, commit/push website, authenticate read-only live smoke and compare baseline. No M06.
