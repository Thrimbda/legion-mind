# Legion Patterns

## 模式：CLI 保持薄层

- 来源任务：`drop-ledger-config-from-cli`
- 背景：workflow 真源已经上收至 skill 与 dispatch matrix，CLI 不应再维护一套平行状态机。
- 做法：CLI 只保留初始化、文件级读写、显式 `task-id` 下的查询与更新；避免全局状态注册表与审计账本。
- 适用边界：适用于 Legion workflow 自身；若未来确有外部系统集成需求，再单独设计 machine state。
- 常见陷阱：不要把“方便”重新实现成 config / ledger 型隐式状态。
- 最小示例：`task create --json ...` 后，用 `status --task-id <id>`、`log update --json ...`、`tasks update --json ...`。

## 模式：`task create` 先 staging 再落最终目录

- 来源任务：`fix-task-create-materialization`
- 背景：直接在最终任务目录中逐个写 `docs/`、`plan.md`、`log.md`、`tasks.md` 会暴露部分物化窗口；即使单文件写入是原子的，任务目录整体可见性并不是原子的。
- 做法：先在 `.legion/tasks/` 下创建 `.tmp-<taskId>-<nonce>` staging root，在其中写完 `docs/`、`plan.md`、`log.md`、`tasks.md`，再一次性 rename 到最终 `.legion/tasks/<taskId>`。
- 适用边界：适用于 Legion CLI 的 task bootstrap / materialization 路径，目标是不变量加固：success => 最终任务目录完整可读。
- 常见陷阱：不要退回“先暴露最终目录、失败后 cleanup”的方案；cleanup 能改善异常尾部，但不能消除最终目录过早可见的问题。
- 验证提示：至少覆盖 `init -> task create -> status --task-id -> task list` 的 success path，并确认 `.legion/tasks/` 下没有残留 `.tmp-*` staging 目录。

## 模式：`verify --strict` 校验内容与 ownership

- 来源任务：`harden-strict-verify-integrity`
- 背景：只检查安装目标文件是否存在会把截空文件、safe-skip 的 unmanaged 冲突文件、symlink 漂移和损坏 manifest 误判为 `READY`。
- 做法：strict verify 以安装脚本枚举出的 expected sync items 为真源，结合 `managed-files.v1.json` 校验目标存在性、managed ownership、copy checksum、symlink target、manifest missing/invalid 状态；普通 verify 仍保持 warning 兼容。
- 适用边界：适用于 `scripts/setup-opencode.ts` 的 OpenCode asset install/verify/rollback 路径；不扩展为通用发布 manifest 或 benchmark harness。
- 常见陷阱：不要让 `verify --strict` 退回 presence-only；也不要让 manifest 任意路径驱动遍历，verify 主循环必须由当前 expected items 驱动。
- 迁移提示：手工复制但内容与源一致的 legacy 安装可由普通 `install` 通过 `OK_ADOPT` 补写 ownership；内容不同的 unmanaged 冲突仍需审阅后 `install --force`。
- 验证提示：至少覆盖 copy/symlink strict success、checksum drift、unmanaged safe-skip、same-content adoption、invalid manifest、symlink type drift + force repair、rollback 后不误报 READY。
