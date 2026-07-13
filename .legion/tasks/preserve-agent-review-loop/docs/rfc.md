# RFC：保留多 Agent 评审循环并修复报告语义

> **Profile**：Heavy RFC（任务采用默认实现模式；当前仅处于 `spec-rfc` 设计阶段）
>
> **状态**：修订 Draft，等待新的独立 `review-rfc`
>
> **范围声明**：本 RFC 只为任务合同中的三项修复收敛设计；通过独立 `review-rfc` 后，任务继续进入 `engineer -> verify-change -> review-change` 实现与验收。本设计不新增跨 transport 身份证明系统。

## 1. 决策摘要

本任务保留完整的 `RFC -> 独立 review-rfc -> engineer -> verify-change -> 独立 review-change` 大循环，token 优化只使用按需加载与五字段短交接。采用以下五项决定：

1. PASS 交付报告和 scheduler 最终门都绑定阶段文档的**当前** `## Verdict`，使用同一 fail-closed 解析契约；JSON 自报 PASS 或正文中的历史 PASS 均不能放行。
2. v1.1 在顶层强制记录机器可读的 `risk: low|medium|high`，renderer 据此选择阶段门；scheduler 把它与自身 `options.risk` 精确比对，并把既有 `profile` 与 `runKind` 精确映射，任何自报降级或模式漂移都拒绝。
3. 阶段隔离是可观察、可测试的**运行契约**：每个阶段必须通过真实的 Codex `spawn` 或 OpenCode `task` API 派生新的对应阶段 Agent；不建立 receipt、摘要、adapter、不可篡改证明或新的审计数据文件来宣称可信身份。
4. 无 verifier 的 `INCONCLUSIVE/DEFERRED` 至少聚合到 `review` attention，且在三份产物顶部显示唯一人类动作、停止点与证据 locator；`DEFERRED` 继续保留完整协议。触发后旧报告转为历史证据，owner 创建或恢复后续 task，重新走 `verify-change -> review-change`，而不是把未来 PASS/FAIL 回写进旧报告的当前 claim。
5. `report-data` 升级为 `schemaVersion: "1.1"`。v1.0 生成物只读保留为历史 artifact；新生成器明确拒绝 v1.0 输入并给出中文迁移提示。

## 2. 背景与问题

当前实现的风险分别来自报告、延后验证、权限和阶段循环：

1. `report-data.json` 的顶层结论可为 PASS，但 JSON 内状态或阶段文档的真实当前 Verdict 未被所有完成性门一致地校验。尤其 scheduler 的最终 evidence gate 目前可能从正文中宽松匹配历史 PASS。
2. 认知验证协议允许合同接受的、非阻塞的 `INCONCLUSIVE/DEFERRED`，但 `domain/authority` claim 被迫伪造 verifier 才能生成报告。
3. `report-walkthrough` 需要写入唯一机器输入，OpenCode 的权限却没有精确开放该文件。
4. “加载 skill 或派生 Agent”会让同一会话自写自审，损害既有评审循环；但仓库也没有可用的跨 transport 信任根，不能以本任务名义承诺对恶意编排器的不可篡改证明。

`report-data.json` 仍是机器校验的单一中间真源，并一次生成 HTML、Markdown 和 PR body。人类阅读生成产物与五字段 handoff，不需要维护三份手写报告。

## 3. 目标、非目标与硬边界

### 3.1 目标

- 顶部 PASS 报告与 scheduler 最终交付都 fail-closed 地绑定真实、当前阶段 Verdict。
- renderer 以 v1.1 顶层风险选择必需阶段，scheduler 再把该风险及报告 profile 与运行上下文精确绑定，禁止 JSON 自报降级。
- 无 verifier 的未解决领域/权威 claim 能诚实生成并逐 claim 展示缺口或完整 DEFERRED 协议。
- 在保留 OpenCode `report-walkthrough` 既有 `.legion/tasks/**/docs/*.md` allow 的兼容前提下，新增 `.legion/tasks/**/docs/report-data.json` 的精确 allow；不得将其放宽为 `*.json`，且正常 edit/write 必须能创建该输入。
- 恢复三个直接作者/审查者对的真实派生与会话不复用，不减少阶段、回退或独立审查。
- 用短 handoff、证据落盘和按需读取减少 token，而不取消隔离。

