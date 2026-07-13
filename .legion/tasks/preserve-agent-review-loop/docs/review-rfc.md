# RFC 对抗审查：保留多 Agent 评审循环并修复报告语义

审查实例：`review-rfc-nimble-ferret`

审查范围：当前 `plan.md`、`docs/rfc.md` 与必要的 renderer、schema、scheduler、OpenCode 权限和 Legion 阶段协议现状。本实例未参与 RFC 编写或修订，也不把复审期间出现的未提交实现草稿当作已通过实现验收。

## Verdict

PASS

## 独立结论

当前 RFC 已具备可实现、可验证、可回滚的设计边界，没有阻止进入 `engineer` 的 finding。它保留 `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change` 的不同阶段 Agent 循环，只把 token 优化放在按需读取、证据落盘与五字段短交接；同时没有把可观察的派生事件夸大为跨 transport 身份证明。

## 阻塞项复核

### 1. 共同的当前阶段结论解析可实现且 fail-closed

RFC §5.1 给出了单一、确定的解析语义：恰好一个规范 `## Verdict`，跳过空行与 HTML 注释后只接受单独一行的精确 `PASS` 或 `FAIL`，并明确拒绝缺失、重复、非精确值、代码块值和正文历史命中。renderer 与 scheduler 都运行在 Node ESM 环境；共同模块可以只接收 Markdown 文本并返回解析结果，两端各自负责受控读文件，因此没有同步/异步文件接口或 TypeScript/`.mjs` 边界上的不可实现问题。

RFC 还要求 renderer 与 `verifyLegionEvidence()` 调用同一纯解析器，并以对称负例覆盖历史 PASS 后当前 FAIL、JSON 自报 PASS 加文档 FAIL、重复/缺失标题和非精确值。这足以防止两端各保留宽松正则。实现验收必须通过源码引用或行为测试证明“同源”，不能只复制两份相同实现。

### 2. v1.1 的风险与运行模式绑定有真实外部输入

当前 scheduler 已有 `options.risk: low|medium|high`，`RunKind` 也明确包含 `implementation|design_only|brainstorm_only`。RFC §5.2 将根级必填 `risk` 与现有 `profile` 分开，并固定：

- `implementation -> implementation`；
- `design_only -> rfc-only`；
- `brainstorm_only` 不存在收口映射，进入最终门即拒绝；
- `data.risk` 必须与 `options.risk` 字面相等，不接受低报、高报或未知值。

renderer 的阶段集合和 scheduler 的外部绑定表已经逐 profile/risk 定义，且 §6 要求 low、medium、high 正例、自报降级、模式漂移和无映射 runKind 的双路径回归。scheduler 还必须先读取当前 task 的精确 `report-data.json`，核对 task id 和当前 task 内的规范 locator，再重开阶段文档；因此 JSON 内的 PASS、risk 或 profile 不能自行覆盖运行上下文。

### 3. 无 verifier 的领域/权威主张可以诚实收口

RFC §5.3 没有简单删除 verifier 约束，而是只允许当前未解决的 `INCONCLUSIVE|DEFERRED` 在缺 verifier 时进入集合 `U`，并强制：

- attention 按 `none < skim < review < decide` 至少为 `review`；
- 顶层只有一个非空标量 `humanAction`，同时必须有非占位的 `stopPoint`；
- 每个 claim 的非空 repo locator 必须精确出现在 `attention.evidence`；
- HTML 首屏、walkthrough Markdown 顶部和 PR body 顶部都显示 `未获得 verifier`、claim id、等级、唯一动作、停止点和 locator；
- 已提供 verifier 时，既有 kind、方法、独立性和 provenance 约束仍然生效。

`INCONCLUSIVE` 仍须给出 `evidenceGap` 与 `escalation`。`DEFERRED` 不是一句“以后再看”，而是结构化记录 trigger、method、required data 及验收条件、stop condition、successor task 和未来 onPass/onFail 动作。该设计能直接由 schema、semantic validator 与三份产物断言验证，不需要伪造 verifier。

### 4. DEFERRED 的时态和后续任务没有形成旧报告回写

RFC 明确把旧报告限定为生成时点的事实。触发被 owner 从指定数据源观察到后，旧报告只作为历史证据；owner 创建或恢复后续 task，记录触发原始证据、required data 对应关系与旧报告 locator，再真实派生新的 `verify-change -> review-change`，最后生成新的 v1.1 报告。旧 claim 不回写未来 PASS/FAIL，也不靠 `triggerObserved` 自报维持当前性。

这条路径没有假装 scheduler 会自动唤醒，触发观察与 task 重入仍是 owner/编排器的显式职责。两个 task fixture、旧报告内容不变和新阶段顺序都可执行验证。

### 5. v1.0 只读边界与回滚不矛盾

