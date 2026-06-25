# Linear + Legion Scheduler

This directory is a standalone npm project for the Linear + Legion scheduler prototype. It is intentionally separate from the root `lgmind` package so scheduler runtime code does not live under root `scripts/` and is not published as part of the root package.

## Layout

| Path | Purpose |
|---|---|
| `src/cli.ts` | Minimal debug command for health, run listing and event timeline inspection |
| `src/scanner.ts` | Linear project snapshot adapter, dependency graph, ready/skipped scanner and dry-run report |
| `src/state-machine.ts` | Central run state machine and terminal-state helpers |
| `src/sqlite-store.ts` | SQLite migrations, repository APIs, claim transaction, locks, outbox and debug service |
| `src/task-id.ts` | Deterministic Linear identifier to Legion task id mapping |
| `src/worker-runner.ts` | OpenCode-only worker prompt, native startup processing, launcher, result parser and Legion evidence verifier |
| `src/pr-tracker.ts` | GitHub PR snapshot adapter, PR delivery decision mapping and Linear native writeback outbox enqueueing |
| `src/resource-locks.ts` | Resource lock parser, canonical key derivation and conflict matrix |
| `src/dispatcher.ts` | Parallel dispatcher planning/execution with capacity limits, waiting visibility and stale lock hooks |
| `src/retry-policy.ts` | Failure taxonomy, retry classification and deterministic bounded backoff |
| `src/recovery.ts` | Stale active run detection, worker liveness probe boundary and retry/terminal recovery executor |
| `src/webhook.ts` | Linear webhook raw-body signature verification, dedupe persistence, event routing and optional Node HTTP handler |
| `tests/linear-scheduler-core.test.ts` | Scheduler core regression tests |
| `tests/linear-graph-scanner.test.ts` | Scanner graph, terminal blocker, skipped reason and dry-run CLI tests |
| `tests/linear-worker-runner.test.ts` | Worker runner prompt, native outbox, fake OpenCode launch, cancel and evidence verifier tests |
| `tests/linear-pr-tracker.test.ts` | PR state mapping, terminal gate, Linear writeback idempotency and fixture CLI tests |
| `tests/linear-dispatcher.test.ts` | Resource lock parser, fair scheduling and parallel dispatcher regression tests |
| `tests/linear-reliability.test.ts` | Webhook signature/dedupe, retry policy, native stop and stale recovery regression tests |

## Commands

Run from the repository root with `--prefix`:

```bash
npm --prefix scheduler test
npm --prefix scheduler run health -- --db :memory:
npm --prefix scheduler run debug -- runs list --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- scan fixture --fixture scheduler/tests/fixtures/project.json --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- scan project --project <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- dispatch fixture --fixture scheduler/tests/fixtures/project.json --db .cache/linear-scheduler/dev.sqlite --parallel-repos legion-mind --global-concurrency 4
npm --prefix scheduler run debug -- worker dispatch --run <run-id> --attempt <attempt-id> --repo <repo-path> --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- delivery track --run <run-id> --repo <repo-path> --pr-url <github-pr-url> --db .cache/linear-scheduler/dev.sqlite
```

Or run inside this directory:

```bash
npm test
npm run health -- --db :memory:
npm run debug -- events list --run <run-id> --db .cache/linear-scheduler/dev.sqlite
npm run debug -- scan project --project <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
npm run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/dev.sqlite --parallel-repos legion-mind --global-concurrency 4
npm run debug -- worker dispatch --run <run-id> --attempt <attempt-id> --repo <repo-path> --db .cache/linear-scheduler/dev.sqlite
npm run debug -- delivery track --run <run-id> --repo <repo-path> --fixture scheduler/tests/fixtures/pr-open.json --db .cache/linear-scheduler/dev.sqlite
```

`scan project` reads Linear through the official GraphQL API using `LINEAR_API_KEY` by default. It only persists `work_item_snapshots` and prints a dry-run report; it does not claim runs, start workers, set delegates, create AgentSessions or write Linear labels/comments.

`worker dispatch` consumes one pending `worker_dispatch` outbox row and launches OpenCode non-interactively with a generated prompt artifact. It refuses to launch until native startup outbox rows for the run are sent, passes only the prompt artifact path through argv, allowlists the child environment, records heartbeat / attempt exit data, captures stdout/stderr to a repo-local `.cache/linear-scheduler/worker-logs/` artifact, parses the worker result block, and runs the scheduler-side Legion evidence verifier. It is intentionally OpenCode-only. A worker-reported `done` result now waits in `in_review` until PR delivery tracking verifies GitHub terminal state.

`delivery track` observes one GitHub PR snapshot through either a fixture or the GitHub REST adapter, updates the run delivery state, and enqueues idempotent Linear native writeback rows for PR external URL, AgentActivity, Agent Plan, coarse issue state/labels and final summary. It only marks `done` after PR merged + checks/review resolved + Legion evidence PASS + `git-worktree-pr` lifecycle complete.

`dispatch fixture` plans and claims multiple ready WIs under global/project/repo capacity limits and resource locks. It only writes scheduler DB rows/events/outbox jobs; it does not launch OpenCode workers by itself. Waiting items are reported as `waiting_for_lock`, `waiting_for_capacity`, or `waiting_for_blocker` and are not marked running.

The scheduler remains a local prototype. It connects to Linear for dry-run project scanning, can claim parallel non-conflicting fixture WIs, has a single-worker OpenCode runner path, PR delivery tracking, webhook ingestion primitives, bounded retry policy and stale-run recovery. It still does not implement production native Linear API adapters, metrics dashboards or admin/security hardening.
