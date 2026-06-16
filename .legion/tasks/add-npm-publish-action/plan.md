# Add npm publish GitHub Action

## Task contract

- **Name:** Add npm publish GitHub Action
- **Task ID:** `add-npm-publish-action`
- **Goal:** unblock publishing `lgmind@0.2.0` without a local OTP prompt by adding a manual GitHub Actions workflow that can publish through npm trusted publishing / OIDC.
- **Problem:** `npm publish --access public` from the local workspace reached the correct `lgmind@0.2.0` artifact but failed with `EOTP`. The user requested pushing the publish path to GitHub Actions instead.

## Acceptance

- Repository contains a manual npm publish workflow on the default branch.
- Workflow grants `id-token: write` and `contents: read` only.
- Workflow uses Node 24.x so npm supports trusted publishing/OIDC.
- Workflow verifies current package state before publish with regression tests and package dry run.
- Workflow publishes with `npm publish --access public`.
- PR for the workflow is merged and the main workspace is refreshed.
- After merge, npm trusted publishing is configured or a clear blocker is recorded, then the workflow is dispatched to publish `0.2.0`.

## Scope

- Add `.github/workflows/publish-npm.yml`.
- Add task-local evidence under `.legion/tasks/add-npm-publish-action/` and wiki writeback.
- Configure/trigger the workflow after merge if the npm/GitHub side permits it.

## Non-goals

- No long-lived npm token is added to the repository.
- No automatic publish on every push or tag in this task; the workflow is manual `workflow_dispatch` to minimize release blast radius.
- No package version bump beyond the already-merged `0.2.0`.
- No changes to CLI runtime behavior.

## Assumptions

- `lgmind` already exists on npm, so trusted publishing can be configured for the package.
- The intended trusted publisher identity is GitHub repository `Thrimbda/legion-mind` and workflow file `publish-npm.yml`.
- If npm trusted publisher configuration still requires interactive account confirmation or OTP, that becomes the external blocker.

## Constraints

- Work happens in `.worktrees/add-npm-publish-action/` on branch `legion/add-npm-publish-action`.
- Base ref is `origin/master`.
- Before pushing, run `git fetch origin && git rebase origin/master` in the worktree.
- Use repo-local npm cache for local verification.
- Do not commit secrets or npm tokens.

## Risks

- npm trusted publisher configuration must exactly match the workflow filename; mismatch causes publish authentication failure.
- `workflow_dispatch` publication validates the calling workflow identity, so the npm trusted publisher must reference this workflow file.
- If GitHub or npm does not allow configuring trusted publishing from CLI in this session, publication may remain blocked until the user completes npm-side setup.

## Recommended path

- Use a manual trusted-publishing workflow rather than an npm token secret.
- Keep the workflow small: checkout, setup Node 24.x, show npm surface, run regression tests, run pack dry-run, publish.
- Merge the workflow first, then configure npm trusted publishing for `publish-npm.yml`, dispatch it on `master`, and verify npm `latest`.

## External docs consulted

- Context7 lookup for `/npm/cli` succeeded, but docs snippet fetch failed.
- npm trusted publishing docs (web): OIDC requires `id-token: write`; npm CLI auto-detects OIDC; GitHub workflow filename must match npm trusted publisher configuration; new configs require an explicit `allow-publish`; workflow examples use Node 24 and disabled package-manager cache for release builds.

## Phases

1. Add workflow and task evidence in isolated worktree.
2. Verify workflow shape and local release commands.
3. Review, walkthrough, and wiki writeback.
4. Commit, rebase, push, PR, merge, cleanup, main refresh.
5. Configure trusted publisher / dispatch workflow / verify npm registry state.
