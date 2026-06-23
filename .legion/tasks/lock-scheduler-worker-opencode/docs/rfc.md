# RFC Amendment: Lock scheduler worker runtime to OpenCode

> **Profile**: design amendment  
> **Status**: Draft for `review-rfc`  
> **Canonical docs**: `docs/linear-legion-scheduler/rfc.md`, `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md`  
> **Created**: 2026-06-23

---

## Decision

首版 Linear + Legion scheduler 的 worker runtime 固定为 OpenCode。

Scheduler 只实现 OpenCode worker launcher：为每个 run 生成 prompt artifact，在目标 repo 上下文中启动 OpenCode 进程 / job，要求 worker 第一动作进入 `legion-workflow`，并通过 result block + GitHub PR state + Legion evidence verifier 共同判定结果。

## Why

- 用户明确要求当前版本不要做多余抽象。
- 多 runtime adapter 会扩大 WI-04 scope，并让“worker 如何启动 Legion workflow”变得不具体。
- LegionMind 当前主要运行接线已有 OpenCode 入口；先锁定 OpenCode 更利于打通 single-WI happy path。

## Changes made

- `docs/linear-legion-scheduler/rfc.md`
  - Executive summary 增加 OpenCode-only worker runtime 决策。
  - Components 从 `Agent Worker Launcher` / `Legion Workflow Adapter` 收敛为 OpenCode worker launcher / contract。
  - `run_attempts.worker_runtime` 改为 constant `opencode` audit field。
  - 新增 `OpenCode worker startup contract`，定义 prompt artifact、repo context、Legion hard gates、result contract。
  - Open questions 不再保留 worker runtime backend 抽象。
- `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md`
  - scope、non-goals、验收、验证全部同步为 OpenCode-only。
- `.legion/wiki/**`
  - task summary 与 pattern 记录 OpenCode-only 结论。

## Non-goals

- 不实现 OpenCode launcher。
- 不写死最终 OpenCode CLI 参数。
- 不设计 OpenClaw / Codex / custom worker backend。
- 不改变 scheduler 四层真源边界或 Legion evidence verifier gate。

## Review questions

- 是否已彻底消除 MVP 多 runtime adapter 误导？
- OpenCode worker startup contract 是否足以回答“worker 怎么启动 Legion workflow”？
- 是否仍保留了必要的防绕过 gate：`legion-workflow`、`git-worktree-pr`、result block、evidence verifier？
- 未来多 runtime 是否被明确隔离为独立 RFC，而不是当前 scope 的隐含扩展？
