# 把 AGENTS.md 提炼为 skill 并纳入 legion-workflow

## 目标

将仓库根部 AGENTS.md 的入口规则抽取为可复用 skill，并让 legion-workflow 把它作为显式入口依赖，同时补齐运行时 allowlist / installer 接线与关联 wiki 引用修复。


## 问题陈述

当前仓库的入口纪律主要写在根部 `AGENTS.md`，而 `legion-workflow` 虽然承担第一道门的角色，却没有把这些仓库级规则建模成独立 skill。

这会让入口规则停留在顶层提示文件里：可读但不够可复用，也难以像其他 workflow skill 一样被显式引用、验证与持续演进。用户已明确要求把 `AGENTS.md` 写成一个 skill，并纳入 `legion-workflow`。

## 验收标准

- [x] 新增一个 skill，完整覆盖现有 `AGENTS.md` 的入口规则，并以 skill 形式表达何时触发、何时不触发、以及与 `legion-workflow` 的边界。
- [x] `legion-workflow` 明确把该 skill 纳入入口链路或 skill priority，避免两者互相平行但不关联。
- [x] `AGENTS.md` 更新为与新 skill 一致的最小入口文案，不再单独维护一套更长的重复规则。
- [x] `legion` orchestrator 的 skill 权限改为通配放行，避免新增 repo-specific skill 后再次因 allowlist 漏配而失效。
- [x] installer 会同步安装 `agent-entry`，确保新环境具备完整入口链路。
- [x] 新 skill 通过 `skill-creator` 提供的验证脚本，或验证失败点被修复并记录。
- [x] `.legion` 任务文档记录风险分级、关键决策、验证方式与最终交付路径。

## 假设 / 约束 / 风险

- **假设**: 本次改造只涉及 skill / workflow / 仓库入口文案，不需要修改 Legion CLI、subagent 类型或 MCP 工具实现。
- **约束**: 必须遵守 `writing-skills` 的基本方法来编写 skill，并用 `skill-creator` 做形式校验；同时保持 `legion-workflow` 仍然是第一道门，不把仓库级入口规则做成另一条平行主流程；用户已明确命令体系后续废弃，因此本轮不再为 `.opencode/commands/**` 追加适配。
- **风险**: 若新 skill 与 `AGENTS.md` / `legion-workflow` 的描述边界不清，后续可能出现三处规则漂移；因此需要让 AGENTS 降到最小入口文本，并把集成关系写进 `legion-workflow`。

## 风险分级

**Low Risk**：本次仅调整仓库内 skill 文档与入口说明，不涉及生产代码、外部合约、数据迁移或不可逆操作；回滚成本低，可通过撤销 skill 与文案变更恢复。

## 要点

- 把 AGENTS.md 的仓库级入口规则转换为一个独立 skill，避免规则只存在于顶层提示文件
- 保持 legion-workflow 作为第一道门，但让其显式吸收并引用新的入口 skill
- 补齐入口 skill 的运行时 allowlist 与安装清单，避免新门禁在真实环境中失效
- 修复 legion-wiki 对 legacy raw log 路径的硬编码，避免历史任务 summary 生成死链
- 按 writing-skills 的思路编写 skill 内容，并用 skill-creator 的校验脚本做格式/结构验证
- 更新 Legion 任务文档，记录风险、假设、验证与交付物；命令体系按用户要求不再追加适配


## 范围

- AGENTS.md
- skills/legion-workflow/**
- skills/agent-entry/**
- .opencode/agents/legion.md
- scripts/setup-opencode.ts
- .legion/**

## 设计索引

> **Design Source of Truth**: 本任务采用 design-lite，不单开 RFC。

**摘要**:
- 新增 `skills/agent-entry/SKILL.md`，将仓库级入口纪律整理为 repo-specific skill，强调“先加载 `legion-workflow`、先恢复 active task、无稳定 contract 先走 `brainstorm`”。
- 保留 `AGENTS.md` 作为运行时入口钩子，但缩减为“加载 `legion-workflow` + 应用新 skill”的最小文本，避免与 skill 正文形成双真源。
- 在 `skills/legion-workflow/SKILL.md` 中显式纳入 `agent-entry`，说明其是仓库级补充门禁，而不是替代 `legion-workflow` 的主入口。
- `legion` agent 的 skill 权限采用通配符放行，避免 repo-specific entry overlay 再次因静态 allowlist 漏配而失效。
- installer 把 `agent-entry` 纳入 `INSTALLED_SKILLS`；命令体系按用户要求视为 legacy，不作为本轮接线目标。

## 阶段概览

1. **设计与建模** - 2 个任务
2. **实现与验证** - 3 个任务
3. **收口与同步** - 3 个任务

---

*创建于: 2026-04-14 | 最后更新: 2026-04-15*
