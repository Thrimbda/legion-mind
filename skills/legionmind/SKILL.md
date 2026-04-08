---
name: legionmind
description: 基于文件系统的跨会话任务骨架；默认通过 bundled Legion CLI 维护 .legion 状态。
---

# LegionMind

1. 遇到 3+ 步骤、多文件修改、跨会话延续时，先启用本 skill；若检测到 `.legion/` 已存在，先恢复当前任务而不是重建。
2. 恢复顺序固定为：`plan.md` → `docs/rfc.md`（若存在）→ `context.md` / `tasks.md`。
3. 默认通过 `node --experimental-strip-types "${OPENCODE_HOME:-$HOME/.opencode}/skills/legionmind/scripts/legion.ts" ...` 读写 `.legion/`；需要命令与 payload 时查 `references/REF_TOOLS.md`。
4. 编码前先确认设计门禁已经通过；`plan.md` 只保留契约摘要，详细设计继续放 RFC 或 design-lite。
5. orchestrator 统一写回 `.legion` 三文件；subagent 只返回最小 handoff 包，不直接改写 `plan.md` / `context.md` / `tasks.md`。
6. 每完成一个子任务或 15-20 分钟，至少同步一次 `context.md` 与 `tasks.md`；禁止最后一次性补写。
7. 发现 `> [REVIEW]` 块后，先处理 blocking review，再继续推进。
8. 文档默认跟随当前工作语言；只有仓库已有明确约定时才切换。

## Meta Feedback

如果发现本 Skill 流程设计有问题，请使用 `legion::meta` 触发反馈模式，将建议写入 `FEEDBACK.md`。

## Playbook（跨任务沉淀，推荐）

- 将可复用模式/策略沉淀到 `.legion/playbook.md`。
- 记录来源任务与日期，便于追溯。
- 若 CLI 暂不可用，只允许 orchestrator 走 break-glass 手工落盘；必须在 `context.md` 与 PR 中注明“无 ledger 审计”，subagent 不得使用此路径。

---
*更多资源：*
- [REF_BEST_PRACTICES.md](./references/REF_BEST_PRACTICES.md)
- [REF_CONTEXT_SYNC.md](./references/REF_CONTEXT_SYNC.md)
- [REF_ENVELOPE.md](./references/REF_ENVELOPE.md)
- [REF_AUTOPILOT.md](./references/REF_AUTOPILOT.md)
- [REF_RFC_PROFILES.md](./references/REF_RFC_PROFILES.md)
