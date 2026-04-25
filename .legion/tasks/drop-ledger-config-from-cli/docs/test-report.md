# 测试报告

## 执行命令
`node --experimental-strip-types "skills/legion-workflow/scripts/legion.ts" task list --format json`

`node --experimental-strip-types "skills/legion-workflow/scripts/legion.ts" status --task-id drop-ledger-config-from-cli --format json`

`node --experimental-strip-types "skills/legion-workflow/scripts/legion.ts" ledger query`

`tmpdir=$(mktemp -d "/tmp/legion-cli-test.XXXXXX") && mkdir -p "$tmpdir/repo/.legion/tasks/corrupted-task" && cp ".legion/tasks/drop-ledger-config-from-cli/plan.md" "$tmpdir/repo/.legion/tasks/corrupted-task/plan.md" && cp ".legion/tasks/drop-ledger-config-from-cli/tasks.md" "$tmpdir/repo/.legion/tasks/corrupted-task/tasks.md" && node --experimental-strip-types "/Users/c1/Work/legion-mind/skills/legion-workflow/scripts/legion.ts" task list --format json --cwd "$tmpdir/repo"`

`tmpdir=$(mktemp -d "/tmp/legion-cli-test.XXXXXX") && node "scripts/setup-opencode.ts" install --config-dir "$tmpdir/config" --opencode-home "$tmpdir/opencode" && node "scripts/setup-opencode.ts" verify --strict --config-dir "$tmpdir/config" --opencode-home "$tmpdir/opencode"`

## 结果
PASS

## 摘要
- `task list --format json` 在当前仓库通过，任务发现仍基于 `.legion/tasks/*` 正常工作。
- `status --task-id drop-ledger-config-from-cli --format json` 通过，显式 `--task-id` 主路径可用。
- 人工构造缺少 `log.md` 的损坏任务目录后，`task list` 按预期返回 `TASK_CORRUPTED`，错误指向 `.legion/tasks/corrupted-task/log.md`。
- `ledger query` 继续返回 `UNSUPPORTED_COMMAND`，符合已删除命令面的设计。
- 隔离目录中的 `install + verify --strict` 通过；仅有可选 MCP 提示 `W_MCP_OPTIONAL`，不构成失败。

## 失败项（如有）
- 无阻塞失败。
- 预期失败：`ledger query` 被移除；损坏任务用例返回 `TASK_CORRUPTED`。

## 备注
- 这次刷新重点覆盖最新修复的 corrupted-task 分支，因此优先选择低成本 CLI 烟雾验证 + 定向损坏目录用例，再补跑 README 默认验收路径 `verify --strict`。
- 备选项包括继续扩展 `log/tasks/plan/review` 子命令覆盖，或直接运行 `npm run opencode:verify`；本次未优先采用后者，是为了避免本机默认目录状态带来的噪音。
