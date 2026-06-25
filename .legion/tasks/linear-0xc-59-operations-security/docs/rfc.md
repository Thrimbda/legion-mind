# RFC: WI-08 Admin CLI, Observability, and Security Hardening

> **Profile**: RFC Heavy / Implementation  
> **Status**: Draft for `review-rfc`  
> **Task**: `linear-0xc-59-operations-security`  
> **Linear**: `0XC-59`  
> **Created**: 2026-06-25

---

## 1. Executive Summary

WI-08 adds the scheduler's operator layer: a stable admin CLI, durable project pause/security-blocked state, audited dangerous actions, structured logs and metrics, secret redaction, permission/scope validation, and a security readiness checklist. The recommended design keeps the MVP dependency-light and scheduler-local: add an admin service and observability helpers on top of existing `SchedulerStore`, reuse existing reconcile/dispatch/retry/recovery primitives, and persist new control state in the scheduler DB.

This task must not become a dashboard or production SaaS control plane. The output is a local, testable operator surface that answers “why did this run/skipped WI behave this way?” and prevents unsafe new work when pause/security gates are active.

---

## 2. Goals

1. Provide admin commands for reconcile, run listing/inspection, retry, cancel, lock listing/release, and project pause/resume.
2. Make dangerous commands require a non-empty reason and write `scheduler_events` audit records.
3. Persist project pause/security-blocked state and make dispatch/scan respect it before new worker launch.
4. Expose run timeline, skipped reason, lock, AgentSession, last activity, native stop, and terminal reason details through inspect/health output.
5. Add structured log context and metrics snapshots for reconcile, runs, workers, PR delivery, locks, API errors/rate-limits, and security gates.
6. Add secret redaction tests for token-like values, Authorization headers, signed URLs, webhook signatures, and nested payloads.
7. Document and partially validate Linear/GitHub/worker/security readiness requirements.

## 3. Non-goals

- No full web dashboard.
- No multi-tenant SaaS admin model.
- No final sandbox/container isolation implementation.
- No automatic rotation of all secrets.
- No new worker runtime abstraction beyond OpenCode.
- No bypass of PR review/checks, Linear permission boundaries, or Legion evidence gates.

---

## 4. Current State

The scheduler currently has:

- `cli.ts`: debug commands for health, runs list, events list, scan, dispatch, worker dispatch, and delivery track.
- `sqlite-store.ts`: run/attempt/snapshot/lock/event/outbox persistence, retry attempt creation, native stop, lock release, timeline queries.
- `scanner.ts` + `dispatcher.ts`: ready/skipped reasoning, parallel dispatch, waiting visibility, resource locks.
- `webhook.ts`: Linear webhook signature verification, dedupe, AgentSession stop routing, permission-change outbox routing.
- `retry-policy.ts` + `recovery.ts`: retry taxonomy, stale run recovery, worker liveness boundary.
- `pr-tracker.ts`: PR delivery tracking and Linear native writeback outbox.

Key gaps are stable admin command names, durable project controls, redaction/logging/metrics helpers, permission-change handling, and a security checklist.

---

## 5. Design Decision

### 5.1 Selected option: scheduler-local admin service + durable controls

Add three small implementation surfaces:

1. `src/admin.ts` — admin service functions that operate on `SchedulerStore` and existing scheduler modules.
2. `src/observability.ts` — redaction, structured log event creation, metric collection/snapshot helpers, trace context normalization.
3. Store additions — a `project_controls` table and query APIs for pause/security-blocked state, health/inspect aggregation, and admin audit helpers.

The CLI routes stable commands to these service functions while preserving existing debug subcommands where useful.

### 5.2 Alternatives considered

| Option | Pros | Cons | Decision |
|---|---|---|---|
| Extend current `cli.ts` only | Fast, fewer files | CLI parsing becomes business logic; hard to test reason guards and state transitions directly | Rejected |
| Add scheduler-local admin service | Testable, reuses store/reconcile/dispatch/recovery, avoids framework | Requires several small store APIs | Selected |
| Add web dashboard/API | Better operator UX long term | Out of scope; larger auth/session/security surface | Rejected |
| Use Prometheus/OpenTelemetry now | Production-grade metrics | Adds dependency/config surface before scheduler is deployed | Rejected for MVP; use in-process metrics snapshots |
| Redact only CLI output | Minimal | Logs/events may still leak; no reusable safety boundary | Rejected; central redaction helper required |

---

## 6. Data Model Changes

### 6.1 `project_controls`

Add a table managed by `SchedulerStore.migrate()`:

