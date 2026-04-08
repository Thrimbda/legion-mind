# 交付 Walkthrough：LegionMind scripts-first 替代 MCP

## 目标与范围

本次交付将 LegionMind skill 的默认执行面从 `legion_*` MCP 工具切换为 **scripts-first CLI**，确保仓库在没有 `legionmind-mcp` server 的前提下，仍可完成 `.legion/` 初始化、任务生命周期管理、Review 闭环、dashboard/ledger 生成与验证。

绑定范围见 `plan.md`：

- `skills/legionmind/**`
- `.opencode/agents/legion.md`
- `.opencode/commands/legion.md`
- `.opencode/commands/legion-impl.md`
- `.opencode/commands/legion-rfc-heavy.md`
- `.opencode/commands/legion-pr.md`
- `.opencode/commands/evolve.md`
- `scripts/**`
- `package.json`
- `README.md`
- `scripts/setup-opencode.ts`
- `.legion/playbook.md`

## 设计摘要

设计真源：[`rfc.md`](./rfc.md)

本次实现遵循 RFC 中的 3 个核心决策：

1. 以 `skills/legionmind/scripts/legion.ts` 作为单一 CLI 主入口，用子命令覆盖原 `legion_*` MCP 能力。
2. 保持 `.legion/` 三文件契约与审计/Review 语义不变，迁移的是执行面，不是数据模型。
3. 文档、命令、安装校验全部切到 CLI-first，MCP 仅保留为历史兼容提示，不再是默认前提。

额外落地决策：

- smoke harness 固定在根级 `scripts/legionmind/smoke.ts`，`npm run legionmind:smoke` 仅是别名。
- `plan/context/tasks` 更新采用 section 级改写，避免整文件重渲染覆盖 Review block 与人工补充内容。

## 改动清单（按模块 / 文件）

### 1. LegionMind skill 核心实现

- `skills/legionmind/scripts/legion.ts`
  - 新的 scripts-first 主入口。
  - 提供 init / propose / proposal approve / status / context / tasks / review / dashboard / ledger 等子命令。
- `skills/legionmind/scripts/lib/cli.ts`
  - 承载 CLI 参数解析、schema 校验、路径保护、markdown 更新、review 响应、ledger/dashboard 等核心实现。
  - 补齐参考 MCP 实现未完整覆盖的 schema 能力，如 `addFile`、`addConstraint`、`addTask`。

### 2. Skill 文档与 references 收敛

- `skills/legionmind/SKILL.md`
  - 改为 CLI-first 指令，删除“必须优先使用 MCP”之类默认路径表述。
- `skills/legionmind/references/REF_TOOLS.md`
  - 从 MCP 工具参考改写为 CLI 参考。
- `skills/legionmind/references/REF_SCHEMAS.md`
  - 保留 schema 真源，但将默认执行者改为 Legion CLI。
- `skills/legionmind/references/REF_BEST_PRACTICES.md`
- `skills/legionmind/references/REF_CONTEXT_SYNC.md`
- `skills/legionmind/references/REF_AUTOPILOT.md`
  - 示例与流程说明同步切换到 scripts 工作流。

### 3. 仓库级 orchestrator / commands 对齐

- `.opencode/agents/legion.md`
  - orchestrator 默认恢复与执行路径改为 CLI-first / filesystem fallback。
- `.opencode/commands/legion.md`
- `.opencode/commands/legion-impl.md`
- `.opencode/commands/legion-rfc-heavy.md`
- `.opencode/commands/legion-pr.md`
- `.opencode/commands/evolve.md`
  - 清理默认 `legion_*` MCP 心智模型，改为引用 bundled scripts。

### 4. 安装、验证与仓库说明

- `scripts/setup-opencode.ts`
  - `verify` 不再把 `mcp.legionmind` 作为 READY 前提；仅将其视为历史兼容配置。
- `package.json`
  - 新增 `legionmind:smoke` 与 `legionmind:check-no-default-mcp` 验证入口。
- `README.md`
  - 对外说明切到 CLI-first，明确仓库级 smoke 与常用命令。

### 5. 验证脚本

- `scripts/legionmind/smoke.ts`
  - 在临时目录执行最小闭环：init → propose/approve → update → review → dashboard/ledger。
- `scripts/legionmind/check-no-default-mcp.ts`
  - 扫描仓库中是否仍残留“默认依赖 LegionMind MCP”的表述。

## 如何验证

测试报告：[`test-report.md`](./test-report.md)

执行命令：

```bash
node --experimental-strip-types scripts/legionmind/smoke.ts
node --experimental-strip-types scripts/legionmind/check-no-default-mcp.ts
npm run legionmind:smoke
npm run legionmind:check-no-default-mcp
```

预期结果：

- 以上 4 条命令全部成功返回。
- 直接脚本入口与 npm scripts 别名都能跑通。
- smoke 覆盖 `.legion/` 最小闭环。
- no-default-mcp 扫描确认仓库默认工作流已切到 CLI-first。

评审结果：

- RFC 审查：[`review-rfc.md`](./review-rfc.md) → **PASS WITH CHANGES**，已收敛为可实施方案。
- 代码审查：[`review-code.md`](./review-code.md) → **PASS**。
- 安全审查：[`review-security.md`](./review-security.md) → **PASS WITH CHANGES**，无阻塞项。

## 风险与回滚

### 当前风险

1. 这是 public workflow 级替换，影响 skill、commands、README、verify 与本地文件写入路径。
2. `ledger query` 虽已补 limit 校验，但当前仍是整文件读取后过滤；ledger 持续增长时有资源占用风险。
3. `dashboard generate --output` 仍允许写到 repo 内任意路径，secure-by-default 边界仍可继续收紧。

### 回滚策略

若后续发现 CLI parity 缺失、verify 回归失败或默认入口不可用，优先按 RFC 的回滚顺序处理：

1. 先回滚 `README.md`、`.opencode/commands/*.md`、`scripts/setup-opencode.ts` 的默认入口文案。
2. 保留 CLI 代码继续修复，避免“默认入口恢复为 MCP，但 scripts 实现被一并删除”造成二次分叉。
3. 通过 `.legion/ledger.csv` 追溯最后一次失败操作与错误码。

## 未决项与下一步

1. 后续可将 `ledger query` 从整文件读取优化为流式读取或尾窗口读取。
2. 可进一步限制 `dashboard generate --output` 的默认写入范围，优先收敛到 `<taskRoot>/docs/`。
3. 可为 `check-no-default-mcp.ts` 增加正反 fixture，降低 allowlist 误判/漏判风险。
4. 本 PR 交付的是 **scripts-first 替代 LegionMind MCP**；后续若要扩展为仓库外稳定公共 CLI，再单独做 API 稳定性与兼容承诺。
