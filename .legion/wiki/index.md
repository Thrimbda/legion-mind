# Legion Wiki

## 这是什么

- `.legion/wiki/**` 是跨任务当前知识层。
- `.legion/tasks/**` 仍然保存任务原始证据；需要过程细节时回到 raw docs。

## 导航

- `patterns.md`：可复用模式、约定、常见坑。
- `decisions.md`：当前生效的跨任务硬规则。
- `maintenance.md`：需要后续独立验证、迁移或清理的开放事项。
- `tasks/`：任务级综合摘要，链接回 raw task docs。
- `log.md`：wiki 层 durable writeback 记录。

## 当前重点

- Legion workflow 当前使用 Lite/Standard/Strict 最低 profile：Lite 为实现+验证，Standard 增加独立 change review，Strict 强制设计门、独立验证/审查与 walkthrough；显式覆盖只能升级。walkthrough 与 Wiki 分别按 reviewer 价值和 durable knowledge 决定。见 `decisions.md`、`patterns.md` 与 `tasks/workflow-profiles-model-routing-v1.md`，精确真源仍在 `skills/**`。
- 人类注意力交接与认知验证路由的当前结论见 `patterns.md` 与 `tasks/human-attention-verification-routing.md`：RFC 审查、变更验证和实现审查先把完整摘要落盘，再把判断变化与最多三个关键发现压缩为五字段投影，并用 `none | skim | review | decide` 管理人类介入；声明级验证按三轴分类并使用五状态，阶段级 `Verdict: PASS | FAIL` 保持独立。精确 schema 真源仍在相关 `skills/**`。
- 仓库内所有 `skills/*/SKILL.md` 当前都显式约束：默认用中文回答；若产出人类阅读型文档产物，也默认使用中文；代码、命令、路径、机器可读字段、错误原文和平台术语保持原文。见 `patterns.md` 与 `tasks/localize-skill-outputs.md`；schema 真源仍是各 `SKILL.md`。
- CLI 相关的 durable 约定见 `patterns.md`。
- Legion-managed 多步骤工程工作的入口门禁与执行模式分类见 `patterns.md` 与 `tasks/harden-legion-workflow-gate.md`；schema 真源仍是 `skills/legion-workflow/SKILL.md`。
- Git worktree + PR lifecycle envelope 见 `patterns.md`、`tasks/add-git-worktree-pr-envelope.md` 与 `tasks/fix-aim-autonomous-pr-flow.md`；执行细节真源是 `skills/git-worktree-pr/SKILL.md`。
- Linear + Legion 自动调度器的当前设计提案见 `tasks/linear-legion-scheduler-rfc.md`、`tasks/linear-legion-scheduler-wi-01.md`、`tasks/linear-legion-scheduler-wi-02.md`、`tasks/linear-legion-scheduler-wi-03.md`、`tasks/linear-0xc-58.md`、`tasks/linear-0xc-60.md`、`tasks/linear-0xc-61.md`、`tasks/linear-0xc-62-webhooks-retry-recovery.md`、`tasks/extract-linear-scheduler-npm-project.md`、`tasks/lock-scheduler-worker-opencode.md`、`tasks/amend-linear-native-scheduler-rfc.md` 与 `docs/linear-legion-scheduler/`；WI-01 的 Linear-side contract / scheduling policy 已落在 `docs/linear-legion-scheduler/linear-wi-contract-policy.md`，WI-02 的 SQLite scheduler core / durable state 已落在 `docs/linear-legion-scheduler/scheduler-core-sqlite.md`，WI-03 的 dry-run Linear graph scanner / skipped reason report 已落在 `docs/linear-legion-scheduler/linear-graph-scanner.md`，WI-04 的 OpenCode-only worker runner 已落在 `docs/linear-legion-scheduler/worker-runner.md`，WI-05 的 PR delivery tracking / Linear writeback outbox 已落在 `docs/linear-legion-scheduler/delivery-pr-writeback.md`，WI-06 的 parallel dispatch / resource locks 已落在 `docs/linear-legion-scheduler/parallel-dispatch-locks.md`，WI-07 的 webhook / retry / stale recovery reliability layer 已落在 `docs/linear-legion-scheduler/webhooks-retry-recovery.md`。运行时代码当前作为独立 npm project 放在 `scheduler/`，不属于 root `lgmind` npm package 的 `scripts/`。可复用集成模式是“外部调度器只编排，不替代 Legion 阶段链”，首版 worker runtime 锁定 OpenCode，Scheduler DB 是 machine truth，Linear Native Agent layer 只做 presentation/control plane，`Done` 只代表 `run_terminal_success`。
- WI-08 scheduler operations/security 当前结论见 `tasks/linear-0xc-59-operations-security.md` 与 `docs/linear-legion-scheduler/operations-security.md`：project pause / `security_blocked` 是 Scheduler DB durable control，会阻止新 claim 与 pending worker launch；危险 admin CLI 命令必须 reason + audit；PermissionChange / scope validation failure 对 affected project fail closed。
- Linear + Legion scheduler 总体验收见 `tasks/accept-linear-scheduler-overall.md`：当前 `scheduler/` 通过本地原型验收（57/57 scheduler tests + CLI smoke），可作为 sandbox integration candidate；但生产无人值守调度仍未接受，必须先完成真实 Linear read-only scan、sandbox native writeback、live GitHub PR tracking、real OpenCode worker E2E、security/observability/retention 和 staged rollout。
- Linear + Legion scheduler 生产-like 验收准备包见 `tasks/prepare-linear-scheduler-production-acceptance.md`、`docs/linear-legion-scheduler/production-acceptance-runbook.md` 与 `scheduler/docs/production-acceptance-checklist.md`：验收必须 sandbox-first；真实 credentials 使用 repo-local `secrets/linear-scheduler.sops.yaml`，由 sops YAML + age 加密，并通过 `sops exec-env` 注入；当前 live-read 能力只有 Linear `scan project` 与 GitHub `delivery track --pr-url`，二者都会写 scheduler DB state。production native writeback adapter、live `dispatch project` 与 packaged webhook server/outbox runner 仍是预期 blocker。
- Linear + Legion scheduler sandbox 验收执行见 `tasks/run-scheduler-sandbox-acceptance.md`：本地 regression、health、fixture scan 和 fixture dispatch 全部 PASS；live Linear/GitHub/worker stages 因 `secrets/linear-scheduler.sops.yaml` 缺失、`age` CLI 不可用、缺少 `SCHEDULER_RUN_ID` 和 worker 前置批准/状态而 `BLOCKED`。该结果不是 production-ready 证明。
- Linear + Legion scheduler sandbox 验收逐步 checkbox 文档见 `tasks/add-sandbox-acceptance-checklist.md` 与 `scheduler/docs/sandbox-acceptance-checklist.md`；它是 operator-facing 执行版，保留 sandbox-only、secret handling、Stage 5 worker gating、stop conditions 和 production blockers。
- 生产验收准备文档已通过 `tasks/localize-production-acceptance-docs.md` 中文化；面向用户 / reviewer 的 task 文档默认中文，命令、路径、env var、JSON/YAML key、状态枚举、labels、URL、代码符号、产品名和必要技术术语保留英文。
- `report-walkthrough` 是条件化 HTML-first reviewer handoff：当前 renderer 强制 resolved `workflowProfile`/`designRequired`，按 Lite/Standard/Strict 重读精确阶段 locator；Lite design-only 的 `contract-only` 也必须绑定 canonical plan。Strict 或显式升级才生成，Wiki 与之独立。见 `patterns.md` 与 `tasks/workflow-profiles-model-routing-v1.md`。
- `task create` 现在采用 staging + rename 物化模式，见 `patterns.md`。
- `setup-opencode verify --strict` 现在必须校验安装资产内容与 managed ownership，见 `patterns.md` 与 `tasks/harden-strict-verify-integrity.md`。
- `setup-opencode` 不再安装 custom agents；核心 skills 位于 `~/.agents/skills`。升级只安全迁移未漂移的旧 managed agents，缺 required source 时 fail closed。见 `patterns.md` 与 `tasks/workflow-profiles-model-routing-v1.md`。
- OpenCode/OpenClaw installer 的 npm CLI 当前 npm fixed version 与 `latest` 均为 `lgmind@0.4.0`；版本准备 PR #53 已 squash merge，trusted-publishing workflow run `29242902972` 从对应 merge SHA 成功发布，隔离首次安装、幂等复跑、strict verify 与 8 项关键资产一致性均已通过，见 `tasks/release-lgmind-0-4-0.md`。primary bin `lgmind` 是 product-level setup aggregator，支持 `npx lgmind@latest install` / `setup` 的交互式 project/global scope 选择；默认 first-run prompt 不再询问 OpenCode / OpenClaw。`--scope project|global` 是脚本化 scope 入口，`--agent opencode|openclaw` / `--runtime` 仅作为高级兼容路由保留；alias bin `setup-opencode` 仍是 OpenCode-only 直达入口。默认 text logs quiet，`--verbose` / `--json` 提供详细输出。发布 runtime 必须使用 JS 文件，不能从 `node_modules` 执行 `.ts` runtime；发布路径是手动 GitHub Actions trusted publishing workflow `publish-npm.yml` 从锁定的合并后 `master` SHA 发布，并验证 npm `latest` 与干净安装。见 `patterns.md`、`tasks/setup-opencode-npm-cli.md`、`tasks/publish-lgmind-npm.md`、`tasks/improve-cli-setup-ux.md`、`tasks/release-lgmind-0-2-0.md`、`tasks/add-npm-publish-action.md`、`tasks/fix-npm-bin-node-modules-ts.md`、`tasks/interactive-install-scope.md` 与 `tasks/remove-runtime-install-choice.md`。
- `setup-openclaw` 现在采用 OpenClaw local skills root + managed manifest + strict verify 的安装路径，并已与 OpenCode 对齐 rollback / uninstall / shared lifecycle core，见 `patterns.md`、`tasks/fix-openclaw-setup-install.md` 与 `tasks/harden-v1-kernel-harness.md`。
- 当前用户入口文档只承认 OpenCode 与 OpenClaw；根 `docs/` 历史材料已退出 current truth，现行入口为 `README.md`、`.legion/wiki/**`、`skills/**` 与 `vibe-harness-bench/README.md`，见 `tasks/harden-v1-kernel-harness.md`。
- README 的 `当前现实` / `通往 v1` 叙事已同步到当前仓库真实状态：可运行内核、OpenCode/OpenClaw-only、CLI 薄工具、local-first benchmark 与未毕业 CI/release/onboarding 边界，见 `tasks/refresh-readme-current-reality.md`。
- `npm run test:regression` 覆盖 setup lifecycle、skill surface 与 CLI 文件系统不变量，见 `patterns.md` 与 `tasks/harden-v1-kernel-harness.md`。
- VibeHarnessBench local-first semantic v0.1 已落地在 `vibe-harness-bench/**`；当前结论见 `tasks/complete-vibeharnessbench-v01.md`。
- Benchmark HUT local subprocess runtime 必须使用 repo 外临时根；hidden verifier 注入内容必须留在 verifier-owned temp copy，见 `patterns.md`。
