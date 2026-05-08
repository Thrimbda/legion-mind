# Report walkthrough: setup-opencode-agents-skills

Mode: implementation.

## What changed

- Changed `scripts/setup-opencode.ts` so the default skill home resolves to `~/.agents` instead of `~/.opencode`.
- Because the existing sync code appends `skills/<skill>`, installed skills now default to `~/.agents/skills/<skill>`.
- Updated `README.md` default target documentation from `~/.opencode/skills` to `~/.agents/skills`.

## Why

The setup script needs to copy Legion skills into the agents skill directory discovered by the current runtime environment. Keeping the old OpenCode skill location would install the files where they are no longer expected.

## Verification evidence

- `npm run test:regression` passed 10/10 tests.
- Isolated `HOME=.../.cache/setup-opencode-agents-skills/home` dry-run install exited with `OK_INSTALL` and emitted `.agents/skills/<skill>` targets.

See `docs/test-report.md` for command details.

## Review evidence

`docs/review-change.md` verdict: PASS. No blocking findings; no expanded security trigger beyond local filesystem destination review.

## Reviewer notes

- The existing `--opencode-home` override remains unchanged for compatibility and for isolated regression tests.
- No real user home installation was performed during verification.
