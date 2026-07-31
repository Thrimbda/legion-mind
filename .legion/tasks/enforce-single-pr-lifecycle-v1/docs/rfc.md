# RFC：Legion 单 PR 生命周期硬约束

> **Profile**: RFC Heavy / Strict
> **Status**: Implemented and independently verified
> **Owner**: Codex
> **Created**: 2026-07-31
> **Last Updated**: 2026-07-31

## Executive Summary

- **Problem**：当前 task 完成定义与仓库内终态写回组合后，会产生实现 PR 加 docs-only 收口 PR，并存在无限递归的理论缺口。
- **Decision**：每个 Legion task 拥有不可补充的 `0..1` PR 配额；首次绑定后 PR identity write-once，terminal 后禁止任何 branch、commit、push、PR 或 wiki/task 回写。
- **State split**：仓库只保存截至唯一 PR head 的 `repo evidence state`；GitHub、Scheduler 与最终会话交接保存 `delivery terminal state`。
- **Post-merge**：发布、部署、cleanup、refresh 与结果验证继续执行，但只写外部证据；失败时原 task 终止，不自动创建修复 PR。
- **Scheduler**：新增 `repo_key + task_id` 持久 PR binding；所有 URL 入口先原子 compare-and-bind。cleanup/refresh 由 Scheduler 直接观测 Git 与文件系统，不再相信 worker 自报 JSON。
- **Compatibility**：历史 artifact 不改；恢复旧任务时，一旦发现已有 PR，就不得再创建另一个。
- **Rollback**：唯一 PR merge 前在同一 PR 内回退；merge 后需要仓库改动的回滚只能由用户明确发起新 task。

## 1. Context / Evidence

现行流程要求 merge、checks/review、cleanup 与 refresh 后才能 done，这些门本身合理；问题在于 `log.md` 与 wiki 又被要求跟随 PR lifecycle 更新。唯一 PR merge 后，持久化这些新事实只能再开 PR，于是 `#55 -> #56`、`#50 -> #51` 与 release result PR 成为稳定模式。第二 PR 自己的 terminal 仍无法写进自身，因此该模式没有真正闭环。

当前 Scheduler 虽然每个 run 只有一个 `pr_url` 字段，但它可以被后续 worker result 或 delivery tracking 调用覆盖。其 lifecycle evidence 又位于可提交的 task docs 路径。这两个实现细节都需要与新硬约束一起修正。

证据定位见 `docs/research.md`。

## 2. Goals

- 对一个 Legion `taskId` 强制最多一个 GitHub PR。
- 第一次 PR 绑定后只允许更新同一 open PR；禁止替换、续开或收口 PR。
- 保留现有 checks、review、squash merge、cleanup、refresh 与 terminal success/non-success 门。
- 让发布、部署等 post-merge 操作无需仓库写回也能诚实结束。
- 让手工执行、Autopilot 与 Scheduler 使用相同的状态和失败语义。
- 用回归测试阻止规则或 runtime 再次允许第二 PR。

## 3. Non-goals

- 不重写历史 task、wiki、commit 或 PR。
- 不新增 direct push、bot commit、merge hook 或第二套持久化服务。
- 不把未来用户明确发起的新 task 视为原 task 的第二 PR。
- 不改变 profile、RFC、verification、review 或 walkthrough 的风险分层。
- 不自动修复 post-merge 失败；原 task 必须停止并报告。

## 4. Hard Constraints

- 一个 `taskId` 的 PR cardinality 是 `0..1`，不能通过 profile、label、autopilot、release/deploy 类型或用户沉默降级。
- 任何仓库变更必须在唯一 PR terminal 前进入该 PR。
- PR merged、closed 或 confirmed abandoned 后：
  - 禁止创建新 branch/worktree/commit/push/PR；
  - 禁止为 task/log/wiki/report/publish-result/deploy-result 回写仓库；
  - 仅允许外部观察、发布/部署、cleanup、refresh 与最终报告。
