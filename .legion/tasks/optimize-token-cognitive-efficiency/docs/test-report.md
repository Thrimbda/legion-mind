# LegionMind token 与认知效率优化验证报告

## 验证范围与方法选择

- 验证实例：`verify-change-lucky-panda`。
- 验证对象：当前 worktree 中相对 `origin/master` 基线 `535911597afe4e64ba84d708018fb8ceefafd79b` 的实现、测试与协议变更；验证时同时检查 tracked diff 和本任务新增的脚本、schema、模板、fixture 与任务证据。
- 设计真源：`.legion/tasks/optimize-token-cognitive-efficiency/docs/rfc.md`；contract：`.legion/tasks/optimize-token-cognitive-efficiency/plan.md`；设计复审：`.legion/tasks/optimize-token-cognitive-efficiency/docs/review-rfc.md`。
- 方法选择：五个预注册 claim 均为 `routine`，可由静态协议核对、Node 正负 fixture、上下文确定性计数、根回归、scheduler 回归和 diff 完整性检查直接验证。本轮针对上一 `review-change` 的 Markdown 结构注入 blocker，优先重算 `OTCE-OBJECTIVE-003`，要求同一 fixture 同时证明链接、远程图片与换行标题在 `report-walkthrough.md`、`pr-body.md` 中只剩字面文本；其余四项再由既有定向覆盖、根回归、scheduler 回归、context audit 与 diff check 确认未受修复影响。未发现需要 `domain` 或 `authority` 能力的新主张。
- 独立性：验证命令与静态核对由第二次修复后的新实例独立执行，未继承 engineer 或上一 verifier 的命令结论；执行独立性为 `high`。回归 fixture 与实现属于同一变更集，证据源独立性为 `medium`，由既有根回归与独立 scheduler 回归补强。
- 持久化方式：本报告的“执行记录”和“静态兼容性核对”保留可重跑命令、exit code、TAP 结果标识、实际 JSON 指标与反例；它们是本轮 repo 内原始结果 locator。

## Claim 登记、状态与验收映射

### `OTCE-FORMAL-001`：入口与阶段语义保持一致

- 单一主张：三层入口只缩小 Legion 接管范围，不改变被接管任务的三种模式、阶段顺序、attention 门、PR lifecycle 或 scheduler evidence 语义。
- 验收/风险关系：对应验收 1、7；错误会让高风险任务绕门或让既有阶段失效。
- 三轴：`formal + now + routine`。
- `domain-id`：`legion/workflow-contract`。
- `required-capability`：静态解析入口分类、模式、阶段、attention、PR lifecycle 与 scheduler evidence 约束。
- `required-method`：核对协议真源并运行入口正负 fixture、根回归和 scheduler 回归；主动覆盖安全政策纯排版与政策/数据/外部承诺语义变更这一相邻反例。
- 所需原始证据：入口 fixture 的 TAP 结果、协议 locator、scheduler TAP 汇总。
- `criticality`：`high`。
- `risk-if-wrong`：工作错误分层或门禁缺失。
- `blocking-policy`：`block-stage`。
- `owner`：workflow 维护者。
- 当前状态：`PASS`。
- 状态依据：定向回归、根回归和 scheduler 回归均通过；`AGENTS.md` 与 `skills/legion-workflow/SKILL.md` 明确三层入口，后者明确相邻反例、三种模式、阶段回退、attention 与 PR 终态。

### `OTCE-OBJECTIVE-002`：真实加载闭包达到预算

- 单一主张：固定 14 个 hot 文件不超过 42,000 Unicode code points，中风险无条件加载闭包不超过 59,000，且每个文件不超过单项预算，强制 reference 均进入闭包。
- 验收/风险关系：对应验收 2、6；错误会让 token 优化只剩主观表述或把强制读取移出统计。
- 三轴：`objective + now + routine`。
- `domain-id`：`performance/context-size`。
- `required-capability`：按 Unicode code point 确定性计数、清单预算比较和强制 reference 扫描。
- `required-method`：运行 `npm run audit:context`，与 `70,581 / 96,146` 固定基线比较，并核对单文件预算、强制 reference 与失败列表。
- 所需原始证据：上下文审计 JSON 和预算 regression TAP 结果。
- `criticality`：`medium`。
- `risk-if-wrong`：默认上下文没有实质下降。
- `blocking-policy`：`block-stage`。
- `owner`：skill 维护者。
- 当前状态：`PASS`。
- 状态依据：hot 为 `23,559 / 42,000`，较 `70,581` 降低 `66.62%`；中风险闭包为 `34,254 / 59,000`，较 `96,146` 降低 `64.37%`；20 个文件均在单项预算内，`unbudgetedRequiredReferences` 与 `failures` 均为空。

