# LegionMind token 与认知效率优化 RFC

## 状态

- Profile：Standard RFC
- 风险：Medium
- Contract：`.legion/tasks/optimize-token-cognitive-efficiency/plan.md`
- 设计目标：减少默认上下文和人工扫读成本，不删减 Legion 的功能与门禁。

## Context

当前默认热加载面由 `AGENTS.md`、主编排提示和 12 个已安装核心 skill 构成，共 70,581 个 Unicode 字符。主要浪费来自：

1. 入口规则用极低概率门槛覆盖了明确的只读和微操作请求。
2. 多个 `SKILL.md` 重复描述 hard gate、must-not、red flags、合理化表和同一阶段链。
3. subagent handoff 允许重复 contract、命令输出和完整证据正文。
4. 子代理实例没有稳定、可辨识的唯一名称。
5. `report-walkthrough` 要求 Agent 每次重新生成 HTML/CSS，并分别写 Markdown 与 PR body。
6. CLI/MCP 的罕见细节出现在默认阅读面或被多处重复解释。

本任务只优化协议表达和确定性生成工具，不改变 scheduler、安装资产集合或现有证据文件路径。

## Goals

- 把零写入请求和明确微操作留在普通路径。
- 把 14 个固定热加载文件压缩到不超过 42,000 个 Unicode 字符。
- 让会话与 subagent handoff 只传判断增量，完整证据仍落文件。
- 强制每个子代理实例使用 `role-adjective-noun` 名称。
- 从一个 `report-data.json` 确定性生成 HTML、Markdown 和 PR body。
- 保留现有模式、阶段、风险门、attention 门、认知验证和 PR lifecycle。

## Non-goals

- 不删除、合并或重排现有三种执行模式与固定阶段。
- 不降低安全、数据、外部合约或跨模块变更的风险等级。
- 不修改 scheduler 的 `Verdict: PASS / FAIL` 语义。
- 不引入 tokenizer、模板引擎、随机名称库或其他第三方依赖。
- 不启用 GitHub Pages，也不以缩短原始证据换取消息简洁。

## Options

### A. 只删除重复段落

保留现有结构，只删合理化表、重复流程图和同义禁令。

- 优点：改动最小。
- 缺点：入口、命名和 HTML 手工生成问题未解决；缺少持续预算，容易重新膨胀。

### B. Hot/cold 分层加确定性脚本

`SKILL.md` 只保留触发、硬门、主流程、输出和条件 reference；罕见细节进入按需 reference。新增入口分类、字符预算、命名脚本和 schema 驱动报告生成器。

- 优点：同时减少默认 token、消息噪音和重复生成；可用回归持续验证。
- 缺点：跨多个 skill，需要兼容性测试防止语义丢失。

### C. 新建运行时工作流引擎

把入口、阶段、消息和报告全部改为代码状态机。

- 优点：约束最强。
- 缺点：扩大到 scheduler/runtime 重构，风险和迁移成本远超本任务，也违背“不改变功能完整性”的要求。

## Decision

选择 B。规则压缩遵循“单一真源 + 条件加载 + 机器生成”：高频规则保留在热路径，低频例外按需读取，重复产物由无依赖脚本生成。

## 1. 入口三层

入口只判断请求本身，不以“先探索再决定”规避分类。

| 路径 | 进入条件 | 行为 |
|---|---|---|
| 普通路径 | 不修改代码、运行时配置、协议/schema 或持久状态：回答、解释、总结、状态检查、只读审阅/诊断、给命令，以及不改变行为的文档/格式整理 | 不加载 `legion-workflow`，不创建 Legion task/worktree；直接完成。复杂只读工作仍可派生已命名的只读 subagent。 |
| 明确微操作 | 请求同时满足：目标与目标位置明确；无设计分叉；低风险；不涉及安全/数据/外部合约/跨模块；可用一个有界检查验收 | 不启动 Legion；直接实施并做比例化验证。若执行中任一条件失效，停止并升级。 |
| Legion 路径 | 改变代码或行为且多步骤；目标/范围/验收不稳；跨模块；中高风险；修改 workflow/schema；需要 RFC、多个角色或 PR lifecycle | 先加载 `legion-workflow`，再按现有三种模式执行。 |

用户显式要求使用或 bypass Legion 始终优先。普通路径与明确微操作不是新的 Legion 模式；它们发生在 Legion 接管之前。

