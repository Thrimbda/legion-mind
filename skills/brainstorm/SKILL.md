---
name: brainstorm
description: 当 Legion 任务还没有稳定 contract，目标、验收、范围、约束、假设、风险或阶段仍需收敛时使用。
---

# brainstorm

把模糊请求收敛为稳定 task contract，并物化到 `plan.md`、`tasks.md`。本阶段不写 RFC 或生产代码。

## 硬门

- contract 未展示、未确认或未完整落盘前，不得调用 `engineer`。
- `task create` 和占位文档不等于 contract 完成。
- 默认用中文沟通和写文档；路径、命令、标识符与错误原文保持原样。

## 何时使用

用于新任务、未明确恢复的任务，或恢复后发现目标、验收、范围、约束、假设、风险、阶段仍漂移的任务。已有稳定 contract 的设计、实现、进度更新和 review 回复不使用本 skill。

## Contract 最小字段

`name`、`taskId`、`goal`、`problem`、`acceptance[]`、`assumptions[]`、`constraints[]`、`risks[]`、`scope[]`、`nonGoals[]`、`designSummary[]`、`phases[]`、`claims[]`。

`claims[]` 只登记非显然且会改变验收或风险判断的关键主张；没有时写“无”。存在关键 claim 时，按 `../verify-change/references/REF_COGNITIVE_VERIFICATION.md` 预注册，不另造枚举。能确定的字段直接填写；会改变目标、验收、scope 或风险接受的缺项必须继续收敛，纯验证方法取舍可交给 `spec-rfc`。低风险 routine claim 可留给 `verify-change` 生成默认值。

## 流程

1. 读取仓库与 `.legion` 当前状态，确认既有约束、历史决定和未决问题。
2. 每次只问一个最影响设计的问题，优先收敛目标、验收、边界和外部依赖；若任务包含多个独立交付，先拆 scope。
3. 仅在存在真实分叉时比较 2–3 个方案并推荐一个，否则直接给推荐路径。
4. 分段展示技术概要：问题与目标、验收、scope/non-goals、假设/约束/风险、关键 claim、推荐方向和阶段；出现新不确定性就继续提问。
5. `confirmed` 只来自用户明确确认，或上游 workflow 明确允许延迟批准且稳定假设、边界、non-goals、推荐路径和阶段均已写入 contract。
6. 由上游 LLM 给出人类可读、ASCII-safe 的 `taskId`，再创建或重写任务文档；立即回读，确认不是骨架。

## 文档边界

- `plan.md` 是面向技术 leader 的唯一任务契约：保留问题、验收、范围、non-goals、假设、约束、风险、摘要级技术方向、关键 claim 和阶段。
- 接口细节、伪代码、迁移步骤、逐文件方案、测试矩阵和过程日志不进入 `plan.md`。
- `tasks.md` 只承载阶段与 checklist 初稿；详细设计交给 `spec-rfc`。
- 文档归属遵循 `legion-docs`。

## 退出

- contract 仍漂移或新增关键约束：继续 `brainstorm`。
- scope 过大：先拆分再继续。
- contract 稳定且需要设计门：交回 `legion-workflow -> spec-rfc`。

## 条件引用

- 关键 claim：`../verify-change/references/REF_COGNITIVE_VERIFICATION.md`
- 文档结构：`legion-docs`
- 设计阶段：`spec-rfc`
