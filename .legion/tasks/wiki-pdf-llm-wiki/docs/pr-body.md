# What

本 PR 在 `wiki/**` 下新增了一组 llm-wiki baseline 文档，用于围绕单个 PDF 建立可持续维护的 wiki 基线。

本轮仅涉及知识组织与文档结构，不包含生产代码改动；原始 PDF 保持只读。

# Why

当前 `wiki/` 目录只有原始 PDF，缺少可导航、可追溯、可持续扩展的知识结构。

本次交付先把单一来源沉淀为 `index + log + source + topic + overview + maintenance` 的最小基线，方便后续继续 ingest 和 query。

# How

- 新增 `wiki/index.md` 作为统一导航入口
- 新增 `wiki/log.md` 记录 ingest 轨迹与 guardrails
- 新增 source summary / topic / overview / maintenance 页面
- 对时效性平台能力表述统一补充“按 PDF 在 2026-01 的描述”锚点

## Testing

已完成最小验证：
- 页面存在
- `index.md` 可导航
- `log.md` 有 ingest 记录
- `git diff --check -- "wiki"` 通过

未补充其他自动化测试：本 PR 仅新增 wiki baseline 文档，无运行时代码变更。

## Risk / Rollback

风险：
- 当前仅覆盖单个 PDF，知识覆盖有限
- 后续若不持续维护 source-summary-first 约束，摘要层可能与来源漂移

回滚：
- 直接移除本 PR 新增的 `wiki/**` 文件即可
- 无运行时回滚成本

## Links

- Plan: `.legion/tasks/wiki-pdf-llm-wiki/plan.md`
- Walkthrough: `.legion/tasks/wiki-pdf-llm-wiki/docs/report-walkthrough.md`
- Test Report: `.legion/tasks/wiki-pdf-llm-wiki/docs/test-report.md`
- Review: `.legion/tasks/wiki-pdf-llm-wiki/docs/review-code.md`
- Wiki Index: `wiki/index.md`
