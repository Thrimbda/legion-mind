# 人类注意力交接与验证路由 RFC 第二轮审查

## 阻塞发现

无。

## 原阻塞复核

### 1. attention 与 lifecycle 边界

已解决。RFC 现在用明确矩阵区分四级 attention：`review` 只允许推进到验证、审查、walkthrough、wiki、PR 创建/更新与 checks，明确禁止 auto-merge、merge、cleanup 和完成态；`decide` 优先于普通阶段 `FAIL` 回退，必须停止阶段转换并等待决定。决定写入 `log.md`、状态同步到 `tasks.md`，且按 contract、设计或证据变化指定重跑阶段，边界与恢复路径均可执行。

### 2. Claim 的领域路由与阻塞级别

已解决。每个关键 claim 预注册 `domain-id`、`required-capability`、`required-method`、`criticality`、`risk-if-wrong` 和 `blocking-policy`；候选 verifier 必须同时覆盖领域、能力与方法。attention 由各未解决 claim 按固定规则导出并取最高等级，verifier 不能同时选择自身并降低阻塞级别。

### 3. verifier 真实加载的可复核性

已解决。RFC 要求保存精确 locator、版本或 SHA-256、实际读取资源清单、命令或工具调用、结果标识、repo 内原始输出及其与 `claim-id` 的映射；`review-change` 必须重开 locator、重算摘要并核对输出。任一必需 provenance 缺失即导出 `INCONCLUSIVE`，验证计划也包含只有自称“已加载”但缺 provenance 的负例。

### 4. authority evidence 的正负路径

已解决。规则已区分权威证据缺失/无效与证据已取得两种情况；前者导出 `INCONCLUSIVE`，后者只有在主体、资质来源、适用范围、时间有效性、原始 locator、完整性或签名校验全部通过时，才可与其他证据共同支持 `PASS`，且不允许权威身份越权覆盖范围外 claim。

## 非阻塞建议

- 实现回归时应保留 RFC 已列出的 attention matrix、provenance 与 authority 正负 fixture，避免只做关键词存在性检查。
- provenance 原始输出落盘时继续执行敏感信息处理，并让缺失原始证据导出 `INCONCLUSIVE`，不要为了报告完整度复制秘密或个人数据。

## Verdict

PASS

## 结论

四项原阻塞均已以可执行、可复核且可回退的规则闭合。设计范围没有新增阶段、运行模式或 scheduler 状态机改造，可以进入实现。

## 会话注意力摘要

- **阶段**：`review-rfc`
- **阶段结论**：`PASS`
- **注意力等级**：`skim`
- **判断变化**：四项原阻塞均已解决，RFC 已具备实现准入条件。
- **关键发现**：attention 停止与恢复边界已明确；领域路由已预注册；verifier 与 authority 证据均可复核。
- **阻塞项**：无。
- **残余风险**：实现回归若只检查关键词，将不足以证明协议负例；该风险已由 RFC 验证条目约束。
- **人类动作**：无动作。
- **自动下一步**：交回 `legion-workflow` 进入实现阶段。
- **完整证据**：`.legion/tasks/human-attention-verification-routing/docs/review-rfc.md`
