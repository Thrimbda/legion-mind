---
name: agent-entry
description: Use when working in this repository before any multi-step coding task, after context loss, or when resuming work and the repo-specific Legion entry rules may be easy to forget.
---

# agent-entry

## Overview

`agent-entry` 是这个仓库的 repo-specific 入口补丁层。它不替代 `legion-workflow`；它只负责把根部 `AGENTS.md` 里的仓库级硬门禁整理成可复用 skill。

<HARD-GATE>
在这个仓库里，进行多步骤 coding work 时：

1. 先加载 `legion-workflow`
2. 若 `.legion/` 已存在，先恢复 active task，再做自由探索
3. 若没有稳定 `plan.md` / `tasks.md`，先走 `brainstorm`
4. 在稳定 task contract 之前，不要调用 `engineer`，也不要写生产级实现
</HARD-GATE>

## When to Use

- 刚进入本仓库，准备开始多步骤 coding work
- 会话中断后恢复工作，需要重新确认仓库级入口规则
- 准备探索代码、调度 subagent、或开始实现，但担心跳过 Legion 入口门禁
- 已经加载 `legion-workflow`，需要补上这个仓库自己的入口覆盖规则

不要用在：

- 纯只读、单轮、无需持久任务状态的普通查询
- `.legion` 文档归属、密度与写法细节；那属于 `legion-docs`

## Required Sequence

1. **先读 `legion-workflow`**：由它判断 Legion 是否接管，以及当前是恢复任务还是新建任务。
2. **再应用本 skill**：把仓库级入口纪律补齐，不要把 `AGENTS.md` 当成一段一次性提示词。
3. **恢复优先**：若 `.legion/` 已存在，先恢复 active task，而不是直接看代码或开始改动。
4. **contract 先于实现**：若 `plan.md` / `tasks.md` 不稳定，先走 `brainstorm`；在此之前不要启动 `engineer`。
5. **文档分工不要混淆**：涉及 `.legion` 文档放置与密度时，交给 `legion-docs`，不要在本 skill 里临时发明规则。

## Quick Reference

| 情况 | 动作 |
|---|---|
| 进入本仓库开始多步骤任务 | 先加载 `legion-workflow` |
| 仓库里已有 `.legion/` | 先恢复 active task |
| `plan.md` / `tasks.md` 仍不稳定 | 先用 `brainstorm` |
| 想直接让 `engineer` 开始 | 先确认稳定 contract 已存在 |
| 需要判断信息写进 `.legion` 哪里 | 加载 `legion-docs` |

## Red Flags

- “这个任务很简单，可以先跳过 Legion”
- “我先 patch 一下代码，回头再补 `.legion`”
- “我先让 `engineer` 开始，后面再整理 contract”
- “仓库里虽然有 `.legion`，但我可以先忽略它”

这些都意味着：停止当前路径，回到 `legion-workflow` 入口，再重新应用本 skill。

## References

- 主入口与阶段路由：`legion-workflow`
- task contract 收敛：`brainstorm`
- `.legion` 文档放置规则：`legion-docs`
- 用户显式指令优先于本 skill
