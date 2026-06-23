# Report Walkthrough

## Profile

rfc-only

## Reviewer Summary

- 本 PR 是设计 amendment，只把 Linear + Legion scheduler 的 worker runtime 明确锁定为 OpenCode，不包含 scheduler 运行时代码。
- RFC 现在要求 scheduler 只实现 OpenCode worker launcher，不做 OpenClaw / Codex / custom runtime adapter。
- RFC 增加了 OpenCode worker startup contract：scheduler 生成 prompt artifact，在目标 repo 上下文启动 OpenCode worker，worker 第一动作进入 `legion-workflow`。
- `review-rfc` 已 PASS，无 blocking findings。

## Scope

In scope:

- `docs/linear-legion-scheduler/rfc.md`
- `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md`
- `.legion/wiki/tasks/linear-legion-scheduler-rfc.md`
- `.legion/wiki/patterns.md`
- `.legion/wiki/log.md`
- `.legion/tasks/lock-scheduler-worker-opencode/**`

Out of scope:

- 不实现 OpenCode launcher。
- 不写死最终 OpenCode CLI 参数。
- 不设计多 runtime adapter。
- 不改变 scheduler 四层真源边界或 Legion evidence verifier gate。

## Evidence Map

| Claim | Evidence | Status |
|---|---|---|
| Task contract 已稳定 | `.legion/tasks/lock-scheduler-worker-opencode/plan.md` | PASS |
| RFC amendment 已完成 | `.legion/tasks/lock-scheduler-worker-opencode/docs/rfc.md` | PASS |
| Canonical RFC 已更新 | `docs/linear-legion-scheduler/rfc.md` | PASS |
| WI-04 已同步 OpenCode-only | `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md` | PASS |
| RFC review 已通过 | `.legion/tasks/lock-scheduler-worker-opencode/docs/review-rfc.md` | PASS |
| 文档验证通过 | `git diff --check`; grep old runtime adapter patterns | PASS |

## What Changed / What Was Decided

- 首版 worker runtime 固定为 OpenCode。
- Scheduler 生成 OpenCode prompt artifact，并在目标 repo 上下文启动 OpenCode worker。
- Worker 的第一动作必须进入 `legion-workflow`；修改仓库时仍必须进入 `git-worktree-pr`。
- 多 runtime 支持被明确移出当前 scope，未来需要独立 RFC。
- 完成 gate 没有放松：仍需要 result block、GitHub PR state 和 Legion evidence verifier。

## Verification / Review Status

- `review-rfc`: PASS。
- `git diff --check`: PASS。
- 搜索旧 runtime adapter 误导性表述：未发现 `opencode / openclaw / codex / custom`、`Agent Worker Launcher`、`Legion Workflow Adapter`、`agent runtime abstraction for every vendor`。

## Risks and Limits

- 这个 PR 只更新设计，不证明 OpenCode launcher 已实现。
- RFC 没有写死 OpenCode CLI 参数，避免承诺未验证命令行；实现 WI 需要用当前 OpenCode CLI 语义锁定命令。
- OpenCode-only 会降低首版复杂度，但未来若要支持其他 runtime，需要单独设计和审查。

## Reviewer Checklist

- [ ] 同意首版 worker runtime 固定为 OpenCode。
- [ ] 同意不做 OpenClaw / Codex / custom runtime adapter。
- [ ] 同意 OpenCode worker startup contract 足以支撑 WI-04 实现。
- [ ] 同意不在本 PR 写死最终 OpenCode CLI 参数。
- [ ] 确认 Legion hard gates 和 evidence verifier 仍保留。

## Final State / Next Stage

- Design amendment review state: PASS。
- 下一步：wiki writeback 后进入 PR lifecycle。
- PR merge 只表示该设计 amendment 获批，不代表 OpenCode launcher 已实现。
