# Legion 单 PR 生命周期硬约束

## 目标

把单个 Legion task 最多一个 delivery PR 设为不可降级的硬不变量，彻底禁止 closeout、publish-result、wiki-only 或其他自动第二 PR。

## 问题陈述

当前流程要求 PR 合并、cleanup 和主工作区刷新后才能完成，同时又要求把 lifecycle 变化写回仓库内 task/wiki；这会在主 PR 合并后诱导第二个 docs-only PR，并形成理论上的递归收口。

## 验收标准

- [x] 所有当前 workflow 真源明确规定每个 task 最多零或一个 PR，且任何 post-merge 阶段不得再创建、更新分支或提交仓库变更。
- [x] 任务内发布、部署等 post-merge 操作只产生外部 lifecycle 证据；纯外部动作可在 external-only latch 内重试，需要仓库改动时原任务终止并等待用户另行发起新任务。
- [x] task/log/wiki/report 的预合并状态语义不要求在 PR 终态后回写，GitHub 或 scheduler 成为 merge/checks/cleanup/refresh 的终态真源。
- [x] 回归测试能阻止 closeout/follow-up/publish-result 第二 PR 规则重新进入当前技能、模板和文档。
- [x] 历史 task artifact 保持不变；根回归、scheduler compatibility、context audit 与 package 检查通过。

## 假设 / 约束 / 风险

- **假设**: 用户所说第二个 PR 指同一 Legion task 自动产生的后续 PR；用户日后明确发起的新任务拥有独立的一次 PR 配额。
- **假设**: GitHub PR 状态、scheduler state 和当前会话最终交接足以承载合并后的 lifecycle 事实。
- **约束**: 本任务自身只能创建一个 PR。
- **约束**: 禁止为记录本 PR 的 merge、cleanup 或 refresh 再写仓库或创建后续 PR。
- **约束**: 不得削弱 branch protection、checks、review、squash merge、worktree isolation 或安全 refresh。
- **约束**: 保留历史 task/wiki 记录，不批量改写已发生事实。
- **风险**: 若状态语义改得不完整，agent 仍可能从发布模板或 docs 写回规则推导出第二 PR。
- **风险**: 若把 repo-evidence 完成与 delivery terminal 混为一谈，可能提前宣告交付完成。
- **风险**: scheduler 与手工 workflow 若对终态真源理解不一致，可能出现 status drift。

## 要点

- 关键主张 ONE-PR-001：终态改由 GitHub/scheduler/最终交接承载后，单 PR 约束不会削弱交付门；性质 objective，criticality high，blocking-policy block-merge。

## 关键主张

- `ONE-PR-001`
  - 主张：task 级持久 PR identity、全入口原子绑定与独立本地 lifecycle 观测可以在 merge 前被测试证明，同时阻止第二 PR且不削弱 checks、review、cleanup 与 refresh 门。
  - 验收/风险关系：若不成立，单 PR 约束可能只在单个 run 内有效，或 Scheduler 会提前完成。
  - 三轴：`objective` / `now` / `routine`。
  - `domain-id`: `legion-pr-lifecycle`
  - `required-capability`: 静态规则一致性、task 级并发绑定回归与 Git lifecycle 正负路径验证。
  - `required-method`: 负向规则扫描、根/scheduler 回归、临时 Git 仓库中的 PR identity 与 cleanup/refresh 观测测试。
  - 所需原始证据：测试输出、diff、task binding 状态、GitHub fixture 与本地 Git/worktree 观测结果。
  - `criticality`: `high`
  - `risk-if-wrong`: workflow 可能再次产生第二 PR，或丢失交付终态门。
  - `blocking-policy`: `block-merge`
  - 当前状态：待 `verify-change` 判定。
  - `owner`: 独立 verifier。

真实唯一 PR 的 merge、cleanup、refresh 与 post-merge operation 属于本任务的 external terminal protocol。它在唯一 PR merge 后由当前执行者观察并报告，不反向更新本 claim 或仓库文件，也不是 merge 前 claim 的 deferred PASS。

## 范围

- AGENTS.md、README.md 与当前 workflow/PR/docs/wiki/report 技能规则。
- 必要的 scheduler contract 文档或 verifier 语义。
- 根回归、scheduler 测试与 package/context 检查。
- 本任务 .legion task evidence 与 durable wiki writeback。

## 非目标

- 不重写历史 PR、历史 task artifact 或历史 wiki 事实。
- 不新增 GitHub bot、merge hook 或仓库外的新持久化系统。
- 不改变 squash、branch protection、checks、review、worktree isolation 或安全 refresh 门。
- 不禁止用户未来明确发起的新任务拥有自己唯一的 PR。

## 设计索引 (Design Index)

> **Design Source of Truth**: .legion/tasks/enforce-single-pr-lifecycle-v1/docs/rfc.md

**摘要**:
- 在 task contract 层绑定最多一个 PR 身份，所有修订必须留在该 PR 合并前完成。
- 把 repo-contained evidence complete 与 external delivery terminal 分离；post-merge 只观察和报告，不回写仓库。
- 用负向措辞扫描与行为测试锁定禁止第二 PR 的边界。

## 阶段概览

1. **设计** - 完成单 PR 生命周期 RFC 与独立审查
2. **实现** - 修改当前规则、模板、文档和测试
3. **验证** - 完成独立验证与变更审查
4. **交付准备** - 在唯一 PR terminal 前生成交付材料并固定 `delivery-ready`；真实 PR terminal、cleanup 与 refresh 由外部 lifecycle 完成

---

*创建于: 2026-07-31 | 最后更新: 2026-07-31*
