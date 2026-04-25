# Fix task create materialization reliability - 日志

## 会话进展 (2026-04-23)

### ✅ 已完成

- 手动初始化独立 task contract，避免依赖可能有缺陷的 `task create`
- 在隔离目录和当前仓库里复现 `task create`，未稳定复现 partial materialization
- 产出 design-lite RFC，并通过 `review-rfc`
- 将 `writeTaskDraft()` 改为 staging 目录完整写盘后再 rename 到最终 task root
- 生成 `test-report.md`、`review-change.md`、`report-walkthrough.md` 与 `pr-body.md`
- 将任务物化策略提升为 `.legion/wiki/patterns.md` 中的 durable pattern，并从 maintenance 中移除该开放项

### 🟡 进行中

(暂无)

### ⚠️ 阻塞/待定

- (暂无)

---

## 关键文件

- **`skills/legion-workflow/scripts/lib/cli.ts`** [pending]
 - **`skills/legion-workflow/scripts/lib/cli.ts`** [completed]
  - 作用: 任务物化根因与修复落点，包含 `createTask` / `writeTaskDraft`
  - 备注: 已改为 staging + rename，避免最终 task root 以半成品状态出现
- **`.legion/tasks/fix-task-create-materialization/docs/rfc.md`** [completed]
  - 作用: 记录 staging + rename 设计与验证口径
  - 备注: 已通过 `review-rfc`
- **`.legion/tasks/fix-task-create-materialization/docs/test-report.md`** [completed]
  - 作用: 记录 success path 下任务创建可靠性的 focused evidence
  - 备注: failure injection 仍是后续增强项，不是本轮阻塞项
- **`.legion/wiki/patterns.md`** [completed]
  - 作用: 沉淀 `task create` 的 staging + rename 物化模式
  - 备注: 该模式现在是跨任务可复用的 CLI durability 约定

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 手动创建 task contract | 避免再次依赖待排障的 `task create` | 用 `task create` 再建一个 task | 2026-04-23 |
| 采用 staging + rename 物化策略 | 这是最小且最稳的方式，能保证 success 后最终任务目录完整可见 | 仅加 diagnostics 或失败后 cleanup | 2026-04-23 |
| 将修复后的物化策略提升为 wiki pattern | 这已经是当前 CLI durability 的可复用做法 | 继续把它留在 maintenance debt | 2026-04-23 |

---

## 快速交接

**下次继续从这里开始：**

1. 如果后续需要更强证据，再单独补故障注入验证 mid-write / rename-failure 场景。
2. 若 staging 目录残留在真实环境中出现频繁，再单独评估是否需要清理命令。

**注意事项：**

- 不顺手修 runtime gate 或其它 CLI 子命令。
- one-off 现象未稳定复现，本轮修复依据是“消除部分物化窗口”而不是锁定唯一根因。

---

*最后更新: 2026-04-23 11:38 by OpenCode*
