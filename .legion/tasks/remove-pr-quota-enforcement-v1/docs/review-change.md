# 撤销 PR 配额与 task 级硬限制：独立变更复审

## 审查范围

- Contract：`.legion/tasks/remove-pr-quota-enforcement-v1/plan.md`
- Design：`.legion/tasks/remove-pr-quota-enforcement-v1/docs/rfc.md`
- Design review：`.legion/tasks/remove-pr-quota-enforcement-v1/docs/review-rfc.md`
- Verification：`.legion/tasks/remove-pr-quota-enforcement-v1/docs/test-report.md`
- Raw verification output：`.legion/tasks/remove-pr-quota-enforcement-v1/docs/evidence/verification-output.md`
- 历史审查、返修记录：本文件首轮记录、`log.md`、`tasks.md`
- 实际对象：当前工作区完整 tracked diff、所有新增文件与被删除文件
- 独立 reviewer：`review-change-plucky-ferret`；未参与实现或验证

## 首轮审查历史记录（FAIL）

首轮独立审查把 `NO-QUOTA-001` 聚合为 `FAIL / block-merge`，发现两项 P1 blocker。该判断在当时的工作树上正确，现保留为返修 provenance，不作为当前结论。

### [历史 P1] 当前 Scheduler 规范仍要求 terminal PR binding 后 fail closed

首轮定位为 `docs/linear-legion-scheduler/worker-runner.md:103` 与 `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md:121`。当时两处仍要求 task binding conflict、legacy identity backfill、terminal cross-run dispatch gate 与 same-PR recovery，直接违反撤销 hard quota/binding 的 contract。

最小修复方向是删除这些 binding/backfill 要求，改成 run-level metadata、terminal issue 不自动派生 repository closeout，以及明确授权后的正常后续交付。

### [历史 P1] 删除 binding 时误删 worker result 的无状态输入校验

首轮定位为 `scheduler/src/worker-runner.ts:326`、`:332`、`:884`。当时 malformed `prUrl`、`externalUrls: [null]` 与错误字段类型均会被接受；这会让不符合输入契约的数据进入 Scheduler 状态，且与撤销历史 identity 比较无关。

最小修复方向是恢复单个 PR URL 的无状态语法校验和 `externalUrls[]` 元素 shape 校验，不读取历史 URL、不 compare-and-bind、不建立 task identity。

## 当前 findings（按严重度）

### Blocking findings

无。首轮两项 P1 blocker 均已按最小边界修复，没有发现新的 correctness、maintainability、scope 或安全阻塞。

### 非阻塞建议

1. `worker-runner.ts` 与 `pr-tracker.ts` 目前各自维护同一类 stateless HTTPS PR path 语法。当前实现与测试一致，不构成 blocker；若以后扩展允许的 PR URL 形式，可提取一个只做单 URL 校验、明确不含历史比较或 task binding 的 helper，降低规则漂移。

## 首轮 blocker 关闭证据

### 1. 两处当前 Scheduler 文档残留已删除

- `docs/linear-legion-scheduler/worker-runner.md:87` 现在只说明 `runs.pr_url` 是 run-level metadata，明确不存在 task-level compare-and-bind 或 cross-run gate。
- `docs/linear-legion-scheduler/worker-runner.md:103` 现在说明 terminal issue 不自动再次 claim repository closeout，后续改动等待 explicit user authorization。
- `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md:121` 的当前验收项要求 terminal issue 不自动派生 closeout dispatch，同时明确授权的后续 run 可以使用新 PR。
- 对 22 个 current policy surfaces 扫描 `terminal PR binding`、binding conflict、legacy backfill、same-PR recovery、数字配额和 cross-run fail-closed 规则，旧 affirmative 规则命中为 `0`。历史 raw task evidence 与已标记 historical 的 Wiki 快照未被误算为当前规范。

### 2. malformed worker ingress 已恢复 fail-closed

