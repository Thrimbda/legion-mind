# Lock Scheduler Worker Runtime to OpenCode

## 目标

把 Linear + Legion scheduler RFC 中的 worker runtime 明确锁定为 OpenCode，移除“多 runtime 抽象 / OpenClaw / Codex / custom”作为首版设计目标的表述，并同步相关 WI 与 wiki 结论。

## 问题陈述

上一版 RFC 为 worker launcher 保留了 `opencode / openclaw / codex / custom` 字段和“agent runtime abstraction”措辞。用户明确要求这个版本不要做多余抽象，worker runtime 固定为 OpenCode。若 RFC 继续保留多 runtime 设计，会让 WI-04 的 scope 变大、实现者过早设计 adapter 层，也会让“worker 如何启动 Legion workflow”这个问题不够具体。

## 验收标准

- [ ] `docs/linear-legion-scheduler/rfc.md` 明确首版 worker runtime 固定为 OpenCode。
- [ ] RFC 中不再把 OpenClaw / Codex / custom 作为 worker runtime 的 MVP 选项或 run_attempt 枚举。
- [ ] RFC 增加 OpenCode worker 启动方式：scheduler 生成 prompt artifact，使用 OpenCode CLI / process 在目标 repo 启动 worker，worker 第一动作进入 `legion-workflow`。
- [ ] `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md` 的 scope / non-goals / 验收 / 验证同步为 OpenCode-only。
- [ ] Wiki task summary / pattern 同步记录 OpenCode-only worker runtime 结论。
- [ ] 产出本任务 Legion 证据：plan、log、tasks、review-rfc、walkthrough、pr-body、wiki writeback。

## 假设 / 约束 / 风险

- **假设**: 本版本 scheduler 只需要支持 OpenCode worker runtime；未来如果要支持其他 runtime，必须单独进入设计门，而不是从当前实现自然抽象出来。
- **约束**: 只更新设计文档和 Legion/wiki evidence，不实现 scheduler 代码。
- **约束**: 不重写整个 RFC，只做与 OpenCode runtime 锁定直接相关的修改。
- **风险**: 如果只改 run_attempt 字段而不改 WI-04，后续实现者仍可能做 adapter 抽象；因此 RFC 与 WI 必须同步。
- **风险**: 如果把 OpenCode 启动写得过细，可能绑定尚未验证的 CLI 参数；本任务只定义 process contract 和 prompt artifact，不承诺最终命令行参数。

## 要点

- **OpenCode-only**: 首版 worker runtime 固定为 OpenCode。
- **No runtime abstraction**: 不做 OpenClaw / Codex / custom adapter 层。
- **Prompt artifact**: Scheduler 负责生成 OpenCode worker prompt artifact，包含 Linear context、taskId、Legion hard gates、result contract。
- **Evidence gate**: 仍保留 scheduler-side Legion evidence verifier，防止只看 PR URL。

## 范围

- `docs/linear-legion-scheduler/rfc.md`
- `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md`
- `.legion/wiki/tasks/linear-legion-scheduler-rfc.md`
- `.legion/wiki/patterns.md`
- `.legion/wiki/index.md`（如需）
- `.legion/wiki/log.md`
- `.legion/tasks/lock-scheduler-worker-opencode/**`

## 非目标

- 不实现 OpenCode worker launcher 代码。
- 不修改 OpenCode / OpenClaw 安装器或 runtime 配置。
- 不支持多 runtime adapter，不设计 OpenClaw / Codex / custom worker 后端。
- 不重新拆分 8 个 WI，除非 WI-04 内部内容需要同步。
- 不改变 Linear、Scheduler DB、Legion、GitHub PR 四层真源边界。

## 设计索引 (Design Index)

> **Design Source of Truth**: `docs/linear-legion-scheduler/rfc.md` 和 `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md`。

**摘要**:
- 将 worker runtime 从“可抽象多后端”收敛为“OpenCode-only”。
- Scheduler 仍只负责启动 worker 和验证 evidence；OpenCode worker 内部必须通过 prompt hard gate 进入 `legion-workflow`。
- 未来多 runtime 支持是新设计问题，不属于当前 RFC 版本。

## 阶段概览

1. **Phase 1** - 任务契约与 worktree 准备。
2. **Phase 2** - 更新 RFC / WI / wiki 中的 runtime 决策。
3. **Phase 3** - 执行 `review-rfc` 检查设计一致性。
4. **Phase 4** - 生成 walkthrough / PR body、wiki writeback、PR lifecycle。

---
*Created: 2026-06-23 | Updated: 2026-06-23*
