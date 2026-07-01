# 变更审查：Linear Scheduler Sandbox 验收执行

## 结论

PASS for evidence delivery。

Acceptance result remains `BLOCKED`。

## Blocking Findings

None for this evidence-delivery change。

## 范围审查

- 实际变更只新增 `.legion/tasks/run-scheduler-sandbox-acceptance/**` 验收证据。
- 未修改 scheduler runtime code。
- 未提交真实 secrets。
- 未执行 live Linear / GitHub / OpenCode stages，因为前置条件缺失。
- 临时 SQLite DB 只写入 repo-local `.cache/linear-scheduler/`，未纳入提交。

## 正确性审查

- Stage 0 本地基线证据完整：tests、health、fixture scan、fixture dispatch 均 PASS。
- Stage 3 使用独立 DB 重跑 fixture dispatch，证明 lock / blocker baseline，不启动 worker。
- Stage 2 / 4 / 5 的 `BLOCKED` 结论符合 runbook：缺少 encrypted sandbox secret file、live `SCHEDULER_RUN_ID`、worker approval 和 run/attempt/outbox 前置状态时不得执行。
- 最终结论没有伪装为 production-ready；明确为 `BLOCKED`。

## 安全视角

已应用 security lens，因为本任务涉及 secret handling、sandbox credentials、live external reads、worker dispatch 和 potential writeback side effects。

未发现安全 blocker。相反，本次执行正确停止在缺失 secret/live prerequisites 处，没有绕过 `sops exec-env`、没有打印 token、没有运行 worker，也没有触碰 production resources。

## 验证证据

- `git diff --check` — PASS。
- `npm --prefix scheduler test` — PASS，57/57。
- `npm --prefix scheduler run health -- --db :memory:` — PASS。
- `npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:` — PASS。
- `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/acceptance-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4` — PASS。
- `npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/stage3-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4` — PASS。

## Acceptance Blockers

- `secrets/linear-scheduler.sops.yaml` missing。
- `age` CLI unavailable；operator should install `age` or confirm equivalent sops age key access。
- No live `SCHEDULER_RUN_ID` evidence for Stage 4。
- No explicit worker approval / run / attempt / outbox prerequisites for Stage 5。
- Expected production blockers remain: native writeback adapter, live `dispatch project`, packaged webhook server / outbox runner。
