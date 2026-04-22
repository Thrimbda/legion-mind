# 子代理派生矩阵

> 唯一运行时真源。运行模式与场景可以映射到不同入口，但不能复制另一套顺序。

## 核心规则

- 编排器只负责门禁判断、状态恢复、模式选择、`.legion` 写回与收口写回
- 阶段性工作必须交给对应阶段的技能 / 子代理
- `legion-wiki` 是固定收口阶段，不是可选优化

## 默认实现模式

| 场景 | 必须派生 | 条件派生 | 阻塞门禁 |
|---|---|---|---|
| 低风险 | `engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | 无 | `review-change` 未通过前不得结束 |
| 中风险 | `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | 无 | `review-rfc` 通过前不得编码 |
| 高风险 | `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | `review-change` 必须展开安全视角 | `review-rfc` 通过前不得编码；安全阻塞项修复前不得结束 |

## 已批准设计的续跑模式

| 场景 | 必须派生 | 阻塞门禁 |
|---|---|---|
| 已有批准设计 | `engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | `review-change` 未通过时回到 `engineer` |

## 重型仅设计模式

| 场景 | 必须派生 | 阻塞门禁 |
|---|---|---|
| 仅设计重型 RFC | `spec-rfc -> review-rfc -> report-walkthrough -> legion-wiki` | `review-rfc` 通过前不得交付设计 handoff |

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
