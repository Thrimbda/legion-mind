# Wiki Index

本 wiki 基于 [`The-Complete-Guide-to-Building-Skill-for-Claude.pdf`](./The-Complete-Guide-to-Building-Skill-for-Claude.pdf) 建立，目标是把单一 PDF 沉淀为可导航、可继续维护的知识入口。

若需要追溯事实与页码，优先看[原始来源摘要](./sources/the-complete-guide-to-building-skills-for-claude.md)；若需要快速执行视角，再进入[总览 / playbook](./overviews/skill-building-playbook.md)与[主题页](./topics/building-skills-for-claude.md)。

## 阅读入口

- [技能构建总览 / playbook](./overviews/skill-building-playbook.md)：先看整体流程、关键原则与推荐落地顺序。
- [Building Skills for Claude 主题页](./topics/building-skills-for-claude.md)：按主题整理概念、模式、测试与分发建议。
- [原始来源摘要](./sources/the-complete-guide-to-building-skills-for-claude.md)：按章节汇总 PDF 的核心结论与页码。
- [维护待办](./maintenance/backlog.md)：记录待扩展页面、待验证问题与后续 ingest 方向。
- [变更日志](./log.md)：查看本 wiki 的 ingest / maintenance 记录。

## 页面地图

### Sources

- [`sources/the-complete-guide-to-building-skills-for-claude.md`](./sources/the-complete-guide-to-building-skills-for-claude.md)
  - 唯一 authoritative source 的结构化摘要；保留 PDF 页码，适合作为事实回溯入口。

### Topics

- [`topics/building-skills-for-claude.md`](./topics/building-skills-for-claude.md)
  - 汇总 skill 定义、设计原则、规划方法、测试方法、分发方式与 troubleshooting。

### Overviews

- [`overviews/skill-building-playbook.md`](./overviews/skill-building-playbook.md)
  - 面向执行的“从想法到上线”路线图，适合作为后续 query / maintenance 的首选页面。

### Maintenance

- [`maintenance/backlog.md`](./maintenance/backlog.md)
  - 当前已知缺口、可拆分专题与待验证项。

## 维护约定（当前 baseline）

- raw source 只读：PDF 原文件不改写、不移动。
- 稳定结论优先标注 PDF 页码，并尽量可回链到 source summary。
- 不确定或需要进一步核验的内容集中写入“待确认 / 不确定”区域。
- 新增重要页面时同步更新本页与 [`log.md`](./log.md)。
