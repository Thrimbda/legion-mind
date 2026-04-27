# Legion Patterns

## 模式：开发任务使用 Git worktree + PR lifecycle envelope

- 来源任务：`add-git-worktree-pr-envelope`
- 背景：Legion 原有闭环覆盖 contract、设计、实现、验证、审查、汇报和 wiki writeback，但未强制仓库交付生命周期，Agent 仍可能在主工作区直接改动、跳过 worktree、直接 push、或把“PR 已创建”当作完成。
- 做法：凡会写入仓库内容、运行验证、commit、push、创建/更新 PR 或处理 checks/review 的开发任务，必须进入 `git-worktree-pr` envelope。主工作区只允许仓库准备、只读检查和最终基线刷新；所有开发动作在 `.worktrees/<task-id>/` 内完成，默认基于最新 `origin/master`。
- Completion：PR-backed 开发任务完成必须同时满足 Legion 证据链完成、PR 已合并或已关闭/确认废弃且原因和下一步已记录、review/checks 已处理、worktree 已删除、主工作区已刷新到最新 base。PR 创建、blocked handoff、保留 worktree 或跳过刷新都不是完成。
- 适用边界：`git-worktree-pr` 是 lifecycle envelope，不是第四种执行模式；三种执行模式仍由 `legion-workflow` 与 dispatch matrix 定义。
- 常见陷阱：不要在主工作区编写 spec/plan/代码/测试；push 前必须在 worktree 内 `git fetch origin && git rebase origin/master`；不要直接 push `master`/`main` 或使用本地 `master`/`main` 开发；不要绕过 branch protection、checks 或 review；不要在 checks/review/cleanup/main refresh 未闭环时宣告完成；不要把持久化产物写到 repo 外。

## 模式：Legion 入口门禁先于探索

- 来源任务：`harden-legion-workflow-gate`
- 背景：Agent 容易以“先看文件 / 先看 git / 小改动 / autopilot”为理由绕过 workflow，导致 contract、设计门禁、验证、汇报与 wiki writeback 失效。
- 做法：在 Legion-managed 仓库中，非简单多步骤工程工作必须先过 `legion-workflow` 入口判断，再进行代码 / git / 文件探索、实现、追问或子代理派生；阶段工作必须真实加载对应 skill 或派生对应阶段子代理。
- 图示要求：`SKILL.md` 的入口状态机、mode selector、阶段链与回退图共同表达入口状态、三种执行模式、失败回退与 closing writeback；不要用浅图替代这些规则。
- 适用边界：本条是 wiki 层查询入口；具体门禁文本、执行模式和阶段顺序仍以 `skills/legion-workflow/SKILL.md` 与 `references/SUBAGENT_DISPATCH_MATRIX.md` 为真源。
- 常见陷阱：不要把 `bypass`、`restore`、`brainstorm` 写成执行模式；它们只是入口运行状态。当前执行模式仍只有三种：默认实现模式、已批准设计后的续跑模式、重型仅设计模式。

## 模式：CLI 保持薄层

- 来源任务：`drop-ledger-config-from-cli`
- 背景：workflow 真源已经上收至 skill 与 dispatch matrix，CLI 不应再维护一套平行状态机。
- 做法：CLI 只保留初始化、文件级读写、显式 `task-id` 下的查询与更新；避免全局状态注册表与审计账本。
- 适用边界：适用于 Legion workflow 自身；若未来确有外部系统集成需求，再单独设计 machine state。
- 常见陷阱：不要把“方便”重新实现成 config / ledger 型隐式状态。
- 最小示例：`task create --json ...` 后，用 `status --task-id <id>`、`log update --json ...`、`tasks update --json ...`。

## 模式：`task create` 先 staging 再落最终目录

- 来源任务：`fix-task-create-materialization`
- 背景：直接在最终任务目录中逐个写 `docs/`、`plan.md`、`log.md`、`tasks.md` 会暴露部分物化窗口；即使单文件写入是原子的，任务目录整体可见性并不是原子的。
- 做法：先在 `.legion/tasks/` 下创建 `.tmp-<taskId>-<nonce>` staging root，在其中写完 `docs/`、`plan.md`、`log.md`、`tasks.md`，再一次性 rename 到最终 `.legion/tasks/<taskId>`。
- 适用边界：适用于 Legion CLI 的 task bootstrap / materialization 路径，目标是不变量加固：success => 最终任务目录完整可读。
- 常见陷阱：不要退回“先暴露最终目录、失败后 cleanup”的方案；cleanup 能改善异常尾部，但不能消除最终目录过早可见的问题。
- 验证提示：至少覆盖 `init -> task create -> status --task-id -> task list` 的 success path，并确认 `.legion/tasks/` 下没有残留 `.tmp-*` staging 目录。

## 模式：`verify --strict` 校验内容与 ownership

- 来源任务：`harden-strict-verify-integrity`
- 背景：只检查安装目标文件是否存在会把截空文件、safe-skip 的 unmanaged 冲突文件、symlink 漂移和损坏 manifest 误判为 `READY`。
- 做法：strict verify 以安装脚本枚举出的 expected sync items 为真源，结合 `managed-files.v1.json` 校验目标存在性、managed ownership、copy checksum、symlink target、manifest missing/invalid 状态；普通 verify 仍保持 warning 兼容。
- 适用边界：适用于 `scripts/setup-opencode.ts` 的 OpenCode asset install/verify/rollback 路径；不扩展为通用发布 manifest 或 benchmark harness。
- 常见陷阱：不要让 `verify --strict` 退回 presence-only；也不要让 manifest 任意路径驱动遍历，verify 主循环必须由当前 expected items 驱动。
- 迁移提示：手工复制但内容与源一致的 legacy 安装可由普通 `install` 通过 `OK_ADOPT` 补写 ownership；内容不同的 unmanaged 冲突仍需审阅后 `install --force`。
- 验证提示：至少覆盖 copy/symlink strict success、checksum drift、unmanaged safe-skip、same-content adoption、invalid manifest、symlink type drift + force repair、rollback 后不误报 READY。

## 模式：OpenClaw skills 安装使用 local root + managed manifest

- 来源任务：`fix-openclaw-setup-install`
- 背景：OpenClaw 文档支持 `skills.load.extraDirs`，但只写 config 会让安装依赖当前 checkout 路径，且无法验证 installed files 的 ownership / checksum / drift。
- 做法：`setup-openclaw` 以 `skills/<name>/SKILL.md` 动态发现 LegionMind skills，默认安装到 OpenClaw local skills root `~/.openclaw/skills/<skill>/`，并在 `~/.openclaw/.legionmind/managed-files.v1.json` 记录 managed ownership；`skills.load.extraDirs` 仍默认更新以兼容旧行为。
- 安全边界：默认不覆盖 unmanaged 或 locally modified 目标；需要 `--force` 才会备份并覆盖。copy/symlink 的 verify 必须以 expected source items 驱动，而不是让 manifest 任意路径驱动遍历。
- 验证提示：至少覆盖 isolated install、strict verify、idempotent reinstall、checksum drift detection、force repair；避免测试真实 `~/.openclaw`。
