# RFC: report-walkthrough 输出升级为 HTML-first reviewer artifact

## 1. 背景

上一轮 `harden-report-walkthrough` 已经把 `report-walkthrough` 强化为基于有效证据的 reviewer handoff 协议：它使用 walkthrough profile，进入前检查 evidence health，不把 FAIL / blocked / stale evidence 包装成交付摘要，也不把 PR body 当成 PR lifecycle 完成。

随后用户要求用 `impeccable` 与 `clean-doc` 生成 HTML walkthrough，并进一步 polish 后写入文件。该 HTML artifact 展示了更适合 reviewer 的交付形态：主结论和终态靠前、证据路径可扫读、交付链可视化、响应式和 print-friendly，同时遵守设计禁忌和信息取舍原则。

当前问题是：这个 HTML 只是一次性产物，没有进入 `report-walkthrough` skill 的正式输出协议。未来 agent 仍可能只生成 Markdown walkthrough，或者随意生成 HTML，导致信息结构、视觉原则和证据边界不稳定。

## 2. 目标

- 把 `docs/report-walkthrough.html` 定义为 `report-walkthrough` 的主 reviewer-facing artifact。
- 保留 `docs/report-walkthrough.md` 作为 compact source / fallback，保留 `docs/pr-body.md` 作为 PR 创建或更新输入。
- 将 `clean-doc` 原则写入 skill：先定义 reader、decision task、main path、evidence selection、certainty levels。
- 将 `impeccable` 原则写入 skill：standalone HTML、OKLCH、无设计禁忌、响应式、print-friendly、语义化结构。
- 新增 HTML template/reference，帮助 future agent 生成同原则 HTML，而不是依赖聊天上下文记忆。

## 3. 非目标

- 不新增 CLI、脚本或自动 Markdown-to-HTML 生成器。
- 不把 HTML walkthrough 做成交互式应用，不依赖外部 JS、CDN、字体或图片。
- 不修改 `impeccable`、`clean-doc`、`legion-workflow` 或其他阶段 skill。
- 不把上一个 HTML 文件逐字复制成唯一模板；本任务抽取可复用原则和结构。
- 不取消 Markdown evidence source 或 PR body。

## 4. 设计方案

### 4.1 输出语义

`report-walkthrough` 的 exit evidence 调整为：

| Artifact | 角色 |
|---|---|
| `docs/report-walkthrough.html` | 主 reviewer-facing artifact，面向浏览器、截图、打印和视觉扫读 |
| `docs/report-walkthrough.md` | compact source / fallback，承载纯文本证据映射和 HTML 不可用时的审阅路径 |
| `docs/pr-body.md` | PR 创建/更新输入，不代表 PR lifecycle 完成 |

HTML-first 不等于 HTML-only；这是为了让 reviewer 默认获得更好的信息层级，同时保留纯文本证据与 PR workflow 兼容性。

### 4.2 Clean-doc 信息选择协议

生成 HTML 前必须先确定：

- **Reader**: reviewer / maintainer / technical lead。
- **Situation**: 对方需要快速判断是否可信、是否可合并、是否有未处理风险。
- **Decision task**: approve / request changes / inspect evidence / continue lifecycle。
- **Main path**: profile、summary、scope、evidence、delivery path、verification/review、risks、final state。
- **Evidence selection**: 只保留会改变判断、风险认知或行动的信息；低价值历史压缩到 raw links。
- **Certainty levels**: facts、review results、risks、limits、next stage 必须分开。

### 4.3 Impeccable HTML 设计协议

HTML walkthrough 必须是 standalone single file，并满足：

- 使用语义化 HTML：`header`、`main`、`nav`、`section`、`table`、清晰 heading hierarchy。
- 使用 OKLCH 色彩，不使用 `#000` / `#fff`。
- 不使用 gradient text、side-stripe accent、默认 glassmorphism、hero-metric cliché、identical card grid。
- 不使用 em dash；中文正文用自然短句，代码符号和路径保留。
- 顶部突出 profile、verification/review、PR state 或 next stage。
- 必须包含 evidence map 和 delivery path，使 reviewer 能从 claim 跳到 evidence。
- 响应式布局，窄屏不丢信息；提供 print-friendly CSS。
- 不依赖外部网络资源，不加载远程字体、脚本或图片。

### 4.4 HTML 必备 sections

`docs/report-walkthrough.html` 至少包含：

1. Profile
2. Reviewer Summary
3. Scope
4. Evidence Map
5. Delivery Path
6. What Changed / What Was Decided
7. Verification / Review Status
8. Risks and Limits
9. Reviewer Checklist
10. Final State / Next Stage