### 3.2 非目标

- 不设计跨 transport receipt、不可篡改日志、摘要、adapter、身份注册表或任何新的执行证明文件。
- 不把 API 返回的 agent/session ID、`displayName` 或 `transportId` 当作身份真实性证明。
- 不为 `DEFERRED` 新建 scheduler 自动唤醒、定时轮询或自动创建 task 的能力。
- 不生成失败 walkthrough；失败仍由阶段文档、回退和独立 review 表达。
- `spec-rfc` 阶段不实现本 RFC 所述改动，也不修改 `review-rfc.md`；独立设计审查通过后，由后续阶段继续实现与验收。

### 3.3 实施范围

允许后续 `engineer` 修改的范围为：

- `skills/report-walkthrough/**`：schema v1.1、生成器和三份产物的语义；
- `scheduler/src/worker-runner.ts` 及其测试：当前 Verdict 与 `report-data.json` 的最终 evidence gate；
- `skills/legion-workflow/**`：阶段派生运行契约、dispatch matrix、autopilot 与短交接文字；
- `.opencode/agents/report-walkthrough.md`：保留既有 Markdown allow，并新增精确 JSON allow 规则；
- `tests/regression/**` 和 `scheduler/tests/**`：下文的静态、权限、生成器与 scheduler 回归。

不在范围内的事项包括自动调度、跨 transport attestation，以及改变既有三种 Legion 执行模式。

## 4. 方案比较与决定

### Option A：由报告生成器自行推导并接受 PASS、FAIL、BLOCKED

优点是一个产物可表达所有尝试。缺点是它会与 `verify-change/review-change` 的 Verdict 真源重叠，并把历史尝试和当前真相混为一体。

### Option B：PASS 收口报告只接受当前 PASS，并由所有完成门共同 fail-closed

报告继续只服务已通过 review 的收口；生成器和 scheduler 都读取同一当前 Verdict 语义。未解决但合同允许的 claim 留在 `claims`，不伪装成阶段失败。

### Option C：新增跨 transport 回执和不可篡改执行证明

它试图机械证明不同实例，但仓库目前没有可信采集点或信任根。新建该系统会扩大本任务、制造无法兑现的安全主张，并把用户要求的循环保护误解为 attestation 项目。

### Decision

采用 Option B，明确拒绝 Option C。循环的保证范围是可执行的工作流运行契约和可观察的派生行为，而不是对恶意编排器的可信证明。

## 5. 详细设计

### 5.1 当前 Verdict：报告与 scheduler 的共同 fail-closed 契约

实现一个由 renderer 和 `verifyLegionEvidence()` 共同调用的纯解析器；两处不得各自保留宽松正则或独立解释。对每个要求 PASS 的阶段文档，解析器按以下规则处理：

1. 文档中必须**恰好一个**规范标题 `## Verdict`；缺失、重复、级别或文字不精确均拒绝。
2. 标题后跳过空白行和 HTML 注释，第一条有效内容必须是单独一行的精确 `PASS` 或 `FAIL`。`PASS（通过）`、`PASS - ...`、`BLOCKED`、代码块值及不可解析内容都拒绝。
3. `## Verdict` 以外出现的历史 PASS/FAIL 只是叙述，不参与当前结果；若历史资料需要保留，使用非规范标题，不能再写第二个 `## Verdict`。
4. 任何被要求为 PASS 的文档只在解析结果精确为 `PASS` 时通过；`FAIL`、缺文件或任何解析错误均阻断生成和最终交付。

`implementation` 报告要求当前 `test-report` 与 `review-change` 为 PASS；`risk=medium|high` 还要求当前 `rfc` locator 存在且当前 `review-rfc` 为 PASS。`rfc-only` 报告无论风险等级都要求当前 `rfc` locator 存在且当前 `review-rfc` 为 PASS。schema 中的 `stageConclusion` 与 `reviewStatus` 仍固定为 PASS，但只是候选输入，不能覆盖上述读取结果。

