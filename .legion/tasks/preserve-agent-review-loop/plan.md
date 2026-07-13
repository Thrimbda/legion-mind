# 保留多 Agent 评审循环并修复报告语义

## 目标

在不减损 RFC 作者与独立评审、实现与验证、验证与独立验收循环的前提下，修复报告状态一致性、缺失领域 verifier 的如实收口和 OpenCode 报告代理写入权限。

## 问题陈述

当前报告 schema 可把失败证据包装成 PASS，无法表达无 verifier 的非阻塞领域主张，OpenCode 报告代理又无权写唯一 JSON 真源；同时阶段代理可选化会减损既有写作与评审循环。

## 验收标准

- [x] 任何 FAIL/BLOCKED 验证或当前阶段失败证据都不能通过 PASS 报告校验
- [x] 无可用 verifier 的 domain/authority INCONCLUSIVE 或 DEFERRED claim 能生成报告且明确展示缺口、升级路径或触发协议
- [x] OpenCode report-walkthrough 代理可以编辑 report-data.json，不需借 shell 绕过 JSON 写权限
- [x] spec-rfc 与 review-rfc、engineer 与 verify-change、verify-change 与 review-change 均由不同阶段 Agent 执行，FAIL 按原循环回退
- [x] 测试覆盖状态冲突、缺 verifier 正例、权限一致性和强制阶段派生语义
- [x] 全部新增或修改的文档与用户可见文案使用中文

## 假设 / 约束 / 风险

- **假设**: report-data.json 继续作为机器校验的单一中间真源，由生成器派生 HTML、Markdown 与 PR body
- **假设**: report-walkthrough 只负责通过 review 后的交付报告，因此顶部阶段结论仍为 PASS，但必须与证据一致
- **约束**: 不削弱 RFC 到独立 review、实现到验证、验证到独立验收的大循环
- **约束**: 不允许伪造 verifier 或 provenance
- **约束**: 生成产物仍禁止手写，所有修改在隔离 worktree 中完成并通过 PR 交付
- **风险**: 过严的一致性规则可能误伤历史失败记录
- **风险**: 放宽 verifier 字段可能让真正已验证的领域主张缺少 provenance
- **风险**: 阶段强制派生可能重新引入不必要上下文成本，必须依靠短 handoff 而不是取消隔离

## 要点

- 8

## 范围

- skills/report-walkthrough/**
- skills/verify-change/**
- skills/legion-workflow/**
- scheduler evidence verifier 及其测试：必须与报告生成器共用严格的当前 Verdict 解析契约
- .opencode/agents/report-walkthrough.md
- tests/regression/**
- 安装与权限相关必要测试

## 设计索引 (Design Index)

> **Design Source of Truth**: docs/rfc.md；docs/review-rfc.md

**摘要**:
- 报告顶层 PASS 与证据状态采用 fail-closed 一致性检查
- 缺 verifier 的未决领域主张用显式缺口而非伪 provenance 表达
- 阶段隔离恢复为强制派生，token 优化只发生在上下文加载与五字段 handoff
- 当前仓库不具备跨 transport 身份信任根，因此不新增伪执行证明；随机 displayName、transportId 或 session id 都不得充当身份真实性证明
- 报告 schema 升级到 v1.1；v1.0 产物只读保留，旧输入不得由新生成器重渲染

## 阶段概览

1. **设计与独立评审** - 已完成，独立 `review-rfc` 为 PASS
2. **实现** - 已完成 schema、renderer、scheduler、权限和阶段语义修复
3. **验证与验收** - 已完成定向、全量回归与独立 review-change
4. **交付** - walkthrough 已生成，wiki 与 PR lifecycle 收口中

---

*创建于: 2026-07-13 | 最后更新: 2026-07-13*
