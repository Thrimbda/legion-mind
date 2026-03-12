# 交付说明：plan-only 最终交付报告

## 目标与范围

本次交付将 LegionMind 最终收敛为 plan-only 工作流：`plan.md` 成为唯一的人类可读任务契约与执行索引，`task-brief.md` / `taskBriefPath` 从 LegionMind 核心工作流中移除，且不提供 LegionMind 层向后兼容。

本次交付绑定以下 scope：

- `skills/legionmind/**`
- `.opencode/agents/**`
- `.opencode/commands/**`
- `docs/**`
- `.legion/**`

范围内的目标是统一 schema、skill、agent prompts、commands、usage docs、playbook 与当前任务样例的口径；范围外不包含 `.legion` MCP 工具实现改造，也不包含历史任务目录的批量迁移脚本。

## 设计摘要

详细设计见 `./rfc.md`，RFC 评审见 `./review-rfc.md`，结论为 PASS。

最终设计摘要如下：

- `plan.md` 承载问题陈述、验收标准、假设/约束/风险、目标、要点、范围、设计索引与阶段概览，既是任务 contract，也是 execution index。
- `context.md` 仅保留 progress / decisions / handoff；`tasks.md` 仅保留 machine-readable checklist；`rfc.md` 仅在 Medium / High risk 任务下承载详细设计。
- `config.json` 仅允许作为 `plan.md` scope 的可选 machine-readable mirror，不能独立扩展、收紧或否定 `plan.md`。
- 任务文档默认使用当前用户与 agent 的工作语言，不再把英文作为隐式默认值。
- 当前样例任务已完成 plan-only 迁移，`docs/task-brief.md` 已删除，作为最终模型示例。

## 改动清单

### 1. 核心 schema 与参考约束

- `skills/legionmind/references/REF_SCHEMAS.md`
  - 将 `plan.md` 定义为唯一人类可读任务契约与 scope 真源。
  - 明确 `config.json` 仅为可选 mirror，并加入工作语言规则。
- `skills/legionmind/references/REF_ENVELOPE.md`
  - 统一 subagent invocation envelope、越界升级门禁与 `.legion` 单写责任。
- `skills/legionmind/references/REF_CONTEXT_SYNC.md`
- `skills/legionmind/references/REF_BEST_PRACTICES.md`
- `skills/legionmind/references/GUIDE_DESIGN_GATE.md`
  - 对齐 plan-only 读取顺序、职责边界与执行门禁，避免旧双真源模型残留。

### 2. Skill、agent 与命令入口收敛

- `skills/legionmind/SKILL.md`
  - 将 `plan.md` 重新定义为任务 contract + design index。
- `.opencode/agents/legion.md`
- `.opencode/agents/engineer.md`
  - 将默认读取顺序统一为 `plan.md` -> `rfc.md` -> `context.md` -> `tasks.md`。
  - 固化“越界先升级并获确认”以及“仅 orchestrator 写回 `.legion`”规则。
- `.opencode/commands/legion.md`
- `.opencode/commands/legion-rfc-heavy.md`
- `.opencode/commands/legion-impl.md`
- `.opencode/commands/legion-pr.md`
  - 将任务初始化、实现、交付与 PR 流程统一改为 plan-only 口径。

### 3. 使用文档与长期沉淀同步

- `docs/legionmind-usage.md`
  - 明确人类操作者先读 `plan.md`，再按需读 `rfc.md`、`context.md`、`tasks.md`。
  - 明确任务文档默认跟随当前工作语言。
- `.legion/playbook.md`
  - 固化本次职责边界，避免后续任务重新回到 task-brief / plan 双真源。

### 4. 当前任务样例与交付报告更新

- `../plan.md`
  - 已改写为当前任务唯一人类可读契约。
- `./rfc.md`
  - 保留本次 Medium risk 任务的详细设计。
- `./test-report.md`
- `./review-code.md`
- `./review-security.md`
- `./report-walkthrough.md`
- `./pr-body.md`
  - 补齐验证、审查与交付闭环，形成可直接提交的最终 PR 材料。

## 如何验证

测试报告见 `./test-report.md`，结果为 PASS；代码审查见 `./review-code.md`，结果为 PASS；安全审查见 `./review-security.md`，结果为 PASS。

建议复核命令：

```bash
git diff --check
rg -n "taskBriefPath|docs/task-brief\.md|task-brief:|基于 task-brief" "skills/legionmind" ".opencode/agents" ".opencode/commands" "docs" ".legion/config.json" ".legion/tasks/task-brief-plan/plan.md" ".legion/tasks/task-brief-plan/context.md" ".legion/tasks/task-brief-plan/tasks.md"
test -e ".legion/tasks/task-brief-plan/docs/task-brief.md"; printf "%s" $?
```

预期结果：

- `git diff --check` 通过，无空白错误或补丁格式问题。
- 指定 scope 内不再把 `taskBriefPath`、`docs/task-brief.md`、`task-brief:` 或“基于 task-brief”作为现行正式输入/输出契约。
- 当前任务样例下 `docs/task-brief.md` 不存在，说明样例已完成 plan-only 迁移。
- 旧术语若出现，仅作为历史迁移说明、防回归说明或验收条件存在，不构成现行 contract 依赖。

## 风险与回滚

主要风险：

- 若后续 prompt、模板或命令文档重新引入旧字段，可能再次形成 plan-only 契约漂移。
- 若 `plan.md` 与 `config.json` 的 scope mirror 长期缺少自动校验，可能出现静默 drift。
- 若新增任务不复用当前固定表述，语言规则、越界审批或 `.legion` 单写责任可能再次分叉。

回滚方式：

- 本次改动仅涉及文档、prompt、命令说明与任务交付物；如需回滚，可整体回退本次文件改动。
- 回滚不会触发 `.legion` MCP 工具层面的数据迁移问题，因为本次未修改底层实现。
- 回滚策略是恢复上一个明确模型，而不是引入新的兼容分支。

## 未决项与下一步

- 可进一步增加轻量 contract check，持续扫描 `taskBriefPath`、`docs/task-brief.md`、语言规则、scope 真源与 `.legion` 单写责任相关表述，降低回归成本。
- 可为越界审批与设计决策补充稳定的 `approval reference` / `decision id`，提升审计可追溯性。
- 历史任务目录中的旧 `task-brief.md` 仍可作为历史事实保留；若需要仓库级清理，应单独立任务处理，而不是在当前 plan-only 契约中重新引入兼容逻辑。
