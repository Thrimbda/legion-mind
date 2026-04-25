# Add Git worktree PR envelope - 任务清单

## 快速恢复

**当前阶段**: 阶段 3 - 验证与交付
**当前检查项**: 无（已完成）
**进度**: 11/11 任务完成

---

## 阶段 1: 契约物化与 RFC 设计 ✅ DONE

- [x] 物化 task contract | 验收: `plan.md` / `tasks.md` 定义目标、范围、非目标、约束与验收
- [x] 起草 Git worktree PR envelope RFC | 验收: RFC 明确 skill、workflow、AGENTS、autopilot、envelope schema 的分工
- [x] 完成 RFC 审查 | 验收: `review-rfc.md` 无 blocking 问题

---

## 阶段 2: Skill 与 workflow 实现 ✅ DONE

- [x] 新增 `git-worktree-pr` skill | 验收: hard gate、阶段、禁止事项、completion 条件完整
- [x] 同步 `legion-workflow` 与 dispatch/autopilot/envelope refs | 验收: Git envelope 是外壳，不新增执行模式
- [x] 同步入口文档 | 验收: `AGENTS.md`、OpenCode agent、README 均表达强制 worktree/PR lifecycle
- [x] 更新安装资产清单 | 验收: `setup-opencode` 会同步并 strict-verify `git-worktree-pr` skill

---

## 阶段 3: 验证与交付 ✅ DONE

- [x] 运行 targeted 文档一致性验证 | 验收: 三种执行模式未变，Git envelope 规则一致，安装资产清单包含新 skill，`git diff --check` 通过
- [x] 完成 review-change | 验收: 无 blocking findings
- [x] 生成 walkthrough / PR body | 验收: reviewer 可直接理解集成方式与证据
- [x] 完成 wiki writeback | 验收: durable pattern / task summary 更新

---

## 发现的新任务

- (暂无)

---

*最后更新: 2026-04-25*