### `OTCE-OBJECTIVE-003`：命名器与报告生成器可执行

- 单一主张：命名器保持固定权限职责并生成同批唯一的随机实例名与 transport-safe id；一个合法 schema 输入可确定性、事务式生成三份安全 artifact，非法输入失败且不污染既有产物。
- 验收/风险关系：对应验收 4、5；错误会退回临场命名、动态权限类型或手写 HTML。
- 三轴：`objective + now + routine`。
- `domain-id`：`tooling/deterministic-generation`。
- `required-capability`：Node 子进程正负测试、身份字段映射、schema 条件校验、上下文转义、repo 路径限制、重复摘要比较和事务恢复检查。
- `required-method`：运行命名器/生成器 fixture；静态核对 `agentType`、`displayName`、`transportId`、OpenCode 固定 role/subagent type、schema、事务恢复、repo locator/输入路径与注入反例。对 Markdown sink 必须同时覆盖 `[危险](javascript:alert(1))`、`![远程图](https://example.com/x.png)` 与换行 `# 伪标题`，并在两份 Markdown 产物中断言其仅为字面文本。
- 所需原始证据：定向 regression TAP、相关脚本/schema/template/test locator 与本报告静态核对记录。
- `criticality`：`medium`。
- `risk-if-wrong`：生成器不可依赖、权限选择漂移或产生不安全 artifact。
- `blocking-policy`：`block-stage`。
- `owner`：工具维护者。
- 当前状态：`PASS`。
- 状态依据：命名和报告生成器 fixture 全部通过；修复后的 `markdown()` 转义 Markdown 结构标记，两份 Markdown 产物均包含转义后的链接、远程图片与标题字面文本，且不包含对应主动语法。HTML 转义、schema 条件、事务恢复、repo 路径、非法 URL 和身份权限边界仍通过。

### `OTCE-OBJECTIVE-004`：现有功能完整性未回归

- 单一主张：skill 安装面、CLI 生命周期、attention/cognitive 协议、scheduler 独立 Verdict 与 PR evidence gate 在本次压缩后仍通过。
- 验收/风险关系：对应验收 7、8；错误会以节省上下文为代价破坏现有 Legion 能力或调度门。
- 三轴：`objective + now + routine`。
- `domain-id`：`software/regression`。
- `required-capability`：执行根回归、scheduler 全量回归、静态 locator 核对和 diff whitespace 检查。
- `required-method`：运行 `npm run test:regression`、`npm --prefix scheduler test` 与 `git diff --check`，并核对现行阶段 skill/ref 真源。
- 所需原始证据：两套 TAP 汇总、diff check exit code 与现行协议 locator。
- `criticality`：`high`。
- `risk-if-wrong`：现有 Legion 功能或调度门回归。
- `blocking-policy`：`block-stage`。
- `owner`：仓库维护者。
- 当前状态：`PASS`。
- 状态依据：根回归 `31/31`、scheduler `57/57`，均无失败、跳过或取消；`git diff --check` exit code 为 0。

### `OTCE-FORMAL-005`：短 handoff 不降低 attention 与风险门

- 单一主张：完整阶段摘要到五字段 handoff 的映射唯一且可重算，字段上限不会丢失 `review`/`decide` 停止点、当前风险或证据入口。
- 验收/风险关系：对应验收 3；错误会为了省 token 隐藏人类必须看到的判断。
- 三轴：`formal + now + routine`。
- `domain-id`：`legion/handoff-contract`。
- `required-capability`：对完整摘要与投影做表驱动正负比对并核对阶段 skill 的统一引用。
- `required-method`：运行 handoff fixture，覆盖五字段、判断变化与关键发现合计三条、文件/投影冲突、风险保真、`review`/`decide` 停止点和 locator 缺失。
- 所需原始证据：定向/根 regression TAP 与 attention、log sync、三个审查 skill locator。
- `criticality`：`high`。
- `risk-if-wrong`：attention 降级或风险信息丢失。
- `blocking-policy`：`block-stage`。
- `owner`：orchestrator 维护者。
- 当前状态：`PASS`。
- 状态依据：handoff fixture 通过；`REF_HUMAN_ATTENTION.md` 定义唯一机械映射和冲突失败条件，`review-rfc`、`verify-change`、`review-change` 均先落完整摘要、再返回五字段投影。

