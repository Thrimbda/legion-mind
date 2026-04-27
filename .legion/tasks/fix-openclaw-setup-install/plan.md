# Fix OpenClaw setup install

## Goal

Make `npm run openclaw:install` a reliable installer for LegionMind skills in OpenClaw by aligning `scripts/setup-openclaw.ts` with the safer install/verify behavior already used by `setup-opencode.ts`.

## Problem

The current OpenClaw setup script only edits `~/.openclaw/openclaw.json` to add this checkout's `skills/` directory to `skills.load.extraDirs`. That can work for a live checkout, but it does not provide the same reliability properties as the OpenCode installer: no managed install state, no copied skill assets under OpenClaw's managed skill root, weak verification, and no safe handling of existing user-owned skill files.

## Acceptance

- `npm run openclaw:install` installs the LegionMind skill set into OpenClaw's managed skill location in a way OpenClaw can discover outside this repository workspace.
- Install preserves user-owned files by default, records managed ownership, and only overwrites conflicts with explicit force behavior.
- `npm run openclaw:verify` can detect missing or drifted installed files, not just a configured path.
- The script keeps useful operational flags such as `--dry-run`, `--json`, and configurable target directories.
- The implementation stays scoped to OpenClaw setup behavior and does not alter OpenClaw itself.

## Assumptions

- OpenClaw discovers managed/local skills from `~/.openclaw/skills` and can also scan `skills.load.extraDirs` from `~/.openclaw/openclaw.json`.
- The canonical LegionMind skill sources are the repository `skills/<name>/` directories.
- The OpenCode installer is the preferred local pattern for managed-file manifests, safe overwrite behavior, and strict verification.

## Constraints

- Development must occur in `.worktrees/fix-openclaw-setup-install/` under the git worktree PR lifecycle envelope.
- Do not manually edit `.legion/ledger.csv`; it is unrelated to this implementation.
- Do not introduce external dependencies or require OpenClaw runtime changes.
- Keep `plan.md` at task-contract level; implementation evidence belongs in `log.md` and `docs/*.md`.

## Scope

- `scripts/setup-openclaw.ts`
- `package.json` only if command flags need to be aligned
- `README.md` quick start documentation so the documented install path matches current script behavior
- Task-local Legion evidence under `.legion/tasks/fix-openclaw-setup-install/`
- Wiki writeback only for reusable install/verify conclusions discovered during closure

## Non-goals

- No changes to OpenCode installation behavior.
- No new OpenClaw plugin or OpenClaw upstream patch.
- No git commit, push, or PR unless explicitly requested later.
- No migration of existing user-created OpenClaw skills unless the user opts into force overwrite behavior.

## Recommended direction

Adapt the proven `setup-opencode.ts` managed-file sync model for OpenClaw: enumerate the LegionMind skill sources, install them into `~/.openclaw/skills/<skill>/`, record a managed manifest under `~/.openclaw/.legionmind/`, and strengthen verify so it can check managed ownership and content integrity. Retain config support for `skills.load.extraDirs` only where it remains useful, but treat managed/local skill installation as the primary install path because it matches OpenClaw's documented discovery model.

## Risks

- Existing files under `~/.openclaw/skills/<skill>/` may be user-owned; default install must skip rather than overwrite.
- If OpenClaw's discovery semantics change, install should still be understandable and diagnosable via explicit verify output.
- Copying an entire skill tree must avoid secret-like or unrelated paths, following the OpenCode installer's ignore posture.

## Phases

1. Establish the worktree and materialize this task contract.
2. Compare current OpenClaw setup behavior with the OpenCode installer pattern.
3. Implement managed install and integrity verification for OpenClaw skills.
4. Run targeted install/verify checks using temporary OpenClaw homes.
5. Record verification evidence and provide a reviewer-facing summary.
