# Fix AIM autonomous PR flow

## 目标

修正 `git-worktree-pr` 与相关入口文档中可能被理解为“没有用户逐项明确要求就不主动 commit / push / PR”的语义，使 Legion 的开发任务默认遵循 AIM 风格的自动交付闭环。

## 问题陈述

当前 Git envelope 已经强制 worktree、push 前 rebase、PR checks/review/cleanup/main refresh，但仍缺少一个明确规则：进入开发 envelope 后，commit、push、创建或更新 PR、跟进 checks/review 是生命周期的一部分，不需要用户逐项显式要求。若文档仍让 agent 以“用户没说 commit/push/PR”为理由停止在本地 diff，就与 AIM 的开发流程相反。

## 验收标准

- [ ] `skills/git-worktree-pr/SKILL.md` 明确 commit / push / PR / PR follow-up 是开发 envelope 的默认动作，而不是等待用户逐项授权。
- [ ] `AGENTS.md` 与 `.opencode/agents/legion.md` 明确用户沉默不是跳过 commit / push / PR 的理由；只有用户明确禁止或 bypass 才改变默认闭环。
- [ ] `REF_AUTOPILOT.md` 同步自动推进语义：默认推进到 PR lifecycle，而不是停在本地改动。
- [ ] README / wiki / task evidence 同步描述，避免旧语义残留。
- [ ] 验证覆盖关键字符串、无旧“no explicit ask means no commit/push/PR”语义、`git diff --check` 通过。

## 范围

- `skills/git-worktree-pr/SKILL.md`
- `AGENTS.md`
- `.opencode/agents/legion.md`
- `skills/legion-workflow/references/REF_AUTOPILOT.md`
- `README.md`
- `.legion/tasks/fix-aim-autonomous-pr-flow/**`
- `.legion/wiki/**`

## 非目标

- 不改变三种 Legion 执行模式。
- 不放宽 push 前 rebase、master/main 禁令、repo 内文件系统边界或 completion 定义。
- 不把 AIM 原文整段复制为第二套流程真源。

## 假设 / 约束 / 风险

- 假设：本仓库继续使用 `origin/master` 作为默认 base ref。
- 约束：用户明确要求不提交、不 push、不开 PR、或明确 bypass 时仍应优先，但必须记录为 bypass/blocker，而不是默认行为。
- 风险：若 wording 过宽，可能被误解为可绕过 branch protection 或 human review；需同时保留 checks/review/auto-merge/blocked handoff 约束。

## 设计摘要

- 在 `git-worktree-pr` hard gate 和 lifecycle 中补充“默认自动提交、推送、开 PR 并跟进”的硬规则。
- 在 autopilot 和入口规则中补充：用户没有逐项说 commit/push/PR 不是停止条件。
- 保持 PR 创建不是完成，完成仍要求 PR 终态、review/checks 处理、worktree 删除、主工作区刷新。

## 阶段概览

1. **Phase 1** - Contract materialization
2. **Phase 2** - Rule wording implementation
3. **Phase 3** - Verification, review, walkthrough, wiki writeback
