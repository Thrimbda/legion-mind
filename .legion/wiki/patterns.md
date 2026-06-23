# Legion Patterns

## 模式：仓库 skill 默认中文回答与中文文档产物

- 来源任务：`localize-skill-outputs`
- 背景：LegionMind 的任务证据与 workflow 文档以中文为主，但单独安装或独立加载某个 skill 时，若约束只存在于仓库级入口规则，运行时可能丢失“中文回答与中文文档产物”要求。
- 做法：每个仓库 `skills/*/SKILL.md` 都保留一个高可见的 `## 输出语言与文档产物` 小节，声明默认用中文回答；如果该 skill 产出 `plan.md`、RFC、review、test-report、walkthrough、PR body、wiki 页面、handoff 或其他人类阅读型文档产物，也默认使用中文。
- 例外边界：代码、命令、路径、配置字段、frontmatter/schema 字段、API/CLI 名称、错误原文、Git/GitHub/Linear 字段、URL、HTML/CSS/Actions 字段、raw evidence 引用和用户明确要求保留的语言不强制翻译；需要时在中文正文中解释。
- 维护提示：新增或重写 skill 时，不要只依赖全局 AGENTS 规则；应在该 skill 本体中补齐语言约束，并避免修改 frontmatter discovery 字段导致触发漂移。

## 模式：report-walkthrough 生成 HTML-first reviewer handoff

- 来源任务：`harden-report-walkthrough`、`html-first-report-walkthrough`、`pr-html-render-skill`
- 背景：旧版 `report-walkthrough` 虽然要求“已有证据”，但用 `implementation mode` / `rfc-only mode` 容易和 `legion-workflow` execution mode 混淆，并用 production code 是否变化判断分支，导致 docs/config/test/script-only implementation、失败证据或 stale evidence 可能被错误包装成交付摘要。
- 做法：`report-walkthrough` 使用 walkthrough profile，而不是 execution mode。Profile 由当前阶段链和前置证据决定：有实现结果、`test-report` 与 `review-change` 时使用 implementation profile；仅有 RFC 与 `review-rfc` 的设计交付使用 rfc-only profile。进入输出前必须执行 evidence health check：证据属于当前 task、对应当前交付状态、非 FAIL / blocked / stale，且每个完成性 claim 都能指向证据。
- 输出：`docs/report-walkthrough.html` 是主 reviewer-facing artifact；`docs/report-walkthrough.md` 是 compact source / fallback；`docs/pr-body.md` 使用 implementation 或 RFC-only 模板作为 PR 创建/更新输入。HTML artifact 必须包含 profile、reviewer summary、scope、evidence map、delivery path、render handoff、changed/decided、verification/review status、risks、reviewer checklist 与 final state / next stage。
- HTML 质量门：先做 clean-doc 信息选择，明确 reader、decision task、main path、evidence selection 与 certainty levels；再做 impeccable 式 product evidence interface，要求 standalone semantic HTML、OKLCH、响应式、print-friendly、无外部资源、无 gradient text、无 side-stripe accent、无默认 glassmorphism、无 hero-metric cliché、无 em dash。
- 边界：`report-walkthrough` 不补设计、不补验证、不补 review、不替代 `legion-wiki`，也不替代 `git-worktree-pr` PR lifecycle。它也不发布 preview、不写 CI workflow、不创建 PR comment；PR-backed HTML artifact 的 rendered preview path 交给 `pr-html-render`。`pr-body.md` 只是 PR 创建/更新输入，不代表 checks/review/merge、worktree cleanup 或主工作区 refresh 已完成。
- 常见陷阱：不要因为没有 production code 变化就自动选 rfc-only；不要把 FAIL / blocked / stale evidence 写成 ready-to-merge；不要只生成 Markdown 而跳过 HTML；不要把 PR body 当成 PR lifecycle 终态；不要让 PR-backed HTML artifact 缺 rendered preview path 且没有 explicit render bypass / blocker。

## 模式：pr-html-render 渲染已有 HTML reviewer artifact

