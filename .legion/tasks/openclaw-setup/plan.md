# 新增 OpenClaw setup 脚本

## 目标

基于仓库现有安装脚本约定，新增一个面向 OpenClaw 的实用 setup 脚本并完成最小验证。

## 要点

- 复用仓库现有 scripts/ 目录与 TypeScript CLI 风格
- 保持脚本聚焦、实用，不引入不必要抽象
- 优先最小范围交付，必要时同步 package.json 入口

## 范围

- scripts/**
- package.json
- .legion/**

## 风险分级

- **等级**: Low
- **理由**: 仅新增一个本地 setup 脚本，并在必要时补充 package.json 入口；不改变现有 OpenCode 安装流程，不涉及数据迁移、认证、支付、权限或基础设施级改动。

## 假设与约束

- 参考仓库现有约定，新脚本放在 `scripts/`，使用无依赖 TypeScript CLI 形式。
- 保持聚焦：优先做最小可用的 OpenClaw 本地配置接入，不扩展到完整发布/回滚系统。
- 若需要写入用户本地配置，应优先可验证、可回滚、低破坏；对无法安全解析的已有配置文件宁可报错退出，也不盲改。

## 设计索引

- design-lite（本文件）
  - 新增 `scripts/setup-openclaw.ts`
  - 默认管理 `~/.openclaw/openclaw.json`
  - 目标是把本仓库的 `skills/` 目录注册到 OpenClaw `skills.load.extraDirs`
  - 提供 `install` / `verify` 两个最小命令，并支持 `--dry-run`、`--config-dir`、`--skills-dir`

## 验收标准

- 新脚本位于符合仓库约定的位置，命名与 `setup-opencode.ts` 风格一致。
- `install` 能创建或更新 OpenClaw 配置，使其加载本仓库 `skills/` 目录。
- `verify` 能检查关键前提（配置文件、skills 目录、配置项是否生效）。
- 通过最小命令级验证，确认脚本可运行且输出可理解。

## 阶段概览

1. **调研与设计** - 1 个任务
2. **实现** - 1 个任务
3. **验证与交付** - 1 个任务

---

*创建于: 2026-03-27 | 最后更新: 2026-03-27*
