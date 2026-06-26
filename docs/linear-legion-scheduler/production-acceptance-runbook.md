# Linear + Legion Scheduler Production Acceptance Runbook

## Purpose

This runbook prepares and guides a **sandbox-first production-like acceptance** of the Linear + Legion Scheduler. It is not a production launch checklist by itself.

The goal is to expose real integration gaps safely:

- Linear live project read behavior.
- GitHub live PR read behavior.
- Scheduler DB state, snapshots, events and outbox behavior.
- Known missing production capabilities that must remain visible as blockers.

## Current Acceptance Boundary

Current state from `accept-linear-scheduler-overall`:

- Local prototype: accepted.
- Production unattended scheduler: not accepted.
- Required posture: sandbox first, staged, manually reviewed, no direct production queue execution.

## Critical Current Blockers

These are expected blockers and must not be hidden during acceptance:

- No production Linear native writeback adapter is implemented yet. Native AgentSession / delegate / activity / plan / state / label / comment writes are outbox contracts only.
- No live `dispatch project` command exists. `dispatch fixture` can claim fixture WIs, but live Linear project dispatch is not implemented.
- No packaged webhook server / outbox runner exists. `webhook.ts` provides primitives but not a production service wrapper.
- `worker dispatch` is real and launches OpenCode; it must only be used on explicit sandbox runs.
- `scan project` and `delivery track` are not pure read-only: they read external systems but write scheduler DB state.

## Secret Handling Policy

Use repo-local encrypted secrets only:

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project --project "$LINEAR_PROJECT_ID" --db "$SCHEDULER_DB"'
```

Rules:

- Use `sops` YAML encrypted with `age`.
- Do not decrypt to plaintext files.
- Do not commit real secret files.
- Commit only placeholder schema examples.
- Keep all DB, prompt, log and evidence artifacts under repo-local paths such as `.cache/linear-scheduler/`.

See `scheduler/docs/runbooks/secrets-sops.md`.

## Acceptance Stages

### Stage 0: Local Baseline

Purpose: prove the local package still matches the accepted prototype baseline.

Commands:

```bash
npm --prefix scheduler test
npm --prefix scheduler run health -- --db :memory:
npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

Pass criteria:

- Scheduler tests pass.
- Fixture scan reports the expected ready/skipped/cycle-free shape.
- Fixture dispatch claims only non-conflicting WIs and reports lock/blocker waits.

Stop criteria:

- Any local regression fails.
- Fixture output contradicts expected scheduler semantics.

### Stage 1: Create Sandbox Resources

Purpose: create safe external resources before any live adapter check.

Prepare:

- Linear sandbox project and labels.
- GitHub sandbox repo and PR scenarios.
- Encrypted `secrets/linear-scheduler.sops.yaml` with sandbox-only credentials.
- Repo-local scheduler DB path, for example `.cache/linear-scheduler/production-acceptance-sandbox.sqlite`.

See:

- `scheduler/docs/runbooks/linear-sandbox-setup.md`
- `scheduler/docs/runbooks/github-sandbox-setup.md`
- `scheduler/docs/templates/secrets.linear-scheduler.sops.yaml`

Pass criteria:

- Sandbox resources exist and are documented in the evidence template.
- Credentials are encrypted and injectable with `sops exec-env`.
- No production project/repo/token is used.

### Stage 2: Live Linear Read-Path Scan

Purpose: validate real Linear project read behavior without claiming workers or writing Linear.

Command:

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project --project "$LINEAR_PROJECT_ID" --db "$SCHEDULER_DB" --delegate "$LINEAR_DELEGATE_APP_USER_ID" --scheduler-run-url-base "$SCHEDULER_RUN_URL_BASE"'
```

Notes:

- This reads Linear and writes `work_item_snapshots` to scheduler DB.
- It does not claim runs, start workers, set delegates, create AgentSessions or write Linear labels/comments.

Pass criteria:

- Ready/skipped/waiting interpretations match the sandbox issue design.
- `agent:needs-human`, dependency blockers, risk/repo/contract gaps and manual Done cases are classified correctly.
- No Linear write side effects occur.

Stop criteria:

- Unknown labels/states make the result ambiguous.
- Ready candidates include issues that should be gated.
- Linear API auth requires broader privileges than expected.

### Stage 3: Fixture Dispatch / Lock Baseline

Purpose: validate dispatch semantics without live Linear dispatch.

Command:

```bash
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

