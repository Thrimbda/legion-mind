# 反哺 llm-wiki skill 的复利与 schema guidance - 任务清单

## 快速恢复

**当前阶段**: (unknown)
**当前任务**: (none)
**进度**: 3/3 任务完成

---

## 阶段 1: 方向复盘 ✅ COMPLETE

- [x] 定位现有 skill 中所有 host-adaptive / 多情况处理表述 | 验收: 明确列出需要删除的 host-schema handshake、等价导航/日志机制、宿主覆盖与多目录情况分支

---

## 阶段 2: opinionated 重写 ✅ COMPLETE

- [x] 把 llm-wiki skill 改成单一 canonical wiki 方案并删除不再需要的模板/分支 | 验收: skill 不再依赖宿主 schema 决定目录、页型、导航与日志机制；所有写回都发生在 canonical wiki 结构内

---

## 阶段 3: 验证与交付 🟡 IN PROGRESS

- [x] 运行 skill-creator validate 与文本回归检查，确认新契约一致 | 验收: quick_validate PASS、diff checks PASS，且探索型检查确认 skill 呈现单一有主见方案

---

## 发现的新任务

- [x] 用 explore 子代理做一次 RED-phase skill loophole probe，并把 failing scenarios 映射到具体文档改动 | 来源: writing-skills RED baseline
- [x] 修正 plan.md 中任务 scope 的任务目录路径，避免与自动生成的 taskId 不一致 | 来源: 创建任务后发现的范围镜像漂移
- [x] 修正 SKILL.md description 中的主语语法（Agents needs → Claude needs）以避免 skill-creator 风格瑕疵 | 来源: 校验前自检
- [x] 用户要求移除“根据情况而定”的 product direction，改为全权管理授权 wiki 目录的单一有主见方案 | 来源: 2026-04-11 用户新指令
- [x] 用 explore 子代理确认改写后的 skill 已经呈现单一 canonical product direction | 来源: GREEN-phase 回归检查
- [ ] 用户要求把 writing-skills 风格流程图补回 llm-wiki SKILL.md | 来源: 2026-04-13 用户反馈
- [ ] 用户强调 writing-skills 风格流程图在此 skill 中是重要组成，不应在产品方向重写时被删掉 | 来源: 2026-04-13 用户反馈


---

*最后更新: 2026-04-13 14:19*
