# 人类注意力交接与验证路由 RFC

## 摘要

本设计在不新增执行阶段、不改变现有三种运行模式、不替换任务文档真源的前提下，补齐两项能力：

1. `review-rfc`、`verify-change`、`review-change` 在阶段结束时返回统一的“会话注意力摘要”，由 orchestrator 立即投影到 chat session；完整文档继续作为证据真源。
2. `verify-change` 先按主张性质、验证时机、专业门槛三个正交维度分类，再真实加载适用的领域 verifier；无法获得足够专业证据时诚实返回 `INCONCLUSIVE`，不得用通用模型共识冒充专业结论。

阶段门继续保留精确的 `Verdict: PASS / FAIL` 语义，以兼容当前 workflow 与 scheduler。`PASS`、`FAIL`、`INCONCLUSIVE`、`DEFERRED`、`RECOMMENDATION` 是 claim 级认知状态，不直接替换阶段门。

## 背景（Context）

当前完整审查证据会写入 `docs/review-rfc.md`、`docs/test-report.md`、`docs/review-change.md`，最终再由 `report-walkthrough` 汇总。与此同时，`REF_AUTOPILOT.md` 要求“对话只贴路径 + 一句话摘要”。这会产生两个问题：

- 中间阶段的关键判断只在 orchestrator 与 sub-agent 之间流转，人类需要主动打开任务目录才能发现设计阻塞、验证缺口或残余风险。
- 当前验证主要围绕“选择命令并运行”，没有区分暂时不能验证、需要领域知识才能验证、以及本质上只能形成判断建议的主张，容易把证据不足写成笼统的 `PASS`。

当前 scheduler 会在 `review-rfc.md` 与 `review-change.md` 中匹配精确的 `Verdict: PASS`，并以此检查阶段证据。设计必须保留这一兼容面。现有 `agent:needs-human` 是二元硬门；本次只定义可供其后续消费的注意力协议，不改造 scheduler 为新的注意力队列。

## 目标与非目标（Goals / Non-goals）

### 目标

- 让阶段审查结论无需打开文件即可在会话中被发现。
- 只呈现会改变批准、风险认知或下一步动作的信息，避免把完整报告复制进会话。
- 区分主张本身、验证发生的时机和验证所需的专业能力。
- 对“人类知识不足但客观上可验证”的主张真实加载领域 verifier，并说明为什么其证据值得相信。
- 对延后验证和判断性主张保留诚实、可追踪的状态。
- 保留现有阶段顺序、三种运行模式、文档真源、`Verdict: PASS / FAIL` 门禁和 PR lifecycle。

### 非目标

- 不新增 `attention-manager`、`verification-router` 等执行阶段或第四种运行模式。
- 不建设生产级专家市场、自动预约外部专家或定时任务系统。
- 不要求每个低风险、可由常规测试直接证明的主张填写完整矩阵。
- 不用多个 Agent 的一致意见代替领域能力、独立证据或外部权威。
- 不移除或缩减完整 RFC、review、test report、walkthrough 等原始证据。
- 不在本次修改 scheduler 的标签、持久化结构或派发状态机。

## 方案比较（Options）

### 方案一：在现有阶段协议内增加统一摘要与验证路由（推荐）

新增两个轻量 reference：一个定义跨阶段注意力摘要与 orchestrator 投影规则，一个定义 claim 三轴、领域 verifier 与认知状态。现有阶段 skill 引用它们，并在各自既有文档中保存摘要副本；sub-agent handoff 返回同一摘要。

优点：

- 不改变阶段链和 scheduler 门禁，兼容成本最低。
- 摘要在阶段完成时立即出现，最终 walkthrough 仍能复用持久证据。
- 验证能力可通过已安装或仓库内 skill 扩展，无需把通用 verifier 写成万能专家。

代价：

- 协议主要由 skill 约束，短期内依赖 orchestrator 忠实投影。
- attention 等级尚不能直接形成 scheduler 的多级队列。

