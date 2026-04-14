# 拆分 Legion schema skills 并改用 log.md

## 目标

将 LegionMind 的规则层拆分为独立 schema skills，瘦身 agents，并把现行 raw task log 文件名从 context.md 切换为 log.md。

## 要点

- 按 raw/wiki/schema 三层模型重构 schema 层，不做向后兼容。
- agent 仅保留权限定义与 skill 加载语句，规则与模板全部迁入 skills。
- 现行 task 原始文档模型改为 plan.md / log.md / tasks.md，并同步更新 references、commands、agents 与脚本。

## 范围

- skills/**
- .opencode/agents/**
- .opencode/commands/**
- .opencode/package*.json
- scripts/**
- docs/**
- .legion/**
- README.md
- legionmind.skill

## 阶段概览

1. **设计收口** - 2 个任务
2. **实现迁移** - 3 个任务
3. **验证收口** - 2 个任务

---

*创建于: 2026-04-13 | 最后更新: 2026-04-13*
