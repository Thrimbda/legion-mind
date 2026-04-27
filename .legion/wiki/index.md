# Legion Wiki

## 这是什么

- `.legion/wiki/**` 是跨任务当前知识层。
- `.legion/tasks/**` 仍然保存任务原始证据；需要过程细节时回到 raw docs。

## 导航

- `patterns.md`：可复用模式、约定、常见坑。
- `maintenance.md`：需要后续独立验证、迁移或清理的开放事项。
- `tasks/`：任务级综合摘要，链接回 raw task docs。
- `log.md`：wiki 层 durable writeback 记录。

## 当前重点

- CLI 相关的 durable 约定见 `patterns.md`。
- Legion-managed 多步骤工程工作的入口门禁与执行模式分类见 `patterns.md` 与 `tasks/harden-legion-workflow-gate.md`；schema 真源仍是 `skills/legion-workflow/SKILL.md`。
- Git worktree + PR lifecycle envelope 见 `patterns.md`、`tasks/add-git-worktree-pr-envelope.md` 与 `tasks/fix-aim-autonomous-pr-flow.md`；执行细节真源是 `skills/git-worktree-pr/SKILL.md`。
- `task create` 现在采用 staging + rename 物化模式，见 `patterns.md`。
- `setup-opencode verify --strict` 现在必须校验安装资产内容与 managed ownership，见 `patterns.md` 与 `tasks/harden-strict-verify-integrity.md`。
- `setup-openclaw` 现在采用 OpenClaw local skills root + managed manifest + strict verify 的安装路径，并已与 OpenCode 对齐 rollback / uninstall / shared lifecycle core，见 `patterns.md`、`tasks/fix-openclaw-setup-install.md` 与 `tasks/harden-v1-kernel-harness.md`。
- 当前用户入口文档只承认 OpenCode 与 OpenClaw；根 `docs/` 历史材料已退出 current truth，现行入口为 `README.md`、`.legion/wiki/**`、`skills/**` 与 `vibe-harness-bench/README.md`，见 `tasks/harden-v1-kernel-harness.md`。
- README 的 `当前现实` / `通往 v1` 叙事已同步到当前仓库真实状态：可运行内核、OpenCode/OpenClaw-only、CLI 薄工具、local-first benchmark 与未毕业 CI/release/onboarding 边界，见 `tasks/refresh-readme-current-reality.md`。
- `npm run test:regression` 覆盖 setup lifecycle、skill surface 与 CLI 文件系统不变量，见 `patterns.md` 与 `tasks/harden-v1-kernel-harness.md`。
- VibeHarnessBench local-first semantic v0.1 已落地在 `vibe-harness-bench/**`；当前结论见 `tasks/complete-vibeharnessbench-v01.md`。
- Benchmark HUT local subprocess runtime 必须使用 repo 外临时根；hidden verifier 注入内容必须留在 verifier-owned temp copy，见 `patterns.md`。
