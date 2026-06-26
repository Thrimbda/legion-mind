## Summary

- Add a sandbox-first production acceptance runbook for the Linear + Legion Scheduler.
- Add scheduler acceptance checklist, sops/age secret handling runbook, Linear/GitHub sandbox setup runbooks, evidence templates and placeholder secret schema.
- Add fake project and PR scenario fixtures, then update README/docs links and fixture paths.

## Verification

- `npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:` — PASS
- `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4` — PASS
- `npm --prefix scheduler run health -- --db :memory:` — PASS
- `npm --prefix scheduler test` — PASS, 57/57

## Notes

- No scheduler runtime code changed.
- No live acceptance was executed.
- No real secrets were added.
- The docs keep current production blockers explicit: native writeback adapter, live project dispatch and packaged webhook/outbox runner are still missing.
