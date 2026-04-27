# Harden v1 kernel harness surface - 日志

## 会话进展 (2026-04-27)

### ✅ 已完成

- 已创建任务 contract 并在 `.worktrees/harden-v1-kernel-harness` 中执行 git-worktree-pr envelope。
- 已完成 design gate：`docs/rfc.md` 与 `docs/review-rfc.md`，review-rfc PASS。
- 已完成实现：删除过时根 `docs/` current-truth 文件，新增 shared setup core，OpenClaw 对齐 rollback/uninstall，新增 regression suite，更新 README 与 benchmark README。
- 已完成验证：`docs/test-report.md` 记录 `npm run test:regression` 10/10 PASS，并覆盖 setup-core、destructive path safety、repo-local temp roots、docs/README/CLI boundary。
- 已完成 review-change：security lens PASS，blocking findings 为 0。
- 已完成 report-walkthrough、PR body 与 legion-wiki writeback。

### 🟡 进行中

- PR lifecycle：待提交、rebase、push、创建 PR 并跟进 checks/review/cleanup/main refresh。

### ⚠️ 阻塞/待定

(暂无)

---

## 关键文件

- **`README.md`** [updated]
  - 作用: current product entry、状态与 OpenCode/OpenClaw 支持边界
  - 备注: 状态为 `可运行内核 / v1 前硬化中`
- **`scripts/lib/setup-core.ts`** [added]
  - 作用: 共享 setup lifecycle primitives 与 destructive path safety
  - 备注: OpenCode/OpenClaw adapters 均委托该 core
- **`scripts/setup-opencode.ts` / `scripts/setup-openclaw.ts`** [updated]
  - 作用: runtime-specific setup adapters
  - 备注: OpenClaw 现支持 rollback/uninstall
- **`tests/regression/**`** [added]
  - 作用: setup lifecycle、skill surface、CLI invariant regression
  - 备注: temp roots 使用 repo-local `.cache/regression`
- **`.legion/tasks/harden-v1-kernel-harness/docs/*.md`** [completed]
  - 作用: RFC、review、verification、walkthrough、PR body evidence
  - 备注: review-change PASS

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 根 `docs/` 退出 current truth | 旧 benchmark/usage/设计材料已与 README/wiki/skills/benchmark README 漂移 | 继续修补旧 docs | 2026-04-27 |
| OpenClaw `openclaw.json` 不作为 managed file | 避免 rollback/uninstall 误删或重写用户配置 | 把整个 config 纳入 manifest | 2026-04-27 |
| Regression temp roots 使用 `.cache/regression` | git-worktree-pr envelope 要求临时产物留在 repo 内 | 使用 system tmp | 2026-04-27 |
| CLI 保持薄文件工具 | 用户明确要求暂不升级 runtime orchestrator | 实现 `legion run` 类 runtime engine | 2026-04-27 |

---

## 快速交接

**下次继续从这里开始：**

1. 执行 PR lifecycle：commit -> `git fetch origin && git rebase origin/master` -> push branch -> create PR -> follow checks/review。
2. 若 PR 合并或关闭后，删除本 worktree 并刷新主工作区基线。

**注意事项：**

- 用户明确要求本任务别动 repo hygiene / 旧 worktree / `superpowers/` 等非 scope 项。
- push 前必须在 worktree 内 `git fetch origin && git rebase origin/master`。
- blocked handoff 不等于完成；完成还需要 PR 终态、checks/review、cleanup 和主工作区 refresh。

---

*最后更新: 2026-04-27 08:20 by Legion*