### 方案二：新增独立注意力阶段与验证路由阶段

在阶段链中加入 `attention-manager` 与 `verification-router`，并扩展 scheduler 状态机、证据路径和调度标签。

优点：

- 运行时边界显式，未来可直接做带宽预算、决策队列和自动延后唤醒。
- 更容易对摘要投影和 verifier 调用做机器级强制。

代价：

- 改变当前唯一阶段链并接近新增运行模式，波及 workflow、scheduler、证据校验与 lifecycle。
- 每项任务多两个阶段，可能用“治理注意力”制造更多文档和会话噪音。
- 当前没有足够生产运行数据证明需要承担这类迁移成本。

### 方案三：只增强最终 `report-walkthrough`

保持中间阶段不变，仅要求最终 walkthrough 汇总审查意见和验证分类。

优点：

- 修改面最小，最终 reviewer artifact 更完整。

代价：

- 人类仍无法在阶段发生时得知关键 FAIL、假设变化和风险升级。
- 任务在进入 walkthrough 前可能已多次返工，无法解决用户当前感受到的会话线索缺失。
- 无法为 `verify-change` 提供实际的领域能力路由。

## 决策（Decision）

采用方案一。将“注意力治理”实现为所有关键审查阶段的返回协议，将“领域验证”实现为 `verify-change` 内的可插拔路由能力。完整文档仍是持久真源；会话摘要是同一证据的低噪音实时投影，不创建新的 attention 文档。

### 会话注意力摘要协议

`review-rfc`、`verify-change`、`review-change` 的完整证据文档必须包含 `会话注意力摘要` 小节，sub-agent 最终 handoff 必须原样返回该小节。字段如下：

| 字段 | 规则 |
|---|---|
| 阶段 | `review-rfc`、`verify-change` 或 `review-change` |
| 阶段结论 | 仅 `PASS` 或 `FAIL`；与阶段门一致 |
| 注意力等级 | `none`、`skim`、`review`、`decide` |
| 判断变化 | 相对上一阶段或原计划发生的信息增量；无则明确写“无” |
| 关键发现 | 最多三项，按阻塞、判断变化、残余风险排序 |
| 阻塞项 | 只写真正阻止下一阶段的事项；无则明确写“无” |
| 残余风险 | 即使阶段通过仍存在、会影响批准的风险 |
| 人类动作 | 无动作、知悉、复核或需要作出的唯一决定 |
| 自动下一步 | orchestrator 在无需人类决定时将真实执行的下一阶段或回退点 |
| 完整证据 | 当前 task 内的证据路径 |

attention 等级语义：

- `none`：阶段通过、没有判断变化、没有残余风险、无需人类动作。会话只投影一行结论、自动下一步和证据路径。
- `skim`：存在值得知悉的信息增量，但无需人类介入，orchestrator 可以自动继续。
- `review`：存在非阻塞的 `INCONCLUSIVE`、`DEFERRED`、高影响残余风险或专业证据限制；人类应在最终批准前复核，但当前 contract 允许自动继续。
- `decide`：需要人类选择互斥方案、接受风险、提供权限或外部权威，或核心验收主张当前不能被证明。该等级是硬门，orchestrator 不得继续到受影响的下一阶段。

attention 与阶段/PR lifecycle matrix：

| attention | 阶段链允许动作 | PR lifecycle 允许动作 | 停止点与恢复条件 |
|---|---|---|---|
| `none` | 按阶段结论正常前进或回退 | 正常执行 push、PR、checks、auto-merge、merge、cleanup 与主工作区刷新 | 无额外停止点 |
| `skim` | 摘要投影后按阶段结论正常前进或回退 | 正常执行完整 PR lifecycle | 无需人类动作；信息必须进入 walkthrough |
| `review` | 允许继续生成后续验证、review、walkthrough、wiki 与 PR 审阅材料 | 允许 commit、push、创建/更新 PR 和运行 checks；**不得启用 auto-merge、执行 merge、cleanup 或宣告完成** | 在 auto-merge / merge 前等待人类复核；复核结果落盘后恢复 PR lifecycle |
| `decide` | 立即停止阶段转换、自动重试和普通 `FAIL` 回退 | 仅允许持久化当前证据和更新既有 PR 的决策说明；不得进入受影响实现、auto-merge、merge、cleanup 或完成态 | 等待人类决定；决定落盘后从声明的恢复阶段重跑 |

