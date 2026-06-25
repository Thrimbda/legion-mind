# Walkthrough: WI-08 Admin CLI, Observability, and Security Hardening

## Mode

Implementation.

## Reviewer summary

This PR adds the scheduler's operator and security hardening layer for WI-08. It introduces durable project controls, audited admin commands, structured observability helpers, secret redaction, security validation, PermissionChange security blocking, and coverage for pause/retry/cancel/lock-release workflows.

## What changed

### Admin CLI and service

- Added `scheduler/src/admin.ts` for admin service operations:
  - run inspection with attempts, locks, timeline, outbox, evaluated snapshot, AgentSession/native state and terminal reason;
  - project pause/resume and project health;
  - reason-required retry, cancel and lock release;
  - security validation and PermissionChange handling.
- Extended `scheduler/src/cli.ts` with WI-required commands:
  - `reconcile --project <project>`
  - `runs list --project <project>`
  - `run inspect <run-id>`
  - `run retry/cancel <run-id> --reason <reason>`
  - `locks list`, `locks release <lock-key> --run <run-id> --reason <reason>`
  - `project pause/resume/health <project>`

### Durable pause and security controls

- Added scheduler DB table `project_controls` for `active`, `paused`, and `security_blocked` states.
- Scan/dispatch now merge durable project controls into skipped-reason evaluation before new claims.
- Worker dispatch now checks pause/security controls before launching OpenCode, so a queued worker outbox cannot bypass a later project pause.

### Observability and redaction

- Added `scheduler/src/observability.ts` with:
  - structured log context fields;
  - `redactSecrets()` for sensitive keys, Authorization values, known token prefixes, opaque token-like values, signed URL query parameters and nested objects;
  - in-process `SchedulerMetrics` counters/gauges/timings snapshots.
- CLI JSON output is redacted by default.

### Security hardening

- PermissionChange/app access revocation webhook handling now records security evidence and sets affected projects to `security_blocked` when project id is known.
- Security validation covers Linear app actor/OAuth posture, delegate/mention scopes, GitHub token breadth, webhook signature configuration, and worker DB superuser boundary.
- README now includes admin command usage and a security readiness checklist.

## Verification evidence

- `docs/test-report.md`: `npm --prefix scheduler test` — 57/57 PASS.
- New tests cover:
  - durable pause blocking dispatch;
  - pause deferring pending worker launch;
  - reason guards and audit events for retry/cancel/release lock;
  - CLI pause/health/inspect JSON;
  - redaction and metrics helpers;
  - security validation and PermissionChange `security_blocked` behavior.
- Existing suite still passes for scanner, dispatcher, webhook, retry/recovery, PR tracking, worker runner and evidence verifier.

## Review evidence

- `docs/review-rfc.md`: PASS.
- `docs/review-change.md`: PASS with security lens applied.

## Risk and rollback

- Data migration is additive (`project_controls`). Missing/new rows default to active behavior.
- Operational rollback for accidental pause/security block is `project resume <project> --reason <reason>` after documenting reason.
- Code rollback is a normal PR revert; previous debug commands remain available.

## Files to focus on

- `scheduler/src/admin.ts`
- `scheduler/src/observability.ts`
- `scheduler/src/sqlite-store.ts`
- `scheduler/src/cli.ts`
- `scheduler/src/worker-runner.ts`
- `scheduler/tests/linear-admin-observability.test.ts`
- `scheduler/README.md`
