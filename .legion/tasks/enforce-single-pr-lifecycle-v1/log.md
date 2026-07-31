# Legion 单 PR 生命周期硬约束 - 日志

## 会话进展 (2026-07-31)

### ✅ 已完成

- `brainstorm` 已收敛绝对单 PR contract、范围、非目标与关键 claim。
- 首版 Heavy RFC 与现状研究已完成。
- 独立 `review-rfc-sunny-dolphin` 给出 `FAIL / attention:skim`：发现 run-local binding、ignored cache 自证与 merge 前后验证循环三个 blocker。
- RFC 修订后，`review-rfc-sunny-dolphin` 复审为 `PASS / attention:skim`；三项 blocker 全部关闭。
- `engineer-zesty-puffin` 已完成 Scheduler v5 task-level binding、all-ingress compare-and-bind、external-only worker gate、direct Git lifecycle observer 与当前契约文档同步。
- 规则面已统一 `0..1`、`delivery-ready` 与 terminal external-only；设计 continuation、closeout、publish/deploy-result 和 wiki-only 第二 PR 入口已关闭。
- engineer 定向 Scheduler suite 为 70/70 PASS；orchestrator smoke 复跑 Scheduler 70/70、root regression 47/47、context audit 与 `git diff --check` 均 PASS。正式 Verdict 仍由独立 `verify-change` 给出。
- 独立 `verify-change-lively-otter` 给出 `PASS / attention:skim`，但后续 `review-change-eager-ferret` 以独立反例推翻该结论并给出 `FAIL / attention:skim`。
- 定向修复已完成：新 PR 首次绑定为 `open`；legacy `done` 回填为 `merged`，其他单一 legacy identity 回填为 `unknown` 并在 tracker 观察前禁止 worker；v5→v6 migration 已用真实旧 schema 回归覆盖。
- merged 后 `legion_evidence_missing` 现在直接进入 final non-success、释放 run locks、保持 downstream locked，并禁止 original task 的 repository repair；恢复只允许用户明确创建新 task。
- 修复后 orchestrator 全量复跑：Scheduler `73/73`、root regression `48/48`、context audit `failures=[]`、package dry-run `entryCount=64`、`git diff --check` 均 PASS。正式当前 Verdict 仍等待重新执行独立 `verify-change -> review-change`。
- 独立 `verify-change-lively-otter` 已明确作废旧 PASS，并基于当前修复重新给出 `PASS / attention:skim`；真实 v5→v6 migration、legacy worker gate 与 merged missing-evidence final non-success 均有主动反例证据。
- 独立 `review-change` 复审已保留首轮 FAIL 历史并逐项关闭两项 blocker，当前 `ONE-PR-001` 与阶段 Verdict 均为 `PASS / attention:skim`，无 merge blocker。
- `report-walkthrough` 已从单一 `docs/report-data.json` 生成 `report-walkthrough.html`、`report-walkthrough.md` 与 `pr-body.md`；render mode 为 `artifact-only`，本地 HTML 是 reviewer 预览入口，不新增托管或发布链。
- repo task/wiki/report 已固定为 `delivery-ready`；真实唯一 PR、checks/review、merge、cleanup 与主工作区 refresh 将只在外部 lifecycle 观察和最终交接报告。

### 🟡 进行中

- 唯一 PR 外部 lifecycle：commit、rebase、push、唯一 PR、checks/review、squash merge、cleanup 与 refresh。

### ⚠️ 阻塞/待定

- 无 repo-evidence blocker。真实 PR terminal、cleanup 与主工作区 refresh 尚未发生，且不会在 terminal 后写回本日志。

---

## 关键文件

- `scheduler/src/sqlite-store.ts`
- `scheduler/src/pr-tracker.ts`
- `scheduler/src/worker-runner.ts`
- `scheduler/src/git-lifecycle.ts`
- `scheduler/src/pr-identity.ts`
- `tests/regression/single-pr-lifecycle.test.ts`

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 同一 task 最多零或一个 PR，post-merge 禁止仓库写回 | 用户明确要求任何情况下都不得产生第二 PR；旧闭环存在递归收口 | 允许 docs-only closeout PR；拒绝，仍会产生第二 PR且无法自洽 | 2026-07-31 |
| 终态真源分层为 repo-contained evidence 与 external delivery state | 主 PR 无法诚实记录自身未来 merge/cleanup；外部 GitHub/Scheduler 可观测这些事实 | 在主 PR 内预写 completed；拒绝，会伪造未来事实 | 2026-07-31 |
| 历史 artifact 不迁移 | 历史中的双 PR 是已发生事实，批量改写会破坏 provenance | 全仓替换 closeout 文本；拒绝 | 2026-07-31 |
| PR binding 提升到 `repo_key + task_id` 持久层 | run-local `pr_url` 在 terminal 后新 run 中可重置，不能证明 task 级 0..1 | 只让每个 run write-once；首轮 review 判定不充分 | 2026-07-31 |
| cleanup/refresh 由 Scheduler 直接观测 Git 与文件系统 | ignored JSON 仍由同一 worker 自报，不能作为完成门 | 把 lifecycle JSON 移入 `.cache`；首轮 review 判定不可信 | 2026-07-31 |
| merge 前 claim 与 post-terminal protocol 分离 | live merge 事实不能作为自身 merge 前的 block-merge 证据 | 把 live lifecycle 登记成 merge 前 claim；会形成验证循环 | 2026-07-31 |
| 独立 change review 的反例优先于既有 PASS | formal test matrix 未覆盖 legacy terminal migration 和 merged-evidence failure；独立反例直接触及核心不变量 | 沿用 verify PASS；拒绝，证据集合不充分 | 2026-07-31 |
| legacy 状态未知时先冻结 repository worker | 旧 run 非 `done` 不能证明 PR 仍 open；tracker 对同一 identity 的 GitHub 观察才有资格解除 unknown | 默认 open；拒绝，会重开第二 PR 通道 | 2026-07-31 |
| merged 后 repo evidence 缺失是 final non-success | 仓库修复已无法进入原唯一 PR；保持 active repair 会诱导 replacement PR | 原 task blocked 后修旧 branch；拒绝 | 2026-07-31 |

---

## 快速交接

**下次继续从这里开始：**

1. 完成唯一 PR 的外部 lifecycle；terminal 后不得再改仓库。

**注意事项：**

- subagent 不直接改写 .legion 三文件。
- 本任务自身只能创建一个 PR；合并后禁止任何仓库写回。

---

*最后更新: 2026-07-31*
