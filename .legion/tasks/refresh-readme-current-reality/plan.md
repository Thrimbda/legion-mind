# Refresh README current reality

## 目标

维护 README 中 `当前现实` 与相关 v1 状态表述，使其准确反映仓库在 OpenCode/OpenClaw、regression suite、benchmark、CLI 与未毕业项上的真实现状。

## 问题陈述

上一轮 harden-v1 kernel surface 已让仓库状态、setup parity、regression suite 和 docs current-truth 发生变化，但 README 的 `当前现实` 仍偏泛化，已成型/未毕业条目没有完整反映 benchmark、OpenCode/OpenClaw parity、regression suite、CLI 薄层与发布/CI缺口。

## 验收标准

- [ ] README 的 `当前现实` section 准确列出已成型能力，包括 workflow kernel、任务/wiki记忆、OpenCode/OpenClaw setup parity、regression suite、VibeHarnessBench v0.1、GitHub Actions 接线与 current-truth 收敛。
- [ ] README 的 `还没有毕业` / v1 门槛准确列出真实缺口，包括发布/CI、真实项目压力测试、低摩擦产品化、CLI 仍是薄工具、runtime 仅 OpenCode/OpenClaw、benchmark 非完整 sandbox/full stack。
- [ ] 不重新引入 Claude/Codex/Cursor/Gemini 泛化叙事，不改支持边界。
- [ ] 变更范围保持 README 与 Legion 任务/wiki evidence，不触碰无关 repo hygiene。

## 假设 / 约束 / 风险

- **假设**: 当前用户希望继续沿用 Legion workflow 并默认 PR lifecycle 闭环。
- **假设**: 本任务是 README 文档维护，风险较低，不需要 RFC。
- **假设**: 仓库最新状态以 origin/master 上合并后的 harden-v1-kernel-harness 为基线。
- **约束**: 开发只在 .worktrees/refresh-readme-current-reality 内进行。
- **约束**: 不要清理或修改 scope 外的 superpowers、旧 worktree、仓库 hygiene 项。
- **约束**: 不要改变 setup 脚本或 regression 实现，除非验证暴露 README 相关破坏性不一致。
- **风险**: README 若写得过度乐观会重新制造成熟度误导。
- **风险**: README 若写得过度保守会低估当前已成型能力。
- **风险**: 若引用过细实现细节，会让 README 再次成为过程日志而非入口文档。

## 要点

- 保持 README 作为 current product entry 的诚实状态描述。
- 用 v1 前硬化语气，既承认可运行内核，也明确未毕业边界。
- 仅做低风险文档实现，后续用 regression/静态检查验证没有支持边界漂移。

## 范围

- README.md
- .legion/tasks/refresh-readme-current-reality/**
- .legion/wiki/** closing writeback

## 设计索引 (Design Index)

> **Design Source of Truth**: README 当前现实 section，无独立 RFC

**摘要**:
- 低风险默认实现模式：README-only 文案维护，不需要 spec-rfc。
- 实现重点是 current reality 与 v1 hardening truth 对齐，不改变 runtime 支持边界或代码行为。
- 验证通过 README 片段审阅、命名运行时禁用词检查、test:regression smoke。

## 阶段概览

1. **Implementation** - 更新 README 当前现实与 v1 相关真实状态表述
2. **Verification** - 验证 README 运行时边界和 regression suite 仍通过
3. **Review and report** - 完成 review-change、report-walkthrough 与 wiki writeback
4. **PR lifecycle** - 提交、rebase、push、创建 PR 并跟进 lifecycle

---

*创建于: 2026-04-27 | 最后更新: 2026-04-27*