优先级固定为 `decide > review > skim > none`。`decide` 优先于阶段 `FAIL` 的普通回退：即使当前 `Verdict` 为 `FAIL`，摘要中的自动下一步也只能写“等待人类决定”，不得自动退回 `spec-rfc` 或 `engineer`。所有未解决 claim 分别按预注册规则导出 attention，阶段 attention 取其中最高等级，handoff 不得临场降级。

`review` 的复核结果与 `decide` 的决定由 orchestrator 写入 `log.md`，至少包含 `decision-id`、涉及的 claim、问题与选项、决定人、决定时间、选择、风险接受范围和恢复阶段；`tasks.md` 同步当前等待/恢复状态。决定改变目标、验收或 scope 时退回 `brainstorm` 更新 contract；改变设计或验证策略时从 `spec-rfc -> review-rfc` 重跑；补充 verifier、authority evidence、权限或运行条件时从产生该 attention 的阶段重跑。不得仅凭 chat 中一句“继续”清除持久门禁。

### 噪音控制规则

- 只报告相对 plan、RFC 或前一阶段的新信息，不重复背景与完整命令输出。
- 最多展示三项关键发现；其余非阻塞项只显示数量并链接完整证据。
- 优先级固定为：阻塞项、判断变化、残余风险、非阻塞建议。
- `PASS` 且无信息增量时使用 `none`，不得为了格式完整展开空字段。
- `FAIL`、风险升级、验收变化、专业证据缺失不得只留在文件中。
- 会话不粘贴长日志、diff 或参考资料；这些只通过证据路径访问。
- 同一事实由多个 verifier 重复报告时合并为一项，并保留证据来源与分歧，不按 Agent 数量放大置信度。

### Orchestrator 投影职责

阶段 sub-agent 负责形成完整证据和摘要，不负责决定是否隐藏信息。orchestrator 必须：

1. 在收到阶段 handoff 后、派生下一阶段前，把摘要直接呈现给用户。
2. 不得把 `FAIL`、`review`、`decide` 压缩成“详见文件”。
3. 可以按噪音规则压缩 `none` 与 `skim`，但不得改写阶段结论、attention 等级或人类动作。
4. `decide` 时只提出一个明确问题，给出必要选项、取舍和推荐；等待决定期间停止受影响路径。
5. `review` 时可以按 contract 自动继续，但必须让最终 walkthrough 保留该项。
6. 将阶段摘要视为 handoff 协议，不把它注册为新 skill、新阶段或新文档。

### 三轴验证模型

只有非显然、影响验收或风险判断的 claim 才需要显式登记。三个维度相互独立：

| 维度 | 值 | 含义 |
|---|---|---|
| 主张性质 | `objective` | 可由观测、实验、数据或权威事实支持或反驳 |
| 主张性质 | `formal` | 可由形式规则、证明、类型或静态约束推出 |
| 主张性质 | `judgmental` | 取决于价值、偏好或权衡，不存在唯一客观真值 |
| 验证时机 | `now` | 当前已有可执行验证条件 |
| 验证时机 | `deferred` | 到达明确时间或事件触发后才能验证 |
| 验证时机 | `unavailable` | 当前没有可接受的观测方法，且不能仅靠等待获得 |
| 验证时机 | `not-applicable` | 判断性主张不以客观验证时机衡量 |
| 专业门槛 | `routine` | 通用工程能力和现有测试足够 |
| 专业门槛 | `domain` | 需要明确领域方法、工具或专业知识 |
| 专业门槛 | `authority` | 需要外部权威、资质、审计或现实世界签署 |

