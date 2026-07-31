# 撤销 PR 配额与 task 级硬限制

## 目标

撤销上一任务加入的 `0..1` PR 配额、持久 PR identity binding 和 Scheduler 硬门。保留真正需要的流程修复：PR terminal 后不应仅为写回 merge、cleanup、refresh 或发布结果而自动创建 closeout PR。

## 问题陈述

上一轮把“Legion workflow 不应自动发送第二个收口 PR”扩大成了 task 级 PR 数量限制，并加入数据库 schema、迁移、worker gate 与大量“配额”术语。用户明确否定该限制。正确边界是消除自动 closeout/writeback PR 的流程诱因，而不是禁止用户或后续明确授权工作使用额外 PR。

## 验收标准

- [x] 当前规范源不再定义 `PR 配额`、`PR cardinality 0..1`、task 级唯一 PR identity 或 replacement PR 硬门。
- [x] Scheduler 不再包含 `task_pr_bindings`、相关 migration、compare-and-bind API、legacy `unknown/merged` 回填或基于该 binding 的 worker dispatch 限制。
- [x] workflow 仍明确：PR terminal 后的 merge/checks/cleanup/refresh/publish/deploy 事实不反写 repo，也不自动创建仅用于状态收口的 PR。
- [x] 明确的用户授权可以使用额外 PR；系统不得把“默认复用当前 open PR”提升为数字配额或跨 run 持久禁令。
- [x] Scheduler、根回归、context audit、package dry-run 与报告校验通过，历史任务证据保留并在 Wiki 中标为已被本任务纠正。

## 假设 / 约束 / 风险

- **确认解释**：用户否定的是新增的硬性 PR 限制；原始诉求仍要求 workflow 不要自动生成第二个 closeout PR。
- **约束**：不削弱 checks、review、squash merge、worktree cleanup 与主工作区 refresh。
- **约束**：不改写已合并任务的历史 raw evidence；只更新当前规范与 Wiki 当前真相。
- **风险**：若只删“配额”措辞而保留 runtime binding，限制仍实际存在。
- **风险**：若完全回到旧 lifecycle JSON/writeback 模型，自动 closeout PR 根因会复发。
- **风险**：Scheduler runtime 与文档必须同时移除 binding，否则迁移或 worker 行为会漂移。

## 要点

- 关键主张 `NO-QUOTA-001`：删除 task-level PR binding 与数量限制后，仍可通过“terminal 事实外部化、禁止自动状态写回 PR”消除原来的自动 closeout PR。
- 主张性质/时机/能力：`objective` / `now` / `routine`。
- `criticality`: `high`；`blocking-policy`: `block-merge`。

## 范围

- `AGENTS.md`、README 与 Legion workflow/worktree/docs/wiki/report 当前规范。
- Scheduler SQLite、worker、PR tracker、相关文档与测试。
- 根单 PR 回归改写为“无 quota/binding + 无自动 closeout writeback”边界。
- 新任务证据与 Wiki supersession。

## 非目标

- 不限制用户明确要求的多个 PR 或后续修复 PR。
- 不恢复 post-terminal repo 状态写回要求。
- 不改写 `.legion/tasks/enforce-single-pr-lifecycle-v1/` 历史证据。
- 不改变 GitHub branch protection、checks/review 或 squash policy。

## 设计索引

> **Design Source of Truth**: `.legion/tasks/remove-pr-quota-enforcement-v1/docs/rfc.md`

摘要：移除 PR quota/binding 子系统；保留 external-only terminal evidence 与“不得自动为状态写回创建 PR”的流程规则。

## 阶段概览

1. 设计撤销边界并独立 review
2. 移除硬限制、迁移、runtime gate 与对应规则
3. 独立验证和变更审查
4. 生成交付材料并完成纠正 PR lifecycle
