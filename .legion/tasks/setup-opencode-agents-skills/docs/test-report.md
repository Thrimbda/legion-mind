# Test report: setup-opencode-agents-skills

## Summary

PASS. Regression tests passed, and a dry-run install with an isolated `HOME` showed skill targets under `.agents/skills`.

## Commands

```bash
npm run test:regression
```

Result: PASS — 10/10 Node regression tests passed.

```bash
mkdir -p ".cache/setup-opencode-agents-skills/home" && HOME="$PWD/.cache/setup-opencode-agents-skills/home" node scripts/setup-opencode.ts install --dry-run --json
```

Result: PASS — exited 0 with `OK_INSTALL`; emitted skill sync targets such as:

- `.cache/setup-opencode-agents-skills/home/.agents/skills/legion-workflow/SKILL.md`
- `.cache/setup-opencode-agents-skills/home/.agents/skills/engineer/SKILL.md`
- `.cache/setup-opencode-agents-skills/home/.agents/skills/report-walkthrough/SKILL.md`

## Why these commands

- `npm run test:regression` is the repository's regression surface for setup lifecycle behavior and catches install / verify / rollback / uninstall regressions.
- The isolated `HOME` dry-run directly proves the default `homedir()`-derived skill destination now resolves to `~/.agents/skills` without writing to the real user home directory.

## Skipped / not run

- No real install to the user's home directory was run; the task only needs to verify destination construction, and dry-run output provides that evidence without mutating global state.
