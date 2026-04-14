# 整理 Legion 上下文管理三层改进建议

## 目标

把针对 Legion 上下文管理的 raw/wiki/schema 三层重构建议整理为仓库内的长期 Markdown 文档。

## 要点

- 将 .legion/tasks 视为 raw sources 而非直接充当 wiki 层
- 明确 schema、wiki、raw 三层的职责边界与互链关系
- 总结 plan/context/tasks 与 RFC/review/report/agent prompt 的重复与漂移问题
- 给出可执行的目录级改进建议与迁移方向

## 范围

- docs/**
- .legion/**

## 阶段概览

1. **建模与落点** - 1 个任务
2. **文档撰写** - 2 个任务
3. **任务回写** - 1 个任务

---

*创建于: 2026-04-13 | 最后更新: 2026-04-13*
