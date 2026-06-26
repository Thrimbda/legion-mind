# Prepare Linear Scheduler Production Acceptance

## Contract

- **Name**: Prepare Linear Scheduler Production Acceptance
- **Task ID**: `prepare-linear-scheduler-production-acceptance`
- **Goal**: Prepare a sandbox-first production-like acceptance package for the Linear + Legion Scheduler so operators can safely expose live-read / integration gaps without accidentally treating the local prototype as production ready.
- **Problem**: The scheduler has passed local prototype acceptance, but production rollout remains blocked by unproven live Linear/GitHub/OpenCode behavior, missing native writeback adapter, missing live project dispatch and missing packaged webhook/server runner. The next step needs precise runbooks, templates, secrets handling and fixtures so the live acceptance can be run safely later.

## Acceptance Criteria

1. Add a production acceptance runbook that states sandbox-first policy, staged acceptance flow, stop/go criteria and known current blockers.
2. Add scheduler-local checklist/runbooks/templates for sops/age secrets, Linear sandbox setup, GitHub sandbox setup and evidence capture.
3. Add placeholder-only secret schema for `secrets/linear-scheduler.sops.yaml` using sops YAML + age + `sops exec-env`.
4. Add or repair committed fixtures so README scan/dispatch fixture commands refer to real files.
5. Update scheduler README and Linear scheduler docs index with links and accurate safety notes.
6. Verify local no-secret paths: markdown/JSON sanity, scheduler regression, fixture scan/dispatch smoke where feasible.
7. Do not implement missing production runtime capabilities, run live acceptance, or commit real secrets.

## Scope

- `docs/linear-legion-scheduler/production-acceptance-runbook.md`
- `docs/linear-legion-scheduler/index.md`
- `scheduler/README.md`
- `scheduler/docs/production-acceptance-checklist.md`
- `scheduler/docs/runbooks/**`
- `scheduler/docs/templates/**`
- `scheduler/tests/fixtures/**`
- Task-local Legion evidence under `.legion/tasks/prepare-linear-scheduler-production-acceptance/**`
- Wiki writeback under `.legion/wiki/**`

## Non-goals

- No live production or sandbox acceptance execution in this task.
- No real Linear/GitHub/OpenCode credential creation or decryption.
- No committed encrypted secret instance containing real credentials.
- No Linear native writeback adapter implementation.
- No live `dispatch project` implementation.
- No webhook server/outbox daemon implementation.
- No OpenCode worker dispatch behavior changes.
- No claim that sandbox acceptance equals production readiness.

## Assumptions

- User confirmed sandbox-first acceptance.
- User will manage real credentials under repo-local `secrets/` using sops YAML encrypted with age.
- Acceptance commands should use `sops exec-env` so plaintext credentials do not land on disk.
- Missing runtime capabilities should be documented as expected blockers rather than silently worked around.

## Constraints

- All implementation happens in `.worktrees/prepare-linear-scheduler-production-acceptance/`.
- Persistent artifacts and temporary acceptance outputs must stay repo-local.
- Secret templates must contain placeholders only.
- Docs must distinguish external read + DB write from true read-only behavior.

## Risks

- Runbooks can become dangerous if they imply `scan project` or `delivery track` are pure read-only; both write scheduler DB state.
- Operators may mistake fixture dispatch for live dispatch; docs must state live `dispatch project` is not implemented.
- Native writeback and webhook packaging gaps are production blockers; they should be visible in the checklist.
- README examples currently reference missing fixtures and path contexts; this task should fix that drift.

## Design Summary

- Build a documentation-first acceptance package, supported by committed fake fixtures.
- Keep a single top-level production acceptance runbook as the reviewer/operator entry point.
- Put operational details under `scheduler/docs/runbooks/` and reusable capture forms under `scheduler/docs/templates/`.
- Keep `scheduler/README.md` concise and link to the deeper runbooks.
- Validate with local tests and fixture commands only; leave live acceptance as a future operator action using encrypted secrets.

## Phases

1. Materialize task docs and open worktree.
2. Add production acceptance runbook, checklist, runbooks and templates.
3. Add fake project fixture and optional PR fixtures; update README/docs links.
4. Run local verification and fix documentation/fixture issues.
5. Produce test report, review, walkthrough and wiki writeback.
6. Complete PR lifecycle.