## 状态与证据映射

| claim-id | 状态 | 直接证据 | 主动反例或失败路径 | 独立性 / 置信度 |
|---|---|---|---|---|
| `OTCE-FORMAL-001` | `PASS` | 定向回归 6/6；根回归 31/31；scheduler 57/57；`AGENTS.md`、`skills/legion-workflow/SKILL.md` | 安全政策只改排版走普通路径；改变政策约束、数据处理规则或外部承诺走 Legion；显式 override 保留 | 执行 `high`、证据源 `medium` / `high` |
| `OTCE-OBJECTIVE-002` | `PASS` | `npm run audit:context` JSON；预算 fixture | 单文件超限、总量超限、强制 reference 未预算均进入 `failures` | 执行 `high`、证据源 `high` / `high` |
| `OTCE-OBJECTIVE-003` | `PASS` | 定向生成器 fixture；`render-report.mjs` 与测试静态核对 | 两份 Markdown 均阻断 `[危险](javascript:...)`、`![远程图](https:...)`、换行 `# 伪标题`；非法 role、组合溢出、schema/locator/URL/repo 外输入与事务注入失败仍被拒绝 | 执行 `high`、证据源 `medium` / `high` |
| `OTCE-OBJECTIVE-004` | `PASS` | 根回归 31/31；scheduler 57/57；diff check | CLI/安装/安全路径、独立 Verdict 与 PR evidence gate 的既有回归 | 执行 `high`、证据源 `high` / `high` |
| `OTCE-FORMAL-005` | `PASS` | attention fixture；协议与三个审查 skill | 超过三条、文件冲突、缺停止点、风险或 locator 缺失均禁止推进 | 执行 `high`、证据源 `medium` / `high` |

## 执行记录与原始结果

所有命令均在 `/Users/c1/Work/legion-mind/.worktrees/optimize-token-cognitive-efficiency` 独立运行。原始结果持久化 locator 为本节。

| # | 命令 | exit code | 结果标识 |
|---:|---|---:|---|
| 1 | `node --test --experimental-strip-types tests/regression/token-cognitive-efficiency.test.ts` | 0 | `tests 6`、`pass 6`、`fail 0`、`skipped 0` |
| 2 | `npm run test:regression` | 0 | `tests 31`、`pass 31`、`fail 0`、`skipped 0` |
| 3 | `npm --prefix scheduler test` | 0 | `tests 57`、`pass 57`、`fail 0`、`skipped 0` |
| 4 | `npm run audit:context` | 0 | `failures: []`、`unbudgetedRequiredReferences: []` |
| 5 | `git diff --check` | 0 | 无输出，whitespace/error check 通过 |

定向回归覆盖并通过六组场景：入口分层、上下文预算与强制 reference、五字段 handoff、命名与 transport 映射、schema 驱动报告事务、安全生成和旧手工模板退出真源。

其中报告生成器 fixture 对合法 schema 的 `summary` 注入三类上一审查指定反例，并同时检查 `report-walkthrough.md` 与 `pr-body.md`：

- `[危险](javascript:alert(1))` 被生成为 `\[危险\]\(javascript:alert\(1\)\)`，不再形成主动链接。
- `![远程图](https://example.com/x.png)` 被生成为 `\!\[远程图\]\(https://example\.com/x\.png\)`，不再形成远程图片。
- 换行后的 `# 伪标题` 被生成为 `<br>\# 伪标题`，不再形成新标题。
- fixture 还以负断言拒绝两份产物出现未转义的链接或图片语法；定向测试 `6/6` PASS 证明本轮 blocker 的正负路径同时闭合。

上下文审计的实际指标：

```json
{
  "baselineRevision": "5359115",
  "hot": {
    "baseline": 70581,
    "current": 23559,
    "budget": 42000,
    "reductionPercent": 66.62
  },
  "mediumClosure": {
    "baseline": 96146,
    "current": 34254,
    "budget": 59000,
    "reductionPercent": 64.37
  },
  "requiredReferences": [
    "skills/legion-workflow/references/REF_HUMAN_ATTENTION.md",
    "skills/verify-change/references/REF_COGNITIVE_VERIFICATION.md"
  ],
  "unbudgetedRequiredReferences": [],
  "failures": []
}
```

