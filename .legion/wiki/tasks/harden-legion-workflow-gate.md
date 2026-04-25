# Task summary: harden-legion-workflow-gate

## Status

- Date: 2026-04-25
- Result: completed
- Source docs: `.legion/tasks/harden-legion-workflow-gate/`

## What changed

- Strengthened `skills/legion-workflow/SKILL.md` with using-superpowers-style gate hardening:
  - 1% entry threshold before exploration / implementation / questions / subagent dispatch
  - `SUBAGENT-STOP` for spawned phase subagents
  - user instruction priority and explicit bypass semantics
  - mechanical Entry Checklist
  - rationalization table for common bypass excuses
  - real stage skill / subagent loading requirement
- Clarified references:
  - dispatch matrix applies after stable contract only
  - autopilot reduces user interruptions, not stages or evidence
  - low-risk / design-lite / fast track still require stable contract and minimal design record
- Synced README / AGENTS / OpenCode agent entry wording.
- Follow-up documentation supplement expanded `SKILL.md` diagrams into an entry state machine, a mode selector, and stage-chain rollback map after review found the earlier diagrams too shallow.

## Current effective conclusion

- `legion-workflow` is the mandatory first gate for Legion-managed non-simple multi-step engineering work.
- Execution modes remain exactly three after a stable contract exists:
  1. 默认实现模式
  2. 已批准设计后的续跑模式
  3. 重型仅设计模式
- Entry runtime states are separate and remain:
  - `bypass`
  - `restore`
  - `brainstorm`
- Completion for applicable chains is valid only after reviewer-facing evidence and `legion-wiki` writeback; skipped report/wiki stages are invalid completion.

## Evidence

- RED baseline and after expectations: `.legion/tasks/harden-legion-workflow-gate/docs/eval-entry-gate.md`
- Verification: `.legion/tasks/harden-legion-workflow-gate/docs/test-report.md` (`PASS`, targeted assertions 31/31, `git diff --check` pass)
- Review: `.legion/tasks/harden-legion-workflow-gate/docs/review-change.md` (`PASS`)
- Walkthrough / PR body: `.legion/tasks/harden-legion-workflow-gate/docs/report-walkthrough.md`, `.legion/tasks/harden-legion-workflow-gate/docs/pr-body.md`

## Follow-ups

- No mandatory follow-up recorded.
- If future work adds automated skill pressure harnesses, link them back to the baseline scenarios in `docs/eval-entry-gate.md`.
