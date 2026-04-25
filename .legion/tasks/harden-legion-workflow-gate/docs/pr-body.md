## Summary

- Hardened `legion-workflow` and adjacent entry docs so Legion-managed multi-step engineering work routes through the mandatory first gate before exploration, implementation, questioning, or subagent dispatch.
- Clarified references and entry shims without changing CLI command semantics, adding a persistent active-task registry, or adding execution modes.
- Recorded pressure-evaluation, verification, and review evidence for the documentation/skill workflow change.

## Mode

Reviewer view: `implementation` mode.

## Evidence

- Verification: `docs/test-report.md` reports **PASS** with `git diff --check` and `31/31` targeted documentation consistency assertions passing.
- Review: `docs/review-change.md` reports **PASS** with no blocking findings.
- Evaluation: `docs/eval-entry-gate.md` records RED baseline pressure scenarios and after-change expected behavior.

## Important clarification

Execution modes remain exactly three: `默认实现模式`, `已批准设计后的续跑模式`, and `重型仅设计模式`.

Entry runtime states are separate: `bypass`, `restore`, and `brainstorm` are not execution modes.

## Skipped / not claimed

- Full CLI/runtime regression was not run because this change does not modify CLI command semantics.
- Install verification and a new automated regression harness were not run; the verification report documents the rationale.
- Security review was not applied because the change is documentation/skill workflow hardening and does not alter security-sensitive behavior.
