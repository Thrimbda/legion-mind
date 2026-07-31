# 撤销 PR 配额与 task 级硬限制：返修后独立验证报告

## 验证范围与方法选择

本轮是首轮 `review-change` 返回 `FAIL` 后的独立重验。输入包括 `plan.md`、`docs/rfc.md`、`docs/review-rfc.md`、首轮 `docs/review-change.md`、此前验证报告/原始输出、`log.md` 和当前完整 diff。验证者 `verify-change-lucky-lemur` 未参与实现，只重写本报告与 `docs/evidence/verification-output.md`。

首轮审查正确发现两项 blocker：

1. 两处当前 Scheduler 规范仍保留 terminal binding、legacy backfill 与 same-PR recovery。
2. 删除 binding 时误删了 worker result 的无状态 `prUrl` 与 `externalUrls[]` 输入校验。

因此本轮除重跑原验收外，新增三类主动反例：自然语言 policy 扫描、malformed worker result 直接探针、terminal same-issue scanner 探针。完整命令和输出摘录位于：

`.legion/tasks/remove-pr-quota-enforcement-v1/docs/evidence/verification-output.md`

## Claim 登记、状态与证据映射

### `NO-QUOTA-001`

- **单一主张**：删除 task-level PR binding 与数量限制后，系统仍通过 terminal 事实外部化和停止自动状态写回，避免自动 closeout PR；同时保留无状态输入校验、checks/review/evidence/direct lifecycle 安全门，并允许明确授权的后续 PR。
- **验收/风险关系**：覆盖 `plan.md` 五项验收；若错误，会继续限制用户授权、破坏 legacy DB 兼容性、接受无效 worker tracking metadata、重新引入自动 closeout，或误删交付安全门。
- **主张性质 / 时机 / 门槛**：`objective` / `now` / `routine`
- **domain-id**：`repository-workflow-scheduler`
- **required-capability**：TypeScript/SQLite 源码检查、Node 回归、Git/lifecycle 负路径验证
- **required-method**：完整 diff 审视 + 当前规范语义扫描 + malformed ingress 反例 + fresh/legacy DB 回归 + run URL/后续 run 正路径 + terminal same-issue 反例 + 全量回归
- **所需原始证据**：命令退出码与测试标识、parser/scanner JSON、SQLite schema/row 观测、当前源码/测试 locator
- **criticality**：`high`
- **risk-if-wrong**：hard quota 或 cross-run gate 仍生效；legacy 数据被破坏；无效 URL 进入持久状态；terminal 自动生成 closeout；安全门被削弱
- **blocking-policy**：`block-merge`
- **owner**：`verify-change-lucky-lemur`
- **状态**：`PASS`
- **独立性**：`high`；验证者未改实现，独立重跑首轮审查反例与全部 contract 命令
- **置信度**：`high`

