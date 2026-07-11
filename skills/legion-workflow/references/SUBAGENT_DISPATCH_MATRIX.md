# 子代理派生矩阵

> 唯一运行时真源。运行模式与场景可以映射到不同入口，但不能复制另一套顺序。
>
> 本矩阵只适用于 `legion-workflow` 已完成入口判断、任务 contract 已稳定之后。`bypass`、`restore`、`brainstorm` 是入口运行状态，不是执行模式，也不在本矩阵中新增阶段链。
>
> 对会修改仓库文件的开发任务，`git-worktree-pr` envelope 包裹下列既有模式与阶段链；它不新增模式、不改变派生顺序。PR follow-up / cleanup / main refresh 属于任务完成 lifecycle，不是本矩阵的第四种执行模式。

## 核心规则

- 编排器只负责门禁判断、状态恢复、模式选择、`.legion` 写回与收口写回
- 阶段性工作必须交给对应阶段的技能 / 子代理
- `legion-wiki` 是固定收口阶段，不是可选优化
- 阶段技能 / 子代理必须真实加载或派生；不要凭记忆模拟阶段结果
- 修改型开发任务在 `git-worktree-pr` worktree 内运行下列阶段链；主工作区只用于准备、只读检查和最终刷新
- `review-rfc`、`verify-change`、`review-change` 必须在既有阶段证据内嵌 `## 会话注意力摘要`，并由 handoff 原样返回
- orchestrator 必须在收到上述 handoff 后、派生下一阶段或执行普通回退前，按 `REF_HUMAN_ATTENTION.md` 投影摘要并执行 attention 门禁

## 默认实现模式

| 场景 | 必须派生 | 条件派生 | 阻塞门禁 |
|---|---|---|---|
| 低风险 | `engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | 无 | `review-change` 未通过前不得结束 |
| 中风险 | `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | 无 | `review-rfc` 通过前不得编码 |
| 高风险 | `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | `review-change` 必须展开安全视角 | `review-rfc` 通过前不得编码；安全阻塞项修复前不得结束 |

## 已批准设计后的续跑模式

| 场景 | 必须派生 | 阻塞门禁 |
|---|---|---|
| 已有批准设计 | `engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | `review-change` 未通过时回到 `engineer` |

## 重型仅设计模式

| 场景 | 必须派生 | 阻塞门禁 |
|---|---|---|
| 仅设计重型 RFC | `spec-rfc -> review-rfc -> report-walkthrough -> legion-wiki` | `review-rfc` 通过前不得交付设计 handoff |

## 注意力侧带门禁

会话注意力是上述三条阶段链的统一返回协议，不是第四种模式，也不新增阶段。摘要字段、`none / skim / review / decide` 语义、噪音规则和完整阶段/PR lifecycle matrix 只认 `REF_HUMAN_ATTENTION.md`。

- `none` / `skim`：摘要投影后按表中既有阶段结论正常前进或回退。
- `review`：允许继续派生后续验证、review、walkthrough、wiki 与 PR 审阅材料；不得启用 auto-merge、执行 merge、cleanup 或宣告完成，直到复核结果持久化。
- `decide`：优先于阶段 `FAIL` 的普通回退；立即停止阶段转换、自动重试和受影响 PR lifecycle，等待决定持久化后从声明的恢复阶段重跑。
- attention 等级不得改写本矩阵的阶段顺序；解除门禁后只能回到已声明的既有阶段，不得临时派生新阶段。

## 安全视角触发条件

`review-change` 命中以下任一条件时，必须展开安全视角：

- 鉴权 / 权限 / 身份 / 令牌 / 会话
- 信任边界或协议边界变更
- 密钥 / 签名 / 加密 / webhook 校验
- 数据暴露 / 隐私 / 租户隔离
- 用户可控输入进入高权限路径

## 写入归属

- orchestrator 写：`plan.md`、`log.md`、`tasks.md`
- 子代理写：`<taskRoot>/docs/*.md`
- `legion-wiki` 写：`.legion/wiki/**`
