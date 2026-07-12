# 子代理派生矩阵

仅用于 `legion-workflow` 已接管且 contract 稳定之后。三种模式和阶段顺序以此为运行时真源；worktree/PR 只是 lifecycle envelope。

## 派生前置

每次派生任何子代理（含只读探索）都先运行：

```sh
node skills/legion-workflow/scripts/subagent-name.mjs <role> --json --transport <codex|opencode|raw>
```

- `agentType` 只选择已注册职责；OpenCode 等固定类型 API 仍用它作为 subagent type。仅当 API 另有实例标识字段时才传 `transportId`；prompt 首行、日志与最终 `结果` 回显 `displayName`。
- 批量同角色用 `--count <n>`；不得手写、复用或在命名失败后降级为无实例名派生。
- `role/agentType` 表示职责，`displayName` 只区分实例，不改变阶段权限。

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
