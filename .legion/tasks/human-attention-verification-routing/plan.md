# 人类注意力交接与验证路由

## 目标

让 LegionMind 在 chat session 中主动呈现低噪音的阶段审计摘要，并按主张性质、验证时机与专业门槛路由不同验证方式。

## 问题陈述

现有工作流缺少面向人类注意力的实时会话投影，也缺少可扩展的认知验证分类与领域 verifier 协议，容易让关键审计意见只在 Agent 之间流转，并把证据不足或判断性结论误写成 PASS。

## 验收标准

- [x] review-rfc、verify-change、review-change 均定义统一的中文会话注意力摘要，并要求 orchestrator 在阶段结束后直接呈现给用户。
- [x] 注意力摘要明确区分 none、skim、review、decide，限制关键发现数量，包含判断变化、阻塞项、残余风险、人类动作、自动下一步和完整证据入口。
- [x] 验证模型按主张性质、验证时机、专业门槛三个正交维度分类，并支持 PASS、FAIL、INCONCLUSIVE、DEFERRED、RECOMMENDATION 等诚实结论语义。
- [x] verify-change 能发现并真实加载适用的领域 verifier；缺少 verifier 或外部权威时不得伪造专业结论。
- [x] 领域 verifier 使用统一中文返回协议，说明证据来源、独立性、反例尝试、置信度、残余不确定性和通俗解释。
- [x] 延后验证记录触发条件、owner、届时方法和当前风险；判断性主张不使用客观 PASS 冒充事实。
- [x] report-walkthrough 聚合阶段注意力与认知验证结果，最终交付不要求用户重新遍历原始文件。
- [x] 新增回归检查覆盖关键协议，根回归与 scheduler 回归均通过，所有新增或改写的人类可读内容为中文。

## 假设 / 约束 / 风险

- **假设**: 完整任务文档继续作为持久真源，chat session 摘要是其低噪音投影，不新增独立注意力文档。
- **假设**: 当前运行时仍以 skill 协议驱动阶段与子代理，因此本次通过 workflow、阶段 skill、reference 和回归契约实现。
- **假设**: 领域 verifier 可以来自仓库内或已安装 skill；若不存在，正确结果是证据不足或升级，而不是通用模型自我认证。
- **假设**: 现有 scheduler 的 Verdict: PASS 兼容语义需要保留，认知验证状态作为更细粒度字段补充。
- **约束**: 所有新增和修改的人类可读文案默认使用中文。
- **约束**: 不增加第四种 Legion 执行模式，不改变既有阶段顺序。
- **约束**: 不把 attention packet 实现成新的重量级文档或必经 skill。
- **约束**: 保留低风险快速路径和现有 PR lifecycle。
- **约束**: 不得把多个 Agent 的一致意见等同于领域专家或外部权威证据。
- **风险**: 过度强制摘要可能制造新的会话噪音，需要按信息增量和 attention 等级压缩。
- **风险**: 过多验证分类可能增加 contract 负担，需要只在真实 claim 上使用并提供合理默认值。
- **风险**: 领域 verifier 路由若缺少独立性与来源约束，可能形成更强的虚假置信。
- **风险**: 新的 INCONCLUSIVE 或 DEFERRED 语义可能与现有 PASS 门禁冲突，需要明确阶段级兼容规则。

## 非目标

- 不在本次实现生产级专家市场、自动预约外部专家或完整时间调度器。
- 不要求每个低风险任务填写完整验证矩阵。
- 不重写 scheduler 为新的 attention queue；仅保持协议可被其后续消费。
- 不移除完整 review、test-report 或 walkthrough 原始证据。

## 推荐方向

- 把“会话注意力摘要”定义为阶段返回协议，而不是新增文件或新增执行阶段。
- 让 `verify-change` 先分类主张，再按领域发现并真实加载 verifier，最后聚合证据。
- 保留阶段级 `Verdict: PASS / FAIL` 兼容门禁，在 claim 级补充更诚实的认知状态。
- 让最终 walkthrough 复用阶段摘要，避免再次要求 reviewer 穿透全部原始文档。

## 范围

- skills/legion-workflow/**
- skills/brainstorm/SKILL.md
- skills/spec-rfc/SKILL.md
- skills/review-rfc/SKILL.md
- skills/verify-change/**
- skills/review-change/SKILL.md
- skills/report-walkthrough/**
- skills/legion-docs/**
- tests/regression/**
- .legion/tasks/human-attention-verification-routing/**
- .legion/wiki/**

## 设计索引 (Design Index)

> **Design Source of Truth**: .legion/tasks/human-attention-verification-routing/docs/rfc.md

**摘要**:
- 阶段 review 与 verification 产生同构的会话注意力摘要，orchestrator 负责低噪音投影。
- 验证模型拆成主张性质、验证时机、专业门槛三轴，避免把不同原因的不可验证混成一类。
- verify-change 作为验证路由器和证据聚合器，领域 verifier 作为可插拔能力，不新增主流程阶段。
- 最终 walkthrough 汇总阶段摘要、认知状态和需要人类处理的唯一动作。

## 阶段概览

1. **设计门禁** - 完成 RFC 与领域 verifier 协议
2. **协议实现** - 更新 workflow 与阶段 skills
3. **验证与交付** - 运行根回归与 scheduler 回归

---

*创建于: 2026-07-11 | 最后更新: 2026-07-11*
