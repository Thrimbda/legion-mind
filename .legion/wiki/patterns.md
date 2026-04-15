# 可复用模式

## [Pattern] 查询 Legion 当前真相时先走 wiki 再下钻 raw

- Use when: 需要回答“现在 Legion 是怎么工作的”
- Path: `schema -> wiki index -> task summary -> raw task docs`
- Why: 避免历史任务污染当前结论

## [Pattern] agent 保持薄壳，规则进入 skill

- Use when: 设计 orchestrator / subagent 架构
- Rule: agent 只保留权限与 skill 加载；规则真源进入 skills
- Related task: `legion-schema-skills-logmd`

## [Pattern] 对 task 结果做两次提升

- Step 1: task 结果先写入 `.legion/tasks/**`
- Step 2: 可复用结论再提升到 `.legion/wiki/**`
- Why: 保持 raw 与 synthesis 分层
