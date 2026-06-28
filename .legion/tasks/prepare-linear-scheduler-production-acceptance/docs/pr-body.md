## 摘要

- 新增 Linear + Legion Scheduler 的 sandbox-first production acceptance runbook。
- 新增 scheduler acceptance checklist、sops/age secret handling runbook、Linear/GitHub sandbox setup runbooks、evidence templates 和 placeholder secret schema。
- 新增 fake project 与 PR scenario fixtures，并更新 README/docs links 与 fixture paths。

## 验证

- `npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:` — PASS
- `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4` — PASS
- `npm --prefix scheduler run health -- --db :memory:` — PASS
- `npm --prefix scheduler test` — PASS, 57/57

## 说明

- 未修改 scheduler runtime code。
- 未执行 live acceptance。
- 未新增真实 secrets。
- Docs 明确保留当前 production blockers：native writeback adapter、live project dispatch、packaged webhook/outbox runner 仍缺失。
