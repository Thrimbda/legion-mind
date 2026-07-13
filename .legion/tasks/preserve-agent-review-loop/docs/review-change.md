# 独立变更审查：HTML 行尾空白有界返修

审查实例：`review-change-quick-koala`

本实例未参与实现或 `verify-change-fizzy-sparrow` 的验证。本轮以已批准 RFC、`plan.md`、当前实现差异和最新 `docs/test-report.md` 为输入，只读审查 renderer 出口的行尾空白规范化及对应回归；除本文件外未修改产品、测试、任务状态、wiki、正式 `report-data.json` 或三份生成物。

## 阻塞项

无当前实现阻塞项。

旧正式 `report-data.json` 及三份报告产物仍是先前 A/B claim 输入留下的 stale artifact，不代表本轮当前报告真相，也不属于本 reviewer 的修补权限。它们必须在下一阶段由新的 `report-walkthrough` Agent 从 `claims=[]`、`attention=skim`、`render.state=local` 的正式输入整体重建；重建前的全量 staged diff check 仍会失败，因此当前 PASS 不能被解释为报告交付已经完成。

## 有界实现审查

当前未暂存的产品与回归差异只有两处：

1. `renderHtml()` 在模板替换、占位符检查和 HTML 质量门之后，使用 `/[ \t]+(?=\r?$)/gm` 删除每一行末尾的 ASCII 空格或 Tab，再沿用原有 `trimEnd()` 和单个结尾换行。
2. `claims=[]` 的生成器回归对整份 HTML 增加行尾空格或 Tab 不得出现的断言。

正则的边界是准确的：字符类只包含普通空格与 Tab；正向预查只在行末、CRLF 的 `\r` 之前或文件末尾命中。实测 LF、CRLF 和末行无换行三种输入均保留原换行类型与数量，行中空格不变。renderer 仍先完成所有 HTML 转义和模板替换，规范化不会引入标签、改变属性或跨行拼接内容。当前模板没有保留行尾空白语义的 `<pre>`/`white-space: pre` 区域，用户内容也先被转义，因此未发现对当前 HTML 语义的损伤。

原有 `trimEnd()` 对文件末尾空白的行为不变；本轮只是把同一规范扩展到每一行，并没有把全角空格、NBSP 或其他 Unicode 空白误删。

## 回归覆盖判断

`validReportData()` 明确设置 `claims: []`。该输入会让 `MISSING_VERIFIER_ALERT` 返回空字符串，模板中原本缩进的空占位符行正是历史 trailing whitespace 的来源；新增的整份 HTML 断言会在该行或任何其他行仍含空格/Tab 行尾时失败。因此它确实覆盖 `claims=[]` 的空 alert，而不是只对一段手造字符串测试正则。

同时，既有无 verifier 定向回归仍验证 domain `INCONCLUSIVE` 不伪造 verifier、保留 attention 与证据映射，并能生成三份产物。两项最小复跑结果：

- `报告生成器从单一 schema 数据确定性且事务式生成三份安全产物`：`1/1 PASS`。
- `v1.1 renderer 对无 verifier 未决项如实生成`：`1/1 PASS`。
- 当前实现与回归文件的 `git diff --check`：PASS。

最新 `test-report.md` 还记录定向组合 `36/36`、根回归 `40/40`、scheduler `59/59` 全部 PASS，足以排除这项出口格式返修对相邻协议的退化。

## 协议与循环不变性

本轮没有修改 schema、共享当前 Verdict 解析器、语义校验、scheduler、worker handoff、OpenCode 权限或阶段派生文档。代码路径复核与最新验证共同支持：

- 顶部 PASS 仍必须与当前阶段文档的唯一规范 Verdict 一致；FAIL、BLOCKED、历史 PASS 或不可解析状态仍 fail-closed。
- `domain/authority` 的无 verifier `INCONCLUSIVE/DEFERRED` 仍可如实表达，并保留 attention、停止点、唯一人类动作和后续验证协议。
- `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change` 仍由不同阶段 Agent 执行，失败仍按原循环回退；五字段短交接没有替代任何评审阶段。
- scheduler 的 task/profile/risk、固定 locator、当前 Verdict 与 report-data 最终门均未改变。

## 范围与安全视角

本轮范围没有扩大：产品变更为 renderer 出口一行规范化，测试变更为一条对应断言；其余当前任务文档、wiki 和正式报告差异属于既有交付流水，不是本轮实现增量。

由于 renderer 处理可进入 HTML 的数据，本轮展开了安全视角。行尾删除发生在已有 HTML 转义之后，只删除空格/Tab，不解码实体、不改引号、不生成标签，也不放宽脚本、外链、iframe 或预览 URL 质量门。未发现新的注入、内容逃逸、权限扩张或 fail-open 路径。

## 交付前置与残余风险

- `git diff --cached --check` 当前仍以 `.legion/tasks/preserve-agent-review-loop/docs/report-walkthrough.html:71` 的历史 trailing whitespace 返回 exit code `2`。这是 stale artifact 的可观察证据，不能被本轮新 renderer 的定向 PASS 掩盖。
- 新的 `report-walkthrough` Agent 必须把正式输入恢复为 `claims=[]`、`attention=skim`、`render.state=local`，再由该输入重建 HTML、walkthrough Markdown 与 PR body。
- 重建后必须同时重跑正式输入 `--check -> render -> --check` 以及全量 staged/unstaged `git diff --check`；任何一项未通过都不能进入最终 PR 交付。
- 规范化只保证 renderer 生成的 HTML，不自动修改输入 JSON、阶段 Markdown、wiki 或其他非 renderer 产物。

## Verdict

PASS

## 五字段交接

- 结果：`review-change-quick-koala` 对最新 HTML 行尾空白有界返修判定 `PASS`，无实现 blocker。
- 变化：renderer 只删除每行末尾空格/Tab；`claims=[]` 空 alert 回归直接覆盖历史空白来源，HTML 内容、换行与原报告协议未变。
- 风险：旧正式 A/B artifact 仍 stale，当前全量 staged diff check 明确失败；该状态不能作为当前报告真相或最终交付证据。
- 下一步：必须派生新的 `report-walkthrough` Agent，将正式输入恢复为 `claims=[]`、`attention=skim`、`render.state=local`，整体重建三份产物后执行正式 `--check -> render -> --check` 与全量 diff check。
- 证据：`.legion/tasks/preserve-agent-review-loop/docs/test-report.md`、`skills/report-walkthrough/scripts/render-report.mjs`、`tests/regression/token-cognitive-efficiency.test.ts`、本文件。