## 2. Hot/cold 上下文预算

新增机器可读 `context-manifest.json`，记录 baseline revision `5359115`、UTF-8 解码、Unicode code point 计数口径、无条件资源和带触发条件的资源。Regression 同时检查根文件、无条件加载闭包、总预算和单文件预算。

| 文件 | 上限 |
|---|---:|
| `AGENTS.md` | 650 |
| `.opencode/agents/legion.md` | 900 |
| `skills/legion-workflow/SKILL.md` | 5,500 |
| `skills/brainstorm/SKILL.md` | 3,700 |
| `skills/spec-rfc/SKILL.md` | 2,300 |
| `skills/review-rfc/SKILL.md` | 2,200 |
| `skills/engineer/SKILL.md` | 1,400 |
| `skills/verify-change/SKILL.md` | 3,600 |
| `skills/review-change/SKILL.md` | 3,800 |
| `skills/report-walkthrough/SKILL.md` | 4,500 |
| `skills/legion-wiki/SKILL.md` | 2,200 |
| `skills/git-worktree-pr/SKILL.md` | 3,800 |
| `skills/legion-docs/SKILL.md` | 2,700 |
| `skills/pr-html-render/SKILL.md` | 3,000 |

总上限为 42,000；单文件预算合计低于总上限，保留小幅格式余量。`REF_TOOLS.md` 压缩为命令索引并明确 CLI `--help` 是参数真源；MCP 只保留“可选兼容层”结论。阶段罕见规则保留在 reference，但只能在命中对应场景时读取。

清单还定义典型加载闭包：普通路径、Legion 入口、低风险实现链、中风险实现链和重型设计链。中风险闭包除上述 14 文件外，还保守计入 `SUBAGENT_DISPATCH_MATRIX.md`、`GUIDE_DESIGN_GATE.md`、`REF_HUMAN_ATTENTION.md`、`REF_COGNITIVE_VERIFICATION.md`、`REF_SCHEMAS.md` 与 `REF_LOG_SYNC.md`；当前基线为 96,146，目标不超过 59,000。任何 hot file 中使用“必须/完整读取”引用的 reference 都必须进入相应闭包；只写进 reference 但仍无条件加载不能算作节省。

## 3. 五字段短 handoff

所有普通 subagent handoff 最多包含五个字段：

```text
结果: <role/name> · <stage> · <PASS|FAIL|BLOCKED|DONE> · attention:<level>
变化: <最多三条判断增量>
风险: <仅当前有效风险；无则省略>
下一步: <一个自动动作；若 attention 为 review/decide，写唯一人类动作与停止点>
证据: <最多三个 repo-relative locator>
```

禁止复制 task contract、长 diff、完整测试输出、完整审查正文或已经落盘的内容。`review-rfc`、`verify-change`、`review-change` 仍保留阶段 `Verdict` 和 attention 语义，但会话投影使用同一短格式；`review`/`decide` 门禁不因压缩而降低。

本设计显式修改现行“原样回传完整摘要”规则：阶段证据内仍保留完整 `## 会话注意力摘要`，handoff 则使用唯一的五字段投影。映射固定为：`结果 = 阶段 + Verdict + attention`；`变化 = 判断变化 + 最多三条关键发现`；`风险 = 阻塞项 + 残余风险`；`下一步 = 人类动作 + 自动下一步 + review/decide 停止点`；`证据 = 完整证据 locator`。投影与文件冲突、`review`/`decide` 缺停止点、风险无法无损收敛或 evidence locator 缺失时，handoff 失败，不能继续阶段链。

## 4. 子代理命名

新增 `skills/legion-workflow/scripts/subagent-name.mjs`：

```text
node .../subagent-name.mjs <role> [--count <n>]
```

- 输出严格匹配 `<role>-<adjective>-<noun>`。
- role 必须为小写 ASCII slug；词表内置、俏皮但不影响职责识别。
- 使用 `node:crypto.randomInt`，不新增依赖。
- 一次生成多名时保证同批不重复；无可用组合时失败。
- orchestrator 每次派生前必须运行脚本，并把输出作为实例名；handoff 的 `结果` 字段回传同一名称。

