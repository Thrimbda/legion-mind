# Task Summary: prepare-linear-scheduler-production-acceptance

## Status

- Date: 2026-06-26
- Outcome: production-like acceptance preparation package delivered
- Raw evidence: `.legion/tasks/prepare-linear-scheduler-production-acceptance/`

## Summary

Prepared a sandbox-first production-like acceptance package for the Linear + Legion Scheduler.

Delivered:

- Main runbook: `docs/linear-legion-scheduler/production-acceptance-runbook.md`
- Scheduler checklist: `scheduler/docs/production-acceptance-checklist.md`
- Secret handling runbook for sops YAML + age + `sops exec-env`
- Linear and GitHub sandbox setup runbooks
- Acceptance evidence and sandbox issue templates
- Placeholder-only secret schema template
- Fake project fixture and PR scenario fixtures
- README / docs index links and fixture path corrections

## Durable Conclusions

- Production-like acceptance must remain sandbox-first and staged.
- Real secrets should be stored as `secrets/linear-scheduler.sops.yaml` encrypted with sops + age and injected with `sops exec-env`; plaintext secrets should not land on disk.
- Existing live-read capabilities are Linear `scan project` and GitHub `delivery track --pr-url`; both write scheduler DB state and are not pure read-only.
- Current expected blockers remain: no production Linear native writeback adapter, no live `dispatch project`, and no packaged webhook server/outbox runner.
- README fixture path drift was fixed by adding `scheduler/tests/fixtures/project.json` and using `tests/fixtures/...` under `npm --prefix scheduler` commands.

## Verification

- Fixture scan: PASS.
- Fixture dispatch: PASS.
- Health smoke: PASS.
- `npm --prefix scheduler test`: PASS, 57/57.
