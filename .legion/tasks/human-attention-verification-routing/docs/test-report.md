# 人类注意力交接与验证路由测试报告

## 验证范围与选择理由

本阶段只验证当前 RFC 与实际 diff 中会改变验收或风险判断的两类关键主张：协议约束是否完整且内部一致，以及新增协议是否保持根仓库与 scheduler 的既有回归兼容。改动全部是 skill、reference、模板和回归测试，不涉及生产运行时、数据迁移或外部系统，因此最直接且证明力足够的方法是：运行新增协议单测、两套既有全量回归、静态 diff 检查，并对跨 skill 相对 locator 与旧“路径 + 一句话摘要”规则执行专项正反检查。第二轮新增协议单测进一步以可执行表驱动 fixture 验证 provenance 和 authority 的正负路径，不再只依赖关键词存在性。

这些方法直接命中 RFC 的验证条目，优于与本次协议变更无关的更大范围运行测试。本阶段没有真实 `domain` 或 `authority` claim，不加载领域 verifier，也不以通用 Agent 意见冒充专业证据。

## Claim 登记与状态

### `HAVR-FORMAL-001`：注意力与认知验证协议完整且可解析

- **主张文本**：三个适用审查阶段、orchestrator、walkthrough 与文档归属均引用统一协议；四级注意力、三轴、五种 claim 状态、生命周期门禁、噪音上限、相对 locator 和旧规则替换保持一致。
- **验收/风险关系**：覆盖验收标准第 1 至第 7 项；若错误，关键审计意见仍可能只留在 Agent 间，或把证据不足伪装为客观通过。
- **主张性质**：`formal`
- **验证时机**：`now`
- **专业门槛**：`routine`
- **domain-id**：`legion/protocol-contract`
- **required-capability**：静态读取协议、解析跨 skill locator、比对单一真源与阶段约束。
- **required-method**：新增协议单测；provenance 与 authority 可执行表驱动正负 fixture；12 个相对 locator 文件存在性检查；旧“路径 + 一句话摘要”规则负向检索；实际 diff 审阅。
- **所需证据**：TAP 测试结果、文件存在性结果、无匹配检索结果和当前 diff。
- **criticality**：`medium`
- **risk-if-wrong**：用户仍需自行遍历文件，或 attention / claim 状态在阶段间产生冲突并越过 lifecycle 门禁。
- **blocking-policy**：`block-stage`
- **owner**：LegionMind workflow 维护者。
- **当前状态**：`PASS`
- **证据映射**：执行记录 1、5、6；更新后的新增协议单测 7/7，其中 provenance 正例真实重开 locator、重算 SHA-256、核对执行记录、原始输出和 claim 映射，7 个逐项缺失/不一致负例均导出 `INCONCLUSIVE`；authority 正例核对主体、资质来源、范围、有效期、原始 locator 与三类校验，7 个负例均导出 `INCONCLUSIVE`；另有 12/12 相对 locator 检查与旧规则无匹配证据。
- **独立性**：`high`；结论来自 Node 测试、文件系统读取和 `rg` 结果，不依赖作者总结。
- **置信度**：`high`
- **残余不确定性**：证明了当前协议文本、表驱动判定语义和机器可检查边界，不证明未来每个 orchestrator 实例都会百分之百遵守协议；fixture 是协议回归执行器，不是生产级 verifier registry 或 authority 服务。
- **证据失效条件**：相关 skill/reference/template 或协议回归测试发生变更后，需要重新执行本组验证。

### `HAVR-OBJECTIVE-002`：变更保持仓库回归与 scheduler 阶段门兼容

