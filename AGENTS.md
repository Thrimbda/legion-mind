# LegionMind Agent Entry Rules

This repository uses Legion.

Before any exploration, implementation, or subagent dispatch for multi-step coding work:

1. Load `legion-workflow` first.
2. Then load/apply `agent-entry` (`skills/agent-entry/SKILL.md`) as this repo's entry overlay.
3. User instructions override everything else.

Do not bypass this entry sequence by patching code first, ignoring `.legion/`, or starting `engineer` before a stable task contract exists.
