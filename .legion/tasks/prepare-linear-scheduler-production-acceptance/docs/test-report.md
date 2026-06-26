# Test Report: Prepare Linear Scheduler Production Acceptance

## Verdict

PASS for local no-secret validation.

No live Linear, GitHub, OpenCode or secret-backed acceptance was executed in this task.

## Commands Executed

### Fixture scanner smoke

```bash
npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:
```

Result: PASS

Key observed behavior:

- Ready: `SBOX-READY`, `SBOX-BLOCKED-BY-MANUAL`, `SBOX-LOCK-A`, `SBOX-LOCK-B`.
- Skipped: `SBOX-CONTRACT-MISSING`, `SBOX-DEPENDENCY-BLOCKED`, `SBOX-MANUAL-DONE`, `SBOX-NEEDS-HUMAN`, `SBOX-RISK-MISSING`, `SBOX-UPSTREAM-ACTIVE`.
- Cycles: none.

### Fixture dispatcher smoke

```bash
mkdir -p .cache/linear-scheduler
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db ../.cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

Result: PASS

Key observed behavior:

- Claimed: `SBOX-READY`, `SBOX-BLOCKED-BY-MANUAL`.
- Waiting for lock: `SBOX-LOCK-A`, `SBOX-LOCK-B` on `area:legion-mind/api`.
- Waiting for blocker: `SBOX-DEPENDENCY-BLOCKED`.
- No workers were launched.

### Health smoke

```bash
npm --prefix scheduler run health -- --db :memory:
```

Result: PASS

Observed health included `ok: true`, core scheduler tables, `activeRuns: 0`, `pendingOutbox: 0` and `projectControls: 0`.

### Full scheduler regression

```bash
npm --prefix scheduler test
```

Result: PASS

Summary:

```text
tests 57
pass 57
fail 0
duration_ms 908.886944
```

Final pre-commit rerun:

```text
tests 57
pass 57
fail 0
duration_ms 368.276162
```

### Path verification

Initial scanner smoke using `scheduler/tests/fixtures/project.json` failed because `npm --prefix scheduler` executes the script with scheduler package path context. The current docs and README now use `tests/fixtures/project.json` for `npm --prefix scheduler` commands.

Current grep found no new README/runbook references to the old path; remaining matches are historical task evidence or wiki maintenance notes.

## Not Executed

- `scan project` against real Linear sandbox.
- `delivery track --pr-url` against real GitHub sandbox.
- `worker dispatch` against real OpenCode.
- Native Linear writeback.
- Webhook server / outbox runner.

These remain live/manual stages for the future acceptance runbook.

## Artifacts Added

- `docs/linear-legion-scheduler/production-acceptance-runbook.md`
- `scheduler/docs/production-acceptance-checklist.md`
- `scheduler/docs/runbooks/secrets-sops.md`
- `scheduler/docs/runbooks/linear-sandbox-setup.md`
- `scheduler/docs/runbooks/github-sandbox-setup.md`
- `scheduler/docs/templates/acceptance-evidence.md`
- `scheduler/docs/templates/linear-sandbox-issues.md`
- `scheduler/docs/templates/secrets.linear-scheduler.sops.yaml`
- `scheduler/tests/fixtures/project.json`
- PR scenario fixtures under `scheduler/tests/fixtures/`
