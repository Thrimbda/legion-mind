# 认知验证与领域 verifier 协议

## 目的

本协议用于回答两个不同问题：

1. 一个关键主张当前究竟得到了什么程度的支持；
2. 支持该主张是否需要通用工程能力以外的领域能力或外部权威。

它是三轴分类、claim 状态、领域 verifier、provenance、authority evidence、延后验证与判断性主张的单一真源。`brainstorm`、`spec-rfc`、`review-rfc`、`verify-change`、`review-change` 与 `report-walkthrough` 只能引用本协议，不得各自复制或改写枚举。

本协议只用于非显然、会影响验收或风险判断的关键 claim。低风险、常规且可由直接测试证明的 claim 可以由 `verify-change` 生成合理默认值，不要求用户为每个细节填写矩阵。

## Claim 预注册

领域 verifier 被选择之前，关键 claim 必须在 contract 或 RFC 中预注册以下字段：

| 字段 | 规则 |
|---|---|
| `claim-id` | 当前 task 内稳定且唯一的标识，不因 verifier 变化而变化 |
| 主张文本 | 可被支持、反驳或作出判断的单一陈述 |
| 验收/风险关系 | 说明该主张影响哪个验收项或风险判断 |
| 主张性质 | `objective`、`formal` 或 `judgmental` |
| 验证时机 | `now`、`deferred`、`unavailable` 或 `not-applicable` |
| 专业门槛 | `routine`、`domain` 或 `authority` |
| `domain-id` | 稳定、可检索的领域标识，例如 `security/authz`、`database/migration`、`legal/privacy` |
| `required-capability` | verifier 必须具备的能力，不写空泛的“专家能力” |
| `required-method` | 必须执行的工具、实验、规范检查或 authority 校验方法 |
| 所需证据 | 能支持或反驳该主张的原始证据形态 |
| `criticality` | `low`、`medium`、`high` 或 `critical` |
| `risk-if-wrong` | 结论错误时的具体影响 |
| `blocking-policy` | `block-stage`、`block-merge`、`advisory` 或 `defer-by-contract` |
| 当前状态 | 验证前通常为待验证；验证后使用本协议定义的 claim 状态 |
| `owner` | 对主张、决定或延后验证负责的人或角色 |

三个轴相互正交，不能用一个轴替代另一个轴：

### 主张性质

- `objective`：可由观测、实验、数据或权威事实支持或反驳。
- `formal`：可由形式规则、证明、类型或静态约束推出。
- `judgmental`：取决于价值、偏好或权衡，不存在唯一客观真值。

### 验证时机

- `now`：当前已有可执行的验证条件。
- `deferred`：只有到达明确时间或发生可观察事件后才能验证。
- `unavailable`：当前没有可接受的观测方法，且不能仅靠等待获得。
- `not-applicable`：判断性主张不以客观验证时机衡量。

### 专业门槛

- `routine`：通用工程能力和现有测试足够。
- `domain`：需要明确领域方法、工具或专业知识。
- `authority`：需要外部权威、资质、审计或现实世界签署。

`domain-id`、`required-capability`、`required-method`、`criticality` 与 `blocking-policy` 必须在 verifier 选择前确定。verifier 不得同时选择自己、提高自己的适用性并降低 claim 的阻塞级别。若验证时发现分类错误，应返回 `spec-rfc -> review-rfc` 修改并重审验证设计。

## Claim 状态与阶段 Verdict

Claim 状态只有以下五种：

- `PASS`：当前证据充分支持 `objective` 或 `formal` claim。
- `FAIL`：当前证据反驳 claim，或明确证明验收未满足。
- `INCONCLUSIVE`：主张理论上可验证，但当前证据、工具、专业能力或权威不足。
- `DEFERRED`：只有未来时间或事件触发后才能完成验证，且延后记录完整。
- `RECOMMENDATION`：主张本质上是判断或选择；结论是有依据的建议，不是客观事实。

Claim 状态不能替代阶段门。阶段证据仍必须保留独立、精确的：

```markdown
## Verdict

PASS
```

或：

```markdown
## Verdict

FAIL
```

阶段结论按以下规则聚合：

- 阻塞性 `FAIL` 必然导出阶段 `FAIL`。
- 核心验收 claim 为 `INCONCLUSIVE` 时，阶段必须为 `FAIL`，且注意力等级为 `decide`；只有 contract 已明确允许延后或接受该风险时例外。
- `DEFERRED` 只有在延后协议完整、当前缓解可接受且 contract 明确允许时，阶段才可以为 `PASS`；否则阶段为 `FAIL`。
- `RECOMMENDATION` 不得直接满足 `objective` 或 `formal` 验收。关键判断尚未由 owner 决定时，阶段为 `FAIL`、注意力等级为 `decide`；决定完成后可以因为决策过程完整而阶段 `PASS`，但 claim 仍保持 `RECOMMENDATION`。
- 非阻塞 `INCONCLUSIVE` 或 `DEFERRED` 可以与阶段 `PASS` 共存，但注意力等级至少为 `review`，并进入最终 walkthrough 的风险与限制。

