# RFC：撤销 PR 配额，保留无自动 closeout 的流程

> **Profile**: RFC Heavy / Strict
> **Status**: Accepted
> **Owner**: Codex

## Context

上一变更把“不要自动发第二个收口 PR”实现成 `(repo_key, task_id)` 的持久 PR identity 与 `0..1` 数量上限。这改变了用户对多个 PR 的授权边界，并增加了 SQLite migration、worker gate 与恢复语义。用户已明确否定该限制。

## Options

### A. 删除 hard quota/binding，保留 terminal external evidence（选择）

- 删除 task-level PR binding、migration、legacy state 与 worker gate。
- 恢复 run-level `pr_url` 作为 tracking metadata。
- terminal 后不自动写回 task/wiki/report，也不自动创建 closeout/publish-result/deploy-result PR。
- 用户明确要求额外 PR 时允许正常创建。

优点：直接符合用户边界，同时消除旧 closeout 根因。缺点：Scheduler 不再阻止错误 worker 自行创建额外 PR；这应由授权与 workflow 行为管理，而非未经请求的硬配额。

### B. 只改名，不删 runtime binding

拒绝。限制仍存在，只是隐藏术语。

### C. 完整回退到旧 writeback/lifecycle JSON

拒绝。会恢复“merge 后必须改 repo 才能完成”的循环，再次诱发 closeout PR。

## Decision

选择 A。把“自动行为边界”与“用户可授权能力”分开：

- 默认流程不得为了终态状态写回自动创建 PR。
- 当前 open PR 的普通修订继续更新同一 PR。
- 不存在 task 级数字上限、永久 identity 或跨 run PR 禁令。
- 额外 PR 只需要正常的用户授权与任务 scope，不需要突破 quota。

## Runtime design

### SQLite

- 删除 `task_pr_bindings` 表、migration 5/6、相关类型与 API。
- `runs.pr_url` 继续由 `updateRunMetadata()` 维护；不做 task-level compare-and-bind。
- 已升级数据库中的旧表属于可遗留无害 schema：当前 runtime 不读取或写入它，不做 destructive drop migration。

### Worker

- 删除 `taskPrBinding` prompt context、legacy backfill、terminal/unknown dispatch gate 和结果 URL compare-and-bind。
- worker result 恢复把 `prUrl` 写入 run metadata。
- prompt 只规定不得自动为 lifecycle 状态写回创建 closeout PR；不声明数量配额。

### PR tracker

- 恢复从显式 URL 或 `runs.pr_url` 获取 tracking URL，并把 GitHub snapshot URL写回 run metadata。
- 保留 direct Git lifecycle observation，避免 repo-local post-terminal lifecycle JSON。
- 保留 merged 后缺 repo evidence 的 final non-success；该行为只结束当前 run，不形成跨 run/task PR 禁令。

## Normative wording

删除：

- `PR 配额`、`0..1`、`cardinality`
- “首次 identity 永久绑定”
- “replacement/第二 PR 一律 fail closed”
- “新 task 才恢复 PR quota”

保留并改写为：

- 不得自动为 terminal 状态写回创建 closeout/publish-result/deploy-result/wiki-only PR。
- terminal 后的事实只写外部 lifecycle。
- 需要后续仓库改动时停止当前自动 lifecycle，向用户报告并等待明确授权；不预判授权后的 PR 数量。

## Migration / compatibility

- 不删除已存在数据库中的 `task_pr_bindings` 表，避免 destructive migration；runtime 忽略它。
- fresh DB 不再创建该表或记录 migration 5/6。
- 历史任务文档保留，但 Wiki 当前决定标记为 superseded。

## Verification

### NO-QUOTA-001

- 静态扫描当前规范，必须不存在 quota/cardinality/`0..1` 的强制规则。
- 静态/类型检查确保 Scheduler 不引用 `task_pr_bindings`、`TaskPrState`、`compareAndBindTaskPr` 或 `pr-identity.ts`。
- Scheduler 回归证明 PR tracker、repo evidence final non-success 与 direct lifecycle observation仍工作。
- 根回归证明 terminal facts external-only，且只禁止自动 closeout writeback，不禁止显式额外 PR。

结果映射：全部通过为 claim `PASS`、阶段 `PASS`；任一残留 hard restriction 或恢复 lifecycle JSON 为 `FAIL` / `block-merge`。

## Rollback

纠正 PR merge 前可在同一 PR 内恢复遗漏。merge 后如需改变该授权边界，必须由用户重新明确目标；不得再次自行推导 hard quota。
