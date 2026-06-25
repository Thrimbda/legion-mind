# WI-08: Admin CLI, observability, and security hardening - Task Checklist

## Quick Restore

**Linear issue**: `0XC-59` — https://linear.app/0xc1/issue/0XC-59/wi-08-add-admin-cli-observability-and-security-hardening  
**Task id**: `linear-0xc-59-operations-security`  
**Worktree**: `.worktrees/linear-0xc-59-operations-security`  
**Branch**: `legion/linear-0xc-59-operations-security`  
**Current phase**: Phase 5 - Review / delivery closure  
**Current check**: Complete PR lifecycle  
**Progress**: 22/22 pre-PR tasks complete

---

## Phase 1: Contract / envelope ✅ COMPLETE

- [x] Load `legion-workflow` and enter `brainstorm` because no existing local task directory was provided.
- [x] Read Linear issue `0XC-59`, upstream RFC, and WI-08 doc; verify `contract:stable` / `risk:high`.
- [x] Verify dependency blocker `0XC-62` / WI-07 is Done.
- [x] Load `git-worktree-pr` and create `.worktrees/linear-0xc-59-operations-security` from `origin/master`.
- [x] Update Linear `0XC-59` to In Progress and write start comment.
- [x] Materialize `plan.md`, `tasks.md`, and `log.md`.

---

## Phase 2: Design gate ✅ COMPLETE

- [x] Draft `.legion/tasks/linear-0xc-59-operations-security/docs/rfc.md` covering admin CLI, pause/security state, audit events, observability, redaction, token/scope validation, and rollback.
- [x] Complete `review-rfc` with PASS before implementation.

---

## Phase 3: Implementation ✅ COMPLETE

- [x] Implement admin CLI commands: `reconcile`, `runs list`, `run inspect`, `run retry`, `run cancel`, `locks list`, `locks release`, `project pause`, `project resume`.
- [x] Add project pause/resume and security-blocked state checks so paused projects do not start new workers while active runs remain inspectable.
- [x] Require reasons for retry/cancel/release-lock/pause/resume and write `scheduler_events` audit entries.
- [x] Add run timeline / skipped reason / AgentSession / last activity / native stop fields to inspect/report output.
- [x] Add structured log context and metrics for reconcile, run, worker, PR, lock, API error/rate-limit surfaces.
- [x] Add secret redaction helper and log/event tests for token, Authorization header, signed URL, webhook signature, and nested payload redaction.
- [x] Add token scope / PermissionChange / app revocation validation behavior that pauses affected project or emits `security_blocked` evidence.
- [x] Update scheduler README and WI-08 docs with admin CLI usage and security checklist.

---

## Phase 4: Verification ✅ COMPLETE

- [x] Run scheduler unit/integration tests for CLI, pause/resume, retry/cancel/release lock, metrics/logging, redaction, and security validation.
- [x] Run manual-drill equivalent fixtures: explain a blocked WI, release a stale lock, pause then resume a project.
- [x] Record `.legion/tasks/linear-0xc-59-operations-security/docs/test-report.md`.

---

## Phase 5: Review / delivery closure

- [x] Complete `review-change` and record `docs/review-change.md`.
- [x] Generate `docs/report-walkthrough.md` and `docs/pr-body.md`.
- [x] Complete `legion-wiki` writeback.
- [ ] Commit scoped changes on `legion/linear-0xc-59-operations-security`.
- [ ] Run `git fetch origin && git rebase origin/master` before push.
- [ ] Push branch, create/update PR, attach PR to Linear, and try enabling auto-merge.
- [ ] Follow checks/review through terminal merge or documented non-success terminal.
- [ ] Cleanup worktree and refresh main workspace after PR terminal state.
- [ ] Update Linear lifecycle to Done on success, or blocked/failed/canceled with reason on non-success.

---

## Discovered follow-ups

- (none yet)

---

*Last updated: 2026-06-25 10:42 UTC*
