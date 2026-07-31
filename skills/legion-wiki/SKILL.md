---
name: legion-wiki
description: 当需要建立、更新或查询 `.legion/wiki` 的任务摘要、当前决定、可复用模式、维护事项或当前真相时使用。
---

# legion-wiki

维护 Legion synthesis 层。`.legion/tasks/**` 是 raw evidence，`.legion/wiki/**` 是跨任务当前知识，`skills/**` 与 `.opencode/**` 是 schema。仅当任务产生跨任务仍有效的知识，或 disposition 已明确为 `wiki:write` 时运行；`no-change` 是有效结论，不创建占位页。默认用中文；路径、字段、命令和错误原文保持原样。

## 何时使用

- 为 repo evidence 已完成的任务写可查询摘要，或在适用的 report/render evidence 后写回 durable knowledge。
- 查询当前有效决定、模式、维护债务或任务综合结论。
- 标记 `historical`、`superseded-by`、`schema-version`。

单任务日志/checklist/设计/验证仍写 raw task docs；schema 规则不写 wiki。

## 查询路径

涉及当前规则或执行行为时先读 schema；其他问题按：

`wiki/index.md -> wiki/tasks/<task-id>.md 或 decisions/patterns/maintenance -> 必要时 raw task docs`

不要直接 grep 全部 raw docs 来回答“当前真相”。

## 写回

- 后续值得查询的任务结果写 `tasks/<task-id>.md`，链接 raw evidence，不复制正文。
- 跨任务仍有效的强约束/结论写 `decisions.md`；可复用工作方式写 `patterns.md`；待补证据、迁移或清理写 `maintenance.md`。
- `index.md` 只维护导航；durable writeback 后按需同步 `log.md`。
- 不创建平行 playbook，不把 task-local 结论误提升为通用规则。
- 若判定 `no-change`，在任务交接中写一句理由即可，不创建 task summary 或空 Wiki 条目。
- closing handoff 使用五字段 `结果 / 变化 / 风险 / 下一步 / 证据`，变化最多三条、证据最多三个 locator，不复制 task 文档。
- PR-backed task 的 summary 在唯一 PR terminal 前写为 `delivery-ready`，只描述该 commit 可证明的当前规则与证据。merge/closed、cleanup、refresh 或 publish/deploy 结果留在 GitHub/Scheduler/最终交接；禁止为改成 `completed` 或追写终态创建第二 PR。

## 条件引用

- 新建/调整页面布局：`references/REF_WIKI_LAYOUT.md`
- 写 task summary：`references/TEMPLATE_TASK_SUMMARY.md`
- 提升 durable 知识：`references/REF_WRITEBACK_RULES.md`
