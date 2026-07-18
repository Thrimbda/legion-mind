---
name: legion-docs
description: 当需要创建、更新、校验 `.legion` 任务文档，或判断信息归属时使用。
---

# legion-docs

定义 Legion 文档归属与密度。默认中文；路径、schema 字段、命令、测试/错误原文保持原样。

## 单一归属

| 信息 | 落点 |
|---|---|
| 稳定目标、验收、scope、假设、约束、风险、设计索引 | `plan.md` |
| 过程、决定、blocker、handoff | `log.md`（append-only） |
| 当前阶段、检查项、状态 | `tasks.md` |
| RFC、review、验证、walkthrough、PR 摘要 | `<taskRoot>/docs/*` |
| 跨任务当前决定、模式、维护债务 | `.legion/wiki/*` |

`plan.md` 是面向 tech lead 的唯一任务契约，不写 mini-RFC、测试输出或调试日志；`tasks.md` 只保留状态；raw task docs 不兼任 wiki。

## 注意力与决定

- `review-rfc`、`verify-change`、`review-change` 的完整 `## 会话注意力摘要` 分别内嵌于 `docs/review-rfc.md`、`docs/test-report.md`、`docs/review-change.md`。
- chat/subagent handoff 只使用五字段投影 `结果 / 变化 / 风险 / 下一步 / 证据`；不新建 `attention.md` 或平行台账。
- `review` 复核与 `decide` 决定追加到 `log.md`，至少记录 decision-id、关联 claim/发现、唯一问题与选项、决定人/时间、结论、风险接受范围和恢复阶段；`tasks.md` 同步等待或恢复状态。
- chat 中一句“继续”不能清除持久门禁。改变目标、验收或 scope 时更新 `plan.md` 并重新收敛；仅调整设计/验证时从协议指定阶段恢复。
- attention schema 与门禁只认 `../legion-workflow/references/REF_HUMAN_ATTENTION.md`。

## docs 路由

- alternatives / rollback / migration / verification design：`docs/rfc.md` 或附录。
- 命令、失败输出、claim evidence：`docs/test-report.md`。
- reviewer summary：`summary` 直接写简洁交接；`walkthrough` 才由 `report-data.json` 生成 walkthrough 与 `pr-body.md`。

## 条件引用

- 需要目录、标题、Review 语法：`references/REF_SCHEMAS.md`
- 需要多 Agent 归档：`references/REF_LOG_SYNC.md`
- 需要写作检查：`references/REF_BEST_PRACTICES.md`
- 需要 attention 语义：`../legion-workflow/references/REF_HUMAN_ATTENTION.md`