`report-data.json` 是 scheduler 的必需 evidence：`LegionEvidencePaths` 新增 `reportData`，唯一允许值为 `.legion/tasks/<task-id>/docs/report-data.json`。scheduler 必须先通过该精确路径读取输入，校验它是 v1.1、它的 task id 与当前 task 一致、必需阶段 locator 精确落在当前 task，并以同一解析器重读这些 locator。随后它才接受已生成的 `report-walkthrough.md`。因此“JSON PASS + 文档当前 FAIL”、“历史 PASS + 当前 FAIL”、缺/重/不可解析 Verdict 都不能绕过 renderer 或 scheduler 的任一门。

### 5.2 schema v1.1、运行元数据绑定与 PASS 报告的内容边界

新 schema 的 `schemaVersion` 固定为 `"1.1"`。在根对象的 `required` 中，`risk` 与既有的 `profile` 同为必填字段；根级 `properties` 的精确定义为：

```json
{
  "profile": { "enum": ["implementation", "rfc-only"] },
  "risk": { "enum": ["low", "medium", "high"] }
}
```

`risk` 必须在根级 `required` 中精确出现一次，实际报告值必须是单个枚举字符串；不得放入 `task`、`risks[]` 或自由文本。`risks[]` 仍只是风险说明列表，不能决定阶段门。`risk` 对两个 profile 都必填，以避免设计交付与实现交付使用两套不一致输入。

renderer 只从这个顶层 `risk` 决定 5.1 的阶段集合。scheduler 在接受任何 evidence locator 前，必须解析并完成 v1.1 schema/语义校验，然后执行两个外部绑定：

1. `data.risk` 必须与 scheduler 运行上下文的 `options.risk` 字面精确相等；低报、高报或未知值都 fail-closed，不能因为“高报更保守”而容忍漂移。
2. 不新增重复的 `runMode` 字段；现有顶层 `profile` 是报告侧唯一模式字段。scheduler 的映射固定为 `runKind=implementation -> profile=implementation`、`runKind=design_only -> profile=rfc-only`。当前没有完成性合同的 `brainstorm_only` 不映射到任一报告 profile，若进入最终 evidence gate 必须以“不支持该 runKind 的 v1.1 收口报告”拒绝，不能按 implementation 猜测。

因此，单独运行 renderer 时它会按自报风险严格要求相应阶段；scheduler 最终门还会用外部运行风险和模式消除自报降级。两条路径的阶段集合固定如下：

| profile | risk | 必需当前阶段证据 |
| --- | --- | --- |
| `implementation` | `low` | `test-report=PASS`、`review-change=PASS` |
| `implementation` | `medium` / `high` | 上述两项，加 `rfc` locator 与 `review-rfc=PASS` |
| `rfc-only` | `low` / `medium` / `high` | `rfc` locator 与 `review-rfc=PASS` |

HTML、walkthrough Markdown 与 PR body 的顶部元数据必须并列显示 `profile` 和 `risk`，使人类能直接看出本次阶段集合为何成立；它们仍由同一输入派生，不新增手写字段。

在此元数据绑定之外，v1.1 还作如下语义收紧：

- `evidence.status` 和 `verification.status` 只允许 `PASS|INFO`；当前未解决项只放在 `claims`，不能借 evidence 把 FAIL/BLOCKED 带进 PASS 报告。
- `claims` 只投影当前未解决项，状态只允许 `INCONCLUSIVE|DEFERRED|RECOMMENDATION`；不把已经发生或未来预期的 PASS/FAIL 当作旧报告的当前 claim 状态。
- 生成器的 schema 校验和语义校验都执行 5.1 的 Verdict 读取；任何层被未来枚举放宽也不得 fail-open。
- HTML、Markdown、PR body 只能从通过校验的同一 v1.1 输入一次生成。`report-walkthrough` skill 与生成器流程约束 Agent 不手写或局部修补这些生成物；这不是 edit 权限层会拒绝所有直接 Markdown 编辑的保证。renderer 仍通过正常执行能力原子生成三份产物。