- 不得在唯一 PR 中预写未来的 merged、cleanup、refresh 或发布成功事实。
- branch protection、checks、review 与 squash merge 不得绕过。

## 5. Definitions

- **Task PR budget**：一个 task 可消费的 PR 数量，固定为 `0..1`。
- **Bound PR**：task 首次创建或识别到的唯一 PR。其 owner/repo/number 组成不可变 identity。
- **Repo evidence state**：唯一 PR head 内可复核的 contract、设计、实现、验证、review、walkthrough 与 wiki 状态。
- **Delivery terminal state**：GitHub merged/closed、checks/review、cleanup、refresh 及 post-merge operation 结果。
- **Delivery-ready**：repo evidence 已完成并可进入唯一 PR；不声称 PR 已 merge。
- **New task**：用户之后明确授权、拥有新 task id 与独立 contract 的工作；不是原 task 的自动 continuation。

## 6. Proposed Design

### 6.1 PR identity state machine

```text
unbound
  ├─ no-change / no-PR terminal
  └─ bind exactly one PR ─> bound-open
                            ├─ update same PR while open
                            ├─ merged ─> external-only finalization
                            └─ closed-unmerged ─> terminal non-success
```

禁止 `merged/closed -> bind another PR`。禁止 `bound-open -> different PR`。PR URL 的显示形式可规范化，但 owner/repo/number 必须相同。

### 6.2 Repository evidence semantics

- `plan.md`、RFC、test report、review、walkthrough 与 durable wiki writeback 必须在创建唯一 PR 前准备，或在该 PR open 时继续更新同一 branch。
- PR-backed task 的 task/wiki 状态使用 `delivery-ready` 表示 repo evidence 完成。
- `delivery-ready` 是稳定的 commit-local 状态，不要求 merge 后改成 `completed`。
- `log.md` 记录到“唯一 PR 已绑定/等待 terminal”为止；merge 后不得为 lifecycle 变化追加 commit。
- `completed` 保留给无 PR 即可在仓库快照内完整证明的任务以及历史兼容，不再作为 PR-backed task 的 post-merge 写回目标。

### 6.3 External delivery terminal

- GitHub 是 PR identity、checks、review 与 merged/closed 的真源。
- 当前执行会话负责在 terminal 后清理 worktree并安全 refresh 主工作区，然后在最终回复报告结果。
- Scheduler-managed task 由 Scheduler DB、GitHub snapshot、events、outbox final response 保存 terminal。
- 外部 terminal 证据不反向修改唯一 PR 已合并的树。

### 6.4 Post-merge release/deploy

- 版本、workflow、部署脚本和所有仓库内容必须在唯一 PR 内完成。
- merge 后从锁定 merge SHA 执行 publish/deploy，并验证 registry/runtime。
- 成功结果记录在 GitHub Actions/Deployment、registry/runtime probe、Scheduler/Linear 或最终会话交接。
- 不创建 `publish-result`、`deploy-result`、`closeout`、`wiki-only` PR。
- 若 post-merge 操作失败：
  - 原 task 终态为 blocked/failed；
  - 不自动改代码或开第二 PR；
  - 报告失败证据与恢复条件；
  - 只有用户明确发起新 task 后才允许新 PR。

### 6.5 Task-level durable PR binding

Scheduler 新增 `task_pr_bindings`：

| 字段 | 语义 |
| --- | --- |
| `repo_key + task_id` | 主键；PR 配额 authority |
| `binding_state` | `bound | conflicted` |
| `pr_identity` | canonical `host/owner/repo#number`；conflicted 时为空 |
| `pr_url` | canonical URL；conflicted 时为空 |
| `pr_state` | `unknown | open | merged | closed`；`unknown` 只用于 legacy identity 等待 GitHub 观察 |
| `bound_run_id` | 首次绑定来源，仅作 provenance |
| `conflict_json` | legacy 或并发冲突 identity；非冲突为空 |
| `bound_at / updated_at` | 审计时间 |

唯一原子 API `compareAndBindTaskPr(runId, candidateUrl)` 在 `BEGIN IMMEDIATE` transaction 中：

