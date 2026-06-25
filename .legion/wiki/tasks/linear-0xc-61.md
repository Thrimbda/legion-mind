# Task Summary: linear-0xc-61

## Status

- **Task**: `linear-0xc-61`
- **Linear**: `0XC-61` — WI-06: Add parallel dispatch with resource locks
- **Outcome**: parallel dispatcher and resource-lock safety implemented for the standalone `scheduler/` npm project.
- **Delivery artifact**: `docs/linear-legion-scheduler/parallel-dispatch-locks.md`
- **Raw evidence**: `.legion/tasks/linear-0xc-61/`

## What changed

- Added `scheduler/src/resource-locks.ts` for canonical `repo:*`, repo-scoped `area:*`, and global `mutex:*` parsing plus conflict-matrix checks.
- Added `scheduler/src/dispatcher.ts` for fair ready-candidate ordering, global/project/repo concurrency limits, capacity-before-claim planning, waiting visibility and stale-lock detection hooks.
- Extended scanner ready candidates with dispatch metadata and `parallelRepoKeys`, while preserving default repo-wide mutual exclusion.
- Extended `SchedulerStore` with held/stale lock inspection, runless scheduler event listing, optional lock TTL metadata, and conflict-matrix enforcement inside `claimReadyWorkItem()`.
- Added `dispatch fixture` debug CLI, scheduler README docs and WI-06 delivery docs.
- Added dispatcher regression coverage and strengthened core claim lock expectations.

## Current truth promoted

- Parallel dispatch only claims candidates with both capacity and non-conflicting locks. Waiting candidates remain unclaimed, do not hold locks and must not be marked `agent:running`.
- `repo:<name>` remains mutual by default. A repo must be explicitly listed in `parallelRepoKeys` before same-repo WIs can run concurrently under narrower `area:*` / `mutex:*` locks.
- `area:<name>` is canonicalized as `area:<repo>/<name>` for conflict checks; same area names in different repos do not conflict.
- Lock TTL is stale-detection metadata only. Stale-lock hooks record `stale_lock_detected` but do not release locks or satisfy downstream blockers.
- `SchedulerStore.claimReadyWorkItem()` remains the durable claim / lock boundary and checks the same conflict matrix used by dispatcher planning.
- Waiting visibility is represented as `waiting_for_lock`, `waiting_for_capacity` or `waiting_for_blocker` in dispatcher output / scheduler events; production Linear adapters remain future work.

## Verification

- `npm --prefix scheduler test` PASS (43/43).
- `npm run test:regression` PASS (18/18).

## Review

- RFC review: PASS.
- Change review: PASS with security / trust-boundary lens applied.
- One review-time implementation gap was fixed before PASS: direct `claimReadyWorkItem()` default lock derivation now uses the canonical parser so `area:*` hints are repo-scoped.

## Follow-ups

- Run `dispatch fixture` / future live dispatch against a realistic test project before enabling automatic production scheduling.
- Production Linear native adapter should consume waiting visibility payloads without writing `agent:running` for unclaimed candidates.
- WI-07 / WI-08 should build admin stale recovery and release flows on top of inspection hooks without turning TTL into automatic release.
