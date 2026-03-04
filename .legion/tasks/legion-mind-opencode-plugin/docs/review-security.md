# Security Review Report

## 结论
PASS

## Blocking Issues
- 无。

## 建议（非阻塞）
- `secure-by-default`：为 `--config-dir` 和 `--opencode-home` 增加高风险路径拒绝策略（如系统关键目录），减少误操作导致的大范围覆盖风险。
- 审计增强（Repudiation）：在 `install/rollback/uninstall` 增加结构化审计事件（操作者、参数、受影响文件计数、失败原因），便于追溯。
- 状态完整性增强（Tampering）：可为 `managed-files.v1.json` / `backup-index.v1.json` 增加完整性校验（如 HMAC 或签名）与最小权限写入策略。

## 修复指导
本轮复核确认之前 2 个 blocking 已修复：

1. `rollback` 状态路径篡改风险已修复。
   - 证据：`scripts/setup-opencode.ts:682` 对 `entry.targetPath` 执行 `isManagedTargetPath(...)` 受管目录校验；
   - 证据：`scripts/setup-opencode.ts:694`-`scripts/setup-opencode.ts:696` 校验 `entry.backupPath` 必须与 `backupPathFor(entry.targetPath, batch.backupId)` 一致，否则 `E_PRECHECK` 失败退出。

2. `uninstall` 状态路径篡改风险已修复。
   - 证据：`scripts/setup-opencode.ts:757` 对 `managedState.files` 中每个 `targetPath` 执行 `isManagedTargetPath(...)` 校验；
   - 证据：校验失败直接 `E_PRECHECK` 返回，不进入删除分支（`scripts/setup-opencode.ts:758`-`scripts/setup-opencode.ts:766`）。

3. 受管路径边界实现。
   - 证据：`scripts/setup-opencode.ts:233`-`scripts/setup-opencode.ts:245` 定义受管根目录 allowlist，并通过 canonical 路径判断 `isWithinRoot`。