| 验收/风险面 | 状态 | 直接证据 |
| --- | --- | --- |
| 当前规范不再保留 task/terminal binding、legacy backfill、same-PR recovery、数字配额或 cross-run gate | `PASS` | `tests/regression/no-auto-closeout-pr.test.ts:37`；22 个 current policy files 的旧规则扫描无命中；`docs/linear-legion-scheduler/worker-runner.md:87`、`:103` 仅以显式否定说明不存在 gate |
| runtime 无 binding schema/API/migration/worker gate | `PASS` | `scheduler/src/sqlite-store.ts:245`、`:543`、`:1100`；runtime forbidden symbol 命中 `0`；`scheduler/src/pr-identity.ts` 不存在 |
| 首轮输入校验 blocker 已修复 | `PASS` | `scheduler/src/worker-runner.ts:326`、`:350`；直接探针拒绝 malformed `prUrl`、`null` entry 与错误字段类型，接受合法输入 |
| fresh DB 不创建旧表/migration 5/6 | `PASS` | `scheduler/tests/linear-scheduler-core.test.ts:103` |
| legacy DB 保留旧表/row/migration，runtime 忽略 | `PASS` | `scheduler/tests/linear-scheduler-core.test.ts:62`；生产 runtime 零引用 |
| run URL 可变、同 task 后续 run 可使用不同授权 PR | `PASS` | `scheduler/tests/linear-pr-tracker.test.ts:128`；`scheduler/tests/linear-worker-runner.test.ts:481`、`:527`、`:596` |
| terminal 同一 issue 不自动派生 closeout run | `PASS` | `scheduler/src/scanner.ts:489`；直接探针返回 `already_terminal`；`tests/regression/no-auto-closeout-pr.test.ts:48` |
| merged 缺 evidence 结束当前自动 run 并等待授权 | `PASS` | `scheduler/src/pr-tracker.ts:524`；`scheduler/tests/linear-pr-tracker.test.ts:221` |
| checks/review/evidence/direct lifecycle 门保留 | `PASS` | `scheduler/tests/linear-pr-tracker.test.ts:161`、`:183`、`:294`；`scheduler/tests/linear-git-lifecycle.test.ts:35`、`:58`、`:80` |
| 历史 raw task evidence 未改写，Wiki 当前真相 supersede | `PASS` | `.legion/tasks/enforce-single-pr-lifecycle-v1/**` diff 为空；`tests/regression/no-auto-closeout-pr.test.ts:75` |

## 执行记录

| 命令/方法 | Exit/结果 | 结论 |
| --- | --- | --- |
| 定向四文件 Node test | `0`; `44/44 PASS` | 两项首轮 blocker、fresh/legacy、授权正路径与 tracker 门直接通过 |
| malformed worker result 直接探针 | `0`; 三个反例全部 rejected，合法输入 accepted | 无状态 `prUrl` / `externalUrls[]` 校验已恢复，不形成 identity gate |
| terminal same-issue scanner 探针 | `0`; `ready: []`, `reason: already_terminal` | 不会为 terminal issue 自动派生 repository closeout run |
| current policy/runtime 负向扫描 | `0`; retained old rules `0`，runtime forbidden symbols `0` | 无 hard quota/binding/backfill/recovery/cross-run gate 残留 |
| `npm --prefix scheduler test` | `0`; `70/70 PASS` | Scheduler 全量通过 |
| `npm run test:regression` | `0`; `48/48 PASS` | root policy、packaging、workflow 回归通过 |
| `npm run audit:context` | `0`; `failures: []` | hot `26917/42000`；medium closure `38239/59000` |
| `npm run pack:dry-run` | `0`; `entryCount: 64` | package dry-run 通过 |
| `git diff --check` | `0`; 无输出 | diff hygiene 通过 |

所有原始输出摘录均在 `docs/evidence/verification-output.md`。npm 的 `Unknown env config "tmp"` warning 未改变任何命令的 exit code，也与本任务实现无关。

## 主动反例与失败路径

- **自然语言残留**：扫描首轮漏掉的 `terminal PR binding`、task binding conflicted、legacy identity backfill、same-PR reopen/re-enable 与 cross-run fail-closed 表达；旧规范规则命中 `0`。两处 “cross-run ... gate” 词面出现均由 `no` / `does not add` 明确否定，不是当前要求。
- **malformed `prUrl`**：`"not-a-pr-url"` 被拒绝为 unsupported HTTPS pull request URL。
- **malformed `externalUrls[]`**：`[null]` 与 `[{label: 42, url: false}]` 均被拒绝。
- **合法入口**：合法 HTTPS PR URL 与 string `label/url` 外链通过；同 run URL 从 `301 -> 302 -> snapshot 303`，worker 可从 `210 -> 211`，同 task 后续 run可使用 `221/231`。
- **fresh/legacy**：fresh DB 仅 migration `1..4`；legacy migration `5` 与旧 row 不被删除或改写，且不进入 `CORE_TABLES` 健康门。
- **自动 closeout**：同一 terminal Linear issue 即使仍有 `agent:ready`，scanner 也只返回 `already_terminal`。
- **安全门误删**：checks failure/changes requested 仍 block；merged success 仍要求 evidence 与 direct lifecycle；merged evidence 缺失仍为 current-run terminal non-success。

