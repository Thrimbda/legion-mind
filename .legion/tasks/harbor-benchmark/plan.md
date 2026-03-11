# 设计并实现一键启动的 Harbor Benchmark 基线

## 目标

基于 Harbor + OpenCode 设计并落地可一键启动的 benchmark 流程，用于衡量 legion-mind 对真实解题能力的提升。

## 要点

- 对齐方案一：Terminal-Bench 2.0 + SWE-bench Pro + 项目型补充集
- 默认最少人工打断，提供一键脚本与可复用配置
- 产出可直接用于 PR 的文档（含执行方式、评分口径与风险说明）

## 范围

- README.md
- docs/**
- scripts/**
- package.json
- .gitignore
- .legion/**

## 阶段概览

1. **任务建模与设计** - 2 个任务
2. **实现与集成** - 2 个任务
3. **验证与交付** - 2 个任务

---

*创建于: 2026-03-05 | 最后更新: 2026-03-05*