每个登记 claim 至少包含 `claim-id`、主张文本、与验收/风险的关系、三轴取值、`domain-id`、`required-capability`、`required-method`、所需证据、`criticality`、`risk-if-wrong`、`blocking-policy`、当前状态和 owner。低风险 routine claim 可以由 `verify-change` 自动生成合理默认值，不把矩阵填写负担前移给用户。

其中 `domain-id` 使用稳定、可检索的领域标识（例如 `security/authz`、`database/migration`、`legal/privacy`）；`required-capability` 说明 verifier 必须具备的能力；`required-method` 说明必须执行的工具、实验、规范检查或 authority 校验方法。`criticality` 为 `low / medium / high / critical`；`blocking-policy` 为 `block-stage`、`block-merge`、`advisory` 或 `defer-by-contract`。这些字段必须在 verifier 选择前由 contract/RFC 预注册；发现分类错误时退回设计阶段修改，verifier 不得同时选择自己、提高自身适用性并降低 claim 阻塞级别。

attention 导出规则不得临场改写：未解决的 `block-stage` claim 为 `decide`；未解决的 `block-merge` claim 为 `review`；`advisory` claim 至少为 `skim`，其中 high/critical 专业证据缺口提升为 `review`；`defer-by-contract` 只有满足完整延后协议时为 `review`，否则为 `decide`。存在明确、无需人类决定的实现失败时可以保持 `skim` 并按阶段 `FAIL` 自动回退，但不能覆盖其他 claim 导出的更高 attention。

### Claim 级状态与阶段级兼容

Claim 状态为：

- `PASS`：当前证据充分支持 objective 或 formal claim。
- `FAIL`：当前证据反驳 claim，或明确未满足验收。
- `INCONCLUSIVE`：主张理论上可验证，但当前证据、工具、专业能力或权威不足。
- `DEFERRED`：只有未来时间或事件触发后才能完成验证，且延后记录完整。
- `RECOMMENDATION`：主张本质上是判断或选择，输出的是依据充分的建议，不是假装客观成立。

兼容规则：

- `review-rfc.md` 与 `review-change.md` 必须继续保留独立的精确区块 `## Verdict`，其下一有效内容只能是 `PASS` 或 `FAIL`。claim 状态表不能替代该区块。
- 阻塞性 `FAIL` 必然导出阶段 `FAIL`。
- 核心验收 claim 为 `INCONCLUSIVE` 时，阶段必须 `FAIL` 且 attention 为 `decide`，除非 contract 已明确允许延后或接受该风险。
- `DEFERRED` 只有在延后协议完整、当前缓解措施可接受且 contract 允许时，阶段才可以 `PASS`；否则阶段 `FAIL`。
- `RECOMMENDATION` 不可直接满足 objective/formal 验收。若关键判断尚未由 owner 决定，则阶段 `FAIL`、attention 为 `decide`；完成选择后，阶段可以因“决策过程完整”而 `PASS`，但 claim 仍标为 `RECOMMENDATION`。
- 非阻塞 `INCONCLUSIVE` 或 `DEFERRED` 可以与阶段 `PASS` 共存，但 attention 至少为 `review`，并进入最终 walkthrough 的风险与限制。

### 领域 verifier 的发现与真实加载

`verify-change` 按下列顺序发现候选 verifier：

1. contract 或 RFC 对 claim 明确指定的 verifier。
2. 当前会话已安装 skills catalog 中，description 明确覆盖该领域及验证方法的 skill。
3. 仓库内明确声明验证职责的 skill。

