# Review RFC: WI-08 Admin CLI, Observability, and Security Hardening

## Verdict: PASS

The RFC is sufficient to enter implementation. It defines a bounded scheduler-local operator layer, identifies the data model change (`project_controls`), specifies dangerous-command guardrails, provides a verification plan, and keeps rollback additive and low-risk.

## Review lenses

### Scope ambiguity

- **Finding**: PASS. The RFC explicitly excludes dashboard, SaaS admin, final sandboxing, secret rotation, and new runtime abstraction. The implementation surfaces are constrained to `scheduler/`, task evidence, and docs.

### Verification strength

- **Finding**: PASS. The plan has concrete tests for reason guards, pause/resume, retry/cancel/release lock, inspect output, metrics, redaction, and security validation. Manual drills are fixture-compatible.

### Rollback

- **Finding**: PASS. Store migration is additive and rollback behavior is documented. Operational rollback via `project resume` is explicit.

### Security / permissions

- **Finding**: PASS. PermissionChange, scope validation, app actor guidance, delegate/assignee ownership boundary, GitHub least privilege, webhook signature, worker DB boundary, and redaction are all covered.

### Complexity

- **Finding**: PASS with suggestion. `project_controls` plus `admin.ts`/`observability.ts` is a reasonable minimum. Keep CLI parsing thin; if implementation starts moving business logic back into `cli.ts`, treat that as a review-change concern.

## Non-blocking suggestions

1. Prefer pure admin service tests over CLI-only tests so reason guards and audit events are easy to verify.
2. Keep `security_blocked` output visibly distinct from manual `paused` in project health and skipped details.
3. Avoid overfitting token redaction regexes to one provider; include generic key-name redaction plus known token prefixes.

## Gate decision

Implementation may proceed through the default high-risk implementation chain: `engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki -> git-worktree-pr lifecycle`.
