# Add Git worktree PR envelope - 日志

## 会话进展 (2026-04-25)

### ✅ 已完成

- 根据用户给出的 AIM `AGENTS.md` 流程，确认需要将 Git / worktree / PR lifecycle 集成为 Legion 开发任务的强制外壳。
- 收敛设计方向：新增 `git-worktree-pr` skill 承载细节，`AGENTS.md` 与 `legion-workflow` 承载强制入口，不新增第四种执行模式。
- 物化 task contract。
- 完成 `docs/rfc.md` 与 `docs/review-rfc.md`，review-rfc 结论 PASS，无 blocking findings。
- 新增 `skills/git-worktree-pr/SKILL.md`，定义 hard gate、`.worktrees/<task-id>/` 路径、`origin/master` 默认 base、PR follow-up、completion 与 red flags。
- 更新入口文档、workflow 真源与 references，使 Git lifecycle 明确为包裹三种执行模式的 envelope，而不是第四种模式。
- 更新 `scripts/setup-opencode.ts` 的 `INSTALLED_SKILLS`，确保新增 `git-worktree-pr` skill 会被 install / strict verify 纳入安装资产。
- 完成 `verify-change`，`docs/test-report.md` 记录 `git diff --check`、57/57 targeted consistency assertions、无 workflow CLI script 变更。
- 完成 `review-change`，无 blocking findings，安全视角未触发。
- 完成 `report-walkthrough`，生成 reviewer-facing `report-walkthrough.md` 与 `pr-body.md`。
- 完成 `legion-wiki` writeback，新增 durable pattern 与 task summary。
- 根据后续 review 修正 AIM 忠实度缺口：push 前强制 rebase、completion 不再接受 blocked/kept/skipped、auto-merge/checks watch 更强制、明确禁止 main/master 直推与本地 main/master 开发、补充 repo 内文件系统边界。

### 🟡 进行中

- 无。

### ⚠️ 阻塞/待定

- 无阻塞。用户已明确要求“用 Legion 流程落地”。

---

## 关键文件

- **`skills/git-worktree-pr/SKILL.md`** [completed]
  - 作用: Git / PR lifecycle envelope 的执行真源
  - 备注: 新增 rigid skill
- **`skills/legion-workflow/SKILL.md`** [completed]
  - 作用: Legion 入口门与执行模式真源
  - 备注: 需要接入 Git envelope，但不新增执行模式
- **`AGENTS.md` / `.opencode/agents/legion.md`** [completed]
  - 作用: 仓库级硬入口规则
  - 备注: 需要强制开发任务使用 worktree / PR lifecycle
- **`skills/legion-workflow/references/REF_ENVELOPE.md`** [completed]
  - 作用: task/subagent handoff envelope
  - 备注: 需要增加 git lifecycle state 字段
- **`scripts/setup-opencode.ts`** [completed]
  - 作用: OpenCode 安装资产清单
  - 备注: 已纳入 `git-worktree-pr` skill；未修改 Legion workflow CLI

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 新增 `git-worktree-pr` skill，而不是把 AIM 手册全文塞入 `legion-workflow` | 保持 `legion-workflow` 只负责门禁、模式和阶段真源，避免单 skill 过载 | 复制整份手册进 `legion-workflow` | 2026-04-25 |
| Git lifecycle 是 envelope，不是执行模式 | 现有三种执行模式已经表达交付类型；Git 只表达仓库生命周期 | 新增第四种 “Git 模式” | 2026-04-25 |
| 本仓库默认 base ref 使用 `origin/master` | 用户明确要求 origin/master，且当前仓库 master 是推送目标 | 硬编码 origin/main | 2026-04-25 |

---

## 快速交接

**下次继续从这里开始：**
1. 若继续修改 Git envelope，先读 `docs/rfc.md`、`docs/review-rfc.md` 与 `docs/test-report.md`。
2. 不要新增第四种执行模式；Git lifecycle 只能继续作为 envelope。
3. 若后续涉及真实 PR lifecycle 自动化，再单独设计执行/测试 harness。

**注意事项：**
- 不要新增第四种执行模式。
- 不要修改 CLI 脚本。
- 不要把 “PR created” 写成任务完成。

---

*最后更新: 2026-04-25 by Legion orchestrator*
