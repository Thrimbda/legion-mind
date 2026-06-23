# RFC Review Entry: Linear + Legion 自动调度器

> **Profile**: RFC Heavy / Design-only  
> **Status**: Draft for `review-rfc`  
> **Canonical proposal doc**: [`docs/linear-legion-scheduler/rfc.md`](../../../../docs/linear-legion-scheduler/rfc.md)  
> **Created**: 2026-06-23  
> **Last Updated**: 2026-06-23

---

## Review Scope

本 task-level RFC 文件是 Legion `review-rfc` 的入口。详细总体设计写在仓库文档目录：

- [`docs/linear-legion-scheduler/rfc.md`](../../../../docs/linear-legion-scheduler/rfc.md)
- [`docs/linear-legion-scheduler/index.md`](../../../../docs/linear-legion-scheduler/index.md)
- [`docs/linear-legion-scheduler/work-items/`](../../../../docs/linear-legion-scheduler/work-items/)

`review-rfc` 应审查 canonical proposal doc 与 8 个 WI 文件是否共同满足本任务 contract。

## Decision Summary

采用四层架构：

1. **Linear** 管 WI、项目状态、依赖、优先级、人机协作状态。
2. **Scheduler DB** 管 run、attempt、resource lock、event、webhook dedupe 和幂等。
3. **Legion task docs / workflow** 管每个 WI 的 contract、设计门、实现、验证、review、walkthrough、wiki writeback。
4. **GitHub PR** 管代码交付、checks、review、merge/close 终态。

关键硬边界：Scheduler 不直接改代码、不替代 Legion 阶段链；每个 worker 第一动作必须进入 `legion-workflow`，修改仓库时必须使用 `git-worktree-pr` envelope。

## Review Questions

- Ready algorithm 是否足以避免调度 blocked / contract-unstable / resource-conflicting WI？
- Blocker terminal-satisfied policy 是否明确防止 Linear Done / PR open 错误解锁 downstream？
- Scheduler DB 与 Linear / Legion / GitHub 的真源边界是否清晰？
- Worker prompt / result contract 是否足以强制 Legion 嵌入而不让 scheduler 退化成直接 implementation prompt？
- Scheduler-side Legion evidence verifier 是否足以拒绝“只有 PR URL、缺 Legion 证据”的结果？
- PR lifecycle 是否正确避免“PR created == done”？
- 8 个 WI 是否合理合并，既不太粗也不太细？
- Rollout / rollback / security / observability 是否足以支持后续实现？

## Expected Review Outcome

`review-rfc` 必须给出 PASS 或 FAIL。若 FAIL，blocking findings 必须回写到 `docs/review-rfc.md`，并驱动 canonical RFC / WI 文件迭代，直到 PASS。