- `scheduler/src/worker-runner.ts:326-341` 对 `prUrl` 做单 URL 的 HTTPS、无 credential、`owner/repo/pull/positive-integer` 语法校验。
- `scheduler/src/worker-runner.ts:345-352` 拒绝非数组 `externalUrls`，以及缺少 string `label` / `url` 的元素。
- `scheduler/src/worker-runner.ts:883-890` 在任何 `runs.pr_url` 写入或结果状态转换前捕获 parser 错误，并把该 attempt 终止为 `unknown_result / malformed_result`。
- `scheduler/tests/linear-worker-runner.test.ts:132-169` 覆盖 malformed `prUrl`、`null` entry、错误字段类型和合法对照。本 reviewer 独立重跑包含这些测试的定向矩阵，结果 `44/44 PASS`。

这些校验只检查当前 worker result 的单次输入。生产 runtime 对 `task_pr_bindings`、`compareAndBindTaskPr`、历史 URL 集合或 task-level PR identity 的引用为零，因此 fail-closed 没有重新引入首轮被撤销的比较/绑定机制。

## 当前 contract 与设计符合性

### 无 quota、永久 identity 或跨 run gate

- `scheduler/src/sqlite-store.ts:245-254` 的核心表不含 `task_pr_bindings`，`:543-546` 只登记 migration `1..4`；binding 类型、API、migration `5/6` 和 `pr-identity.ts` 均已从生产 runtime 删除。
- `scheduler/src/sqlite-store.ts:1088-1119` 仅维护可更新的 run-level `pr_url`。
- `scheduler/tests/linear-pr-tracker.test.ts:128-159` 证明同一 run 的显式 URL与 GitHub snapshot URL都可更新 tracking metadata。
- `scheduler/tests/linear-worker-runner.test.ts:481-589` 证明已有 run URL 不阻止授权后的新 URL，且同一 task 的后续 run 可使用不同 PR；`:596-661` 证明历史 non-success metadata 不形成跨 run dispatch gate。
- 当前规范明确允许用户授权后的新 branch/PR；“当前 open delivery PR 继续更新”只是正常交付默认值，不是数字上限、永久 identity 或不可覆盖授权门。

### terminal no-auto-closeout 根因修复仍成立

- `scheduler/src/worker-runner.ts:275-283` 要求不得仅为 terminal lifecycle facts 自动创建 closeout/publish-result/deploy-result/wiki-only PR，并明确授权可允许新 PR。
- `scheduler/src/scanner.ts:489` 对 terminal issue 返回 `already_terminal`；独立探针结果为 `ready: []`，不会自动派生同 issue closeout run。
- `scheduler/src/pr-tracker.ts:519-524` 在 merged 后缺 evidence 时结束当前自动 delivery run、报告缺口并等待显式授权，不建立后续 PR 禁令。
- `tests/regression/no-auto-closeout-pr.test.ts:37-85` 同时固化“无 quota/binding”“terminal facts external-only”“run-level metadata”和 Wiki supersession。

### legacy DB、交付门与 scope

- `scheduler/tests/linear-scheduler-core.test.ts:62-101` 证明已有旧表、row 和 migration 记录不被删除或改写，runtime health 忽略该表；`:103-118` 证明 fresh DB 不创建旧表或 retired migration。
- `scheduler/tests/linear-pr-tracker.test.ts:161-245` 证明 checks/review、Legion evidence、merged success 与 merged evidence-missing final non-success 语义保留；`:294-335` 证明 closed-unmerged 仍要求 direct cleanup/refresh observation。
- `scheduler/src/pr-tracker.ts:633-645` 保留 tracker 入口的 stateless PR URL parsing；direct Git lifecycle、merge ancestry、evidence gate 与 downstream gate 未被撤销。
- `.legion/tasks/enforce-single-pr-lifecycle-v1/**` 的 tracked diff 为空；旧 raw evidence 保留。`.legion/wiki/tasks/enforce-single-pr-lifecycle-v1.md:6-15` 已标记 `historical` 与 `superseded-by`，当前真相指向本任务。

## 验证充分性重查

`docs/test-report.md` 已按首轮 FAIL 重写并明确登记 `NO-QUOTA-001` 的 claim、方法、反例、原始输出和失效条件。`docs/evidence/verification-output.md` 可从命令、exit code、JSON probe 与源码/test locator 重算：