- 来源任务：`pr-html-render-skill`、`localize-pr-html-render-skill`
- 背景：`report-walkthrough` 已经生成 HTML-first artifact，但 reviewer 在 PR 中需要 rendered preview、artifact-only fallback 或内部静态 host 路径。把发布/渲染逻辑塞进 `report-walkthrough` 会混淆证据摘要、CI 发布、PR comment 与 PR lifecycle。
- 做法：`pr-html-render` 是 support skill，不是 Legion phase。它只处理已有 HTML artifact，例如 `.legion/tasks/<task-id>/docs/report-walkthrough.html` 或 CI HTML report，帮助选择 local/artifact-only、GitHub Pages PR preview、或 authenticated internal host。缺 walkthrough HTML 时回到 `report-walkthrough`，不在 render skill 中生成报告内容。
- 安全边界：运行 PR code 的 build job 只能使用 read permissions；publish/comment job 才持有 `contents: write`、`pages: write`、`id-token: write`、`pull-requests: write`，且不能 checkout 或执行 PR head code。不要用 `pull_request_target` 构建 PR head code；public fork PR 需要 hardened `workflow_run`、manual approval 或跳过 Pages publishing。含 secrets、private logs、customer data、internal URLs 或 tokens 的 HTML 不发布到 public Pages。
- 文风与触发：`skills/pr-html-render/SKILL.md` 当前为中文为主，以匹配 Legion 仓库文档风格；frontmatter description 和正文仍保留 `docs/report-walkthrough.html`、`GitHub Pages`、`pull_request_target`、permissions 名称与模板文件名等英文技术 token，避免中文化降低触发和模板引用能力。
- 安装 surface：`setup-opencode` 默认安装 `pr-html-render` 到 agents skill root；OpenClaw 通过 `skills/**/SKILL.md` 动态发现。Regression 将其列为 support skill，不放入 `requiredPhaseSkills`。
- 常见陷阱：不要把 artifact upload 说成 rendered URL；不要把 preview link 当作 PR lifecycle 完成；不要为了 preview 改写 `report-walkthrough` 的 evidence rules；不要把 simple same-repo Pages template 用到 public fork 自动发布。

## 模式：开发任务使用 Git worktree + PR lifecycle envelope

- 来源任务：`add-git-worktree-pr-envelope`
- 背景：Legion 原有闭环覆盖 contract、设计、实现、验证、审查、汇报和 wiki writeback，但未强制仓库交付生命周期，Agent 仍可能在主工作区直接改动、跳过 worktree、直接 push、或把“PR 已创建”当作完成。
- 做法：凡会写入仓库内容、运行验证、commit、push、创建/更新 PR 或处理 checks/review 的开发任务，必须进入 `git-worktree-pr` envelope。主工作区只允许仓库准备、只读检查和最终基线刷新；所有开发动作在 `.worktrees/<task-id>/` 内完成，默认基于最新 `origin/master`。进入 envelope 后，commit、push PR branch、创建/更新 PR、checks/review/auto-merge follow-up、cleanup 和主工作区 refresh 都是默认 lifecycle action；用户没有逐项说出 commit / push / PR 不是停止条件。
- Completion：PR-backed 开发任务完成必须同时满足 Legion 证据链完成、PR 已合并或已关闭/确认废弃且原因和下一步已记录、review/checks 已处理、worktree 已删除、主工作区已刷新到最新 base。PR 创建、blocked handoff、保留 worktree 或跳过刷新都不是完成。
- 适用边界：`git-worktree-pr` 是 lifecycle envelope，不是第四种执行模式；三种执行模式仍由 `legion-workflow` 与 dispatch matrix 定义。
- 常见陷阱：不要在主工作区编写 spec/plan/代码/测试；不要因为用户没有逐项要求 commit / push / PR 就停在本地 diff；push 前必须在 worktree 内 `git fetch origin && git rebase origin/master`；不要直接 push `master`/`main` 或使用本地 `master`/`main` 开发；不要绕过 branch protection、checks 或 review；不要在 checks/review/cleanup/main refresh 未闭环时宣告完成；不要把持久化产物写到 repo 外。

## 模式：外部调度器嵌入 Legion 时只编排，不替代阶段链

