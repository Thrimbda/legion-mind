# 人类注意力交接协议

适用于 `review-rfc`、`verify-change`、`review-change`。完整证据留在阶段文档；会话和 subagent handoff 只传判断增量。本文件是四级 attention、五字段映射和 lifecycle 门的单一真源。

## 持久摘要

阶段证据必须内嵌 `## 会话注意力摘要`，包含：

- `阶段`：三个适用阶段之一。
- `阶段结论`：`PASS/FAIL`，与独立 `## Verdict` 一致。
- `注意力等级`：`none/skim/review/decide`。
- `判断变化`：相对 contract、设计或上一阶段的新判断；无则写“无”。
- `关键发现`：最多三项，按阻塞、变化、残余风险、建议排序。
- `阻塞项`、`残余风险`：无则写“无”。
- `人类动作`：无动作、知悉、复核或唯一决定。
- `自动下一步`：真实下一阶段、回退点或“等待人类决定”。
- `完整证据`：当前 task 内 repo-relative locator。

阶段 `Verdict` 与 claim 级认知状态独立；claim 规则只认 `../../verify-change/references/REF_COGNITIVE_VERIFICATION.md`。

## 唯一五字段投影

阶段代理从已落盘摘要生成且只返回：

```text
结果: <displayName> · <stage> · <PASS|FAIL|BLOCKED|DONE> · attention:<level>
变化: <判断变化与关键发现合计最多三条>
风险: <阻塞项与残余风险；均无则省略整行>
下一步: <一个自动动作；review/decide 时含唯一人类动作与停止点>
证据: <最多三个 repo-relative locator>
```

机械映射：

| handoff | 持久摘要来源 |
|---|---|
| 结果 | 实例 `displayName` + 阶段 + 阶段结论 + 注意力等级 |
| 变化 | 判断变化后接关键发现；去重后合计最多三条 |
| 风险 | 当前阻塞项后接残余风险；均无时省略 |
| 下一步 | 人类动作 + 自动下一步；`review/decide` 必须含停止点 |
| 证据 | 完整证据及最多两个必要补充 locator |

不得复制 contract、完整摘要、长 diff、命令输出或证据正文。文件与投影冲突、三条限制无法保留关键变化、风险无法无损收敛、`review/decide` 缺唯一动作/停止点、locator 缺失或越出 repo 时，handoff 失败并停止推进。

## 四级门禁

优先级：`decide > review > skim > none`。取所有未解决事项的最高等级，不得因多数检查通过或追求简短而降级。

| 等级 | 使用条件 | 阶段与 PR 动作 |
|---|---|---|
| `none` | PASS 且无判断变化、阻塞或残余风险 | 一行投影后正常前进；完整 lifecycle 可继续 |
| `skim` | 有信息增量但无需介入；明确的普通实现失败至少为此级 | 投影最多三条变化后，按 Verdict 前进或回退；完整 lifecycle 可继续 |
| `review` | 非阻塞证据限制、高影响残余风险或需最终复核 | 可继续后续证据、walkthrough、wiki、commit、push、当前 PR、checks；禁止 auto-merge、merge、cleanup 和完成声明，直至复核落盘 |
| `decide` | 互斥方案、风险接受、权限/权威证据，或核心主张不可证明 | 停止阶段转换、自动重试和普通 FAIL 回退；只可落盘证据或更新决策说明，等待决定后重跑 |

`decide` 高于阶段 `FAIL`；其下一步必须是“等待人类决定”。`review` 是 merge 门，不阻止准备 reviewer artifact。

## 编排器职责

1. 核对 handoff 可从阶段证据机械重算，且实例名、Verdict、attention、动作、locator 一致。
2. 在派生、普通回退或继续 PR lifecycle 前向用户投影五字段消息。
3. 执行对应门禁；不能用“详见文件”隐藏 `FAIL/review/decide`。
4. `review/decide` 的复核或决定写入 `log.md`，同步 `tasks.md`，再从声明点恢复。

attention 只决定当前 lifecycle 是否暂停或恢复，本身不扩张仓库交付授权。terminal 后若需仓库改动，必须由用户明确授权；该授权可以启动新的 branch/PR，不受 task 级数字配额限制。

`none` 可压成一行；`skim` 只展示增量；`review` 明示复核原因与 merge 停止点；`decide` 只问一个问题，提供必要选项、取舍、推荐和恢复阶段。同一事实由多个 verifier 报告时合并，不按代理数量放大置信度；额外建议只报数量和证据入口。

## 决定与恢复

持久记录至少含 `decision-id`、claim/阶段发现、唯一问题与选项、决定人/时间、选择、接受与拒绝的风险范围、恢复阶段。仅凭 chat 中“继续”不能解除门禁。

- 目标/验收/scope 改变：回 `brainstorm`。
- 设计或验证策略改变：回 `spec-rfc -> review-rfc`。
- 只补 verifier、authority、权限、运行条件或输入：重跑产生 attention 的阶段。
- `review` 接受现状且不改 contract/设计：从 auto-merge/merge 门恢复。

恢复前重读对应 `log.md` 决定与 `tasks.md` 状态；walkthrough 最终聚合这些信息，避免人类再翻原始文件。
