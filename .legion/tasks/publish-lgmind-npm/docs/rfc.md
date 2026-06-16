# RFC: publish `lgmind@0.1.0`

## Status

Draft for review.

## Context

PR #17 made the OpenCode installer publishable but used `setup-opencode` as package/bin name and explicitly did not publish. The user now prefers a short package name and accepted `lgmind`. The release must do two things safely:

1. Update the repository package surface so future users can run `npx lgmind@latest ...`.
2. Publish `lgmind@0.1.0` only after the release configuration is merged and verified from current `origin/master`.

Relevant npm CLI behavior from current docs:

- `npm view <package>` displays registry package information and returns `E404` when the package is not found.
- `npm publish` publishes the current directory package.
- A package name/version combination cannot be reused once published, even if later unpublished.

The requested local reference `~/Work/opencode-feishu-notifier` was cloned by the user, but current tool permissions still block external-directory reads, so this RFC uses npm CLI docs and the repo's PR #17 package dry-run evidence as the release baseline.

## Decisions

### Package name

Use unscoped npm package name `lgmind`.

Rationale:

- It is short and was selected by the user after considering `lgmd` and `lgmind`.
- Earlier registry checks returned `E404` for `lgmind`, which means the public registry did not expose an existing package with that name at check time.
- It reads more clearly than `lgmd` while staying short enough for `npx lgmind@latest install`.

### Bin entries

Expose two bin names pointing to the same wrapper:

```json
{
  "bin": {
    "lgmind": "bin/setup-opencode.js",
    "setup-opencode": "bin/setup-opencode.js"
  }
}
```

Rationale:

- `lgmind` makes `npx lgmind@latest ...` and global `lgmind ...` work as the primary release command.
- `setup-opencode` remains a descriptive alias for users who discover the installer by purpose, and it preserves the PR #17 CLI naming work.
- Both names execute the same minimal wrapper, so there is no duplicated release surface.

### Publish sequencing

Use a two-step release:

1. Merge repository changes through PR.
2. Refresh main workspace to `origin/master`, re-run final release checks, then run `npm publish --access public` from the refreshed main workspace.

Rationale:

- Publishing from merged `origin/master` avoids publishing a package state that is not yet in the canonical branch.
- The user explicitly asked to publish, so the external release action is in scope, but the release should still wait for the repository lifecycle terminal state.

## Alternatives considered

### Keep package name `setup-opencode`

- **Pros:** Already merged in PR #17; descriptive.
- **Cons:** User asked for a shorter name; previous task left this as a release decision.
- **Decision:** Reject.

### Use `lgmd`

- **Pros:** Shortest option discussed.
- **Cons:** Less readable, easier to confuse, weaker connection to LegionMind.
- **Decision:** Reject in favor of `lgmind`.

### Only expose `lgmind` bin

- **Pros:** Simplest command surface.
- **Cons:** Drops the descriptive `setup-opencode` command immediately after documenting it in PR #17.
- **Decision:** Reject for first release; keep alias.

### Publish before PR merge

- **Pros:** Faster external release.
- **Cons:** Public package could diverge from `master`; harder to audit; contradicts Git lifecycle envelope.
- **Decision:** Reject.

## Verification plan

Before PR:

1. `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm view lgmind --json --registry=https://registry.npmjs.org`
   - Expected: `E404` until publish.
2. `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm whoami`
   - Expected: authenticated npm user, or explicit publish blocker.
3. `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression`
4. `npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run`
   - Expected package id `lgmind@0.1.0` and files include wrapper/assets but exclude `.legion/`, `.worktrees/`, `tests/`, `.cache/`.

After PR merge, before publish:

1. `git fetch origin && git checkout origin/master` in the main workspace.
2. Repeat package-name check and package dry-run from refreshed master.
3. Run `npm publish --access public` with repo-local npm cache.
4. Verify with `npm view lgmind version dist-tags.latest --registry=https://registry.npmjs.org`.

## Rollback and blocker handling

- Before publish, rollback is normal Git revert/PR closure.
- After publish, do not treat unpublish as a normal rollback. Publish is externally visible, and the name/version combination cannot be safely reused. If a published package is wrong, publish a corrected patch version and document the remediation.
- If npm auth, 2FA, permissions, package-name race, or registry status blocks publish, record a blocked handoff with owner, commands run, and recovery condition.

## Open questions

No blocking open questions. The only non-blocking note is that the local reference repo remains unreadable under current permissions.
