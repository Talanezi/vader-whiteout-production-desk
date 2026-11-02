# Whiteout Studio engine

Pinned VectorCraft: `639c9d6ce989dd638ba3488cc26e36d907022bcb` (https://github.com/storytold/vectorcraft).

Selected unmodified source crates: geom, color, doc, brush. The local workspace manifest omits upstream desktop/application crates, test-only dependencies and all brand/font assets. Original MIT/Apache licenses and NOTICE are preserved. Cargo.lock fixes the dependency graph.

The bridge uses VectorCraft's editable PathData, shape construction, transforms and actual pressure-profile calligraphic stroke_pieces implementation. Whiteout's browser adapter owns Pointer Events, object selection, text/IME, SVG compositing and Yjs transactions. It does not embed ui-egui or claim to use the entire engine/render/tools command stack. Legacy objects retain their IDs and original editable parameters; new geometry carries a versioned engine identifier and deterministic SVG path.

The narrow ABI accepts bounded UTF-8 JSON through an allocated input region and returns bounded JSON through read-only output memory. No host imports, credentials, network, file access or runtime Rust installation. No unsafe memory dereferencing. The JS adapter reacquires memory views after every engine call.

Build with Rust 1.99.1 and target wasm32-unknown-unknown:

    cargo build --locked --release --target wasm32-unknown-unknown
    cp target/wasm32-unknown-unknown/release/whiteout_studio_engine.wasm ../client/src/lib/storyboards/whiteout_studio_engine.wasm

Using an external CARGO_TARGET_DIR is supported. The checked binary allows the established Node-only frontend release to remain unchanged. Run `node qa/m04/studio-engine.cjs` from the repository root to verify actual WASM execution; `cargo test -p whiteout-studio-engine --lib` verifies the Rust bridge.

No fallback to legacy Konva on WASM initialization failure: Studio displays a retry state. Read-only viewing can render saved geometry without initializing WASM. Editor initialization fetches the separately hashed Vite WASM asset lazily. Hardware Pencil/stylus validation must be reported separately from synthetic pressure tests.
