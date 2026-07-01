# 任务摘要：run-scheduler-sandbox-acceptance

## 状态

- 日期：2026-07-01
- 结果：`BLOCKED`
- Raw evidence：`.legion/tasks/run-scheduler-sandbox-acceptance/`

## 摘要

执行了一次 Linear + Legion Scheduler sandbox-first production-like acceptance 的可用阶段。

本地和 fixture 基线全部通过：

- `npm --prefix scheduler test`：PASS，57/57。
- Health smoke：PASS。
- Fixture scan：PASS，ready 4、skipped 6、cycles 0。
- Fixture dispatch：PASS，claimed 2、waiting 3、未启动 worker。
- Stage 3 独立 DB fixture dispatch：PASS。

Live stages 被正确阻塞：

- `secrets/linear-scheduler.sops.yaml` 缺失，不能执行 `sops exec-env` live Linear scan / GitHub tracking。
- `age` CLI 不可用，需要安装或确认等价 sops age key access。
- 缺少 live `SCHEDULER_RUN_ID`，不能执行 Stage 4 `delivery track`。
- 缺少 explicit worker approval、run/attempt/outbox 前置状态，不能执行 Stage 5 `worker dispatch`。

## 当前有效结论

- 当前 scheduler 仍是 sandbox integration candidate，不是 production-ready unattended scheduler。
- 本次验收结果应记录为 `BLOCKED: missing sandbox/live prerequisites`，不是失败的本地 regression。
- 后续要继续 live 验收，operator 必须先提供 encrypted sandbox-only `secrets/linear-scheduler.sops.yaml`，并准备 live run row / `SCHEDULER_RUN_ID`。
- Production blockers 仍保持：production native writeback adapter、live `dispatch project`、packaged webhook server / outbox runner。

## 验证证据

- `.legion/tasks/run-scheduler-sandbox-acceptance/docs/acceptance-evidence.md`
- `.legion/tasks/run-scheduler-sandbox-acceptance/docs/test-report.md`
- `.legion/tasks/run-scheduler-sandbox-acceptance/docs/review-change.md`
