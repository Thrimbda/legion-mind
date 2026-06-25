# Scheduler operations and security hardening

This note records the WI-08 implementation layer for the Linear + Legion scheduler. The full runnable command reference and checklist live in `scheduler/README.md`; this file keeps the scheduler design docs indexable by work item.

## Admin CLI

The scheduler admin CLI is exposed through `scheduler/src/cli.ts` and backed by `scheduler/src/admin.ts`.

Required operator commands are implemented as JSON-output debug/admin commands:

```bash
npm --prefix scheduler run debug -- reconcile --project <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- runs list --project <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- run inspect <run-id> --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- run retry <run-id> --reason "operator reason" --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- run cancel <run-id> --reason "operator reason" --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- locks list --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- locks release <lock-key> --run <run-id> --reason "operator reason" --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- project pause <linear-project-id> --reason "maintenance window" --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- project resume <linear-project-id> --reason "maintenance complete" --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- project health <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
```

Dangerous commands (`run retry`, `run cancel`, `locks release`, `project pause`, `project resume`) require a non-empty reason and write `scheduler_events` audit records.

## Project controls

WI-08 adds a durable `project_controls` scheduler DB table:

- missing row: active;
- `paused`: no new claims/worker launch for the project, while active runs remain inspectable;
- `security_blocked`: fail-closed posture for PermissionChange, scope validation failure, or app access revocation.

Scan/dispatch merges durable project controls into skipped-reason evaluation, and worker dispatch checks controls before launching OpenCode so queued worker outbox rows cannot bypass a later pause/security block.

## Observability

`scheduler/src/observability.ts` provides:

- structured log context fields: `trace_id`, `project_key`, `project_id`, `linear_identifier`, `run_id`, `attempt_id`, `task_id`, `repo_key`, `pr_url`, `linear_agent_session_id`, `event_type`;
- `redactSecrets()` for sensitive keys, Authorization values, known GitHub token prefixes, opaque token-like values, signed URL query parameters, and nested payloads;
- in-process metrics snapshots for counters, gauges, and timings.

CLI JSON output is redacted by default.

## Security checklist

- Linear production auth should prefer OAuth/app actor or client credentials; personal API keys are prototype-only.
- Use `actor=app` where supported.
- Request `app:assignable` only for delegate behavior; request `app:mentionable` only for mention-driven native sessions.
- `Issue.delegate` does not replace human assignee ownership.
- PermissionChange/app access revocation must pause or `security_blocked` affected projects until scopes are validated again.
- Linear webhooks must verify raw-body signatures.
- GitHub tokens must be limited to required repo(s) and PR/check/review operations.
- Workers must not receive scheduler DB superuser credentials.
- Raw webhook payloads and worker logs are sensitive until redacted; development artifacts under `.cache/linear-scheduler/` must not be published unreviewed.
- Production log/data retention policy must be explicit before deployment.

## Verification

WI-08 is covered by `scheduler/tests/linear-admin-observability.test.ts` plus the existing scheduler regression suite:

```text
npm --prefix scheduler test
57/57 PASS
```
