# 把 AGENTS.md 提炼为 skill 并纳入 legion-workflow - 任务清单

## 快速恢复

**当前阶段**: 阶段 3 - 收口与同步（已完成）
**当前任务**: (none)
**进度**: 9/9 任务完成

---

## 阶段 1: 设计与建模 ✅ COMPLETE

- [x] 收敛 skill 名称、职责边界、与 legion-workflow 的集成点 | 验收: plan.md 明确风险等级、目标、范围与集成策略
- [x] 形成简版设计说明并确定需要保留在 AGENTS.md 的最小入口文本 | 验收: plan.md 或配套设计文档记录保留/迁移策略

---

## 阶段 2: 实现与验证 ✅ COMPLETE

- [x] 创建新 skill 并迁移 AGENTS.md 规则 | 验收: 新增 skill 目录与 SKILL.md，内容覆盖仓库入口规则
- [x] 更新 legion-workflow 与 AGENTS.md 以纳入新 skill | 验收: workflow/入口文案明确引用新 skill 且无相互冲突
- [x] 执行 skill-creator 校验 | 验收: 校验脚本通过，或失败点被修复并记录

---

## 阶段 3: 收口与同步 ✅ COMPLETE

- [x] 更新任务上下文、验证结论与交付摘要 | 验收: context/tasks 文档与必要报告同步完成
- [x] 修正 legion agent 的 skill allowlist 并补齐 installer 对 agent-entry 的安装清单 | 验收: legion agent 可加载任意 skill；安装脚本会同步安装 agent-entry；验证结果写回任务文档
- [x] 记录命令体系不再追加适配 | 验收: 用户已明确 commands 视为废弃；本轮不修改 `.opencode/commands/**`，并在 context / playbook 留痕
- [x] 修复 legion-wiki task summary 的死链而不引入 legacy 命名兼容 | 验收: 模板要求缺失 raw source 直接省略；已有 summary 不再指向不存在的 `log.md`

---

## 发现的新任务

(暂无)


---

*最后更新: 2026-04-15 09:50*