### 5.3 无 verifier 的未决 claim：注意力聚合与未来重入

对 `domain/authority` claim，真实 verifier 是可选的：有 verifier 时仍须满足既有 kind、资源、方法、独立性和 provenance 约束；没有 verifier 时必须显示“未获得 verifier”，不得补造 locator、版本、方法或独立性。

semantic validator 必须从 `claims` 计算集合 `U`：`expertise` 为 `domain|authority`、`verifier` 缺失且 `status` 为 `INCONCLUSIVE|DEFERRED` 的全部 claim。只要 `U` 非空，就执行以下跨字段一致性约束：

1. attention 等级按 `none < skim < review < decide` 排序，`attention.level` 必须至少为 `review`；这是最低值，不覆盖认知协议因 `blocking-policy`、criticality 或未完成决定而要求的更高 `decide`。
2. `attention.stopPoint` 必须存在且去除首尾空白后非空；`attention.humanAction` 必须是**唯一一个**顶层标量字符串且去除首尾空白后非空。两者都不得使用 `无`、`无需动作`、`none`、`n/a` 或 `-` 这类占位值。v1.1 不增加 `claims[].humanAction` 或动作数组；若多个 claim 不能收敛为一个当前动作，报告作者必须把聚合 attention 提升为一个人类决定动作，而不是列出多个互相竞争的“下一步”。
3. `U` 中每个 `claim.evidence` 都必须是去除首尾空白后非空的 repo locator，且该精确 locator 必须至少出现一次于 `attention.evidence`。这里 locator 指向 claim 登记、证据缺口或延后协议的可复核记录，不等同于伪造 verifier 原始证据。

因此，无 verifier 的领域/权威 `INCONCLUSIVE/DEFERRED` 配 `attention:none|skim` 必定失败；`review|decide` 只有在唯一动作、停止点和证据映射也完整时才通过。renderer 从 `U` 派生顶部提示，不要求 JSON 重复自报：HTML 首屏 attention 卡片、walkthrough Markdown 顶部摘要和 PR body 顶部摘要都必须显示 `未获得 verifier` 及相关 claim id、聚合等级、当前唯一人类动作、停止点和 evidence locator，详细协议再在 claim 表中展开。

缺 verifier 的 `INCONCLUSIVE` 需要 `evidenceGap` 与 `escalation`。缺 verifier 的 `DEFERRED` 必须有 `deferredProtocol`，并与现有 claim 的 `owner`、`impact`、`mitigation` 一起构成完整协议：

- `trigger`：可观察、可判定的触发条件；不能是“有空时”。
- `method`：触发后采用的验证方法。
- `requiredData`：非空数组，每项含数据名称、来源和可用验收条件。
- `stopCondition`：何时停止或升级。
- `successorTask`：owner 在触发后必须 create 或 restore 的后续 task 说明，以及该 task 中保存原始数据、执行记录和结论的位置规则。
- `onPass` 与 `onFail`：各自只含 `nextAction` 和 `conclusionUpdate` 两段非空说明。它们描述未来如何处理、如何更新后续任务的结论；不得含 `status`，不得把 PASS/FAIL 硬塞进旧报告的当前 `claims.status`。

完整、合同允许且为 `defer-by-contract` 的 DEFERRED 至少产生 `review` attention，并在合并前展示唯一人类动作和停止点。若人类已经在该 attention 下合并，则这表示已接受当时风险，并要求 owner 创建/恢复后续 task；触发后不能反向阻止已经发生的 merge。

#### 触发后的时态与重入

报告在生成时仅陈述当时尚未触发的未解决项。外部触发一旦被 owner 从 `trigger` 指定的数据源观察到，旧报告立即只作为历史证据，不再是 current truth；不编辑旧 `claims.status` 伪造“已完成”。owner 必须：

