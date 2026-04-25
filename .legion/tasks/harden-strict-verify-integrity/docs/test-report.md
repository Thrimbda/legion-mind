# 测试报告：harden-strict-verify-integrity

## 结论

状态：PASS。

已在隔离临时目录刷新运行要求的 strict verify 验证矩阵，并补充 review fix 后要求的第 8 个场景。所有正向路径返回 `rc=0` 和 `READY`；所有负向路径返回 `rc=1`，并出现预期的稳定错误码与最终 `E_VERIFY_STRICT`。未发现阻塞失败。

> 说明：用户要求使用 `verify-change` skill；当前运行环境的 skill 列表中未注册该 skill，加载返回 `Skill "verify-change" not found`。本报告按其要求的验证矩阵手动执行并记录结果。

## 环境

- 仓库：`/Users/c1/Work/legion-mind`
- 脚本：`scripts/setup-opencode.ts`
- 运行方式：`node --experimental-strip-types scripts/setup-opencode.ts ...`
- 隔离目录：`/var/folders/nt/__ctsqgj5m7_068vksf2kqk00000gn/T/lm-verify-refresh-nf0Dje`
- 原始输出：本轮通过一次性 Node matrix runner 汇总到终端输出；未写入仓库范围外的持久报告文件。

## 命令摘要

每个场景均使用独立的 `--config-dir <temp>/sN/config` 与 `--opencode-home <temp>/sN/home`。

1. `install --strategy=copy` → `verify --strict`
2. `install --strategy=copy` → 截空 `home/skills/legion-workflow/SKILL.md` → `verify --strict`
3. 预置 `config/agents/legion.md` 未管理冲突 → `install --strategy=copy` → `verify --strict`
4. `install --strategy=copy` → 移走 `managed-files.v1.json` 模拟 same-content/no-manifest → 重新 `install --strategy=copy` → `verify --strict`
5. `install --strategy=copy` → 写入非法 `managed-files.v1.json` → `verify --strict`
6. `install --strategy=symlink` → `verify --strict` → 将受管理 symlink 替换为普通文件 → `verify --strict` → `install --strategy=symlink --force` → `verify --strict`
7. 预置未管理 `config/agents/legion.md` → `install --strategy=copy --force` → `verify --strict` → `rollback` → `verify --strict`
8. `install --strategy=copy` → 保持 manifest JSON 语法有效但将一个 managed file record 的 `checksum` 改为非字符串 → `verify --strict`

## 验证矩阵

| # | 场景 | 结果 |
|---|---|---|
| 1 | copy install + `verify --strict` | PASS：install `rc=0`；verify `rc=0`，输出 `READY`。 |
| 2 | corrupt managed file | PASS：verify `rc=1`；出现 `E_VERIFY_CHECKSUM` 与最终 `E_VERIFY_STRICT`。 |
| 3 | unmanaged conflict safe-skip | PASS：install 输出 `W_SAFE_SKIP [sync/unmanaged-existing]`；verify `rc=1`，出现 `E_VERIFY_UNMANAGED` 与最终 `E_VERIFY_STRICT`。 |
| 4 | same-content no-manifest adoption | PASS：重新 install `rc=0`，多项输出 `OK_ADOPT [sync/same-content]`；strict verify `rc=0`，输出 `READY`。 |
| 5 | invalid manifest | PASS：verify `rc=1`；出现 `E_VERIFY_MANIFEST` 与最终 `E_VERIFY_STRICT`。 |
| 6 | symlink install / 类型漂移 / force repair | PASS：symlink strict verify `rc=0` + `READY`；symlink 被普通文件替换后 verify `rc=1`，出现 `E_VERIFY_TYPE_MISMATCH` + `E_VERIFY_STRICT`；`install --force` 输出 `OK_BACKUP`/`OK_SYNC`，随后 strict verify `rc=0` + `READY`。 |
| 7 | force takeover 后 rollback | PASS：force takeover 后 strict verify `rc=0` + `READY`；rollback `rc=0` 输出 `OK_ROLLBACK`；rollback 后 strict verify `rc=1`，出现 `E_VERIFY_UNMANAGED` + `E_VERIFY_STRICT`，证明没有 READY false positive。 |
| 8 | JSON-valid manifest + invalid managed file record | PASS：将 `home/skills/legion-workflow/SKILL.md` 对应 manifest record 的 `checksum` 改为数字后，verify `rc=1`；出现 `E_VERIFY_MANIFEST` 与最终 `E_VERIFY_STRICT`；输出不包含 `TypeError` 或 `INTERNAL_ERROR`。 |

## 失败 / 跳过

- 失败：无。
- 跳过：无。
- 注意事项：`W_MCP_OPTIONAL` 在 verify 输出中持续出现，但属于可选 MCP 配置 warning，不影响 strict 完整性结论。
