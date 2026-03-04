# Walkthrough Report - LegionMind OpenCode Plugin Install Path

## 1) 目标与范围

本次交付目标是把 LegionMind 从“克隆仓库 + 手工配置”升级为“可一键安装并可验证可回滚”的发布就绪路径，且安装后可直接进入 OpenCode 工作流。

本次范围严格绑定如下 scope：

- `scripts/setup-opencode.ts`
- `package.json`
- `README.md`
- `.legion/tasks/legion-mind-opencode-plugin/docs/*`

## 2) 设计摘要（先研究后实施）

本任务按“先可行性研究，后实施”执行：先完成 task-brief 与 RFC，再进入编码。

- 可行性结论：可行，采用“Profile 安装器 + 轻量 Plugin”组合（见 `./task-brief.md`）。
- 风险分级：Medium，因此执行了 RFC + review-rfc 设计门禁（见 `./rfc.md`、`./review-rfc.md`）。
- 设计收敛结果：`review-rfc` 结论 PASS，无阻塞项，允许进入实现。

该设计核心是：完整分发 agents/commands/skills 资产，辅以 plugin 形态；同时提供幂等安装、safe-overwrite、严格验证与可回滚语义。

## 3) 改动清单（按模块/文件）

### A. 安装器主逻辑

文件：`scripts/setup-opencode.ts`

主要实现：

- 引入命令化入口：`install | verify | rollback | uninstall`。
- 新增统一参数：`--strict`、`--dry-run`、`--force`、`--json`、`--strategy`、`--to`、`--config-dir`、`--opencode-home`。
- 落地状态与索引文件：
  - `install-state.v1.json`
  - `managed-files.v1.json`
  - `backup-index.v1.json`
- 实现 `safe-overwrite` 判定：对 `same-content`、`managed-unchanged`、`user-modified`、`unmanaged-existing` 分支进行区别处理。
- 实现冲突备份与回滚恢复：安装前备份，`rollback` 支持按 `backupId` 恢复，并在恢复后更新状态索引。
- 实现严格校验门禁：`verify --strict` 输出 `READY` 或 `E_VERIFY_STRICT`。
- 增加受管路径边界校验：`rollback/uninstall` 对状态中的 target/backup 路径进行 allowlist 校验，避免越界操作。

### B. 包入口与命令

文件：`package.json`

主要改动：

- 暴露 CLI 可执行入口：`bin.legion-mind-opencode -> scripts/setup-opencode.ts`。
- 提供标准脚本：
  - `opencode:install`
  - `opencode:verify`
  - `opencode:rollback`
- 保持 Node 版本下限约束，确保安装器运行环境一致。

### C. 使用文档与运维手册

文件：`README.md`

主要改动：

- 补充“一键安装（发布就绪）”章节，明确本地入口与未来 `bunx` 入口。
- 明确 `safe-overwrite` 语义、`--force` 行为、白名单同步范围。
- 明确状态文件位置与 strict 验证双态结果。
- 补充隔离测试参数，便于本地/CI 可重复验证。

### D. 任务文档闭环

文件：`.legion/tasks/legion-mind-opencode-plugin/docs/*`

- 已具备 task-brief、RFC、review-rfc、review-code、review-security、test-report。
- 本文档与 `pr-body.md` 作为本任务交付收口。

## 4) 如何验证

参考测试报告：`./test-report.md`

建议执行命令：

```bash
node scripts/setup-opencode.ts install --dry-run --json
node scripts/setup-opencode.ts install --json
node scripts/setup-opencode.ts verify --strict --json
node scripts/setup-opencode.ts rollback --json
```

预期结果：

- `install --dry-run` 返回 `OK_INSTALL`，且不落地目标资产/状态文件。
- `install` + `verify --strict` 返回 `READY`（exit code 0）。
- 冲突场景下默认出现 `W_SAFE_SKIP`（`user-modified` / `unmanaged-existing`），`--force` 后可覆盖。
- `rollback` 能恢复到备份前内容，且状态文件同步更新。

测试结论（来自 `./test-report.md`）：PASS，6/6 场景通过。

## 5) 评审结论（代码/安全）

- RFC 评审：PASS（`./review-rfc.md`），无阻塞项，非阻塞建议集中在状态职责边界与 strict 输出可观测性。
- 代码评审：PASS（`./review-code.md`），4 项重点复核闭环；存在 2 条非阻塞改进建议（symlink 卸载对称性、README 非 strict 文案补充）。
- 安全评审：PASS（`./review-security.md`），此前阻塞项已修复；建议后续增强高风险路径拒绝、审计事件与状态完整性保护。

## 6) 风险与回滚

当前风险等级：Medium。

主要风险：

- 安装器涉及用户本地目录写入，误判可能导致覆盖风险。
- 状态文件损坏或漂移可能影响回滚/卸载一致性。
- symlink 策略与 copy 策略共存时，存在行为理解成本。

已落地缓解：

- `safe-overwrite` 默认保护用户改动。
- `rollback/uninstall` 受管路径强校验，防止越界写入/删除。
- strict 验证作为“可开始工作”门禁。

回滚方案：

- 代码回滚：回退本次安装器、文档与包入口改动。
- 用户侧回滚：执行 `node scripts/setup-opencode.ts rollback`（或指定 `--to <backup-id>`），按备份恢复托管条目。

## 7) 未决项与下一步

未决项（非阻塞）：

- `uninstall` 对“托管且未漂移 symlink”可考虑默认安全删除，减少 `--force` 依赖。
- README 可补充非 strict 缺失项为 warning 且仍 `READY` 的说明。
- 安全增强可纳入后续迭代：高风险目录拒绝、结构化审计、状态完整性校验。

下一步建议：

1. 以当前实现创建 PR，按文档链路组织 reviewer（RFC/代码/安全）。
2. 在后续小版本吸收非阻塞建议，不改变本次发布就绪语义。
3. 进入 npm 发布准备阶段时，复用现有 `bin` 与命令模型对接 `bunx` 入口。