## 领域 verifier 与 provenance

不适用。该 claim 预注册为 `routine`，无需领域 catalog、外部专家或权威工具；结论来自可重跑的当前源码、SQLite/Node 测试与 Git diff。

- verifier：`skills/verify-change/SKILL.md`
- verifier SHA-256：`4eaf5e921b6ced514c7e7bba0c655e3c43b3bfc1ee72bab37f8776262c10d97d`
- cognitive reference：`skills/verify-change/references/REF_COGNITIVE_VERIFICATION.md`
- cognitive SHA-256：`fe9b4bf0247e169b76c9a2d4b2f2a977d83105884476e35dab525e0dd1064bc3`
- attention reference：`skills/legion-workflow/references/REF_HUMAN_ATTENTION.md`
- attention SHA-256：`fa3cef52313ecd436c79b744f0bb5b31d242c7825d4fcc029e3b7bed303bb5f3`
- 实际方法与输出：`.legion/tasks/remove-pr-quota-enforcement-v1/docs/evidence/verification-output.md`
- claim 映射：本报告“Claim 登记、状态与证据映射”

## Authority evidence

不适用。该主张不依赖线上 GitHub/Linear 当前状态、法律/合规签署或外部权威。未把实现作者、RFC 作者、首轮 reviewer 或本 verifier 的身份当作 authority 证据。

## DEFERRED / RECOMMENDATION

无。`NO-QUOTA-001` 是当前可直接验证的 objective claim，不存在延后触发或需 owner 选择的判断性主张。

## 失败、跳过、残余不确定性与失效条件

- **失败**：无；首轮 `review-change FAIL` 保留在 `docs/review-change.md`，本轮没有改写该历史判断。
- **跳过**：无 contract 要求的命令被跳过。
- **残余不确定性**：
  1. 未执行真实 GitHub/Linear 线上 E2E；本报告证明当前工作树，不证明尚未部署进程已更新。
  2. 用户要求删除 task-level DB hard gate 后，任意失控 worker 不再有该兜底；当前自动路径依靠授权规则、`already_terminal` 和 external-only/final-non-success 语义停止。这是 RFC 已接受边界，不是未解决 blocker。
- **失效条件**：后续重新加入 binding/migration/cross-run gate，削弱 parser 校验，删除 `already_terminal`，恢复 post-terminal repo writeback，或部署 revision 与本次交付不一致时，结论失效并须重跑。

## Verdict

PASS

## 会话注意力摘要

- 阶段：`verify-change`
- 阶段结论：`PASS`
- 注意力等级：`skim`
- 判断变化：首轮审查正确发现的规范残留与输入校验回归均已修复；返修后独立反例把 `NO-QUOTA-001` 从先前不足以成立重新聚合为 `PASS`。
- 关键发现：
  1. 22 个 current policy surfaces 不再保留 binding/backfill/same-PR recovery/数字配额/cross-run gate；runtime forbidden symbol 为零。
  2. malformed `prUrl` 与 `externalUrls[]` 均 fail closed，合法 URL 改写与明确授权的后续 PR 路径仍通过。
  3. terminal `already_terminal`、fresh/legacy DB、checks/review/evidence/direct lifecycle 与全部 `70/70 + 48/48` 回归通过。
- 阻塞项：无。
- 残余风险：未做真实 GitHub/Linear 线上 E2E；移除 task-level DB gate 后不再对任意失控 worker提供数字配额兜底，这是用户要求且 RFC 已接受的边界。
- 人类动作：知悉，无需介入。
- 自动下一步：交给新的独立 `review-change` 重做只读交付判断。
- 完整证据：`.legion/tasks/remove-pr-quota-enforcement-v1/docs/test-report.md`