候选名称相似或自称“专家”不足以构成匹配。候选的领域、capability 和 method 必须覆盖 claim 预注册的 `domain-id`、`required-capability` 与 `required-method`。选中后必须完整读取其 `SKILL.md` 及其要求的必要 reference，并实际执行它规定的方法、工具或证据检查。仅在 handoff 中写“已使用安全专家”不算加载。

每个领域 verifier 都必须在 `test-report.md` 中保存可复核的 provenance：

- verifier 的精确 locator；文件型资源使用精确路径，资源型 skill 使用完整资源标识。
- 版本标识；没有版本时记录 `SKILL.md` 内容 SHA-256 摘要。
- 实际读取的 `SKILL.md` 与全部必要 reference 资源清单，每项包含 locator 和版本/摘要。
- 实际执行的命令或工具调用、关键参数、退出状态或调用结果标识。
- repo 内原始输出 locator；无法直接持久化的工具结果必须保存经过敏感信息处理的原始结果到当前 task 的证据目录。
- 原始输出、方法步骤与 `claim-id` 的逐项映射，说明每份证据支持或反驳什么。

`review-change` 必须重新打开 locator、核对资源存在性、重算可重算的摘要、检查命令/工具结果与原始输出，并核对 claim 映射。任一必需 provenance 字段缺失、locator 不可读取、摘要不一致、输出无法对应 claim，状态一律为 `INCONCLUSIVE`；文字自称“已加载”没有证明力。回归必须包含负例：报告写有“已真实加载 verifier”，但缺少 locator、版本/摘要、资源清单、执行记录或原始输出映射时，验证必须失败且 claim 只能为 `INCONCLUSIVE`。

如果适用 verifier 未安装、无法读取、能力范围不匹配，或所需 authority evidence 缺失、不可读取、来源不可确认、不覆盖 claim、已失效或校验失败：

- 不得让通用模型自我认证，也不得以多个 Agent 投票补足专业能力。
- claim 返回 `INCONCLUSIVE`。
- 阻塞或高风险 claim 使用 `decide`，明确给出安装专业 verifier、寻求外部专家/权威、缩小 claim、或显式接受/延后风险等升级路径。
- 非阻塞 claim 使用至少 `review`，并进入最终风险清单。

已取得的 authority evidence 可以支持 claim，但必须记录并校验：被评价主体与签署/出具主体、资质及其可核验来源、证据适用范围及对应 `claim-id`、签发时间与有效期、原始 locator、完整性/真实性/签名校验方法及结果、限制条件。只有主体与资质来源可确认、范围覆盖当前 claim、证据仍在有效期内、locator 可读取且校验通过时，才允许与其他证据共同支持 `PASS`；权威身份本身不自动覆盖范围外的 claim。上述任一项缺失或失败时返回 `INCONCLUSIVE` 和相应 attention，而不是把所有 `authority` claim 永久判为不可验证。

### 领域 verifier 的统一返回协议

每次领域验证至少返回：

- claim 标识、结论状态和适用范围。
- verifier 标识、来源与实际使用的方法。
- 原始证据来源，以及证据是否独立于作者结论。
- 主动尝试的反例、失败路径或替代解释。
- 独立性等级：`low`（同一上下文推理）、`medium`（隔离上下文的 verifier/sub-agent）、`high`（独立工具数据或外部权威）；等级必须说明理由。
- 置信度：`low`、`medium`、`high`，不得用无依据的精确百分比。
- 残余不确定性、证据失效条件和下一步。
- 面向非领域专家的通俗解释：为什么当前结论值得相信，以及它没有证明什么。

作者的总结可以作为待验证输入，不能作为独立证据。多个 verifier 发生分歧时保留各自证据并返回 `INCONCLUSIVE`，不按多数票决。

### 延后验证协议

`DEFERRED` claim 必须记录：

- 触发类型与条件：明确日期、持续窗口或可观察事件。
- owner：届时负责发起验证的人或角色。
- 届时方法与所需数据。
- 当前风险、临时缓解、失败影响与回滚/停止条件。
- 触发后成功和失败分别如何更新结论。

