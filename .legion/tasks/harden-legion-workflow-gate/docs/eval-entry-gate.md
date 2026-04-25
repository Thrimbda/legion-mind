# Entry gate pressure evaluation

## RED baseline (before modification)

Baseline method: an `explore` subagent reviewed the current unmodified `legion-workflow` skill and adjacent entry references against pressure scenarios. This is a documentation-level RED phase for a discipline-enforcing skill; it identifies likely rationalizations to close before editing the skill.

| Pressure scenario | Likely baseline failure | Current text that helps | Missing countermeasure |
|---|---|---|---|
| “Just quickly fix this; first inspect files.” | Agent may treat file inspection as harmless pre-work and read code before the Legion gate. | `SKILL.md` and `AGENTS.md` say no free exploration before entry judgment. | Explicitly state that inspecting files/git for coding work is already exploration and must follow the gate. |
| “Small one-line change, no workflow.” | Agent may treat “small” or “no workflow” as bypass. | Fast-track/design-lite exists for low risk. | Clarify that small work can become low-risk path, not skip the entry gate unless user explicitly chooses true bypass. |
| “Continue last task” without task id/path. | Agent may infer the newest `.legion/tasks/*` task and restore it. | Current text says no explicit restore target means `brainstorm`. | Explicitly forbid guessing by recency; require task id/path or `brainstorm`. |
| “Autopilot, don’t ask me.” | Agent may treat autopilot as permission to skip contract/design/review/wiki. | `REF_AUTOPILOT.md` keeps subagent dispatch mandatory. | State autopilot reduces user interruptions, not Legion stages or evidence. |
| “Tests passed, skip report/wiki.” | Agent may accept user-supplied test claims and skip verification/report/wiki. | Matrix and `SKILL.md` already require `report-walkthrough -> legion-wiki`. | Clarify test claims are input evidence, not a replacement for `verify-change`; closing writeback remains fixed. |
| Stage subagent sees `legion-workflow`. | Engineer/review subagent may recursively re-run the workflow gate. | `SKILL.md` says not to use as a spawned subagent. | Add explicit `SUBAGENT-STOP`: stage subagents must follow received contract/scope and escalate missing contract to orchestrator. |

## After-change expected behavior

- Agents run the `legion-workflow` entry checklist before file/git/code exploration for Legion-managed engineering work.
- Ambiguous restore requests do not infer a task by recency.
- Autopilot remains compatible with contract-first and design gate; it only reduces avoidable human interruptions.
- Stage subagents do not recursively take over orchestration.
- `report-walkthrough` and `legion-wiki` remain mandatory closing stages for implementation and design handoff chains.

## Execution mode classification

`legion-workflow` should expose exactly **three execution modes** after a stable contract exists:

1. 默认实现模式
2. 已批准设计后的续跑模式
3. 重型仅设计模式

`bypass`、`restore`、`brainstorm` are **entry runtime states**, not execution modes.
