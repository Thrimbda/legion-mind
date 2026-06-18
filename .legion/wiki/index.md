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

- 仓库内所有 `skills/*/SKILL.md` 当前都显式约束：默认用中文回答；若产出人类阅读型文档产物，也默认使用中文；代码、命令、路径、机器可读字段、错误原文和平台术语保持原文。见 `patterns.md` 与 `tasks/localize-skill-outputs.md`；schema 真源仍是各 `SKILL.md`。
- CLI 相关的 durable 约定见 `patterns.md`。
- Legion-managed 多步骤工程工作的入口门禁与执行模式分类见 `patterns.md` 与 `tasks/harden-legion-workflow-gate.md`；schema 真源仍是 `skills/legion-workflow/SKILL.md`。
- Git worktree + PR lifecycle envelope 见 `patterns.md`、`tasks/add-git-worktree-pr-envelope.md` 与 `tasks/fix-aim-autonomous-pr-flow.md`；执行细节真源是 `skills/git-worktree-pr/SKILL.md`。
- `report-walkthrough` 当前模式是 HTML-first、基于有效证据的 reviewer handoff 协议：`docs/report-walkthrough.html` 是主 reviewer artifact，Markdown 是 compact source / fallback，PR body 是 PR 输入；PR-backed HTML artifact 完成后默认交给 `pr-html-render` 形成 rendered preview path，或记录 explicit render bypass / blocker。`pr-html-render` skill 说明当前为中文为主，同时保留英文触发 token 与 GitHub 安全边界。见 `patterns.md`、`tasks/harden-report-walkthrough.md`、`tasks/html-first-report-walkthrough.md`、`tasks/pr-html-render-skill.md` 与 `tasks/localize-pr-html-render-skill.md`；schema 真源仍是 `skills/report-walkthrough/SKILL.md` 与 `skills/pr-html-render/SKILL.md`。
- `task create` 现在采用 staging + rename 物化模式，见 `patterns.md`。
- `setup-opencode verify --strict` 现在必须校验安装资产内容与 managed ownership，见 `patterns.md` 与 `tasks/harden-strict-verify-integrity.md`。
- `setup-opencode` 默认仍管理 OpenCode config/agents，但核心 Legion skills 现在安装到 `~/.agents/skills`，见 `patterns.md` 与 `tasks/setup-opencode-agents-skills.md`。
- OpenCode/OpenClaw installer 的 npm CLI 当前 npm latest 是 package `lgmind@0.2.1`：primary bin `lgmind` 是 product-level setup aggregator，支持 `npx lgmind@latest setup --agent opencode|openclaw`，alias bin `setup-opencode` 仍是 OpenCode-only 直达入口；默认 text logs quiet，`--verbose` / `--json` 提供详细输出。发布 runtime 必须使用 JS 文件，不能从 `node_modules` 执行 `.ts` runtime；发布路径是手动 GitHub Actions trusted publishing workflow `publish-npm.yml` 从 `master` publish 并验证 npm `latest`。见 `patterns.md`、`tasks/setup-opencode-npm-cli.md`、`tasks/publish-lgmind-npm.md`、`tasks/improve-cli-setup-ux.md`、`tasks/release-lgmind-0-2-0.md`、`tasks/add-npm-publish-action.md` 与 `tasks/fix-npm-bin-node-modules-ts.md`。
- `setup-openclaw` 现在采用 OpenClaw local skills root + managed manifest + strict verify 的安装路径，并已与 OpenCode 对齐 rollback / uninstall / shared lifecycle core，见 `patterns.md`、`tasks/fix-openclaw-setup-install.md` 与 `tasks/harden-v1-kernel-harness.md`。
- 当前用户入口文档只承认 OpenCode 与 OpenClaw；根 `docs/` 历史材料已退出 current truth，现行入口为 `README.md`、`.legion/wiki/**`、`skills/**` 与 `vibe-harness-bench/README.md`，见 `tasks/harden-v1-kernel-harness.md`。
- README 的 `当前现实` / `通往 v1` 叙事已同步到当前仓库真实状态：可运行内核、OpenCode/OpenClaw-only、CLI 薄工具、local-first benchmark 与未毕业 CI/release/onboarding 边界，见 `tasks/refresh-readme-current-reality.md`。
- `npm run test:regression` 覆盖 setup lifecycle、skill surface 与 CLI 文件系统不变量，见 `patterns.md` 与 `tasks/harden-v1-kernel-harness.md`。
- VibeHarnessBench local-first semantic v0.1 已落地在 `vibe-harness-bench/**`；当前结论见 `tasks/complete-vibeharnessbench-v01.md`。
- Benchmark HUT local subprocess runtime 必须使用 repo 外临时根；hidden verifier 注入内容必须留在 verifier-owned temp copy，见 `patterns.md`。
