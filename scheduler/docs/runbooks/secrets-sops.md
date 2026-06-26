# Secrets Runbook: sops + age

## Policy

Production-like acceptance credentials must be encrypted with `sops` using `age`. Commands should inject credentials with `sops exec-env` so plaintext secrets do not land on disk.

## Files

- Real encrypted file, not committed: `secrets/linear-scheduler.sops.yaml`
- Committed schema example: `scheduler/docs/templates/secrets.linear-scheduler.sops.yaml`
- Age private key: outside repo, referenced through `SOPS_AGE_KEY_FILE` or an equivalent secure key store.

## Required Values

Minimum live read-path values:

- `LINEAR_API_KEY`
- `LINEAR_PROJECT_ID`
- `GITHUB_TOKEN`
- `GITHUB_OPEN_PR_URL`
- `SCHEDULER_DB`

Recommended metadata values:

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

Worker-only model/provider values should use the runtime allowlist already enforced by `worker-runner.ts`, such as `OPENCODE_*`, `OPENAI_*`, `ANTHROPIC_*`, `GEMINI_*`, `GOOGLE_*`, `AZURE_OPENAI_*` or `AWS_*`.

## How To Create The Encrypted File

Example shape:

```bash
mkdir -p secrets
cp scheduler/docs/templates/secrets.linear-scheduler.sops.yaml secrets/linear-scheduler.sops.yaml
sops --encrypt --age <age-recipient> --in-place secrets/linear-scheduler.sops.yaml
```

Before committing anything, confirm real secret files are ignored or intentionally excluded from git.

## Safe Command Pattern

Linear read-path scan:

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project --project "$LINEAR_PROJECT_ID" --db "$SCHEDULER_DB" --delegate "$LINEAR_DELEGATE_APP_USER_ID" --scheduler-run-url-base "$SCHEDULER_RUN_URL_BASE"'
```

GitHub PR read-path tracking:

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- delivery track --run "$SCHEDULER_RUN_ID" --repo "$SCHEDULER_REPO_PATH" --pr-url "$GITHUB_OPEN_PR_URL" --db "$SCHEDULER_DB"'
```

## Credential Guidance

Linear:

- Prefer app/OAuth/client credentials for production; sandbox acceptance may use a limited test API key.
- Token must be able to read the sandbox project issues, labels, states and relations.
- Do not use a token with production workspace write privileges for read-path acceptance.

GitHub:

- Prefer a fine-grained token scoped only to the sandbox repo.
- Required for read-path tracking: PR metadata, check runs and reviews.
- Do not bypass branch protection or use admin tokens for acceptance.

OpenCode/model provider:

- Provide only worker runtime credentials required for the sandbox WI.
- Do not expose `LINEAR_API_KEY` or `GITHUB_TOKEN` to the worker; `worker-runner.ts` strips those by default.

Webhook:

- Store `LINEAR_WEBHOOK_SECRET` for future webhook validation.
- Current repo does not include a packaged production webhook server command.

## Never Do This

- Do not commit real `secrets/linear-scheduler.sops.yaml` unless the repository policy explicitly allows encrypted secret files.
- Do not decrypt secrets to plaintext files.
- Do not paste token values into shell history, issue comments, PR comments or evidence reports.
- Do not put production credentials into sandbox acceptance unless explicitly approved.