名称输出分为权限职责 `agentType`、canonical `displayName` 与可选 API `transportId`。`agentType` 始终是已注册 role；OpenCode 等只接受固定 subagent type 的 transport 必须继续用它选择代理，不能把随机实例名当作 agent type。`displayName` 永远是连字符形式，例如 `review-rfc-witty-lynx`；`transportId` 按目标 transport 规范化，Codex 使用下划线形式 `review_rfc_witty_lynx`，且只在 API 提供独立实例标识字段时传入。派生 prompt、日志和 handoff 必须使用并回显 `displayName`，因此权限模型与用户可见实例名互不混淆。

## 5. Schema 驱动报告

新增：

- `skills/report-walkthrough/references/report-data.schema.json`
- `skills/report-walkthrough/templates/report-walkthrough.html`
- `skills/report-walkthrough/scripts/render-report.mjs`

任务只写 `docs/report-data.json`。脚本校验必填字段后一次生成：

- `docs/report-walkthrough.html`
- `docs/report-walkthrough.md`
- `docs/pr-body.md`

Schema 使用 `additionalProperties: false`，至少覆盖：标题/目的、profile、阶段结论、attention 与唯一动作、lifecycle 边界、未解决 claim、领域 verifier、scope、证据地图、交付路径、决定、验证、风险、review checklist、最终状态和 render handoff。`implementation` 必须有 test/review evidence，`rfc-only` 必须有 RFC/review-rfc evidence；`review`/`decide` 必须有唯一人类动作与停止点；`INCONCLUSIVE`、`DEFERRED`、`RECOMMENDATION` 分别要求证据缺口、触发协议或决策字段；领域 claim 必须有 verifier/provenance 字段。缺阶段证据、状态专属字段或关键数组时必须失败，不能生成语义空报告。

所有 evidence locator 必须是无 `..` 的 repo-relative 路径；render URL 只允许 `https:`，或显式使用不含 URL 的 artifact/local/internal 状态。脚本按文本与属性上下文分别转义，禁止把未校验输入直接插入 `href`。三份产物先写到 output dir 内临时文件，全部成功后原子替换；任一失败时清理临时文件且不留下混合版本。输出必须保持 standalone/OKLCH/responsive/print-friendly/no external resources，并且同一输入产生字节一致结果。

`report-walkthrough` skill 只负责证据健康检查、填写 JSON 和调用脚本；禁止手写 HTML/CSS。`pr-html-render` 仍只负责已有 HTML 的预览路径，不承担报告内容生成。

## 6. 兼容性不变量

- 执行模式仍恰好为 default implementation、approved-design continuation、heavy design-only。
- 中高风险仍需 `spec-rfc -> review-rfc PASS` 才能实现。
- 实现链仍为 `engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki`。
- `review` 阻止 merge，`decide` 阻止阶段转换；claim 五状态不替代阶段 `Verdict`。
- 修改型 Legion 任务仍要求 worktree、push 前 rebase、squash PR、checks/review、cleanup 和主工作区刷新。
- scheduler 期望的 plan/RFC/review/test/report/wiki 路径保持不变。
- skill 名称、安装列表和 OpenCode/OpenClaw 发现方式保持不变。

## 7. 关键 Claim 预注册

### `OTCE-FORMAL-001`：入口与阶段语义保持一致

- 主张：三层入口只缩小 Legion 接管范围，不改变被接管任务的模式、阶段和门禁。
- 验收/风险：对应验收 1、7；错误会导致高风险任务绕门或现有阶段失效。
- 分类：`formal + now + routine`；`domain-id: legion/workflow-contract`。
- 能力/方法：静态解析入口表、阶段链、attention、PR lifecycle 与 scheduler evidence 约束并执行正负 fixture。
- 证据：协议测试、skill locator 和 scheduler 回归。
- `criticality: high`；`risk-if-wrong: 工作错误分层或门禁缺失`；`blocking-policy: block-stage`；owner：workflow 维护者。

### `OTCE-OBJECTIVE-002`：真实加载闭包达到预算

- 主张：固定 14 文件总字符数不超过 42,000，中风险无条件加载闭包不超过 59,000，且每个文件不超过其单项预算。
- 验收/风险：对应验收 2、6；错误会让 token 优化只有主观表述。
- 分类：`objective + now + routine`；`domain-id: performance/context-size`。
- 能力/方法：按 Unicode code point 确定性计数，与 70,581 / 96,146 两组固定基线比较；扫描无条件 reference locator，拒绝未进入闭包的强制读取。
- 证据：预算清单、审计脚本原始 JSON 与 regression。
- `criticality: medium`；`risk-if-wrong: 默认上下文没有实质下降`；`blocking-policy: block-stage`；owner：skill 维护者。