注意力导出遵循 `../../legion-workflow/references/REF_HUMAN_ATTENTION.md`，并使用以下固定映射：

- 未解决的 `block-stage` claim：`decide`。
- 未解决的 `block-merge` claim：`review`。
- 未解决的 `advisory` claim：至少 `skim`；其中 `high` 或 `critical` 的专业证据缺口提升为 `review`。
- `defer-by-contract`：延后协议完整时为 `review`，否则为 `decide`。
- 明确且无需人类决定的实现失败可以保持 `skim`，按阶段 `FAIL` 自动退回；它不能覆盖其他 claim 导出的更高等级。
- 阶段注意力等级取所有未解决 claim 导出等级的最高值，优先级由注意力协议定义，不得临场降级。

## 领域 verifier 的发现与真实加载

`verify-change` 按以下顺序发现候选 verifier：

1. contract 或 RFC 为 claim 明确指定的 verifier；
2. 当前会话已安装 skills catalog 中，description 明确覆盖该领域及验证方法的 skill；
3. 仓库内明确声明验证职责的 skill。

候选名称相似、提示词中自称“专家”或多个 Agent 给出相同意见，都不构成能力匹配。候选必须同时覆盖预注册的 `domain-id`、`required-capability` 与 `required-method`。

选中 verifier 后必须：

1. 完整读取它的 `SKILL.md`；
2. 完整读取该 skill 要求的所有必要 reference；
3. 实际执行它规定的方法、工具或证据检查；
4. 将原始输出经敏感信息处理后保存在当前 task 的证据目录；
5. 在 `docs/test-report.md` 中留下可由 `review-change` 重查的 provenance。

只在报告中写“已使用安全专家”或“已真实加载 verifier”没有证明力。

### 必需来源记录（provenance）

每次领域验证必须记录：

- verifier 的精确 locator；文件型资源记录精确路径，资源型 skill 记录完整资源标识。
- 版本标识；没有版本时记录 `SKILL.md` 内容的 SHA-256 摘要。
- 实际读取的 `SKILL.md` 与全部必要 reference 清单；每项包含 locator 和版本或 SHA-256 摘要。
- 实际执行的命令或工具调用、关键参数、退出状态或调用结果标识。
- repo 内原始输出 locator；工具结果不能直接持久化时，保存经过敏感信息处理的原始结果到当前 task 的证据目录。
- 原始输出、方法步骤与 `claim-id` 的逐项映射，说明每份证据支持、反驳或未能判断什么。

任何必需字段缺失、locator 不可读取、可重算摘要不一致、执行记录无法对应原始输出，或原始输出无法映射到 claim 时，该 claim 一律为 `INCONCLUSIVE`。不得为追求报告完整而复制秘密、令牌、个人数据或其他敏感信息；应保留经过处理但仍可核验方法与结果的证据。

### 缺失或不匹配时的升级

出现以下任一情况时，不得让通用模型自我认证，也不得以多个 Agent 投票补足专业能力：

- 适用 verifier 未安装或不可读取；
- verifier 的领域、能力或方法不覆盖预注册要求；
- verifier 规定的方法无法实际执行；
- 必需 provenance 不完整；
- 所需 authority evidence 缺失、不可确认、范围不覆盖、已失效或校验失败。

此时 claim 为 `INCONCLUSIVE`。阻塞或高风险 claim 使用 `decide`，并把唯一需要人类处理的问题收敛为以下一种真实路径：安装适用 verifier、寻求外部专家或权威、缩小 claim、补充权限/运行条件，或显式接受/延后风险。非阻塞 claim 使用至少 `review`，并进入最终风险清单。

## 领域 verifier 的统一返回协议

每次领域验证至少返回：

- `claim-id`、claim 状态与适用范围；
- verifier 标识、来源与实际使用的方法；
- 原始证据来源，以及证据是否独立于作者结论；
- 主动尝试的反例、失败路径或替代解释；
- 独立性等级：`low`、`medium` 或 `high`，并说明理由；
- 置信度：`low`、`medium` 或 `high`，不得使用无依据的精确百分比；
- 残余不确定性、证据失效条件与下一步；
- 面向非领域专家的通俗解释：为什么当前结论值得相信，以及它没有证明什么；
- 完整 provenance 与对应原始证据 locator。

独立性等级语义：

- `low`：同一上下文中的推理或作者自证。
- `medium`：隔离上下文的 verifier 或 sub-agent，但仍主要依赖同一批输入。
- `high`：独立工具数据或经核验的外部权威证据。

