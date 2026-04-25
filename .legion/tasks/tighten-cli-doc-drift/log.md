# Tighten CLI wording and benchmark doc drift - 日志

## 会话进展 (2026-04-23)

### ✅ 已完成

- 收敛实现范围到 `scripts/setup-opencode.ts` 与 `docs/benchmark.md`
- 修正 `setup-opencode` 的 MCP optional 提示，不再暗示 CLI 是默认入口路径
- 重写 `docs/benchmark.md`，明确当前 repo 不存在 `benchmark:*` npm scripts 与 `scripts/benchmark/` 实现
- 生成 `test-report.md`、`review-change.md`、`report-walkthrough.md` 与 `pr-body.md`
- 把一条未复现的 `task create` 物化异常登记到 `.legion/wiki/maintenance.md`

### 🟡 进行中

(暂无)

### ⚠️ 阻塞/待定

- (暂无)

---

## 关键文件

- **`scripts/setup-opencode.ts`** [completed]
  - 作用: 调整 verify 输出中的 MCP optional 提示，使其与 current-truth control-plane 口径一致
  - 备注: 只改一条提示文案，不扩到 runtime enforcement
- **`docs/benchmark.md`** [completed]
  - 作用: 收敛 benchmark 文档到当前仓库真实 surface，并把未来意图显式降级为 planned / historical
  - 备注: 不补不存在的 scripts 或 artifact contract
- **`.legion/tasks/tighten-cli-doc-drift/`** [in_progress]
  - 作用: 保存本任务的 contract、验证、review 与交付摘要
  - 备注: 原创建结果缺失 `plan.md/log.md/tasks.md`，已补齐并完成本轮主干
- **`.legion/wiki/maintenance.md`** [completed]
  - 作用: 记录一条需后续独立验证的 CLI task bootstrap 观察
  - 备注: 当前只观测到一次，尚未复现，因此按 maintenance debt 管理

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 只改一条 verifier 提示 | 这是修复 CLI 默认路径语义漂移的最小正确改动 | 扩大到 runtime gate / phase enforcement | 2026-04-23 |
| 把 benchmark runbook 改成 current-state note | 当前仓库没有对应 scripts / config / artifact contract，不能继续假装存在 | 补写不存在的 benchmark 实现或保留旧 runbook | 2026-04-23 |

---

## 快速交接

**下次继续从这里开始：**

1. 如需继续，单独立 task 复现 `task create` 返回 success 但未完整落盘 `plan.md/log.md/tasks.md` 的现象。
2. 若 benchmark automation 将来恢复，先提交真实实现，再扩写 `docs/benchmark.md`。

**注意事项：**

- 这轮不扩 Scope 到 runtime 强门禁。
- 当前 maintenance 条目是一次性观察，不应在未复现前直接改 CLI 行为。

---

*最后更新: 2026-04-23 11:09 by OpenCode*
