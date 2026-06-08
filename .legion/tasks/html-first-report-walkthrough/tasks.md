# HTML-first report-walkthrough output - 任务清单

## 快速恢复

**当前阶段**: 阶段 3 - 验证、review、walkthrough、wiki 与 PR lifecycle  
**当前检查项**: 完成 Git / PR lifecycle  
**进度**: 11/12 任务完成

---

## 阶段 1: 契约物化与 RFC 设计 ✅ DONE

- [x] 物化 task contract | 验收: `plan.md` / `tasks.md` 用中文定义目标、范围、非目标、约束与验收
- [x] 起草 HTML-first walkthrough RFC | 验收: RFC 明确 HTML 主 artifact、Markdown fallback、clean-doc/impeccable 原则、模板策略与验证路径
- [x] 完成 RFC 审查 | 验收: `docs/review-rfc.md` 结论 PASS，无 blocking findings

---

## 阶段 2: Skill 与 HTML template 实现 ✅ DONE

- [x] 更新 `report-walkthrough` skill | 验收: HTML-first 输出、clean-doc 选择原则、impeccable 设计原则、return conditions 与 exit evidence 完整
- [x] 新增 HTML walkthrough template reference | 验收: `TEMPLATE_REPORT_WALKTHROUGH_HTML.md` 可指导生成 standalone、响应式、print-friendly 的 HTML artifact
- [x] 保留 Markdown/PR body 边界 | 验收: Markdown 是 source/fallback，PR body 是 PR 输入，不与 HTML 主 artifact 或 lifecycle 混淆

---

## 阶段 3: 验证、review、walkthrough、wiki 与 PR lifecycle

- [x] 运行文本与格式验证 | 验收: HTML-first 断言、模板断言、设计禁忌断言、`git diff --check` 与 regression 结果记录到 `docs/test-report.md`
- [x] 完成 review-change | 验收: `docs/review-change.md` 结论 PASS，无 blocking findings
- [x] 生成 walkthrough / PR body | 验收: `docs/report-walkthrough.md`、`docs/report-walkthrough.html` 与 `docs/pr-body.md` 中文、可审阅、引用证据
- [x] 完成 wiki writeback | 验收: `.legion/wiki/**` 更新 HTML-first report-walkthrough 当前结论或模式
- [ ] 完成 Git / PR lifecycle | 验收: commit、push、PR、checks/review、终态、cleanup 与主工作区刷新按 `git-worktree-pr` 处理

---

## 发现的新任务

- (暂无)

---

*最后更新: 2026-06-06*
