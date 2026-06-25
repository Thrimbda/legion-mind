# WI-08: Admin CLI, observability, and security hardening

## Contract Source

- Linear: `0XC-59` — https://linear.app/0xc1/issue/0XC-59/wi-08-add-admin-cli-observability-and-security-hardening
- Upstream design: `docs/linear-legion-scheduler/rfc.md`
- Work-item doc: `docs/linear-legion-scheduler/work-items/WI-08-operations-security.md`
- Dependency check: WI-02 through WI-07 are expected prerequisites; Linear blocker `0XC-62` / WI-07 is Done before this task starts.
- Risk: high. This task requires task-local RFC and `review-rfc` PASS before implementation.

## Goal

Promote the scheduler prototype into an operator-safe service by adding an audited admin CLI, structured observability, secret-safe logging, production auth guidance/validation, and security readiness documentation.

## Problem

The scheduler can now scan Linear, track PR delivery, dispatch non-conflicting workers, and recover from webhook/retry/stale conditions. It still lacks the operational layer needed to answer: why did a WI not run, who owns a lock, which run is stalled, whether a project is paused, which token scope is unsafe, and whether logs or worker permissions can leak sensitive data. Without this layer, automation becomes harder to safely intervene in as it becomes more capable.

## Acceptance Criteria

- [ ] Admin CLI can inspect run timeline, terminal success/non-success reason, skipped reason, AgentSession id, last activity, and native stop request state.
- [ ] `scheduler reconcile --project <project>` and project health / skipped reason reporting are available from the CLI.
- [ ] Project pause prevents new worker launch while active runs remain inspectable/tracked; resume re-enables scheduling.
- [ ] Retry, cancel, and lock release commands require a non-empty reason and write `scheduler_events` audit entries.
- [ ] Metrics cover reconcile, runs, workers, PR delivery, locks, Linear/GitHub/API errors, and rate-limit style failures.
- [ ] Structured logs carry trace context (`trace_id`, `project_key`, `linear_identifier`, `run_id`, `attempt_id`, `task_id`, `repo_key`, `pr_url`) without leaking secrets.
- [ ] Secret redaction tests cover tokens, Authorization headers, signed URLs, webhook signatures, and nested payloads.
- [ ] Security checklist covers Linear app actor/OAuth/client credentials, AgentSession/Activities, delegate scopes, PermissionChange/app revocation handling, GitHub auth, webhook signature, worker secrets, DB permissions, and data retention.

## Scope

- Implement scheduler-local admin CLI commands for reconcile, run list/inspect/retry/cancel, lock list/release, and project pause/resume.
- Add project pause/resume state, health/skipped reason reporting, and audit events needed by dangerous admin actions.
- Add structured logging and metrics helpers integrated into reconcile/run/worker/PR/lock/webhook/API surfaces already present in `scheduler/`.
- Add default redaction for secret-bearing strings/objects and tests that prove sensitive values are removed from logs/events.
- Add security validation/documentation for Linear OAuth/app actor scopes, native delegate/mention scopes, PermissionChange/app revocation, GitHub token least privilege, webhook signatures, worker secret boundaries, and data retention.
- Update scheduler README and WI-08 work-item delivery notes so the operator path is reviewable without production credentials.
- Maintain Legion evidence under `.legion/tasks/linear-0xc-59-operations-security/**` and wiki writeback.

## Non-goals

- No full web dashboard or multi-tenant SaaS admin surface.
- No final sandbox/container isolation implementation; this task documents and enforces minimum boundaries only.
- No automatic rotation of all secrets.
- No new worker runtime abstraction; first-version runtime remains OpenCode-only.
- No bypass of Linear/GitHub permission models, branch protection, Legion workflow, or `git-worktree-pr` lifecycle.

## Assumptions

- Existing scheduler code from WI-02 through WI-07 is available on `origin/master` and can be extended rather than rewritten.
- The scheduler remains a local TypeScript/Node/SQLite MVP, so CLI and tests may use in-process helpers and fixtures instead of production Linear/GitHub credentials.
- Scheduler DB / event log remain the machine truth for runs, attempts, locks, pause state, skipped reasons, and delivery gates.
- Linear AgentSession / AgentActivities remain presentation/control plane; `Issue.delegate` never replaces human ownership.
- Production Linear auth should prefer app actor / OAuth; personal API keys remain prototype-only.

## Constraints

- Dangerous admin actions (`retry`, `cancel`, `locks release`, `project pause/resume`) must reject missing reason and write audit events with actor/source payload.
- Pause must block new dispatch/claim/worker launch for the affected project but must not erase active run tracking or release locks by itself.
- PermissionChange or scope-validation failure must pause affected projects or place them into a `security_blocked` posture until an admin resolves the issue.
- Webhook verification and secret redaction cannot rely on logging raw secrets for debugging.
- Worker processes must not receive scheduler DB superuser privileges; docs/checklist must make this boundary explicit.
- All implementation and delivery must happen in `.worktrees/linear-0xc-59-operations-security` with PR-backed lifecycle completion.

## Risks

- **Overpowered operations**: admin commands can override safety if guard checks are weak. Mitigation: reason requirements, event audit, terminal/dead-worker checks, and targeted tests.
- **Sensitive information leakage**: logs/events may include tokens, headers, signed URLs, or webhook payload secrets. Mitigation: central redaction helper and snapshot-like tests.
- **Permission drift**: production deployments may accidentally use broad personal tokens. Mitigation: explicit scope validation and readiness checklist.
- **Native agent authority confusion**: delegate/mention scopes may be mistaken for ownership. Mitigation: docs and validation distinguish app delegate identity from human assignee.
- **Observability noise**: metrics/log fields can become inconsistent. Mitigation: shared context/metric helpers and tests for representative scheduler surfaces.

## Design Summary

- Add a small scheduler CLI entrypoint that reuses existing store/reconcile/dispatcher/recovery primitives instead of introducing a separate operational data path.
- Model project pause/security-blocked state in the scheduler store and check it before dispatching new work; keep active run inspection independent from scheduling eligibility.
- Emit admin and scheduler lifecycle events through `scheduler_events` so CLI interventions are audit-visible and later explainable from `run inspect` and project health output.
- Introduce shared observability helpers for trace context, metrics counters/timers, and redacted structured logs; wire them into existing scheduler modules at critical boundaries.
- Keep security hardening partly executable (scope validation, redaction, pause-on-permission-change hooks) and partly documented (least-privilege token scopes, worker DB permissions, retention checklist).

## Phases

1. **Contract / envelope**: Materialize this task, update Linear to In Progress, and create `.worktrees/linear-0xc-59-operations-security` from `origin/master`.
2. **Design gate**: Write task-local RFC covering CLI/store/observability/security decisions and complete `review-rfc` with PASS before implementation.
3. **Implementation**: Add admin CLI, pause/security state, audit events, structured logs/metrics/redaction, and security checklist/docs/tests.
4. **Verification**: Run scheduler CLI/integration/unit/redaction tests, record `docs/test-report.md`, and complete manual drill evidence where feasible.
5. **Review and delivery**: Run `review-change`, generate walkthrough/PR body, perform wiki writeback, commit, rebase, push, open/merge PR, update Linear, cleanup worktree, and refresh main workspace.

---

*Created: 2026-06-25*
