# Test Report: WI-07 webhooks, retries, and stale recovery

## Result

PASS

## Verification command

```bash
npm --prefix scheduler test
```

## Execution details

- **Worktree**: `.worktrees/linear-0xc-62-webhooks-retry-recovery`
- **Runtime**: Node test runner with `--experimental-strip-types --experimental-sqlite` via `scheduler/package.json`
- **Result summary**: 50 tests passed, 0 failed, 0 skipped. The suite was re-run after review found and fixed retry dispatch context preservation.
- **Observed warnings**: Node emitted expected experimental SQLite warnings; no test failures or skipped coverage resulted from them.

## Why this command was chosen

`npm --prefix scheduler test` is the strongest direct validation for this change because WI-07 modifies only the standalone scheduler package and its scheduler-local docs. The scheduler test suite covers existing scanner, store, dispatcher, worker runner and PR tracker behavior, and the new `scheduler/tests/linear-reliability.test.ts` adds focused coverage for WI-07 acceptance criteria.

## Coverage mapped to acceptance

| Acceptance | Evidence |
|---|---|
| Webhook signature verification uses raw body | `Linear webhook signature uses raw body and timestamp replay window` verifies HMAC over raw bytes and mutated-body failure. |
| AgentSessionEvent created/prompted/stopped/delegated enter dedupe + outbox, not direct launch | `AgentSessionEvent webhooks dedupe and enqueue outbox without claiming workers`; `AgentSessionEvent stopped requests native stop and does not satisfy downstream`. |
| Duplicate webhook does not duplicate scheduling | Duplicate ingest returns no-op and scheduler outbox count remains unchanged. |
| Webhook/order remains reconcile-driven | Webhook routing enqueues `reconcile_project` / scheduler outbox rows and tests assert no run is claimed. |
| Retry policy varies by failure type | `retry taxonomy distinguishes retryable, conditional, non-retryable and control signals`. |
| Worker stale does not create duplicate active run | `worker timeout schedules bounded retry without creating a second active run`; stale recovery tests keep one active run. |
| Stale lock release requires terminal/dead/admin | `resource locks conflict until released` asserts unsafe non-terminal release fails; stale recovery terminal release requires confirmed-dead worker. |
| Native stop cancels/terminal non-success and downstream stays locked | Native stop tests assert `cancelled`, `native_stop_requested`, locks released, and `isBlockerSatisfiedByRun()` returns `run_terminal_non_success`. |

## Commands run during implementation

```bash
git status --short && git diff --stat && npm --prefix scheduler test
```

The final command produced the same PASS result: 50/50 scheduler tests passed.

## Failures / skipped items

- Failures: none.
- Skipped items: none.
- Out-of-scope validation not run: root package regression tests, because this change is confined to `scheduler/` runtime/tests plus scheduler design docs.
