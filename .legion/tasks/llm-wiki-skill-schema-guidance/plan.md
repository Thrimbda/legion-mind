# 反哺 llm-wiki skill 的复利与 schema guidance

## 目标

基于用户的新方向，把 skills/llm-wiki 从 host-schema / baseline 模式收敛为一个全权管理授权 wiki 目录的单一 opinionated 方案，并完成验证。


## 要点

- 改掉“按宿主情况适配”的思路，让 skill 明确拥有一个 canonical wiki layout 与固定规则
- 删掉 host-schema handshake、等价导航/日志机制、宿主覆盖等分支，把 `index.md` / `log.md` 与 page families 固定下来
- 在保持 SKILL.md 精简的前提下，把 canonical layout、固定命名/引用/归档规则写入 references，并用 skill-creator 校验


## 范围

- skills/llm-wiki/**
- .legion/tasks/llm-wiki-compounding-feedback/**

## 阶段概览

1. **基线复盘** - 1 个任务
2. **skill 细化** - 1 个任务
3. **验证与交付** - 1 个任务

---

*创建于: 2026-04-11 | 最后更新: 2026-04-11*
