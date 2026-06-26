# Parallel Dispatch and Resource Locks

> **WI**: [WI-06 Parallel dispatch and resource locks](work-items/WI-06-parallel-dispatch-locks.md)<br>
> **Status**: WI-06 delivery artifact<br>
> **Runtime**: standalone `scheduler/` npm project<br>
> **Design source**: [RFC](rfc.md), [WI-05 PR delivery writeback](delivery-pr-writeback.md)

## 1. What WI-06 delivers

WI-06 adds a conservative parallel dispatcher on top of the scanner, SQLite store, OpenCode worker outbox and PR delivery tracker. It can claim several ready WIs in one reconcile pass when they do not conflict on scheduler resource locks and when global/project/repo capacity is available.

Delivered source:

| Path | Purpose |
|---|---|
| `scheduler/src/resource-locks.ts` | Parser / normalizer for `repo:*`, `area:*`, `mutex:*`; repo-scoped area locks; conflict matrix |
| `scheduler/src/dispatcher.ts` | Pure dispatch planning, fair candidate ordering, capacity enforcement, lock-wait / capacity-wait / blocker-wait visibility and claim execution |
| `scheduler/src/scanner.ts` | Ready candidates now include the metadata needed for dispatch; lock keys use the canonical parser; `parallelRepoKeys` can opt a repo out of default repo-wide mutual exclusion |
| `scheduler/src/sqlite-store.ts` | Held-lock inspection, stale-lock detection events, conflict-matrix checks inside the claim transaction, optional lock TTL metadata |
| `scheduler/src/cli.ts` | Adds `dispatch fixture` debug command for local parallel claim runs without launching workers |
| `scheduler/tests/linear-dispatcher.test.ts` | Parser, conflict matrix, fairness, parallel claim, capacity wait, restart recovery, terminal release and stale-lock hook coverage |

## 2. Lock semantics

The scheduler treats resource locks as machine-truth scheduling constraints, not as Linear label truth.

| Input | Behavior |
|---|---|
| `repo:<name>` | Repo-wide mutual exclusion. Added by default from repo mapping unless the repo is listed in `parallelRepoKeys`. |
| `area:<name>` | Canonicalized as `area:<repo>/<name>` so the same area name can run independently across repos. |
| `mutex:<name>` | Global mutex across all repos/projects. |

The claim transaction now checks conflicts through the lock matrix instead of exact SQL key matching only. This catches cases such as `repo:legion-mind` conflicting with `area:legion-mind/scheduler`.

Lock TTL is stored as `resource_locks.expires_at` when configured. `listStaleHeldLocks()` and `stale_lock_detected` events are inspection hooks only; stale detection does not release locks or satisfy downstream blockers.

## 3. Dispatcher model

`dispatchParallelWorkItems(store, { project, config })` performs one local reconcile/dispatch pass:

1. Run `scanLinearProject()` with the provided config.
2. Inspect active runs and held locks from SQLite.
3. Record stale-lock detection events when held locks are past TTL.
4. Sort ready candidates by effective priority:
   - Linear priority;
   - downstream unblock impact;
   - dependency depth;
   - age / starvation boost;
   - deterministic identifier tie-break.
5. Plan `toClaim` vs `waiting` under configured limits:
   - `globalConcurrency`;
   - `perProjectConcurrency`;
   - `perRepoConcurrency`.
6. Call `SchedulerStore.claimReadyWorkItem()` for planned claims only.
7. Record `dispatch_waiting` / `dispatch_claim_skipped` events for wait states or races.

Capacity is enforced before claim. A candidate waiting for worker capacity remains unclaimed, does not hold locks, and does not become `running`.

## 4. Waiting visibility

Waiting records are first-class dispatcher output and scheduler events:

| Reason | Details |
|---|---|
| `waiting_for_lock` | Requested lock keys and holder run ids / conflicting lock keys |
| `waiting_for_capacity` | Scope (`global`, `project`, `repo`), active count and configured limit |
| `waiting_for_blocker` | Scanner dependency-blocked details |

Each waiting record contains a native-agent-compatible preview with `waitingReason` and `activityMessage`. WI-06 does not implement the production Linear adapter, but the payload deliberately avoids `agent:running`; worker dispatch outbox rows are created only for claimed runs.

## 5. Debug command

Fixture mode claims ready work into a local SQLite DB and prints the dispatch report:

```bash
npm --prefix scheduler run debug -- dispatch fixture \
  --fixture tests/fixtures/project.json \
  --db .cache/linear-scheduler/dev.sqlite \
  --parallel-repos legion-mind \
  --global-concurrency 4 \
  --per-repo-concurrency 4
```

The command does not launch OpenCode workers. Use the existing `worker dispatch` command to consume individual pending `worker_dispatch` outbox rows.

## 6. Boundaries for later WIs

- WI-07 owns webhook ingestion, retry/backoff, active stale recovery and admin release flows.
- WI-08 owns production-grade admin UX, metrics and security hardening.
- Future repo-specific parallelism can extend `parallelRepoKeys` into richer repo configuration without changing the core lock parser or claim transaction boundary.
