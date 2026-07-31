# 变更审查：Legion 单 PR 生命周期硬约束

## 审查范围与独立性

- reviewer：独立实例 `review-change-eager-ferret`；未参与 RFC、实现或验证编写。
- 当前复审范围：task contract、更新后的 RFC、当前完整 diff、新 `test-report` 与三份 raw evidence，以及 Scheduler 的 migration、全部 PR ingress、worker dispatch gate、terminal latch、admin override 和当前规则/文档。
- 只读边界：除本报告外未修改实现、测试、task 三文件、wiki 或 evidence。
- 安全触发器：适用。PR identity 是信任与协议边界，因此复查了 canonical binding、同 task 跨 run migration、terminal 不可逆性和 Git observer。

## 首轮审查历史

首轮结论为 **FAIL**，当时有两个 merge blocker：

1. 单一 legacy PR identity 被无条件回填为 `open`；历史 `done` task 的新 run 因而能越过 worker gate，再次获得 repository side-effect 能力。
2. PR 已 merged 但缺 repo evidence 时，run 被保留为 active `blocked`；当时 Scheduler RFC 还允许旧 task/branch repair 或 override，形成第二 PR 恢复通道。

这两个 finding 是首轮证据的历史记录，不是当前 verdict。当前复审逐项重新读取实现、测试、规范和新 verifier evidence，闭环如下。

## 首轮 Blocker 1 的当前闭环：legacy migration 已 fail closed

- `TaskPrState` 现为 `unknown | open | merged | closed`。fresh task 首次绑定仍为 `open`，因此正常的首个 PR 创建/交付路径不受影响。
- legacy 单一 identity 的状态不再默认 `open`：
  - 任一同 task 历史 run 为 `done` 时回填为 `merged`；
  - 其他无法证明状态的单一 legacy identity 回填为 `unknown`；
  - 多 identity 仍为 `conflicted/unknown`。
- `worker-runner` 只允许 `pr_state === open` 的 binding 启动 repository worker；`unknown`、`merged`、`closed` 与 conflicted binding 均在 launcher、prompt artifact 和 attempt-start side effect 之前拒绝。
- `unknown` 不能由 worker 自证为 open；只有 PR tracker 观察到同一 canonical PR identity 后才能推进为 `open`。替换 identity 继续被 write-once binding 拒绝。
- v5→v6 不是仅有 TypeScript 分支：migration 会实际重建旧 CHECK constraint 表，并将历史 `done` binding 迁为 `merged`、其余歧义记录迁为 `unknown`，同时记录 migration 6。
- 回归覆盖 fresh→open、legacy done→merged 且 launcher 未调用、legacy non-done→unknown 且 launcher 未调用、tracker 观察同一 PR 后才允许继续，以及真实 v5 schema/fixture 重开数据库后的状态与 migration 记录。

结论：首轮反例已不能复现；未知 legacy 状态现在宁可冻结，也不会恢复 PR 配额或启动第二个 repository workflow。

## 首轮 Blocker 2 的当前闭环：post-merge repo 缺口已 terminal non-success

- tracker 观察 merged 后，binding 先进入不可逆 `merged`；若随后发现 repo evidence 缺失，run 现在进入 `terminal_non_success / failed`，不再保持 active `blocked`。
- 该路径会写 failure reason、用户可见 comment 与 final response，释放该 run 的 runtime locks，但不会满足 downstream blocker。
- 恢复说明明确要求创建新的用户 task；旧 task、旧 run、旧 worker 与其单 PR quota 都不能被 repair/retry 恢复。对同 task 再次 dispatch 时，terminal binding 会在 launcher 前拒绝。
- admin override 现在只参与 dependency satisfaction 计算；它不会改变 task binding、run terminal state、worker launch eligibility，也不会恢复或续发 PR quota。
- 当前 Scheduler RFC、delivery/worker/sqlite 说明、contract policy 与 WI-05 已统一为上述语义；根回归也把这些当前真源纳入扫描，并负向禁止旧的 terminal repair 文案。
- tracker 回归覆盖 merged + repo evidence missing：最终 run 为 failed、failure type 正确、locks 已释放、downstream 未解锁、final response/comment 已写入，且同 task retry 不启动 worker。

结论：首轮 active-repair 通道已删除。merged 后若必须改仓库，只能由用户建立新 task；旧 task 本身没有第二 PR 路径。

## Scope、全入口与并发结论

- 改动仍位于 contract 允许的 workflow/PR/docs/wiki/report 规则、Scheduler binding/lifecycle runtime、相应 migration、测试与文档内；未发现无关产品功能扩张。
- `compareAndBindTaskPr()` 以 `(repo_key, task_id)` 为唯一 binding，在共享 `BEGIN IMMEDIATE` transaction 中串行化首次绑定；同一 task 的不同 canonical identity、legacy 多 identity 与并发竞争均 fail closed。
- tracker 显式 URL 在 fetch 前绑定；snapshot URL 在 scheduler event/writeback/state transition 前绑定；worker result 的 `prUrl` 与 PR-shaped external URL 在 result state/writeback 前逐一绑定。未发现绕过 canonical API 写入 `runs.pr_url` 的第二 ingress。
- `merged/closed` terminal state 不可回到 `open`；closed-unmerged 也必须先完成 cleanup/refresh 才能结束生命周期。
- 合同语义是 **0..1（at most one）**：无需仓库变更的 task 可以有 0 个 PR；一旦存在 canonical PR identity，同 task 的任何 run 都只能复用这一 identity，不能取得第二个 PR 配额。
- direct Git observer 继续对 registry/path、fetch、default branch、dirty tree、remote-base equality、merge ancestry 与 command failure fail closed；worker/cache 自报不是完成证据。

