# 基于 wiki PDF 建立 llm-wiki

## 目标

使用 llm-wiki baseline 为 `wiki/` 目录下的 PDF 建立可持续维护的 markdown wiki 入口与核心页面。

## 问题陈述

当前 `wiki/` 目录只有一个原始 PDF，尚未形成可导航、可持续沉淀、可追溯引用的 markdown wiki。

这会导致后续 query 仍需每次重新翻阅 PDF，无法复用结构化摘要、主题页、综合页与维护页，也不符合 llm-wiki 的 index-first / ingest-first 工作方式。

## 验收标准

- [ ] 原始 PDF 保持只读，未被改写或移动。
- [ ] `wiki/` 下建立最小 baseline：`index.md`、`log.md`、source summary、topic/overview、maintenance 页面。
- [ ] 新增页面之间具备基本互链，`index.md` 可作为导航入口。
- [ ] 稳定结论能回溯到 PDF 页码或 source summary；不确定内容被明确标记。
- [ ] `log.md` 追加一次安全 ingest 记录，说明本次写入范围与后续待办。

## 假设 / 约束 / 风险

- **假设**: 当前 PDF《The Complete Guide to Building Skill for Claude》是本次 wiki 的唯一 authoritative source。
- **约束**: 遵循 llm-wiki 三层边界；PDF 作为 raw source 只读；宿主未提供额外 schema 时采用最小 baseline，不擅自引入复杂 frontmatter 或额外自动化脚本。
- **风险**: 摘要过程中可能丢失细节或把建议性内容表述得过强；因此需要在页面中保留页码引用，并把尚未展开的内容写成 open questions / future expansion。

## 风险分级

- **等级**: Low
- **理由**: 本次仅在 `wiki/**` 内新增 markdown 知识页，不修改代码、外部接口或现有业务逻辑；所有变更均可直接回滚，且 raw source 保持不变。

## 要点

- 遵循 llm-wiki 的 raw/wiki/schema 三层边界，保持 PDF 原文件只读。
- 在缺少宿主 schema 时采用最小 baseline：`index.md`、`log.md`、source summary、topic/overview、maintenance。
- 确保新增页面可通过 `index.md` 导航，结论可追溯到 PDF / source summary，并记录后续可扩展方向。

## 范围

- wiki/**

## 设计索引

> **Design Source of Truth**: 本 `plan.md` 内联 design-lite（Low Risk，无单独 RFC）

**摘要**:
- 宿主基线：将 `wiki/` 同时视为 wiki 根与 raw source 容器；PDF 保留在根目录，新增 markdown 页面按 `sources/`、`topics/`、`overviews/`、`maintenance/` 分层。
- 导航与记账：采用默认 `index.md` / `log.md` baseline；`index.md` 提供页面入口与一句话说明，`log.md` 仅追加安全 ingest 摘要。
- 引用策略：正文优先使用 PDF 页码与 source summary 交叉引用；确定性结论与待验证项分栏，避免把推测写成事实。

## 阶段概览

1. **阶段 1 - Bootstrap 与 schema 盘点** - 2 个任务
2. **阶段 2 - Ingest 与页面生成** - 3 个任务
3. **阶段 3 - 校验与交付** - 2 个任务

---

*创建于: 2026-04-11 | 最后更新: 2026-04-11*
