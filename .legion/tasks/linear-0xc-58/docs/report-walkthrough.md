# Walkthrough: Linear WI-04 OpenCode Legion Worker Runner

> **Mode**: implementation  
> **Task**: `linear-0xc-58` / Linear `0XC-58`  
> **PR scope**: Scheduler prototype only (`scheduler/` + scheduler design docs + Legion task evidence)

## What changed

This change implements the WI-04 single-worker OpenCode runner boundary for the Linear + Legion scheduler.

### Scheduler runner

- Added deterministic Linear identifier mapping in `scheduler/src/task-id.ts`:
  - `ENG-123 -> linear-eng-123`
  - `0XC-58 -> linear-0xc-58`
- Added `scheduler/src/worker-runner.ts`:
  - OpenCode prompt artifact rendering with Legion hard gates;
  - native startup outbox processor with ordered prerequisites;
  - OpenCode-only process launcher with heartbeat, timeout, cancel and stdout/stderr capture;
  - strict worker result parser and DB identity checks;
  - scheduler-side Legion evidence verifier with task-local path containment and lifecycle evidence checks;
  - single `worker_dispatch` executor that updates run / attempt lifecycle through `SchedulerStore`.
- Extended `scheduler/src/sqlite-store.ts` with public APIs for attempt lifecycle, heartbeat, native context updates, run metadata, outbox failure/retry, run outbox inspection and safe event recording.
- Extended `scheduler/src/cli.ts` with a local debug command:

```bash
npm --prefix scheduler run debug -- worker dispatch \
  --run <run-id> \
  --attempt <attempt-id> \
  --repo <repo-path> \
  --db .cache/linear-scheduler/dev.sqlite
```

### Docs

- Added `docs/linear-legion-scheduler/worker-runner.md` as the WI-04 delivery artifact.
- Updated scheduler README, scheduler index and WI-04 work item status.

## Important safety behavior

- Worker prompt argv does **not** contain the full Linear / native context; argv only points to the repo-local prompt artifact.
- OpenCode child env is allowlisted; Linear / GitHub / scheduler secrets are not inherited by default.
- Timeout / cancel uses process-group TERM -> KILL grace and waits for process close before recording terminal attempt result.
- Worker dispatch rejects outbox/payload/run/attempt/task identity mismatches before launch.
- Worker result identity is checked again before evidence verification.
- Evidence paths must be repo-relative, match expected `.legion/tasks/<task-id>/...` or wiki path, exist, and resolve inside the repo.
- PR-backed lifecycle evidence must come from `.legion/tasks/<task-id>/docs/git-worktree-lifecycle.json`; top-level worker self-attested booleans are not trusted.
- Stop/cancel before native startup skips pending startup side effects and only allows the final response path.

## Verification

See `docs/test-report.md`.

- `npm --prefix scheduler test` — PASS (29/29).
- `npm --prefix scheduler run health -- --db :memory:` — PASS.
- `npm run test:regression` — PASS (18/18).
- `npm run pack:dry-run` — PASS.
- `git diff --check` — PASS.

## Review result

See `docs/review-change.md`.

- Iteration 1 and 2 found security/trust-boundary blockers.
- Iteration 3 verdict: PASS.
- Remaining items are non-blocking future hardening suggestions.

## Out of scope preserved

- No parallel dispatcher / resource scheduling expansion beyond one dispatch row.
- No GitHub PR checks/review/merge tracker; WI-05 owns that layer.
- No OpenClaw / Codex / custom runtime abstraction.
- No scheduler-generated Legion task docs for the worker; scheduler only prompts and verifies evidence.

## Reviewer focus

1. `scheduler/src/worker-runner.ts` trust-boundary behavior: prompt artifact, env sanitizer, process termination, result identity and evidence verifier.
2. `scheduler/src/sqlite-store.ts` new public methods: they should stay repository-boundary helpers, not ad-hoc SQL outside the store.
3. `scheduler/tests/linear-worker-runner.test.ts`: confirms the negative cases that previously failed review.
