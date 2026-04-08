# LegionMind 最佳实践

> **范围**: 维护高质量上下文的指南、检查清单和示例。

---

## 1. 黄金法则

1.  **更新频率**: **每 15-20 分钟** 或每完成一个主要子任务后，必须更新 `context.md`。不要等到会话结束才更。
2.  **决策追踪**: 如果你花了 >5 分钟思考 "选 A 还是选 B"，**必须记录**在 `context.md` 的决策表中。
3.  **显式阻塞**: 如果遇到卡顿，立即将问题添加到 `context.md` 的 **Blocked** (阻塞/待定) 区域。
4.  **原子任务**: `tasks.md` 中的条目必须可验证。“修复 Bug”是坏任务；“修复 AuthHandler 中的空指针异常”是好任务。
5.  **文档语言一致**: 任务文档默认跟随当前用户与 agent 的工作语言；若仓库已有明确文档语言规范，则遵循仓库规范，不要默认写英文。

---

## 2. 编写 `context.md`

### ✅ Do (推荐)
- 记录 **Why** (为什么改)，而不仅仅是 **What** (改了什么)。
- 使用 **Handoff** (交接) 区域给未来的自己（或下一个 Agent）留言。
- 提到代码时，链接到具体的文件或行号。

### ❌ Don't (禁止)
- 把整个文件内容复制粘贴到 context 中（应该用 `read` 工具）。
- 在代码里留 "Todo" 注释（应该放在 `tasks.md` 里）。
- 删除旧的决策记录（除非事实错误，否则保留历史）。

### 交接前检查清单
- [ ] `tasks.md` 中的 `currentTask` 是否准确？
- [ ] 所有已完成步骤是否都打上了 `[x]`？
- [ ] `context.md` 中的“下一步”是否清晰到陌生人也能接手？

---

## 3. 编写 `plan.md`

### ✅ Do (推荐)
- **目标** (Goal) 控制在 3 句话以内。
- 用 3-8 句话写清 **问题陈述**，并保持为摘要级任务契约。
- 把 **验收标准** 写成可映射到测试或人工检查的条目。
- 使用 **设计索引** (Design Index) 链接到真正的 RFC/Spec。
- 清晰定义 **范围** (Scope)（哪些目录是允许修改的？）。
- 明确记录 **假设 / 约束 / 风险**，但把实现推导留在 RFC。

### ❌ Don't (禁止)
- 在这里写详细的实现逻辑（放到 RFC 去）。
- 重复 `tasks.md` 里的信息。
- 把 `plan.md` 写成小型 RFC，或粘贴完整测试矩阵、迁移步骤、威胁模型正文。

---

## 4. 处理 Review

1.  **Read**: 开始工作前，先运行 `review list` 检查 Review。
2.  **Prioritize**: `[REVIEW:blocking]` 必须在写代码前解决。
3.  **Respond**: 使用 `review respond` 标记 `[STATUS:resolved]`。只有 orchestrator 在 break-glass 模式下才允许手动编辑文本，且需注明无 ledger 审计。

---

## 5. 常见工作流示例

**场景**: 实现一个新功能。

1.  **Start**: `context read` 加载状态。
2.  **Contract**: 先阅读 `.legion/tasks/<task-id>/plan.md` 恢复问题、验收、Scope 与阶段。
3.  **Design**: 若 `plan.md` 链接 RFC，再阅读 `.legion/tasks/<task-id>/docs/rfc.md`。
4.  **Code**: 实现 1 个单元。
5.  **Log**: `tasks update`（标记完成）、`context update`（记录决策）。
6.  **Repeat**: 重复步骤 4-5。
7.  **End**: `run-tests`，然后 `context update`（交接）。
