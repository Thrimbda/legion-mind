# review-rfc: setup-opencode npm CLI surface

## Decision

PASS.

## Findings

No blocking findings.

## Review lenses

- **Scope clarity:** PASS. The RFC limits the task to the OpenCode npm CLI surface and explicitly excludes OpenClaw redesign, publishing, and workflow semantic changes.
- **Alternatives:** PASS. The meaningful trade-off between direct TypeScript bin, JS wrapper, and compiled distribution is explicit, and the wrapper decision is proportionate to the current Node engine constraint.
- **Verification:** PASS. The plan includes regression tests, wrapper help/version smoke, isolated lifecycle smoke, and npm package content inspection.
- **Rollback:** PASS. Reverting metadata/wrapper/docs is enough because installer-managed user data semantics remain unchanged.
- **Assumptions:** PASS with note. The package-name decision is explicit and backed by a registry 404 at task start. If reviewer preference changes before publish, the implementation can keep the bin and adjust package name/docs without invalidating the wrapper design.

## Non-blocking suggestions

- Prefer tests that inspect `npm pack --dry-run --json` output without creating tarballs when possible.
- Keep local npm cache/log output under `.cache/npm` during verification to avoid repo-external persistent artifacts.

## Handoff

Implementation may proceed using Option B from `docs/rfc.md`.
