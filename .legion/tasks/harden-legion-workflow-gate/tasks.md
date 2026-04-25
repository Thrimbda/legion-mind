# Harden legion-workflow gate - 任务清单

## 快速恢复

**当前阶段**: 阶段 3 - 入口文档与验证
**当前检查项**: 补充状态图与流转文字
**进度**: 9/9 任务完成

---

## 阶段 1: Baseline 与契约 ✅ COMPLETED

- [x] 记录当前 `legion-workflow` 在门禁压力场景下的 baseline 漏洞 | 验收: 至少覆盖先探索、小改动、恢复不明确、自动推进误读、收口省略
- [x] 物化 task contract | 验收: `plan.md` / `tasks.md` 清楚定义目标、范围、非目标和验收标准

---

## 阶段 2: Skill 与 references 更新 ✅ COMPLETED

- [x] 强化 `skills/legion-workflow/SKILL.md` | 验收: 包含 1% 门禁、SUBAGENT-STOP、优先级、Entry Checklist、rationalization table、真实加载阶段 skill 要求
- [x] 同步 workflow references | 验收: 矩阵、自动推进、设计门禁与 skill 不冲突

---

## 阶段 3: 入口文档与验证 ✅ COMPLETED

- [x] 同步 README / AGENTS / OpenCode agent 入口叙事 | 验收: 均表达 workflow 是强制第一道门
- [x] 记录 after 预期与执行模式分类 | 验收: 区分三种执行模式与三种入口运行状态
- [x] 运行一致性检查 | 验收: 搜索关键术语无明显矛盾，git diff 可审阅
- [x] 更新日志与 handoff | 验收: `log.md` 反映进展、决策和后续验证建议
- [x] 补充 workflow 状态图与流转文字 | 验收: `SKILL.md` 包含入口状态机、mode selector、阶段链与回退，并明确 completion / rollback 规则

---

## 发现的新任务

- (暂无)

---

*最后更新: 2026-04-25*
