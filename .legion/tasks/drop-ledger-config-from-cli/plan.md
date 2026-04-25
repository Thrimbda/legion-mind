# Remove config/ledger from Legion CLI

## 目标

让 Legion CLI 不再依赖 `.legion/config.json` 与 `.legion/ledger.csv`，并删掉围绕它们长出的无用命令与实现，使 CLI 回到“薄工具层”定位。

## 问题陈述

当前仓库的 schema 与文档已经在向 `plan.md` / `log.md` / `tasks.md` / `docs/*.md` 收敛，但 CLI 运行时仍依赖全局配置和审计账本。这导致 workflow 真源与运行时状态分裂，也让 README/REF_TOOLS/实现之间持续漂移。

## 验收标准

- [ ] `skills/legion-workflow/scripts/lib/cli.ts` 不再读写 `.legion/config.json` 或 `.legion/ledger.csv`
- [ ] `skills/legion-workflow/scripts/legion.ts` 不再暴露依赖 config/ledger 的命令分支
- [ ] CLI 对任务读写改为基于文件系统与显式 `--task-id` 工作，不再依赖隐式 active task 注册表
- [ ] 相关参考文档与 README 对 CLI 的描述与实现一致
- [ ] 现有可运行的校验路径能覆盖这次修改后的 CLI 主干

## 假设 / 约束 / 风险

- **假设**: 当前 proposal/approval、ledger query、task switch/archive 不是 Legion 主干，删除后不会破坏现行 workflow 真源。
- **约束**: 只能在当前仓库范围内收敛 CLI，不引入新的全局 schema 文件替代 `config.json`。
- **约束**: 若某命令失去隐式 task 选择能力，优先改成显式 `--task-id`，不要偷偷回退到新的隐藏状态文件。
- **风险**: CLI 行为变化会影响 README、REF_TOOLS 与安装校验，需要同步修正。
- **风险**: 现有严格校验脚本本身就有缺项，验证结果可能暴露历史问题而非本次改动回归。

## 要点

- Medium 风险：CLI surface 与 schema 一起变化
- 移除旧模型：config registry / ledger audit
- 保留主干：task create / status / log update / tasks update / plan update / review respond / dashboard generate
- 显式化：默认要求 `--task-id`

## 范围

- `skills/legion-workflow/scripts/**`
- `skills/legion-workflow/references/**`
- `skills/legion-docs/references/**`
- `docs/**`
- `README.md`
- `.legion/tasks/drop-ledger-config-from-cli/**`

## 设计索引 (Design Index)

> **Design Source of Truth**: `.legion/tasks/drop-ledger-config-from-cli/docs/rfc.md`

**摘要**:
- CLI 退回为文件系统驱动工具，任务枚举来自 `.legion/tasks/*` 目录，任务上下文由显式 `--task-id` 指定。
- 删除 proposal/approval、task switch/archive、ledger query 与 failure audit 等围绕旧状态模型长出的能力。

## 阶段概览

1. **Phase 1** - 收敛 CLI 精简方案并完成 RFC / review-rfc
2. **Phase 2** - 实现无 config/ledger 的 CLI 与文档更新
3. **Phase 3** - 运行验证、整理结论与交付摘要

---

*创建于: 2026-04-23 | 最后更新: 2026-04-23*
