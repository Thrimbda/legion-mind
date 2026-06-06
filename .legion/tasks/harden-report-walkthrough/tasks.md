# Harden report-walkthrough skill - 任务清单

## 快速恢复

**当前阶段**: 阶段 3 - 验证、review、walkthrough、wiki 与 PR lifecycle  
**当前检查项**: 完成 Git / PR lifecycle  
**进度**: 11/12 任务完成

---

## 阶段 1: 契约物化与 RFC 设计 ✅ DONE

- [x] 物化 task contract | 验收: `plan.md` / `tasks.md` 用中文定义目标、范围、非目标、约束与验收
- [x] 起草 `report-walkthrough` 优化 RFC | 验收: RFC 明确 profile、证据矩阵、失败回退、输出 schema 与模板策略
- [x] 完成 RFC 审查 | 验收: `docs/review-rfc.md` 结论 PASS，无 blocking findings

---

## 阶段 2: Skill TDD scenarios 与实现 ✅ DONE

- [x] 记录 pressure scenarios 与旧版失败模式 | 验收: `docs/skill-tdd-scenarios.md` 覆盖缺证据、FAIL 证据、RFC-only、docs/config-only implementation、中高风险实现
- [x] 更新 `report-walkthrough` skill | 验收: profile 语义、证据健康检查、回退路径和输出 schema 完整
- [x] 增加 implementation PR body 模板 | 验收: implementation 与 RFC-only 模板均支持 reviewer 快速判断
- [x] 保持 description 只表达触发条件 | 验收: 不把完整流程摘要塞进 frontmatter description

---

## 阶段 3: 验证、review、walkthrough、wiki 与 PR lifecycle

- [x] 运行文本与一致性验证 | 验收: 关键断言通过，`npm run test:regression` 或合理 targeted 验证记录在 `docs/test-report.md`
- [x] 完成 review-change | 验收: `docs/review-change.md` 结论 PASS，无 blocking findings
- [x] 生成 walkthrough / PR body | 验收: `docs/report-walkthrough.md` 与 `docs/pr-body.md` 中文、可审阅、引用证据
- [x] 完成 wiki writeback | 验收: `.legion/wiki/**` 更新 report-walkthrough 当前结论或模式
- [ ] 完成 Git / PR lifecycle | 验收: commit、push、PR、checks/review 跟进、终态、cleanup 与主工作区刷新按 `git-worktree-pr` 处理

---

## 发现的新任务

- (暂无)

---

*最后更新: 2026-06-06*
