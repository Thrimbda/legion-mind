# 撤销 PR 配额，保留无自动 closeout 边界：交付审阅指南


## 交付视角与结论

- 交付类型：`implementation`
- Workflow profile：`strict`
- 风险：`high`
- 阶段结论：`PASS`
- 审查状态：`PASS`
- 最终状态：contract、RFC、实现、首轮 FAIL 返修、新的独立验证与复审、durable Wiki 均已达到 delivery\-ready；纠正 PR lifecycle 尚未完成。

Legion 当前规则与 Scheduler runtime 已撤销 task 级 PR 配额、永久 identity、migration 5/6 和跨 run dispatch gate；PR URL 仅是可更新的 run metadata。真正保留的边界是 terminal lifecycle 事实不反写仓库、自动流程不创建 closeout/status\-writeback PR，用户明确授权后仍可使用新的 branch/PR。首轮独立审查发现两处旧 binding 文档残留和 worker ingress 校验回退；最小返修后 malformed 输入重新 fail closed，独立验证与复审均为 PASS。

## 人类注意力与当前动作

- 聚合注意力：`skim`
- 当前唯一人类动作：快速浏览授权边界、首轮 blocker 修复和验证摘要；无需做新的决定。
- lifecycle 边界：本报告只证明当前 repo evidence 为 delivery\-ready；仍需完成纠正 PR 的 checks、review、merge、worktree cleanup 与主工作区刷新，terminal 事实不再反写仓库。
- 停止点：本报告只证明当前 repo evidence 为 delivery\-ready；仍需完成纠正 PR 的 checks、review、merge、worktree cleanup 与主工作区刷新，terminal 事实不再反写仓库。
- 摘要：错误的 hard quota/binding 已完整撤销，首轮两个 P1 blocker 已关闭；当前没有未决 claim 或 merge blocker。
- 证据：\.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/test\-report\.md、\.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/review\-change\.md


## 未解决的认知状态

当前证据未登记需要单独聚合的未解决 claim。

## 领域验证摘要

当前证据未登记领域或权威 verifier。

## 范围

### 范围内

- AGENTS、README 与 Legion workflow/worktree/docs/wiki/report 当前规则
- Scheduler SQLite、worker、PR tracker 的 task\-level binding/quota 撤销
- run\-level PR tracking metadata 与明确授权的后续 PR 正路径
- terminal external\-only/no\-auto\-closeout 行为与 same\-issue already\_terminal 门
- worker result 的无状态 PR URL 与 externalUrls shape 输入校验
- fresh/legacy DB、交付安全门、根回归、Wiki supersession 与任务证据

### 范围外

- 限制用户明确授权的额外 PR 或后续修复 PR
- 破坏性删除已升级数据库中的 legacy task\_pr\_bindings 表或历史 rows
- 恢复 post\-terminal task/wiki/report 状态写回要求
- 改变 branch protection、checks、review、squash、worktree isolation 或安全 refresh
- 真实 GitHub/Linear 线上部署与 production E2E

## 证据地图

| 证据 | 类型 | 状态 | locator |
| --- | --- | --- | --- |
| 撤销 hard quota 的任务 contract | plan | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/plan\.md |
| 无 quota、无自动 closeout 的 Strict RFC | rfc | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/rfc\.md |
| 独立 RFC 审查 | review\-rfc | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/review\-rfc\.md |
| 返修后独立验证报告 | test\-report | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/test\-report\.md |
| 保留首轮 FAIL 历史的最终独立变更复审 | review\-change | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/review\-change\.md |

## 交付路径

1. 确认上一变更把禁止自动 status\-only closeout PR 错误扩大为 task 级 0\.\.1 PR 配额与永久 identity
2. 收敛 Strict RFC：删除 hard quota/binding，同时保留 terminal 事实外部化和用户明确授权边界
3. 删除 Scheduler binding schema、migration、API、worker gate 与 tracker compare\-and\-bind，并同步当前规范和 Wiki
4. 首轮独立验证通过后，独立 change review 正确发现两个 P1：当前文档残留旧 gate、worker ingress 校验被误删
5. 最小删除旧 binding/backfill 文本，恢复单次 PR URL 与 externalUrls shape 校验并补主动反例
6. 新的独立验证与变更复审均为 PASS，随后从单一 report\-data\.json 生成 walkthrough 并进入纠正 PR lifecycle

## 变更与决定

