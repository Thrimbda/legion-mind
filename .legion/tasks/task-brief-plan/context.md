# 精简 task-brief 与 plan 的职责边界 - 上下文

## 会话进展 (2026-03-12)

### ✅ 已完成

- 完成 plan-only 设计定向：由 `plan.md` 同时承载问题定义、验收、假设/约束/风险与执行索引
- 生成 RFC 并完成 review-rfc 收敛，明确 `plan.md` 为唯一任务契约、`planPath` 为标准入口
- 完成轻量验证：运行 `git diff --check` 并做聚焦一致性检索，结果通过
- 生成中文测试报告 `.legion/tasks/task-brief-plan/docs/test-report.md`
- 完成 schema、skill、orchestrator、subagent prompts、commands、usage guide 与 playbook 的职责边界收敛
- 新增 `skills/legionmind/references/REF_ENVELOPE.md`，补齐 subagent invocation envelope 参考
- 统一语言规则：LegionMind 任务文档默认使用当前用户与 agent 的工作语言，不再默认英文
- 完成最终轻量验证、代码审查与安全审查，结论均为 PASS
- 生成中文 walkthrough 与可直接用于 PR 的 `pr-body.md`
- 完成 plan-only 重构：LegionMind 层移除 `task-brief.md` / `taskBriefPath`，统一改为 `plan.md` / `planPath`
- 完成最终轻量验证、代码审查与安全审查，结论均为 PASS
- 刷新 walkthrough 与 `pr-body.md`，最终交付物已反映 plan-only 模型


### 🟡 进行中

(暂无)


### ⚠️ 阻塞/待定

(暂无)


---

## 关键文件

- `skills/legionmind/references/REF_SCHEMAS.md` [completed]
  - 作用: 定义 `plan.md` / `config.json` / 文档语言规则的最终 schema 边界
- `skills/legionmind/references/REF_ENVELOPE.md` [completed]
  - 作用: 定义 subagent invocation envelope、越界升级门禁与 `.legion` 单写责任
- `.opencode/agents/legion.md` [completed]
  - 作用: 统一 orchestrator 的读取顺序、scope 硬边界与文档语言规则
- `docs/legionmind-usage.md` [completed]
  - 作用: 给操作者解释何时看 `plan.md` / `rfc.md` / `context.md` / `tasks.md`，以及文档语言与路径约定
- `.legion/tasks/task-brief-plan/docs/pr-body.md` [completed]
  - 作用: 本任务最终 PR 描述主文档

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 本任务按 Medium Risk + 非 Epic 执行，并要求 standard RFC | 涉及 schema、agent prompt、command 与长期文档的多模块联动，属于流程契约调整；虽然可回滚，但需要先收敛设计口径 | 按 Low Risk 直接改文档；已放弃，因为容易继续放大任务契约职责歧义 | 2026-03-12 |
| 保留 tasks/<task-id>/config.json 作为可选 machine-readable scope mirror，但将 plan.md 定义为唯一的人类可读 scope 真源 | 兼容现有 schema/commands 中的 task config 约定，同时避免把 scope ownership 重新拆成两个并列真源 | 彻底删除 task config scope 语义；未采用，因为会放大本次改造范围并破坏现有机器校验入口 | 2026-03-12 |
| LegionMind 任务文档默认使用当前用户与 agent 的工作语言；仅在仓库已有明确文档语言约定时才整体跟随仓库约定 | 避免模板历史上出现的英文标题被误解为默认语言，降低用户理解成本与 Review 噪音 | 继续把英文视为默认文档语言；未采用，因为与当前仓库和用户交互语言不一致，且容易制造 prompt/doc drift | 2026-03-12 |
| 放弃 task-brief/plan 双文件模型，改为 plan-only，且 LegionMind 层不做向后兼容 | 用户明确要求若两者冲突则只保留 plan，并进一步指定不在 LegionMind 层面兼容旧模型；继续保留 task-brief 会让 source-of-truth 再次分叉 | 继续推进 task-brief/plan 硬拆分；未采用，因为仍需维护双真源边界且用户已明确反对 | 2026-03-12 |
| 当前任务样例自身也必须迁移为 plan-only，不保留 `docs/task-brief.md` 作为历史兼容输入 | 若当前 active task 继续保留旧样例，仓库会持续向操作者传递双文件心智模型，削弱本次改造价值 | 只更新 workflow 文档，保留当前任务样例不动；未采用，因为会让新旧模型在同一仓库内同时自我矛盾 | 2026-03-12 |

---

## 快速交接

**下次继续从这里开始：**

1. 将 `.legion/tasks/task-brief-plan/docs/pr-body.md` 直接作为 PR 描述
2. 如需进一步加固，可单开任务增加自动 contract check，扫描 `taskBriefPath` / `docs/task-brief.md` / scope 真源 / 越界审批 / `.legion` 单写责任回归

**注意事项：**

- 本次最终交付采用 plan-only 设计，不在 LegionMind 层兼容旧 `task-brief.md` 模型
- 最终 `review-rfc`、`test-report`、`review-code`、`review-security` 均为 PASS

---

*最后更新: 2026-03-12 11:57 by Claude*
