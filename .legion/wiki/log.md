# Legion Wiki Log

## [2026-06-21] writeback | interactive-install-scope

- Added task summary for `interactive-install-scope` under `tasks/`.
- Promoted `lgmind install` / `setup` interactive first-run behavior: runtime prompt plus project/global install scope prompt in TTY contexts.
- Updated npm CLI pattern and regression pattern with `--scope project|global` and installed project-local path coverage.

## [2026-06-18] closeout | lgmind-0.2.1-publish

- Recorded successful GitHub Actions trusted-publishing run `27746769602` for `lgmind@0.2.1`.
- Updated `fix-npm-bin-node-modules-ts` task summary from hotfix target to published state.
- Updated current npm latest in the wiki index to `lgmind@0.2.1` and recorded successful real `npx` smoke.

## [2026-06-18] writeback | fix-npm-bin-node-modules-ts

- Added task summary for `fix-npm-bin-node-modules-ts` under `tasks/`.
- Promoted npm runtime rule: published bins must execute JS runtime files, not `.ts` files under `node_modules`.
- Updated setup regression pattern to require installed/package-like bin execution coverage in addition to package metadata inspection.

## [2026-06-16] closeout | lgmind-0.2.0-publish

- Recorded successful GitHub Actions trusted-publishing run `27597051575` for `lgmind@0.2.0`.
- Updated release and workflow task summaries from pending publish state to published state.
- Updated current npm latest in the wiki index to `lgmind@0.2.0`.

## [2026-06-16] writeback | add-npm-publish-action

- Added task summary for `add-npm-publish-action` under `tasks/`.
- Promoted npm trusted publishing / OIDC as the preferred tokenless publication path for this repository.
- Updated the `lgmind` release pattern with the manual `publish-npm.yml` workflow, minimal permissions, Node 24.x, and pre-publish regression/pack checks.

## [2026-06-16] writeback | release-lgmind-0-2-0

- Added release task summary for `release-lgmind-0-2-0` under `tasks/`.
- Updated the current `lgmind` release target to `0.2.0` for the setup UX shipped by PR #21.
- Promoted the release pattern that npm publication happens only after release PR merge and main workspace refresh, with dry-run pack as pre-publish evidence.

## [2026-06-16] writeback | improve-cli-setup-ux

- Added task summary for `improve-cli-setup-ux` under `tasks/`.
- Promoted current `lgmind` CLI shape: product-level setup aggregator, `--agent opencode|openclaw` runtime selection, OpenCode-only `setup-opencode` alias, quiet default text output, and verbose/json escape hatches.
- Updated the regression pattern to include `lgmind` runtime selection and output-mode coverage.

## [2026-06-16] publish closeout | publish-lgmind-npm

- Recorded final npm registry state for `lgmind@0.1.0`: `version = 0.1.0`, `latest = 0.1.0`.
- Updated the task summary and index from pre-publish readiness to published state.
- Replaced the pending publish follow-up with a future-release automation follow-up for GitHub CI trusted publishing.

## [2026-06-16] writeback | publish-lgmind-npm

- Added task summary for `publish-lgmind-npm` under `tasks/`.
- Promoted `lgmind` as the current npm package name for the OpenCode installer CLI, with `lgmind` as primary bin and `setup-opencode` as alias.
- Replaced the prior pre-publish naming follow-up with the remaining after-merge publish action / blocker tracking requirement.

## [2026-06-15] writeback | localize-skill-outputs

- Added task summary for `localize-skill-outputs` under `tasks/`.
- Promoted the current repository skill language convention: every `skills/*/SKILL.md` declares default Chinese answers and Chinese human-readable document artifacts, while preserving code, commands, paths, machine-readable fields, errors, platform terms, raw evidence, and user-specified languages.
- Recorded the maintenance expectation that future skill additions or rewrites should carry the language constraint in the skill body, not only in global entry rules.

## [2026-06-15] writeback | setup-opencode-npm-cli

- Added task summary for `setup-opencode-npm-cli` under `tasks/`.
- Promoted `setup-opencode` npm CLI release surface as a durable pattern: package/bin name, JS wrapper, explicit files allowlist, `npx setup-opencode@latest` README shape, and npm dry-run verification.
- Recorded a non-blocking release follow-up to confirm unscoped package name vs organization scope before the first real `npm publish`.

## [2026-06-10] writeback | localize-pr-html-render-skill

- Added task summary for `localize-pr-html-render-skill` under `tasks/`.
- Recorded that `skills/pr-html-render/SKILL.md` is now Chinese-first while retaining English trigger tokens, artifact paths, GitHub Actions permission names, template filenames, and PR trust-boundary language.
- Reaffirmed that `pr-html-render` remains a support skill for existing HTML artifacts, not a Legion phase, report generator, or PR lifecycle replacement.

## [2026-06-09] writeback | pr-html-render-skill

- Added task summary for `pr-html-render-skill` under `tasks/`.
- Promoted `pr-html-render` as the support skill for rendering existing HTML reviewer artifacts such as `docs/report-walkthrough.html` into PR preview paths, artifact-only fallbacks, or internal-host handoffs.
- Updated the durable `report-walkthrough` pattern: PR-backed HTML walkthroughs now require a render handoff state, while `report-walkthrough` remains evidence generation only and does not publish previews or replace PR lifecycle.
- Recorded GitHub Pages PR render safety boundaries: read-only build job for PR code, privileged deploy/comment job without PR code execution, no public Pages for sensitive reports, and no `pull_request_target` build of PR head code.

## [2026-06-06] writeback | html-first-report-walkthrough

