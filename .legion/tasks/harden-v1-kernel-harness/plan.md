# Harden v1 kernel harness surface

## 目标

收敛 LegionMind 当前可运行内核的产品面：删除过时 docs、对齐 OpenClaw 与 OpenCode setup lifecycle、增加关键 regression suite，并更新 README 当前状态与运行时边界。

## 问题陈述

仓库已经具备 workflow kernel、setup automation 与 benchmark v0.1，但 README/docs/setup/test surface 仍有历史漂移：docs/ 中存在过时叙事，OpenClaw 与 OpenCode 安装能力不对等，缺少覆盖 setup、skill surface 与 CLI 不变量的 regression suite，README 状态与支持运行时边界需要收敛。

## 验收标准

- [ ] docs/ 中过时文件删除，README 不再引用已删除 docs，current truth 收敛到 README、.legion/wiki、skills 与 vibe-harness-bench/README.md。
- [ ] OpenClaw setup 支持与 OpenCode 对齐的 rollback / uninstall / strict verify / managed manifest 语义，README 描述与实际脚本一致。
- [ ] 新增 regression suite，优先覆盖 setup automation、OpenCode/OpenClaw skill surface 一致性、Legion CLI 文件系统不变量，并提供 package.json 脚本入口。
- [ ] README 当前状态改为 可运行内核 / v1 前硬化中，并删除 Claude / Codex / Cursor / Gemini 泛化叙事及多运行时暗示。
- [ ] 不处理 repo hygiene / worktree cleanup 等用户明确排除的其他事项。

## 假设 / 约束 / 风险

- **假设**: 当前只支持并描述 OpenCode 与 OpenClaw。
- **假设**: CLI 暂时保持薄文件工具，不升级为 runtime orchestrator。
- **假设**: VibeHarnessBench README 是 benchmark 当前使用说明的承载点。
- **约束**: 所有实现、文档、测试与任务产物只在 .worktrees/harden-v1-kernel-harness 内完成。
- **约束**: 不修改用户排除范围：不主动清理现有 worktree/superpowers 等 repo hygiene 项。
- **约束**: 不引入除 Node.js 与现有 Python benchmark 之外的新外部运行时要求。
- **风险**: setup 脚本共用逻辑改造可能误伤现有 OpenCode 行为。
- **风险**: 删除 docs 可能留下 README 或 wiki 的悬挂引用。
- **风险**: regression suite 若覆盖过宽会把环境依赖问题误报为实现失败。

## 要点

- 以 current truth 收敛和可验证性为核心，不扩大运行时矩阵。
- OpenClaw parity 优先复用 OpenCode 成熟语义，避免两套安装模型继续分叉。
- regression suite 先覆盖最关键不变量，而非端到端 agent 执行。

## 范围

- README.md
- package.json
- scripts/setup-openclaw.ts
- scripts/setup-opencode.ts 如需抽取共享 core
- scripts/lib/** 新增共享 setup 或 regression 工具
- docs/** 删除过时文件
- vibe-harness-bench/README.md benchmark 当前说明必要更新
- .legion/tasks/harden-v1-kernel-harness/**
- .legion/wiki/** closing writeback

## 设计索引 (Design Index)

> **Design Source of Truth**: .legion/tasks/harden-v1-kernel-harness/docs/rfc.md

**摘要**:
- 中风险任务：setup lifecycle 与 regression suite 需要先用 RFC 钉住边界，避免实现时重新发明 installer 语义。
- 默认实现模式：spec-rfc -> review-rfc -> engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki。
- Git lifecycle 进入 git-worktree-pr envelope，分支 legion/harden-v1-kernel-harness。

## 阶段概览

1. **Design gate** - 产出 RFC 并通过 review-rfc
2. **Implementation** - 实施 docs cleanup、OpenClaw parity、regression suite 与 README 更新
3. **Verification** - 运行 setup/regression/CLI 相关验证并记录 test-report
4. **Review and report** - 完成 review-change、report-walkthrough、PR body 与 wiki writeback
5. **PR lifecycle** - 提交、rebase、push、创建 PR 并跟进 lifecycle

---

*创建于: 2026-04-27 | 最后更新: 2026-04-27*
