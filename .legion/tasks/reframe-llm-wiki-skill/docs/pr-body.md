## What

本 PR 重塑 `llm-wiki` skill，使其回到 `llm-wiki.md` 的原始精神：wiki 是主知识产物，LLM 是 wiki 的程序员。改动范围限定在 `skills/llm-wiki/SKILL.md` 与 `skills/llm-wiki/references/*.md`，不涉及 runtime 或其他 skill。

## Why

当前 skill 虽然已有三层架构与证据纪律，但逐渐偏向“默认只读 + source summary 中转”的保守模型，削弱了 wiki 的持续沉淀能力。这次改造的核心，是把 durable knowledge、raw 真源、host contract 边界重新收回到同一套一致语义中。

## How

- 删除 `source summary` baseline，保留 legacy 兼容但不再作为 canonical 证据中转层。
- 新增 `raw-model.md`，定义 `raw bundle / source_id / raw locator / raw ref / selector` 真源。
- 将 query 改为“先回答，再判断 durable writeback”，并通过 `host contract / protected scope / blocked-by-host` 收边。
- 同步统一 architecture / workflows / conventions / page-types / scenarios / lint-contract / templates / canonical-layout。

## Testing

- `test-report.md`: **PASS**
- `review-code.md`: **PASS WITH NOTES**（无阻塞问题，仅 1 条可读性 note）

## Risk / Rollback

- 风险：若文案表达不够紧，后续 agent 可能把“默认可沉淀”误读为“默认可任意写回”。
- 回滚：本次仅为 skill 文档重构，无数据迁移；直接回退本 PR 即可。

## Links

- Plan: [`plan.md`](../plan.md)
- RFC: [`docs/rfc.md`](./rfc.md)
- RFC Review: [`docs/review-rfc.md`](./review-rfc.md)
- Test Report: [`docs/test-report.md`](./test-report.md)
- Code Review: [`docs/review-code.md`](./review-code.md)
- Walkthrough: [`docs/report-walkthrough.md`](./report-walkthrough.md)
