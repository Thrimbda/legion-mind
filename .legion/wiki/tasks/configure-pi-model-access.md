# configure-pi-model-access

## Metadata

- `task-id`: `configure-pi-model-access`
- `status`: `delivery-ready`
- `risk`: `high`
- `schema-version`: `Legion Pi config v2 / task evidence 2026-08`
- `historical`: `false`
- `supersedes`: `pi-distro-skeleton` 中“manifest 不接受 model”的旧边界
- `superseded-by`: `(none)`

## Outcome Summary

- Legion Pi 当前 manifest 为 schema v2，默认 `openai-codex/gpt-5.6-sol`，selector 只接受 `openai-codex/*`、`deepseek/*`、`kimi-coding/k3` 与 `kimi-coding/k3-256k`。
- Parser 继续接受 schema v1，以支持旧 profile 的 install、verify 与显式 rollback；v1 不渲染 model policy，v2 policy 必须逐字、逐序匹配。
- `setup-pi` 仍不管理 `auth.json`。Codex 使用 Pi 独立 OAuth；DeepSeek/Kimi 的 live host 使用 command-backed 引用，secret value 未进入 Git、generated settings、Nix、报告或日志。
- Startup probe 使用空的 in-memory credential store 且禁止 model refresh；验证不会读取 live auth、执行 resolver 或刷新 OAuth。
- 61/61 回归、7/7 TS/JS parity、三 provider bounded smoke、精确 11-model selector、live v1 rollback/v2 reinstall/idempotence、独立验证和安全复审均为 `PASS`。

## Reusable Decisions

- 区分三种模型真相：pinned package catalog、完整 authenticated catalog、由 `enabledModels` 产生的 selector scope；`pi --list-models` 不能替代 selector 验证。
- 模型策略属于 installer-managed manifest/settings，credential 属于 Pi 用户状态。不得把 credential 放入 manifest，也不得共享其他客户端的 OAuth refresh state。
- Pi 模型切换会改写 managed global settings。验收后必须关闭 disposable session、隔离 settings writer、force reconcile、重启服务、verify，并在 fresh session 复核默认模型。
- Command-backed credential 只有在 resolver 固定 source/selector、source/target 为当前用户 `0600` 普通文件、服务无 ambient fallback、失败 nonzero/empty-output 且进程在 key rotation 后重启时才满足当前边界。

## Related Raw Sources

- `plan`: `.legion/tasks/configure-pi-model-access/plan.md`
- `log`: `.legion/tasks/configure-pi-model-access/log.md`
- `tasks`: `.legion/tasks/configure-pi-model-access/tasks.md`
- `rfc`: `.legion/tasks/configure-pi-model-access/docs/rfc.md`
- `design review`: `.legion/tasks/configure-pi-model-access/docs/review-rfc.md`
- `verification`: `.legion/tasks/configure-pi-model-access/docs/test-report.md`、`.legion/tasks/configure-pi-model-access/docs/verify-change.md`
- `change review`: `.legion/tasks/configure-pi-model-access/docs/review-change.md`
- `report`: `.legion/tasks/configure-pi-model-access/docs/report-walkthrough.md`、`.legion/tasks/configure-pi-model-access/docs/pr-body.md`

## Notes

- Live auth 和 rollback anchor 是 host-local runtime state，不是发布包或 schema 真源；任务记录的最终 anchor 为 `1787113970531-7675a002`。
- Pi/extension package pins 未变化；本任务没有升级 Pi、修改 OpenCode auth、修改 PI WEB package 或改变网络拓扑。
- 精确行为以 `legion-pi/**`、`scripts/setup-pi.*`、`scripts/lib/pi-distro.*` 与 regression 为真源。
