# M03 interaction references and runtime licenses

The Whiteout components are independently implemented in React, CSS and SVG.
No Bencho Pro source, Rare UI registry component, EasyUI component implementation,
Tailwind system, motion runtime, shadcn registry or third-party icon pack was copied.

| Reference | Source / license review | Whiteout implementation |
|---|---|---|
| [Bencho Create Menu](https://bencho.dev/blocks/liq-create) | Public page/preview inspected; no unavailable Pro code used. | Creation pill expands at its own position into two working destinations, with keyboard menu handling, Escape and focus return. |
| [Libraries.dev Metal](https://libraries.dev/metal) | Actual `metal-fx` 2.0.11 distribution, types, engine, MIT LICENSE and Paper Design Apache-2.0 NOTICE inspected. React 18+ / WebGL2; React 19 is supported by its declared peer range. | Real `MetalFx`, silver/dark at restrained strength, only on Create. Paused at rest/offscreen/background; no glow; static fallback for reduced motion/WebGL absence. Verified in Chrome and WebKit. |
| [Rare UI Delete Button](https://www.rareui.com/components/deletebutton) | Public interaction/API and project license inspected: MIT + Commons Clause + attribution. No component source copied. | Original inline confirmation, Escape/cancel, pending state, durable deletion, failure retention and restoration. |
| [Rare UI Toast](https://www.rareui.com/components/toast) | Public page describes `sonner`, `motion`, `figma-squircle` and promise-state morphing. Same licensing restrictions reviewed; no registry source copied. | M02 toast API extended independently with one pending→success/error notification, result counts, paused dismissal and restoration actions. No keystroke toast stream. |
| [Amicro Share Button](https://amicro.dev/buttons/btn-6) | External demo could not be retrieved. | Original short icon/label copy-confirmation transition. Copies an authorized list/scene deep link without a bearer token; clipboard failure is reported. |
| [EasyUI Gooey Menu](https://easyui.site/components/gooey-menu) | Public source JSON inspected; MIT. Source uses React, framer-motion and a utility helper. | Compact original SVG fusion layer on All Shots / Scene View / Planning Order; no motion dependency. Reduced motion is static. |
| [EasyUI Combobox](https://easyui.site/components/combobox) | Public source JSON and MIT license inspected. Source uses framer-motion, lucide-react and a utility helper. | Independent portalled searchable options, selected cues, active-option feedback, keyboard selection, custom values, collision handling and focus return. Scene selection carries UUID values separately from displayed labels. |
| [EasyUI Calendar](https://easyui.site/components/calendar) / [Date Picker](https://easyui.site/components/date-picker) | Both public source JSON files inspected; MIT. Source uses motion, lucide-react and the shared Calendar. | Original date-only calendar, direct entry, validation, roving grid focus, arrows/Home/End/PageUp/PageDown, month navigation, responsive portal and reduced motion. Tested in a dev-only fixture; legacy editor untouched. |

Credit to [Rare UI](https://rareui.com), [EasyUI / Suraj Maurya](https://github.com/Surajmaurya1/easyui), [Bencho](https://bencho.dev), [Amicro](https://amicro.dev), and [Jakub Antalik / Libraries.dev](https://libraries.dev) for the researched interaction references. This README-style credit also makes Rare UI's attribution visible even though no Rare UI implementation was copied.

Actual runtime additions are pinned: Yjs 13.6.27, Hocuspocus 2.15.3, y-codemirror.next
0.3.6, CodeMirror state 6.5.2/view 6.38.6, metal-fx 2.0.11, SheetJS 0.20.3 from its
official distribution, and server ws 8.18.3. Existing locked dependency versions
were retained. No major framework upgrade was made.

Yjs, Hocuspocus and CodeMirror use MIT licensing. SheetJS is Apache-2.0. Metal-fx
is MIT and embeds Paper Design shaders under Apache-2.0. Runtime notices and
license text are retained in [client/public/licenses/m03-third-party.txt](client/public/licenses/m03-third-party.txt), which Vite includes as a static license asset. Server dependency licenses remain in their normal npm distributions.

Collaboration follows the official [Y.Text](https://docs.yjs.dev/api/shared-types/y.text),
[awareness](https://docs.yjs.dev/getting-started/adding-awareness),
[y-codemirror.next](https://github.com/yjs/y-codemirror.next), and
[Hocuspocus persistence](https://tiptap.dev/docs/hocuspocus/guides/persistence)
models. The actual pinned v2 APIs/types were inspected rather than assuming the
current v4 documentation's Node 22-only API signatures applied to v2.