作者总结只能作为待验证输入，不能作为独立证据。多个 verifier 分歧时必须保留各自证据并返回 `INCONCLUSIVE`，不得按多数票决定真值。

## 权威证据（authority evidence）

`authority` claim 只有在外部证据本身经过校验时才可能得到 `PASS`。报告必须记录：

- 被评价主体与签署/出具主体；
- 权威主体的资质及可核验来源；
- 证据适用范围及对应 `claim-id`；
- 签发时间、有效期或明确的失效条件；
- 原始 locator；
- 完整性、真实性或签名校验方法及结果；
- 限制条件与未覆盖范围。

只有主体与资质来源可确认、适用范围覆盖当前 claim、证据仍有效、locator 可读取且校验通过时，该证据才允许与其他证据共同支持 `PASS`。权威身份本身不自动覆盖范围外的 claim。

以下任一负路径都必须返回 `INCONCLUSIVE` 和对应 attention：证据缺失、主体或资质来源不可确认、证据过期、范围越界、locator 不可读取、完整性/真实性/签名校验失败。不能把所有 `authority` claim 永久判为不可验证；校验通过的权威证据可以参与支持结论。

## 延后验证

`DEFERRED` claim 必须完整记录：

- 触发类型与条件：明确日期、持续窗口或可观察事件；
- owner：届时负责发起验证的人或角色；
- 届时方法、所需数据与证据保存位置；
- 当前风险、临时缓解、失败影响与回滚/停止条件；
- 触发后成功和失败分别如何更新结论。

“以后再看”不构成延后协议。当前任务只承诺持久化记录，不得声称 scheduler 会自动唤醒。没有真实 owner、可观察触发条件或届时方法时，状态为 `INCONCLUSIVE`，不能写成 `DEFERRED`。

## 判断性主张

`judgmental` claim 必须返回 `RECOMMENDATION`，并至少说明：

- 可选方案；
- 判断标准与事实依据；
- 价值取舍与可逆性；
- 最强反方理由；
- 推荐方案与 decision owner。

验证阶段只检查论证是否完整、证据是否相关，以及是否把事实与偏好分开；不得宣称观点“客观 PASS”。需要人类作产品、伦理或风险决定时使用 `decide`。contract 明确允许 orchestrator 对可逆选择采用默认项时，应记录假设并使用至少 `skim`。

## `docs/test-report.md` 最小结构

`verify-change` 的报告至少包含：

1. `## 验证范围与选择理由`：说明为何当前方法最能证明关键 claim；
2. `## Claim 登记与状态`：逐项列出预注册字段、当前状态与证据映射；
3. `## 执行记录`：命令或工具调用、关键参数、退出状态与原始输出 locator；
4. `## 领域 verifier`：匹配过程、真实加载资源、统一返回协议与 provenance；没有领域 claim 时明确写“不适用”；
5. `## Authority evidence`：正向校验或负向缺口；没有 authority claim 时明确写“不适用”；
6. `## 延后与判断性主张`：记录 `DEFERRED` / `RECOMMENDATION`，没有时明确写“无”；
7. `## 失败、跳过与残余不确定性`；
8. 独立的 `## Verdict`，下一有效内容只能是 `PASS` 或 `FAIL`；
9. `## 会话注意力摘要`，格式完全遵循 `REF_HUMAN_ATTENTION.md`。

报告必须让 reviewer 从 locator 重现“哪个方法产生哪份原始证据、该证据对应哪个 claim、为什么导出当前状态”，不能只提供结论性文字。

## 最小正负场景

### 常规客观主张

一个 `objective + now + routine` 的低风险 claim 可由与改动直接对应的测试支持。证据充分时 claim 为 `PASS`，阶段为 `PASS`；没有信息增量或残余风险时 attention 可以为 `none`，否则为 `skim`。

### 高风险领域主张且 verifier 缺失

一个 `objective + now + domain`、`criticality: high`、`blocking-policy: block-stage` 的 claim 找不到同时覆盖领域、能力与方法的 verifier。该 claim 必须为 `INCONCLUSIVE`，阶段为 `FAIL`，attention 为 `decide`；摘要只提出一个明确决定，并给出安装 verifier、寻求外部专家、缩小 claim 或接受风险等真实选项。

### 自称已加载但 provenance 缺失

报告写有“已真实加载 verifier”，但缺少 locator、版本/摘要、资源清单、执行记录或原始输出映射。该声明不构成证据，claim 必须为 `INCONCLUSIVE`。

### 权威证据越界

权威主体资质真实且证据未过期，但适用范围不覆盖当前 `claim-id`。该证据不能支持 `PASS`，claim 必须为 `INCONCLUSIVE`。
