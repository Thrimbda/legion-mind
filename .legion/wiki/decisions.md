# Legion Decisions

## 决策：terminal 状态外部化，不设 task 级 PR 数量或 identity 限制

- 来源任务：`remove-pr-quota-enforcement-v1`；取代 `enforce-single-pr-lifecycle-v1` 的 hard quota/binding 结论。
- 当前规则：`runs.pr_url` 只记录当前 run 的 tracking URL；不存在 `repoKey + taskId` 数字配额、永久 PR identity、replacement/follow-up fail-closed gate。
- 自动行为边界：PR merged/closed 后，merge/checks/cleanup/refresh/publish/deploy 事实只进入 GitHub、Scheduler 与最终交接，不自动修改 task/wiki/report，也不自动创建 closeout、publish-result、deploy-result 或 wiki-only PR。
- 授权边界：terminal 后确需仓库改动时，当前自动 lifecycle 停止并向用户报告；用户明确授权后可以开始新的 branch/PR 交付。
- 状态语义：PR-backed task 的 repo evidence 以 `delivery-ready` 结束；delivery terminal 不要求合并后把仓库状态追写为 `completed`。

## 决策：Legion 任务使用只升不降的三档 profile

- 来源任务：`workflow-profiles-model-routing-v1`
- 当前规则：`risk:low|medium|high` 默认映射 Lite/Standard/Strict；显式 profile 与 semantic trigger 只能升级。LOC、文件数、耗时或执行者自报不能降级。
- 最低阶段：Lite 为 `engineer -> verify-change`；Standard 增加独立 `review-change`；Strict 强制 `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change`，且验证/review 与实现判断分离。
- 高风险触发：安全/权限、持久数据/schema、外部协议、秘密/签名、破坏性动作和困难回滚必须升级。

## 决策：walkthrough 与 Wiki 使用独立 disposition

- 来源任务：`workflow-profiles-model-routing-v1`
- Delivery：`summary < walkthrough`；Strict 最低为 walkthrough，Lite/Standard 可显式升级，不可向下覆盖。
- Wiki：`no-change < write`；只有跨任务当前决定、模式、维护事项或当前真相才写 Wiki。no-change 不创建占位页。
- 二者互不蕴含；walkthrough 不反向把 Standard 升级为 Strict 设计门。

## 决策：OpenCode custom agents 退出安装面

- 来源任务：`workflow-profiles-model-routing-v1`
- 删除 `.opencode/agents/*` 与 `default_agent`，不再打包、安装或校验 custom agents；这不取消独立执行上下文。
- OpenCode 允许只读 `webfetch`/`websearch`，`external_directory` 保持 `ask`，危险 shell deny 保留。
- 升级安装只迁移 manifest 中 `<configDir>/agents/**` 的旧 managed files；用户漂移默认保留，required source 缺失时在写入前 fail closed。

## 决策：Legion 迁移至 Pi 控制平面架构（GO，M1–M6 分阶段）

- 来源任务：`evaluate-pi-control-plane`（2026-08-16，RFC + 独立评审 PASS）。
- 决策：Legion 从 OpenCode 腾挪到 Pi，终态为个人 harness 控制平面。分六阶段推进：M1 `adopt-pi-interactive-runtime`（Pi 交互 runtime 承载 Legion 内核）、M2 `add-pi-worker-runner`（scheduler worker 增加 Pi 路径）、M3 `build-legion-control-core`（goal/run 状态机 + SessionActor + 审批闸 + 证据账本）、M4 `build-subagent-backend`（租约 + pi-subagents 第一版）、M5 `build-operator-plane`（pi-web console + 自有 HTTP/SSE API + Actions 入口切换）、M6 `build-fleet-computer-use`（Mac mini / browser / NixOS worker）。M1 先行，M2∥M3，M4∥M5，M6 最后；每阶段独立 Legion 任务、独立设计门。
- 硬边界：OpenCode 版本线冻结，任何阶段不得改动其安装面与 scheduler 内 OpenCode worker 路径；它是全程退路。
- 架构裁决：Pi 拥有 session/模型/工具循环；Legion 控制平面拥有 goal、任务图、审批、资源租约、证据账本、长期记忆与对外 versioned API；pi-web 仅作 operator/debug console，禁止依赖其内部 HTTP route；managed profile 禁止装 pi-goal；`pi-goal-list-loop-audit`（AGPL-3.0-only）禁止进入分发路径。
- 接入纪律：所有 Pi 生态接入物 pin 版本；扩展集合上线前做启动矩阵测试（跨扩展重名工具启动期 fail-closed）；同名包陷阱多，安装必须带 scope 核对作者。
- 真源：`.legion/tasks/evaluate-pi-control-plane/docs/rfc.md` 与 `docs/research.md`；任务摘要 `tasks/evaluate-pi-control-plane.md`。
- 时效：版本与默认值均为 2026-08-16 快照；实施任务启动时必须复核上游现状。

## 决策：Legion Pi 发行基线使用 schema v2 单配置与隔离 profile

- 来源任务：`pi-distro-skeleton`、`configure-pi-model-access`；任务摘要 `tasks/pi-distro-skeleton.md`、`tasks/configure-pi-model-access.md`。后者取代前者“manifest 不接受 model”的旧边界。
- 当前基线：Node.js 24+，用户只维护 `legion-pi/legion-pi.json`。Schema v2 接受 `schemaVersion`、`reviewedAt`、精确 `packages`、`skills` 与唯一固定 `models` policy；default 为 `openai-codex/gpt-5.6-sol`，enabled patterns 为 `openai-codex/*`、`deepseek/*`、`kimi-coding/k3`、`kimi-coding/k3-256k`。Schema v1 继续可 install/verify/rollback，但不渲染 model fields。
- Credential 边界：manifest 不接受 credential、tools、Web 或 MCP 配置；`setup-pi` 不管理 `auth.json`。Codex OAuth 属于 Pi 独立 login state，不复制其他客户端 OAuth；static provider 可用经过独立安全门的 runtime reference，但 secret 不进入 repo 或 generated settings。
- 生命周期：`setup-pi install|verify|rollback` 只操作显式 Legion Pi profile；generated settings、受限 subagent config、managed manifest 与 package runtime 都在该 profile 内，并由 verify/startup probe 校验。
- 探针边界：startup probe 注入空 in-memory credential store、禁用 model refresh，不读取 live auth 或执行 credential resolver。Pi 模型切换会造成 managed settings drift，必须在关闭 session/隔离 writer 后 force reconcile、重启、verify 并 fresh-session 复核。
- Package 快照：`@earendil-works/pi-coding-agent@0.84.2`、`pi-subagents@0.50.0`、`pi-mcp-adapter@2.26.0`、`pi-lens@4.0.1`；配置 `reviewedAt` 为 2026-08-17，独立验证于 2026-08-18 再次核对 registry。后续变更必须重新做版本复核和组合启动矩阵。
- 范围边界：当前基线只承诺 Linux、Node.js 24+、单用户单 writer 和 credential-free startup；PI WEB 是 operator console，不属于 manifest；OpenCode 安装面保持冻结。