两条 npm 命令均打印非阻塞警告 `npm warn Unknown env config "tmp"`；它没有改变 exit code 或 TAP 结果，不属于本次实现失败。

## 静态兼容性与实际 diff 核对

### 命名、Codex 与 OpenCode

- `skills/legion-workflow/scripts/subagent-name.mjs` 的输出对象固定包含 `agentType: role`、随机 `<role>-<adjective>-<noun>` 的 `displayName`，以及按 transport 生成的 `transportId`；Codex 将连字符规范化为下划线。
- 同批使用随机组合索引 `Set` 去重；非法 role、非法 transport、非正整数和超过 576 组合均失败。
- `skills/legion-workflow/SKILL.md` 与 `SUBAGENT_DISPATCH_MATRIX.md` 明确：`agentType` 是已注册职责和权限选择的唯一输入，`displayName` 只进入 prompt、日志和 handoff，仅在 API 有独立实例字段时才传 `transportId`。
- `.opencode/agents/legion.md` 的权限表仍只允许固定 `engineer/spec-rfc/review-rfc/verify-change/review-change/report-walkthrough/explore` task type；正文明确 OpenCode 用固定 role/subagent type 派生，随机 id 不进入权限选择。修复后的动态 agent type 缺口已关闭。

### 报告 schema、事务、路径与注入反例

- `report-data.schema.json` 根对象及主要子对象使用 `additionalProperties: false`；`implementation`/`rfc-only`、`review`/`decide`、三种非 PASS claim、`domain/authority` verifier 与 rendered URL 都有条件必填约束。
- `render-report.mjs` 对 schema 当前使用的 `$ref/const/enum/type/allOf/if/then/else/not/required/pattern/contains/additionalProperties` 等关键字执行校验，并额外核对 verifier kind 与 expertise、无凭据 `https:` URL 和禁止字符。
- 输入先经 `realpath` 并限制在当前 repo；evidence locator 必须 repo-relative、无 `..`、无反斜线，repo 外 `/etc/hosts` 输入会失败。
- HTML 对 `& < > " '` 做上下文转义；Markdown 在 HTML 字符与反斜线之外，对 `|`、反引号以及 `* _ [ ] ( ) { } # ! + - . ~` 做字面转义，并把换行转换为 `<br>`。fixture 中 `<script>alert(1)</script>` 只能生成转义文本，质量门拒绝 `<script`、`<link`、`<iframe` 和外部资源。
- 上一 `review-change` 指出的 Markdown blocker 已关闭：合法自由文本中的 `[危险](javascript:alert(1))`、`![远程图](https://example.com/x.png)` 与换行 `# 伪标题` 在 `report-walkthrough.md`、`pr-body.md` 中均只剩转义后的字面文本；测试同时确认未转义的链接/图片语法不存在。
- 三份新产物先写同目录事务临时目录；既有产物改名为 backup 后再逐份安装，任一捕获到的失败会删除已安装项、恢复全部 backup 并清理临时目录。`after-first-install` 注入失败后，三份既有产物 SHA-256 与失败前完全一致。
- 非法 locator、`javascript:` URL、未知字段、缺 test-report、domain 缺 verifier、`INCONCLUSIVE/DEFERRED/RECOMMENDATION` 缺状态字段均由 fixture 证明失败。

### 协议与功能不变量

- 实际变更压缩了入口与核心 skill，并新增 context manifest/audit、命名脚本、report schema/template/renderer 和对应 regression；旧手工报告模板被删除。
- 三种执行模式、`spec-rfc -> review-rfc` 设计门、`engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` 实现链、attention 门、认知 claim 五状态、worktree/PR lifecycle 与 scheduler 独立 Verdict 均仍有现行真源和通过的回归。
- `git diff --check` 通过；未发现实现、测试与 RFC scope 不一致的 diff。

## 上一 review blocker 与本轮关闭证据

- 上一独立 `review-change` 结论为 `FAIL`：`markdown()` 未阻断 Markdown 链接、远程图片与行首块级语法，因此 `OTCE-OBJECTIVE-003` 的“安全 artifact”部分被反驳。原始 blocker 保留在 `.legion/tasks/optimize-token-cognitive-efficiency/docs/review-change.md`，本报告不覆盖或淡化该历史失败。
- 本轮实现 diff 把结构标记纳入 `markdown()` 的字面转义集合，并在 `tests/regression/token-cognitive-efficiency.test.ts` 对两份 Markdown sink 同时增加三类反例和负断言。
- 独立定向回归 exit code 0、`6/6` PASS；根回归 `31/31`、scheduler `57/57`、context audit 与 `git diff --check` 也全部通过。由此 `OTCE-OBJECTIVE-003` 从上一审查的 `FAIL` 重算为 `PASS`，其余四个 claim 保持 `PASS`。

