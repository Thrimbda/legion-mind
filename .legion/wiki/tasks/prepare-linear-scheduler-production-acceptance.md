# Task Summary: prepare-linear-scheduler-production-acceptance

## 状态

- 日期：2026-06-26
- 结果：已交付 production-like acceptance preparation package
- Raw evidence：`.legion/tasks/prepare-linear-scheduler-production-acceptance/`

## 摘要

为 Linear + Legion Scheduler 准备了一套 sandbox-first 的 production-like acceptance package。

交付内容：

- 主 runbook：`docs/linear-legion-scheduler/production-acceptance-runbook.md`
- Scheduler checklist：`scheduler/docs/production-acceptance-checklist.md`
- 基于 sops YAML + age + `sops exec-env` 的 secret handling runbook
- Linear 和 GitHub sandbox setup runbooks
- Acceptance evidence template 和 sandbox issue template
- 只含 placeholder 的 secret schema template
- Fake project fixture 和 PR scenario fixtures
- README / docs index links 与 fixture path corrections

## Durable Conclusions

- Production-like acceptance 必须保持 sandbox-first 且分阶段执行。
- 真实 secrets 应保存为 `secrets/linear-scheduler.sops.yaml`，用 sops + age 加密，并通过 `sops exec-env` 注入；plaintext secrets 不应落盘。
- 现有 live-read 能力是 Linear `scan project` 和 GitHub `delivery track --pr-url`；两者都会写 scheduler DB state，并不是纯只读。
- 当前 expected blockers 仍然存在：无 production Linear native writeback adapter、无 live `dispatch project`、无 packaged webhook server/outbox runner。
- README fixture path 漂移已通过新增 `scheduler/tests/fixtures/project.json` 和在 `npm --prefix scheduler` 命令中使用 `tests/fixtures/...` 修正。

## Verification

- Fixture scan：PASS。
- Fixture dispatch：PASS。
- Health smoke：PASS。
- `npm --prefix scheduler test`：PASS, 57/57。
