# Linear Sandbox Issues 模板

在 Linear sandbox project 中创建这些 issues。创建后，用 workspace 实际生成的 issue keys 替换示例 identifiers。

## SBOX-READY

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `risk:low`
- `area:docs`

预期：ready。

## SBOX-MANUAL-DONE

State: Done

Labels:

- `scheduler:sandbox`
- `contract:stable`
- `repo:legion-mind`
- `risk:low`

预期：不是 candidate；只有没有 active agent labels 时，才可通过 manual Done policy 满足 blocker。

## SBOX-BLOCKED-BY-MANUAL

Blocked by: `SBOX-MANUAL-DONE`

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `risk:low`
- `area:api`

预期：manual blocker satisfied 后 ready。

## SBOX-UPSTREAM-ACTIVE

State: In Progress

Labels:

- `scheduler:sandbox`
- `agent:running`
- `contract:stable`
- `repo:legion-mind`
- `risk:medium`
- `area:api`

预期：不是 candidate，且 blocker 未满足。

## SBOX-DEPENDENCY-BLOCKED

Blocked by: `SBOX-UPSTREAM-ACTIVE`

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `risk:medium`
- `area:ui`

预期：skipped `dependency_blocked`。

## SBOX-NEEDS-HUMAN

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `agent:needs-human`
- `contract:stable`
- `repo:legion-mind`
- `risk:medium`
- `area:docs`

预期：skipped `human_gate`。

## SBOX-CONTRACT-MISSING

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `repo:legion-mind`
- `risk:low`
- `area:docs`

预期：skipped `contract_not_stable`。

## SBOX-RISK-MISSING

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `area:docs`

预期：skipped `risk_missing`。

## SBOX-LOCK-A

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `risk:medium`
- `area:api`

预期：ready；可在 fixture dispatch 中被 claim。

## SBOX-LOCK-B

Labels:

- `scheduler:sandbox`
- `agent:ready`
- `contract:stable`
- `repo:legion-mind`
- `risk:medium`
- `area:api`

预期：当 `SBOX-LOCK-A` 已 planned / claimed 时，等待 `area:legion-mind/api`。

## 可复制 Body

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