### `OTCE-OBJECTIVE-003`：命名器与报告生成器可执行

- 主张：命名器满足格式与批量唯一性；一个合法 schema 输入确定性生成三份安全 artifact，非法输入失败。
- 验收/风险：对应验收 4、5；错误会退回临场命名或手写 HTML。
- 分类：`objective + now + routine`；`domain-id: tooling/deterministic-generation`。
- 能力/方法：Node 子进程正负测试、canonical/transport 映射、重复运行摘要比较、条件 schema、locator/URL 拒绝、文本/属性 escaping、原子写入与 HTML 质量门断言。
- 证据：fixture、退出码、生成文件与回归输出。
- `criticality: medium`；`risk-if-wrong: 生成器不可依赖或产生不安全 HTML`；`blocking-policy: block-stage`；owner：工具维护者。

### `OTCE-OBJECTIVE-004`：现有功能完整性未回归

- 主张：skill 安装面、CLI 生命周期、attention/cognitive 协议、scheduler 独立 Verdict 与 PR evidence gate 保持通过。
- 验收/风险：对应验收 7、8；错误会以省 token 为代价破坏现有能力。
- 分类：`objective + now + routine`；`domain-id: software/regression`。
- 能力/方法：根 regression、scheduler 全量测试、静态 locator 与 diff 检查。
- 证据：两套 TAP 原始汇总和 `git diff --check`。
- `criticality: high`；`risk-if-wrong: 现有 Legion 功能或调度门回归`；`blocking-policy: block-stage`；owner：仓库维护者。

### `OTCE-FORMAL-005`：短 handoff 不降低 attention 与风险门

- 主张：完整阶段摘要到五字段 handoff 的映射唯一且可重算，字段上限不会丢失 `review`/`decide` 停止点、当前风险或证据入口。
- 验收/风险：对应验收 3；错误会为了省 token 隐藏人类必须看到的判断。
- 分类：`formal + now + routine`；`domain-id: legion/handoff-contract`。
- 能力/方法：表驱动正负 fixture 比对完整摘要与投影，覆盖三条变化上限、冲突、缺停止点和 locator 缺失。
- 证据：协议测试、阶段 skill locator 与 handoff fixture 原始输出。
- `criticality: high`；`risk-if-wrong: attention 降级或风险信息丢失`；`blocking-policy: block-stage`；owner：orchestrator 维护者。

## Scope

- 入口：`AGENTS.md`、`.opencode/agents/legion.md`、`skills/legion-workflow/**`。
- 核心 skills：固定预算表中的 12 个 `SKILL.md`。
- 报告：`skills/report-walkthrough/**` 与 `skills/pr-html-render/SKILL.md`。
- 测试：`tests/regression/**`；必要时调整现有协议测试以检查语义而非冗长措辞。
- 证据：当前 task docs 与 `.legion/wiki/**`。

## Verification

1. 入口表驱动测试覆盖只读、给命令、微文案修改、未知范围、多模块、安全和显式 override。
2. 字符预算测试按 Unicode code point 统计固定热文件和声明的无条件加载闭包，断言单文件、总量、reference 完备性与两组降幅。
3. handoff 测试从完整摘要生成五字段投影，覆盖三条变化上限、风险保真、冲突、`review`/`decide` 停止点和 locator 缺失。
4. 命名器测试覆盖 canonical/transport 格式、role 拒绝、批量唯一与上限失败。
5. 报告生成器测试覆盖完整 fixture、profile/attention/claim 条件缺失、非法枚举、不安全 locator/URL、文本与属性 escaping、原子三输出、确定性和 HTML 质量门。
6. 现有 attention/cognitive/scheduler Verdict 协议测试继续通过。
7. `npm run test:regression`、`npm --prefix scheduler test`、`git diff --check` 全部通过。
8. 测试报告记录基线、结果、绝对差值与百分比，不把字符数冒充精确模型 token。

## Rollback

本任务没有数据迁移、持久状态或依赖变更。回滚使用单个 squash commit 的 `git revert`：恢复原入口、skill 文本和手工报告规则，并删除新脚本、模板、schema 与预算测试。若仅报告生成器失败，也必须整体回滚生成器契约，不能让“脚本优先、手写兜底”形成两套真源。
