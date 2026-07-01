# 交付说明：Linear Scheduler Sandbox 验收执行

## 模式

Implementation / evidence-only。未修改 runtime code。

## 交付内容

- 新增验收 task：`.legion/tasks/run-scheduler-sandbox-acceptance/`。
- 写入 acceptance evidence：`docs/acceptance-evidence.md`。
- 写入 test report：`docs/test-report.md`。
- 写入 delivery review：`docs/review-change.md`。

## 验收结果

最终结论：`BLOCKED`。

本地可执行阶段全部通过：

- Scheduler tests：57/57。
- Health smoke：PASS。
- Fixture scan：PASS。
- Fixture dispatch：PASS。
- Stage 3 fixture dispatch baseline：PASS。

Live / worker stages 未执行，因为前置条件缺失：

- `secrets/linear-scheduler.sops.yaml` 缺失。
- `age` CLI 不可用，需要安装或确认 sops age key access 的等价方式。
- Stage 4 缺 live `SCHEDULER_RUN_ID` 证据。
- Stage 5 缺 explicit worker approval、run/attempt/outbox 前置状态和 secret 注入。

## 重要边界

- 没有运行 live Linear `scan project`。
- 没有运行 live GitHub `delivery track`。
- 没有运行 OpenCode `worker dispatch`。
- 没有使用或提交真实 secrets。
- 没有证明 production-ready。

## Reviewer 关注点

1. `BLOCKED` 是否准确表达 live prerequisites 缺失，而不是测试失败。
2. 本地 PASS 证据是否足够支持当前 package/fixture baseline。
3. 是否没有泄露 secret 或误用 production resources。
4. 是否继续保留 production blockers：native writeback adapter、live `dispatch project`、packaged webhook server / outbox runner。
