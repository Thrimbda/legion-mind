# Task Brief - LegionMind 一键安装与 Plugin 化可行性

## 问题定义

当前 `legion-mind` 仓库主要以“克隆仓库 + 手工配置”方式使用，虽然已有 `scripts/setup-opencode.ts`，但仍存在以下落地问题：

- 缺少标准化的一键安装入口（类似 `bunx <pkg> install`）
- 安装脚本偏本地开发路径（含绝对路径推断），不够发布友好
- `.opencode/opencode.json` 含个人环境信息，不适合直接分发
- 与 OpenCode Plugin 机制的关系未清晰定义（哪些能力应走 plugin，哪些应走 profile 目录）

目标是先完成可行性研究，再在可行时实现“低打断、一键安装、安装后可直接开始工作”的交付路径。

## 可行性研究结论

结论：**可行**，建议采用“Profile 安装器 + 轻量 Plugin”组合方案。

依据（外部文档与仓库调研）：

1. OpenCode 官方插件机制支持 npm 包与本地插件目录（`plugin` 数组、`.opencode/plugins/`、`~/.config/opencode/plugins/`）。
2. OpenCode 支持按目录加载 `agents/commands/plugins/skills`，可通过安装器把本仓库能力同步到用户全局目录。
3. `oh-my-opencode` 的成功路径本质是“可执行安装入口 + 自动配置”，并非只依赖单一 runtime hook。

约束与现实：

- 本仓库核心价值在 `agents + commands + skills + .legion 流程`，不是单纯 runtime hook。
- 因此“纯 plugin 化”不足以完整承载 slash 命令与技能资产，需配合安装器分发 profile 目录。

## 目标与验收

目标：在不要求用户手工拷贝目录的前提下，提供一条一键安装路径，安装后可直接在 OpenCode 中调用 Legion 命令工作流。

验收标准：

1. 提供可执行安装入口（CLI，一条命令完成主要安装）。
2. 安装器可把必要资产同步到标准目录：
   - `~/.config/opencode/agents/`
   - `~/.config/opencode/commands/`
   - `~/.config/opencode/plugins/`（若存在）
   - `~/.opencode/skills/`
3. 安装器具备最小安全性：跳过敏感/本地私有文件、幂等执行、冲突备份。
4. 生成本任务产物：
   - `.legion/tasks/legion-mind-opencode-plugin/docs/task-brief.md`
   - `.legion/tasks/legion-mind-opencode-plugin/docs/rfc.md`（Medium 风险需要）
   - `.legion/tasks/legion-mind-opencode-plugin/docs/test-report.md`
   - `.legion/tasks/legion-mind-opencode-plugin/docs/review-code.md`
   - `.legion/tasks/legion-mind-opencode-plugin/docs/report-walkthrough.md`
   - `.legion/tasks/legion-mind-opencode-plugin/docs/pr-body.md`

## 非目标

- 本次不发布 npm 包（仅提供发布就绪结构与本地可验证安装能力）。
- 不在本次任务中改造外部 `legionmind-mcp` 服务实现。
- 不执行远端推送或线上 PR 创建。

## 假设

1. 用户环境已安装 OpenCode。
2. 用户可接受通过 `npx/bunx` 或本地 `node` 触发安装器。
3. 若未配置 `legionmind` MCP，工作流可先以文件系统 fallback 运行，MCP 可后续补充。

## 风险/规模分级

- Risk: **Medium**
- Epic: **No**
- 标签识别：`[]`（未提供 `rfc:heavy` / `epic` / `risk:high` / `plan-only` / `continue`）
- 设计强度：**RFC（简版） + review-rfc**

分级理由：

- 变更涉及公开安装入口与跨目录安装逻辑，属于对外可见交付面。
- 需要多模块联动（脚本、命令资产、文档、任务产物），但仍可回滚。
- 不触及支付/鉴权/数据迁移等 High 风险域。

## 范围

- `README.md`
- `scripts/**`
- `.opencode/agents/**`
- `.opencode/commands/**`
- `.opencode/plugins/**`（如新增）
- `skills/legionmind/**`
- `.legion/tasks/legion-mind-opencode-plugin/**`

## 验证计划

1. 使用 `engineer` 完成安装器与文档落地。
2. 使用 `run-tests` 生成 `test-report.md`（至少覆盖安装脚本 dry-run 或本地可执行验证）。
3. 使用 `review-code` 生成 `review-code.md`。
4. 视安全影响（安装脚本写入用户目录）补充 `review-security.md`。
5. 使用 `report-walkthrough` 生成 `report-walkthrough.md` 与 `pr-body.md`。

## 回滚策略

- 回滚方式：回退本次新增安装器、文档与 plugin 文件。
- 用户本地回滚：删除安装器写入的 `~/.config/opencode/*` 与 `~/.opencode/skills/*` 对应条目（可按备份恢复）。
