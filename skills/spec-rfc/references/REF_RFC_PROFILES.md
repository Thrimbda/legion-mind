# RFC Profiles

## Purpose

选择 RFC 档位的目标不是写更长的文档，而是让设计密度和任务风险匹配。

## Profiles

### Design-lite

适用：

- 低风险
- 局部改动
- 可直接回滚
- 不涉及外部合约、迁移或权限边界

最低要求：

- 问题定义
- Scope
- 假设 / 约束 / 风险
- 验收方式
- 1-2 段设计摘要

落点：

- `plan.md` 为主
- 若需要设计索引，可在 `docs/rfc.md` 中保留简短 design-lite 章节

### Standard RFC

适用：

- Medium risk
- 多模块联动
- 新增或修改公共 API / 配置
- 存在 2+ 真实设计选项

必备章节：

- Context
- Goals / Non-goals
- Options
- Decision
- Scope
- Verification
- Rollback

落点：

- `docs/rfc.md`

### Heavy RFC

适用：

- High risk or Epic
- auth / permission / protocol / secrets / data migration
- rollback 困难
- unknowns 多，必须先调研

必备交付物：

- `docs/research.md`
- `docs/rfc.md`
- `docs/review-rfc.md`
- optional `docs/implementation-plan.md`

Heavy RFC 必备章节：

- Executive Summary
- Context / Evidence
- Goals / Non-goals
- Options
- Decision
- Milestones
- Verification
- Rollback
- Observability
- Open Questions

## Auto-Heavy Triggers

满足以下任一条件时，直接升为 Heavy RFC：

- auth / permission / identity / token / session
- protocol / wire format / storage format change
- migration or persistent schema change
- secrets / signing / crypto / webhook verification
- external contract change with compatibility risk
- 需要分 2 个以上 milestone 才能安全交付

## Anti-Patterns

- 低风险也强行写 heavy RFC
- 把实现细节和测试输出堆进 RFC 主文
- 缺少 rollback 或 verification
- 明明存在设计分歧，却只写单一路径且不给取舍
