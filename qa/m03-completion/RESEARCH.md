# Source references

GridCraft commit `15c9d8c10b84e2a8e06cccfa012ab97906809869`. Independently implemented TypeScript; no GridCraft source copied.

- crates/engine/src/cmd/print/layout.rs
- crates/engine/src/cmd/print/draw.rs
- crates/pdf/src/lib.rs
- crates/ui-egui/src/grid/geo.rs
- crates/ui-egui/src/grid/quadrant.rs
- crates/model/src/features/print.rs
- crates/engine/src/cmd/print/tests.rs

Used: explicit print-area resolution; point-space margins and orientation; cumulative column rectangles; font-based text measurement before pagination; repeated headers; down-then-across page bands. Kept Whiteout UUID/scheduling state and actual PDF.js preview. GridCraft includes an independent workbook model, drawing engine and font constraints; none is imported.

EasyUI DrawCheckbox commit `7c106d4a195f9ce566ffbbc672fc48bed68d30bd`, public/source/draw-checkbox.json, MIT Suraj Maurya. Adapted its native input / drawn SVG checkmark arrangement to a small shared React component and CSS; omitted spring overshoot and Framer Motion dependency. Full license in client/public/licenses/easyui-draw-checkbox.txt.

Direct rendering: pdf-lib 1.17.1 plus @pdf-lib/fontkit 1.1.1. Measured using embedded DejaVu Sans, licensed font bundled in server/assets/fonts. No Shot List LaTeX compiler or shell process remains. Call Sheets renderer untouched. Existing backend lock versions preserved; canonical path repair and new dependency entries verified with clean npm ci.

A concrete mixed Latin/Arabic visual regression exposed unshaped Arabic. bidi-js 1.0.3 (MIT, Jason Johnston) now resolves directional runs and mirroring before fontkit shapes each run. The same glyph sequence drives measurement and encoding; Latin-only lines retain the ordinary path. Arabic display and normalized extracted text were checked, alongside Latin/Greek/Cyrillic and symbols. Its exact license is bundled under server/assets/licenses.
