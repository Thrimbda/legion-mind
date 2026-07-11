# 人类注意力交接协议

> **目的**：把阶段审查与验证中真正影响判断的信息，在下一阶段开始前低噪音地投影到会话；完整阶段文档继续作为证据真源。
>
> **适用阶段**：`review-rfc`、`verify-change`、`review-change`。本协议是摘要字段、四级注意力、噪音控制、阶段/PR lifecycle 门禁和恢复规则的单一真源；阶段 skill 只引用，不复制出另一套枚举或门禁。

## 1. 真源与产物边界

- 完整证据仍写入当前任务已有的 `docs/review-rfc.md`、`docs/test-report.md` 或 `docs/review-change.md`。
- 每份阶段证据必须内嵌一个 `## 会话注意力摘要` 小节；不得新增 `attention.md`、注意力台账或新的必经 skill。
- 阶段 sub-agent 的最终 handoff 必须原样返回该小节。handoff 是持久证据的投影，不是第二份可以独立改写的结论。
- orchestrator 负责把 handoff 投影到 chat session，并负责门禁、持久化决定与恢复；阶段 sub-agent 不得自行隐藏 `FAIL`、`review` 或 `decide`。
- `## Verdict` 的阶段级 `PASS / FAIL` 与 claim 级认知状态相互独立。认知状态及其 attention 导出规则只认 `../../verify-change/references/REF_COGNITIVE_VERIFICATION.md`。

## 2. 持久摘要 schema

阶段证据中的 `## 会话注意力摘要` 必须包含以下字段：

| 字段 | 要求 |
|---|---|
| 阶段 | 只能是 `review-rfc`、`verify-change` 或 `review-change` |
| 阶段结论 | 只能是 `PASS` 或 `FAIL`，必须与文档独立的 `## Verdict` 区块一致 |
| 注意力等级 | 只能是 `none`、`skim`、`review` 或 `decide` |
| 判断变化 | 只写相对 plan、RFC 或上一阶段的新信息；没有则写“无” |
| 关键发现 | 最多三项，按“阻塞项 → 判断变化 → 残余风险 → 非阻塞建议”排序 |
| 阻塞项 | 只写真正阻止下一阶段的事项；没有则写“无” |
| 残余风险 | 写阶段通过后仍会影响批准的风险；没有则写“无” |
| 人类动作 | 只能表达无动作、知悉、复核或需要作出的唯一决定 |
| 自动下一步 | 写 orchestrator 将真实执行的下一阶段、回退点或“等待人类决定” |
| 完整证据 | 当前 task 内的证据路径 |

推荐持久格式：

```markdown
## 会话注意力摘要

- **阶段**：`review-rfc`
- **阶段结论**：`PASS`
- **注意力等级**：`skim`
- **判断变化**：……
- **关键发现**：……
- **阻塞项**：无。
- **残余风险**：……
- **人类动作**：无动作。
- **自动下一步**：进入 `engineer`。
- **完整证据**：`.legion/tasks/<task-id>/docs/review-rfc.md`
```

摘要必须先写入阶段证据，再原样进入 handoff；不得让 handoff 和文件分别生成、出现不同结论。

## 3. 四级注意力

优先级固定为：

```text
decide > review > skim > none
```

| 等级 | 语义 | 会话投影 | 人类动作 |
|---|---|---|---|
| `none` | 阶段通过、没有判断变化、没有残余风险 | 只投影一行结论、自动下一步和证据路径 | 无动作 |
| `skim` | 有值得知悉的信息增量，但无需人类介入 | 投影变化或发现、自动下一步和证据路径 | 知悉；orchestrator 自动继续 |
| `review` | 有非阻塞的证据限制、高影响残余风险或需要最终复核的事项 | 完整投影会影响批准的发现、停止点和证据路径 | 在 merge 前复核；当前 contract 允许继续准备证据与 PR 材料 |
| `decide` | 需要选择互斥方案、接受风险、提供权限/权威证据，或核心验收主张不能被证明 | 完整投影唯一问题、必要选项、取舍、推荐和恢复点 | 立即决定；受影响路径停止 |

阶段 attention 取所有未解决事项按预注册规则导出的最高等级，不得因为大多数 verifier 通过、阶段总体可继续或会话需要简短而临场降级。明确且无需人类决定的普通实现失败至少使用 `skim`，按阶段 `FAIL` 正常回退；它不能覆盖同阶段其他事项导出的 `review` 或 `decide`。

## 4. 阶段链与 PR lifecycle matrix

| attention | 阶段链允许动作 | PR lifecycle 允许动作 | 停止点与恢复条件 |
|---|---|---|---|
| `none` | 按阶段结论正常前进或回退 | 正常执行 commit、push、PR、checks、auto-merge、merge、cleanup 与主工作区刷新 | 无额外停止点 |
| `skim` | 摘要投影后按阶段结论正常前进或回退 | 正常执行完整 PR lifecycle | 无需人类动作；信息必须进入 walkthrough |
| `review` | 允许继续生成后续验证、review、walkthrough、wiki 与 PR 审阅材料 | 允许 commit、push、创建/更新 PR 和运行 checks；不得启用 auto-merge、执行 merge、cleanup 或宣告完成 | 在 auto-merge / merge 前等待人类复核；复核结果落盘后恢复 PR lifecycle |
| `decide` | 立即停止阶段转换、自动重试和普通 `FAIL` 回退 | 只允许持久化当前证据和更新既有 PR 的决策说明；不得进入受影响实现、auto-merge、merge、cleanup 或完成态 | 等待人类决定；决定落盘后从声明的恢复阶段重跑 |

