# linear-0xc-61 — WI-06 parallel dispatch with resource locks

## Contract Source

- Linear: https://linear.app/0xc1/issue/0XC-61/wi-06-add-parallel-dispatch-with-resource-locks
- Design source: `docs/linear-legion-scheduler/rfc.md` and `docs/linear-legion-scheduler/work-items/WI-06-parallel-dispatch-locks.md`
- Upstream WI dependencies: WI-03, WI-04 and WI-05 are complete in Linear before this work starts.
- Risk: medium. This task uses the implementation chain with a task-local RFC / RFC review before code changes.

## Goal

Extend the Linear + Legion scheduler prototype so it can dispatch multiple non-conflicting work items concurrently while preserving conservative resource-lock safety and clear waiting visibility for items that cannot start yet.

## Problem

The scheduler can scan Linear, claim a single WI, launch one OpenCode worker, and track PR delivery, but it does not yet have a dispatcher that chooses several ready candidates under global/project/repo capacity, does not validate/normalize resource lock keys, and cannot explain whether a ready WI is waiting for capacity, a blocker, or a conflicting lock. Without that layer, parallel execution would either be too unsafe or too opaque in Linear.

## Scope

- Add a resource lock parser / normalizer for `repo:*`, `area:*`, and `mutex:*`, including conflict-matrix helpers.
- Reuse the existing SQLite `resource_locks` table and `claimReadyWorkItem()` transaction for lock acquisition, while adding stale-lock detection hooks that do not auto-release locks.
- Add a dispatcher planning/execution module that consumes scanner reports, applies global / per-project / per-repo concurrency limits, and claims only candidates with available capacity and locks.
- Improve candidate priority sorting with Linear priority, dependency depth / unblock impact, age, and starvation prevention.
- Surface waiting visibility as structured scheduler output/events and native-agent outbox payloads for lock, capacity, and blocker waits without marking waiting candidates as `agent:running`.
- Add tests covering parser behavior, conflict matrix, fair sorting, parallel dispatch limits, lock release/reconcile, restart recovery from persisted locks/active runs, and waiting visibility.

## Non-goals

- No automatic merge-conflict prediction.
- No cross-organization global resource scheduling.
- No two workers sharing a worktree.
- No webhook ingestion, retry taxonomy expansion, or production native Linear API adapter work; WI-07 owns reliability/webhook recovery.
- No bypass of `git-worktree-pr`, PR checks/review, or Legion evidence gates.

## Assumptions

- The local prototype continues to use TypeScript, Node.js, and SQLite under `scheduler/`.
- Worker runtime remains OpenCode-only.
- `SchedulerStore.claimReadyWorkItem()` remains the only durable claim / lock acquisition boundary.
- Existing PR delivery tracking releases locks only at terminal success/non-success decisions and requests downstream reconcile.
- Linear native agent writeback is still represented by idempotent outbox payloads and tests, not a production adapter.

## Constraints

- `repo:<name>` locks are mutually exclusive by default; future repo config may allow narrower area-level parallelism.
- `area:<name>` conflicts within the same repo context.
- `mutex:<name>` conflicts globally.
- Lock TTL is for stale detection/reporting only; detecting a stale lock must not automatically release it or unlock downstream work.
- When capacity is full, the candidate must stay ready/waiting; it must not be advanced to `running`.
- Waiting visibility must include the specific lock key, blocker, or capacity limit so an admin/user can explain why a WI did not start.

## Acceptance Criteria

- N non-conflicting WI can be claimed for dispatch in one pass, bounded by configured global/project/repo limits.
- Conflicting WI cannot simultaneously hold the same repo/area/mutex lock.
- Run terminal delivery releases locks and records downstream reconcile intent through existing WI-05 flow.
- A scheduler restart can inspect persisted active runs and held locks and avoid duplicate dispatch.
- An admin/report path can explain which lock or capacity limit caused a WI to wait.
- Waiting visibility describes `waiting_for_lock`, `waiting_for_capacity`, or `waiting_for_blocker` and does not label the item as running.

## Design Summary

- Introduce `scheduler/src/resource-locks.ts` as the canonical lock parser/conflict helper and have scanner/dispatcher use it instead of ad-hoc label filtering.
- Introduce `scheduler/src/dispatcher.ts` with a pure planning layer plus an execution layer. The planning layer sorts candidates and decides `claim` vs `wait`; the execution layer calls `SchedulerStore.claimReadyWorkItem()` for selected claims and records waiting events/outbox payloads for deferred candidates.
- Extend `SchedulerStore` with held-lock/stale-lock inspection APIs instead of mutating lock state on TTL expiry.
- Keep the worker pool conservative: only candidates selected by the dispatcher are claimed and handed to the existing `worker_dispatch` outbox; waiting candidates remain unclaimed and visible.
- Add CLI and README touchpoints for dispatch fixture reports so the behavior is reviewable without real Linear/GitHub credentials.

## Phases

1. Materialize task contract and task-local RFC / RFC review.
2. Implement resource lock parser, store inspection hooks, and dispatcher planning/execution.
3. Add unit/integration coverage and update scheduler docs/README.
4. Run verification, code review readiness, report walkthrough, wiki writeback, and PR lifecycle.
