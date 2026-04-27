# review-rfc: harden-v1-kernel-harness

## Verdict

PASS

## Blocking findings

None.

The RFC is implementable, has a bounded file/module scope, keeps the CLI thin, limits runtime support to OpenCode/OpenClaw, and defines verification evidence strong enough to gate implementation. Rollback is explicit at code, docs, tests, and user-install levels.

## Review notes

- **Implementability**: PASS. The shared setup core plus thin OpenCode/OpenClaw adapters gives clear ownership boundaries. Adapter-specific behavior is separated from core install/verify/rollback/uninstall primitives, which reduces drift risk without introducing a runtime orchestrator.
- **Verification strength**: PASS. The proposed `node:test` regression suite directly covers setup lifecycle, skill surface parity, and CLI filesystem invariants in isolated temp directories. The `verify-change` plan names concrete commands and fallback reporting requirements.
- **Rollback clarity**: PASS. The RFC distinguishes implementation rollback from end-user installation rollback and avoids managing the whole `openclaw.json`, which is appropriately conservative.
- **Scope compliance**: PASS. The RFC deletes outdated root docs, converges current truth into README/wiki/skills/benchmark README, removes generalized non-OpenCode/OpenClaw runtime narrative, excludes repo hygiene/worktree cleanup, and preserves the CLI as a thin filesystem tool.
- **User constraints**: PASS. OpenClaw is aligned with OpenCode for rollback/uninstall/manifest/shared core/strict managed-file verification while documenting the limited, conservative treatment of `openclaw.json`.

## Non-blocking implementation cautions

1. Make the README wording match the conservative `openclaw.json` behavior exactly: managed skill files can be strict failures, while optional `skills.load.extraDirs` config compatibility remains warning-only unless later covered by an explicit flag and tests.
2. When deleting `docs/`, include a reference check that catches stale links from README, wiki, package metadata, and benchmark README, not only README.
3. Keep `scripts/lib/setup-core.ts` runtime-agnostic; do not let OpenClaw/OpenCode path conventions leak into core beyond adapter-provided config.

## Required changes before engineer

None.
