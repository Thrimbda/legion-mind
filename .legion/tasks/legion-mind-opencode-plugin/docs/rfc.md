# RFC: LegionMind OpenCode 一键安装与 Plugin 化（发布就绪）

## 0. Executive Summary

本方案采用“**Profile 安装器 + 轻量 Plugin**”，在“不发布 npm、且不改外部 `legionmind-mcp`”前提下，实现一键安装、幂等重试、冲突可恢复与可回滚。

V1 固定 Install State 路径为 `~/.config/opencode/.legionmind/install-state.v1.json`，并采用原子写入（`tmp -> fsync -> rename`）。

默认覆盖策略为 `safe-overwrite`：仅覆盖托管且未被用户修改的文件；检测到用户改动时默认 `warning + skip`，仅 `--force` 可覆盖。

`verify --strict` 作为“可开始工作”门禁：目录完整、命令可见、skills 可加载、MCP 缺失时 fallback 可用；全通过才输出 `READY`。

`rollback/uninstall` 仅处理 manifest 记录条目；状态损坏时允许 `rollback --to <backup-id>` 基于备份恢复。

## 1. Abstract / Motivation

当前仓库已具备 `scripts/setup-opencode.ts`，但安装行为仍偏“本地开发者自用”：依赖仓库相对路径、会把 `.opencode/opencode.json` 这类个人配置带入目标环境、对冲突处理与可回滚语义不够明确。结果是：新用户无法稳定地通过一条命令进入可工作的 Legion 流程。

本 RFC 目标是在**不改外部 `legionmind-mcp` 实现、且本次不发布 npm**的约束下，定义一套“发布就绪”的安装架构：一键执行、可重复执行（幂等）、冲突可恢复、默认非交互、可灰度回滚。

## 2. Goals & Non-Goals

### 2.1 Goals

1. 提供统一安装入口，安装后用户可直接在 OpenCode 使用 Legion 工作流命令。
2. 将仓库核心资产同步到标准目录：
   - `~/.config/opencode/agents/`
   - `~/.config/opencode/commands/`
   - `~/.config/opencode/plugins/`（若有插件资产）
   - `~/.opencode/skills/`
3. 明确冲突备份、失败恢复、幂等重试语义，默认非交互执行（避免频繁人工介入）。
4. 对 MCP 仅做“配置对接与降级”，不改 `legionmind-mcp` 服务代码。
5. 形成发布就绪结构（入口、目录约定、文档、验证），为后续 npm 发布留接口。

### 2.2 Non-Goals

1. 本次不发布 npm 包，不要求公网安装链路立即可用。
2. 不改外部 `legionmind-mcp` 服务实现与部署方式。
3. 不重构 Legion 核心编排逻辑（`.opencode/agents/**`、`.opencode/commands/**` 仅做分发，不改语义）。

## 3. Definitions

- `Profile Assets`：需要分发到用户目录的静态资产（agents/commands/plugins/skills）。
- `Installer`：安装器 CLI，负责资产同步、冲突备份、MCP 配置注入与安装状态记录。
- `Install State`：安装器落盘状态（源版本、已写入文件、备份路径、时间戳），用于幂等与回滚。
- `Managed Entry`：由安装器管理的配置段（例如 `mcp.legionmind`），仅修改自身责任边界。

## 4. Proposed Design

### 4.1 端到端流程

1. 用户执行安装入口（当前阶段可通过 `node`/`bun` 调用本仓库脚本；后续可映射到 `bunx`）。
2. Installer 预检：运行时版本、目标目录可写性、源资产完整性。
3. 资产同步：按白名单复制或链接 assets（默认复制，避免仓库路径耦合）。
4. 冲突处理：按 `safe-overwrite` 决策；仅在可覆盖时执行 `backup + overwrite`，用户改动文件默认 `warning + skip`。
5. MCP 处理：尝试写入/更新 `mcp.legionmind`；找不到可执行路径时记录 warning 并启用文件系统 fallback。
6. 写入 Install State 与执行报告。
7. 执行 `verify --strict`，仅全绿时输出 `READY`（exit 0）；否则返回 `E_VERIFY_STRICT`（exit != 0）并输出可复制修复命令。

### 4.2 组件边界

