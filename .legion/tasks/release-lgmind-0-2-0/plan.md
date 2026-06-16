# Release lgmind 0.2.0

## Task contract

- **Name:** Release `lgmind` 0.2.0
- **Task ID:** `release-lgmind-0-2-0`
- **Goal:** publish the already-merged `lgmind setup` runtime-selection UX to npm as the next public release.
- **Problem:** `master` contains the new product-level `lgmind` CLI and setup UX, but `package.json` and npm `latest` remain at `0.1.0`, so npm users cannot install the new behavior yet.

## Acceptance

- `package.json` version is bumped from `0.1.0` to `0.2.0`.
- Release documentation records that 0.2.0 includes the `lgmind setup --agent opencode|openclaw` UX and quieter default logs.
- Package metadata and packed contents are verified before publication.
- Release PR is merged through the normal worktree/PR lifecycle.
- `lgmind@0.2.0` is published to npm and `latest` resolves to `0.2.0`.
- Task evidence, walkthrough, and wiki writeback are recorded.

## Scope

- Bump npm package version only for this release.
- Add task-local release notes/evidence under `.legion/tasks/release-lgmind-0-2-0/`.
- Run the existing regression suite and package dry run with repo-local npm cache.
- Publish to npm after the release PR reaches `master`.

## Non-goals

- No new CLI behavior beyond the already-merged PR #21.
- No runtime setup implementation changes unless verification exposes a release-blocking defect.
- No changes to npm package name, registry, access policy, or Node engine support.
- No direct commit or push to `master`.

## Assumptions

- `0.2.0` is the correct semver target because PR #21 added user-facing CLI capability.
- The current npm session can publish `lgmind`, or the user can complete OTP if npm requires it.
- The release should be delivered by PR first, then npm publish from the refreshed `master` baseline.

## Constraints

- Work happens in `.worktrees/release-lgmind-0-2-0/` on branch `legion/release-lgmind-0-2-0`.
- Base ref is `origin/master`.
- Use repo-local npm cache: `npm_config_cache=.cache/npm`.
- Before pushing, run `git fetch origin && git rebase origin/master` in the worktree.
- Follow the PR lifecycle through merge, cleanup, and main workspace refresh before npm publish.

## Risks

- npm publish may require OTP and block automation.
- A stale package allowlist could omit release-critical files; dry-run pack must remain part of verification.
- Releasing directly from an unmerged branch would publish an artifact not anchored in `master`; avoid by publishing only after PR merge.

## Recommended path

- Treat this as a low-risk release task: no design RFC is needed because the feature design and implementation already landed in PR #21.
- Bump version to `0.2.0`, verify tests and pack metadata, create and merge a release PR, then publish `lgmind@0.2.0`.

## Phases

1. Prepare isolated release worktree from `origin/master`.
2. Materialize task contract and release checklist.
3. Bump package version and add release evidence docs.
4. Verify regression tests and dry-run package contents.
5. Review change readiness and prepare PR walkthrough/body.
6. Commit, rebase, push, open PR, follow merge lifecycle.
7. Refresh main workspace and publish/verify npm `0.2.0`.
