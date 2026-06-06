# RFC: 强化 report-walkthrough 为证据到评审者的收口协议

## 1. 背景

`report-walkthrough` 位于 Legion 实现链与设计-only 链的收口阶段，负责生成 reviewer-facing 的 `docs/report-walkthrough.md` 与 `docs/pr-body.md`。它应该只整理已有证据，不补设计、不补验证、不替代 `review-change` / `review-rfc`，也不替代 `legion-wiki` 或 `git-worktree-pr` 的 PR lifecycle。

当前版本已经表达了这个方向，但协议不够硬，主要问题包括：

- 使用 `implementation mode` / `rfc-only mode`，容易和 `legion-workflow` 的 execution mode 混淆。
- 用 “Production code changed?” 判断输出分支，容易把 docs/config/test/script-only 的实现交付误判为 RFC-only。
- 只要求“已有证据”，没有检查证据是否属于当前 task、是否对应当前交付状态、是否 PASS / non-blocked、是否 stale。
- implementation 路径没有明确要求在存在 RFC / review-rfc 时引用设计一致性证据。
- 失败、阻塞或过期证据的回退路径不完整。
- 缺少稳定的 walkthrough 输出 schema，也缺少 implementation PR body 模板。

## 2. 目标

- 将 reviewer 输出分支定义为 walkthrough profile，而不是 Legion execution mode。
- 让 profile 选择基于当前阶段链和证据，而不是 production code 是否变化。
- 在进入输出前建立证据健康检查，禁止把缺失、失败、阻塞或过期证据包装成交付摘要。
- 固化 `report-walkthrough.md` 与 `pr-body.md` 的最小结构，帮助 reviewer 快速判断 scope、证据、风险和下一阶段。
- 增加 implementation PR body 模板，并收敛 RFC-only 模板。
- 用 skill-creator / writing-skills 的 TDD 思路记录 pressure scenarios 与验证断言。

## 3. 非目标

- 不修改 `legion-workflow` 的三种 execution mode。
- 不让 `report-walkthrough` 补测试、补设计、补 review 或完成 wiki writeback。
- 不把 `pr-body.md` 等同于 PR 已创建、checks 已通过、review 已处理或 PR lifecycle 已完成。
- 不新增大型自动 skill benchmark harness。
- 不同步修改用户主目录下已安装的 skill；本任务只改仓库源文件。

## 4. 设计方案

### 4.1 术语：walkthrough profile

将原先的 `implementation mode` / `rfc-only mode` 改为：

- `implementation walkthrough profile`
- `rfc-only walkthrough profile`

原因：`legion-workflow` 已经定义 execution mode；`report-walkthrough` 只决定 reviewer 文档输出视角，不能暗示它新增流程模式。

### 4.2 Profile 选择规则

不再使用 “Production code changed?” 作为主判断。

推荐规则：

| 当前证据形态 | 选择 |
|---|---|
| 已有实现结果、验证报告与 `review-change` | `implementation walkthrough profile` |
| 仅交付设计产物，且已有 `rfc.md` 与 `review-rfc.md` | `rfc-only walkthrough profile` |
| docs/config/test/script-only 但走过实现、验证、review-change | `implementation walkthrough profile` |
| 证据不足、失败、阻塞或无法判断当前性 | 不写 walkthrough，退回对应前置阶段 |

### 4.3 Entry evidence matrix

| Profile | 必需证据 | 条件性证据 |
|---|---|---|
| implementation | `plan.md`、实现交接或 changed files、`docs/test-report.md`、`docs/review-change.md` | 若存在设计门：`docs/rfc.md`、`docs/review-rfc.md` |
| rfc-only | `plan.md`、`docs/rfc.md`、`docs/review-rfc.md` | 若存在 PR lifecycle：PR body 需说明 merge 代表设计批准，而非实现完成 |

进入前必须检查：

- 证据属于当前 task。
- 证据对应当前交付状态，而不是旧 diff 或旧阶段。
- review 类证据结论不是 FAIL / blocked。
- verification 类证据不是 skipped-only，也没有未处理的实现缺口。
- walkthrough 中的每个完成性 claim 都能指向证据来源。

### 4.4 Return conditions

| 发现 | 回退 |
|---|---|
| 缺 `docs/test-report.md` | `verify-change` |
| 缺 `docs/review-change.md` | `review-change` |
| `review-change` 为 FAIL / blocked | `engineer` 或对应修复阶段 |
| 缺 `docs/review-rfc.md` | `review-rfc` |
| `review-rfc` 为 FAIL / blocked | `spec-rfc` |
| 证据 stale 或不属于当前 task | 回到生成该证据的前置阶段 |
| 需要补设计/验证/review 才能说明结论 | 不在 walkthrough 内补，退回对应阶段 |

### 4.5 输出 schema

`docs/report-walkthrough.md` 应至少包含：