`decide` 优先于阶段 `FAIL` 的普通回退。只要最高 attention 为 `decide`，`自动下一步` 就必须写“等待人类决定”，orchestrator 不得自动退回 `spec-rfc`、`engineer` 或重试当前阶段。

`review` 是 merge 门，不是立即停止所有工程动作的阶段门。它允许继续补齐后续证据和 reviewer artifact，但不得越过 auto-merge / merge 边界，也不得借由 PR 已创建或 checks 已通过宣告完成。

## 5. Orchestrator 投影职责

orchestrator 收到阶段 handoff 后，必须按以下顺序执行：

1. 核对摘要已存在于当前阶段证据，且阶段结论、attention、人类动作和证据路径一致。
2. 在派生下一阶段、执行普通 `FAIL` 回退或继续 PR lifecycle **之前**，把摘要直接呈现给用户。
3. 仅按本协议压缩会话展示；不得改写阶段结论、attention 等级、人类动作或自动下一步。
4. 执行 attention 对应的阶段与 PR 门禁。
5. 需要 `review` 或 `decide` 时，按第 7 节持久化复核/决定后，才从声明的恢复点继续。

投影格式：

- `none`：一行即可，例如“`review-change · PASS · attention:none`；自动进入 walkthrough；证据：`…/review-change.md`。”
- `skim`：展示判断变化或关键发现，最多三项，并写明自动下一步与证据路径。
- `review`：展示为什么需要复核、禁止越过的 lifecycle 边界、残余风险和证据路径；可以明确说明后续证据准备仍会自动继续。
- `decide`：只提出一个清楚的问题，给出必要选项、主要取舍和推荐，并明确受影响路径与恢复阶段；不要同时抛出多个决策请求。

阶段 handoff 尚未投影时，不得先派生下一阶段再补发摘要。不能用“详见文件”“已审查通过”或单纯路径代替 `FAIL`、`review`、`decide` 的必要信息。

## 6. 噪音控制

- 只报告相对 plan、RFC 或上一阶段的新信息；不重复背景、完整测试命令、长日志、diff 或参考资料。
- 关键发现最多三项。其余非阻塞项只写“另有 N 项非阻塞建议”，并链接完整证据。
- 同一事实由多个 verifier 重复报告时合并为一项；保留来源与分歧，但不按 Agent 数量放大置信度。
- `PASS` 且无信息增量时必须使用 `none`，会话不为满足模板而展开“无”字段。
- `FAIL`、风险升级、验收变化、专业证据缺失不得只留在文件中。
- 会话展示可以压缩，阶段证据中的完整摘要字段不能省略。

## 7. 复核、决定与恢复

`review` 的复核结果和 `decide` 的决定由 orchestrator 追加到当前任务的 `log.md`，至少包含：

- `decision-id`
- 涉及的 `claim-id`；若不涉及 claim，写明对应阶段发现
- 唯一问题与必要选项
- 决定人和决定时间
- 实际选择或复核结论
- 接受风险的范围与明确不接受的范围
- 恢复阶段

`tasks.md` 同步“等待复核 / 等待决定”或“已决定，待从 `<阶段>` 恢复”的当前状态。不得仅凭 chat 中一句“继续”清除持久门禁。

恢复点按决定影响机械选择：

- 改变目标、验收或 scope：回到 `brainstorm` 更新 contract，再按入口规则选择阶段链。
- 改变设计或验证策略：从 `spec-rfc -> review-rfc` 重跑。
- 只补充 verifier、authority evidence、权限、运行条件或输入证据：从产生该 attention 的阶段重跑。
- `review` 复核接受现有风险且不改变 contract / 设计：从 PR lifecycle 的 auto-merge / merge 门恢复。

恢复前，orchestrator 必须重读 `log.md` 中对应 `decision-id` 与 `tasks.md` 当前状态，确认选择、风险范围和恢复点一致；不得依赖会话记忆猜测已批准内容。

## 8. 完成前检查

- 三个适用阶段都在既有证据中内嵌摘要，并由 handoff 原样返回。
- orchestrator 已在下一阶段前完成会话投影。
- 关键发现没有超过三项，额外建议只有数量和证据入口。
- 最高 attention 已按优先级执行，没有用普通 `FAIL` 回退覆盖 `decide`。
- `review` 没有越过 auto-merge / merge，`decide` 没有发生阶段转换或自动重试。
- 所有复核/决定已写入 `log.md`，状态和恢复点已同步到 `tasks.md`。
- 最终 walkthrough 能从既有阶段证据聚合信息，无需用户重新遍历原始文件。