- 来源任务：`linear-legion-scheduler-rfc`
- 背景：Linear + Legion scheduler 需要自动扫描 ready WI 并启动 agent，但若 scheduler 直接把 Linear issue 交给 agent 改代码，就会绕过 Legion 的 contract、设计门、验证、review、walkthrough、wiki writeback 和 PR lifecycle。
- 做法：把外部系统职责拆开：Linear 管 WI / 依赖 / 人机协作状态；Scheduler DB 管 run、attempt、resource lock、event、webhook dedupe 和幂等；Legion 管单 WI 执行协议；GitHub PR 管交付终态。Scheduler 只能 scan、claim、lock、launch worker、track PR、write back status。首版 worker runtime 固定为 OpenCode；Worker 的第一动作必须进入 `legion-workflow`；修改仓库时必须进入 `git-worktree-pr`。
- Gate：MVP implementation-ready 必须要求 `contract:stable`；downstream unlock 不能只看 Linear Done 或 PR open，必须通过 `isBlockerSatisfied()`；PR URL 也不是 Legion 完成证据，scheduler 需要 evidence verifier 来拒绝缺 `plan.md`、`review-rfc` / `review-change`、`report-walkthrough`、wiki writeback 等证据的结果。不要在首版引入 OpenClaw / Codex / custom runtime adapter。
- 适用边界：适用于把 Linear、GitHub issue、Jira、队列系统或其他外部调度器接入 Legion-managed 仓库。它是集成模式，不是新的 Legion 执行模式。
- 常见陷阱：不要让 scheduler 代替 `brainstorm` 判断 contract 稳定；不要把 brainstorm-only 和 implementation run 混在同一个 ready 状态；不要在 PR open / in_review 时解锁下游；不要让 worker retry 生成重复 Legion task；不要把外部队列状态当作 `.legion/tasks/**` 的替代品。

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

- 来源任务：`fix-openclaw-setup-install`、`harden-v1-kernel-harness`
- 背景：OpenClaw 文档支持 `skills.load.extraDirs`，但只写 config 会让安装依赖当前 checkout 路径，且无法验证 installed files 的 ownership / checksum / drift。
- 做法：`setup-openclaw` 以 `skills/<name>/SKILL.md` 动态发现 LegionMind skills，默认安装到 OpenClaw local skills root `~/.openclaw/skills/<skill>/`，并在 `~/.openclaw/.legionmind/managed-files.v1.json` 记录 managed ownership；`skills.load.extraDirs` 仍默认追加以兼容旧行为。OpenClaw 现在支持与 OpenCode 对齐的 `install / verify / rollback / uninstall` 文件资产 lifecycle，并复用 `scripts/lib/setup-core.ts` 的共享 lifecycle primitives。
- 安全边界：默认不覆盖 unmanaged 或 locally modified 目标；需要 `--force` 才会备份并覆盖。copy/symlink 的 verify 必须以 expected source items 驱动，而不是让 manifest 任意路径驱动遍历。rollback / uninstall 必须验证 backup index shape、拒绝 managed-root-as-target、拒绝 symlinked managed root 的破坏性操作，并要求 target / backup 同时满足 adapter 声明的 textual root 与 canonical containment。
- 验证提示：至少覆盖 isolated install、strict verify、idempotent reinstall、checksum drift detection、force repair、rollback `--to`、uninstall drift safe-skip/force、tampered manifest/backup path rejection、symlinked managed-root refusal、invalid backup-index blocking；避免测试真实 `~/.openclaw`。

## 模式：OpenCode setup 的 Legion skills 默认安装到 agents skill root

- 来源任务：`setup-opencode-agents-skills`
- 背景：当前 agents runtime 从 `~/.agents/skills` 发现 skills；继续把 Legion skills 默认复制到 `~/.opencode/skills` 会让安装位置与运行时发现位置漂移。
- 做法：`scripts/setup-opencode.ts` 保持 OpenCode config / agents / plugins 管理路径不变（默认 `~/.config/opencode`），但 skill home 默认改为 `~/.agents`，并沿用既有 `skills/<skill>` 拼接，因此最终目标为 `~/.agents/skills/<skill>`。
- 兼容边界：`--opencode-home` 仍作为显式 override 保留；传入后会继续使用 `<override>/skills/<skill>`，用于测试隔离或历史安装路径。
- 验证提示：除 lifecycle regression 外，使用 repo-local isolated `HOME` 运行 `install --dry-run --json`，确认输出 target 包含 `.agents/skills/<skill>`，避免写真实 home。

