# 独立变更审查：恢复未验证效果等价的报告边界

审查实例：`review-change-swift-penguin`

本实例未参与当前 corrective 报告、wiki 或任务交接的编写。审查范围严格限定为 `git diff origin/master`：恢复 `overall-effect-equivalence-ab = INCONCLUSIVE`、无 verifier、`attention: review` 与 corrective PR merge 前停止点，并确认已合并产品代码、多 Agent 阶段链和 FAIL 回退没有变化。

## Verdict

PASS

## 独立结论

当前 corrective 变更可以进入 commit、push、PR 与 checks，但不能越过 merge 门。它准确修复了 `origin/master` 中 `claims=[]` / `attention: skim` 与现有验证证据之间的交付语义矛盾：实现阶段证据继续为 `PASS`，真实多任务、多模型下新版总体效果与旧版完全等价则保持无 verifier 的 `INCONCLUSIVE`。这两个层级没有互相覆盖，也没有把结构性回归扩大成完整行为效果等价证明。

## Blocker

无实现、范围或证据一致性 blocker。

## Correctness 与状态聚合

1. `report-data.json` 当前只登记一个未解决主张 `overall-effect-equivalence-ab`。其状态为 `INCONCLUSIVE`、专业门槛为 `domain`，没有 `verifier` 字段；同时具备负责人、影响、当前缓解、证据 locator、证据缺口和真实升级方法，没有伪造来源、版本、方法执行或独立性。
2. 该 claim 的证据 locator 精确指向 `docs/test-report.md`，当前验证报告明确保留同一 claim id、无 verifier、`INCONCLUSIVE` 和 merge 前人工复核边界。`attention.evidence` 包含该 locator；聚合等级为 `review`，唯一人类动作和 `corrective PR 的 auto-merge/merge 前` 停止点均非占位值。
3. HTML、walkthrough Markdown 与 PR body 均投影出“未获得 verifier”、claim id、证据缺口、升级路径、唯一动作和停止点；wiki、plan、log 与 tasks 也把任务恢复为 active/corrective，而没有继续把 A/B 描述为 `claims=[]`、可选且不构成 merge gate。

根据认知验证协议，当前缺口属于可观测但尚未执行固定模型、固定任务 A/B、且当前未获得匹配 verifier 的领域证据不足。它不是阻塞实现阶段的 `FAIL`，但在被人类复核前构成 `review` 级 merge 门。后续若要改变 claim 状态，必须另行保存固定模型、固定任务套件、硬门违规、阶段轨迹、风险与停止点召回以及 token 消耗的原始输出，并重新派生 `verify-change -> review-change`；本审查不替 verifier 补造 provenance。

## Scope 与多 Agent 循环

- `git diff origin/master --name-only` 只包含当前 task 的 `report-data.json`、三份生成报告、`review-change.md`、plan/log/tasks，以及对应 wiki 当前真相；没有产品代码、schema、scheduler、权限或测试文件变化。
- 已合并的 RFC 作者与独立 `review-rfc`、engineer 与 `verify-change`、`verify-change` 与独立 `review-change` 阶段契约没有被修改；FAIL 回到对应作者阶段的语义也没有减损。
- token 结论仍只基于既有 context audit；corrective diff 没有通过删除阶段或证据来新增 token 优化主张。

## 验证充分性

本审查复用了当前任务已落盘且由 root 现跑确认的宽证据，没有冒充重新执行：定向组合 `36/36`、根回归 `40/40`、scheduler `59/59`、context audit 无 failures、发布包 dry-run `69` entries。当前 corrective diff 不修改这些行为面，因此没有重跑宽测试。

本实例只执行与纠偏范围直接相关的检查：

- `jq empty docs/report-data.json`：通过；
- corrective 文件 allowlist 静态检查：`SCOPE_OK`；
- 当前 claim、attention、唯一动作与 merge 停止点跨报告/wiki/任务文档扫描：一致；
- `node skills/report-walkthrough/scripts/render-report.mjs --input .../report-data.json --check`：通过，输出 `CHECK_OK preserve-agent-review-loop`；
- `git diff origin/master --check`：通过，无输出。

这些证据足以判断本次文档与派生产物纠偏正确，但不能证明完整行为效果等价；该限制已经由 claim 和 attention 门显式保留。

## Verifier、authority 与特殊 claim 重查

- 领域 verifier：`overall-effect-equivalence-ab` 当前未获得 verifier；没有可重算版本、资源清单、执行记录或原始 A/B 输出，因此保持 `INCONCLUSIVE`，不允许提升为 `PASS`。
- authority evidence：不适用；当前没有 authority claim，也没有签署、资质或外部权威结论。
- `DEFERRED`：无；没有用“以后再看”替代完整触发协议。
- `RECOMMENDATION`：无；固定模型、固定任务 A/B 是升级路径，不被包装成已决定的客观结论。

## 安全视角

历史实现涉及权限、证据路径和身份/信任边界，但本次 corrective diff 不改变任何权限规则或特权执行路径。它只收紧人类可见的信任表达：阻止无 verifier 的完整效果等价被 `claims=[]` / `skim` 隐藏。现有 TOCTOU 与跨 transport 身份 attestation 限制仍明确保留，没有被文档纠偏夸大为已解决；未发现新的安全 blocker。

## 可选建议

后续 A/B 任务应在执行前固定模型版本、任务套件、随机性、比较指标和原始输出 locator，再由新的 verifier/reviewer 独立判断。该建议不阻止 corrective PR 准备与 checks，但在当前唯一人类动作完成前仍禁止 auto-merge 或 merge。

## 会话注意力摘要

- 阶段：`review-change`
- 阶段结论：`PASS`
- 注意力等级：`review`
- 判断变化：相对 `origin/master`，当前权威报告已把被误降级的总体效果等价主张恢复为无 verifier 的 `INCONCLUSIVE`，并恢复 corrective PR merge 前的人类复核门。
- 关键发现：
  1. 阶段 `PASS` 与 claim `INCONCLUSIVE` 已分层表达，三份生成物和 wiki/任务当前真相一致。
  2. corrective diff 没有修改已合并产品代码、多 Agent 阶段链或 FAIL 回退。
  3. 既有宽验证足以支持结构、门禁、回退、路径安全与 token 闭包，但不能支持完整行为效果等价。
- 阻塞项：无。
- 残余风险：真实多任务、多模型旧新版本 A/B 尚未执行，`overall-effect-equivalence-ab` 仍无 verifier；普通文件系统 TOCTOU 与跨 transport 身份 attestation 仍不在已证明范围。
- 人类动作：确认本次只接受结构、门禁、回退、路径安全与 token 闭包的已验证结论，不将完整行为效果等价视为已证明。
- 自动下一步：允许准备 commit、push、corrective PR 与 checks；在上述复核落盘前停止 auto-merge、merge、cleanup 和完成声明。
- 完整证据：`.legion/tasks/preserve-agent-review-loop/docs/review-change.md`、`.legion/tasks/preserve-agent-review-loop/docs/report-data.json`、`.legion/tasks/preserve-agent-review-loop/docs/test-report.md`、`.legion/tasks/preserve-agent-review-loop/docs/verification-output.md`。
