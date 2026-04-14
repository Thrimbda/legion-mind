# LegionMind Agent Entry Rules

This repository uses Legion.

Before any exploration, implementation, or subagent dispatch for multi-step coding work, load `legion-workflow` first and follow it.

## Required Entry Behavior

1. If `.legion/` exists, restore the active task before doing freeform work.
2. If there is no stable `plan.md` / `tasks.md`, use `brainstorm` before implementation.
3. Do not invoke `engineer` or write production code before a stable task contract exists.
4. Use `legion-docs` only for `.legion` document placement, schema, and density rules.
5. User instructions override everything else.

## Red Flags

- "This task is simple, I can skip Legion"
- "I'll just patch the code first"
- "I'll let engineer start and come back to `.legion` later"
- "I can ignore existing `.legion` state"

All of these mean: stop and re-enter through `legion-workflow`.