## 模式：`lgmind` npm CLI 发布面与 setup UX

- 来源任务：`setup-opencode-npm-cli`、`publish-lgmind-npm`、`improve-cli-setup-ux`、`release-lgmind-0-2-0`、`add-npm-publish-action`、`fix-npm-bin-node-modules-ts`、`interactive-install-scope`、`remove-runtime-install-choice`
- 背景：仓库内 OpenCode/OpenClaw setup scripts 已具备 install / verify / rollback / uninstall lifecycle；`lgmind` 首发后，CLI 需要像 Context7-style `setup` 一样给 first-run 用户一个明确入口，而不是只暴露 OpenCode 直达安装脚本。
- 做法：npm package name 使用 `lgmind`；primary bin `lgmind` 指向 product-level wrapper `bin/lgmind.js` -> `scripts/lgmind.js`，负责 `install` / `setup` 的 interactive first-run flow：TTY 中缺少 scope 时只提示 install scope（project/global），不再提示 OpenCode/OpenClaw runtime；非 TTY 默认 `global`，避免 CI hang。脚本化入口使用 `--scope project|global`；`--agent opencode|openclaw` / `--runtime opencode|openclaw` 仅作为高级兼容路由保留。Project scope 写入当前项目 `.legionmind/`：默认 OpenCode-backed path 使用 `.legionmind/opencode/{config,home}`，显式 OpenClaw 使用 `.legionmind/openclaw`。Alias bin `setup-opencode` 继续指向 `bin/setup-opencode.js`，作为 OpenCode-only 直达入口。发布包内 bin/runtime 不得依赖 `node --experimental-strip-types` 执行 `node_modules` 下的 `.ts` 文件。
- Output surface：默认 text output 只显示 final summary 与 warnings/errors；成功 `OK_*` lifecycle events 默认隐藏。`--verbose` 恢复详细 text events，`--json` 保持详细 structured event stream。
- Package surface：`package.json#files` 必须显式包含 `bin/`、`.opencode/agents/`、`scripts/build-runtime-js.mjs`、`scripts/lgmind.js`、`scripts/setup-opencode.js`、`scripts/setup-openclaw.js`、`scripts/lib/setup-core.js`、`skills/`、`README.md`、`LICENSE`；不要把 `.legion/`、`.worktrees/`、`tests/`、`.cache/` 打进 npm 包，也不要把 runtime TS 文件作为 published bin execution path。
- 验证提示：除 `npm run test:regression` 外，使用 `npm pack --dry-run --json` 或等价 dry-run 检查 package id、bin executable mode 和 required install assets；必须有 installed/package-like regression，在 `node_modules/lgmind` 形态下执行 package bins，防止再次漏掉 `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`；还必须覆盖交互式 install prompt 只询问 scope、不出现 runtime prompt，并覆盖 `--scope project` 的 project-local path 映射。release 前还要检查 `npm view lgmind`、`npm whoami` 与 package dry-run。npm cache/logs 应设置到 repo-local `.cache/npm`，避免持久化输出落在用户 home。
- 发布边界：CLI/package layout 变更必须先通过 PR merge；真实 npm publish 应由独立 release 任务从刷新后的 `origin/master` 执行并记录 registry state。用户可见 CLI 能力变更在 `0.x` 期间使用 minor release，例如 `0.1.0` -> `0.2.0`。本仓库优先使用 GitHub Actions trusted publishing / OIDC 发布：手动 workflow `publish-npm.yml`、`contents: read`、`id-token: write`、Node 24.x、先跑 regression 与 pack dry-run，再 `npm publish --access public`。

## 模式：Setup regression suite 锁定安装与 CLI 不变量