- `scripts/setup-opencode.ts`：演进为安装器主入口（保留向后兼容命令别名）。
- `scripts/lib/*`（建议新增）：拆分 `sync-assets`、`backup`、`mcp-config`、`state-store`、`reporter`。
- `.opencode/plugins/**`：放置轻量 plugin（可选），职责仅为启动期检查/提示，不承载完整资产分发。
- `README.md`：提供一键安装与回滚说明、幂等语义、故障排查入口。

### 4.3 安装入口设计

- 统一命令模型：`install | verify | rollback | uninstall`。
- 默认模式：`install --non-interactive --strategy=copy`。
- 预留发布命令（文档声明，不要求本次可执行）：`bunx legion-mind-opencode install`。
- 当前阶段推荐入口（发布就绪）：
  - `node scripts/setup-opencode.ts install`
  - `node scripts/setup-opencode.ts verify --strict`
  - `node scripts/setup-opencode.ts rollback --to <backup-id>`

### 4.4 资产同步策略

- 白名单源目录（仅 scope 内）：
  - `.opencode/agents/** -> ~/.config/opencode/agents/**`
  - `.opencode/commands/** -> ~/.config/opencode/commands/**`
  - `.opencode/plugins/** -> ~/.config/opencode/plugins/**`
  - `skills/legionmind/** -> ~/.opencode/skills/legionmind/**`
- 黑名单：`opencode.json`、`node_modules`、`.git`、任何本地私有凭据文件。
- 同步方式：默认 copy（发布友好）；可选 `--strategy=symlink` 供本地开发。
- 覆盖策略（默认 `safe-overwrite`）：
  - `same-content => skip`
  - `managed + unchanged => backup + overwrite`
  - `user-modified => warning + skip`（`--force` 才覆盖）
  - `unmanaged-existing => warning + skip`（`--force` 才 `backup + overwrite`）

### 4.5 冲突备份策略

- 备份命名：`<target>.backup-<UTC-compact>`。
- 备份粒度：文件级；目录冲突时按目录整体备份后重建。
- 备份索引：`~/.config/opencode/.legionmind/backup-index.v1.json`，记录 `backupId -> [{ targetPath, backupPath }]`。
- 索引写入采用原子流程：`tmp -> fsync -> rename`。
- 容量防护（V1 默认）：
  - `maxFiles=2000`
  - `maxCopyBytes=200MB`
  - `maxBackupBytes=500MB`
  超阈值时报错并停止写入。
- 所有备份路径登记到 Install State，供 `rollback` 精确恢复。
- `rollback --to <backup-id>` 优先依赖 `backup-index.v1.json`，不依赖 install-state 可解析性。

### 4.6 MCP 处理策略

- 仅管理 `mcp.legionmind` 条目，不改其他 mcp/provider 字段。
- MCP path 解析优先级：
  1) `LEGIONMIND_MCP_PATH`
  2) 约定构建产物路径候选
  3) 现有配置中的合法路径
- 若未解析到可执行路径：
  - 不阻塞安装（返回 warning）
  - 输出后续补配命令
  - Legion 仍可走文件系统 fallback

### 4.7 幂等语义

- 相同输入重复执行 `install`：
  - 已同步且校验通过的文件 `skip`
  - 配置一致则不重写
  - 结果应稳定为 success（允许 warning）
- 中断重试：依据 Install State 跳过已完成步骤并继续。
- `verify --strict` 只读检查，不做修复写入；仅允许两类结果：`READY`（exit 0）或 `E_VERIFY_STRICT`（exit != 0）。
- `verify`（非 strict）允许 `success_with_warning`，用于快速体检而非发布门禁。

`verify --strict` 探针表（V1）：

- `checkId=assets.commands`：`~/.config/opencode/commands/legion.md` 存在
- `checkId=assets.agents`：`~/.config/opencode/agents/legion.md` 存在
- `checkId=assets.skills`：`~/.opencode/skills/legionmind/SKILL.md` 存在
- `checkId=fallback.filesystem`：`~/.opencode/skills/legionmind/references/REF_SCHEMAS.md` 可读（用于无 MCP 时文件系统 fallback）
- `checkId=mcp.optional`：`mcp.legionmind` 未配置时为 warning；strict 模式下仅在 fallback 探针通过时仍可整体通过

通过条件：上述关键检查均通过（或满足可降级条件）才输出 `READY`；任一硬失败返回 `E_VERIFY_STRICT`。

### 4.8 托管边界（Manifest）

