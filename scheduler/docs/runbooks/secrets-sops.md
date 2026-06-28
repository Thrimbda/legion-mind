# Secret 管理运行手册：sops + age

## 规则

production-like acceptance 的 credentials 必须使用 `sops` 加密，并用 `age` 管理密钥。命令应通过 `sops exec-env` 注入 credentials，避免明文 secret 落盘。

## 文件

- 真实加密文件，不提交：`secrets/linear-scheduler.sops.yaml`
- 已提交的 schema example：`scheduler/docs/templates/secrets.linear-scheduler.sops.yaml`
- Age private key：放在 repo 外，通过 `SOPS_AGE_KEY_FILE` 或等价安全 key store 引用。

## 必需值

live read-path 的最小字段：

- `LINEAR_API_KEY`
- `LINEAR_PROJECT_ID`
- `GITHUB_TOKEN`
- `GITHUB_OPEN_PR_URL`
- `SCHEDULER_DB`

推荐 metadata 字段：

- `LINEAR_PROJECT_NAME`
- `LINEAR_TEAM_KEY`
- `LINEAR_DELEGATE_APP_USER_ID`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_MERGED_PR_URL`
- `GITHUB_CLOSED_PR_URL`
- `SCHEDULER_REPO_PATH`
- `SCHEDULER_RUN_URL_BASE`
- `LINEAR_WEBHOOK_SECRET`

Worker-only model/provider values 应使用 `worker-runner.ts` 已允许的 runtime allowlist，例如 `OPENCODE_*`、`OPENAI_*`、`ANTHROPIC_*`、`GEMINI_*`、`GOOGLE_*`、`AZURE_OPENAI_*` 或 `AWS_*`。

## 创建加密文件

示例流程：

```bash
mkdir -p secrets
cp scheduler/docs/templates/secrets.linear-scheduler.sops.yaml secrets/linear-scheduler.sops.yaml
sops --encrypt --age <age-recipient> --in-place secrets/linear-scheduler.sops.yaml
```

提交前必须确认真实 secret 文件被忽略，或仓库策略明确允许提交加密后的 secret 文件。

## 安全命令模式

Linear read-path scan：

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project --project "$LINEAR_PROJECT_ID" --db "$SCHEDULER_DB" --delegate "$LINEAR_DELEGATE_APP_USER_ID" --scheduler-run-url-base "$SCHEDULER_RUN_URL_BASE"'
```

GitHub PR read-path tracking：

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- delivery track --run "$SCHEDULER_RUN_ID" --repo "$SCHEDULER_REPO_PATH" --pr-url "$GITHUB_OPEN_PR_URL" --db "$SCHEDULER_DB"'
```

## Credential 获取建议

Linear：

- 生产应优先使用 app / OAuth / client credentials；sandbox acceptance 可以使用权限受限的 test API key。
- Token 至少需要读取 sandbox project 的 issues、labels、states 和 relations。
- read-path acceptance 不应使用拥有 production workspace 写权限的 token。

GitHub：

- 优先使用只 scoped 到 sandbox repo 的 fine-grained token。
- read-path tracking 需要读取 PR metadata、check runs 和 reviews。
- 不要使用 admin token，不要绕过 branch protection。

OpenCode / model provider：

- 只提供 sandbox WI 需要的 worker runtime credentials。
- 不要把 `LINEAR_API_KEY` 或 `GITHUB_TOKEN` 暴露给 worker；`worker-runner.ts` 默认会剥离这些变量。

Webhook：

- 为后续 webhook 验证保存 `LINEAR_WEBHOOK_SECRET`。
- 当前仓库没有 packaged production webhook server command。

## 禁止事项

- 除非仓库策略明确允许，否则不要提交真实 `secrets/linear-scheduler.sops.yaml`。
- 不要把 secret 解密到 plaintext files。
- 不要把 token 值粘贴进 shell history、issue comments、PR comments 或 evidence reports。
- 除非明确批准，不要把 production credentials 放入 sandbox acceptance。