## 验证与 provenance 独立重查

- 当前 tracked diff SHA-256 已独立重算并与 `static-audit.txt` 一致：`3e0a0852e00b00d7788be888a62ae19eef4425592df9c5cb461c5dfc1a28b718`。
- 当前 implementation/test 文件哈希与 raw static audit 一致；三份 raw evidence 的命令、退出状态、selected output 与 claim 映射可读，未发现凭据、token 或个人数据。
- 独立执行 `npm --prefix scheduler test`：`73/73` PASS。
- 独立执行 `npm run test:regression`：`48/48` PASS。
- verifier evidence 另覆盖 context audit、package dry-run 与 `git diff --check`，均 PASS；当前复审也确认 diff check 无 whitespace error。
- 首轮 verifier PASS 已被后续失败与修复证据取代；本次只以当前 diff、当前测试报告、当前 raw evidence 和独立复查结果聚合结论。

## Claim 重聚合

### ONE-PR-001

- 状态：`PASS`
- 理由：fresh、legacy done、legacy unknown、多 identity、并发首次绑定、tracker/snapshot/worker ingress、merged/closed terminal、post-merge evidence failure 与 admin override 均保持同 task 的 0..1 canonical PR identity；首轮两个反例已有 runtime、migration、规范与回归四层闭环。
- blocking-policy：`block-merge`
- 置信度：`high`
- 独立性：`high`
- 失效条件：未来新增绕过 `compareAndBindTaskPr()` 的 PR ingress、允许 terminal/unknown binding 重新启动 worker，或让 override 恢复旧 task 的 repository/PR quota 时，必须重新审查。

## 安全与可维护性

canonical task binding、different-identity conflict、terminal latch、same-identity tracker observation 与 snapshot 二次绑定共同保护 PR identity；Git 命令使用参数数组而非 shell 拼接。

非阻塞 hardening 建议：

1. `canonicalizePullRequestUrl()` 当前接受任意 HTTPS host，而默认 client 使用 GitHub API；后续可把 PR host/repo 与配置的 deployment/repository mapping 显式绑定。
2. `observeLocalGitLifecycle()` 后续可增加 task-derived worktree path containment，以及 remote/base/merge SHA 的显式形状校验。

这些是边界收紧建议；当前未发现它们形成 Scheduler 的第二 PR ingress，因此不阻塞本次单 PR lifecycle 变更。

## Blockers

无。首轮两个 blocker 均已关闭，未发现新的 merge blocker。

## Verdict

PASS

## 会话注意力摘要

- **阶段**：`review-change`
- **阶段结论**：`PASS`
- **注意力等级**：`skim`
- **判断变化**：首轮结论为 FAIL；legacy terminal migration 与 post-merge repo-evidence failure 两个 blocker 均已通过 runtime、真实 migration fixture、规范和回归关闭，当前 `ONE-PR-001` 重新聚合为 PASS。
- **关键发现**：
  1. fresh binding 为 `open`；legacy `done` 为 `merged`；其他单一 legacy identity 为 `unknown`，且 tracker 观察同一 PR 前 worker fail closed。
  2. merged 后缺 repo evidence 现为 final non-success：释放 locks、不解锁 downstream、不恢复旧 task/worker/PR quota。
  3. 所有已知 PR ingress 先走 canonical compare-and-bind，terminal latch 与 admin-override-only-dependency 规则在 runtime、测试和当前规范一致。
- **阻塞项**：无。
- **残余风险**：真实 GitHub 状态与本地 Git lifecycle 仍是外部协议边界；未来新增 ingress 或修改 storage/backend 时必须重跑 migration、terminal 与并发负路径。
- **人类动作**：知悉即可，无需干预。
- **自动下一步**：进入 `report-walkthrough`；保持同一 task 只复用现有 canonical PR identity。
- **完整证据**：
  - `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/review-change.md`
  - `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/test-report.md`
  - `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/evidence/test-matrix.txt`
  - `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/evidence/adversarial-probes.txt`
  - `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/evidence/static-audit.txt`
  - `scheduler/src/sqlite-store.ts`
  - `scheduler/src/worker-runner.ts`
  - `scheduler/src/pr-tracker.ts`
  - `scheduler/tests/linear-pr-binding.test.ts`
  - `scheduler/tests/linear-worker-runner.test.ts`
  - `scheduler/tests/linear-pr-tracker.test.ts`
  - `tests/regression/single-pr-lifecycle.test.ts`
