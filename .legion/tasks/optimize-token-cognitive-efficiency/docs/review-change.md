# LegionMind token 与认知效率优化变更审查

## Blocking findings

无。

## 上一 blocker 关闭结论

上一轮 `review-change` 指出的 Markdown 结构注入 blocker 已关闭。

- `skills/report-walkthrough/scripts/render-report.mjs` 的 `markdown()` 先编码 `& < >`、加倍输入反斜线，再对 `|`、反引号及 `* _ [ ] ( ) { } # ! + - . ~` 逐字符加反斜线，最后才把输入换行转换为生成器控制的 `<br>`。因此用户提供的实体、反斜线和换行不能恢复链接、图片或行首块级语法。
- `[危险](javascript:alert(1))` 被写成 `\[危险\]\(javascript:alert\(1\)\)`，`![远程图](https://example.com/x.png)` 被写成 `\!\[远程图\]\(https://example\.com/x\.png\)`，换行标题被写成 `<br>\# 伪标题`；三者均为字面文本，不再形成主动 Markdown 结构。
- `tests/regression/token-cognitive-efficiency.test.ts` 对 `report-walkthrough.md` 与 `pr-body.md` 两个 sink 逐一执行上述三类正断言，并对未转义链接/图片语法执行负断言。本审查实例独立重跑定向回归，结果 `6/6` PASS。

因此，上一轮对 `OTCE-OBJECTIVE-003` 的反驳已不再成立；没有发现替代 blocker。

## Scope 结论

- 当前 change set 仍位于 contract/RFC 授权范围：入口与编排提示、核心 skills/references、上下文审计、子代理命名、报告 schema/template/renderer、回归及当前 task evidence。
- 未发现 scheduler/runtime 产品逻辑、外部依赖、数据迁移或范围外业务功能改动。
- 三个旧手工报告模板已删除；`report-walkthrough` 当前只允许填写 `report-data.json` 并由脚本生成 HTML、Markdown 与 PR body，没有保留手写兜底或第二真源。
- 人类可读新增内容使用中文，路径、命令、schema key、状态和代码标识保持原文，符合 contract 约束。

## 验证充分性与独立复核

更新后的 `docs/test-report.md` 已给出命令、exit code、结果标识、repo locator、主动反例、独立性和失效条件，足以从“方法 -> 证据 -> claim -> 状态”重算五个 claim。

本审查实例另外独立执行：

| 检查 | 结果 | 审查用途 |
|---|---:|---|
| `node --test --experimental-strip-types tests/regression/token-cognitive-efficiency.test.ts` | `6/6` PASS | 重算旧 blocker、入口、handoff、命名、schema/事务与旧模板退出 |
| `npm run audit:context` | exit 0 | 重算 hot/medium closure、单文件预算与强制 reference 清单 |
| `git diff --check` | exit 0 | 核对当前 change set 无 whitespace/error |

同时复核 verifier 留存的根回归 `31/31` 与 scheduler `57/57` 记录；两者均无 fail、skip 或 cancel。验证报告没有把字符数冒充精确 token，也没有把 fixture 通过外推到未覆盖的未来 Markdown 方言、进程强杀或断电场景。

## 五个 OTCE claim 独立重算

| claim-id | 独立状态 | 独立判断 | 独立性 / 置信度 |
|---|---|---|---|
| `OTCE-FORMAL-001` | `PASS` | 三层入口只改变 Legion 接管边界；三种模式、设计门、固定实现链、attention 门、PR lifecycle 与 scheduler 独立 Verdict 仍有现行真源和通过的正负 fixture。 | 执行 `high`、证据源 `medium` / `high` |
| `OTCE-OBJECTIVE-002` | `PASS` | 独立重算 hot `23,559/42,000`、medium closure `34,254/59,000`；20 个文件均在单项预算内，`unbudgetedRequiredReferences` 与 `failures` 为空。 | 执行 `high`、证据源 `high` / `high` |
| `OTCE-OBJECTIVE-003` | `PASS` | 命名格式/同批唯一、三层身份与固定权限职责、schema 条件、HTML/Markdown 转义、repo 路径、确定性和进程内事务恢复均有正负证据；两个 Markdown artifact 均直接覆盖上一 blocker 的三类输入。 | 执行 `high`、证据源 `medium` / `high` |
| `OTCE-OBJECTIVE-004` | `PASS` | 根回归 `31/31`、scheduler `57/57` 与 diff check 支持安装/CLI、attention/cognitive、PR evidence gate、独立 Verdict 和打包相关真源未回归。 | 执行 `high`、证据源 `high` / `high` |
| `OTCE-FORMAL-005` | `PASS` | attention 单一真源规定五字段机械映射、变化合计三条、风险保真、冲突失败及 `review/decide` 停止点；三个审查阶段均要求先落完整摘要再投影。 | 执行 `high`、证据源 `medium` / `high` |