```text
project_controls
  project_id TEXT PRIMARY KEY
  project_key TEXT
  state TEXT CHECK IN ('active', 'paused', 'security_blocked')
  reason TEXT NOT NULL
  actor TEXT NOT NULL
  source TEXT NOT NULL
  created_at TEXT NOT NULL
  updated_at TEXT NOT NULL
```

Semantics:

- Missing row means `active`.
- `paused` blocks new claims/dispatch but does not cancel active runs.
- `security_blocked` also blocks new claims/dispatch and should be used for PermissionChange, scope validation failure, webhook signature configuration failure, or app access revocation.
- Resume sets state to `active` and records reason; the historical audit remains in `scheduler_events`.

### 6.2 Store APIs

Add APIs roughly shaped as:

- `setProjectControl({ projectId, projectKey?, state, reason, actor, source, traceId })`
- `getProjectControl(projectId)` / `listProjectControls({ states? })`
- `pausedOrBlockedProjectIds()`
- `inspectRun(runId)` returning run, attempts, locks, timeline, outbox, evaluated snapshot, terminal reason.
- `projectHealth(projectId)` returning control state, ready/skipped snapshot summary, active runs, held/stale locks, pending outbox, metrics/event counts.

These APIs should write events such as `project_paused`, `project_resumed`, `project_security_blocked`, `admin_retry_requested`, `admin_cancel_requested`, and `admin_lock_release_requested`.

---

## 7. Admin CLI

### 7.1 Command shape

Support the WI-required vocabulary:

```bash
scheduler reconcile --project <project>
scheduler runs list --project <project>
scheduler run inspect <run-id>
scheduler run retry <run-id> --reason <reason>
scheduler run cancel <run-id> --reason <reason>
scheduler locks list
scheduler locks release <lock-key> --run <run-id> --reason <reason>
scheduler project pause <project> --reason <reason>
scheduler project resume <project> --reason <reason>
```

In this repo the executable remains `npm --prefix scheduler run debug -- ...`; docs can describe it as `scheduler ...` and show npm equivalents.

### 7.2 Behavior

- `reconcile --project`: fetches Linear project with `LINEAR_API_KEY` or reads fixture when provided, passes durable paused/security-blocked project IDs into scan/dispatch config, and prints a redacted JSON report.
- `runs list --project`: filters runs by `linear_project_id` and includes state, task, PR, gate statuses, last heartbeat, and terminal reason.
- `run inspect`: prints run row, evaluated snapshot, attempts, locks, timeline events, outbox rows, AgentSession id, last activity, native stop, PR URL, and terminal success/non-success reason.
- `run retry`: validates reason, ensures the run is not terminal success, creates a retry attempt using existing retry APIs, writes audit.
- `run cancel`: validates reason, requests admin stop/cancel, transitions to terminal non-success, writes final response outbox when applicable, releases locks through safe path.
- `locks list`: lists held/stale/released locks, owner run, expiry, and stale detection status.
- `locks release`: validates reason and lock/run match; uses existing safe release semantics with admin actor and writes an explicit admin audit event.
- `project pause/resume`: validates reason; updates `project_controls`; writes event; pause does not cancel active runs.

---

## 8. Dispatch / Reconcile Integration

Project controls must affect new work at the earliest scheduler decision point:

1. CLI and dispatch paths load `pausedOrBlockedProjectIds()` from store.
2. These project IDs are merged with explicit config `pausedProjectIds` before calling `scanLinearProject()`.
3. `scanLinearProject()` already emits `project_paused`; for `security_blocked`, the skipped detail should include state/reason where available.
4. `dispatchParallelWorkItems()` must not call `claimReadyWorkItem()` for paused/security-blocked projects because scanner returns them skipped.
5. Active runs stay listable/inspectable and can still move through PR/recovery/cancel paths.

This keeps the scanner's ready/skipped explanation as the visible reason while store controls remain durable truth.

---

## 9. Observability

### 9.1 Structured context

Introduce `SchedulerLogContext` with optional:

```text
trace_id, project_key, project_id, linear_identifier, run_id, attempt_id,
task_id, repo_key, pr_url, linear_agent_session_id, event_type
```

All admin service actions and critical scheduler surfaces should emit context through a common `structuredLog()` helper that returns/logs redacted JSON-compatible objects.

### 9.2 Metrics

Use an in-process `SchedulerMetrics` helper with counters/timers/gauges. Required metric families:

- `reconcile.started|completed|failed`, duration, ready/skipped counts.
- `run.claimed|started|blocked|done|failed|cancelled|retried`.
- `worker.started|succeeded|failed|timeout|cancelled`.
- `pr.in_review|blocked|merged|closed_unmerged`.
- `lock.held|released|stale_detected|release_denied`.
- `api.error` / `api.rate_limited` with provider dimension.
- `security.scope_validation_failed|permission_change|project_paused|redaction_applied`.