- 当前规则不再定义 PR 配额、0\.\.1 cardinality、首次永久 identity、replacement 禁令或跨 run fail\-closed gate；当前 open PR 的默认复用只是普通交付行为。
- Scheduler 删除 task\_pr\_bindings 的 fresh schema、migration 5/6、binding 类型/API、legacy backfill、worker dispatch latch 与 tracker compare\-and\-bind；runs\.pr\_url 恢复为可更新的 run metadata。
- fresh DB 只登记 migration 1\.\.4；legacy DB 的旧表、row 和 migration 记录不被删除或改写，但当前 runtime 完全忽略。
- terminal merge/checks/cleanup/refresh/publish/deploy 事实只进入外部 lifecycle 与最终交接；same terminal issue 不会被自动重新 claim 为 closeout run。
- merged 后缺 repo evidence 仍结束当前自动 run 并等待用户授权；checks/review/evidence、direct Git lifecycle、downstream 与安全 refresh 门保持不变。
- 返修恢复 worker result 的无状态 HTTPS pull\-request URL 校验和 externalUrls 元素 shape 校验；校验不读取历史 URL，也不建立 task identity。

## 验证与审查状态

| 检查 | 状态 | 证据 |
| --- | --- | --- |
| 返修后首轮 blocker 定向矩阵 44/44 | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/evidence/verification\-output\.md |
| malformed prUrl/externalUrls fail closed，合法 run URL 更新与授权后续 PR 正路径通过 | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/test\-report\.md |
| Scheduler 全量测试 70/70 | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/evidence/verification\-output\.md |
| 根回归 48/48，含无 quota、无自动 closeout、run metadata 与 Wiki supersession | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/evidence/verification\-output\.md |
| fresh/legacy SQLite、terminal same\-issue already\_terminal 与 direct lifecycle 安全门 | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/test\-report\.md |
| context audit、package dry\-run 64 entries、diff hygiene 与最终独立复审 | PASS | \.legion/tasks/remove\-pr\-quota\-enforcement\-v1/docs/review\-change\.md |

## 风险与限制

- 未执行真实 GitHub/Linear 线上 E2E，当前证据只证明工作树和本地 Scheduler 行为；缓解：不把本报告表述为部署完成；纠正 PR 合并后仍按既有 sandbox/production 验收边界验证运行 revision。
- 删除 task\-level DB hard gate 后，任意失控 worker 不再有数字配额兜底；缓解：这是用户明确要求且 RFC 接受的授权边界；自动路径仍由 terminal already\_terminal、external\-only prompt、当前 run final\-non\-success 与用户授权门停止。
- 已升级数据库仍保留不再使用的 legacy binding 表和 migration rows；缓解：采用非破坏性兼容策略并以 legacy DB 回归证明 rows 不被读写；未来 migration 不得把该历史表重新解释为当前授权真源。
- 纠正 PR 的 checks、review、merge、cleanup 与主工作区刷新尚未完成；缓解：继续完整 PR lifecycle；terminal 后只记录外部事实，不为收口状态自动创建新的仓库 PR。

## 审阅清单

- [ ] 确认当前规则明确没有 task 级数字配额、永久 PR identity 或跨 run gate。
- [ ] 确认 terminal external\-only 只禁止自动 status\-writeback PR，不限制用户明确授权后的新 PR。
- [ ] 确认 fresh DB 不创建 binding schema，legacy DB 旧表保留但 runtime 零引用。
- [ ] 确认 malformed worker PR URL 和 externalUrls shape 在写入 Scheduler 状态前被拒绝。
- [ ] 确认 checks/review/evidence、direct lifecycle、downstream、squash、cleanup 与 refresh 门没有被撤销。
- [ ] 确认首轮独立 review FAIL 被保留为历史，当前唯一 Verdict 为 PASS，报告不冒充 PR lifecycle 终态。

## 渲染交接

- PR-backed：是
- 状态：`local`
- 说明：仓库没有受控 HTML preview URL；reviewer 可在纠正 PR 中查看仓库内 HTML/Markdown artifact，PR body 由同一 report\-data\.json 生成。

## 最终状态与下一阶段

- 当前状态：contract、RFC、实现、首轮 FAIL 返修、新的独立验证与复审、durable Wiki 均已达到 delivery\-ready；纠正 PR lifecycle 尚未完成。
- 下一阶段：提交、fetch/rebase、push，创建纠正 PR 并完成 checks/review/squash merge；随后清理 worktree并安全刷新主工作区。
- lifecycle 声明：本报告只证明当前工作树中的授权边界、实现与证据已通过，不证明纠正 PR 已创建、checks/review 已满足、PR 已合并、worktree 已清理或主工作区已刷新。