“以后再看”不构成延后协议。当前任务只持久化这些字段，不承诺 scheduler 会自动唤醒；若没有真实 owner 或触发条件，状态应为 `INCONCLUSIVE` 而非 `DEFERRED`。

### 判断性主张协议

`judgmental` claim 返回 `RECOMMENDATION`，至少说明选项、判断标准、价值取舍、可逆性、反方理由、推荐方案与 decision owner。验证阶段只检查论证是否完整、证据是否相关以及是否把事实与偏好分开，不宣称观点“客观 PASS”。需要人类产品或风险决策时使用 `decide`；contract 允许 orchestrator 对可逆选择作默认决定时，应记录假设并使用至少 `skim`。

### 最终聚合

`report-walkthrough` 从各阶段证据中的 `会话注意力摘要` 和 claim 状态表聚合：

- 最终阶段结论与 reviewer 当前唯一需要做的动作。
- 已解决、仍 `INCONCLUSIVE`、仍 `DEFERRED` 和属于 `RECOMMENDATION` 的关键 claim。
- 领域 verifier 的来源、独立性和残余不确定性。
- 原始证据入口。

walkthrough 不重新验证，也不要求 reviewer 为理解结论重新遍历全部原始文档。

## 范围（Scope）

### 计划修改

- `skills/legion-workflow/SKILL.md`：增加 orchestrator 即时投影职责和 attention 硬门语义。
- `skills/legion-workflow/references/REF_AUTOPILOT.md`：用低噪音摘要规则替换单纯“路径 + 一句话摘要”。
- `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`：明确阶段 handoff 必须被投影，但不改变阶段链。
- 新增跨阶段注意力协议 reference，作为摘要 schema 与 noise policy 的单一真源。
- `skills/brainstorm/SKILL.md`：在 contract 中只登记真实需要分类的关键 claim。
- `skills/spec-rfc/SKILL.md`：要求 RFC 为关键 claim 设计三轴、证据和 verifier 路径。
- `skills/review-rfc/SKILL.md`：审查验证设计并输出统一摘要。
- `skills/verify-change/**`：新增认知验证 reference，并将 skill 扩展为 claim 分类、领域 verifier 路由和证据聚合器。
- `skills/review-change/SKILL.md`：审查 claim 状态、专业证据充分性和阶段级映射，并输出统一摘要。
- `skills/report-walkthrough/**`：聚合阶段摘要、认知状态和人类动作。
- `skills/legion-docs/**`：明确摘要嵌入既有阶段文档且不新增 attention 文档。
- `tests/regression/**`：增加协议一致性、中文 surface、阶段兼容与缺失 verifier 行为的回归检查。

### 不修改

- scheduler 状态机、标签、数据库和 worker 证据路径。
- `agent:needs-human` 的现有二元实现。
- 三种运行模式、阶段顺序、`git-worktree-pr` lifecycle。
- 现有 task 文档目录结构与 PR 平台行为。

## 验证（Verification）

实现完成后至少验证：

