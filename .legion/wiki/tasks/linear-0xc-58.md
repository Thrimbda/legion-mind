# Task Summary: linear-0xc-58

## Status

- **Task**: `linear-0xc-58`
- **Linear**: `0XC-58` — WI-04: Implement OpenCode Legion worker runner
- **Outcome**: OpenCode-only worker runner implemented in the standalone `scheduler/` npm project.
- **Delivery artifact**: `docs/linear-legion-scheduler/worker-runner.md`
- **Raw evidence**: `.legion/tasks/linear-0xc-58/`

## What changed

- Added shared deterministic task mapping: `ENG-123 -> linear-eng-123`, `0XC-58 -> linear-0xc-58`.
- Added `scheduler/src/worker-runner.ts` for OpenCode prompt artifacts, native startup outbox processing, process launch, heartbeat / timeout / cancel handling, worker result parsing, evidence verification and single `worker_dispatch` execution.
- Extended `SchedulerStore` with attempt lifecycle, heartbeat, native context, outbox failure/retry, run metadata, outbox inspection and safe worker event APIs.
- Added `worker dispatch` debug command and updated scheduler README / WI docs.

## Current truth promoted

- The first worker runtime remains **OpenCode-only**; no multi-runtime adapter exists.
- Scheduler launches one worker attempt only after required native startup outbox rows are `sent`.
- Prompt context is stored in a repo-local prompt artifact; OpenCode argv only points to that artifact.
- OpenCode child env is allowlisted; Linear / GitHub / scheduler secrets are not inherited by default.
- Stop/cancel prevents new native startup side effects and prevents worker launch when already requested.
- Worker dispatch identity is checked against DB rows before launch; worker result identity is checked again before evidence verification.
- Scheduler-side evidence verifier rejects PR-only results, out-of-task evidence paths and incomplete `git-worktree-pr` lifecycle evidence.

## Verification

- `npm --prefix scheduler test` PASS (29/29).
- `npm --prefix scheduler run health -- --db :memory:` PASS.
- `npm run test:regression` PASS (18/18).
- `npm run pack:dry-run` PASS.
- `git diff --check` PASS.

## Review

- `review-change` required three iterations.
- Final verdict: PASS with security lens applied.
- Earlier blockers around worker self-attestation, argv/env leakage, process termination, native startup ordering, mutable outbox payload identity and stop/cancel side effects were fixed before PASS.

## Follow-ups

- Run a real OpenCode worker dry-run with a test WI and a least-privilege Linear/native setup before production use.
- Future hardening can persist risk / contractState in the run/evaluated snapshot rather than reading them from dispatch payload.
- Future hardening can transition corrupted dispatch rows to an explicit blocked/failed run state and redact or permission worker stdout/stderr logs.
