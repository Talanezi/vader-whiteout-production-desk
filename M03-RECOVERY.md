# M03 recovery — 31 October 2026

Recovered into the actual repository on `ui/m03-collaborative-shotlists`, based on the unchanged M02 commit `d74ef1bcb0c273dd8a81b5210a0a9a2efc6dad31`.

## Exact recovery method

The original completed source was absent from the working tree and Git history. The saved Codex session transcript retained the exact tool edits. Those edits were replayed in their original order onto a separate M02 staging copy, including subsequent corrections and original formatting operations. No M03 feature was reimplemented.

The original exact client/server/QA dependency lockfiles and installed dependencies survived in `/tmp/whiteout-m03-research`. They were recovered with the source. All 39 compared compiled files (every frontend production artifact and every backend JavaScript file) matched the retained verified build byte-for-byte before transfer. See [build comparison](client/qa/m03/artifacts/recovery-build-comparison.json).

64 original source, configuration, QA and report files were transferred after creating `/tmp/m03-recovery/recovered-m03.tar.gz`. Their SHA-256 values were checked again in the target repository. The pre-existing `qa/.DS_Store` and all unrelated files were preserved. No tracked dependency trees or published bundles changed.

## Verification and evidence

The recovered target passes frontend TypeScript, Vite and backend TypeScript builds. The original full M03/M02 QA runner was rerun against the existing isolated loopback PostgreSQL/Nest/Hocuspocus/Vite stack to regenerate the missing screenshot and result files. Original surviving logs are retained with `original-` prefixes in the artifact directory. Screenshots/results generated during recovery are fresh evidence, not claimed to be the missing original PNG bytes.

See [verification summary](client/qa/m03/artifacts/verification-summary.json), [full run log](client/qa/m03/artifacts/verification.log), [original review](M03-REVIEW.md) and [local preview commands](qa/m03/README.md).

The recovered original review retains its previous-session narrative. This recovery report records the later transfer and evidence regeneration. Existing limitations remain: native Safari automation is disabled, offline edits persist only in memory, collaboration runs as one writer, and 97 workbook rows require owner review.

## Git

The required `client/src/pages/ShotListPage.tsx`, `server/src/shotlists/` and `M03-REVIEW.md` exist on disk. M03 files are unstaged modified/untracked changes. HEAD is unchanged. No commit, push, merge, deployment or production migration was performed.

The complete path-level Git status is saved in [recovery-git-status.txt](client/qa/m03/artifacts/recovery-git-status.txt). The recovery source archive and transfer manifest are also preserved outside the repository.
