# 认知验证与领域 verifier 协议

本协议回答：关键主张得到何种支持，以及是否需要领域能力或外部权威。它是三轴、claim 状态、领域 verifier、provenance、authority evidence、延后验证与判断性主张的单一真源。仅用于影响验收或风险的非显然 claim；低风险 routine claim 可由 `verify-change` 给默认值。

## Claim 预注册

选择 verifier 前必须确定：`claim-id`、单一主张、验收/风险关系、三轴、`domain-id`、`required-capability`、`required-method`、所需原始证据、`criticality`、`risk-if-wrong`、`blocking-policy`、当前状态、`owner`。

`criticality` 为 `low|medium|high|critical`；`blocking-policy` 为 `block-stage|block-merge|advisory|defer-by-contract`。verifier 不得选择自己后改变适用范围或降低阻塞级别；分类错误退回 `spec-rfc -> review-rfc`。

### 主张性质

- `objective`：可由观测、实验、数据或权威事实支持/反驳。
- `formal`：可由形式规则、证明、类型或静态约束推出。
- `judgmental`：依赖价值、偏好或权衡，无唯一客观真值。

### 验证时机

- `now`：当前可执行。
- `deferred`：明确时间或事件后才可执行。
- `unavailable`：当前无可接受方法，等待本身也不会解决。
- `not-applicable`：判断性主张不按客观时机衡量。

### 专业门槛

- `routine`：通用工程能力与现有测试足够。
- `domain`：需要明确领域知识、工具或方法。
- `authority`：需要外部权威、资质、审计或签署。

## Claim 状态与阶段门

Claim 状态只有以下五种：

- `PASS`：证据充分支持 objective/formal claim。
- `FAIL`：证据反驳 claim 或证明验收未满足。
- `INCONCLUSIVE`：理论可证，但证据、工具、能力或权威不足。
- `DEFERRED`：未来触发后验证，且延后记录完整。
- `RECOMMENDATION`：有依据的判断建议，不是客观事实。

Claim 状态不能替代阶段门。阶段证据必须另有 `## Verdict`，下一有效内容严格为 `PASS` 或 `FAIL`。

- 阻塞性 `FAIL` => 阶段 `FAIL`。
- 核心验收 `INCONCLUSIVE` => `FAIL + decide`，除非 contract 明确接受/延后。
- `DEFERRED` 仅在协议完整、缓解可接受且 contract 允许时可与阶段 `PASS` 共存。
- `RECOMMENDATION` 不能满足 objective/formal 验收；关键决定未完成时为 `FAIL + decide`，决定后阶段可 PASS，但 claim 仍为 RECOMMENDATION。
- 非阻塞 `INCONCLUSIVE/DEFERRED` 可与阶段 PASS 共存，但至少 `review`。

attention 按 `../../legion-workflow/references/REF_HUMAN_ATTENTION.md`：未解决 `block-stage => decide`，`block-merge => review`，`advisory => skim`（high/critical 专业缺口升为 review），完整 `defer-by-contract => review`、不完整则 decide。无需人类决定的实现失败可 `skim` 自动退回，但不能覆盖更高等级；取所有未解决 claim 的最高值。

## 领域 verifier

候选顺序：contract/RFC 指定；已安装 catalog 中 description 明确匹配；仓库内明确声明职责。候选必须同时覆盖 `domain-id`、`required-capability`、`required-method`，名称或 Agent 共识不算匹配。

选中后完整读取 `SKILL.md` 与必要 references，执行规定方法，将脱敏原始输出保存到任务证据目录，并在 test report 留下以下 provenance：

- verifier 的精确 locator；
- 版本标识，无版本时为可重算 SHA-256；
- 实际读取的 `SKILL.md` 与全部必要 reference 清单，各含 locator 和版本/摘要；
- 实际执行的命令或工具调用、关键参数、退出状态/结果标识；
- repo 内原始输出 locator；
- 原始输出、方法步骤与 `claim-id` 的逐项映射。

缺任一字段、locator 不可读、摘要不一致、执行与输出不对应或证据不能映射 claim 时只能 `INCONCLUSIVE`。不得持久化秘密、令牌或个人数据。

统一返回：claim/scope/status、verifier 与方法、原始证据及作者独立性、主动反例、独立性 `low|medium|high` 及理由、置信度 `low|medium|high`、残余不确定性/失效条件/下一步、非专家解释和完整 provenance。多个 verifier 分歧保持 `INCONCLUSIVE`，不得投票。

找不到匹配 verifier、方法不可执行、provenance 或 authority 不足时，不得由通用模型自证。阻塞/高风险 claim 用 `decide`，真实升级路径只能是：安装适用 verifier、寻求外部专家/权威、缩小 claim、补权限/条件、显式接受或延后风险；非阻塞 claim 至少 `review`。

## 权威证据

记录被评价主体、签署/出具主体、资质及可核验来源、对应 `claim-id` 与范围、签发/有效期或失效条件、原始 locator、完整性/真实性/签名方法与结果、限制与未覆盖范围。

只有主体与资质来源可确认、范围覆盖当前 claim、证据有效、locator 可读且校验通过，才允许与其他证据共同支持 `PASS`。证据缺失、主体/资质不明、过期、越界、不可读或任一校验失败等任一负路径都必须返回 `INCONCLUSIVE`；权威身份不能自动扩 scope。

## 延后验证

`DEFERRED` 必须记录：

- 触发类型与条件：日期、持续窗口或可观察事件；
- owner，即届时负责发起验证的人或角色；
- 届时方法、所需数据与证据保存位置；
- 当前风险、临时缓解、失败影响与回滚/停止条件；
- 触发后成功和失败分别如何更新结论。

“以后再看”不成立；无真实 owner、触发或方法时为 `INCONCLUSIVE`。本任务只承诺持久化，不宣称 scheduler 自动唤醒。

## 判断性主张

`judgmental` 只能返回 `RECOMMENDATION`，并记录：可选方案、判断标准与事实依据、价值取舍与可逆性、最强反方理由、推荐方案与 decision owner。验证只检查论证完整、证据相关、事实/偏好分离；需人类决定时用 `decide`。contract 允许可逆默认项时记录假设并至少 `skim`。

## test-report 最小结构

1. 验证范围与选择理由；
2. Claim 登记、状态与证据映射；
3. 执行记录、结果与原始输出 locator；
4. 领域 verifier 匹配、资源、返回与 provenance，或“不适用”；
5. Authority evidence，或“不适用”；
6. 延后与判断性主张，或“无”；
7. 失败、跳过、残余不确定性；
8. 独立 `## Verdict`；
9. 完整 `## 会话注意力摘要`。

reviewer 必须能从 locator 重算“方法 -> 原始证据 -> claim -> 状态”，不能只看到结论。