这些 sections 与新版 Markdown walkthrough schema 对齐，但 HTML 应通过布局、节奏、状态标识和证据路径提升扫读效率。

### 4.5 Reference template 策略

新增 `skills/report-walkthrough/references/TEMPLATE_REPORT_WALKTHROUGH_HTML.md`：

- 提供 HTML artifact contract。
- 提供可复制的 section skeleton 和 CSS/token quality checklist。
- 不要求每次使用同一视觉皮肤；允许根据任务类型和证据密度调整布局。
- 明确 absolute bans 和 validation assertions。

## 5. 替代方案

### 方案 A：只在 skill 中加一句“也可以生成 HTML”

- **优点**: 改动小。
- **缺点**: 无法保证 clean-doc / impeccable 原则落地，也无法保证 HTML 成为主 artifact。
- **结论**: 不采用。

### 方案 B：新增脚本自动从 Markdown 生成 HTML

- **优点**: 输出稳定，可重复。
- **缺点**: 会扩展到 generator 设计、测试和维护；当前用户要求是优化 skill 原则，不是构建转换工具。
- **结论**: 本任务不采用，可作为未来独立任务。

### 方案 C：HTML-first skill protocol + reference template（推荐）

- **优点**: 直接解决当前输出协议问题；保留人工/agent 生成的灵活性；不会新增 runtime 依赖。
- **缺点**: 未来 HTML 质量仍依赖 agent 遵守 skill 和 template，需要断言验证关键规则。
- **结论**: 采用。

## 6. 实施计划

1. 更新 `skills/report-walkthrough/SKILL.md`：
   - exit evidence 增加 `docs/report-walkthrough.html`；
   - 增加 HTML-first 语义；
   - 增加 clean-doc 信息选择协议；
   - 增加 impeccable HTML quality gate；
   - 更新 return conditions、red flags 和 references。
2. 新增 `references/TEMPLATE_REPORT_WALKTHROUGH_HTML.md`，包含 HTML skeleton、CSS/design constraints、section contract 和 validation checklist。
3. 用当前任务生成 `docs/report-walkthrough.md`、`docs/report-walkthrough.html` 和 `docs/pr-body.md`，验证 skill 能表达新协议。
4. 更新 wiki patterns 和 task summary。

## 7. 验证计划

- 文本断言：`SKILL.md` 必须包含 `docs/report-walkthrough.html`、HTML-first、clean-doc、impeccable、OKLCH、print-friendly、no external resources、PR body lifecycle 边界。
- 模板断言：HTML template reference 必须包含 required sections、absolute bans、validation checklist。
- 负向断言：不能把 HTML-only 写成唯一输出；不能移除 Markdown source/fallback；不能把 PR body 当作 lifecycle 完成。
- HTML smoke test：当前任务生成的 HTML 必须能被 Python `html.parser` 解析，包含 `<!doctype html>`、`lang="zh-CN"`、viewport、OKLCH、evidence map、delivery path，且不包含 `background-clip: text`、`#000`、`#fff`、em dash。
- 格式检查：`git diff --check`。
- 回归验证：运行 `npm run test:regression`，确保仓库现有 skill surface 和 setup regression 不受影响。

## 8. 回滚策略

- 变更集中在 `skills/report-walkthrough/**`、当前 task docs 和 wiki；可通过 revert 本 PR 回滚。
- 新增 HTML reference template 是 additive；若发现过重，可移除 template 并保留 HTML-first 原则。
- 不修改运行时脚本或 workflow 阶段链，回滚不会影响 CLI 或主流程。

## 9. 风险与缓解

| 风险 | 缓解 |
|---|---|
| HTML template 过度规定视觉，导致所有 walkthrough 同质化 | 在 template 中写原则和结构，不要求固定视觉皮肤 |
| HTML-first 让 Markdown 证据链弱化 | 明确 Markdown 是 compact source/fallback，仍需 evidence map 和 raw links |
| agent 生成 HTML 时引入外部依赖 | skill 和 template 禁止 CDN、外部字体、脚本、图片 |
| 设计禁忌被忘记 | 在 skill、template 和验证断言中加入 absolute bans |

## 10. 决策

采用方案 C：将 `report-walkthrough` 升级为 HTML-first 输出协议，`docs/report-walkthrough.html` 成为主 reviewer artifact；Markdown 保留 source/fallback，PR body 保留 PR 输入角色；HTML 生成同时遵守 clean-doc 信息选择和 impeccable 界面质量原则。
