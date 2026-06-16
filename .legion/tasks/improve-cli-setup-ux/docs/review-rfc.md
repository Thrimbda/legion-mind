# review-rfc: `lgmind` setup UX

## Decision

PASS.

## Blocking findings

None.

## Review lenses

- **Scope clarity:** PASS. The RFC limits “agent selection” to runtime selection and explicitly excludes per-agent subset selection.
- **Command compatibility:** PASS. Keeping `setup-opencode` as a direct OpenCode alias prevents the product-level `lgmind` aggregator from breaking the existing alias contract.
- **Interactive safety:** PASS. The RFC forbids CI hangs by prompting only in TTY and keeping a non-interactive `--agent` path.
- **Logging compatibility:** PASS. `--json` remains event-rich, while `--verbose` restores detailed text logs; default quiet mode only hides OK success noise and keeps warnings/errors visible.
- **Package surface:** PASS. The RFC calls out package allowlist changes required for OpenClaw npm support and includes pack dry-run verification.
- **Rollback:** PASS. Pre-merge rollback, partial revert options, and detailed-output escape hatches are clear enough.

## Non-blocking suggestions

- Keep summary wording stable and easy to assert in tests, but do not over-specify it as a public API.
- If implementing both `--agent` and `--runtime`, treat one as a pure alias to avoid divergent docs.
- Ensure default non-TTY `lgmind setup` behavior is documented so automation users are not surprised by the OpenCode default.

## Handoff

Implementation may proceed according to `docs/rfc.md`.