1. 按 `successorTask` 创建或恢复后续 task，并记录满足 `trigger` 的原始证据 locator、它与 `requiredData` 验收条件的对应关系，以及旧报告 locator；
2. 通过真实派生先运行新的 `verify-change`，再运行新的独立 `review-change`；
3. 在该后续 task 中生成新的 v1.1 报告。新报告只投影届时仍未解决的 claim，已解决结论写在新的验证/review 证据中。

这不是 scheduler 自动唤醒：触发观察、create/restore 和派生由 owner/编排器显式发起。v1.1 schema 不增加 `triggerObserved` 或同类自报开关，报告作者无权靠布尔值声明“尚未触发”来维持旧报告的当前性。触发事实只在后续 task 中以可定位的原始证据进入验证，再由新的 `verify-change -> review-change` 判断；旧报告不会因重渲染而获得新的时态结论。

三份生成产物对每个无 verifier 的 domain/authority claim 都必须显示 claim id、`未获得 verifier`、当前状态、证据缺口或触发条件、owner、缓解、停止点和后续 task 动作；DEFERRED 还逐项展示 required data、method、`onPass/onFail` 的未来动作与结论更新说明。顶部只投影上段规定的聚合注意力，详细内容不在顶部重复，以控制阅读与 token 噪音。

### 5.4 强制派生的多 Agent 大循环

阶段顺序和三种模式保持不变，但“真实加载 skill 或派生”收紧为以下运行契约：

- 每个阶段都必须由编排器通过真实 transport API 派生新的、对应 `agentType` 的阶段 Agent，且该 Agent 真实加载自己的阶段 skill。Codex 的每一次 `spawn` 和 OpenCode 的每一次 `task` 都是独立派生事件；不得把 primary 会话直接切换 skill 视为派生。
- `spec-rfc -> review-rfc`、`engineer -> verify-change`、`verify-change -> review-change` 的直接作者与直接 reviewer 不得复用同一阶段会话。作者修订或验证重跑后，必须重新派生本轮 reviewer；FAIL 仍按原链回退。
- `agentType` 仅用于职责/权限选择。`displayName` 只供人类识别与五字段 handoff；`transportId` 只在 API 有该实例参数时传递。三者都不是身份证明。
- API 实际返回的 agent/session id 仅可写入运行日志作为审计线索，帮助排障和发现明显复用；它不是本任务的信任根，也不作为 PASS 的机械证明。若 transport 没有可重查实例 ID，交接只能写“已观察到不同派生事件，实例隔离未机械证明”，不得声称不同 Agent 实例。
- static contract 与可用的调度/权限测试只防止工作流文档退化、错误地绕过当前 Verdict 或放宽写权限。它们不声称能抵抗恶意编排器伪造调用、日志或身份；该威胁模型明确超出本任务。

每个阶段仍只传五字段判断增量，完整证据留在 task docs；按需加载而非取消派生是唯一 token 优化路径。

### 5.5 OpenCode 权限

`.opencode/agents/report-walkthrough.md` 保留现有：

```yaml
".legion/tasks/**/docs/*.md": allow
```

并精确新增：

```yaml
".legion/tasks/**/docs/report-data.json": allow
```

该 JSON 规则只开放 `report-data.json`，不得替换为 `*.json` 或其他 JSON 路径；它与既有 Markdown allow 并存，不构成“只有 JSON 可写”的权限主张。正常 edit/write 可创建 `report-data.json`。Agent 不手写或局部修补 HTML、Markdown、PR body 是 `report-walkthrough` skill 与生成器流程的约束，而不是 edit 权限层对 Markdown 直接编辑的拒绝保证；renderer 仍通过正常执行能力原子生成三份交付产物。

## 6. 验证设计

后续实现至少应提供以下可执行回归：

