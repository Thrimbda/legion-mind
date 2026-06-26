# Tasks

## Current Status

- Phase: implementation
- Overall status: in progress

## Checklist

- [x] Confirm sandbox-first, sops YAML, age and `sops exec-env` constraints
- [x] Create isolated worktree
- [x] Materialize Legion task contract
- [x] Add production acceptance runbook
- [x] Add scheduler checklist/runbooks/templates
- [x] Add missing fixture(s) and README/index links
- [x] Run local no-secret verification
- [x] Write test report
- [x] Review deliverables
- [x] Generate walkthrough and PR body
- [x] Complete wiki writeback
- [ ] Complete PR lifecycle

## Verification Commands Planned

- `npm --prefix scheduler test`
- `npm --prefix scheduler run health -- --db :memory:`
- `npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:`
- `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4`

Additional JSON/markdown sanity checks may be added if needed.
