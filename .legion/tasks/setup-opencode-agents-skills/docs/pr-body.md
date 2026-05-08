## Summary

- Change `setup-opencode.ts` skill installation default from `~/.opencode/skills` to `~/.agents/skills`.
- Update README default target documentation to match the new agents skill destination.
- Add Legion task evidence for contract, verification, review, and walkthrough.

## Verification

- `npm run test:regression` — PASS, 10/10 tests.
- `HOME="$PWD/.cache/setup-opencode-agents-skills/home" node scripts/setup-opencode.ts install --dry-run --json` — PASS, emitted `.agents/skills/<skill>` targets.

## Notes

- `--opencode-home` remains supported as an explicit override for compatibility.