- **主张文本**：新增 claim 状态和注意力协议不会破坏根仓库既有行为、scheduler 测试或独立 `## Verdict` 的阶段门语义，当前 diff 也不存在空白错误。
- **验收/风险关系**：覆盖验收标准第 8 项及 RFC 的 scheduler 兼容约束；若错误，安装生命周期、证据门或 scheduler 状态机可能回归。
- **主张性质**：`objective`
- **验证时机**：`now`
- **专业门槛**：`routine`
- **domain-id**：`software/regression`
- **required-capability**：执行 Node TAP 回归并解释测试数量、失败数、退出码与 diff 静态结果。
- **required-method**：`npm run test:regression`、`npm --prefix scheduler test`、`git diff --check`。
- **所需证据**：两套完整 TAP 汇总、命令退出码和 diff 检查输出。
- **criticality**：`high`
- **risk-if-wrong**：现有 CLI/setup 行为或 scheduler evidence gate 被破坏，并可能让错误阶段结论进入后续交付。
- **blocking-policy**：`block-stage`
- **owner**：LegionMind 仓库维护者。
- **当前状态**：`PASS`
- **证据映射**：执行记录 2、3、4；第二轮根回归 25/25、scheduler 回归 57/57，`git diff --check` 退出码 0 且无输出。
- **独立性**：`high`；结论来自实际全量测试与 Git 静态检查，独立于实现 handoff。
- **置信度**：`high`
- **残余不确定性**：当前测试不验证未来生产会话中的人工介入次数、审阅耗时或协议遵循率，这些运行指标不属于本次 RFC 的实现范围。
- **证据失效条件**：代码、测试、scheduler evidence gate 或依赖版本变化后，需要重新执行本组验证。

### `HAVR-OBJECTIVE-003`：新增与改写的人类可读内容使用中文

- **主张文本**：本次新增或改写的 skill、reference、模板、测试名称与任务文档以中文表达；命令、路径、代码标识和协议枚举保留原文。
- **验收/风险关系**：直接覆盖用户的中文改动要求和验收标准第 8 项；若错误，会降低当前仓库主要使用者的可读性。
- **主张性质**：`objective`
- **验证时机**：`now`
- **专业门槛**：`routine`
- **domain-id**：`documentation/language-surface`
- **required-capability**：审阅实际 diff 并区分人类可读文案与必须保留的技术标识。
- **required-method**：逐文件审阅实际 diff，并以新增协议单测的中文名称和变更文案作交叉检查。
- **所需证据**：当前实际 diff 与新增协议单测输出。
- **criticality**：`low`
- **risk-if-wrong**：交付文档出现非预期英文叙述，增加用户理解成本。
- **blocking-policy**：`block-stage`
- **owner**：LegionMind 文档维护者。
- **当前状态**：`PASS`
- **证据映射**：实际 diff 审阅及执行记录 1；人类可读新增内容为中文，技术标识、路径和命令按约束保留。
- **独立性**：`medium`；由隔离的验证阶段直接审阅 diff，并由中文测试 surface 交叉支持。
- **置信度**：`high`
- **残余不确定性**：语言判断不覆盖原本未改动的历史英文标题，也不要求翻译代码标识或第三方命令输出。
- **证据失效条件**：当前 diff 增加或修改人类可读文案后，需要重新审阅。

## 执行记录

### 1. 新增协议单测

```bash
node --test --experimental-strip-types --experimental-sqlite tests/regression/attention-verification-protocol.test.ts
```

- **退出码**：`0`
- **结果**：`tests 7`，`pass 7`，`fail 0`，`skipped 0`。
- **原始输出 locator**：本节下列 TAP 汇总；完整测试定义位于 `tests/regression/attention-verification-protocol.test.ts`。

```text
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

七项测试分别覆盖：协议单一真源、attention/lifecycle 门禁、三轴与五状态、三个阶段的中文摘要 handoff、scheduler 独立 Verdict 兼容、provenance 可执行正例与 7 个逐项负例、authority 可执行正例与 7 个缺失/过期/越界/不可读/校验失败负例。

provenance 正例会真实创建并重开 verifier、必要 reference 与原始输出 locator，重算 SHA-256，核对执行记录和 `claim-id` 映射；缺 verifier locator、缺摘要、缺资源清单、缺执行记录、缺原始输出、缺 claim 映射或摘要不一致时均断言为 `INCONCLUSIVE`。authority 正例覆盖主体、签发方、资质来源、claim 范围、有效期、原始 locator、完整性、真实性和签名校验；证据缺失、过期、范围越界、locator 不可读或任一校验失败时均断言为 `INCONCLUSIVE`。

### 2. 根仓库全量回归

```bash
npm run test:regression
```

- **退出码**：`0`
- **结果**：`tests 25`，`pass 25`，`fail 0`，`skipped 0`。
- **原始输出 locator**：本节 TAP 汇总；测试入口由根 `package.json` 的 `test:regression` 定义。

```text
ℹ tests 25
ℹ suites 0
ℹ pass 25
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

命令同时输出一条 npm 环境告警：`Unknown env config "tmp"`。它未改变退出码或测试结果，且与本次实现无因果关系。

### 3. scheduler 全量回归

