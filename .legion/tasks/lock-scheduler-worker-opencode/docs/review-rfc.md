# Review RFC: Lock scheduler worker runtime to OpenCode

> **Task**: `lock-scheduler-worker-opencode`  
> **Review target**: `docs/linear-legion-scheduler/rfc.md` and `docs/linear-legion-scheduler/work-items/WI-04-legion-worker-runner.md`  
> **Created**: 2026-06-23

---

## Verdict

PASS

## Blocking findings

None.

## Non-blocking suggestions addressed

- RFC architecture diagram changed from generic `Agent Worker Launcher -> Legion Workflow Adapter` to `OpenCode Worker Launcher -> OpenCode Worker Contract`.
- WI-04 evidence verifier list now includes `tasks.md` and `log.md`, matching RFC §9.5 more closely.

## Review summary

- 首版 worker runtime 已明确锁定为 OpenCode。
- OpenClaw / Codex / custom 只作为非目标或未来独立 RFC 出现。
- Startup contract 覆盖 prompt artifact、目标 repo 上下文、第一动作 `legion-workflow`、result block。
- 完成 gate 保留 result block + GitHub PR state + Legion evidence verifier。
- 未写死未验证的 OpenCode CLI 参数。
