# Binding owner amendment — Shoot Log

Received during the active cross-application completion pass. This supersedes the
Live Progress banner and stopwatch-first presentation, without replacing the
other M03–M05 requirements or the verified persistence/authorization foundations.

The three shared view-switcher options are Department Flow, Time Map, Shoot Log.
Department Flow has no logging banner. Shoot Log is a timestamp ledger: direct
12-hour Actual Start entry, optional current-time shortcut, out-of-order entry,
backfill, corrections/audit, missing-versus-zero, skips/revisits and midnight.
No timer starts on opening a document. Confirmed end times remain optional.

Desktop: compact summary, dense keyboard-friendly ledger, supplementary inspector.
Phone: purpose-built shot cards and touch-friendly time-entry bottom sheet.
Tablet: deliberate adaptive layout. No horizontal scrolling for primary phone use.

Use the existing source UUIDs, DP estimate, day allotment, actual record, shared
preferred takes, Yjs collaboration, server persistence, optimistic concurrency,
idempotent requests and permission guards. Inferred start-to-start intervals are
labelled; explicit block durations remain distinct; known breaks or missing starts
are never silently included as pure shooting time. Actual checkpoints drive the
separate schedule-clock and shot-budget metrics and an expandable variance graph.
Unrecorded production never acquires invented lateness from the device clock.

All 24 acceptance scenarios in the in-chat amendment remain mandatory: empty log;
direct/current time; C before B/backfill/recalculation; historical correction and
audit; skip; break/gap; midnight; missing thresholds; separate metrics; variance
plot; preferred-take sync; refresh; concurrency; interrupted network; keyboard;
phone/tablet; no old banner; Time Map preservation; actual-time printing; M03–M05
regressions. Real-device behavior must be distinguished from browser emulation.
