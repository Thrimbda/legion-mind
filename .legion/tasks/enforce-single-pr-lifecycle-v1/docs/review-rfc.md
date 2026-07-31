# RFC 复审：Legion 单 PR 生命周期硬约束

## 审查范围

- `.legion/tasks/enforce-single-pr-lifecycle-v1/plan.md`
- `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/rfc.md`

## 独立性

由独立 reviewer `review-rfc-sunny-dolphin` 复审。除本文件外未修改 RFC、plan、log、tasks 或生产文件。

## 上轮 findings closure

### 1. task-level PR identity：已关闭

RFC 6.5 已把 authority 从 run-local `runs.pr_url` 提升为以 `repo_key + task_id` 为主键的 `task_pr_bindings`，并定义：

- `BEGIN IMMEDIATE` 内完成历史 run identity 扫描、首次绑定、幂等比较与冲突冻结；
- 多个 legacy identity 进入不可自行清空的 `conflicted`，不猜测、不重新发放配额；
- terminal 后新 run 仍读取同一 task binding，不能从 null 重新绑定；
- `worker result`、PR tracker CLI 与 GitHub snapshot 在 fetch 后续副作用、event、状态转换或 terminal short-circuit 前通过同一 compare-and-bind 门；
- `updateRunMetadata()` 不再接受 `prUrl`，消除旁路写入口；
- 并发首次绑定由 task 主键和 SQLite write transaction 串行化。

该设计可以实现并通过首次绑定、同 identity 幂等、不同 identity、terminal 后新 run、并发及 legacy conflict 正负测试重算 `0..1` 不变量。

### 2. lifecycle cache 可信度：已关闭

RFC 6.6 不再接受 worker lifecycle 布尔值作为完成输入。Scheduler 在 GitHub identity、terminal、checks/review 之后直接观测：

- worktree registry 已无目标记录；
- canonical `.worktrees/<task-id>/` 路径不存在；
- fetch 成功；
- 主工作区位于默认分支且 `HEAD` 等于 remote base；
- merged PR 的 `merge_commit_sha` 是当前 `HEAD` ancestor。

命令结果、退出码、identity 与 SHA 写 Scheduler event/final response；可选 cache 仅为可重算的 Scheduler audit output。merged 与 closed-unmerged 都必须先通过 cleanup/refresh 观测，缺口保持 `lifecycle_blocked`，因此没有以“移出 Git”换取提前完成。

### 3. pre-merge claim 与 post-terminal protocol：已关闭

plan 与 RFC 10 已把 `ONE-PR-001` 限定为 merge 前可执行的临时 DB/Git、规则扫描及全入口/latch 行为测试；真实 PR merge、cleanup、refresh 不再作为该 claim 的 deferred PASS。

RFC 6.7 另行定义 external terminal protocol 的 trigger、owner、method、stop condition 与 on-pass/on-fail，并在 bound PR merged/closed 时设置不可逆 external-only latch。latch 后 worker dispatch、branch/worktree、commit、push 与 PR create/update 全部 fail closed；只允许同一 task 重试不改仓库的 publish/deploy、cleanup/refresh 与只读验证。需要代码修复或 rollback 时只能由用户明确创建新 task/contract。`done` 仍等待 checks/review 与直接 lifecycle observation，验证循环和 post-terminal worker 重入均已消除。

## Blocking findings

无。

## 非阻塞建议

- plan 仍用 `objective + formal` 描述 `ONE-PR-001`。实现验证前建议规范为单一 `objective`，或拆成 formal 与 objective 两个 claim，以完全贴合认知验证分类；当前 method、证据和状态映射已经明确，不影响设计可实施性。
- plan 验收写“post-merge 失败时原任务终止”，RFC 6.7 允许 `external_action_blocked` 后在 external-only latch 内重试纯外部动作。建议把 plan 收敛为“不得重入仓库修改；需要代码变更时原任务终止”，避免文档读者误解；两种当前表述都已禁止第二 PR，不构成 merge blocker。

## Verdict

PASS

## 会话注意力摘要

- **阶段**: `review-rfc`
- **阶段结论**: `PASS`
- **注意力等级**: `skim`
- **判断变化**: 上轮三项 blocker 均已关闭，RFC 已形成 task-level 单 PR、独立 lifecycle 观测与 external-only terminal 的可实施闭环。
- **关键发现**: `task_pr_bindings` 覆盖 terminal/legacy/concurrency/all-entry；Scheduler 不再信任 cache 自报；pre-merge claim 与真实 terminal protocol 已解耦并锁死 post-terminal worker。
- **阻塞项**: 无。
- **残余风险**: 实现必须保持 compare-and-bind 先于任何外部写回/状态副作用，并完整覆盖 direct lifecycle observer 的负路径。
- **人类动作**: 知悉。
- **自动下一步**: 交回 `legion-workflow`，进入 `engineer`。
- **完整证据**: `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/review-rfc.md`
