# LegionMind token 与认知效率优化

## 目标

在不削弱 LegionMind 现有功能完整性、阶段门禁和证据链的前提下，减少默认上下文消耗、阶段消息噪音与 HTML 交付生成成本。

## 问题陈述

只读或明确微操作仍容易触发完整 Legion；阶段回传重复上下文；多个 SKILL.md 在硬门、禁区、合理化和流程图之间反复表达同一规则；子代理实例缺少统一可辨识名称；walkthrough HTML 由 Agent 手写，既耗 token 又容易漂移。

## 验收标准

- [x] 入口明确分为普通路径、明确微操作路径和 Legion 路径：不修改代码/运行时配置/协议/schema/持久状态的工作，以及满足稳定目标、无设计分叉、低风险、单一有界验证的明确微操作，默认不启动 Legion；复杂行为变更才进入 Legion。
- [x] 默认热加载面从当前 70,581 个 Unicode 字符压缩到不超过 42,000，且 regression 以固定文件集合持续守住预算。
- [x] subagent handoff 使用最多五个字段的短消息协议，最多三条变化，不复制 task contract、diff、长日志或完整证据正文。
- [x] 新增无外部依赖的子代理命名脚本，每次生成 role-adjective-noun 形式且同批不重复；编排规则强制派生时使用生成名。
- [x] report-walkthrough 从单一 JSON 数据文件通过脚本生成 HTML、Markdown 和 PR body；Agent 不再手写 HTML/CSS，schema 缺字段时失败且内容正确转义。
- [x] CLI/MCP 与罕见操作细节从默认 skill 热路径移出或压缩为按需 reference，CLI 自身 help 继续作为命令真源。
- [x] 现有三种执行模式、阶段顺序、风险门、attention 门、认知验证状态、PR lifecycle 和 scheduler 独立 Verdict 语义保持完整。
- [x] 新增针对入口分层、上下文预算、短 handoff、命名和报告生成器的回归；根回归与 scheduler 回归全部通过。

## 假设 / 约束 / 风险

- **假设**: Node.js 22 可直接运行无依赖 .mjs 脚本。
- **假设**: 用户接受以稳定字符数作为 tokenizer 无关的默认上下文代理指标，并在测试报告中同时记录相对降幅。
- **假设**: 中风险任务采用延迟批准，RFC review PASS 后即可实现，最终 PR merge 作为批准。
- **约束**: 不删除现有执行模式、阶段、审查、验证、walkthrough、wiki 或 PR lifecycle 能力。
- **约束**: 普通路径只适用于不改变可执行行为/协议/持久状态的工作；明确微操作必须由请求本身充分限定且低风险。安全、数据、外部合约或跨模块变更不得降级。
- **约束**: 所有新增人类可读文案使用中文，路径、命令、schema key 和代码标识保持原文。
- **约束**: 不为随机命名或模板渲染新增第三方运行时依赖。
- **约束**: 所有写入、缓存和验证产物留在 repo worktree 内。
- **风险**: 过度瘦身可能把安全门或恢复条件藏得过深。
- **风险**: 微操作判定若过宽，可能让真实多步骤工作绕过 contract 与 review。
- **风险**: 只在文档中约定名字而未覆盖编排提示会导致规则无法落地。
- **风险**: 报告 schema 若表达力不足，会迫使 Agent 回到手写 HTML。

## 要点

- 热路径与冷路径分离：SKILL.md 只保留触发、硬门、流程、输出和条件 reference。
- 入口按写入性与复杂度分层，不再用 1% 可能性吞掉明确普通请求。
- 阶段完整证据继续写文件，会话与 subagent handoff 只传判断增量。
- 同一 report-data.json 驱动三种 reviewer artifact。
- 用回归预算而不是主观短小判断防止重新膨胀。

## 非目标

- 不删除或合并现有三种执行模式与固定阶段。
- 不降低安全、数据、外部合约、跨模块工作的风险等级。
- 不重写 scheduler，也不改变阶段级 `Verdict: PASS / FAIL`。
- 不引入第三方 tokenizer、随机名称库、模板引擎或 Pages 托管。
- 不用缩短原始证据来换取会话简洁；完整证据仍写入 task docs。

## 范围

- AGENTS.md 与 .opencode/agents/** 入口和编排提示。
- skills/legion-workflow/**、核心阶段 SKILL.md、legion-docs、git-worktree-pr、pr-html-render 与 report-walkthrough。
- 新增子代理命名、上下文预算审计和报告生成脚本、模板与 schema。
- tests/regression/**、当前 task docs 与 .legion/wiki/**。

## 设计索引 (Design Index)

> **Design Source of Truth**: .legion/tasks/optimize-token-cognitive-efficiency/docs/rfc.md

**摘要**:
- 以普通路径、微操作路径、Legion 路径组成入口分类器。
- 以 hot/cold 文档分层和字符预算减少默认上下文；罕见细节按需加载。
- 以命名脚本和 schema 驱动报告生成器替代每次临场生成。

## 阶段概览

1. **设计门禁** - 完成标准 RFC 与 review-rfc
2. **效率实现** - 更新入口、消息与 skills
3. **验证交付** - 量化成本并运行全量验证

---

*创建于: 2026-07-12 | 最后更新: 2026-07-12*