- 安装器维护集中 manifest：`~/.config/opencode/.legionmind/managed-files.v1.json`。
- 每条记录包含：`targetPath`、`sourcePath`、`sourceRevision`、`checksum`、`installedAt`、`lastAction`。
- `uninstall/rollback` 仅作用于 manifest 条目；非托管文件不触碰。
- 若目标文件 checksum 与 manifest 不一致，判定为用户修改，默认跳过并告警；`--force` 才覆盖。

## 5. Alternatives（方案对比与选型）

### A. 纯 Plugin 化（仅 `.opencode/plugins` 分发）

- 优点：分发面最小、看起来“标准插件”。
- 放弃原因：Legion 核心能力依赖 agents/commands/skills，纯 plugin 无法完整覆盖 slash 命令与技能资产，达不到“安装后即可工作”。

### B. 文档指导手工拷贝

- 优点：实现最快、几乎无脚本风险。
- 放弃原因：与“一键安装、低打断、无需频繁人工介入”目标冲突，且一致性/可回滚弱。

### C. 选中方案：Profile 安装器 + 轻量 Plugin（本 RFC）

- 优点：兼顾完整能力分发与 OpenCode 插件形态；可做到幂等、可回滚、可验证。
- 代价：安装器复杂度高于纯 plugin，但风险可控且收益显著。

## 6. Data Model / Interfaces

### 6.1 Installer CLI 接口

```text
setup-opencode <command> [options]

command:
  install | verify | rollback | uninstall

options:
  --non-interactive (default true)
  --strategy=copy|symlink (default copy)
  --force (default false, only overwrite user-modified managed files)
  --to=<backup-id> (rollback target backup; optional when using latest snapshot)
  --dry-run
  --backup-dir=<path> (optional)
  --json (machine-readable output)
```

约束：
- `rollback` 默认回退到最近一次安装快照；显式提供 `--to=<backup-id>` 时以该备份为准。
- `uninstall` 仅删除 Installer 托管资产，不删除用户非托管文件。

### 6.2 Install State（建议 JSON）

字段：
- `version`: 状态格式版本（如 `1`）
- `installedAt`: ISO 时间
- `sourceRevision`: 仓库版本标识（git sha 或手动版本）
- `operations[]`: `{ action, source, target, checksum?, backupPath?, status }`
- `mcp`: `{ updated: boolean, configPath?, previousValue?, currentValue? }`
- `result`: `success | partial | failed`

路径与写入规则（V1 定版）：

- 固定路径：`~/.config/opencode/.legionmind/install-state.v1.json`
- 原子写入：`install-state.v1.json.tmp -> fsync -> rename`
- 损坏恢复：若状态不可解析，`rollback --to <backup-id>` 仅基于备份记录执行恢复，不依赖状态文件。

兼容策略：
- 新字段仅追加，不删除旧字段；解析采用“忽略未知字段”。
- `version` 不兼容时拒绝 rollback 并给出手工恢复指引。

## 7. Error Semantics

- `preflight_failed`（不可恢复，需人工修复环境）：无写入。
- `sync_partial`（可恢复）：保留已完成步骤与备份，允许重试。
- `mcp_update_failed`（可降级）：安装整体 success with warning。
- `rollback_failed`（部分可恢复）：输出失败项与手工恢复路径。

故障码（V1）：

- `E_PRECHECK`
- `E_SYNC_PARTIAL`
- `E_MCP_WARN`
- `E_VERIFY_STRICT`
- `E_ROLLBACK_PARTIAL`

`--json` 输出最小 schema：

```json
{
  "code": "E_SYNC_PARTIAL",
  "phase": "sync",
  "target": "~/.config/opencode/commands/legion.md",
  "action": "copy",
  "result": "warning",
  "hint": "re-run install or use --force"
}
```

`--json` 必填字段（V1）：

- `timestamp`
- `runId`
- `code`
- `phase`
- `checkId`
- `target`
- `hint`

`verify --strict` 失败时固定追加 1 条可复制排障命令（示例）：

```bash
node scripts/setup-opencode.ts verify --strict --json > /tmp/legionmind-verify.json
```

告警触发最小规则（V1）：

1. 同一环境连续 3 次 `E_VERIFY_STRICT`
2. 任意一次 `E_SYNC_PARTIAL`

重试语义：
- 对于 `sync_partial`，再次执行 `install` 应继续完成并最终收敛。
- 对于 `preflight_failed`，修复后重试，不应污染已有状态。

## 8. Security Considerations

