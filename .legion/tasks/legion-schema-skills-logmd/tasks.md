# 拆分 Legion schema skills 并改用 log.md - 任务清单

## 快速恢复

**当前阶段**: (unknown)
**当前任务**: (none)
**进度**: 7/7 任务完成

---

## 阶段 1: 设计收口 🟡 IN PROGRESS

- [x] 基于现有分析文档确认 skill 拆分边界、owner 关系与 log.md 命名切换 | 验收: plan.md 明确目标、scope、风险和设计入口；必要决策已记录
- [x] 确定 wiki / summary / lint 的本轮落地范围，避免 scope 漂移 | 验收: plan.md 与 log 记录了本轮做与不做的边界

---

## 阶段 2: 实现迁移 🟡 IN PROGRESS

- [x] 创建新的 schema skills 并迁移 references/templates | 验收: 新 skills 目录可承载原 legionmind 与 subagents 的规则真源
- [x] 将 .opencode agents 瘦身为权限 + skill 加载壳 | 验收: 所有相关 agent 文件不再包含规则正文
- [x] 把 context.md 现行模型改为 log.md 并同步命令、脚本、文档 | 验收: 仓库现行入口与 schema 不再使用 context.md 作为标准文件名

---

## 阶段 3: 验证收口 🟡 IN PROGRESS

- [x] 检索并验证旧引用、漂移与遗漏 | 验收: 关键现行入口不再引用旧结构，残留项若存在则已明确标记为历史或待后续处理
- [x] 更新任务日志、状态和交付摘要 | 验收: log/tasks/handoff 已同步，产出可供后续 review 的总结

---

## 发现的新任务

(暂无)
- [ ] 确定 Legion CLI 与安装脚本的新默认 skill 路径归属（归入 legion-workflow） | 来源: 实现前代码梳理
- [ ] 验证 installer 已同步全部新 skills，而不是只同步 orchestrator skills | 来源: setup-opencode 重构
- [ ] 将 CLI verify 检查扩展到全部新 skills | 来源: 验证安装脚本时发现需要覆盖 subagent skills
- [ ] 为新 log 命名补充 smoke 覆盖 stable reviewId 与 ledger action | 来源: CLI 命名切换回归验证
- [ ] 确认设计迁移文档中的旧名仅作为历史分析出现 | 来源: repo 级 grep 收口
- [ ] 把 installer verify 的真实安装路径验证留给后续环境化测试 | 来源: 本轮仅做 repo 内 smoke 与静态检查
- [ ] 后续可单开任务推进 `.legion/wiki` / task summary / lint 配套 | 来源: 本轮 schema 切换已完成
- [ ] 后续如需严格遵守 writing-skills TDD，可单开任务补做 pressure scenarios 与 subagent baseline 测试 | 来源: writing-skills 规范要求
- [ ] 若后续再增新 mode，必须先更新 `SUBAGENT_DISPATCH_MATRIX.md` 再改 commands | 来源: 用户指出 dispatch 规则丢失
- [ ] 把 `llm-wiki` 的三层模型正式映射到 Legion：raw=`.legion/tasks/**`，wiki=`.legion/wiki/**`，schema=`skills/** + .opencode/**` | 来源: 用户选择方案 2 并要求实施
- [ ] 后续补更多历史 task summaries 与 historical/superseded 元数据 | 来源: 本轮只建立了首个 task summary 与 wiki 骨架


---

*最后更新: 2026-04-14 22:33*
