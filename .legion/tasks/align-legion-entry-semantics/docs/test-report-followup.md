# 测试报告

## 执行命令
- `node --experimental-strip-types "skills/legion-workflow/scripts/legion.ts" status --task-id "align-legion-entry-semantics" --format json`
- `node --experimental-strip-types "skills/legion-workflow/scripts/legion.ts" dashboard generate --task-id "align-legion-entry-semantics" --format markdown`
- `rg -n "currentTask|currentChecklistItem|当前检查项" -- "skills/legion-workflow/scripts/legion.ts" "skills/legion-workflow/scripts/lib/cli.ts" "skills/legion-workflow/references/REF_AUTOPILOT.md" "skills/legion-workflow/references/REF_ENVELOPE.md" "skills/legion-workflow/references/REF_TOOLS.md" "skills/legion-docs/SKILL.md" "skills/legion-docs/references/REF_BEST_PRACTICES.md" "skills/legion-docs/references/REF_SCHEMAS.md"`
- `rg -n "status\\.currentTask|\\bcurrentTask\\b" -- ".legion/tasks/align-legion-entry-semantics"`

## 结果
PASS

## 摘要
- CLI `status` JSON 输出已使用 `currentChecklistItem`，未再暴露 `status.currentTask`。
- dashboard 文案已使用 `当前检查项`。
- in-scope 已改文件中，未发现 `status.currentTask` 残留；`currentTaskId` 仅是 task-id 解析 helper，不属于本次要消除的 status 字段。
- 本任务目录内仍有 `status.currentTask` / `currentTask` 命中，但均位于任务历史记录（`tasks.md`、`log.md`）中，用于描述本次重命名工作本身。

## 失败项（如有）
- 无

## 备注
- 选择这组命令的原因：本次 follow-up 目标是验证字段重命名与 dashboard 用词，最小且最直接的证据是一次 CLI `status`/`dashboard` 实跑，加上对 in-scope 已改文件的定向 residue 扫描。
- 考虑过的备选项：
  - `node scripts/setup-opencode.ts verify --strict`：覆盖更广，但与本次 follow-up 的字段/文案校验不完全对齐，成本更高。
  - 全仓库全文扫描：会混入超出 scope 的历史文档噪音，因此只对本次 scope 与已改文件做 focused 检查。
