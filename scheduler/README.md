# Linear + Legion Scheduler

This directory is a standalone npm project for the Linear + Legion scheduler prototype. It is intentionally separate from the root `lgmind` package so scheduler runtime code does not live under root `scripts/` and is not published as part of the root package.

## Layout

| Path | Purpose |
|---|---|
| `src/cli.ts` | Minimal debug command for health, run listing and event timeline inspection |
| `src/scanner.ts` | Linear project snapshot adapter, dependency graph, ready/skipped scanner and dry-run report |
| `src/state-machine.ts` | Central run state machine and terminal-state helpers |
| `src/sqlite-store.ts` | SQLite migrations, repository APIs, claim transaction, locks, outbox and debug service |
| `tests/linear-scheduler-core.test.ts` | Scheduler core regression tests |
| `tests/linear-graph-scanner.test.ts` | Scanner graph, terminal blocker, skipped reason and dry-run CLI tests |

## Commands

Run from the repository root with `--prefix`:

```bash
npm --prefix scheduler test
npm --prefix scheduler run health -- --db :memory:
npm --prefix scheduler run debug -- runs list --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- scan fixture --fixture scheduler/tests/fixtures/project.json --db .cache/linear-scheduler/dev.sqlite
npm --prefix scheduler run debug -- scan project --project <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
```

Or run inside this directory:

```bash
npm test
npm run health -- --db :memory:
npm run debug -- events list --run <run-id> --db .cache/linear-scheduler/dev.sqlite
npm run debug -- scan project --project <linear-project-id> --db .cache/linear-scheduler/dev.sqlite
```

`scan project` reads Linear through the official GraphQL API using `LINEAR_API_KEY` by default. It only persists `work_item_snapshots` and prints a dry-run report; it does not claim runs, start workers, set delegates, create AgentSessions or write Linear labels/comments.

The scheduler remains a local prototype. It now connects to Linear for dry-run project scanning, but it still does not connect to GitHub or OpenCode workers yet.