1. 从 run 得到 `repo_key + task_id`，规范化 candidate identity。
2. 若 binding 不存在，先扫描同一 repo/task 的全部历史 `runs.pr_url`：
   - 0 个 identity：绑定 candidate；
   - 1 个 identity：backfill，并要求 candidate 相同；历史 `done` 可证明 merged，其他 legacy 状态先写 `unknown`，禁止 worker，等待 PR tracker 观察 GitHub 后才能转为 `open|merged|closed`；
   - 多个 identity：写 `conflicted`，冻结配额。
3. 已有 `bound` 且 identity 相同：幂等返回；不同：`pr_identity_conflict`。
4. 已有 `conflicted`：始终 fail closed，不能用新 run 清空。
5. 只有该 API 可以更新 `runs.pr_url`；通用 `updateRunMetadata()` 不再接受 `prUrl`。

worker result、PR tracker CLI 与 GitHub snapshot 必须在 fetch、external URL writeback、event、状态转换或 terminal short-circuit之前调用同一 binding API。并发首次绑定由 task 主键和 `BEGIN IMMEDIATE` 串行化。

`unknown` 不是可写仓库状态：worker dispatch 必须 fail closed。只有 PR tracker 读取同一 bound identity 的 GitHub snapshot 后，才能把它转为 `open|merged|closed`；一旦进入 merged/closed 仍不可逆。

### 6.6 Direct lifecycle observation

GitHub tracker 继续独立验证 PR identity、merged/closed、checks 与 review。随后由 Scheduler 直接执行或观察本地 lifecycle，而不是读取 worker 生成的布尔文件：

1. 根据 repo root 与固定 `.worktrees/<task-id>/` 得到 canonical task worktree。
2. 运行 `git worktree list --porcelain`，确认该 worktree 不再登记。
3. 确认 canonical worktree path 不存在。
4. 从配置的 `remote/branch` 执行 fetch。
5. 确认主工作区位于本地默认分支，`HEAD` 等于 fetch 后 remote base。
6. 对 merged PR，确认 GitHub `merge_commit_sha` 是当前 `HEAD` 的 ancestor。

命令、退出码、task/PR identity、merge/base/local SHA 与时间写入 Scheduler event/final response；可选 cache 只能是 Scheduler 派生的 audit output，丢失可重算，不能作为输入。路径仍登记、目录仍存在、fetch 失败、dirty/diverged 导致未 refresh、branch/base/merge ancestry 不符均返回 `lifecycle_blocked`。

closed-unmerged 也必须先通过 cleanup/refresh 观测，再进入 terminal non-success；在此之前不释放 task success/downstream，且不允许 worker 重新进入仓库修改。

### 6.7 External-only latch and post-terminal protocol

一旦 GitHub 观测到 bound PR `merged` 或 `closed`，binding 的 `pr_state` 不可逆进入 terminal，并设置 external-only latch：

- worker dispatch、branch/worktree 创建、commit、push、PR create/update 一律 fail closed；
- 同一 task 只允许重试纯外部 publish/deploy、cleanup/refresh 与只读验证；
- cleanup/refresh 缺口保持 `lifecycle_blocked`，由 lifecycle observer 重试，不能重新派生 engineer；
- merged/closed 后发现缺失或失效的 repo evidence 时，run 进入 terminal non-success、释放 runtime locks且不满足 downstream；不得修复旧 branch，恢复条件只能是用户明确创建新 task；
- publish/deploy 失败使用 `external_action_blocked`；只允许同一不改仓库的外部动作重试；
- 需要代码修复或回滚时，原 task 进入 terminal non-success；只有用户明确创建新 task/contract 才可修改仓库。

本 task 的真实 terminal protocol：

