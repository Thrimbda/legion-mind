# Review Change: WI-08 Admin CLI, Observability, and Security Hardening

## Verdict: PASS

The implementation is ready for delivery. It stays within WI-08 scope, follows the approved RFC, has credible verification evidence, and applies the required security lens for auth/permission/token/webhook/trust-boundary changes.

## Evidence reviewed

- Task contract: `plan.md`
- Design gate: `docs/rfc.md`, `docs/review-rfc.md` (PASS)
- Verification: `docs/test-report.md`
- Implementation surfaces:
  - `scheduler/src/admin.ts`
  - `scheduler/src/observability.ts`
  - `scheduler/src/sqlite-store.ts`
  - `scheduler/src/cli.ts`
  - `scheduler/src/scanner.ts`
  - `scheduler/src/dispatcher.ts`
  - `scheduler/src/webhook.ts`
  - `scheduler/src/worker-runner.ts`
  - `scheduler/tests/linear-admin-observability.test.ts`
  - `scheduler/README.md`

## Scope compliance

PASS. The change implements the requested admin CLI, durable pause/security controls, reason/audit requirements, observability helpers, redaction, PermissionChange/security blocking, docs, and regression tests. It does not introduce a web dashboard, multi-tenant admin surface, secret rotation, sandboxing, or new worker runtime abstraction.

## Correctness review

PASS.

- Project pause/security-blocked state is durable in `project_controls` and is merged into scan/dispatch config before new claims.
- Pending worker dispatch now checks `project_controls` before launch and retries/defer-launches when a project is paused/security-blocked.
- Dangerous admin actions require reasons and write explicit audit events before mutating state.
- Run inspect aggregates run, attempts, locks, timeline, outbox, evaluated snapshot, AgentSession fields, native stop and terminal reason.
- PermissionChange webhook handling records security evidence and blocks affected projects when project id is known.
- Existing scheduler state-machine, resource-lock, webhook, PR tracking, stale recovery, and evidence verifier tests still pass.

## Security lens

Applied because this change touches auth/permission/token, webhook, secret logging, and privileged admin paths.

PASS.

- Redaction handles sensitive keys, Authorization-style values, known GitHub token prefixes, opaque token-like values, signed URL query parameters, and nested payloads while preserving safe shape.
- PermissionChange/app access changes fail closed for affected projects via `security_blocked`.
- Security validation covers Linear app actor/OAuth posture, delegate/mention scopes, GitHub token breadth, webhook signature configuration, and worker DB superuser boundary.
- Worker dispatch respects pause/security controls before launching a new worker, reducing the trust-boundary risk of an already-queued outbox bypassing a later pause.
- No raw secret logging path was added; CLI JSON output passes through redaction.

## Verification adequacy

PASS. `npm --prefix scheduler test` passed 57/57 tests. New tests directly cover WI-08 acceptance and existing tests provide regression coverage across prior scheduler layers.

## Non-blocking suggestions

1. Future production exporter can map `SchedulerMetrics` snapshots to Prometheus/OpenTelemetry once deployment shape is known.
2. Project health currently reports recent skipped/waiting evidence from scheduler events; a future WI could add project-id denormalization to events for cleaner filtering.

## Delivery decision

Proceed to `report-walkthrough`, `legion-wiki` writeback, then `git-worktree-pr` commit / rebase / push / PR / checks / merge lifecycle.