1. **共享 Verdict parser**：renderer 与 scheduler 使用同一实现；精确 PASS 通过，当前 FAIL、历史 PASS 后当前 FAIL、重复/缺失 `## Verdict`、标题后空白或注释后的非精确值、JSON PASS + 文档 FAIL 都失败。scheduler 的设计-only、medium/high implementation 和 renderer 路径均覆盖。
2. **风险与 profile 双路径绑定**：renderer 和 scheduler 各自覆盖 `implementation+low` 不要求 `review-rfc`、`implementation+medium/high` 必须要求当前 `review-rfc=PASS`、`rfc-only+low/medium/high` 都必须要求当前 `review-rfc=PASS`。scheduler 另覆盖 `options.risk=medium|high + data.risk=low` 的自报降级、任意其他风险不一致、`implementation/design_only` 与 profile 不一致及 `brainstorm_only` 无映射，全部 fail-closed；风险/profile 一致的 low、medium、high 正例分别通过。两个完成门对同一 profile/risk 的必需阶段集合必须对称，三份生成物顶部同时断言显示相同的 profile/risk。
3. **PASS 输入收紧**：implementation 缺/非 PASS 的 `test-report`、`review-change`，以及 medium/high 缺/非 PASS 的 `rfc/review-rfc` 一律拒绝；`verification/evidence` 的 FAIL/BLOCKED 或不允许状态一律拒绝。
4. **v1.1 版本门**：合法 v1.1 通过；缺顶层 `risk`、未知 risk 或合法 risk 放错到 `task`/`risks[]` 均拒绝；v1.0 输入被新生成器拒绝，错误中文明确说明“v1.0 仅为历史 artifact，需按 v1.1 当前证据重建输入”；旧输入不得重新生成。
5. **无 verifier 的 claim 与 attention 聚合**：无 verifier 的 domain `INCONCLUSIVE` 与 authority `DEFERRED` 分别构造 `attention:none`、`skim` 负例，均拒绝；`review`、`decide` 正例在唯一 `humanAction`、非空 `stopPoint`、每个 claim 的非空 evidence locator 均出现在 `attention.evidence` 时通过。再分别删除/置空动作、停止点、claim locator 或 attention 中的对应 locator，并用 `无/无需动作/none/n/a/-` 作为动作或停止点，均拒绝。HTML、walkthrough Markdown、PR body 三份产物都断言顶部出现 `未获得 verifier`、相关 claim id、等级、唯一动作、停止点和 locator；伪 verifier、kind/provenance 不匹配或缺失必填缺口/协议字段仍失败。
6. **DEFERRED 完整性与时态**：缺 `trigger`、`method`、`requiredData`、`stopCondition`、`successorTask`、`onPass/onFail.nextAction` 或 `conclusionUpdate` 都失败；`onPass/onFail.status` 及任何 `triggerObserved` 自报字段都被 schema 拒绝。用两个独立 task fixture 验证重入：原 task 的报告完整展示触发协议；后续 task 记录满足 trigger 的原始证据 locator、required data 验收对应关系与旧报告 locator，并按顺序具备新的 `verify-change -> review-change` 入口。断言旧报告不被回写或重渲染为新结论，且该路径没有 scheduler 自动唤醒。
7. **阶段派生运行契约**：对 `legion-workflow`、dispatch matrix、autopilot、Agent 权限和相关静态测试，断言每阶段必须经真实 Codex `spawn` 或 OpenCode `task` 派生、直接作者/reviewer 不复用会话、名称字段不作身份证明、无可查实例 ID 时使用诚实降级文案，以及五字段 handoff 未被扩张。此测试不宣称身份 attestation。
8. **兼容权限与生成流程**：断言既有 `.legion/tasks/**/docs/*.md` allow 保留，精确 `.legion/tasks/**/docs/report-data.json` allow 存在，且没有 `*.json` 或其他 JSON 路径被放宽；正常 edit/write 可以创建 `report-data.json`。另行验证 renderer 从通过校验的同一 v1.1 输入原子生成 HTML、Markdown、PR body，且这三份产物的唯一生成路径仍是生成器。不得把 Markdown 直接编辑被权限拒绝，或“只有 JSON 可写”，作为此处的验收断言。
9. 运行定向回归、scheduler 全量测试、根回归与 `git diff --check`。真实多 Agent A/B 可另行评估循环质量与 token，但不作为本次语义修复的身份证明。

