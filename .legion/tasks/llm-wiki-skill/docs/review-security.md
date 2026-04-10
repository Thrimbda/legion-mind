# 安全审查报告

## 结论
PASS

## 审查范围
- `skills/llm-wiki/SKILL.md`
- `skills/llm-wiki/references/architecture.md`
- `skills/llm-wiki/references/page-types.md`
- `skills/llm-wiki/references/workflows.md`
- `skills/llm-wiki/references/conventions.md`
- `.legion/tasks/llm-wiki-skill/docs/rfc.md`

## 阻塞问题
- 无。

## 建议（非阻塞）
- 建议在宿主 schema 示例里补一个最小“等价导航/日志机制声明模板”，把职责、可写 scope、允许字段、写法（追加/更新）放在同一处，降低集成方误配风险。
- 建议在日志基线中补一个“安全 ID”示例，避免宿主把真实文件名、URI 或内部路径误当作安全标识。
- 当前变更为文档型 skill，未见脚本、依赖清单或硬编码密钥；供应链/CVE 风险在本次范围内不构成阻塞。若后续新增脚本或自动化写回能力，建议补做依赖安全审查。

## 修复确认
1. **等价 `index.md` / `log.md` 机制三重约束已收口**：文档已明确只有在“宿主显式声明 + 位于 wiki 根或宿主声明的可写 scope + 允许字段/写法已定义”三项同时满足时，等价导航/日志机制才允许写回；否则只能读取、不得回写。该约束已同时落在主入口、架构说明、工作流和约定层，足以封堵把任意宿主文件误判为可写导航/日志落点的风险。参见 `skills/llm-wiki/SKILL.md:10,17`, `skills/llm-wiki/references/architecture.md:50,54-57,64-71`, `skills/llm-wiki/references/workflows.md:11-21,35-37,63-67,93-108`, `skills/llm-wiki/references/conventions.md:9-10,22-25`。
2. **query 仍 secure-by-default**：默认严格只读；仅在“用户明确要求沉淀 + 宿主 schema 显式规定写回流程、目标页型、允许字段、导航/日志同步方式”同时满足时才允许写回，且已明确“结构化回答、page type 建议、沉淀建议都不构成授权”。未见 query 到 write 的状态机绕过路径。参见 `skills/llm-wiki/SKILL.md:24-26`, `skills/llm-wiki/references/workflows.md:55-75`。
3. **schema 缺失时的保守模式仍清楚**：首次接管要求显式盘点缺失项；若关键信息不完整，采取只读 query、最少新增页面、显式报告缺口，且不得把未授权宿主文件当作可写导航/日志机制。该模式满足 secure-by-default。参见 `skills/llm-wiki/SKILL.md:17-19`, `skills/llm-wiki/references/architecture.md:37-71`, `skills/llm-wiki/references/workflows.md:16-21`。
4. **lint / maintenance 写回边界在安全范围内**：`lint` 默认仅更新 maintenance 页或必要状态标记；只有宿主对其他页型修复有显式流程时才可直接修正文档，且日志追加也受三重可写前提约束。这样可避免 lint 借维护名义扩大写面。参见 `skills/llm-wiki/references/workflows.md:91-114`。
5. **日志安全基线保持保守**：append-only、更正通过追加记录完成；默认只记录安全 ID、动作类型、摘要和授权依据，不复制敏感摘录、凭证、个人数据、内部路径或附件真实地址。信息泄露与抵赖风险控制到位。参见 `skills/llm-wiki/references/conventions.md:20-37,84-88`。

## 修复指导
1. 继续保持等价导航/日志机制的三重门槛，不要回退为仅凭“宿主提到过”即可写回。
2. 宿主接入时优先把可写 scope、允许字段、写法和同步规则集中定义，避免多文件分散约束造成误判。
3. 若未来新增脚本、自动化批量写回或附件搬运能力，应重新执行 STRIDE 与误用边界审查。

[Handoff]
summary:
  - 已重新审查 llm-wiki 本轮细化改动的安全/误用边界。
  - 结论为 PASS；上轮关于等价 index/log 机制的唯一阻塞项已被三重约束收口。
  - query 默认只读、schema 缺失保守模式、lint/maintenance 安全写回边界均保持成立。
decisions:
  - (none)
risks:
  - 若后续宿主实现未按文档提供明确可写 scope/字段/写法，实际集成仍可能退化为人工误配风险。
files_touched:
  - path: /Users/c1/Work/legion-mind/.legion/tasks/llm-wiki-skill/docs/review-security.md
commands:
  - (none)
next:
  - 如需进一步加固，可补宿主 schema 的最小声明模板与安全 ID 示例。
open_questions:
  - (none)
