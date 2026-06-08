# HTML-first report-walkthrough output

## 目标

继续优化 `report-walkthrough` skill，使它以后生成 walkthrough 时默认产出基于相同原则的 HTML reviewer artifact：信息选择遵循 `clean-doc` 的读者/决策优先原则，界面呈现遵循 `impeccable` 的产品界面设计原则，并保留 Legion 证据链、阶段边界与 PR lifecycle 语义。

## 问题陈述

当前 `report-walkthrough` 已经强化为基于有效证据的 reviewer handoff 协议，但它的正式输出仍以 `docs/report-walkthrough.md` 为中心；HTML walkthrough 只是后续一次性手工 polish 的产物，没有进入 skill 的固定协议。结果是后续 agent 即使遵守 evidence health check，也可能继续产出平面 Markdown 摘要，而不是用户现在认可的 HTML walkthrough：有清晰信息层级、证据路径、终态突出、响应式/打印友好、设计禁忌约束和 PR lifecycle 边界。

## 验收标准

- [ ] `skills/report-walkthrough/SKILL.md` 明确 HTML-first walkthrough：`docs/report-walkthrough.html` 是 reviewer-facing 主 artifact。
- [ ] skill 保留 Markdown/PR body 的证据链角色：`docs/report-walkthrough.md` 可作为 compact source 或 fallback，`docs/pr-body.md` 仍是 PR 创建/更新输入。
- [ ] skill 明确 clean-doc 原则：先定义读者、决策任务、主路径、证据取舍和 certainty levels。
- [ ] skill 明确 impeccable 原则：standalone HTML、OKLCH、无 `#000/#fff`、无 gradient text、无 side-stripe accent、无默认 glassmorphism、无 hero-metric cliché、无 em dash、响应式与 print-friendly。
- [ ] skill 要求 HTML walkthrough 包含 profile、reviewer summary、scope、evidence map、delivery path、decisions、verification/review、risks、reviewer checklist、final state / next stage。
- [ ] 增加 HTML template/reference，能指导 future agent 生成同原则 HTML，而不是只靠聊天记忆。
- [ ] 更新 wiki，记录 `report-walkthrough` 当前输出从 Markdown-first 升级为 HTML-first。
- [ ] 产出 RFC、review-rfc、test-report、review-change、walkthrough、PR body 与 wiki writeback，所有任务文档使用中文。

## 假设 / 约束 / 风险

- **假设**: 用户所说“相同原则”指刚才使用 `impeccable` 与 `clean-doc` 生成并 polish 的 HTML walkthrough 原则，而不是只复制某个具体 HTML 文件。
- **约束**: 不改变 `legion-workflow` 阶段链；`report-walkthrough` 仍只做证据到 reviewer artifact 的转换。
- **约束**: 不让 `report-walkthrough` 补设计、补验证、补 review、补 wiki 或替代 PR lifecycle。
- **约束**: HTML artifact 必须 self-contained，不能依赖外部 CDN、字体、脚本或图片。
- **约束**: 文档输出使用中文；必要路径、字段名、HTML/CSS 术语保留原文。
- **风险**: 如果把完整 HTML 大模板写得过重，skill 会变成臃肿实现手册；应把核心原则放在 `SKILL.md`，把可复用骨架放入 references。
- **风险**: HTML-first 不能牺牲证据可追溯性；必须继续保留 evidence map 和 source links。

## 范围

- `skills/report-walkthrough/SKILL.md`
- `skills/report-walkthrough/references/TEMPLATE_REPORT_WALKTHROUGH_HTML.md`（新增）
- `.legion/tasks/html-first-report-walkthrough/**`
- `.legion/wiki/**`

## 非目标

- 不新增自动 Markdown-to-HTML 生成器或 CLI。
- 不把 HTML walkthrough 变成交互式应用或依赖 JS runtime。
- 不同步修改已安装到用户主目录的 skill。
- 不修改 `impeccable` 或 `clean-doc` skill 本身。
- 不把上一个任务的具体 HTML 文件作为唯一固定模板；本任务抽取原则和可复用结构。

## 设计摘要

- `report-walkthrough` 输出升级为 HTML-first：`docs/report-walkthrough.html` 是主 reviewer artifact。
- `docs/report-walkthrough.md` 保留为 compact source/fallback，用于证据映射、纯文本审阅或环境不适合打开 HTML 的场景。
- 新增 HTML 生成协议：先用 clean-doc 选择信息，再用 impeccable 约束界面。HTML 必须是 standalone、语义化、响应式、print-friendly、无设计禁忌。
- 新增 reference template，提供结构、设计 tokens、section 顺序和质量检查，不强迫每次复制同一个视觉皮肤。

## 阶段概览

1. **Phase 1** - 契约物化与 RFC 设计
2. **Phase 2** - skill 与 HTML template 实现
3. **Phase 3** - 验证、review、walkthrough、wiki 与 PR lifecycle

---

*创建于: 2026-06-06*
