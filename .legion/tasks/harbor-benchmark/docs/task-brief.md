# Task Brief - Harbor Benchmark 一键启动基线

## 问题定义

当前 `legion-mind` 缺少可复现、可量化的 benchmark 入口，无法稳定回答“这套编排是否真实提升解题水平”。

用户已给出可执行方向（Harbor 统一 harness + OpenCode agent + Docker），但仓库内仍缺：

- 一键启动命令（本地可直接执行）
- 可复用的 benchmark 配置（模型、并发、数据集、输出路径）
- 统一的评分与日志口径（便于 A/B 对比与复盘）

目标是在不增加人工打断的前提下，交付“可直接跑起来”的 benchmark 方案与脚本。

## 目标与验收

目标：为 `legion-mind` 增加 Harbor benchmark 基线，支持通过单命令启动，并输出可对比的结果工件。

验收标准：

1. 提供一键启动入口（如 `npm run benchmark:smoke` / `npm run benchmark:full`）。
2. 具备 preflight 检查（至少覆盖 Docker、Harbor CLI、必要 API Key）。
3. 支持方案一核心数据集：`terminal-bench@2.0`、`swebenchpro`（项目型补充集可配置占位）。
4. 默认落盘运行工件（命令日志、执行摘要、评分统计文件）。
5. 文档明确：执行步骤、评分口径、失败排障与扩展方式。

## 非目标

- 本任务不在本地完整跑完 SWE-bench Pro 全量实例（成本过高）。
- 不修改 Harbor 上游实现或私有评测平台。
- 不要求自动 `git push` / 自动创建远端 PR。

## 假设

1. 执行机可安装并运行 Docker。
2. 执行机可安装 Harbor CLI（`uv tool install harbor` 或 `pip install harbor`）。
3. 用户会在本机注入模型提供方 API Key（例如 `ANTHROPIC_API_KEY` 或 `OPENAI_API_KEY`）。
4. 初版允许以 smoke/full 两档覆盖“快速验证”与“重评测”场景。

## 风险/规模分级

- Risk: **Medium**
- Epic: **No**
- 设计强度：**RFC（standard） + review-rfc**

分级理由：

- 变更涉及公开 benchmark 入口、运行约束与评分口径，属于对外可见能力。
- 涉及多文件协同（脚本、配置、文档、package scripts），仍可回滚。
- 不触及认证/支付/数据迁移等 High 风险域。

## 标签判断

- `rfc:heavy`: 否（当前不是 high-risk/epic 架构改造）
- `epic`: 否（本次交付聚焦 benchmark baseline，不含大规模平台开发）
- `risk:high`: 否（无高危不可逆变更）
- `plan-only`: 否（本次包含实现）
- `continue`: 否（新建任务，不是续跑既有阶段）

## 范围

- `scripts/**`
- `docs/**`
- `README.md`
- `package.json`
- `.gitignore`（若需要忽略 benchmark 输出）
- `.legion/tasks/harbor-benchmark/**`

## 验证计划

1. 使用 `engineer` 完成 benchmark 脚本、配置模板与文档入口。
2. 使用 `run-tests` 运行脚本级验证（至少覆盖 preflight/dry-run 或 smoke 命令构建）。
3. 使用 `review-code` 生成代码评审报告。
4. 由于涉及凭证透传与容器执行，补充 `review-security`。
5. 使用 `report-walkthrough` 生成 walkthrough 与 PR body。

## 回滚策略

- 代码回滚：回退本次 benchmark 脚本、配置与文档改动。
- 运行回滚：删除本次 benchmark 输出目录（如 `benchmark-runs/`）即可，不影响业务代码。
