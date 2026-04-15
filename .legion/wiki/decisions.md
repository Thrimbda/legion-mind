# 当前有效决策

## [Decision] `.legion/tasks/**` 是 raw，不再兼任 wiki

- Current: true
- Why: task 目录负责存证，不负责成为最佳查询入口
- Raw evidence: `docs/legion-context-management-raw-wiki-schema.md`

## [Decision] `.legion/wiki/**` 是 Legion 的综合知识层

- Current: true
- Why: 需要一个稳定层来承载 task summary、当前有效决策、模式与维护债务
- Owned by: `skills/legion-wiki`

## [Decision] `plan.md` / `log.md` / `tasks.md` 只属于 raw task docs

- Current: true
- Why: 它们分别承载任务契约、过程日志、状态板，不再承担跨任务知识入口职责

## [Decision] subagent dispatch 真源集中到 workflow schema

- Current: true
- Why: orchestrator 必须派生 subagents，不能只靠 command 文案或模型推断
- Source: `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`
