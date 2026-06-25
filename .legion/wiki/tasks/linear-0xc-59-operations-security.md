# Task Summary: linear-0xc-59-operations-security

## Status

- Date: 2026-06-25
- Linear: `0XC-59` — WI-08 Admin CLI, observability, and security hardening
- Result: implementation evidence complete; PR lifecycle pending at writeback time.
- Primary evidence: `.legion/tasks/linear-0xc-59-operations-security/`

## What changed

- Added scheduler admin service and CLI commands for reconcile, run list/inspect/retry/cancel, locks list/release, and project pause/resume/health.
- Added durable `project_controls` state (`active`, `paused`, `security_blocked`) to block new scheduler claims and worker launches while keeping active runs inspectable.
- Added structured observability helpers for log context, secret redaction, and metrics snapshots.
- Added security validation for Linear app actor/OAuth posture, delegate/mention scopes, GitHub token breadth, webhook signature configuration, and worker DB superuser boundary.
- PermissionChange/app access revocation handling now records security evidence and sets affected projects to `security_blocked` when project id is known.
- Updated `scheduler/README.md`, `docs/linear-legion-scheduler/work-items/WI-08-operations-security.md`, and `docs/linear-legion-scheduler/operations-security.md`.

## Current truth promoted

- Project pause is a durable scheduler DB control. It blocks both new dispatch claims and pending worker launches; it does not cancel active runs by itself.
- Dangerous admin actions require a non-empty reason and write `scheduler_events` audit entries.
- PermissionChange or scope validation failure should fail closed by moving affected projects to `security_blocked` until an admin validates scopes and resumes.
- CLI output and structured logs must pass through redaction for tokens, Authorization headers, signatures, signed URLs and nested payloads.
- `npm --prefix scheduler test` is now the scheduler regression surface through WI-08 and includes admin/observability/security coverage.

## Verification

- `npm --prefix scheduler test` — 57/57 PASS.

## Raw evidence

- Plan: `.legion/tasks/linear-0xc-59-operations-security/plan.md`
- RFC: `.legion/tasks/linear-0xc-59-operations-security/docs/rfc.md`
- RFC review: `.legion/tasks/linear-0xc-59-operations-security/docs/review-rfc.md`
- Test report: `.legion/tasks/linear-0xc-59-operations-security/docs/test-report.md`
- Change review: `.legion/tasks/linear-0xc-59-operations-security/docs/review-change.md`
- Walkthrough: `.legion/tasks/linear-0xc-59-operations-security/docs/report-walkthrough.md`