The initial implementation can expose metrics as JSON snapshots in admin output/tests; it does not need a Prometheus endpoint.

### 9.3 Redaction

Add `redactSecrets(value)` that handles strings, arrays, and nested objects. It must redact:

- Keys matching `token`, `secret`, `password`, `apiKey`, `authorization`, `signature`, `cookie`, `set-cookie`.
- Values matching `Bearer ...`, `Linear ...`, `ghp_...`, `github_pat_...`, long opaque token-like strings.
- Signed URL query parameters such as `X-Amz-Signature`, `X-Goog-Signature`, `signature`, `token`, `access_token`.

The redactor should preserve shape and non-sensitive fields so logs remain useful.

---

## 10. Security Hardening

### 10.1 Scope validation

Add a small validation helper that accepts configured/observed auth capabilities and returns PASS/FAIL findings:

- Linear production auth should use OAuth/app actor/client credentials, not personal API key by default.
- `actor=app` required for production automation where supported.
- `app:assignable` only when delegate behavior is enabled.
- `app:mentionable` only when mention-driven sessions are enabled.
- `Issue.delegate` does not replace human assignee/ownership.
- GitHub token must be limited to required repo(s) and PR/check/review operations.
- Webhook secret must exist and signature verification must be enabled.
- Worker must not receive scheduler DB superuser credentials.

On blocking finding, admin/security handler records `security_scope_validation_failed` and sets affected project to `security_blocked` when a project/team can be identified.

### 10.2 PermissionChange / app revocation

Existing `webhook.ts` routes PermissionChange to scheduler outbox. WI-08 adds a handler/helper that:

1. Records the permission-change event with redacted payload.
2. Determines affected project/team IDs when available.
3. Sets affected projects to `security_blocked` with reason.
4. Enqueues or prints an admin-visible health item requiring scope revalidation.

If the affected project cannot be identified, record a global security event and fail closed in docs/health output; do not silently keep launching new workers for known affected projects.

### 10.3 Worker and data boundaries

The security checklist must state:

- Worker receives only WI context, repo path, prompt artifact path, and least credentials needed for that WI.
- Worker should not receive scheduler DB superuser credentials; any scheduler mutation should go through constrained callbacks/outbox.
- Raw webhook payload artifacts must be sanitized or omitted.
- Log retention must be finite and documented; repo-local development artifacts under `.cache/linear-scheduler/` must be treated as sensitive until redacted.

---

## 11. Verification Plan

Automated tests:

- Admin CLI/service reason guard tests for retry/cancel/release/pause/resume.
- Pause/resume integration: paused project is skipped and does not claim; active run remains inspectable.
- Retry/cancel/release lock write `scheduler_events` and update run/attempt/lock state safely.
- Run inspect includes timeline, skipped/terminal reason, AgentSession, last activity, native stop, attempts, locks, outbox.
- Metrics snapshot includes required families after representative actions.
- Redaction tests cover token strings, headers, signed URLs, webhook signatures, nested objects, and preserve safe fields.
- Security validation marks scope failures and PermissionChange/app revocation as `security_blocked` / paused.

Manual/fixture drills:

- Explain a blocked WI from scanner/dispatch output.
- Release a stale lock with admin reason.
- Pause then resume a project and confirm no new claim while paused.

---

## 12. Rollback Plan

- Code rollback: revert this PR. Migrations are additive; missing code should ignore `project_controls` if DB remains.
- Operational rollback: `project resume <project> --reason <reason>` to clear an accidental pause, then run reconcile.
- Security rollback: if scope validation falsely blocks a project, resume only after documenting override reason in `scheduler_events`.
- Admin command rollback: retain old debug commands (`health`, `runs list`, `events list`, `scan`, `dispatch`, `worker`, `delivery`) to avoid breaking existing test/dev usage while stable admin vocabulary lands.

---

## 13. Implementation Notes

- Keep changes inside `scheduler/` plus WI docs/wiki.
- Avoid adding npm dependencies unless absolutely necessary.
- Prefer pure functions for redaction, metrics snapshots, and security findings to maximize Node test coverage.
- Keep CLI output JSON by default for reviewability and future automation.
- Do not log unredacted raw webhook payloads or auth headers in tests.

---

## 14. Review Questions

1. Does `project_controls` express both manual pause and security-blocked without overloading Linear status?
2. Are reason guards sufficient for dangerous admin commands?
3. Is the MVP metrics design credible without a production exporter?
4. Does redaction protect likely secret forms while preserving useful operator context?
5. Does PermissionChange fail closed enough without blocking unrelated projects unnecessarily?
