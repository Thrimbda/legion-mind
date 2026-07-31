# RFC 审查：撤销 PR 配额，保留无自动 closeout 的流程

## 审查范围

- Contract：`.legion/tasks/remove-pr-quota-enforcement-v1/plan.md`
- Design source：`.legion/tasks/remove-pr-quota-enforcement-v1/docs/rfc.md`
- 辅助证据：`tasks.md`、`log.md`、`docs/research.md`
- 关键主张：`NO-QUOTA-001`

## Blocking findings

无。

## 设计门判断

### 授权边界

PASS。选择的 Option A 明确删除数字上限、task-level identity、跨 run binding、legacy backfill 与 worker dispatch gate；同时明确保留用户授权后使用额外 PR 的能力。它没有用改名或软化措辞掩盖原限制。

### 根因与运行时边界

PASS。RFC 把根因修复限定为：terminal lifecycle/status 事实外部化，不再要求 repo writeback，也不自动创建 closeout、publish-result、deploy-result 或 wiki-only PR。它同时承认删除 runtime hard gate 后，错误 worker 不再由数据库强制拦截；这是符合用户授权边界的显式取舍，不是遗漏。

### SQLite 与兼容性

PASS。fresh DB 不再创建 `task_pr_bindings` 或 migration 5/6；已升级 DB 的旧表和 migration rows 保留但不再读取或写入。该方案没有 destructive drop，旧数据不丢失，也不会让兼容性清理重新变成授权限制。

### Scheduler scope

PASS。SQLite store、worker、PR tracker、binding helper 与对应测试的删除边界完整；run-level `runs.pr_url`、direct Git lifecycle observation、checks/review/evidence gate、cleanup/refresh 观察与 merged 后缺 repo evidence 的当前 run 非成功终态均明确保留。设计没有把撤销配额扩大成撤销交付安全门。

### 验收、验证与回滚

PASS。验收同时覆盖规范、schema/API/runtime、terminal writeback 行为、显式授权正路径与完整回归面；`NO-QUOTA-001` 已连接 `high` criticality 和 `block-merge`。不删除 legacy schema 使本次变更可通过重新引入旧 runtime 代码回滚；merge 后任何重新建立 hard quota 的语义变化仍须用户重新授权。

## 非阻塞建议

1. 回归扫描应显式区分“当前规范源”和保留的历史 raw evidence / append-only Wiki log，避免历史文字造成假失败；当前 Wiki 决定与任务摘要必须明确 superseded。
2. 增加 fresh DB 与 legacy DB 两条兼容性测试：前者断言不创建 binding table/migration 5/6，后者断言旧表与 rows 可保留但 runtime 完全忽略。
3. worker/policy 回归应同时覆盖负路径与正路径：不得自动生成 terminal 状态写回 PR；用户明确授权的后续 PR 不受数字上限或跨 run gate 阻止。

## Verdict

PASS

## 会话注意力摘要

- 阶段：`review-rfc`
- 阶段结论：`PASS`
- 注意力等级：`skim`
- 判断变化：Option A 可在不恢复 post-terminal writeback 根因的前提下完整撤销 hard quota/binding；无需退回设计阶段。
- 关键发现：
  1. 授权正路径已明确：用户可授权额外 PR，Scheduler 不再维护 task-level 数量或 identity 禁令。
  2. legacy DB 的 non-destructive ignore 策略可实施，但应以 fresh/legacy 双路径回归固化。
  3. 历史证据保留与“当前规范无 quota”需要在扫描范围中明确区分。
- 阻塞项：无。
- 残余风险：删除 runtime hard gate 后，错误 worker 不再由数据库兜底阻止额外 PR；RFC 已明确接受以 workflow 授权边界管理该风险。
- 人类动作：知悉，无需介入。
- 自动下一步：进入有界实现，按 RFC 删除 quota/binding 子系统并保留 external-only terminal lifecycle。
- 完整证据：`.legion/tasks/remove-pr-quota-enforcement-v1/docs/review-rfc.md`
