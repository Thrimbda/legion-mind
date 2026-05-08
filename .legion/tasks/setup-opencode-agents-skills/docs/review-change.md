# Review change: setup-opencode-agents-skills

## Verdict

PASS.

## Scope compliance

- In scope: `scripts/setup-opencode.ts` default skill home now resolves to `~/.agents`, which preserves existing `skills/<skill>` path construction and therefore installs skills under `~/.agents/skills/<skill>`.
- In scope: README default target summary was updated to match the new script default.
- No unrelated runtime behavior, lifecycle logic, or setup command semantics were changed.

## Correctness and maintainability

- The change preserves the existing `--opencode-home` override behavior, so regression tests using isolated homes remain valid.
- The managed root, collect, verify, rollback, and uninstall code all continue to use the same option value, avoiding mixed skill destinations.
- Verification includes both lifecycle regression coverage and a dry-run proving the default `HOME` path emits `.agents/skills` targets.

## Security lens

No security trigger requiring expanded review was present. The change only alters a default local filesystem destination for managed skill files and does not add auth, token, trust-boundary, secret-handling, or remote input behavior.

## Blocking findings

None.

## Non-blocking notes

- The flag name remains `--opencode-home` for compatibility; a future naming cleanup could introduce an alias, but that is outside this task.
