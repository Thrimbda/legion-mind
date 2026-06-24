# SQLite Scheduler Core and Durable State

> **WI**: [WI-02 Scheduler core service and durable state](work-items/WI-02-scheduler-core-state.md)<br>
> **Status**: WI-02 delivery artifact<br>
> **Runtime**: TypeScript / Node.js with `node:sqlite` `DatabaseSync`<br>
> **Design source**: [RFC: Linear + Legion 自动调度器](rfc.md) + [WI-01 policy](linear-wi-contract-policy.md)

## 1. What WI-02 delivers

WI-02 adds a repo-local scheduler core skeleton backed by SQLite. It establishes the durable state layer required by later work items without connecting to real Linear, GitHub or OpenCode workers yet.

Delivered source:

| Path | Purpose |
|---|---|
| `scripts/lib/linear-scheduler/state-machine.ts` | Central run state machine and terminal-state helpers |
| `scripts/lib/linear-scheduler/sqlite-store.ts` | SQLite migrations, repository APIs, claim transaction, locks, outbox and debug service |
| `scripts/linear-scheduler.ts` | Minimal debug command / service skeleton |
| `tests/regression/linear-scheduler-core.test.ts` | Unit and integration coverage for migration, claim, locks, outbox, state transitions and debug command |
| `package.json` | Adds `scheduler:debug` and `test:linear-scheduler`; regression tests run with `--experimental-sqlite` |

SQLite is intentionally used as the WI-02 local durable DB. The code keeps SQL access behind `SchedulerStore` so WI-03 / WI-04 can consume DTO-level APIs instead of depending on SQLite details.

## 2. Core tables

Migration creates the seven WI-02 core tables required by the work item:

| Table | Machine-truth responsibility |
|---|---|
| `work_item_snapshots` | Persist normalized Linear issue observations, labels, blockers, repo hints, contract state and source `updatedAt` for claim-time revalidation |
| `runs` | Own run lifecycle, active-run uniqueness, task mapping, native agent identifiers, evaluated snapshot hash and delivery / evidence gate statuses |
| `run_attempts` | Track OpenCode worker attempt number, prompt hash, exit result and log URI |
| `resource_locks` | Hold / release repo, area and mutex locks; partial unique index prevents two held locks for the same key |
| `scheduler_events` | Append-only audit timeline for skipped, claimed, transitions, lock releases and admin overrides |
| `webhook_events` | Deduplicate future Linear webhook deliveries by delivery id or signature hash while storing only sanitized payload metadata |
| `native_outbox` | Idempotent native agent side effects and worker-dispatch jobs with unique idempotency keys |

Important SQLite constraints:

- `runs_one_active_issue_idx` and `runs_one_active_task_idx` allow only one active `queued | running | in_review | blocked` run per Linear issue / Legion task.
- `resource_locks_held_key_idx` allows only one held lock per `lock_key`.
- `native_outbox.idempotency_key` is unique, so retries cannot duplicate AgentSession / activity / external URL / worker-dispatch jobs.
- `webhook_events.delivery_id` and `signature_hash` are unique for dedupe.

## 3. Run state machine

Run state transitions are centralized in `state-machine.ts`:

```text
queued -> running -> in_review -> done
queued/running/in_review/blocked -> blocked | failed | cancelled | abandoned
blocked -> running | in_review | failed | cancelled | abandoned
```

Terminal terms remain aligned with the RFC:

- `done` is the only terminal success state, and it satisfies downstream only when `delivery_gate_status = passed` and `evidence_status = passed`.
- `failed`, `cancelled` and `abandoned` are terminal non-success states and do not satisfy downstream by default.
- Admin override is represented only as a `scheduler_events` audit record; it does not convert a failed run into success.

## 4. Claim transaction

`SchedulerStore.claimReadyWorkItem()` implements the WI-02 claim boundary:

1. Normalize and persist the current snapshot.
2. Compare the ready snapshot against current issue state, labels, blockers, contract state, repo key and resource hints.
3. If any revalidation field changed, reject with `stale_snapshot` and write a skipped event.
4. Check active runs for both `linear_issue_id` and `task_id`.
5. Check required resource locks.
6. Create `runs` row in `queued` state.
7. Create first `run_attempts` row for OpenCode.
8. Acquire resource locks.
9. Write a `claimed` scheduler event.
10. Enqueue native agent outbox jobs: create/find session, set delegate when provided, initial activity, Agent Plan, external URL.
11. Enqueue worker-dispatch outbox job.

The transaction uses SQLite `BEGIN IMMEDIATE` so the active-run and held-lock checks are protected by the same write transaction that inserts the run and locks. This is the local SQLite equivalent of the RFC's durable claim / outbox boundary.

## 5. Debug command

The debug command is intentionally small and repo-local:

```bash
npm run scheduler:debug -- health --db .cache/linear-scheduler/dev.sqlite
npm run scheduler:debug -- runs list --db .cache/linear-scheduler/dev.sqlite
npm run scheduler:debug -- events list --run <run-id> --db .cache/linear-scheduler/dev.sqlite
```

It applies migrations on open and prints JSON. It is not a production admin CLI; WI-08 owns full admin / observability hardening.

## 6. Boundaries for later WIs

- WI-03 should feed normalized Linear snapshots into `claimReadyWorkItem()` after graph / ready evaluation.
- WI-04 should consume `worker_dispatch` outbox rows instead of launching OpenCode inside the claim transaction.
- WI-05 should update `delivery_gate_status`, `evidence_status`, `pr_url` and terminal state only after PR / Legion evidence verification.
- WI-06 can reuse `resource_locks` and active-run uniqueness for parallel dispatch.
- WI-07 can extend `webhook_events`, outbox retry state and stale recovery without changing the core table ownership.

SQLite is sufficient for the current local prototype, tests and debug service. If production later moves to Postgres or a workflow engine, the migration should preserve the same machine-truth boundaries rather than changing downstream semantics.
