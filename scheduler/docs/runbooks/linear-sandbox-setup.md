# Linear Sandbox 设置运行手册

## 目标

创建一个 Linear sandbox project，用来验证 scheduler read-path 决策，不影响生产工作。

## Project

推荐项目：

- Name: `Legion Scheduler Sandbox`
- Key 或 slug: `scheduler-sandbox`
- Team key: `SBOX`，或其他明确非生产的 team key

创建后，把 project ID 记录到加密 secret 文件中的 `LINEAR_PROJECT_ID`。

## 必需 Labels

Scheduler policy labels：

- `agent:ready`
- `contract:stable`
- `contract:needs-review`
- `agent:needs-human`
- `repo:legion-mind`
- `risk:low`
- `risk:medium`
- `risk:high`
- `area:api`
- `area:docs`
- `area:ui`
- `mutex:db-migration`

可选 sandbox filter labels：

- `scheduler:sandbox`
- `scheduler:read-path`
- `scheduler:dispatch-fixture`
- `scheduler:github-linked`

## 必需 Issue Scenarios

| Identifier | 用途 | Labels | Blockers | 预期 scheduler 判断 |
|---|---|---|---|---|
| `SBOX-READY` | 基础 ready WI | `agent:ready`, `contract:stable`, `repo:legion-mind`, `risk:low`, `area:docs` | none | ready |
| `SBOX-MANUAL-DONE` | 人工完成的上游 | `contract:stable`, `repo:legion-mind`, `risk:low` | none | 非 candidate；无 active agent labels 时可满足 blocker |
| `SBOX-BLOCKED-BY-MANUAL` | 依赖 manual Done 的下游 | `agent:ready`, `contract:stable`, `repo:legion-mind`, `risk:low`, `area:api` | `SBOX-MANUAL-DONE` | manual blocker satisfied 后 ready |
| `SBOX-UPSTREAM-ACTIVE` | 未完成上游 | `agent:running`, `contract:stable`, `repo:legion-mind`, `risk:medium`, `area:api` | none | 非 candidate / blocker 未满足 |
| `SBOX-DEPENDENCY-BLOCKED` | 被依赖阻塞的下游 | `agent:ready`, `contract:stable`, `repo:legion-mind`, `risk:medium`, `area:ui` | `SBOX-UPSTREAM-ACTIVE` | skipped `dependency_blocked` |
| `SBOX-NEEDS-HUMAN` | 人工门禁 | `agent:ready`, `agent:needs-human`, `contract:stable`, `repo:legion-mind`, `risk:medium`, `area:docs` | none | skipped `human_gate` |
| `SBOX-CONTRACT-MISSING` | 缺少 stable contract | `agent:ready`, `repo:legion-mind`, `risk:low`, `area:docs` | none | skipped `contract_not_stable` |
| `SBOX-RISK-MISSING` | 缺少 risk | `agent:ready`, `contract:stable`, `repo:legion-mind`, `area:docs` | none | skipped `risk_missing` |
| `SBOX-LOCK-A` | lock 冲突 A | `agent:ready`, `contract:stable`, `repo:legion-mind`, `risk:medium`, `area:api` | none | ready / fixture dispatch 中可 claim |
| `SBOX-LOCK-B` | lock 冲突 B | `agent:ready`, `contract:stable`, `repo:legion-mind`, `risk:medium`, `area:api` | none | 当 `SBOX-LOCK-A` 已 planned / claimed 时等待 lock |

## Issue Body 模板

使用 WI-01 policy 字段：

```md
## 目标

仅用于 sandbox scheduler acceptance。这个 issue 不得触碰生产代码或生产 Linear 工作。

## 验收标准
- [ ] Scheduler read-path 按预期分类该 issue。
- [ ] 证据已记录到 acceptance report。

## 范围
- 仅限 sandbox acceptance。

## 非范围
- Production code changes。
- Production Linear writeback。

## 依赖 / Blockers
- Blocks: <按需填写>
- Blocked by: <按需填写>

## 仓库 / Package
- repo: legion-mind
- area: <docs|api|ui>

## 风险等级
- risk: low
- design gate hint: none

## 验证
- 针对 sandbox project 运行 `scan project`。

## 交付说明
- 除非后续阶段明确批准，否则不应运行 worker。
```

## Live Read-Path 命令

```bash
sops exec-env secrets/linear-scheduler.sops.yaml 'npm --prefix scheduler run debug -- scan project --project "$LINEAR_PROJECT_ID" --db "$SCHEDULER_DB" --delegate "$LINEAR_DELEGATE_APP_USER_ID" --scheduler-run-url-base "$SCHEDULER_RUN_URL_BASE"'
```

## 需要记录的证据

- Linear project ID / name / key。
- Issue identifiers 和 labels。
- Blocker relations。
- Ready count 和 identifiers。
- Skipped count 和 reasons。
- 任何异常 state / label mapping。

## 停止条件

- scan 中出现 production project。
- human-gated 或 contract-missing issue 被判为 ready。
- scan output 无法用预期 issue table 解释。