Pass criteria:

- Non-conflicting ready WIs are claimed.
- Resource conflicts stay waiting.
- Blocked downstream WIs stay waiting/skipped.
- No worker launches occur.

Known blocker:

- Live project dispatch remains unimplemented. Do not infer live dispatch readiness from fixture dispatch alone.

### Stage 4: Live GitHub PR Read-Path Tracking

Purpose: validate real GitHub PR read behavior and scheduler delivery decisions.

Command:

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- delivery track --run "$SCHEDULER_RUN_ID" --repo "$SCHEDULER_REPO_PATH" --pr-url "$GITHUB_OPEN_PR_URL" --db "$SCHEDULER_DB"'
```

Notes:

- This reads GitHub and writes scheduler DB delivery state.
- It enqueues Linear native writeback rows but does not send them because no production native adapter exists.

Pass criteria:

- Open/draft/pending PRs do not become Done.
- Checks failure and review changes requested become blocked.
- Closed-unmerged becomes terminal non-success.
- Merged PR still requires Legion evidence and lifecycle evidence.

Stop criteria:

- GitHub token scope is broader than needed.
- Branch protection/review/check interpretation is ambiguous.
- Any non-merged or evidence-missing PR is considered terminal success.

### Stage 5: OpenCode Single-WI Sandbox E2E

Purpose: run one low-risk worker only after explicit manual approval and prerequisite rows exist.

Command shape:

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- worker dispatch --run "$SCHEDULER_RUN_ID" --attempt "$SCHEDULER_ATTEMPT_ID" --repo "$SCHEDULER_REPO_PATH" --db "$SCHEDULER_DB" --timeout-ms 3600000'
```

Entry criteria:

- Run and attempt exist in scheduler DB.
- Native startup outbox rows are already sent or explicitly bypassed in a sandbox-only way.
- Target WI is low risk, reversible and approved for sandbox execution.
- Operator has confirmed no production repo or production Linear issue is affected.

Stop criteria:

- Worker receives unintended secrets.
- Worker modifies non-sandbox scope.
- Worker produces PR-only evidence or missing Legion evidence.
- Native stop/cancel does not halt side effects safely.

Known blocker:

- Production native writeback and live dispatch are not part of current scheduler capabilities.

### Stage 6: Go / No-Go Review

Use `scheduler/docs/templates/acceptance-evidence.md` for evidence capture.

Possible decisions:

- `PASS: sandbox read-path only` - live scan/tracking works, but production blockers remain.
- `BLOCKED: missing runtime capability` - expected for native writeback, live dispatch or webhook service.
- `FAIL: unsafe behavior` - any wrong downstream unlock, wrong Done, duplicate run, secret leak or uncontrolled side effect.

Production candidate requires all blockers to be closed in separate implementation tasks.

## Emergency Stop Conditions

Pause or stop immediately if any condition occurs:

- Duplicate active run for the same Linear issue or task id.
- Linear Done / downstream unlock without `run_terminal_success`.
- Open PR, failed checks or missing evidence marked Done.
- Worker touches non-sandbox repo/branch/issue.
- Secrets appear in logs, DB output or evidence.
- Native writeback duplicates comments/activities or writes to production project.
- Pending outbox grows without operator understanding.
- Admin lock release would affect a non-terminal live worker.

## Rollback / Cleanup

- Pause sandbox project controls before investigation.
- Preserve DB and artifacts for evidence unless they contain secrets.
- Cancel or terminalize sandbox runs with explicit reason.
- Release locks only after confirming no worker side effects are active.
- Close abandoned sandbox PRs with reason.
- Remove or rotate any token suspected of exposure.
