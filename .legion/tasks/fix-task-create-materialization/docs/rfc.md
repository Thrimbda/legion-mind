# RFC：修复 `task create` 物化可靠性

## 摘要 / 动机

当前 `createTask()` 先创建 `docs/`，再依次写 `plan.md`、`log.md`、`tasks.md`（`skills/legion-workflow/scripts/lib/cli.ts:197-201,585-590`）。单文件写入本身是原子的（`writeTextAtomic()` 先写临时文件再 rename，见 `cli.ts:1165-1170`），但**任务目录整体对外可见并不是原子的**：一旦流程在中途失败或被中断，就可能留下部分目录内容。我们已观测到一次“CLI 看起来成功，但最终目录只有 `docs/`”的案例，虽未复现，但这说明当前设计无法强保证“success => 可立即读取完整任务”。

## 目标 / 非目标

### 目标
- 保证 `task create` 返回 success 时，最终任务目录一定同时包含 `docs/`、`plan.md`、`log.md`、`tasks.md`
- 保证 `status` / `task list` 在任务创建后立即可读，不触发 `TASK_CORRUPTED`
- 将改动限制在任务物化路径，不扩散到其他 CLI 流程

### 非目标
- 不追求定位那次 one-off 现象的唯一根因
- 不改 task schema、CLI 参数或任务文档内容模板
- 不顺手重构 `status` / `task list` / phase enforcement

## 定义

- **partial materialization**：`.legion/tasks/<taskId>/` 已出现，但缺少 `plan.md`、`log.md`、`tasks.md` 中的一个或多个
- **staging root**：同级临时目录，完整写好任务草稿后再整体 rename 到最终路径

## 方案设计

### 推荐方案：选项 3 —— 临时目录 staging，完成后一次性 rename

在 `.legion/tasks/` 下先创建一个仅供本次创建使用的临时目录（例如 `.tmp-<taskId>-<nonce>`），把 `docs/`、`plan.md`、`log.md`、`tasks.md` 全部写入该临时目录；只有当四项都准备完成后，才把临时目录 rename 到最终 `.legion/tasks/<taskId>`。

建议流程：
1. `createTask()` 继续负责输入校验与“最终目录不存在”检查
2. `writeTaskDraft()` 改为：
   - 在 `.legion/tasks/` 下创建 staging root
   - 在 staging root 内创建 `docs/`
   - 写入 `plan.md` / `log.md` / `tasks.md`
   - 最后 `renameSync(stagingRoot, finalRoot)`
3. 任一步失败：
   - 返回 error，不打印 success
   - best-effort 删除 staging root
   - 不留下可被 `status` / `task list` 误识别的最终任务目录

### 组件边界

- `skills/legion-workflow/scripts/lib/cli.ts`
  - `createTask()`：维持外部接口不变
  - `writeTaskDraft()`：承担“任务目录整体原子可见”的职责
- `skills/legion-workflow/scripts/legion.ts`
  - 预计无需接口改动；仅在需要补充更明确错误提示时才调整

## 备选方案

### 选项 1：保持现状，仅补 diagnostics

**优点**：改动最小，便于追查 one-off 现象。  
**放弃原因**：它不能改变当前“目录先暴露、文件后补齐”的结构性问题，仍无法保证 success 后目录完整，因此不满足本任务的可靠性目标。

### 选项 2：保持当前写入顺序，但在失败时 cleanup / rollback

**优点**：实现局部，代码改动小于 staging。  
**放弃原因**：它只能处理“代码已捕获的失败”，无法覆盖进程中断、宿主崩溃、外部终止等场景；这些场景下仍可能留下部分目录。换言之，它改善异常尾部处理，但不解决“最终目录过早可见”这个根因。

### 选项 3：staging 后整体 rename（推荐）

**优点**：以最小范围提供最强保证；最终目录只会以“完整”状态出现。  
**代价**：需要引入临时目录命名与清理逻辑，但局限在 `writeTaskDraft()` 内，可控。

## 数据模型 / 接口

- 对外 CLI JSON 输入输出保持不变：`createTask()` 仍返回 `{ taskId, path }`
- 最终任务目录结构保持不变：
  - `.legion/tasks/<taskId>/docs/`
  - `.legion/tasks/<taskId>/plan.md`
  - `.legion/tasks/<taskId>/log.md`
  - `.legion/tasks/<taskId>/tasks.md`
- 新增内部约定：`.legion/tasks/.tmp-<taskId>-<nonce>` 仅作为短生命周期 staging root，不属于合法 taskId，可被 `listTasks()` 现有 taskId 过滤自动忽略

## 错误语义

- staging 阶段任一步失败：命令返回 error；最终任务目录不存在；允许重试同一 `taskId`
- 最终 rename 失败：命令返回 error；best-effort 清理 staging root；最终任务目录仍不得处于半成品状态
- 若发生不可恢复的宿主级中断：最多留下 staging root，不应留下“看起来像已创建成功”的最终目录
- 重试语义：同一 `taskId` 在最终目录不存在时可安全重试；若最终目录已存在则继续报 `TASK_ALREADY_EXISTS`

## 安全性考虑

- 继续复用现有 `taskId` 校验与 `assertRepoControlledPath()`，不放宽路径边界或符号链接限制
- staging root 必须位于 `.legion/tasks/` 内，避免越界写入
- 临时目录数量应受失败频率约束；实现需 best-effort 清理，避免长期资源堆积

## 向后兼容 / 发布 / 回滚

- **兼容性**：无 CLI breaking change，无任务格式迁移
- **发布方式**：直接替换 `writeTaskDraft()` 的物化策略，并补充 focused verification
- **回滚方式**：若 staging 方案在真实环境暴露兼容性问题，可回退到当前直接写入方式；同时手动清理 `.legion/tasks/` 下遗留的 `.tmp-*` 目录

## 验证计划

关键行为与验证映射：

1. **创建成功后目录完整可读**  
   - 在隔离 repo 中执行 `init -> task create -> status --task-id -> task list`  
   - 验证新任务目录同时包含 `docs/`、`plan.md`、`log.md`、`tasks.md`

2. **写入中途失败不会暴露半成品最终目录**  
   - 对物化 helper 做故障注入（例如在 staging 写某个文件时抛错）  
   - 断言命令失败，最终 `.legion/tasks/<taskId>` 不存在

3. **rename 失败时不会留下损坏任务**  
   - 模拟最终落位失败（例如目标路径竞争存在）  
   - 断言返回 error，`status` / `task list` 不会读取到损坏 task

4. **老行为不回归**  
   - 创建后立即读取 `status` 返回标题、路径、progress 正常

## 未决问题

- 是否需要在后续单独补一个“清理遗留 `.tmp-*` staging 目录”的维护命令？本 RFC 先不纳入范围。

## 落地计划

### 预期文件变更点
- `skills/legion-workflow/scripts/lib/cli.ts`
  - 将 `writeTaskDraft()` 改为 staging + rename
  - 增加 best-effort staging cleanup
- `skills/legion-workflow/scripts/legion.ts`
  - 默认不改；若需要更明确错误提示，再做最小调整
- `.legion/tasks/fix-task-create-materialization/docs/rfc.md`
  - 记录设计决策与验证口径

### 验证步骤
- 在临时 repo 执行一次真实 `task create`
- 立即执行 `status` 与 `task list`
- 跑一次故障注入场景，确认不会出现 partial materialization