## 领域 verifier 与 provenance

不适用。五个 claim 均预注册为 `routine`，本轮静态检查也没有独立发现需要特定领域知识、工具方法或专家判断才能成立的主张。因此没有选择领域 verifier，也没有伪造 locator、版本摘要、资源清单或 provenance。

## Authority evidence

不适用。本任务不依赖外部签署、资质、审计、合规认证或权威事实；没有被评价主体、出具主体或有效期需要正负校验。

## DEFERRED 与 RECOMMENDATION

- `DEFERRED`：无。五个 claim 均为 `now`，本轮全部完成直接验证。
- `RECOMMENDATION`：无。五个 claim 均为 objective/formal，不以价值偏好替代验收。

## 失败、跳过、残余不确定性与失效条件

- 失败：无。五条指定命令 exit code 均为 0。
- 跳过：无。定向、根与 scheduler TAP 的 skipped/cancelled/todo 均为 0。
- `OTCE-FORMAL-001`：静态 fixture 证明当前文字契约与相邻反例，但不能穷举未来所有自然语言请求。若入口分类、模式、阶段、attention 或 PR 语义改变而 fixture 未同步，本结论失效。
- `OTCE-OBJECTIVE-002`：Unicode code point 是 tokenizer 无关代理指标，不等于任一模型的精确 token 数。若 manifest 文件集合、基线、预算或强制引用措辞改变，或新增强制加载未被扫描规则识别，本结论需重跑并可能失效。
- `OTCE-OBJECTIVE-003`：本轮反例直接覆盖链接、远程图片与换行标题，并由广义结构字符转义补强，但不声称穷举所有未来 Markdown 方言或消费者扩展；若自由文本 sink、转义集合或渲染器语义改变，必须重跑这些反例。随机测试证明格式、同批唯一与边界，不证明随机分布质量；事务恢复覆盖进程内异常，不声称能抵抗进程被强杀或断电。若 Node runtime、schema 关键字集合、文件系统 rename 语义或 transport API 约束改变，本结论需重跑。
- `OTCE-OBJECTIVE-004`：证据覆盖当前 Node/macOS 工作树与现有测试集合，不等于所有 OS、Node 版本或远端 CI 环境。依赖、runtime、scheduler evidence contract 或安装资产改变后需重跑。
- `OTCE-FORMAL-005`：fixture 覆盖预注册的冲突和停止点反例，但不能保证未来任意人工摘要天然正确；若五字段映射、风险合并或 attention 门发生变化，本结论失效。
- 上述不确定性均未反驳当前 claim，也没有形成未解决的 `block-stage` 项。

## Verdict

PASS

## 会话注意力摘要

- **阶段**：`verify-change`
- **阶段结论**：`PASS`
- **注意力等级**：`skim`
- **判断变化**：上一 `review-change` 对 `OTCE-OBJECTIVE-003` 的 Markdown 结构注入 blocker 已关闭；链接、远程图片和换行标题在两份 Markdown artifact 中均只剩字面文本，五个 OTCE claim 现均为 `PASS`。
- **关键发现**：1. 五条指定命令全部 exit 0，定向/根/scheduler 分别 `6/6`、`31/31`、`57/57`；2. hot `23,559`、中风险闭包 `34,254`，分别降低 `66.62%` 与 `64.37%`；3. HTML、schema、事务、路径、命名/transport、入口、handoff 与 scheduler 证据均未受修复影响。
- **阻塞项**：无。
- **残余风险**：字符数不是精确模型 token；强制 reference 扫描依赖现行措辞；Markdown 反例不穷举未来方言；生成事务不宣称抵抗进程强杀或断电。这些均不阻止进入只读变更审查。
- **人类动作**：知悉；无需介入。
- **自动下一步**：交给新的独立 `review-change` 实例做只读就绪度审查。
- **完整证据**：`.legion/tasks/optimize-token-cognitive-efficiency/docs/test-report.md`；`tests/regression/token-cognitive-efficiency.test.ts`；`.legion/tasks/optimize-token-cognitive-efficiency/docs/review-change.md`