- 来源任务：`harden-v1-kernel-harness`
- 背景：LegionMind 已有 setup automation 与 CLI 薄工具，但缺少可重复回归入口来防止安装 lifecycle、skill surface 与 CLI 文件系统不变量漂移。
- 做法：使用 Node built-in `node:test` 维护 `tests/regression/**`，并通过 `npm run test:regression` 运行。当前覆盖 OpenCode/OpenClaw isolated setup lifecycle、`lgmind` scope-only interactive install / output mode / advanced runtime compatibility、installed/package-like npm bin execution、OpenCode 固定核心 skill list 与 OpenClaw dynamic skill surface 的包含关系、以及 `legion.ts init -> task create -> status -> task list` 文件系统不变量。
- 安全边界：测试必须在 repo-local `.cache/regression` 下创建临时根，避免把 Legion 任务产物、日志或临时缓存写到 repo 外；真实 home 目录不得参与 regression。
- 常见陷阱：不要把 regression 扩成端到端 agent runtime harness；不要让 README 声称支持 OpenCode/OpenClaw 之外的运行时；不要把 CLI 测试写成 workflow phase decision 测试，CLI 仍只是薄文件工具。

## 模式：Current truth 不再放根 `docs/`

- 来源任务：`harden-v1-kernel-harness`
- 背景：根 `docs/` 中的 benchmark、usage 与历史设计材料已经和当前 workflow / setup / benchmark surface 发生漂移，继续作为入口会制造第二套 current truth。
- 做法：根 `docs/` 退出当前真源。当前用户入口为 `README.md`；跨任务当前知识为 `.legion/wiki/**`；workflow / phase 真源为 `skills/**`；benchmark 当前使用说明为 `vibe-harness-bench/README.md`。
- 常见陷阱：不要在 README 或 wiki current-surface 中继续链接已删除的 `docs/benchmark.md`、`docs/legionmind-usage.md`、`docs/skill-split-plan.md` 或 `docs/legion-context-management-raw-wiki-schema.md`；历史材料需要时回 git history 或 `.legion/tasks/**` raw docs。

## 模式：HUT 本地执行使用 repo 外临时根

- 来源任务：`build-vibeharnessbench-mvp`、`complete-vibeharnessbench-v01`
- 背景：benchmark runner 若把 HUT workspace 放在 repo 内 `results/`，local subprocess 可以通过父目录遍历到 `tasks/**/verifier`、`oracle`、`negative_controls`，即使 env 没有显式暴露 protected path。
- 做法：HUT runtime workspace、visible inputs 与 artifacts 先 materialize 到 repo 外临时 execution root；adapter env 只暴露这个临时根下的 allowlisted paths；adapter 退出后再将 reviewer artifacts copy back 到 `results/`。
- 适用边界：适用于 MVP/local subprocess 型 benchmark runner。它降低 repo 祖先路径泄露风险，但不是完整 sandbox、container 或 chroot。
- 常见陷阱：不要只检查 env 是否包含 protected path；还要检查 runtime cwd 的祖先路径是否能到达 protected task pack。
- 验证提示：覆盖 repo 内 execution root 被拒绝、adapter env 不含 repo/protected path、noop run 失败为 `FAIL_HIDDEN` 而非 infra crash。

## 模式：Hidden verifier 使用 verifier-owned temp copy

- 来源任务：`complete-vibeharnessbench-v01`
- 背景：Systems Go verifier 需要注入 hidden tests。如果直接写入 HUT workspace，runner copy-back 会把 hidden test source 持久化到 `results/**/workspace`，破坏 hidden verifier 可信度。
- 做法：verifier 把 HUT workspace copy 到 verifier-owned temp root，只在该 temp root 注入 hidden tests 并执行；原始 HUT workspace 不被写入 protected verifier content，temp root 执行后删除。
- 适用边界：适用于 local-first verifier 需要注入测试、fixtures 或 probes 的 benchmark case。对 Docker/container 模式也同样适用：hidden content 应只存在于 verifier trust boundary 内。
- 常见陷阱：不要只保证 adapter env 不暴露 verifier path；也要检查 verifier 是否把 hidden tests 写回 HUT workspace 或 persisted report artifacts。
- 验证提示：检查 `results/**/workspace` 中不存在 injected hidden test 文件，且 `selfcheck` oracle/negative 仍能通过/失败于预期语义。
