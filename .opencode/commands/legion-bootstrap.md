---
description: Legion Bootstrap（可选）：生成/更新 .legion/playbook.md（项目规约索引）
agent: legion
---

用于在新仓库首次启用时建立“项目上下文索引”，减少后续重复调研与反复提问。

执行：
1) `skill({ name: "legionmind" })`
2) 若 `.legion/` 不存在：创建 `.legion/` 与最小结构（参考 REF_SCHEMAS）
3) 生成或更新 `.legion/playbook.md`，内容建议包括：
   - Invariants / Conventions（命名、目录结构、lint/format）
   - Test Commands（如何跑测试/CI）
   - Release/Deploy（如有）
   - Decision Log（关键设计决策摘要 + 链接到 ADR/RFC）
   - Domain Glossary（领域术语）
4) 只写 playbook，不做代码改动