- **trigger**：唯一 PR merged/closed。
- **owner**：当前 orchestrator；Scheduler-managed run 则为 Scheduler lifecycle tracker。
- **method**：GitHub PR/check/review snapshot + 上述本地 Git/worktree 直接观测 + 适用的 publish/deploy probe。
- **stop condition**：任何 identity 冲突、cleanup/refresh 失败或外部动作要求仓库修改。
- **on pass**：外部 final response 报告 terminal success，不写仓库。
- **on fail**：外部 final response 报告 blocker/non-success 与恢复条件，不写仓库、不开第二 PR。

这不是 merge 前 claim 的 deferred PASS，也不反写 `ONE-PR-001`。

### 6.8 Resume and migration

- 历史 task/wiki 文件保持原样。
- 恢复时以 `task_pr_bindings` 为 authority；无 binding 时按历史 run URL 回填。
- 一个历史 identity：历史 `done` 回填为 `merged`；其他状态回填为 `unknown` 并禁止 worker，直到 tracker 对同一 identity 重新观察 GitHub。观察为 open 才可继续同一 PR，观察为 terminal 则只做 external-only finalization。
- 多个历史 identity、GitHub 与 DB identity 不一致、或无法消歧：写 `conflicted` 并冻结配额；报告人工新 task 迁移需要，不自动选一个。
- 没有历史 identity：仍可消费唯一 PR 配额。
- 已经发生双 PR 的历史 task 只作为 provenance，不据此允许继续双 PR。

## 7. Alternatives

### Option A：单 PR + 外部 terminal（选择）

- 优点：满足绝对单 PR；不伪造未来事实；保留 GitHub/Scheduler 终态与安全门；消除递归。
- 缺点：repo 内 task/wiki 不再镜像 merge 后状态，读者需要查 GitHub/Scheduler。

### Option B：在唯一 PR 内预写 completed/merged

- 优点：仓库文件看起来完整。
- 缺点：在事实发生前写入成功状态；checks 失败、PR 关闭或 publish 失败时产生错误真相。
- 结论：拒绝。

### Option C：merge 后 bot/direct push 或 docs-only PR

- 优点：仓库内可以追上 terminal。
- 缺点：direct push 绕过保护；docs-only PR 明确违反用户约束且继续递归。
- 结论：拒绝。

### Option D：允许 release/deploy 例外

- 优点：延续既有 publish-result 记录。
- 缺点：“例外”会重新成为默认第二 PR 通道，无法满足任何情况下不得第二 PR。
- 结论：拒绝。

## 8. Decision

选择 Option A。取舍是：仓库保存可在 commit 时诚实证明的事实，外部系统保存只能在 merge 后观察的事实。放弃“repo 文件必须镜像所有 delivery terminal”这一旧目标，以换取严格单 PR、无递归且不伪造状态的闭环。

## 9. Milestones

1. **规则面**
   - 更新入口、workflow、PR envelope、Autopilot、docs/wiki/report 规则。
   - 验收：当前真源明确 `0..1`、write-once、terminal 后 external-only。
2. **Scheduler 面**
   - task-level PR identity 原子绑定、terminal latch 与直接 lifecycle observer。
   - 验收：跨 terminal run/并发仍只有一个 identity；GitHub 与 cleanup/refresh 门由独立观测保留。
3. **回归与交付**
   - 增加静态与行为回归，完成独立验证/review，并只创建一个 PR。
   - 验收：唯一 PR terminal 后无仓库写回。

## 10. Verification

### ONE-PR-001

- **正向方法**
  - 静态扫描当前 skill/README/AGENTS/wiki 真源，确认单 PR 与 external-only 规则一致。
  - Scheduler 临时 DB 测试：首次绑定成功；同 identity 幂等；不同 identity、terminal 后新 run、并发绑定与 legacy 多 identity 均 fail closed；legacy `done` 直接 merged，legacy ambiguous 先 unknown 且必须经 tracker 观察才能恢复 open。
  - Scheduler 临时 Git repo 测试：merged/checks/review、worktree registry/path、fetch、default branch、remote base 与 merge ancestry 任一缺口都会阻塞完成。
  - worker/tracker 测试：所有 URL 写入口都调用 task binding；terminal latch 拒绝新 worker/branch/PR 路径。
