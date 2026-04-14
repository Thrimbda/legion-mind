# Maintenance Backlog

- Navigation: [Wiki Index](../index.md) · [Source Summary](../sources/the-complete-guide-to-building-skills-for-claude.md) · [Topic Page](../topics/building-skills-for-claude.md)

## Current status

- 已完成最小 baseline ingest：index、log、source summary、topic、overview（见 [`../log.md`](../log.md)）。
- 当前 authoritative source 仅有 1 个 PDF；尚未扩展到外部官方文档或示例仓库。

## Next candidate pages

1. `topics/skill-frontmatter-and-triggering.md`
   - 目的：把 frontmatter、description、under/over-triggering 建成独立专题。
2. `topics/skill-testing-and-iteration.md`
   - 目的：细化 triggering / functional / performance 测试方法与评估模板。
3. `topics/skill-distribution-and-api.md`
   - 目的：分离 Claude.ai / Claude Code / API / GitHub 的分发与运维视角。
4. `topics/skill-patterns-and-troubleshooting.md`
   - 目的：把 5 类 pattern 与常见错误修复沉淀为查询友好页。

## Maintenance tasks

- 若后续 ingest 官方网页或示例仓库，需把“平台现状”与“PDF 中的 2026-01 时间点信息”明确区分。
- 若要用于持续 query，建议补一页“术语表”，统一 `skill`、`MCP`、`frontmatter`、`progressive disclosure` 等概念。
- 若 wiki 继续扩张，建议检查孤儿页并增强互链。

## Open verification items

- PDF 中关于 API、workspace-wide deployment、Code Execution beta 的表述是否仍与当前产品一致，需要在后续 ingest 时复核（pp.19-20）。
- `allowed-tools` 等 YAML 可选字段在不同运行表面的支持差异，当前仅来自参考页示例，未进一步验证（p.31）。

## Out of scope for this ingest

- 不对 PDF 原文做全文转写。
- 不引入 frontmatter 规范、自动化脚本或仓库级规则。
- 不把外部网页内容混入当前结论。
