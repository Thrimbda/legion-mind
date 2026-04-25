# Report walkthrough: harden legion-workflow gate

Mode: `implementation`
Date: 2026-04-25

## Reviewer orientation

This task hardens the `legion-workflow` entry gate documentation and adjacent entry shims. The goal from `plan.md` is to make `legion-workflow` behave more like a mandatory first gate for Legion-managed repositories before file/git/code exploration, implementation, questioning, or subagent dispatch.

This is a documentation/skill workflow change. Per `docs/test-report.md`, full CLI/runtime regression was skipped because this task does not modify `skills/legion-workflow/scripts/legion.ts` or CLI command semantics.

## What changed, by evidence

- `skills/legion-workflow/SKILL.md` was strengthened with the required gate-hardening elements recorded in `docs/test-report.md` and `docs/review-change.md`: a 1% entry threshold, `SUBAGENT-STOP`, user instruction priority, a mechanical Entry Checklist, real phase-skill loading requirement, and a rationalization table.
- `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`, `REF_AUTOPILOT.md`, and `GUIDE_DESIGN_GATE.md` were clarified so they do not create a second workflow source of truth or weaken entry/design/verification/review/report/wiki stages.
- `README.md`, `AGENTS.md`, and `.opencode/agents/legion.md` were synchronized to describe `legion-workflow` as the mandatory first gate for Legion-managed multi-step engineering work.
- `.legion/tasks/harden-legion-workflow-gate/docs/eval-entry-gate.md` records the RED baseline pressure scenarios and after-change expected behavior.

Changed-file summary from the current diff stat:

- `.opencode/agents/legion.md`
- `AGENTS.md`
- `README.md`
- `skills/legion-workflow/SKILL.md`
- `skills/legion-workflow/references/GUIDE_DESIGN_GATE.md`
- `skills/legion-workflow/references/REF_AUTOPILOT.md`
- `skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md`

Working-tree note from verification/review evidence: existing untracked paths include `.legion/ledger.csv`, `.legion/tasks/harden-legion-workflow-gate/`, and `superpowers/`; `docs/review-change.md` recommends keeping unrelated untracked paths out of this task unless separately justified.

## Mode and state clarification

Execution modes remain exactly three:

1. `默认实现模式`
2. `已批准设计后的续跑模式`
3. `重型仅设计模式`

Entry runtime states are separate from execution modes: `bypass`, `restore`, and `brainstorm`. They occur at the entry/runtime layer and must not be counted as additional execution modes.

## Verification evidence

From `docs/test-report.md`:

- Result: **PASS**.
- `git diff --check` passed.
- Targeted documentation consistency assertions passed (`31/31`).
- The assertions covered required hardening elements, the exact three canonical execution modes, separation of entry runtime states, entry shim/reference consistency, and removal of prior inconsistent wording.
- Full CLI/runtime tests, install verification, and a new regression harness were explicitly skipped with documented rationale.

## Review evidence

From `docs/review-change.md`:

- Result: **PASS**.
- Blocking findings: none.
- Correctness, maintainability, scope compliance, and verification evidence all passed.
- Security lens was not applied because the reviewed change is documentation/skill workflow hardening and does not alter auth, permissions, secrets, crypto, trust boundaries, privileged user input handling, privacy, or tenant isolation behavior.

## Reviewer checklist

- Confirm the diff is limited to the documented workflow docs, entry shims, and task documentation.
- Confirm no CLI command semantics or persistent active-task registry are introduced.
- Confirm the three execution modes and separate entry runtime states are not conflated.
- Confirm the PR does not include unrelated untracked paths unless intentionally scoped.