```md
# Report Walkthrough

## Profile
implementation | rfc-only

## Reviewer Summary
- ...

## Scope
In scope:
Out of scope:

## Evidence Map
| Claim | Evidence | Status |
|---|---|---|

## What Changed / What Was Decided
...

## Verification / Review Status
...

## Risks and Limits
...

## Reviewer Checklist
- [ ] ...

## Next Stage
交给 `legion-wiki`；若处于 PR-backed lifecycle，`pr-body.md` 仅作为 PR 创建/更新输入。
```

实际任务文档按用户要求使用中文；英文标题可作为稳定字段名保留，但正文必须中文。

`docs/pr-body.md` 应按 profile 选择模板：

- implementation: 说明改动、验证、review、风险、链接证据与 reviewer checklist。
- rfc-only: 说明本 PR 仅为设计批准，不代表实现完成。

两种模板都必须声明：PR body 不是 PR lifecycle 终态，不代表 checks/review/merge 已完成。

### 4.6 Skill TDD scenarios

记录五类 pressure scenarios：

1. implementation 任务缺 `test-report.md`，agent 被要求“先写 PR body”。期望退回 `verify-change`。
2. `review-change.md` 存在但结论 FAIL。期望不能包装成交付摘要。
3. 中高风险实现任务具备 RFC、review-rfc、test-report、review-change。期望 walkthrough 显式串联设计一致性。
4. RFC-only 任务具备 RFC 与 review-rfc。期望不要求 test-report，不使用 implementation 模板。
5. docs/config-only implementation 有 test-report 与 review-change。期望不能因 production code 未变而误判为 RFC-only。

本任务不建立大型自动 benchmark；但会用这些 scenarios 提炼文本断言并在验证报告中记录结果。

## 5. 替代方案

### 方案 A：只补几个 Must Not 条目

- **优点**: 改动最小。
- **缺点**: 不能解决 mode 术语冲突、profile 误判和输出 schema 不稳定；agent 仍可能在缺证据时写摘要。
- **结论**: 不采用。

### 方案 B：把 report-walkthrough 并入 legion-workflow

- **优点**: 主流程可集中表达收口条件。
- **缺点**: 让 `legion-workflow` 过载，并把阶段职责混到入口门里。
- **结论**: 不采用。

### 方案 C：强化 report-walkthrough 自身协议（推荐）

- **优点**: 保持阶段边界清晰；直接修复 profile、证据健康检查、回退和输出结构。
- **缺点**: 需要增加模板和验证断言。
- **结论**: 采用。

## 6. 实施计划

1. 写入 `docs/skill-tdd-scenarios.md`，记录 pressure scenarios、旧版失败模式和新断言。
2. 更新 `skills/report-walkthrough/SKILL.md`：
   - frontmatter description 只表达触发条件；
   - 正文引入 walkthrough profile；
   - 增加 evidence matrix、health check、return conditions、输出 schema、PR lifecycle 边界。
3. 新增 `references/TEMPLATE_PR_BODY_IMPLEMENTATION.md`。
4. 收敛 `TEMPLATE_PR_BODY_RFC_ONLY.md`，明确设计-only 与 lifecycle 边界。
5. 运行文本断言、`git diff --check`，并视依赖情况运行 `npm run test:regression` 或记录跳过原因。
6. 完成 `review-change`、`report-walkthrough`、`legion-wiki` 与 PR lifecycle。

## 7. 验证计划

- 文本断言：检查 `SKILL.md` 包含 profile 术语、证据矩阵、health check、return conditions、输出 schema、PR body lifecycle 边界。
- 负向断言：检查旧的 “Production code changed?” 不再作为 decision flow 条件；不再把 `implementation mode` / `rfc-only mode` 当作当前术语。
- 模板断言：检查 implementation 与 RFC-only 两个模板均存在、均包含 evidence links 和 lifecycle disclaimer。
- 格式断言：运行 `git diff --check`。
- 回归验证：若环境依赖可用，运行 `npm run test:regression`；若失败与本次文本改动无关，记录原因。

## 8. 回滚策略

- 所有改动集中在 `skills/report-walkthrough/**` 与当前 `.legion/tasks/harden-report-walkthrough/**`，可通过 revert 本 PR 回滚。
- 新模板是 additive；若发现模板不合适，可只移除新增 implementation 模板并保留 skill 的证据健康检查。
- 不修改 workflow 执行模式，因此回滚不会影响 `legion-workflow` 主干阶段链。

## 9. 风险与缓解

| 风险 | 缓解 |
|---|---|
| 规则太硬导致 RFC-only 被误退 | 明确 rfc-only profile 不要求 test-report / review-change |
| docs/config-only implementation 被误判 | 明确 profile 基于阶段链和证据，不基于 production code |
| Skill 过长影响可读性 | 使用矩阵和短 schema，避免长篇实现手册 |
| PR body 被误解为 lifecycle 完成 | 在 skill 与模板中明确 PR body 只是创建/更新输入 |

## 10. 决策

采用方案 C：强化 `report-walkthrough` 自身协议，用 walkthrough profile、证据健康检查、稳定输出 schema 和双 PR body 模板，把它从“摘要生成提示”升级为“基于有效证据的 reviewer handoff 协议”。
