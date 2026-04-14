# 交付说明：wiki PDF → llm-wiki baseline

## 目标与范围

本轮仅修改 `wiki/**`，目标是围绕单个 PDF 建立可持续维护的 llm-wiki 基线，同时保持原始 PDF 只读。

交付文件：
- `wiki/index.md`
- `wiki/log.md`
- `wiki/sources/the-complete-guide-to-building-skills-for-claude.md`
- `wiki/topics/building-skills-for-claude.md`
- `wiki/overviews/skill-building-playbook.md`
- `wiki/maintenance/backlog.md`

## 设计摘要

- 采用 `sources/`、`topics/`、`overviews/`、`maintenance/` 的最小 page family。
- `index.md` 作为统一导航入口，`log.md` 记录 ingest 轨迹。
- source summary 保留事实层与页码；topic / overview 承担重组与提炼；maintenance 承担后续扩展与待验证项。
- 对时效性平台能力表述统一加上“按 PDF 在 2026-01 的描述”锚点，避免误读为当前实时现状。

## 具体改动

### 1. 建立导航入口
- 新增 `wiki/index.md`
- 提供阅读入口、页面地图与当前 baseline 维护约定

### 2. 建立 ingest 日志
- 新增 `wiki/log.md`
- 记录本轮 ingest 范围、guardrails 与后续拆分方向

### 3. 建立来源摘要页
- 新增 `wiki/sources/the-complete-guide-to-building-skills-for-claude.md`
- 按章节整理 PDF 的核心结论、稳定 takeaway 与待确认项

### 4. 建立主题页与总览页
- 新增 `wiki/topics/building-skills-for-claude.md`
- 新增 `wiki/overviews/skill-building-playbook.md`
- 把来源信息重组为主题知识与执行型 playbook

### 5. 建立维护页
- 新增 `wiki/maintenance/backlog.md`
- 记录下一批候选页面、维护动作与待复核问题

## 验证方式

- 确认核心页面存在
- 确认 `index.md` 可导航
- 确认 `log.md` 有 ingest 记录
- 运行 `git diff --check -- "wiki"`，结果通过

本轮未增加额外自动化测试，因为交付物为知识库基线文档，不涉及运行时代码逻辑。

## 风险与回滚

### 风险
- 当前仅覆盖单个 PDF，知识面仍有限
- 若后续不持续遵守 source-summary-first，topic / overview 可能逐步偏离来源

### 回滚
- 本轮仅新增 `wiki/**` 文档
- 如需回滚，直接删除本轮新增的 wiki 页面即可

## 下一步

- 根据 `maintenance/backlog.md` 继续拆分 frontmatter、testing、distribution、troubleshooting 专题页
- 若需要对外说明平台能力，再补充最新官方网页作为新增 source 做二次 ingest
