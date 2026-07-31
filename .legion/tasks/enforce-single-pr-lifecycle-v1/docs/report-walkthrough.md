# Legion 单 PR 生命周期硬约束：交付审阅指南


## 交付视角与结论

- 交付类型：`implementation`
- Workflow profile：`strict`
- 风险：`high`
- 阶段结论：`PASS`
- 审查状态：`PASS`
- 最终状态：contract、RFC、实现、独立验证、独立审查、durable wiki 与 reviewer artifact 已在仓库内达到 delivery\-ready；唯一 PR lifecycle 尚未完成

Legion 当前规则面与 Scheduler runtime 已统一为 task 级 0\.\.1 PR：首次 identity write\-once，所有修订留在同一 open PR；terminal 后只允许外部动作、只读验证、cleanup、refresh 与最终报告。Scheduler 对 fresh、legacy、并发、全 URL ingress 与 post\-merge missing\-evidence 路径 fail closed。首轮独立 review 发现的两个 blocker 已修复，重新验证为 Scheduler 73/73、根回归 48/48，并经独立 change review PASS。

## 人类注意力与当前动作

- 聚合注意力：`skim`
- 当前唯一人类动作：知悉即可，无需介入。
- lifecycle 边界：允许继续同一 task 的 commit、rebase、push、唯一 PR、checks/review、merge、cleanup 与主工作区刷新；PR terminal 后禁止任何仓库写回或第二 PR。
- 停止点：允许继续同一 task 的 commit、rebase、push、唯一 PR、checks/review、merge、cleanup 与主工作区刷新；PR terminal 后禁止任何仓库写回或第二 PR。
- 摘要：旧双 PR 根因与两条 runtime 恢复旁路均已关闭；需知悉真实 GitHub terminal、cleanup 与主工作区 refresh 仍是本报告之后的外部 lifecycle。
- 证据：\.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/test\-report\.md、\.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/review\-change\.md


## 未解决的认知状态

当前证据未登记需要单独聚合的未解决 claim。

## 领域验证摘要

当前证据未登记领域或权威 verifier。

## 范围

### 范围内

- AGENTS、README 与 Legion workflow、worktree、docs、wiki、report 当前规则面
- Scheduler task\-level PR identity binding、legacy migration 与 external\-only worker gate
- Scheduler 对 GitHub PR、repo evidence 和本地 Git/worktree lifecycle 的直接观测
- 根规则回归、Scheduler migration/state\-machine 回归、context audit 与 package dry\-run
- 本任务 contract、RFC、独立验证/审查、walkthrough 与 durable wiki writeback

### 范围外

- 改写历史 task/wiki/PR 事实
- 新增 GitHub bot、direct push、merge hook 或第二套持久化服务
- 取消 branch protection、checks、review、squash merge、worktree isolation 或安全 refresh
- 禁止用户未来明确创建的新 task 使用其独立的 0\.\.1 PR 配额

## 证据地图

| 证据 | 类型 | 状态 | locator |
| --- | --- | --- | --- |
| 单 PR 任务 contract | plan | PASS | \.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/plan\.md |
| 单 PR 状态机与迁移设计 | rfc | PASS | \.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/rfc\.md |
| 独立 RFC 审查 | review\-rfc | PASS | \.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/review\-rfc\.md |
| 修复后独立验证报告 | test\-report | PASS | \.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/test\-report\.md |
| 保留首轮 FAIL 历史的最终独立变更审查 | review\-change | PASS | \.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/review\-change\.md |

## 交付路径

1. 确认旧流程把 PR terminal 后的 task/wiki 写回当作完成条件，导致实现 PR 后再开 docs\-only closeout PR
2. 收敛 task 级 0\.\.1 PR、repo delivery\-ready 与 external delivery terminal 的 Heavy RFC，并通过独立 review\-rfc
3. 统一 Legion 当前规则、模板与 durable wiki，删除 design continuation、closeout、publish/deploy\-result 和 wiki\-only 例外
4. 实现 Scheduler task\-level 原子 binding、legacy unknown/merged migration、全 ingress compare\-and\-bind、terminal worker latch 与 direct Git lifecycle observer
5. 首轮 verify PASS 后由独立 change review 找出 legacy terminal migration 与 merged missing\-evidence 两个 blocker，定向修复并增加真实迁移/反例回归
6. 重新执行独立 verification 与 change review，当前均 PASS；仓库证据固定为 delivery\-ready 后进入唯一 PR lifecycle

## 变更与决定

