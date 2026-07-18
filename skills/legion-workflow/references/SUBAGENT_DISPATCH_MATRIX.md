# 子代理派生矩阵

仅用于已接管且 contract 稳定的任务；worktree/PR 只是 lifecycle envelope。

## 独立性与派生前置

每次派生（含只读探索）先运行 `node skills/legion-workflow/scripts/subagent-name.mjs <role> --json --transport <codex|opencode|raw>`。

- `agentType` 选职责；API 支持时才传 `transportId`；prompt、日志和 `结果` 回显 `displayName`。命名失败不得派生。
- 阶段切换不派生。Lite 默认不派生；Standard/Strict 的 reviewer 与作者分离，Strict verifier 也独立。可用新会话、内置 review 或子代理。
- 名称和实例 id 不是身份 attestation；无可查 ID 时只声明“实例隔离未机械证明”。

## 阶段与 disposition

| 模式/风险 | 必须顺序 | 门禁 |
|---|---|---|
| Lite / implementation | `engineer -> verify-change` | 有界验证必须 PASS；真实设计分叉才补 RFC |
| Standard / implementation | `engineer -> verify-change -> review-change` | `design:rfc`、`rfc:standard`、`rfc:heavy` 时前置 RFC/review；change review 与作者分离 |
| Strict / implementation | `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change` | RFC PASS 前不编码；验证/review 独立并含安全或数据视角 |
| Standard/Strict / design-only | `spec-rfc -> review-rfc` | RFC review PASS 后交付设计 |
| Lite / design-only | 稳定 contract | 出现真实分叉即升级设计门 |

`report-walkthrough` 在 Strict、`delivery:walkthrough` 或 attention 需要时运行，否则 `summary`。`legion-wiki` 仅为跨任务当前知识运行，否则 `no-change`。二者独立且不建占位文件。

`bypass/restore/brainstorm` 是入口状态，不是 profile。所有实际运行阶段仍必须加载相应 skill。

## Attention 与短交接

审查阶段先写完整阶段证据，再按 `REF_HUMAN_ATTENTION.md` 映射为五字段 handoff。编排器必须先投影再推进：`none/skim` 正常；`review` 卡 auto-merge/merge；`decide` 卡阶段转换与普通回退。不得改写阶段顺序。

## 归属与安全

- 编排器写 `plan.md/log.md/tasks.md`；阶段代理写 task `docs/`；wiki 阶段写 `.legion/wiki/**`。
- `review-change` 遇到鉴权、身份/令牌、信任/协议边界、密钥/签名/加密、隐私/租户隔离或用户输入进入高权限路径时展开安全视角。