## 7. 兼容、迁移与保留

| 对象 | v1.1 行为 | 保留/迁移规则 |
| --- | --- | --- |
| v1.0 `report-data.json` 输入 | 新生成器拒绝 | 不自动迁移、不得重新生成；按当下真实 evidence 手工重建 v1.1 输入 |
| 已生成 v1.0 HTML/Markdown/PR body | 历史 artifact | 可读、可追溯，但不是 current truth，也不由新生成器重写 |
| 新 v1.1 输入 | 仅在当前 Verdict 和 schema 全部通过时生成 | 作为唯一当前机器输入 |
| v1.1 `risk/profile` 与 scheduler 上下文不一致 | 最终 evidence gate 拒绝 | 修正当前 task 的机器输入或运行元数据，不允许以报告自报值覆盖 scheduler |
| 已触发的 DEFERRED 报告 | 历史证据 | create/restore 后续 task，重新派生 verify/review 并产生新报告 |
| 阶段派生观察 | 工作流运行契约 | 不迁移、不补造跨 transport 证明；历史名称或日志不能升级为身份结论 |

本次没有数据迁移、双写或执行清单迁移。版本升级只对应报告语义收紧和 DEFERRED 结构；新生成器拒绝旧输入是有意的 fail-closed 边界。

## 8. 回滚

触发条件是 v1.1 使符合本 RFC 的有效 PASS 输入无法生成，或共同 Verdict parser 在 renderer/scheduler 间出现不一致。

1. 将 schema、renderer、共同 Verdict parser、scheduler evidence gate、工作流文字和权限变更作为一个协议单元回滚；不得只回滚其中一半。
2. 保留 v1.0/v1.1 已生成 artifact、旧 Verdict 文档和 DEFERRED 的后续 task 作为历史证据；不改写为 PASS，也不删除触发记录。
3. 回滚后不把 v1.1 输入喂给旧 v1.0 生成器，也不承诺旧 v1.0 输入可再生成。恢复生成能力的路径是修正并重新发布兼容的 v1.1 实现，再走独立 review。
4. 回滚不取消已发生的 `defer-by-contract` 风险接受或已合并 PR；触发后的后续 task 仍按其合同继续处理。

由于本 RFC 不新建跨 transport 审计状态，回滚没有独立审计数据保留或迁移冲突。

## 9. 准入条件与开放问题

新的 `review-rfc` 应确认：

- scheduler 与 renderer 的当前 Verdict 规则确实同源且 fail-closed；
- 根级必填 `risk`、`options.risk` 精确比对与 `runKind -> profile` 映射能让 renderer/scheduler 对 low、medium、high 使用相同阶段集合，且自报降级无法绕过；
- 任一无 verifier 的 domain/authority `INCONCLUSIVE/DEFERRED` 都不能以 `none/skim` 收口，`review/decide` 也必须具备唯一动作、停止点和顶部可见的 evidence 映射；
- v1.1 的拒绝、历史保留和 DEFERRED stale/re-entry 不互相矛盾；
- 阶段循环要求真实派生但没有夸大为可信身份/恶意编排器防护；
- 范围未扩张到自动 scheduler、receipt 或 attestation 系统。
- OpenCode 保留既有 Markdown allow、只新增精确 `report-data.json` allow，且“不得手写生成物”明确为流程约束而非 Markdown 权限拒绝保证。

当前无阻塞性开放问题。通过独立 `review-rfc` 前不得进入 `engineer`。

## 10. 证据索引

- Task contract：`../plan.md`
- 本轮对抗审查：`review-rfc.md`
- 现有最终 evidence gate：`scheduler/src/worker-runner.ts`
- 报告输入契约与生成器：`skills/report-walkthrough/references/report-data.schema.json`、`skills/report-walkthrough/scripts/render-report.mjs`
- 阶段派生真源：`skills/legion-workflow/SKILL.md`、`skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`