五项均为 `PASS`，不存在未解决的 `block-stage` claim，阶段可聚合为 `PASS`。

## Verifier、authority 与特殊 claim 重查

- **Domain verifier**：不适用。五个 claim 均预注册为 `routine`，当前方法可由静态检查、Node/TAP、确定性计数与现有 scheduler 回归直接执行；没有用角色名、自述或多数意见替代证明。
- **Provenance**：routine claim 不触发领域 verifier 的 SHA-256/资源清单协议。更新后的验证报告保留了实际命令、参数、exit code、结果标识、证据 locator、反例与 claim 映射；未发现 locator 不可读或状态与证据冲突。
- **Authority evidence**：不适用。本任务不依赖外部主体、资质、签名、审计或有效期。
- **DEFERRED**：无。五个 claim 均为 `now`，没有未来触发协议被用来替代当前验收。
- **RECOMMENDATION**：无。五个 claim 均为 objective/formal，没有用偏好满足客观验收。

## 安全视角

本变更包含用户/证据文本进入 reviewer artifact、实例身份与权限选择、repo 文件路径等信任边界，已展开安全复核。

- **Markdown**：结构标记、输入反斜线、HTML 字符和换行的处理顺序保证自由文本只作为字面内容进入两份 Markdown artifact；上一链接、远程图片和换行标题 blocker 已关闭。
- **HTML/URL**：文本与属性按 HTML 上下文编码；可点击 URL 只来自额外校验后的无凭据 `https:` 值；质量门拒绝 script/link/img/iframe 与外部资源。
- **Schema**：根对象及关键子对象使用 `additionalProperties: false`，profile、attention、特殊 claim、verifier 和 evidence 类型存在条件约束；非法字段、状态缺项、locator 和 URL 均有负 fixture。
- **路径**：输入经 `realpath` 并限制在当前 `cwd` 的 repo 边界；evidence locator 拒绝绝对路径、`..` 与反斜线且只作展示，不被解引用。
- **事务**：三份产物在同目录事务目录生成，安装失败会删除新项并恢复 backup；注入 `after-first-install` 失败后旧产物摘要保持一致。
- **身份/权限**：`agentType` 继续独占固定职责与权限选择，随机 `displayName` 只用于实例辨识，`transportId` 只在 transport 提供独立实例字段时使用；OpenCode 固定 task type 未被随机名称替代。

未发现可利用的信任边界突破或新的安全 blocker。

## 功能完整性与残余风险

- HTML、schema、事务、repo 路径、命名权限、context budget、旧模板退出和当前打包/安装真源均未因 Markdown 修复回归。
- context scanner 仍是依赖当前措辞与 locator 形式的词法启发式；当前强制 reference 已由 manifest 覆盖并重算为空缺，属于未来维护风险，不反驳当前快照。
- renderer 把 `cwd` 作为 repo 边界，要求调用方从仓库根运行；当前 skill、命令和 fixture 均遵守该契约。
- 事务证据覆盖进程内异常恢复，不宣称抵抗进程强杀或断电；RFC 也未作该承诺。
- Unicode code point 是 tokenizer 无关代理指标，不是任一模型的精确 token 数。

这些限制均已如实收窄 claim，没有形成当前 blocker。

## 可选建议

无。

## Verdict

PASS

## 会话注意力摘要

- **阶段**：`review-change`
- **阶段结论**：`PASS`
- **注意力等级**：`skim`
- **判断变化**：上一轮对 `OTCE-OBJECTIVE-003` 的 Markdown 结构注入 blocker 已关闭；五个 OTCE claim 独立重算后均为 `PASS`。
- **关键发现**：1. 链接、远程图片和换行标题在 `report-walkthrough.md` 与 `pr-body.md` 中均只剩字面文本；2. 定向回归独立重跑 `6/6` PASS，context audit 与 diff check 均通过；3. HTML、schema、事务、路径、身份权限、预算、旧模板退出和功能不变量未发现回归。
- **阻塞项**：无。
- **残余风险**：context scanner 为词法启发式；repo 边界依赖仓库根 `cwd`；字符数不是精确 token；事务不覆盖进程强杀或断电。均不阻止继续。
- **人类动作**：知悉；无需介入。
- **自动下一步**：交回 `legion-workflow`，进入 `report-walkthrough`，随后继续 wiki 与 PR lifecycle。
- **完整证据**：`.legion/tasks/optimize-token-cognitive-efficiency/docs/review-change.md`；`.legion/tasks/optimize-token-cognitive-efficiency/docs/test-report.md`；`tests/regression/token-cognitive-efficiency.test.ts`