```bash
npm --prefix scheduler test
```

- **退出码**：`0`
- **结果**：`tests 57`，`pass 57`，`fail 0`，`skipped 0`。
- **原始输出 locator**：本节 TAP 汇总；测试入口由 `scheduler/package.json` 的 `test` 定义。

```text
ℹ tests 57
ℹ suites 0
ℹ pass 57
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

命令输出同一条 npm `tmp` 环境告警；它不影响本次阶段结论。

### 4. Diff 静态检查

```bash
git diff --check
```

- **退出码**：`0`
- **原始输出 locator**：命令标准输出为空，表示未发现空白错误。

### 5. 跨 skill 相对 locator 检查

使用只读 Node 文件存在性脚本，从每个引用方所在目录解析认知验证与人类注意力 reference。

- **退出码**：`0`
- **结果**：`PASS 12/12 relative locators`
- **原始输出 locator**：本节结果行；覆盖 `brainstorm`、`spec-rfc`、`review-rfc`、`verify-change`、`review-change`、`report-walkthrough`、`legion-docs` 与 `legion-workflow` 的 12 个相对引用。

### 6. 旧“路径 + 一句话摘要”规则负向检查

```bash
rg -n '对话只贴路径|路径\s*\+\s*一句话摘要|路径\s*＋\s*一句话摘要' skills
```

- **退出码**：`1`
- **原始输出 locator**：命令标准输出为空；对 `rg` 而言表示没有匹配，符合负向检查预期。

## 领域 verifier

不适用。本任务登记的关键 claim 均为 `routine`，可由静态约束、文件系统检查和现有回归直接验证，不需要 `domain` 能力。新增 provenance fixture 使用仓库内临时测试数据验证协议判定器的正负语义，不代表本任务存在真实领域 claim，也不构成领域 verifier 加载。未发现、未选择、未加载任何领域 verifier，因此没有伪造 verifier 标识、统一返回内容或 provenance。

## Authority evidence

不适用。本任务没有 `authority` claim，不需要外部资质、审计、签署或现实世界权威证据。新增 authority fixture 是固定时间与临时文件上的协议回归数据，只验证正负判定规则，不能作为本任务的真实权威证据。

## 延后与判断性主张

无。本任务没有 `DEFERRED` 或 `RECOMMENDATION` claim；三个关键 claim 均为当前可验证的 `formal` 或 `objective` 主张。

## 失败、跳过与残余不确定性

- **失败项**：无。
- **跳过项**：无 RFC 要求且适用于当前改动的验证被跳过。
- **反例与失败路径**：新增单测实际覆盖缺少独立 Verdict、阶段 Verdict 为 FAIL、provenance 的 7 类逐项缺失/不一致，以及 authority 的 7 类缺失、过期、越界、不可读或校验失败路径；所有专业证据负例都只能导出 `INCONCLUSIVE`。旧规则使用无匹配检索验证；相对 locator 使用真实文件读取验证。
- **残余不确定性**：本阶段证明当前协议定义、可执行正负判定、静态引用和现有回归兼容，不声称测试 fixture 等同于真实领域 verifier 或外部权威，也不声称已经度量真实生产会话中的注意力节省，或 scheduler 已实现多级 attention 队列。这与 RFC 的非目标一致，不阻塞当前阶段。

## Verdict

PASS

## 会话注意力摘要

- **阶段**：`verify-change`
- **阶段结论**：`PASS`
- **注意力等级**：`skim`
- **判断变化**：上一轮 review-change 指出的 provenance/authority 证据不足已补齐为可执行表驱动 fixture，重验未发现新的阻塞。
- **关键发现**：新增协议单测 7/7、根回归 25/25、scheduler 回归 57/57 全部通过，`git diff --check` 无错误；provenance 正例会真实重开 locator、重算摘要并核对输出映射，7 个负例全部导出 `INCONCLUSIVE`；authority 正例与 7 个缺失/过期/越界/不可读/校验失败负例均按协议得到预期状态。
- **阻塞项**：无。
- **残余风险**：fixture 证明协议判定语义，不等同于真实领域 verifier、外部权威服务或未来每次生产会话的协议遵循率与注意力节省幅度；这些限制已在 RFC 范围中明确，不阻塞交付。
- **人类动作**：无动作。
- **自动下一步**：进入 `review-change` 进行只读重查。
- **完整证据**：`.legion/tasks/human-attention-verification-routing/docs/test-report.md`
