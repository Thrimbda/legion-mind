# 子代理派生矩阵

仅用于已接管且 contract 稳定的任务；worktree/PR 只是 lifecycle envelope。

## 派生前置

每次派生（含只读探索）先运行 `node skills/legion-workflow/scripts/subagent-name.mjs <role> --json --transport <codex|opencode|raw>`。

- `agentType` 选职责；仅 API 有实例字段才传 `transportId`；prompt、日志和 `结果` 回显 `displayName`。批量用 `--count`，命名失败不得降级派生。
- 每阶段都由真实 Codex `spawn` 或 OpenCode `task` 新派生；primary 切换 skill 不算。三对直接作者/reviewer 不得复用会话；重跑重派 reviewer，FAIL 按链回退。
- 名称、`transportId`、agent/session id 不是身份 attestation；无可查实例 ID 时只能写“已观察到不同派生事件，实例隔离未机械证明”。

## 阶段链

| 模式/风险 | 必须顺序 | 门禁 |
|---|---|---|
| default implementation / low | `engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | review 通过前不交付 |
| default implementation / medium-high | `spec-rfc -> review-rfc -> engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | RFC review PASS 前不编码；high 的 change review 加安全视角 |
| approved-design continuation | `engineer -> verify-change -> review-change -> report-walkthrough -> legion-wiki` | 设计不一致回 RFC |
| heavy design-only | `spec-rfc -> review-rfc -> report-walkthrough -> legion-wiki` | RFC review PASS 前不交付 |

`bypass/restore/brainstorm` 是入口状态，不是模式。所有阶段必须真实加载相应 skill；`legion-wiki` 不可省略。

## Attention 与短交接

审查阶段先写完整阶段证据，再按 `REF_HUMAN_ATTENTION.md` 映射为五字段 handoff。编排器必须先投影再推进：`none/skim` 正常；`review` 卡 auto-merge/merge；`decide` 卡阶段转换与普通回退。不得改写阶段顺序。

## 归属与安全

- 编排器写 `plan.md/log.md/tasks.md`；阶段代理写 task `docs/`；wiki 阶段写 `.legion/wiki/**`。
- `review-change` 遇到鉴权、身份/令牌、信任/协议边界、密钥/签名/加密、隐私/租户隔离或用户输入进入高权限路径时展开安全视角。
