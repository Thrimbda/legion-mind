# Add Git worktree PR envelope

## 目标

把从最新 `origin/master` 创建 worktree、在 worktree 内完成开发、提交分支、创建 PR、跟进 checks/review、清理 worktree、刷新主工作区基线的完整 Git / PR 生命周期，集成为 Legion 开发任务的强制外壳。

## 问题陈述

当前 `legion-workflow` 已经能约束 task contract、设计门禁、实现、验证、审查、汇报和 wiki writeback，但尚未把 Git 工作区和 PR 生命周期纳入强制流程。Agent 仍可能在主工作区直接改文件、直接提交、跳过 worktree、把“已开 PR”当作完成，或在 checks/review 未闭环时停止。这会让 Legion 的任务证据闭环与真实仓库交付闭环脱节。

## 验收标准

- [ ] 新增 `skills/git-worktree-pr/SKILL.md`，定义 Git / PR lifecycle envelope 的 hard gate、阶段、禁止事项、red flags 和 completion 条件。
- [ ] `AGENTS.md` 明确开发任务必须使用 `git-worktree-pr` envelope，主工作区只允许仓库准备、只读检查和最终基线刷新。
- [ ] `skills/legion-workflow/SKILL.md` 明确 `git-worktree-pr` 是包裹三种执行模式的强制外壳，不是第四种执行模式，并更新入口/阶段/terminal 语义。
- [ ] `SUBAGENT_DISPATCH_MATRIX.md`、`REF_AUTOPILOT.md`、`REF_ENVELOPE.md` 对 Git envelope、PR 跟进与状态字段的描述一致。
- [ ] README 或入口说明简要说明开发任务默认走 worktree + PR lifecycle。
- [ ] 不改变现有三种执行模式，不修改 CLI 脚本，不直接把 AIM 的 `AGENTS.md` 整段复制成第二套真源。
- [ ] 产出 RFC、review、test-report、review-change、report-walkthrough、pr-body 与 wiki writeback。

## 假设 / 约束 / 风险

- **假设**: 本仓库默认 base ref 使用 `origin/master`；跨仓库安装时可由用户或 repo 规则覆盖。
- **约束**: Git envelope 是 lifecycle envelope，不是 Legion 执行模式。
- **约束**: 主工作区的允许动作必须非常窄，避免 agent 把开发动作留在主工作区。
- **约束**: PR 创建不是完成；只有 PR 终态、worktree 清理、主工作区刷新后才算开发任务完成。
- **风险**: 若把 Git 流程写进多个文件的细节层，容易形成第二套流程；因此 `git-worktree-pr` skill 承载细节，其他文件只做强制入口和引用。
- **风险**: Auto-merge / merge 权限可能因仓库策略不可用；流程必须允许记录阻塞并持续跟进，而不是绕过保护规则。

## 范围

- `skills/git-worktree-pr/SKILL.md`
- `skills/legion-workflow/SKILL.md`
- `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`
- `skills/legion-workflow/references/REF_AUTOPILOT.md`
- `skills/legion-workflow/references/REF_ENVELOPE.md`
- `AGENTS.md`
- `.opencode/agents/legion.md`
- `README.md`
- `scripts/setup-opencode.ts`
- `.legion/tasks/add-git-worktree-pr-envelope/**`
- `.legion/wiki/**`

## 非目标

- 不修改 `skills/legion-workflow/scripts/**` CLI 实现；允许更新安装资产清单以同步新增 skill。
- 不新增第四种 Legion 执行模式。
- 不强制所有只读问答或纯本地诊断创建 worktree。
- 不承诺自动绕过 GitHub 分支保护、review 或 checks。
- 不把完整 AIM `AGENTS.md` 逐字复制进 Legion；只吸收可复用流程语义。

## 设计摘要

- 新增 `git-worktree-pr` 作为 rigid skill，负责仓库生命周期外壳。
- `AGENTS.md` 与 `legion-workflow` 提供强制入口，防止 skill discover 不足导致绕过。
- `legion-workflow` 的三种执行模式仍保持不变；Git envelope 包裹选定执行模式。
- 开发任务完成定义升级为：Legion 证据链完成 + PR 终态 + worktree 清理 + 主工作区刷新。

## 阶段概览

1. **Phase 1** - 契约物化与 RFC 设计
2. **Phase 2** - RFC 审查与 skill / docs 实现
3. **Phase 3** - 验证、审查、walkthrough 与 wiki writeback

---

*创建于: 2026-04-25*
