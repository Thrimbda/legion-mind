# Linear + Legion Scheduler RFC and Work Items - 日志

## 会话进展 (2026-06-23)

### ✅ 已完成
- 用户确认 Linear + Legion scheduler 方向，并要求使用 Legion workflow 完成设计任务。
- 按入口规则加载 `legion-workflow`、`brainstorm`、`legion-docs` 与 `git-worktree-pr`。
- 选择 taskId：`linear-legion-scheduler-rfc`。
- 在主工作区执行 `git fetch origin`，从 `origin/master` 创建 worktree：`.worktrees/linear-legion-scheduler-rfc/`，分支：`legion/linear-legion-scheduler-rfc-scheduler-design`。
- 物化任务契约：`plan.md`、`tasks.md`、`log.md`。
- 写入现状摸底：`.legion/tasks/linear-legion-scheduler-rfc/docs/research.md`。
- 写入总体 RFC：`docs/linear-legion-scheduler/rfc.md` 与 task-level review entry `.legion/tasks/linear-legion-scheduler-rfc/docs/rfc.md`。
- 将原 20 个 WI 合并为 8 个，并写入 `docs/linear-legion-scheduler/work-items/`。
- 写入 reviewer 入口：`docs/linear-legion-scheduler/index.md`。
- 执行第一轮 `review-rfc`：FAIL，发现 blocker terminal gate、contract eligibility、Legion evidence verifier 三个 blocking gaps。
- 迭代 RFC / WI：补充 `isBlockerSatisfied()`、统一 MVP `contract:stable`、新增 scheduler-side Legion evidence verifier、transactional outbox。
- 执行第二轮 `review-rfc`：PASS。并处理非阻塞建议：PR state 表、run fields、WI-02 outbox。
- 生成 `report-walkthrough`：Markdown、HTML、PR body。
- 执行 `legion-wiki` writeback：新增 task summary，更新 wiki index、patterns、log。
- 运行验证：`git diff --check` 通过；`docs/linear-legion-scheduler/work-items/` 下 WI 文件数量为 8。

### 🟡 进行中
- 准备提交、rebase、push、创建 PR 并跟进 PR lifecycle。

### ⚠️ 阻塞/待定
- 暂无阻塞。

---

## 关键文件

**`.legion/tasks/linear-legion-scheduler-rfc/plan.md`** [created]
- 作用: 本任务 contract 与 scope 真源。

**`.legion/tasks/linear-legion-scheduler-rfc/docs/rfc.md`** [created]
- 作用: Legion `review-rfc` 审查入口。

**`docs/linear-legion-scheduler/rfc.md`** [created]
- 作用: 用户要求的总体 RFC 文档。

**`docs/linear-legion-scheduler/work-items/*.md`** [created]
- 作用: 合并后的实现 WI 文件，每个 WI 一个文件。

**`.legion/tasks/linear-legion-scheduler-rfc/docs/review-rfc.md`** [PASS]
- 作用: RFC 审查证据，记录第一轮 FAIL、修改和第二轮 PASS。

**`.legion/tasks/linear-legion-scheduler-rfc/docs/report-walkthrough.html`** [created]
- 作用: HTML-first reviewer artifact；当前 render handoff blocked until PR exists。

**`.legion/wiki/tasks/linear-legion-scheduler-rfc.md`** [created]
- 作用: wiki task summary。

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 采用重型仅设计模式 | 任务要求总体 RFC 与 review-rfc 通过，且不要求实现运行时代码 | 默认实现模式 | 2026-06-23 |
| 在 `docs/linear-legion-scheduler/` 新增 proposal 目录 | 用户明确要求写入 docs 子目录；同时避免影响 README 当前真源叙事 | 只写 `.legion/tasks/**` | 2026-06-23 |
| WI 合并为 8 个 | 比 20 个更适合 milestone 级交付，又不会粗到无法验收 | 5 个超粗 milestone 或 10 个上限 | 2026-06-23 |

---

## 快速交接

**下次继续从这里开始：**
1. commit scope 内变更。
2. push 前执行 `git fetch origin && git rebase origin/master`。
3. push branch、创建 PR，尝试 auto-merge 并跟进 checks/review。

**注意事项：**
- 不要在主工作区改文件；所有写入都应保持在 `.worktrees/linear-legion-scheduler-rfc/`。
- 本任务是设计交付，不要实现 scheduler 代码。

---
*Updated: 2026-06-23 00:00*
