# M05 Flow of the Day — reused components and licenses

Flow uses the existing React, Whiteout SVG/button/menu/overlay/checkbox primitives,
M03 CodeMirror/Yjs editing and Hocuspocus persistence, dnd-kit drag sensors,
SheetJS 0.20.3 import parser, PDF.js actual-page preview, pdf-lib/fontkit direct
rendering and embedded DejaVu Sans. Existing dependency notices remain in
THIRD-PARTY-M03.md, client/public/licenses/storyboards/ and server/assets/fonts/LICENSE-DejaVu.txt.

lib0 0.2.119 (MIT, Kevin Jahns) is now explicitly declared as a server dependency;
it was already present in the Yjs dependency graph. Flow uses its public binary
message decoder to validate candidate CRDT updates before they reach live state.
Its original license is preserved in server/assets/licenses/flow/lib0-LICENSE.txt.

No timeline, spreadsheet or competing UI runtime was added. Time Map and the Flow
empty-state illustration are original application code. No vis-timeline source
or styling is copied. The accepted M03/M04 renderers and visual systems are retained.
