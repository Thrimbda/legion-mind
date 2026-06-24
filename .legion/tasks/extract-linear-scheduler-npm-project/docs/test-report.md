# Test Report: Extract Linear Scheduler into an Independent npm Project

## Summary

**Result**: PASS

The validation focused on the current change claims: scheduler is now a standalone npm project, its own tests still pass after path migration, the debug CLI still starts, root regression tests still pass after removing scheduler from root scripts, and the root npm package dry-run does not include the new `scheduler/` project.

## Commands Run

### 1. Standalone scheduler tests

```bash
npm --prefix scheduler test
```

**Result**: PASS

- 12 tests passed.
- Covers SQLite migrations, state transitions, claim transaction, stale snapshot rejection, duplicate active-run protection, resource locks, native outbox idempotency, native stop handling, downstream satisfaction gates, debug command smoke, and stable hashing.

### 2. Standalone scheduler health smoke

```bash
npm --prefix scheduler run health -- --db :memory:
```

**Result**: PASS

- Debug CLI started from `scheduler/src/cli.ts`.
- Health output reported `ok: true`, `dbPath: ":memory:"`, all seven WI-02 core tables, `activeRuns: 0`, and `pendingOutbox: 0`.

### 3. Root regression tests

```bash
npm run test:regression
```

**Result**: PASS

- 18 tests passed.
- Confirms removing scheduler-specific tests from root `tests/regression/` did not break the root package regression suite.

### 4. Root package dry-run

```bash
npm run pack:dry-run
```

**Result**: PASS

- Root package dry-run completed successfully.
- Output package file list did not include `scheduler/`, confirming the standalone scheduler project is not accidentally published as part of the root `lgmind` package.
- NPM emitted the existing warning: `gitignore-fallback No .npmignore file found`; this is not introduced by the scheduler extraction.

### 5. Diff whitespace check

```bash
git diff --check
```

**Result**: PASS

- No whitespace errors reported.

## Why These Commands

- `npm --prefix scheduler test` is the direct evidence for the migrated scheduler project because tests now live and run inside `scheduler/`.
- `npm --prefix scheduler run health -- --db :memory:` proves the debug CLI still works after moving out of root `scripts/`.
- `npm run test:regression` checks that root project behavior remains intact after removing root scheduler scripts and root scheduler regression file.
- `npm run pack:dry-run` directly validates the packaging boundary: scheduler is no longer part of the root `lgmind` npm package artifact.
- `git diff --check` catches formatting/whitespace issues before review.

## Skipped / Not Run

- No real Linear, GitHub, OpenCode worker, or webhook integration was run; those are outside this task and remain future WI scope.
- No package manager workspace install was run; this task intentionally avoids introducing a monorepo/workspace manager.
