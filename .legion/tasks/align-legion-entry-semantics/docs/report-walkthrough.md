# Reviewer Walkthrough

## 目标与范围

本任务聚焦对齐 Legion 入口语义，避免文档与实现继续暗示已不存在的持久化 current-task、CLI 默认入口、或 `init` 自动创建 wiki skeleton。

绑定 scope：
- `README.md`
- `AGENTS.md`
- `docs/legionmind-usage.md`
- `skills/legion-workflow/SKILL.md`
- `skills/brainstorm/SKILL.md`
- `skills/legion-workflow/references/*.md`
- `skills/legion-wiki/references/*.md`
- `skills/legion-workflow/scripts/*.ts`

## 设计摘要

- 设计真源：[`docs/rfc.md`](./rfc.md)
- 核心决策：
  - `active task` 仅表示“当前请求明确恢复的 `.legion/tasks/<task-id>/` 目录”，不再表示持久化注册表状态。
  - `legion-workflow` 是工作流入口门禁与阶段语义真源；`skills/legion-workflow/scripts/legion.ts` 只是本地 CLI 适配层。
  - 本任务**不扩展 `init` 实现**；文档改为追随真实行为：`init` 只保证 `.legion/tasks/` 存在，wiki 由后续 writeback 按需建立。
  - README / usage 对 playbook 与 wiki 使用统一定义。

## 改动清单

### 入口语义与用户文档
- `README.md`
- `AGENTS.md`
- `docs/legionmind-usage.md`

收敛 active task / restore / continue / init / playbook vs wiki 的表述，去掉旧的隐式 current-task 与“CLI 默认入口”暗示。

### Workflow / Brainstorm skill 真源
- `skills/legion-workflow/SKILL.md`
- `skills/brainstorm/SKILL.md`

统一把“恢复任务”解释为恢复显式指定或唯一映射到的既有任务目录；无可恢复任务时进入 `brainstorm`，而不是隐式继续。

### Reference 与 CLI 说明
- `skills/legion-workflow/references/*.md`
- `skills/legion-wiki/references/*.md`
- `skills/legion-workflow/scripts/*.ts`

同步 CLI / tool reference 的命名边界；确认 `init` 最小行为与文档一致，不再宣称默认生成 wiki skeleton；并把 `status.data.currentTask` 正式改名为 `currentChecklistItem`。

## 如何验证

详见 [`test-report.md`](./test-report.md)。本次验证聚焦“禁用旧语义 + `init` 最小行为”。

1. 文案禁用语义检查  
   命令：对 in-scope 文档/skill/reference 做定向 `grep` 检查。  
   预期：不再出现 `默认入口`、`CLI 自动记住当前任务`、`current-task`、`唯一 active task`、`init 生成 wiki`、`生成 wiki 索引` 等旧语义。

2. `init` CLI smoke test  
   命令：`node --experimental-strip-types "skills/legion-workflow/scripts/legion.ts" init --cwd "$tmpdir" --format json`  
   预期：仅创建 `.legion/tasks/`；不创建 `.legion/wiki/` 或 `.legion/wiki/index.md`。

3. 初始化结果检查  
   命令：`python3` 脚本检查临时目录输出。  
   预期：与实现一致，验证通过。

测试结论：PASS。

## 风险与回滚

### 风险
- 未来文档或 skill 变更可能重新引入旧术语，导致“会话态恢复”与“持久化 current-task”再次混淆。
- 外部若已有脚本依赖 `status.data.currentTask`，需要同步切换到 `currentChecklistItem`。

### 回滚
- 以文档回滚为主，直接回退本次相关文档/skill/reference 修改即可。
- 不应回滚到“存在持久化 current-task”或“`init` 默认生成 wiki skeleton”的旧语义。

## 未决项与下一步

- 当前无阻塞未决项；RFC、代码审查、测试均为 PASS。
- 可作为后续文案优化项：
  - 在 `REF_TOOLS.md` 增补最小 JSON 示例，固定 `currentChecklistItem` 字段契约。
  - 在 README / usage 对“只读综合”“continue”补一行更直白释义。
  - 若未来需要 `init` 预建 wiki skeleton，应另开独立任务设计，不在本次范围内扩展。
