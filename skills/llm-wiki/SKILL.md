---
name: llm-wiki
description: 将“由 LLM 持续维护 wiki”收敛为稳定工作流的 skill。用于围绕 raw sources / wiki / schema 三层架构执行 ingest、query、lint；适合构建或维护由 LLM 持续整理的 markdown 知识库，并要求默认只读 query、同步维护 index.md 与 log.md。
---

# llm-wiki

1. 把 raw sources 视为只读输入层；只从中读取证据，不回写、不改写。
2. 把 wiki 视为 LLM 维护层；持续更新页面、互链、综合结论与待验证项。
3. 把 schema 视为规则层；优先遵循宿主 wiki 约定。本 skill 只提供 baseline，不替代领域规则。
4. 先读 `index.md` 再定位页面；避免每次对 wiki 全库盲扫。
5. 同步维护 `index.md` 与 `log.md`；新增页面、重要更新、维护动作都要记账，日志默认只写安全 ID 与动作摘要，不复制敏感原文。
6. 将聊天内容与推测和来源事实分开；证据不足时写成待确认，而不是确定性结论。

## 操作入口

- **ingest**：读取新 source，生成或更新来源页/主题页/实体页；同步更新 `index.md`；向 `log.md` 追加一条 ingest 记录。
- **query**：默认严格只读。先基于 `index.md` 找页，再综合回答。只有当用户明确要求沉淀，且宿主 schema 已显式定义该类写回流程（含写权限/维护者、触发条件、目标落点、允许字段、`index.md` / `log.md` 同步方式）时，才允许转入授权写回；否则仅返回答案或把沉淀需求升级为后续 ingest/维护任务。写回后只在必要时更新 `index.md`，并始终向 `log.md` 追加带授权依据的安全摘要。
- **lint**：检查冲突、陈旧结论、孤儿页、缺失互链、重要概念缺页与证据缺口；输出修复建议，并向 `log.md` 追加一条 lint 记录。

## 读取导航

- 需要理解三层职责、边界与宿主 schema 分工时，读 [references/architecture.md](./references/architecture.md)
- 需要执行 ingest / query / lint 的标准步骤时，读 [references/workflows.md](./references/workflows.md)
- 需要维护 `index.md`、`log.md`、命名与互链约定时，读 [references/conventions.md](./references/conventions.md)
