# Scheduler Production Acceptance Checklist

Use this checklist before and during sandbox-first production-like acceptance.

## 1. Preflight

- [ ] Acceptance owner named.
- [ ] Sandbox time window agreed.
- [ ] Repository is on expected branch/commit.
- [ ] Node version is `>=22.6.0`.
- [ ] `opencode` availability checked only if Stage 5 will run.
- [ ] Scheduler DB path is repo-local and sandbox-only.
- [ ] Operator understands that `--db <file>` can create/migrate SQLite files.

## 2. Secrets

- [ ] `sops` is installed.
- [ ] `age` private key is available outside the repo.
- [ ] `SOPS_AGE_KEY_FILE` or equivalent key access is configured.
- [ ] Real file is `secrets/linear-scheduler.sops.yaml` and is encrypted.
- [ ] Secret values are sandbox-only.
- [ ] Commands use `sops exec-env`; no plaintext secret file is created.
- [ ] Evidence redacts token, account and project identifiers when shared.

## 3. Linear Sandbox

- [ ] Sandbox team/project exists.
- [ ] Project ID/name/team key recorded.
- [ ] Required labels exist.
- [ ] Required issue scenarios exist.
- [ ] Blocker relations are set and manually checked.
- [ ] State names/types are known.
- [ ] No production project is used.

## 4. GitHub Sandbox

- [ ] Sandbox repo exists.
- [ ] Token is least-privilege and scoped to sandbox repo.
- [ ] Open PR scenario exists.
- [ ] Draft PR scenario exists or is documented as unavailable.
- [ ] Checks-failing PR scenario exists or is documented.
- [ ] Review changes-requested scenario exists or is documented.
- [ ] Merged PR scenario exists.
- [ ] Closed-unmerged PR scenario exists.
- [ ] No production repo is used.

## 5. Local Baseline

- [ ] `npm --prefix scheduler test` passes.
- [ ] `npm --prefix scheduler run health -- --db :memory:` passes.
- [ ] `scan fixture` with `tests/fixtures/project.json` passes from `npm --prefix scheduler` commands.
- [ ] `dispatch fixture` with `tests/fixtures/project.json` passes from `npm --prefix scheduler` commands.
- [ ] Results are attached to the evidence record.

## 6. Live Read-Path

- [ ] `scan project` runs via `sops exec-env` against sandbox project only.
- [ ] Ready/skipped output matches expected issue scenarios.
- [ ] `delivery track --pr-url` runs via `sops exec-env` against sandbox PR only.
- [ ] Open/pending PR does not become Done.
- [ ] Checks/review/closed/merged states match expected scheduler decisions.
- [ ] DB writes happen only at the selected sandbox DB path.

## 7. Known Blockers To Record

- [ ] Production Linear native writeback adapter missing.
- [ ] Live `dispatch project` missing.
- [ ] Packaged webhook server/outbox runner missing.
- [ ] Production metrics/exporter/retention not proven.
- [ ] Native stop/cancel cleanup-before-lock-release not proven for real workers.

## 8. Stop Conditions

- [ ] Duplicate active run observed.
- [ ] Downstream unlock without `run_terminal_success` observed.
- [ ] PR open/failed/missing evidence marked Done.
- [ ] Worker touches non-sandbox scope.
- [ ] Secret appears in logs/output/evidence.
- [ ] Operator cannot explain a running/waiting/blocked state.

If any item above is checked, stop acceptance and record `FAIL` or `BLOCKED`.

## 9. Signoff

| Field | Value |
|---|---|
| Date | |
| Operator | |
| Sandbox Linear project | |
| Sandbox GitHub repo | |
| Scheduler DB | |
| Final decision | PASS / FAIL / BLOCKED |
| Remaining blockers | |
| Owner for next action | |
