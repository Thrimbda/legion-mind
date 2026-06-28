# 交付说明：准备 Linear Scheduler 生产验收

## 模式

文档 / fixture 交付，带实现链路验证证据。未修改 scheduler runtime code。

## 改了什么

- 新增 top-level production acceptance runbook：`docs/linear-legion-scheduler/production-acceptance-runbook.md`。
- 新增 scheduler-local acceptance assets：
  - `scheduler/docs/production-acceptance-checklist.md`
  - `scheduler/docs/runbooks/secrets-sops.md`
  - `scheduler/docs/runbooks/linear-sandbox-setup.md`
  - `scheduler/docs/runbooks/github-sandbox-setup.md`
  - `scheduler/docs/templates/acceptance-evidence.md`
  - `scheduler/docs/templates/linear-sandbox-issues.md`
  - `scheduler/docs/templates/secrets.linear-scheduler.sops.yaml`
- 新增 fake fixture coverage：`scheduler/tests/fixtures/project.json`，以及 draft/failing/merged/closed PR fixtures。
- 更新 `scheduler/README.md` 和 `docs/linear-legion-scheduler/index.md`，引导 operator 使用 acceptance package，并看见当前 blockers。
- 修正 `npm --prefix scheduler` command context 下的 fixture path examples。

## Reviewer 重点

这次只是准备 acceptance execution，不执行 production acceptance，也不实现缺失的 production capabilities。

Package 明确保留这些 blockers：

- 缺 production Linear native writeback adapter。
- 缺 live `dispatch project` command。
- 缺 packaged webhook server/outbox runner。
- 真实 OpenCode worker E2E 仍是后续 sandbox-only stage。

## 验证

- `scan fixture` + `tests/fixtures/project.json` — PASS。
- `dispatch fixture` + `tests/fixtures/project.json` — PASS。
- `health --db :memory:` — PASS。
- `npm --prefix scheduler test` — PASS, 57/57。
- `review-change` verdict — PASS。

## 建议 review 重点

1. 确认 runbook 没有暗示 production readiness。
2. 确认 commands 与现有 CLI capabilities 一致，并清楚标注 DB-mutating behavior。
3. 确认 secret templates 只含 placeholders。
4. 确认 fake fixtures 覆盖预期 sandbox cases。
