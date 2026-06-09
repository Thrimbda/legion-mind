---
name: pr-html-render
description: Use when PR reviewers need a rendered URL or preview for an existing HTML artifact such as `docs/report-walkthrough.html`, a Legion walkthrough HTML report, CI HTML report, GitHub Pages PR preview, PR comment preview link, or static HTML review artifact. Use after `report-walkthrough` creates HTML, not to generate the report content itself.
---

# pr-html-render

## Overview

`pr-html-render` turns an existing HTML artifact into a reviewer-accessible rendered preview path for a pull request. It is a render/publish handoff skill, not a report generator.

Default principle: build or collect untrusted PR content with low privileges; publish or comment only from a privileged step that does not checkout or execute PR head code.

## Hard Gate

- The HTML artifact must already exist or be produced by an explicit report command.
- If the expected artifact is `docs/report-walkthrough.html` and it is missing, return to `report-walkthrough`; do not invent walkthrough content here.
- Do not use this skill to补 design、verification、review、wiki writeback、PR checks、merge、cleanup, or main workspace refresh.
- In a Legion-managed repository, any repository file changes made to add render workflows or templates still require `legion-workflow` and the `git-worktree-pr` envelope.
- Treat generated HTML from PR code as untrusted content.
- Do not publish HTML that contains secrets, private logs, account data, customer data, internal URLs, tokens, or other sensitive material to public Pages.

## When to Use

- A Legion task has produced `docs/report-walkthrough.html` and PR reviewers need to open it as rendered HTML.
- CI produces a static HTML report and the user wants a stable PR preview URL.
- The user asks for GitHub Pages PR previews, PR comment preview links, rendered HTML artifacts, or a way to see an HTML report in review.
- `report-walkthrough` hands off a PR-backed HTML artifact and there is no explicit render bypass or blocker.

Do not use when:

- The user needs the HTML report designed or written; use the appropriate report/design skill first.
- The artifact is sensitive and no authenticated host or artifact-only path is acceptable.
- The task is only PR lifecycle follow-up; use `git-worktree-pr` semantics instead.

## Classify Before Editing

Ask or infer these facts before changing workflows:

- Artifact path: for Legion walkthroughs this is usually `.legion/tasks/<task-id>/docs/report-walkthrough.html`.
- Entry file: `index.html` or another file that should become `index.html` for static hosting.
- Platform: GitHub Actions, GitLab CI, internal CI, or local-only.
- Visibility: public Pages, private Pages, authenticated internal host, or artifact-only.
- Sensitivity: whether the HTML includes secrets, customer data, private logs, screenshots, internal URLs, tokens, or account identifiers.
- Trust model: whether PRs can come from forks or untrusted contributors.
- URL shape: stable per PR such as `/pr-123/`, or per commit/run such as `/pr-123/<sha>/`.

## Decision Guide

| Situation | Render path | Notes |
|---|---|---|
| Static HTML is safe for the Pages audience | GitHub Pages PR preview | Prefer `actions/upload-pages-artifact` and `actions/deploy-pages`. |
| HTML is sensitive | Actions artifact or authenticated internal host | Artifacts are access-controlled but not a stable rendered URL. |
| Fork or untrusted PR | Build with read-only permissions; publish only through hardened approval/workflow_run path | Do not publish with the simple same-repo template by default. |
| Local-only review | Open the file directly | Record that no PR preview URL was required. |
| Missing walkthrough HTML | Return to `report-walkthrough` | This skill renders existing HTML; it does not create evidence content. |

For GitHub, prefer Pages source = **GitHub Actions** and `actions/upload-pages-artifact` plus `actions/deploy-pages`. Do not rely on committing generated HTML with `GITHUB_TOKEN` to a Pages branch as the Pages publishing trigger.

## GitHub Default Implementation

Use `templates/github-pages-pr-render.yml` as the starting point for internal or trusted same-repository PRs.

Expected behavior:

1. On PR open/update, CI checks out PR code with read-only permissions.
2. The build job runs the configured command only if needed, stages the configured HTML artifact directory, and normalizes the entry file to `index.html`.
3. The build job uploads the staged HTML as an artifact.
4. The deploy job downloads the artifact, updates `_site/pr-<number>/`, preserves older PR preview directories, deploys the full `_site` directory to GitHub Pages, and writes a sticky PR comment.
5. The preview URL looks like `https://<owner>.github.io/<repo>/pr-123/`.

Before committing the workflow, adapt only these project-specific values:

- `HTML_RENDER_COMMAND`, for example `:` when the HTML file already exists in the repository, or `npm ci && npm run report` when CI must generate it.
- `HTML_ARTIFACT_DIR`, for example `.legion/tasks/<task-id>/docs`.
- `HTML_ENTRYPOINT`, for example `report-walkthrough.html` or `index.html`.
- Setup steps such as Node/Python/Rust installation and dependency caching.
- Preview branch name, only if the repository already has a different preview storage branch.

Use `templates/cleanup-pr-render.yml` only when the team wants previews removed when PRs close. Keeping previews after close is also valid if it is intentional and documented.

## Legion Handoff Rules

- `report-walkthrough` owns `docs/report-walkthrough.html`, `docs/report-walkthrough.md`, and `docs/pr-body.md`.
- `pr-html-render` owns the rendered preview path, workflow template, PR comment marker, and render caveats.
- `git-worktree-pr` owns commit, push, PR creation/update, checks/review, auto-merge, cleanup, and main workspace refresh.
- `legion-wiki` owns durable cross-task writeback after the report and render handoff evidence exists.

For PR-backed walkthroughs, record one of these outcomes:

- Rendered preview URL created or expected by workflow.
- Render path intentionally local/artifact-only because the report is sensitive.
- Explicit render bypass or blocker, with owner and recovery condition.

## Security Rules

- Do not put a privileged token in the same job that runs arbitrary PR code.
- Do not use `pull_request_target` to checkout or run PR head code.
- For fork PRs, skip Pages publishing, require manual approval, or implement a hardened `workflow_run` publisher that never executes artifacts as code.
- Use environment variables for PR title/body/branch names inside shell scripts; do not interpolate untrusted GitHub expressions directly into shell.
- Prefer same-repo PR publishing for the simple template. Treat public/fork publishing as a separate hardened design.
- If Pages visibility is broader than the reviewer group, do not publish sensitive reports there.

## Verification Checklist

After implementation, verify:

- Repository Pages setting uses **GitHub Actions** as source if using the Pages template.
- The `github-pages` environment does not block this PR-preview workflow with a default-branch-only deployment rule, or the blocker is documented.
- PR comment appears and updates instead of spamming new comments.
- The URL opens rendered HTML, not a raw artifact download.
- A second PR does not erase the first PR preview.
- Updating PR #123 replaces `/pr-123/` without changing the URL.
- Closing a PR either keeps the preview intentionally or runs the cleanup workflow.
- The workflow fails clearly if the configured HTML entrypoint is missing.
- Sensitive reports use artifact-only or authenticated hosting instead of public Pages.

## Minimal Output to User

When done, summarize:

- HTML artifact path and entrypoint.
- Files changed.
- One-time repository setting needed.
- Preview URL pattern or artifact/internal-host fallback.
- Security caveat, especially for public/fork PRs and sensitive reports.
- How to test with a dummy PR.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Treating `pr-html-render` as the report author | Return to the skill that creates the HTML artifact, such as `report-walkthrough`. |
| Uploading HTML as an artifact only but promising a rendered URL | Artifacts download as files; use static hosting for rendered review. |
| Running PR code in a job with `pages: write` or `contents: write` | Split build and deploy jobs; deploy job only copies artifacts and comments. |
| Using `pull_request_target` to build a report | Only use it for safe metadata tasks like cleanup/commenting, never for PR code execution. |
| Publishing sensitive reports to Pages | Use internal object storage, VPN-only static host, or artifacts with access control. |
| Claiming PR lifecycle is complete after posting a preview link | PR lifecycle completion remains under `git-worktree-pr`. |

## References

- GitHub Pages render template: `templates/github-pages-pr-render.yml`
- Optional cleanup template: `templates/cleanup-pr-render.yml`