1. `review-rfc`、`verify-change`、`review-change` 都引用同一摘要协议，并包含完整字段、四级 attention 和三项上限。
2. `legion-workflow` 明确要求 orchestrator 在下一阶段前投影摘要，`REF_AUTOPILOT` 不再允许用单纯路径隐藏关键结论。
3. 三轴值、五种 claim 状态、延后字段、判断性主张和 verifier 返回字段由单一 reference 定义，各阶段引用而不复制出冲突枚举。
4. 缺少领域 verifier、verifier 未真实加载或需要外部 authority 时，协议只能导出 `INCONCLUSIVE` 与升级路径。
5. 回归 fixture 在 `review-rfc.md`、`review-change.md` 同时包含 claim 状态和 `## Verdict\n\nPASS` 时，现有 scheduler `hasPassVerdict` 仍可识别；`INCONCLUSIVE` 或 `DEFERRED` 不会被误当作阶段 PASS。
6. `SUBAGENT_DISPATCH_MATRIX.md` 的三条阶段链和三种模式不变，没有新增第四种模式或必经阶段。
7. `report-walkthrough` 明确聚合 attention 与 claim 状态，不重新发明证据。
8. 所有新增或改写的人类可读文案使用中文，技术标识、枚举、路径和命令保持可识别。
9. attention/lifecycle matrix 能阻止 `review` 越过 auto-merge，并保证 `decide` 优先于普通 `FAIL` 回退；决定记录包含持久化位置和确定的恢复阶段。
10. claim fixture 包含 `domain-id`、`required-capability`、`required-method`、`criticality`、`risk-if-wrong` 与 `blocking-policy`，聚合 attention 必须取所有未解决 claim 的最高等级。
11. verifier provenance 正例可由 `review-change` 重查 locator 与摘要；只写“已加载”但缺 provenance 的负例必须导出 `INCONCLUSIVE`。
12. authority evidence 正例覆盖主体、资质来源、范围、有效期、locator 与校验结果；缺失、过期、越界或校验失败的负例必须导出 `INCONCLUSIVE`。

执行命令：

```bash
npm run test:regression
npm --prefix scheduler test
git diff --check
```

人工抽查两个最小场景：

- routine objective claim 直接通过：阶段 `PASS`、attention `none` 或 `skim`，会话不展开空字段。
- 高风险 domain claim 且 verifier 缺失：claim `INCONCLUSIVE`、阶段 `FAIL`、attention `decide`，会话明确唯一决策与升级路径。

## 回滚（Rollback）

本次是协议与文档 surface 变更，不涉及数据迁移、外部 API 或 scheduler 持久化结构，可按单个 PR 整体回滚。

回滚顺序：

1. 恢复各阶段 skill、workflow reference、walkthrough 和 legion-docs 的原协议。
2. 删除新增的注意力与认知验证 reference。
3. 删除仅服务新协议的回归断言。
4. 重新运行根回归、scheduler 回归和 `git diff --check`。

兼容保护：

- 回滚前后都保留 `review-rfc.md` 与 `review-change.md` 的精确 `Verdict: PASS / FAIL` 区块；不得先删除该字段再观察 scheduler。
- 若上线后仅出现会话噪音过高，优先收紧 `none / skim` 投影和信息增量规则，不回滚完整证据或 claim 状态。
- 若领域路由误匹配，先禁用该 verifier 映射并将受影响 claim 降为 `INCONCLUSIVE`，不能保留未经证明的 PASS。
- 已写入 task 文档的 `DEFERRED`、`INCONCLUSIVE`、`RECOMMENDATION` 只是证据文本，不触发自动任务或外部副作用；回滚时可保留为历史记录。

## 风险与缓解

- **摘要变成新模板负担**：通过信息增量、三项上限、`none` 一行投影和不新增文档缓解。
- **分类过重**：只要求关键 claim 显式登记，routine claim 允许自动默认。
- **伪专家置信度更强**：要求真实加载、能力匹配、方法执行、独立性声明和反例尝试；缺失时强制 `INCONCLUSIVE`。
- **细粒度状态破坏阶段门**：claim 状态与 `Verdict: PASS / FAIL` 分层，scheduler 兼容格式保持不变。
- **延后验证被遗忘**：强制 owner、触发条件、方法和当前风险；本次明确不声称自动唤醒能力。
- **判断性主张被包装成事实**：限定为 `RECOMMENDATION`，只允许因决策过程完成而阶段 PASS。

## 开放问题

- attention 等级是否应在未来映射为 scheduler 的 `none / skim / review / decide` 队列，需要先收集真实会话中的噪音、人工介入次数和决策等待时间，本次不提前实现。
- `DEFERRED` 的自动唤醒与 owner 通知需要独立 task 设计，当前仅保证记录可被后续系统消费。
