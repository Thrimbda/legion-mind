---
name: review-rfc
description: 当已有设计需要在实现前检查隐藏复杂度、弱假设、回滚缺口或不可验证主张时使用。
---

# review-rfc

只判断设计能否过门，不重写 RFC。完整结论写 `docs/review-rfc.md`；默认中文，协议标识与技术原文保持不变。

## 硬门

- 必须先有 RFC 或 design source。
- blocking finding 必须说明定位、为何导致不可实现/不可验证/不可回滚、影响与最小修复方向。
- 文档必须含独立 `## Verdict`，下一有效内容只能是 `PASS` 或 `FAIL`。
- 按 `../legion-workflow/references/REF_HUMAN_ATTENTION.md` 在文档内写完整 `## 会话注意力摘要`；handoff 只投影五字段，不复制完整摘要。

## 审查

检查：不必要复杂度、弱假设、scope 歧义、真实取舍是否缺 alternatives、verification/rollback 缺口；对关键 claim 检查预注册与验收/风险/阻塞策略的连接，以及 verifier 发现、真实加载、provenance、authority 正负路径、claim 状态到 Verdict/attention/停止点的映射。认知验证语义以 `../verify-change/references/REF_COGNITIVE_VERIFICATION.md` 为准。

只有会让设计不可实施、不可验证或不可回滚的问题才判 `FAIL`；清晰度或后续优化建议不得伪装成 blocker。

## 输出与 handoff

1. 写 blocking findings、非阻塞建议、精确 Verdict 和完整注意力摘要。
2. 摘要只记录相对 RFC 的判断变化，关键发现最多三项；`FAIL`、风险升级、验收变化和专业证据缺口必须可见。
3. 最终 handoff 使用统一五字段投影：`结果 / 变化 / 风险 / 下一步 / 证据`。变化与关键发现合计最多三条；证据最多三个 repo-relative locator。若文件与投影冲突、证据缺失、风险无法无损收敛，或 `review/decide` 缺唯一人类动作和停止点，则 handoff 失败。

## 退出

- `FAIL`：通常退回 `spec-rfc`；attention 为 `decide` 时先等待决定持久化。
- `PASS`：交回 `legion-workflow`；`none/skim` 可实现，`review` 不得越过 merge 门，`decide` 停止阶段转换。

## 引用

- attention：`../legion-workflow/references/REF_HUMAN_ATTENTION.md`
- 三轴、状态、verifier：`../verify-change/references/REF_COGNITIVE_VERIFICATION.md`