RFC §7 的“只读”是新生成器的协议边界：v1.0 输入在 schema/语义校验阶段被拒绝，不能进入输出事务；既有 v1.0 HTML、Markdown 与 PR body 保留为历史 artifact，不由 v1.0 输入重新生成。需要当前结论时，必须依据当前阶段证据重建 v1.1 输入，而不是原地篡改旧 claim。

§8 又要求 schema、共同 parser、renderer、scheduler gate、流程文字和权限作为一个协议单元回滚，并保留两版 artifact 与 DEFERRED 后续 task。实现测试应额外断言 v1.0 拒绝发生在任何输出写入之前，旧产物内容不变；这是对既有 RFC 测试条目的具体化，不构成设计 blocker。

### 6. OpenCode 权限修复保持兼容且没有扩大 JSON 面

RFC §5.5 精确保留现有 `.legion/tasks/**/docs/*.md: allow`，只新增 `.legion/tasks/**/docs/report-data.json: allow`，明确禁止 `*.json` 或其他 JSON 路径。`report-data.json` 是经过 schema 与语义校验的单一机器输入，用它一次生成 HTML、Markdown 与 PR body，避免三份手写产物漂移；它不是让人直接阅读的第四份报告。

“不手写生成物”被正确放在 skill/生成器流程层，而不是谎称 OpenCode 权限会拒绝 Markdown 编辑。正常 edit/write 创建 JSON、allowlist 精度和 renderer 原子生成分别有独立可执行验收。

### 7. 多 Agent 循环的保证范围诚实

RFC §5.4 要求每个阶段经真实 Codex `spawn` 或 OpenCode `task` 派生新的对应阶段 Agent；直接作者与直接 reviewer 不复用同一阶段会话，作者修订或验证重跑后重新派生 reviewer，FAIL 仍回到既有链路。`agentType` 只选职责，`displayName` 只供识别，`transportId` 只在 API 支持时使用。

设计同时承认实例 id 和运行日志只是审计线索，不能证明恶意编排器没有伪造身份；没有可查 id 时必须使用“已观察到不同派生事件，实例隔离未机械证明”的诚实降级文案。静态与调度测试只防工作流文档退化，不宣称 attestation。该边界保住了用户要求的实际评审循环，也避免引入当前仓库无法兑现的信任系统。

## 非阻塞实施注意

复审期间 worktree 已出现未提交的 v1.1 schema 与共同验证模块草稿。独立运行现有两项协议回归得到 12/13：唯一失败是旧测试 fixture 仍提交 `schemaVersion: 1.0` 且缺少根级 `risk`，被正在形成的 v1.1 门正确拒绝。这是实现阶段尚未同步 fixture 的普通缺口，不改变 RFC 的设计准入；它也不能被引用为新功能已通过。后续 `engineer` 必须完成实现和测试，再由新的 `verify-change` 与独立 `review-change` 给出实现结论。

执行命令：

```sh
node --test --experimental-strip-types --experimental-sqlite \
  tests/regression/attention-verification-protocol.test.ts \
  tests/regression/token-cognitive-efficiency.test.ts
```

## 实现准入

准入 `engineer -> verify-change -> review-change`。实现必须逐项落实 RFC §6 的 renderer/scheduler 对称门、无 verifier 三产物顶部投影、v1.0 不写输出、精确 OpenCode allowlist 与不同阶段 Agent 运行契约；任何实现测试失败都在后续实现/验证循环处理，不能用本设计 PASS 代替。

## 会话注意力摘要

- 阶段：`review-rfc`
- 阶段结论：`PASS`
- 注意力等级：`skim`
- 判断变化：相对上一版 RFC 未发现新的设计 blocker；共同 Verdict、风险/profile 外部绑定、无 verifier 收口、v1.0 边界、DEFERRED 重入和 Agent 隔离均已达到实现准入。
- 关键发现：
  1. renderer 与 scheduler 共享纯 Markdown 解析模块在当前 Node ESM 边界可实现，并有对称 fail-closed 验收。
  2. 无 verifier 的 domain/authority claim 不能以 `none/skim` 隐藏，三份人类产物顶部必须暴露唯一动作、停止点和证据 locator。
  3. 复审期间的未提交实现草稿使旧 fixture 产生 1 项预期迁移失败，尚未形成实现 PASS。
- 阻塞项：无。
- 残余风险：实现必须同步 v1.1 fixture，并证明 v1.0 拒绝不改写旧产物；阶段派生只能保证可观察运行合同，不能升级为身份 attestation。
- 人类动作：无需当前动作；实现完成后按正常 review 证据复核。
- 自动下一步：进入 `engineer`，完成后派生新的 `verify-change` 与独立 `review-change`。
- 完整证据：`.legion/tasks/preserve-agent-review-loop/docs/rfc.md`、`.legion/tasks/preserve-agent-review-loop/docs/review-rfc.md`、`scheduler/src/worker-runner.ts`、`skills/report-walkthrough/scripts/render-report.mjs`、`.opencode/agents/report-walkthrough.md`。
