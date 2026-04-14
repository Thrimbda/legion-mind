# 子代理派生矩阵

> **唯一真源**：Legion orchestrator 的 subagent 派生规则只认本文件。commands 可以选择模式，但不能再内联另一套派生顺序。

## 核心规则

- orchestrator **必须**按阶段派生 subagents；不要把设计、实现、测试、审查、报告都留给自己隐式完成。
- 只有 task bootstrap、`plan.md / log.md / tasks.md` 写回、mode 选择、gate 判断由 orchestrator 自己承担。
- subagent 只负责自己角色的产物，并返回最小 handoff。

## 按模式的派生顺序

### `/legion` 默认模式

| 场景 | 必须派生 | 条件派生 | 阻塞门禁 | 预期产物 |
|---|---|---|---|---|
| Low risk | `engineer` → `run-tests` → `review-code` → `report-walkthrough` | 若涉及 auth / permission / trust-boundary / data exposure，则加 `review-security` | 测试失败或 code review blocking | `<taskRoot>/docs/` 下的实现阶段产物 |
| Medium risk | `spec-rfc` → `review-rfc` → `engineer` → `run-tests` → `review-code` → `report-walkthrough` | 若任务安全敏感，则加 `review-security` | `review-rfc` PASS 后才能编码 | 设计 + 实现阶段产物 |
| High risk | `spec-rfc` → `review-rfc` → `engineer` → `run-tests` → `review-code` → `review-security` → `report-walkthrough` | 默认无额外分支 | `review-rfc` PASS 后才能编码；安全 blocking 修复前不能结束 | 完整的设计 / 实现 / 安全产物 |

### `/legion-impl` 模式

| 场景 | 必须派生 | 条件派生 | 阻塞门禁 |
|---|---|---|---|
| 已有批准设计 | `engineer` → `run-tests` → `review-code` → `report-walkthrough` | 若改动涉及 auth / permission / protocol / secrets / external input，则加 `review-security` | 测试失败或 blocking review 时回环到 `engineer` |

### `/legion-rfc-heavy` 模式

| 场景 | 必须派生 | 条件派生 | 阻塞门禁 | 预期产物 |
|---|---|---|---|---|
| 仅设计的 heavy RFC | `spec-rfc` → `review-rfc` → `report-walkthrough` | 默认无额外分支 | `review-rfc` PASS 后才能交付设计 handoff | `research.md`、`rfc.md`、`review-rfc.md`、`report-walkthrough.md`、`pr-body.md` |

## `review-security` 触发规则

满足以下任一条件时，必须派生 `review-security`：

- auth / permission / identity / session / token
- trust boundary 或 protocol boundary 发生变化
- data exposure / privacy / multi-tenant isolation
- secret handling / signing / crypto / webhook verification
- user-controlled input 进入敏感路径
- 任务被明确标记为 security-sensitive

## 写回职责

- orchestrator 写：`plan.md`、`log.md`、`tasks.md`
- subagents 只写自己在 `<taskRoot>/docs/` 下的任务产物
- 如果 command 文案与本矩阵冲突，以本矩阵为准

## 常见错误

- 只在 command 里提到 subagent 名字，却没把它当强规则
- 跳过 `review-rfc` 就直接让 `engineer` 开工
- 把 `review-security` 当成“最后想起来才跑”的可有可无步骤
- 让 orchestrator 自己脑补 subagent 顺序，而不是按本矩阵派生
