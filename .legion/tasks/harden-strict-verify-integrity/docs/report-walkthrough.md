# Reviewer Walkthrough：harden-strict-verify-integrity

## 目标与范围

本任务目标是加固 `scripts/setup-opencode.ts` 的 `verify --strict`：不再只检查安装资产是否存在，而是验证资产内容、manifest 所有权、目标类型与 symlink 指向是否仍符合当前仓库源资产期望，避免损坏文件、未管理冲突或 rollback 后漂移被误报为 `READY`。

本任务范围绑定为：

- `scripts/setup-opencode.ts`
- `.legion/tasks/harden-strict-verify-integrity/**`

说明：当前 worktree 中存在与本任务无关的预先变更；本任务拥有的生产代码变更仅为 `scripts/setup-opencode.ts`，其余为该任务目录下文档。

## 设计摘要

设计来源：[`rfc.md`](./rfc.md)。

RFC 选择“manifest + 当前源指纹 + 目标形态 + 所有权联合校验”方案，将 strict verify 从 presence check 升级为完整性证明：

- verify 复用 install 的 expected sync item 枚举，覆盖 agents、可选 plugins 与 `INSTALLED_SKILLS` 下的同步资产。
- strict 模式加载 `.legionmind/managed-files.v1.json`，区分 `ok` / `missing` / `invalid`，manifest 缺失或损坏不再被当作空 manifest 默默通过。
- copy 资产校验 regular file 与 sha256；symlink 资产校验目标必须是 symlink 且 resolved target 指向当前 expected source。
- 目标存在但 manifest 无记录时报告 `E_VERIFY_UNMANAGED`，覆盖 install safe-skip 后的未接管冲突。
- install 增加 same-content adoption：内容/链接已等于源但 manifest 缺记录时补写 ownership，不覆盖用户文件。
- 所有 strict hard failure 最终汇总为 `E_VERIFY_STRICT`，并提供可执行修复提示。

## 改动清单

### `scripts/setup-opencode.ts`

- 抽取/复用 expected sync item 枚举，使 install 与 verify 的资产集合保持一致。
- 新增 strict integrity verifier，逐项检查：
  - 源资产存在性；
  - 目标存在性；
  - manifest ownership；
  - manifest record 字段与类型合法性；
  - copy 文件类型与内容 checksum；
  - symlink 类型与链接目标漂移；
  - manifest checksum 与当前源期望的一致性。
- 新增 manifest loader 状态：`ok` / `missing` / `invalid`；非法 JSON 或非法 managed record 在 strict 下稳定报 `E_VERIFY_MANIFEST`。
- 新增 same-content adoption：legacy/no-manifest 但内容一致的资产可由普通 install 接管并写入 manifest。
- 保留非 strict verify 的兼容风格：manifest 缺失/非法降级为 warning，不把轻量健康检查升级为失败。
- 保留修复路径：`install --force` 可修复 corrupted/unmanaged/type drift 场景，rollback 后 verify 不再误报 `READY`。

### `.legion/tasks/harden-strict-verify-integrity/**`

- [`plan.md`](../plan.md)：记录目标、验收标准、范围和设计索引。
- [`rfc.md`](./rfc.md)：记录 strict verify 完整性设计、错误语义、兼容/迁移/回滚策略与验证矩阵。
- [`test-report.md`](./test-report.md)：记录 8 个隔离场景的 PASS 结果。
- [`review-change.md`](./review-change.md)：记录代码审查 PASS，无阻塞问题。
- 本文件与 [`pr-body.md`](./pr-body.md)：面向 reviewer 的报告与 PR 描述。

## 如何验证

验证证据见 [`test-report.md`](./test-report.md)，结论为 PASS。

验证使用隔离临时目录，每个场景均使用独立的 `--config-dir <temp>/sN/config` 与 `--opencode-home <temp>/sN/home`，运行方式为：

```bash
node --experimental-strip-types scripts/setup-opencode.ts ...
```

覆盖场景与预期：

1. `install --strategy=copy` → `verify --strict`：预期 `rc=0`、输出 `READY`。
2. copy 安装后截空 `home/skills/legion-workflow/SKILL.md` → `verify --strict`：预期 `rc=1`，出现 `E_VERIFY_CHECKSUM` 与最终 `E_VERIFY_STRICT`。
3. 预置未管理 `config/agents/legion.md` → `install --strategy=copy` → `verify --strict`：预期 install 输出 `W_SAFE_SKIP`，verify 出现 `E_VERIFY_UNMANAGED` 与最终 `E_VERIFY_STRICT`。
4. copy 安装后移走 manifest 模拟 same-content/no-manifest → 重新 install → `verify --strict`：预期 `OK_ADOPT`，strict verify `READY`。
5. 安装后写入非法 manifest JSON → `verify --strict`：预期 `E_VERIFY_MANIFEST` 与最终 `E_VERIFY_STRICT`。
6. symlink 安装 → `verify --strict` → 将受管理 symlink 替换为普通文件 → `verify --strict` → `install --strategy=symlink --force` → `verify --strict`：预期先通过，漂移后 `E_VERIFY_TYPE_MISMATCH`，force 修复后重新 `READY`。
7. 预置未管理 agent → `install --force` → `verify --strict` → `rollback` → `verify --strict`：预期 force takeover 后通过，rollback 后出现 `E_VERIFY_UNMANAGED`，不误报 `READY`。
8. manifest JSON 语法有效但 managed record 的 `checksum` 为非字符串 → `verify --strict`：预期 `E_VERIFY_MANIFEST` 与最终 `E_VERIFY_STRICT`，且无 `TypeError` / `INTERNAL_ERROR`。

审查证据见 [`review-change.md`](./review-change.md)，结论为 PASS：follow-up 修复已补齐非法 managed record 校验，未发现阻塞问题。

## 风险与回滚

风险：

- strict 对缺失/非法 manifest 更严格，旧安装第一次运行 `verify --strict` 可能失败。
- copy/symlink 路径规范化若与 install 不一致，可能产生误报。
- 全量同步资产校验可能让失败输出变多。
- verify 期间目标文件被并发修改时，结果可能短暂不稳定。

缓解：

- 非 strict verify 仍保持 warning/READY 风格，降低兼容性冲击。
- same-content adoption 允许内容正确的 legacy 安装通过普通 install 平滑迁移。
- 错误码与 hint 指向 `install`、`install --force`、清理冲突或恢复完整 checkout。
- verify 以 expected items 驱动，不由 manifest 任意路径驱动，保持安全边界。

回滚：

- 若新 strict verify 在真实用户环境中误报，可回滚 `scripts/setup-opencode.ts` 中 strict integrity 校验逻辑；manifest 文件格式未变，无需数据迁移。
- 回滚本 PR 后，行为退回到较弱的 presence-check 风格；用户可继续通过重新安装或 `--force` 修复本地安装状态。

## 未决项与下一步

- 未决阻塞项：无。
- 下一步：reviewer 重点确认 strict verify 的错误语义、legacy migration/same-content adoption 行为，以及 PR 中是否仅包含任务范围内的 `scripts/setup-opencode.ts` 与任务文档。
- 若合并：可按 [`test-report.md`](./test-report.md) 的验证矩阵在 CI 或本地复跑关键场景。