- Added task summary for `html-first-report-walkthrough` under `tasks/`.
- Promoted `report-walkthrough` from Markdown-first handoff to HTML-first reviewer artifact: `docs/report-walkthrough.html` is now the primary walkthrough output, while Markdown remains compact source / fallback and PR body remains PR input.
- Recorded the clean-doc / impeccable principles for HTML walkthrough generation: reader-first information selection, evidence path, standalone semantic HTML, OKLCH, responsive, print-friendly, no external resources, and no known design anti-patterns.

## [2026-06-06] writeback | harden-report-walkthrough

- Added task summary for `harden-report-walkthrough` under `tasks/`.
- Promoted the current `report-walkthrough` convention: reviewer handoff must be based on current healthy evidence, use walkthrough profile rather than execution mode, and never treat PR body as PR lifecycle completion.
- Recorded that docs/config/test/script-only implementation still uses implementation profile when it has implementation, verification, and `review-change` evidence.

## [2026-05-08] writeback | setup-opencode-agents-skills

- Added task summary for `setup-opencode-agents-skills` under `tasks/`.
- Promoted the current setup convention that `setup-opencode` keeps OpenCode config/agents defaults while installing Legion skills to `~/.agents/skills` by default.
- Recorded the compatibility boundary that `--opencode-home` remains an explicit override for tests and historical paths.

## [2026-04-27] writeback | refresh-readme-current-reality

- Added task summary for `refresh-readme-current-reality` under `tasks/`.
- Recorded that README current reality now explicitly reflects the post-hardening repository state: workflow kernel, OpenCode/OpenClaw setup parity, regression suite, VibeHarnessBench v0.1, current-truth convergence, and still-ungraduated CI/release/onboarding/runtime/sandbox boundaries.

## [2026-04-27] writeback | harden-v1-kernel-harness

- Added task summary for `harden-v1-kernel-harness` under `tasks/`.
- Promoted setup lifecycle shared core, OpenClaw rollback/uninstall parity, regression suite coverage, and docs current-truth convergence as durable patterns.
- Recorded one non-blocking setup-core auditability follow-up around managed root textual/canonical correspondence.

## [2026-04-27] writeback | fix-aim-autonomous-pr-flow

- Tightened `git-worktree-pr` autonomous delivery semantics: commit, push PR branch, PR create/update, PR follow-up, cleanup, and main refresh are default lifecycle actions after the envelope applies.
- Recorded that user silence or lack of per-action commit/push/PR wording is not a stop condition; explicit no-commit/no-push/no-PR or bypass must be recorded as explicit bypass/blocker.
- Preserved strict Git safety constraints and completion definition.

## [2026-04-25] writeback | fix-openclaw-setup-install

- Added task summary for `fix-openclaw-setup-install` under `tasks/`.
- Promoted OpenClaw local skills root + managed manifest installation as a durable CLI pattern in `patterns.md`.
- Recorded current conclusion: `setup-openclaw` should install to `~/.openclaw/skills` and use strict verify for ownership/checksum drift, while keeping `skills.load.extraDirs` compatibility.

## [2026-04-25] writeback | add-git-worktree-pr-envelope

- Promoted Git worktree + PR lifecycle envelope as a durable development-task pattern in `patterns.md`.
- Added task summary for `add-git-worktree-pr-envelope` under `tasks/`.
- Recorded current conclusion: `git-worktree-pr` wraps existing execution modes and is not a fourth mode; push-before-rebase is mandatory; PR creation, blocked handoff, kept worktree, or skipped refresh are not completion.

## [2026-04-25] supplement | harden-legion-workflow-gate

- Expanded `legion-workflow` diagram guidance after review feedback: entry state machine, mode selector, and stage-chain rollback map are now the current documentation shape.
- Reaffirmed that applicable chains complete only after `report-walkthrough` evidence and `legion-wiki` writeback.

## [2026-04-25] writeback | harden-legion-workflow-gate

- Promoted Legion entry-gate-first behavior as a durable workflow pattern in `patterns.md`.
- Added task summary for `harden-legion-workflow-gate` under `tasks/`.
- Recorded current mode taxonomy: three execution modes after stable contract; `bypass` / `restore` / `brainstorm` remain entry runtime states.

## [2026-04-25] writeback | complete-vibeharnessbench-v01

- Added task summary for `complete-vibeharnessbench-v01` under `tasks/`.
- Promoted verifier-owned temp copy for hidden test injection as a durable benchmark isolation pattern in `patterns.md`.
- Updated maintenance to mark MVP contract-verifier upgrade as completed in local-first semantic scope and to preserve remaining Docker/GIF/RPC/browser/sandbox boundaries.

## [2026-04-25] writeback | build-vibeharnessbench-mvp

- Added task summary for `build-vibeharnessbench-mvp` under `tasks/`.
- Promoted repo-outside HUT execution root as a durable benchmark isolation pattern in `patterns.md`.
- Recorded benchmark MVP follow-ups for high-fidelity verifiers, Docker/offline runtimes, sandboxing and symlink hardening in `maintenance.md`.

## [2026-04-25] writeback | harden-strict-verify-integrity

- Promoted strict install verification as a durable CLI pattern in `patterns.md`.
- Added task summary for `harden-strict-verify-integrity` under `tasks/`.
- Recorded one non-blocking manifest self-consistency follow-up in `maintenance.md`.

## [2026-04-23] writeback | tighten-cli-doc-drift

- Added `maintenance.md` entry for an unverified `task create` materialization observation seen during task bootstrap.
- No new cross-task pattern or hard decision was added; existing CLI role guidance remains in `patterns.md`.

## [2026-04-23] writeback | fix-task-create-materialization

- Promoted `task create` staging + rename materialization to a durable CLI pattern in `patterns.md`.
- Removed the earlier open maintenance entry for one-off `task create` partial materialization after the invariant-hardening fix landed and success-path verification passed.
