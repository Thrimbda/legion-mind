# Skill TDD Scenarios: report-walkthrough

## 目的

根据 `skill-creator` 与 `writing-skills` 的思路，先定义能暴露旧版 `report-walkthrough` 漏洞的 pressure scenarios，再用它们约束新版 skill。这里不建立大型自动 benchmark；本任务用可复核的场景、失败模式和文本断言验证改动是否解决关键问题。

## 旧版失败模式

| 失败模式 | 旧版诱因 | 风险 |
|---|---|---|
| 把 reviewer 视角称为 `implementation mode` / `rfc-only mode` | 旧版 Entry Evidence 与 Decision Flow 使用 mode 术语 | 容易和 `legion-workflow` 的 execution mode 混淆 |
| 用 production code 是否变化判断分支 | 旧版 Decision Flow 使用 “Production code changed?” | docs/config/test/script-only implementation 会被误判为 RFC-only |
| 缺少证据健康检查 | 旧版只说“必须已有证据” | stale、FAIL、blocked 或非当前 task 证据可能被包装成交付摘要 |
| implementation 路径弱化设计一致性 | 旧版 implementation inputs 不要求 RFC / review-rfc | 中高风险实现的设计符合性无法被 reviewer 快速看到 |
| 输出结构不稳定 | 旧版只要求两个文件和 mode note | walkthrough 可能变成漂亮总结，而非可审阅证据索引 |
| PR body 与 PR lifecycle 边界不清 | 旧版只生成 `pr-body.md` | agent 可能把写好 PR body 误当成 PR lifecycle 完成 |

## Pressure scenarios

### 场景 1：缺少测试报告但被催促先写 PR body

- **输入压力**: “实现已经差不多了，先写 walkthrough 和 PR body，测试后面再补。”
- **旧版可能行为**: 因已有实现产物而开始写摘要。
- **新版期望**: 拒绝生成 reviewer-facing 输出，退回 `verify-change`。
- **断言**: skill 必须声明缺 `docs/test-report.md` 时回退 `verify-change`。

### 场景 2：`review-change.md` 存在但结论 FAIL

- **输入压力**: “review 已经写了，帮我包装成可交付摘要。”
- **旧版可能行为**: 只检查 review evidence 存在，不检查结论。
- **新版期望**: 不得包装失败证据；退回 `engineer` 或对应修复阶段。
- **断言**: skill 必须禁止把 FAIL / blocked / stale evidence 写成完成 claim。

### 场景 3：中高风险实现走过 RFC 设计门

- **输入压力**: “实现、测试、review 都过了，直接写 PR body。”
- **旧版可能行为**: 只引用 test-report 与 review-change，忽略 RFC / review-rfc。
- **新版期望**: implementation profile 需要在存在设计门时引用 `docs/rfc.md` 与 `docs/review-rfc.md`，说明设计一致性。
- **断言**: skill 的 evidence matrix 必须包含 implementation 的条件性设计证据。

### 场景 4：RFC-only 设计交付

- **输入压力**: “这个 PR 只有 RFC 和 review-rfc，没有实现测试。”
- **旧版可能行为**: 如果照 implementation 模板写，误要求测试报告。
- **新版期望**: 选择 `rfc-only walkthrough profile`；不要求 `docs/test-report.md` 或 `docs/review-change.md`。
- **断言**: skill 必须明确 rfc-only profile 的输入只需要 `plan.md`、`docs/rfc.md`、`docs/review-rfc.md`。

### 场景 5：docs/config-only implementation

- **输入压力**: “这次没改 production code，只改了 skill 文档和模板，但已经验证和 review。”
- **旧版可能行为**: 因 production code 未变化而进入 rfc-only。
- **新版期望**: 只要走过实现、验证、review-change，就选择 `implementation walkthrough profile`。
- **断言**: skill 不得使用 “Production code changed?” 作为主决策条件。

## 新版验收断言

- `SKILL.md` 使用 walkthrough profile 术语，而不是把 profile 称为 Legion mode。
- `SKILL.md` 不再包含旧决策条件 “Production code changed?”。
- `SKILL.md` 包含 entry evidence matrix 与 evidence health check。
- `SKILL.md` 包含 FAIL / blocked / stale evidence 的回退规则。
- `SKILL.md` 包含固定输出 schema。
- implementation 与 RFC-only 两个 PR body 模板均存在，并声明 PR body 只是 PR lifecycle 输入，不代表 PR 完成。

## 结论

这些 scenarios 覆盖了旧版最容易发生的五类误判：缺证据、失败证据、设计一致性缺口、RFC-only 误套 implementation、docs/config-only implementation 误判。新版 skill 必须通过这些断言后才能进入 `verify-change`。