- 每个 task 的 PR cardinality 固定为 0\.\.1；首次 host/owner/repo/number identity 不可替换，任何修订只能更新同一 open PR。
- PR terminal 后禁止 branch/worktree 写入、commit、push、PR create/update 与 task/wiki/report 写回；纯外部 publish/deploy、只读验证、cleanup、refresh 和最终报告仍可执行。
- PR\-backed repo artifact 使用 delivery\-ready，不再要求 merge 后追写 completed；GitHub、Scheduler 与最终交接保存 terminal 事实。
- Scheduler 新增 task\_pr\_bindings 与原子 compare\-and\-bind；fresh 为 open，历史 done 为 merged，其他单一 legacy identity 为 unknown，多 identity 冲突冻结。
- unknown、merged、closed 与 conflicted binding 在 launcher 前拒绝 repository worker；只有 tracker 对同一 canonical PR 的观察可把 unknown 推进为 open。
- merged 后缺 repo evidence 直接 final non\-success：释放 run locks、不满足 downstream、不恢复 original task/worker/PR quota；恢复必须由用户创建新 task。
- worker 自报 lifecycle JSON 退出完成门，Scheduler 直接观察 worktree registry/path、fetch、默认分支、dirty state、remote base 与 merge ancestry。

## 验证与审查状态

| 检查 | 状态 | 证据 |
| --- | --- | --- |
| Scheduler unit/integration 73/73 | PASS | \.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/evidence/test\-matrix\.txt |
| 根回归 48/48，含当前规则面与 terminal repair 负向扫描 | PASS | \.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/evidence/test\-matrix\.txt |
| 真实 v5→v6 migration、legacy worker gate 与 merged missing\-evidence 主动反例 | PASS | \.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/evidence/adversarial\-probes\.txt |
| context audit、package dry\-run 64 entries 与 patch hygiene | PASS | \.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/evidence/test\-matrix\.txt |
| 独立 RFC review 与保留首轮 FAIL 历史的最终 change review | PASS | \.legion/tasks/enforce\-single\-pr\-lifecycle\-v1/docs/review\-change\.md |

## 风险与限制

- 未来新增 PR URL ingress、替换持久层或放宽 worker terminal gate，可能绕过当前 task\-level binding。；缓解：所有当前 ingress 共用 compare\-and\-bind，根与 Scheduler 回归锁定 legacy、并发、terminal 和 override 负路径；相关架构变化必须重验。
- 默认 GitHub client 与可接受 PR host/repo mapping、task\-derived worktree path containment 仍可进一步显式收紧。；缓解：当前 URL canonicalization、参数数组 Git 调用、固定 task binding 与 lifecycle 负路径未发现第二 PR ingress；独立 review 将其保留为非阻塞 hardening。
- 真实 PR terminal、branch protection、cleanup 与主工作区 refresh 尚未在当前仓库快照发生。；缓解：它们属于本报告后的外部 lifecycle；终态后只读观察和报告，不重渲染 artifact、不回写仓库、不开第二 PR。

## 审阅清单

- [ ] 确认 contract 是 at most one（0\.\.1），无变更任务不被强迫创建 PR。
- [ ] 确认 fresh=open、legacy done=merged、legacy ambiguous=unknown，且 unknown/terminal 在 launcher 前 fail closed。
- [ ] 确认 merged missing\-evidence 是 final non\-success，释放 locks 但不解锁 downstream，也不恢复 original\-task PR quota。
- [ ] 确认 AGENTS、workflow、worktree、docs、wiki、report 与 Scheduler 当前文档不再授权 closeout 或 terminal repair PR。
- [ ] 确认 checks、review、squash、cleanup、refresh 门仍保留，worker 自报 lifecycle 不构成完成证据。
- [ ] 确认本报告只声明 delivery\-ready，不声明唯一 PR 已创建、checks 已通过、已合并、worktree 已清理或主工作区已刷新。

## 渲染交接

- PR-backed：是
- 状态：`artifact-only`
- 说明：不新增 HTML 托管或第二 PR 链路；reviewer 通过唯一 PR 中的 HTML/Markdown artifact 和同一 JSON 生成的 PR body 审阅。

## 最终状态与下一阶段

- 当前状态：contract、RFC、实现、独立验证、独立审查、durable wiki 与 reviewer artifact 已在仓库内达到 delivery\-ready；唯一 PR lifecycle 尚未完成
- 下一阶段：完成 commit、fetch/rebase、push、创建或复用唯一 PR、checks/review、squash merge、worktree cleanup 与主工作区 refresh；terminal 后不再修改仓库
- lifecycle 声明：本报告只证明当前工作树的 repo evidence 已准备，不证明 PR 已创建、checks/review 已满足、PR 已合并/关闭、worktree 已清理或主工作区已刷新；这些事实只在外部 lifecycle 与最终交接中记录。
