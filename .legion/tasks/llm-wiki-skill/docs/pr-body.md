## What

新增 `llm-wiki` skill，并按 skill-creator 约束拆成一个轻量 `SKILL.md` 加 3 个 references 文件。
本次交付覆盖 `llm-wiki` 的核心模式：raw sources / wiki / schema 三层架构，以及 ingest / query / lint 三类操作。
同时把 `index.md` / `log.md` 的最小维护契约固化为可复用约束。

## Why

仓库此前只有 `llm-wiki.md` 作为参考文本，没有一个可直接复用的正式 skill，导致 agent 每次都要重新理解工作流边界。
这次把模式收敛成稳定契约，目标是让 agent 能以“持久化 wiki 维护者”的方式工作，而不是把 wiki 当一次性 RAG 素材。
重点收紧了 query 写回风险：默认严格只读，只允许在显式授权下写回，并要求日志最小化与脱敏。

## How

`SKILL.md` 只保留使用时机、核心原则、操作入口和 references 导航，避免入口膨胀。
`references/architecture.md`、`workflows.md`、`conventions.md` 分别承载架构边界、三类工作流、以及 `index.md` / `log.md` / 互链约定。
其中 query 明确采用“双重门槛”：用户明确要求沉淀 + 宿主 schema 显式定义写回流程；`log.md` 只记录安全 ID、动作摘要与授权依据，不复制敏感原文。

## Testing

- 结果：PASS
- 详情见 [test-report](./test-report.md)
- 已检查 scope、frontmatter、内容覆盖、query 只读门禁，以及 `log.md` 的最小化/脱敏约定。

## Risk / Rollback

- 主要风险是宿主 schema 若未定义清楚，可能在接入层面对授权写回产生误解。
- 回滚边界仅限 `skills/llm-wiki/**`；若发现写回门禁不够稳，优先收紧为彻底只读。
- 若日志规则引发敏感信息误记，通过追加更正/撤销记录修复，并保持“仅安全 ID + 安全摘要”的基线。

## Links

- Plan: [../plan.md](../plan.md)
- RFC: [./rfc.md](./rfc.md)
- Review RFC: [./review-rfc.md](./review-rfc.md)
- Review Code: [./review-code.md](./review-code.md)
- Review Security: [./review-security.md](./review-security.md)
- Walkthrough: [./report-walkthrough.md](./report-walkthrough.md)
