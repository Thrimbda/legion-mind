# RFC：Legion 分层流程与条件化交付

## Executive Summary

把固定全链改为风险驱动的 Lite、Standard、Strict。profile 决定最低阶段和独立性，delivery/wiki 分别决定 walkthrough 与 durable writeback。删除 OpenCode custom agents，但保留独立执行上下文；修复刷新、权限、日志、安装迁移和行为测试。scheduler 与模型路由延期。

## Context

固定长链让低风险任务一旦进入 Legion 就承担 RFC、review、walkthrough、Wiki 和多个 agent 的整套成本，形成明显悬崖；同时 detached refresh、权限冲突和升级残留并未被这些仪式保护。目标是把门放在错误代价、边界和独立判断真正需要的位置。

## Decision

### 1. Profile 是最低要求

| 风险 | 默认 profile | Implementation 最低阶段 | 设计门与独立性 |
|---|---|---|---|
| low | Lite | `engineer -> verify-change` | 真实设计分叉才补短 RFC；不强制独立 agent |
| medium | Standard | `engineer -> verify-change -> review-change` | 公共配置/API、跨模块取舍或回滚歧义时补 `spec-rfc -> review-rfc`；review 与作者判断分离 |
| high | Strict | `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change` | 设计、验证和 review 均使用独立判断上下文，并保留安全/数据视角 |

`design_only` 的 Standard/Strict 走 `spec-rfc -> review-rfc`；Lite 可只交付稳定 contract。profile override 只取风险默认值与显式值中更高者；安全/权限、持久数据/schema、外部协议、秘密/签名、破坏性动作和困难回滚必须先升级风险。LOC、文件数、耗时和执行者自报不能降级。

阶段不等于 agent。独立上下文可由新会话、内置 review 或子代理提供；只有真正独立/并行的工作才派生，派生时仍遵守命名协议。

### 2. Delivery 与 Wiki 是独立最低 disposition

- delivery 顺序为 `summary < walkthrough`。Strict 最低为 walkthrough；Lite/Standard 默认为 summary，可由用户、contract、attention 或复杂证据向上升级，不能把 Strict 降为 summary。
- Wiki 顺序为 `no-change < write`。产生跨任务仍有效的当前决定、可复用模式、维护事项或当前真相时 write；其余任务 no-change，并记录一句理由，不创建占位页。
- walkthrough 不反向升级 profile：Standard 显式 walkthrough 仍只要求 Standard 的 test/review 证据。
- delivery 与 Wiki 互不蕴含：可以 walkthrough + no-change，也可以 summary + write。

walkthrough 的 artifact kind 与 workflow profile 分开记录：`profile` 仍表示 `implementation|rfc-only|contract-only`，新数据另存已解析的 `workflowProfile` 与 `designRequired`。renderer 必须拒绝缺任一 resolved 字段的当前输入；validator 按 resolved 字段检查阶段，且 workflowProfile 不得低于 risk 默认值。Lite implementation 恒用 `reviewStatus=NOT_REQUIRED`；Lite design-only 若显式要求 walkthrough，使用 `contract-only`，并重新读取 canonical `plan.md`，不伪造 RFC/review。

为避免影响尚未系统测试的 scheduler，原 `reportStageRequirements(taskId, profile, risk)` 保留 legacy 语义供 scheduler 使用；renderer 使用新的 resolved walkthrough requirements。scheduler 的 prompt、CLI 与 evidence verifier 不在本任务改变。

### 3. 事件驱动日志

只在以下事件追加 `log.md`：阶段或 Verdict 变化；目标、scope、风险或假设变化；影响实现/回滚/验证的决定；blocker 或外部依赖；新的 PASS/FAIL 证据；handoff、恢复点或 lifecycle 状态变化。无新信息时不按分钟刷新，不记录“仍在运行”。

### 4. OpenCode custom agents 与独立上下文

删除 `.opencode/agents/*`、`default_agent`、安装/打包/context-manifest 依赖。Standard/Strict 的独立性继续由 workflow 规则约束，不绑定某个 runtime 的 custom-agent 配置层。

升级安装只把 manifest 中位于明确退役 `<configDir>/agents/**` 根下的 managed 文件视为 retired，不从“当前包里缺什么”推断退役。写入前必须 preflight 所有必需 skill 源；任一缺失即 `E_PRECHECK`，不改 managed asset。

retired agents 的迁移规则：
- target 缺失：只清 manifest；
- checksum 或 symlink target 未漂移：移动到带 backup id 的可回滚备份并清 manifest；
- 用户漂移：默认保留并告警；`--force` 才备份迁移；
- 目标越出 managed roots、root 被 symlink 或备份路径不安全：fail/skip closed。

### 5. 工具权限

允许 `webfetch`/`websearch` 做只读外部验证；`external_directory` 为 `ask`，附件或仓库外文档仍需显式授权；危险 shell deny 和用户有意保留的外部交付授权不变。

### 6. 主工作区刷新

终态 cleanup 后执行：

```sh
git fetch origin
git switch master
git merge --ff-only origin/master
git status --short --branch
```

本地分支不存在时才创建 tracking branch。分支被占用、工作区改动阻止切换或本地分叉时报告 blocked；禁止 checkout 远端 ref、reset 或覆盖用户状态。

### 7. 行为测试

测试只固定可观察协议和结果：
- risk/profile 只升不降、阶段与 disposition 矩阵；
- walkthrough 不反向升级证据门；
- custom agents 不再打包/安装，旧 managed asset 的 clean/drift 迁移；
- OpenCode permission 值与 dangerous shell deny；
- refresh 命令包含 local switch + ff-only，且不出现 remote checkout/reset；
- machine result delimiter、schema key、Verdict 等协议继续精确验证。

删除对说明性整句、整段阶段链和 agent prompt 正文的断言。

## Scope / Boundaries

修改 workflow/reference/docs、git-worktree skill、OpenCode config/setup/package、report validator、README、Wiki 与测试。scheduler 源码/文档、per-spawn 模型路由、外部交付授权和真实效率评测不在范围内。

## Verification

- profile policy 表驱动测试覆盖默认映射、向上 override、向下降级无效和非法输入。
- walkthrough fixture 覆盖 Lite、Standard、Strict 的最低证据，以及 Standard 显式 walkthrough。
- setup lifecycle 覆盖 clean obsolete agent 被备份移除、用户漂移保留、rollback 可恢复。
- 根回归、`npm pack --dry-run --json` 和 context audit 全部通过。

## Rollback

单个 PR 可整体回滚。旧 agents 的自动清理由 backup index 记录，rollback 可恢复；用户漂移默认不动。刷新失败保持 blocked，不用 reset 修复。若 profile 规则出现兼容问题，只向上提升任务要求，不静默降级高风险门禁。

## Deferred

- scheduler prompt、CLI 参数和 evidence verifier：待 scheduler 系统测试后单独设计。
- Codex/OpenCode per-spawn model：待调用面支持稳定参数且有效率/质量测量后实施。
- 真实效率 benchmark：另立任务。