1. 输入校验：CLI 参数严格白名单；路径归一化后必须落在允许目录。
2. 权限边界：仅写入 `~/.config/opencode` 与 `~/.opencode/skills`，禁止越界写入。
3. 敏感信息：不拷贝 `.opencode/opencode.json` 的个人 provider/plugin 配置。
4. 资源耗尽：限制单次复制文件数/总大小、备份上限，防止异常目录导致磁盘膨胀。
5. 滥用防护：`--dry-run` 默认可用，先预览写入影响。

## 9. Backward Compatibility & Rollout

### 9.1 Backward Compatibility

- 保留现有 `scripts/setup-opencode.ts` 入口名，避免破坏已有文档调用。
- 旧行为（偏 symlink）通过 `--strategy=symlink` 保留。

存量安装迁移判定（V1）：

- `all-symlink`：默认保持现状；仅当 `--migrate-to=copy` 时迁移。
- `mixed(symlink+copy)`：默认 `warning + skip write`；需显式 `--force-migrate`。
- `broken-symlink`：执行 `backup + rewrite as copy`。

默认策略：保守不自动大迁移，优先保证可回滚与可预测。

### 9.2 Rollout

1. 阶段 1：实现 install/verify + dry-run，默认 copy。
2. 阶段 2：补齐 rollback/uninstall 与状态文件。
3. 阶段 3：补齐 README 与故障排查，形成发布就绪。

### 9.3 Rollback

- 代码层：回退本次安装器改造与新增 plugin 资产。
- 用户侧：执行 `rollback` 按 `backup-index.v1.json` 恢复；若索引缺失，按备份命名规则手工恢复。

## 10. Verification Plan

关键行为与验证映射：

1. 一键安装可达：`install` 在干净环境成功，目标目录存在所需 assets。
2. 幂等：连续执行两次 `install`，第二次不发生非必要写入。
3. 冲突备份：预置同名冲突文件，执行后生成备份并完成覆盖。
4. MCP 降级：无合法 MCP 路径时安装成功但带 warning，不中断。
5. 回滚可执行：安装后执行 `rollback`，目标文件恢复到备份前状态。
6. 安全边界：构造越界路径参数应被拒绝。
7. 中断恢复：模拟写入中断后再次 `install`，最终可收敛成功。
8. 用户改动保护：对已被用户修改文件默认不覆盖，仅告警；`--force` 时覆盖。
9. 严格门禁：`verify --strict` 全绿时输出 `READY`（exit 0），否则返回 `E_VERIFY_STRICT`（exit != 0）。

测试产物建议：
- `.legion/tasks/legion-mind-opencode-plugin/docs/test-report.md`
- `.legion/tasks/legion-mind-opencode-plugin/docs/review-code.md`

## 11. Milestones

### M1. Installer 最小闭环（install + verify + dry-run）
- 验收：可完成白名单资产同步，`verify` 可报告缺失项。

### M2. 冲突与幂等（backup + state）
- 验收：冲突自动备份；二次安装无重复写入；状态文件可追踪。

### M3. MCP 降级与回滚（rollback/uninstall）
- 验收：MCP 缺失不阻塞；rollback 可恢复托管变更。

### M4. 文档与发布就绪
- 验收：README 一键安装路径、限制条件、回滚步骤、故障排查完整。

## 12. Open Questions

无（V1 关键边界已在本 RFC 内定版）。

## 13. Plan（落地执行清单）

拟变更文件点（仅 scope 内）：

1. `scripts/setup-opencode.ts`
   - 引入命令化入口（install/verify/rollback/uninstall）
   - 增加 copy 策略、dry-run、state 记录、错误码语义
2. `scripts/**`（必要时新增模块）
   - `sync-assets` / `backup` / `mcp-config` / `state-store` 公共逻辑
3. `.opencode/plugins/**`（可选新增）
   - 轻量 plugin 壳（安装后提示与环境检查）
4. `README.md`
   - 一键安装说明、幂等说明、MCP 降级、回滚手册
5. `.legion/tasks/legion-mind-opencode-plugin/docs/*`
   - `rfc.md`、`test-report.md`、`review-code.md`、`report-walkthrough.md`、`pr-body.md`

执行与验证步骤：

1. 本地 `dry-run` 验证影响面；
2. 真实 `install` 到临时 HOME（隔离目录）执行冒烟；
3. 构造冲突文件验证 backup 与 rollback；
4. 移除 MCP 路径验证降级；
5. 汇总测试与评审报告并准备 PR 文案。
