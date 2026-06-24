# Linear + Legion Scheduler

This directory is a standalone npm project for the Linear + Legion scheduler prototype. It is intentionally separate from the root `lgmind` package so scheduler runtime code does not live under root `scripts/` and is not published as part of the root package.

## Layout

| Path | Purpose |
|---|---|
| `src/cli.ts` | Minimal debug command for health, run listing and event timeline inspection |
| `src/state-machine.ts` | Central run state machine and terminal-state helpers |
| `src/sqlite-store.ts` | SQLite migrations, repository APIs, claim transaction, locks, outbox and debug service |
| `tests/linear-scheduler-core.test.ts` | Scheduler core regression tests |

## Commands

Run from the repository root with `--prefix`:

```bash
npm --prefix scheduler test
npm --prefix scheduler run health -- --db :memory:
npm --prefix scheduler run debug -- runs list --db .cache/linear-scheduler/dev.sqlite
```

Or run inside this directory:

```bash
npm test
npm run health -- --db :memory:
npm run debug -- events list --run <run-id> --db .cache/linear-scheduler/dev.sqlite
```

The scheduler remains a local prototype for the WI-02 durable state boundary. It does not connect to real Linear, GitHub or OpenCode workers yet.
