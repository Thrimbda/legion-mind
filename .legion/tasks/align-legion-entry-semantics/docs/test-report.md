# 测试报告

## 执行命令
- `grep`（通过工具）扫描 in-scope 文档/skill/reference，检查是否仍出现旧语义：`默认入口`、`CLI 自动记住当前任务`、`current-task`、`唯一 active task`、`恢复活跃任务`、`init 生成 wiki`、`生成 wiki 索引`、`自动记住`
- `node --experimental-strip-types "skills/legion-workflow/scripts/legion.ts" init --cwd "$tmpdir" --format json`
- `python3` 检查初始化结果是否仅创建 `.legion/tasks/`，且未创建 `.legion/wiki/`

## 结果
PASS

## 摘要
- 已简读 `plan.md` 与 `docs/rfc.md`，确认本次只验证两项：旧语义已从 in-scope 文件移除、`init` 仍只创建 `.legion/tasks/`。
- 对以下 in-scope 文件执行禁用措辞检查：`README.md`、`AGENTS.md`、`docs/legionmind-usage.md`、`skills/legion-workflow/SKILL.md`、`skills/brainstorm/SKILL.md`、`skills/legion-workflow/references/*.md`、`skills/legion-wiki/references/*.md`；未命中旧语义。
- 代码与运行时一致：`skills/legion-workflow/scripts/lib/cli.ts` 中 `initLegion()` 仅执行 `mkdirSync(join(ctx.legionRoot, 'tasks'), { recursive: true })`。
- 在临时目录实际运行 `init` 后，确认 `.legion/` 与 `.legion/tasks/` 被创建，`.legion/wiki/` 与 `.legion/wiki/index.md` 均不存在。

## 失败项（如有）
- 无

## 备注
- 选择这组命令的原因：本任务 scope 明确且验证目标只有“文案禁用语义 + init 最小行为”，因此优先使用最低成本的定向 grep 与一次真实 CLI smoke test，而不是跑仓库级全量验证。
- 考虑过的备选项：
  - `node scripts/setup-opencode.ts verify --strict`：覆盖面更广，但与本任务两项 focused validation 不完全对齐，成本更高。
  - 全仓库全文 grep：可能引入 out-of-scope 历史文档/任务文档噪音，因此只对 in-scope 文件做定向检查。
  - 仅静态读代码、不实际运行 `init`：证据不足，因此补了一次临时目录真实执行验证。