- **失败路径**
  - 发现当前规则仍允许 closeout/publish-result/wiki-only 第二 PR；
  - 同一 repo/task 可通过新 run、并发或不同入口绑定第二 identity；
  - terminal 后仍要求 task/wiki 回写；
  - 移除或绕过 checks/review/cleanup/refresh 任一完成门。
- **状态映射**
  - 全部正向通过且失败路径被阻止：claim `PASS`，阶段可 `PASS`。
  - 任一失败：claim `FAIL`，`block-merge`，阶段 `FAIL`。
- **Owner**：独立 `verify-change`。

### Test matrix

- `npm run test:regression`
- `npm --prefix scheduler test`
- `npm run audit:context`
- `npm run pack:dry-run`
- `git diff --check`
- 当前规则负向扫描
- 临时 DB/Git 正负路径

真实唯一 PR 的 merge、cleanup、refresh 与无第二 PR结果在本 task 的 external terminal protocol 中观察并报告；它不参与 merge 前 `ONE-PR-001` Verdict，避免循环。

## 11. Rollout / Migration / Rollback

- Scheduler 增加 migration v5 `task_pr_bindings`；启动时从历史 run URL 懒回填，多 identity 冲突冻结，单 identity 的不确定 lifecycle 写 `unknown` 等待 GitHub 观察，不猜测为 open。
- 安装面的 skill 文件由现有 `lgmind` package surface 分发，不新增配置。
- merge 前发现问题：在同一 branch/PR 内修订或回滚。
- merge 后发现问题：原 task 不得开第二 PR；报告问题，由用户明确创建新 task 决定是否回滚。
- migration 回滚仅在唯一 PR merge 前通过同一 PR 完成；merge 后不自动降级到 run-local binding。

## 12. Observability

- 手工流：最终回复给出 taskId、唯一 PR URL/state、checks/review、cleanup、refresh 与 post-merge operation 结果。
- Scheduler：保留 `pr_snapshot_observed`、`pr_identity_bound`、`pr_identity_conflict`、`local_lifecycle_observed`、terminal event、final response 与 task binding。
- repo task/wiki 只表示 `delivery-ready` evidence snapshot，不作为实时 GitHub 状态面。
- 负向指标：同一 task 观察到第二 PR identity 时立即 fail closed，不静默替换。

## 13. Security / Safety

- 不新增 direct-push 或 bypass 通道。
- 不允许通过更换 URL 绕过失败 review/checks。
- PR identity 由 GitHub owner/repo/number 绑定；显示 URL 规范化不得改变 identity。
- 不接受 worker 自报 lifecycle 布尔值作为完成证据；GitHub 与本地 Git/filesystem 分别直接观测。
- Git 命令只对 contract 绑定的 repo、base 与固定 worktree path运行；不 reset、不覆盖 dirty/diverged workspace。

## 14. Open Questions

无阻塞问题。

## 15. Implementation Notes

- 规则面：`AGENTS.md`、`README.md`、`skills/legion-workflow/**`、`skills/git-worktree-pr/**`、`skills/legion-docs/**`、`skills/legion-wiki/**`、`skills/report-walkthrough/**`。
- Runtime：新增共享 PR identity / local lifecycle 模块，修改 `scheduler/src/sqlite-store.ts`、`scheduler/src/worker-runner.ts`、`scheduler/src/pr-tracker.ts` 与对应 tests/docs。
- Durable truth：`.legion/wiki/decisions.md`、`.legion/wiki/patterns.md`、本 task summary/index/log。
- 历史 `.legion/tasks/**` 与旧 wiki task pages 不做全仓替换。

## 16. References

- Plan：`.legion/tasks/enforce-single-pr-lifecycle-v1/plan.md`
- Research：`.legion/tasks/enforce-single-pr-lifecycle-v1/docs/research.md`
- Current lifecycle：`skills/git-worktree-pr/SKILL.md`
- Scheduler：`scheduler/src/worker-runner.ts`、`scheduler/src/pr-tracker.ts`
