# Test Report: Linear Scheduler WI-02

> **Task**: `linear-legion-scheduler-wi-02`<br>
> **Date**: 2026-06-24<br>
> **Result**: PASS

## Verification strategy

WI-02 introduces runtime code, SQLite migrations, claim / lock / outbox behavior, a debug command and documentation. The strongest low-cost evidence is therefore:

1. targeted scheduler tests for the new state machine / SQLite store behavior;
2. full repo regression tests to ensure existing CLI packaging and install lifecycles still pass after changing `package.json` test flags;
3. a debug-command smoke test proving the local service can start and connect to SQLite;
4. whitespace check for tracked diffs.

## Commands executed

### 1. Targeted scheduler tests

```bash
npm run test:linear-scheduler
```

Result: **PASS**

Evidence summary:

- 12 tests passed.
- Covered SQLite migration / health, run state machine, claim transaction, stale snapshot rejection, duplicate claim across SQLite connections, resource lock conflict / release, outbox idempotency, native stop / final response handling, non-success terminal downstream behavior, debug command and stable snapshot hashing.
- Node emitted `ExperimentalWarning: SQLite is an experimental feature`; this is expected because WI-02 intentionally uses Node's `node:sqlite` runtime.

### 2. Full repo regression

```bash
npm run test:regression
```

Result: **PASS**

Evidence summary:

- 30 tests passed.
- Existing Legion CLI, OpenCode / OpenClaw setup lifecycle, npm pack dry-run and skill surface tests remain green.
- The new scheduler tests also ran under the full regression suite.

### 3. Debug service smoke

```bash
npm run scheduler:debug -- health --db :memory:
```

Result: **PASS**

Observed output included:

```json
{
  "ok": true,
  "dbPath": ":memory:",
  "tables": [
    "native_outbox",
    "resource_locks",
    "run_attempts",
    "runs",
    "scheduler_events",
    "webhook_events",
    "work_item_snapshots"
  ],
  "activeRuns": 0,
  "pendingOutbox": 0
}
```

### 4. Whitespace check

```bash
git diff --check
```

Result: **PASS**

## Acceptance coverage

| Acceptance | Evidence |
|---|---|
| Local scheduler service can start and connect to SQLite | `npm run scheduler:debug -- health --db :memory:` PASS |
| Migration creates all core tables | `SQLite migration creates WI-02 core tables and service health` test PASS |
| Claim API creates only one active run | `duplicate claim across SQLite connections creates only one active run` test PASS |
| Claim-time snapshot revalidation rejects stale ready result | `claim rejects stale ready snapshots before creating active runs` test PASS |
| Claim success creates attempt, locks, events and outbox | `claim transaction creates run, attempt, resource locks, event timeline and outbox jobs` test PASS |
| Native / worker outbox is idempotent | `native outbox is idempotent by key and can mark dispatch sent` test PASS |
| Native stop / cancel uses DB state and outbox | `native stop records cancel state and idempotent final response outbox` test PASS |
| Resource lock acquisition / release | `resource locks conflict until released` test PASS |
| Illegal run transitions rejected | `run state machine accepts only centralized legal transitions` test PASS |
| Non-success terminal states do not release downstream by default | `non-success terminal runs do not satisfy blockers without admin override audit` test PASS |
| Event log can rebuild run timeline | claim transaction test asserts `claimed` event timeline |
| Existing repo behavior unaffected | `npm run test:regression` PASS |

## Skipped / deferred validation

- Real Linear API, GitHub PR tracking, webhook HTTP server and OpenCode worker launch were intentionally not tested because they are outside WI-02 and belong to WI-03 / WI-04 / WI-05 / WI-07.
- Production database benchmarking was not run. WI-02 is a SQLite local durable-state implementation; future production DB migration must preserve the repository and outbox semantics documented in `scheduler-core-sqlite.md`.
