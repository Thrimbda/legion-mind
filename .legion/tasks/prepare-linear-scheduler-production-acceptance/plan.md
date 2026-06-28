# 准备 Linear Scheduler 生产验收

## Contract

- **Name**: 准备 Linear Scheduler 生产验收
- **Task ID**: `prepare-linear-scheduler-production-acceptance`
- **目标**: 准备一套 sandbox-first 的 production-like acceptance package，让操作者能安全暴露 live-read / integration 缺口，而不会误把本地原型当成 production ready。
- **Problem**: scheduler 已通过本地原型验收，但生产 rollout 仍被真实 Linear/GitHub/OpenCode 行为未验证、native writeback adapter 缺失、live project dispatch 缺失、packaged webhook/server runner 缺失所阻塞。下一步需要精确的 runbook、templates、secrets handling 和 fixtures，供后续安全执行 live acceptance。

## Acceptance Criteria

1. 新增 production acceptance runbook，明确 sandbox-first policy、staged acceptance flow、stop/go criteria 和当前已知 blockers。
2. 新增 scheduler-local checklist/runbooks/templates，覆盖 sops/age secrets、Linear sandbox setup、GitHub sandbox setup 和 evidence capture。
3. 新增只含 placeholder 的 `secrets/linear-scheduler.sops.yaml` schema example，使用 sops YAML + age + `sops exec-env`。
4. 新增或修复 committed fixtures，让 README 中的 scan/dispatch fixture commands 指向真实文件。
5. 更新 scheduler README 和 Linear scheduler docs index，补充 links 和准确的安全说明。
6. 验证本地无 secret 路径：markdown/JSON sanity、scheduler regression、fixture scan/dispatch smoke。
7. 不实现缺失的生产 runtime 能力，不运行 live acceptance，不提交真实 secrets。

## 范围

- `docs/linear-legion-scheduler/production-acceptance-runbook.md`
- `docs/linear-legion-scheduler/index.md`
- `scheduler/README.md`
- `scheduler/docs/production-acceptance-checklist.md`
- `scheduler/docs/runbooks/**`
- `scheduler/docs/templates/**`
- `scheduler/tests/fixtures/**`
- Task-local Legion evidence under `.legion/tasks/prepare-linear-scheduler-production-acceptance/**`
- Wiki writeback under `.legion/wiki/**`

## Non-goals

- 不执行真实 production 或 sandbox acceptance。
- 不创建或解密真实 Linear/GitHub/OpenCode credentials。
- 不提交含真实 credentials 的 encrypted secret instance。
- 不实现 Linear native writeback adapter。
- 不实现 live `dispatch project`。
- 不实现 webhook server / outbox daemon。
- 不修改 OpenCode worker dispatch behavior。
- 不宣称 sandbox acceptance 等于 production readiness。

## Assumptions

- 用户确认 sandbox-first acceptance。
- 用户会在 repo-local `secrets/` 下管理真实 credentials，并用 sops YAML + age 加密。
- Acceptance commands 应通过 `sops exec-env` 注入 credentials，避免 plaintext 落盘。
- 缺失 runtime capabilities 应作为 expected blockers 记录，而不是绕过。

## Constraints

- 所有实现发生在 `.worktrees/prepare-linear-scheduler-production-acceptance/`。
- Persistent artifacts 和 temporary acceptance outputs 必须留在 repo-local 路径。
- Secret templates 只能包含 placeholders。
- Docs 必须区分 external read + DB write 与真正的 read-only。

## Risks

- 如果 runbook 暗示 `scan project` 或 `delivery track` 是纯只读，会造成危险误解；两者都会写 scheduler DB state。
- Operator 可能把 fixture dispatch 误当成 live dispatch；docs 必须明确 live `dispatch project` 未实现。
- Native writeback 和 webhook packaging 是 production blockers，必须出现在 checklist 中。
- README 示例曾引用缺失 fixture 和错误 path context，本任务需要修正该漂移。

## 设计摘要

- 交付 documentation-first acceptance package，并配套 fake fixtures。
- 使用单一 top-level production acceptance runbook 作为 reviewer/operator 入口。
- 操作细节放在 `scheduler/docs/runbooks/`，可复用记录表放在 `scheduler/docs/templates/`。
- `scheduler/README.md` 保持简洁，链接到更深层 runbooks。
- 只用 local tests 和 fixture commands 验证；live acceptance 留给后续 operator 使用 encrypted secrets 执行。

## Phases

1. 物化任务 docs 并打开 worktree。
2. 添加 production acceptance runbook、checklist、runbooks 和 templates。
3. 添加 fake project fixture 和 PR fixtures，更新 README/docs links。
4. 运行本地验证并修正文档/fixture 问题。
5. 产出 test report、review、walkthrough 和 wiki writeback。
6. 完成 PR lifecycle。
