# Verification report: harden legion-workflow gate

Date: 2026-04-25
Phase: `verify-change`
Result: **PASS**

## Why these checks were chosen

This change is documentation/skill hardening rather than executable runtime behavior. The strongest low-cost validation is therefore a targeted text consistency assertion over the changed skill, references, entry shims, and task evaluation note, plus `git diff --check` for patch hygiene. Full CLI/runtime regression remains skipped because this task explicitly does not change CLI command semantics or add a regression harness.

## Commands / checks run

### 1. Targeted documentation consistency assertions + patch hygiene

Command:

```bash
git diff --check && python3 - <<'PY'
from pathlib import Path
root=Path('/Users/c1/Work/legion-mind')
files={
'skill': root/'skills/legion-workflow/SKILL.md',
'matrix': root/'skills/legion-workflow/references/SUBAGENT_DISPATCH_MATRIX.md',
'autopilot': root/'skills/legion-workflow/references/REF_AUTOPILOT.md',
'design': root/'skills/legion-workflow/references/GUIDE_DESIGN_GATE.md',
'readme': root/'README.md',
'agents': root/'AGENTS.md',
'opencode': root/'.opencode/agents/legion.md',
'eval': root/'.legion/tasks/harden-legion-workflow-gate/docs/eval-entry-gate.md',
}
# Assertions checked required hardening elements, exactly three canonical execution modes,
# separated entry runtime states, non-conflicting entry shims/references, and old wording removal.
PY
```

Result: **PASS** (`31/31` targeted assertions passed; `git diff --check` passed).

Evidence summary:

- PASS: `SKILL.md` contains the required hardening elements: `1%` gate, `SUBAGENT-STOP`, user instruction priority, `Entry Checklist`, rationalization table, and real phase-skill loading requirement.
- PASS: execution modes are exactly the canonical three names across `SKILL.md`, `SUBAGENT_DISPATCH_MATRIX.md`, `REF_AUTOPILOT.md`, and `eval-entry-gate.md`:
  1. `默认实现模式`
  2. `已批准设计后的续跑模式`
  3. `重型仅设计模式`
- PASS: the prior inconsistent wording `已批准设计的续跑模式` is absent from the checked truth-source files.
- PASS: `bypass` / `restore` / `brainstorm` are documented as entry runtime states, not execution modes, in both `SKILL.md` and `SUBAGENT_DISPATCH_MATRIX.md`.
- PASS: `README.md`, `AGENTS.md`, and `.opencode/agents/legion.md` all describe `legion-workflow` as the mandatory first gate and do not conflict with user instruction priority.
- PASS: `REF_AUTOPILOT.md` does not weaken the gate; it says autopilot reduces non-blocking interruptions, not entry, design, verification, review, report, or wiki writeback.
- PASS: `GUIDE_DESIGN_GATE.md` does not weaken low-risk / Fast Track behavior; it requires stable contract and minimum design record, and says Fast Track does not skip the entry gate or design gate.
- PASS: patch hygiene check found no whitespace/error issues in the current diff.

### 2. Working tree / patch-scope observation

Command:

```bash
git status --short && git diff --stat && git diff -- <relevant task files and workflow docs>
```

Result: **PASS with note**.

- Relevant modified files are limited to workflow docs, entry shims, and this task documentation.
- Existing untracked paths are visible in the working tree (`.legion/ledger.csv`, `.legion/tasks/harden-legion-workflow-gate/`, `superpowers/`). This verification did not edit implementation code and only updates this report.

## Skipped items

- Full CLI/runtime tests: skipped because this task explicitly does not modify `skills/legion-workflow/scripts/legion.ts` or CLI command semantics.
- Installation verification (`setup-opencode.ts verify --strict`): skipped because the touched surface is documentation/skill wording, not install packaging; targeted checks provide more direct evidence for the stated acceptance criteria.
- Automated regression harness: skipped because the task constraints say this iteration is documentation-level and does not add a new harness.

## Summary

Verification now **passes** after the small execution-mode wording fix. The required hardening content is present, the execution modes are exactly three with canonical names, entry runtime states are separated from execution modes, the README / AGENTS / OpenCode agent and references do not conflict, and patch hygiene passed.
