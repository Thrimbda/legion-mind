# review-change: harden-v1-kernel-harness

## Verdict

PASS.

Security lens applied because setup scripts write to user config/skill directories and use managed manifests / backup indexes for rollback and uninstall.

## Blocking findings

None.

## Review notes

- **Prior blocker 1 closed — shared lifecycle core:** `scripts/lib/setup-core.ts` now owns common lifecycle/destructive operations (`syncOneFileCore`, `verifyStrictItemCore`, `rollbackCore`, `uninstallCore`, backup-index validation, managed-root checks, copy/link/rename/remove helpers). `scripts/setup-opencode.ts` and `scripts/setup-openclaw.ts` now act as runtime adapters for argument parsing, source enumeration, managed-root declarations, state locations, and OpenClaw config handling.
- **Prior blocker 2 closed — destructive path hardening:** rollback/uninstall now validate backup-index shape, reject managed-root-as-target via `allowRoot: false`, require canonical containment for destructive operations, and refuse symlinked managed roots for rollback/uninstall. Tampered backup paths must match the expected backup path and remain under managed roots.
- **Prior blocker 3 closed — regression evidence:** `npm run test:regression` is reported passing 10/10, including rollback `--to`, uninstall drift safe-skip/force, tampered manifest/backup path rejection, symlinked managed-root refusal, invalid backup-index blocking, OpenCode/OpenClaw lifecycle, skill surface, and CLI invariants. Tests continue to use repo-local `.cache/regression` temp roots.
- **Scope compliance:** README/docs/benchmark changes remain within the approved current-truth convergence scope. README limits support to OpenCode/OpenClaw, deleted docs are not referenced by checked current surfaces, and no runtime orchestrator or non-OpenCode/OpenClaw support expansion is evident.
- **OpenClaw config semantics:** `openclaw.json` remains conservatively handled: install appends `skills.load.extraDirs`, verify treats config compatibility as warning-only, and rollback/uninstall do not own or delete user config.

## Non-blocking suggestions

- Consider a future small refactor to make `targetWithinManagedRoots` root/canonical correspondence easier to audit, but current behavior is conservative for the reviewed destructive cases.

## Return condition

Ready to proceed to `report-walkthrough` / PR lifecycle.
