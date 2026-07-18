---
name: spec-rfc
description: 当稳定 contract 仍有设计分叉、回滚风险、验证歧义或多模块协调问题需要在实现前解决时使用。
---

# spec-rfc

只产出设计证据，不改 `.legion` 三文件、不写生产代码、不替代 `review-rfc`。默认用中文；技术标识与错误原文保持原样。

## 硬门

- 必须已有稳定 `plan.md`；contract 漂移则退回 `brainstorm`。
- Strict、显式 `design:rfc`，或存在真实设计取舍时，必须先完成本阶段；Medium/Standard 本身不自动要求 RFC。
- 涉及领域能力、外部权威、延后验证或判断性决策的关键 claim，选择 verifier 前必须完成预注册。

## 何时使用

用于比较真实设计选项，澄清边界、回滚、验证或多模块协调；heavy profile 还需证据化现状摸底。设计已充分、只需实现时不用；对抗审查属于 `review-rfc`。

## 流程与产物

1. 读取 `plan.md` 与已有证据，确认 profile。
2. design-lite 可把摘要留在 contract 并按需写短 RFC；standard 写 `docs/rfc.md`；heavy 先写 `docs/research.md` 再写 RFC，复杂里程碑可另写 `docs/implementation-plan.md`。
3. RFC 至少说明 Context、真实 Options、Decision、边界、Verification 和 Rollback；不写成实现手册全集。
4. 对关键 claim 写清“哪种方法产生什么证据、对应哪个 claim、各结果导出何种 claim 状态和阶段 Verdict”，并设计正向与失败路径。
5. 交给 `review-rfc`，通过前不得实现。

存在关键 claim 时完整遵循 `../verify-change/references/REF_COGNITIVE_VERIFICATION.md`。至少确认预注册字段、领域/能力/方法、原始证据、错误代价、阻塞策略、owner；按需设计 verifier provenance、authority 校验、deferred 触发协议或 judgmental 决策记录。verifier 不得改变自身适用范围、`criticality` 或 `blocking-policy`。会改变 contract 的缺项退回 `brainstorm`；纯技术方法可在 RFC 补全并交审。

## 禁止与退出

- 不修代码，不把未确认背景写成事实，不以“找 Agent 看看”代替领域能力。
- 不把未来可观察、当前无方法和判断性观点混为一种“不可验证”。
- claim 状态不得替代精确阶段 `Verdict: PASS / FAIL`。
- contract 不稳：`brainstorm`；设计完成：`review-rfc`。

## 条件引用

- profile：`references/REF_RFC_PROFILES.md`
- heavy：`references/TEMPLATE_RESEARCH.md`、`references/TEMPLATE_RFC_HEAVY.md`
- 需要里程碑：`references/TEMPLATE_IMPLEMENTATION_PLAN.md`
- 关键 claim：`../verify-change/references/REF_COGNITIVE_VERIFICATION.md`
