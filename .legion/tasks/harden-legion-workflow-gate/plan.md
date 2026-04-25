# Harden legion-workflow gate

## 目标

把 `legion-workflow` 收敛成更接近 `using-superpowers` 精神的强制入口门禁，使 Agent 在 Legion 管理仓库中能稳定先过接管判断，再进入 contract、设计、实现、验证、汇报与 wiki 记忆闭环。

## 问题陈述

当前 `legion-workflow` 已经声明自己是入口门禁，但强制程度仍弱于 `using-superpowers`：它没有 1% 触发阈值、缺少醒目的子代理停止门、没有机械化入口 checklist，也没有系统封堵“先读文件/先看 git/小改动不用流程/我记得流程”等常见绕门理由。这会导致 Agent 虽然知道 LegionMind 的能力存在，却仍可能先探索或先实现，削弱 task contract、design gate、verification、review、report 与 wiki writeback 的闭环价值。

## 验收标准

- [ ] `skills/legion-workflow/SKILL.md` 明确包含 1% 强制入口门禁、`SUBAGENT-STOP`、用户指令优先级、Entry Checklist、阶段 skill 必须真实加载、rationalization table。
- [ ] `SUBAGENT_DISPATCH_MATRIX.md`、`REF_AUTOPILOT.md`、`GUIDE_DESIGN_GATE.md` 与 `SKILL.md` 对执行模式、自动推进、低风险设计门的说法不冲突。
- [ ] `README.md`、`AGENTS.md`、`.opencode/agents/legion.md` 同步表达 `legion-workflow` 是强制第一道门，而不是可选建议。
- [ ] 增加任务级评估记录，说明修改前 baseline 风险、修改后预期行为，以及当前存在的执行模式数量和名称。
- [ ] 不引入新的持久化 active task 注册表，不改 CLI 命令语义。

## 假设 / 约束 / 风险

- **假设**: 这次只强化 workflow skill 与入口叙事，不改变 Legion CLI 的文件系统模型。
- **约束**: `legion-workflow` 与 `SUBAGENT_DISPATCH_MATRIX.md` 仍是运行模式与阶段顺序真源；references 不能长出第二套流程。
- **约束**: 按 `writing-skills` 精神记录压力场景与 baseline/after，但本轮以文档级评估为主，不新增自动化 harness。
- **风险**: 文案过硬可能被误读为用户不能 bypass；因此必须同时写清用户显式指令优先。
- **风险**: “执行模式”和“入口运行状态”容易混淆；本任务必须把二者分开命名。

## 范围

- `skills/legion-workflow/SKILL.md`
- `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`
- `skills/legion-workflow/references/REF_AUTOPILOT.md`
- `skills/legion-workflow/references/GUIDE_DESIGN_GATE.md`
- `README.md`
- `AGENTS.md`
- `.opencode/agents/legion.md`
- `.legion/tasks/harden-legion-workflow-gate/**`

## 非目标

- 不修改 `skills/legion-workflow/scripts/legion.ts` 的命令行为。
- 不重新引入 `config.json`、持久化 current task、proposal/approval 注册表或 ledger 依赖。
- 不把低风险任务升级成必须完整 RFC。
- 不改变阶段子代理类型或新增运行模式。

## 设计摘要

- 入口门禁采用 `using-superpowers` 的行为塑形方式：1% 阈值、不可先行动、红旗/借口表、机械 checklist。
- 用户显式指令仍最高优先级；强制门禁约束的是 Agent 的默认临场发挥，不剥夺用户 bypass 权限。
- 执行模式维持现有三种：默认实现模式、已批准设计后的续跑模式、重型仅设计模式；`bypass / restore / brainstorm` 只属于入口运行状态。
- references 只补充澄清，不复制新的阶段链。

## 阶段概览

1. **Phase 1** - 记录 pressure baseline 与稳定 task contract
2. **Phase 2** - 更新 workflow skill 与入口 references
3. **Phase 3** - 同步入口文档、评估记录与一致性检查

---

*创建于: 2026-04-25*