- 定向首轮 blocker 矩阵：`44/44 PASS`；本 reviewer 另行独立重跑，结果相同。
- Scheduler 全量：`70/70 PASS`。
- root regression：`48/48 PASS`。
- context audit：`failures: []`。
- package dry-run：exit `0`，`entryCount: 64`。
- `git diff --check`：exit `0`。
- current policy/runtime forbidden scan：旧规则与 runtime binding symbol 均为 `0`。

验证覆盖了首轮漏掉的自然语言规范和 malformed ingress 负路径，也覆盖授权后不同 PR 的正路径、fresh/legacy DB、terminal same-issue、checks/review/evidence/direct lifecycle。证据足以把 objective claim `NO-QUOTA-001` 独立聚合为 `PASS`。

## Verifier / authority / 特殊 claim 重查

- 领域 verifier：不适用；该 claim 为 `objective / now / routine`，当前源码、SQLite、Node 测试与 Git diff 足以验证。
- Authority evidence：不适用；结论不依赖外部签署、生产部署或线上平台状态。
- `DEFERRED`：无。
- `RECOMMENDATION`：无验收性判断主张；上面的 helper 提取仅是非阻塞维护建议。
- provenance：verifier locator、技能/reference SHA-256、执行命令、原始输出与 claim 映射均可读且一致；未发现 verifier 擅自改变 risk、method 或 `block-merge` policy。

## 安全视角

适用。OpenCode worker result 是外部执行输出，能够影响 Scheduler run metadata 与状态转换，属于输入进入特权调度路径的信任边界。返修后的 parser 在持久化前拒绝 malformed `prUrl` 与 malformed `externalUrls[]`，同时 result/run/attempt/task identity matching、checks/review/evidence、direct lifecycle 与 downstream gates 均保留。未发现 secret、签名、tenant isolation 或权限扩大问题。

删除 task-level DB hard gate 后，任意失控 worker 不再有数字配额兜底；当前自动路径依靠授权规则、terminal `already_terminal`、external-only 与 final-non-success 语义停止。这是用户明确要求且 RFC 已接受的边界，不是安全 blocker，也不得通过重新建立历史 binding 来“修复”。

## Scope 结论

PASS。实现完整撤销了上一任务扩大加入的 quota/binding 子系统，保留了真正解决自动第二个状态收口 PR 的 external-only/no-auto-closeout 行为；返修只恢复无状态输入校验和删除两个当前文档残留，没有改写历史 raw evidence，也没有削弱交付安全门或扩大到无关模块。

## Verdict

PASS

## 会话注意力摘要

- 阶段：`review-change`
- 阶段结论：`PASS`
- 注意力等级：`skim`
- 判断变化：首轮 `FAIL` 的两项 P1 blocker 已关闭；当前规范残留为零，malformed ingress 在持久化前 fail closed，`NO-QUOTA-001` 重新聚合为 `PASS`。
- 关键发现：
  1. Scheduler 当前文档不再要求 binding/backfill/same-PR recovery，runtime 不再包含数字配额、永久 identity 或跨 run gate，用户明确授权的后续 PR 正路径成立。
  2. malformed `prUrl` 与 `externalUrls[]` 已恢复无状态校验，且未重新引入历史 URL 比较或 task binding。
  3. terminal `already_terminal` / no-auto-closeout、legacy non-destructive DB、checks/review/evidence/direct lifecycle 与 `70/70 + 48/48` 回归保持正确。
- 阻塞项：无。
- 残余风险：未执行真实 GitHub/Linear 线上 E2E；移除 task-level DB gate 后不再兜底任意失控 worker，这是用户要求且 RFC 已接受的授权边界。
- 人类动作：知悉，无需介入。
- 自动下一步：交回 `legion-workflow`，进入 `report-walkthrough` 与当前纠正 PR 的交付 lifecycle。
- 完整证据：`.legion/tasks/remove-pr-quota-enforcement-v1/docs/review-change.md`
