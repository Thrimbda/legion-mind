# 交付 Walkthrough：fix-task-create-materialization

## 目标与范围

- **任务目标**：修复 `task create` 的任务物化可靠性，确保 CLI 返回 success 时，新任务能以完整目录形态落盘并可立即被读取。
- **绑定 scope**：本次实现改动限定在 `skills/legion-workflow/scripts/lib/cli.ts` 的任务创建物化路径；不扩展到 task schema、`status`、`task list` 或其他 CLI 流程。
- **问题边界**：此前只观测到一次 one-off 的 partial materialization（成功返回但最终目录不完整），**未能稳定复现**；因此本次修复以**不变量加固（invariant-hardening）**为主，而不是宣称已定位唯一根因。

## 设计摘要

- 设计来源：[`rfc.md`](./rfc.md)
- RFC 结论：将任务草稿先写入 `.legion/tasks/` 下的 sibling staging 目录，待 `docs/`、`plan.md`、`log.md`、`tasks.md` 全部完成后，再一次性 `rename` 到最终任务目录。
- 这样可把“最终目录过早可见”收敛为“最终目录只会在完整时出现”，符合 [`review-rfc.md`](./review-rfc.md) 中对最小修复、最小范围和可回滚性的要求。

## 改动清单

### 模块：Legion CLI 任务创建物化

**文件**：`skills/legion-workflow/scripts/lib/cli.ts`

- `writeTaskDraft()` 改为 staging-first 流程：
  - 先在 `.legion/tasks/` 下创建临时 staging root
  - 在 staging root 内创建 `docs/`
  - 在 staging root 内写入 `plan.md`、`log.md`、`tasks.md`
  - 全部完成后再 `renameSync(stagingRoot, draft.root)`
- 新增 `createTaskStagingRoot()`：负责生成同级临时目录并限制逻辑范围在任务创建路径内部。
- 新增 `cleanupTaskStagingRoot()`：失败时做 best-effort 清理，避免成功路径外留下过多中间目录。

## 如何验证

- 详细验证记录：[`test-report.md`](./test-report.md)
- 变更审查：[`review-change.md`](./review-change.md)

### 已执行验证

1. 在隔离临时 repo 中执行真实 smoke 流程：
   - `init`
   - `task create`
   - `status --task-id <id>`
   - `task list`
2. 对 `verify-smoke-a`、`verify-smoke-b`、`verify-smoke-c` 三个任务执行直接文件系统检查。

### 预期结果

- `task create` 成功后，`status` 能立即读取新任务。
- `task list` 能立即列出新任务。
- 每个最终任务目录都同时包含：`docs/`、`plan.md`、`log.md`、`tasks.md`。
- success path 下 `.legion/tasks/` 内不残留 `.tmp-*` staging 目录。

### 当前验证结论

- 成功路径证据成立：测试报告显示三个 smoke task 都完整落盘，且创建后可立即被 `status` / `task list` 读取。
- **剩余 caveat**：本轮**没有做 failure injection**；中途写入失败或最终 rename 失败场景，目前仍主要由代码路径与设计审查支撑，而非执行证据直接覆盖。

## 风险与回滚

### 风险

- 本次变更影响所有新任务创建路径，但改动集中在单一物化 helper，范围受控。
- 若真实环境出现 staging/rename 兼容性问题，可能影响新任务初始化。
- 宿主级中断时仍可能遗留 `.tmp-*` staging 目录，但这些目录不会被合法 taskId 识别为任务。

### 回滚

- 可回退 `writeTaskDraft()` 到原先“直接写最终目录”的策略。
- 如需回滚，同时手动清理 `.legion/tasks/` 下遗留的 `.tmp-*` 目录。

## 未决项与下一步

- 未决项：是否需要后续补一个低侵入的故障注入测试手段，以覆盖 mid-write / rename-failure 场景。
- 下一步：
  1. reviewer 重点确认 staging + rename 是否准确落实 RFC 的不变量目标。
  2. 若后续 CLI 具备低成本故障注入点，可补 focused fault-injection test 作为增强验证。
