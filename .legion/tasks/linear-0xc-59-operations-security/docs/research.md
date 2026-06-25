# WI-08 Research Notes

## Inputs reviewed

- `docs/linear-legion-scheduler/rfc.md` §12 Security & Permissions and §13 Observability and Admin UX.
- `docs/linear-legion-scheduler/work-items/WI-08-operations-security.md`.
- Current scheduler implementation under `scheduler/src/` on `origin/master` after WI-07.
- Existing scheduler tests under `scheduler/tests/`.

## Current implementation shape

| Area | Current state | WI-08 gap |
|---|---|---|
| CLI | `src/cli.ts` supports `health`, `runs list`, `events list`, `scan`, `dispatch`, `worker dispatch`, and `delivery track`. | Commands are still debug-shaped. Need admin vocabulary: `scheduler reconcile`, `runs list --project`, `run inspect`, `run retry/cancel`, `locks list/release`, `project pause/resume`; dangerous commands need reason guard + audit. |
| Store | `src/sqlite-store.ts` has runs, attempts, snapshots, locks, events, webhook events, outbox, retry creation, native stop, lock release, timeline, stale lock/run detection. | No durable project pause/security-blocked table. No admin-specific APIs for pause/resume, cancel, run inspect aggregation, project health, or reason-required guard helpers. |
| Scanner/dispatcher | `scanner.ts` can skip `project_paused` only from config; `dispatcher.ts` records waiting visibility and stale lock detection. | Project pause must come from store, not only CLI config, and dispatch should refuse new claims for paused/security-blocked projects. |
| Webhook/security | `webhook.ts` verifies raw body signatures, dedupes, routes permission changes to scheduler outbox, and handles AgentSession stop. | PermissionChange currently enqueues only; WI-08 needs executable handling that pauses/security-blocks affected projects or emits security evidence. |
| Retry/recovery | `retry-policy.ts` has failure taxonomy; `recovery.ts` can schedule retry after stale detection. | Admin `run retry` and `run cancel` need CLI command path, reason audit, and safe terminal semantics. |
| Observability | Events and JSON outputs exist; trace IDs are present in some claim/dispatch/delivery paths. | Need shared structured log context, redaction, metric accumulator, and CLI health/report output for metrics. |
| Redaction | No centralized redaction helper. | Need default sanitizer for tokens/headers/signed URLs/signatures/nested objects and tests. |
| Docs | Scheduler README documents prototype commands and current gaps. | Need admin CLI usage and a security review checklist covering auth/scopes/webhook/GitHub/worker/retention. |

## Design constraints discovered

- Existing scheduler is dependency-light and uses Node built-ins (`node:sqlite`, `node:test`, HTTP/crypto/fs). WI-08 should avoid introducing a framework for CLI, logging, or metrics.
- `SchedulerStore` already owns migrations and event insertion. Adding a small `project_controls` table is the least invasive way to persist pause/security-blocked state.
- `scanLinearProject` already accepts `pausedProjectIds`; dispatch can load paused project IDs from store and pass them through config without changing scanner's pure API shape.
- `releaseLocksForRun()` already permits admin release, but CLI must still require reason and write a more specific event before/after release.
- Existing tests prefer in-memory SQLite and fixture-based CLI calls. WI-08 verification should follow that pattern.
- Security hardening should be both executable and documented: not all production auth requirements can be fully validated without a real OAuth app, but the expected scopes and readiness checks must be machine-readable enough for review.

## Implementation surfaces likely to change

- `scheduler/src/admin.ts` (new): admin service functions for inspect, retry/cancel, lock release, project control, project health, security validation.
- `scheduler/src/observability.ts` (new): redaction, structured log events, metrics collector, trace context helpers.
- `scheduler/src/cli.ts`: route stable admin commands and keep existing debug aliases where practical.
- `scheduler/src/sqlite-store.ts`: migrations and APIs for project control state and richer run/lock query helpers.
- `scheduler/src/dispatcher.ts` / `scanner.ts`: read durable pause/security-blocked state before new claims.
- `scheduler/src/webhook.ts`: permission-change side effect handling or helper that security-blocks affected projects.
- `scheduler/tests/linear-admin-observability.test.ts` (new): admin CLI/service, pause/resume, reason guards, redaction, metrics, security validation.
- `scheduler/README.md` and WI docs.

## Open questions resolved by design assumptions

- **Should pause cancel active runs?** No. WI-08 acceptance says active runs remain trackable; cancel remains explicit and audited.
- **Should metrics be production Prometheus?** No. MVP needs structured counters/timers and reportable snapshots; a future exporter can consume the same metric events.
- **Should secret redaction mutate DB payloads?** No. Keep DB events as deliberate structured records; sanitize log/output boundaries and any optional raw payload artifact. Tests should verify logging helpers and CLI output are safe.
- **Should permission change globally stop all scheduler activity?** Only affected project/team scopes should be paused/security-blocked when identifiable; otherwise record a global security event and require admin review.
