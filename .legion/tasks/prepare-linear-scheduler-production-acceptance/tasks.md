# Tasks

## 当前状态

- Phase: closing
- Overall status: completed via PR #44

## 任务清单

- [x] 确认 sandbox-first、sops YAML、age 和 `sops exec-env` 约束
- [x] 创建隔离 worktree
- [x] 物化 Legion task contract
- [x] 添加 production acceptance runbook
- [x] 添加 scheduler checklist/runbooks/templates
- [x] 添加缺失 fixtures 并更新 README/index links
- [x] 运行本地无 secret 验证
- [x] 写入 test report
- [x] 完成 deliverables review
- [x] 生成 walkthrough / PR body
- [x] 完成 wiki writeback
- [x] 完成 PR lifecycle

## 已执行验证命令

- `npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:` — PASS
- `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4` — PASS
- `npm --prefix scheduler run health -- --db :memory:` — PASS
- `npm --prefix scheduler test` — PASS, 57/57
