# 撤销 PR 配额与 task 级硬限制 - 日志

## 会话进展 (2026-07-31)

### ✅ 已完成

- 用户明确指出上一轮修复错误：不应新增 PR 配额或 task 级硬限制。
- contract 已收敛为“移除 quota/binding；只保留不自动创建 post-terminal closeout/writeback PR”。
- 已从最新 `origin/master` 创建隔离 worktree 与 branch `codex/remove-pr-quota-enforcement-v1`。
- 独立 `review-rfc` 结论为 `PASS`；无 blocking finding。
- 已删除 Scheduler `task_pr_bindings` schema/migration/API、PR identity helper、worker binding gate 与 tracker compare-and-bind。
- 已恢复 `runs.pr_url` run-level metadata；fresh DB 无 binding table/migration 5/6，legacy DB 保留旧表但 runtime 忽略。
- 当前规范改为“不得自动创建 terminal status-writeback PR；用户明确授权后可使用新 PR”，并将旧 Wiki 决定标记为 superseded。
- 本地验证：Scheduler 70/70、根回归 48/48、context audit、package dry-run 与 `git diff --check` 全部通过。
- 独立 `verify-change` 结论为 `PASS`；fresh/legacy SQLite、显式后续 PR、terminal same-issue 与安全门反例均通过。

### 🟡 进行中

- 首轮独立 `review-change` 正确返回 `FAIL`：两处当前 Scheduler 文档仍保留 terminal binding gate；worker result 的无状态 PR URL / `externalUrls[]` 输入校验被误删。
- 已删除两处旧 binding/backfill 规范，恢复无状态 HTTPS PR URL 与 `externalUrls[]` shape 校验，并补 parser/policy 负向回归。
- 返修后 Scheduler 70/70、根回归 48/48、context audit、package dry-run、定向 parser/policy 22/22 与 `git diff --check` 全部通过。
- 新的独立 `verify-change` 结论为 `PASS`：定向 44/44、malformed ingress、terminal same-issue、fresh/legacy DB 与全部全量检查通过。
- 新的独立 `review-change` 结论为 `PASS`；首轮两个 P1 blocker 均已关闭且无新 blocker。
- durable Wiki 已更新为当前无 quota/binding、只禁止自动 status-writeback PR 的真相。
- `report-data.json` 已通过 schema/语义检查，并确定性生成 HTML、Markdown 与 PR body；当前 repo evidence 为 `delivery-ready`。

### ⚠️ 阻塞/待定

- 无。

## 关键决策

| 决策 | 原因 | 日期 |
| --- | --- | --- |
| 不做 task 级 PR 数量限制 | 用户明确否定该限制；原始问题是自动 closeout PR，不是用户 PR 权限 | 2026-07-31 |
| 保留 terminal 事实外部化 | 这是消除状态写回 PR 根因的最小流程修复，不限制显式额外 PR | 2026-07-31 |

## 快速交接

实现、返修、独立验证、独立复审、Wiki 与 walkthrough 均已通过；当前进入纠正 PR lifecycle。
