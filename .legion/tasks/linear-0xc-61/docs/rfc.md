# RFC — WI-06 parallel dispatch and resource locks

## Verdict Target

This RFC narrows the already-approved scheduler RFC / WI-06 design into a concrete implementation plan for the local scheduler prototype. It is standard profile: enough design to handle concurrency and lock safety, without re-opening the whole scheduler architecture.

## Current System

- `scanner.ts` can produce ready/skipped candidates, detect dependency cycles, evaluate blockers, infer repo/risk/contract labels, and include simple lock keys in ready output.
- `sqlite-store.ts` can claim one ready WI transactionally, create a run/attempt, acquire `resource_locks`, enqueue native-agent startup and worker-dispatch outbox rows, release locks at terminal delivery, and expose run timelines.
- `worker-runner.ts` launches one OpenCode worker from one pending dispatch outbox row and verifies Legion evidence before PR tracking.
- `pr-tracker.ts` updates run delivery state and releases locks when terminal PR/evidence/lifecycle gates pass or terminal non-success is recorded.

## Design Decisions

### 1. Canonical resource-lock module

Add `scheduler/src/resource-locks.ts` as the single parser / conflict helper for lock hints.

Accepted lock syntax:

- `repo:<name>` — repo-scoped mutually exclusive lock.
- `area:<name>` — area lock scoped by repo context for conflict checks.
- `mutex:<name>` — globally exclusive lock.

The parser validates non-empty names and rejects unknown prefixes. Lock derivation will combine repo labels, area/mutex labels, and `resourceHints`. The scheduler keeps lock TTL as metadata (`expires_at`) and exposes stale inspection; stale detection does not auto-release or change downstream satisfaction.

### 2. Dispatcher has pure planning plus transactional claim execution

Add `scheduler/src/dispatcher.ts` with two layers:

1. `planParallelDispatch()` is pure and deterministic. It accepts scanner candidates/skipped items, active run counts, held locks, config limits, and optional candidate metadata. It returns `toClaim[]`, `waiting[]`, and capacity snapshots.
2. `dispatchReadyCandidates()` records/claims the selected plan by calling `SchedulerStore.claimReadyWorkItem()` for each `toClaim` item. Claim remains the only durable lock acquisition boundary, so races are still handled by the store transaction.

If a claim fails because another scheduler instance won a race (`resource_conflict`, `active_run_exists`, or `stale_snapshot`), the dispatcher records the item as waiting/skipped instead of retrying blindly.

### 3. Capacity is enforced before claim

Capacity limits are applied before `claimReadyWorkItem()` so waiting candidates stay unclaimed and do not hold locks. The first implementation supports:

- `globalConcurrency`
- `perProjectConcurrency`
- `perRepoConcurrency`

Active `queued | running | in_review | blocked` runs count against capacity to support restart recovery. `blocked` is counted conservatively because its worker/PR/lifecycle may still own locks or require follow-up.

### 4. Fair priority sorting

Candidate order uses a score tuple rather than only Linear priority:

1. Linear priority (`1` highest, `0`/missing last).
2. Dependency depth / unblock impact (more downstream impact first).
3. Age and starvation boost based on `createdAt` / `waitingSince`.
4. Identifier tie-breaker for deterministic output.

This keeps high-priority items favored while letting older low-priority candidates eventually outrank equally safe newer work.

### 5. Waiting visibility is a first-class output

Dispatcher waiting records include:

- `waiting_for_lock` with exact lock key and holder run id.
- `waiting_for_capacity` with limit name, limit value, and current count.
- `waiting_for_blocker` with blocker identifiers / skipped reason details.

Execution records scheduler events and enqueues native-agent-compatible visibility payloads without setting `agent:running`. This keeps the prototype UI contract testable while leaving production Linear API details to existing/future native adapters.

## Alternatives Considered

### A. Start workers immediately and let lock acquisition fail inside worker

Rejected. It wastes worker slots, makes Linear appear active when no code should run, and violates the requirement that waiting is not `running`.

### B. Claim every ready item as queued, then dispatch under pool capacity

Rejected for the first parallel implementation. It can hold locks while no worker is available and can starve unrelated work. The scheduler may later add expiring queue claims, but this task keeps capacity checks before claim.

### C. Make TTL automatically release locks

Rejected. TTL is only a stale detection signal; releasing requires terminal run handling or admin action with audit.

## Verification Plan

- Unit tests: parser accepts/rejects lock keys, conflict matrix respects repo/area/mutex semantics, priority sorter applies age/starvation tie-breaks.
- Integration tests: ten fixture WI with four conflicts dispatch under global/project/repo limits; conflicting WIs never both claim the same lock; terminal release enables another reconcile/dispatch.
- Restart test: with persisted active runs and held locks, a new store/dispatcher pass does not duplicate active work and reports waiting reason.
- Waiting visibility tests: blocked, lock-wait and capacity-wait records include native-visible reason and never request `agent:running`.

## Rollback

- Revert scheduler code/docs/tests in this PR.
- Existing single-worker scanner/runner/PR tracking remains usable because `claimReadyWorkItem()` and delivery tracking semantics are preserved.
- If dispatcher behavior is unsafe after merge, operators can avoid running the new dispatch command and continue using existing one-run worker dispatch / delivery track commands.
