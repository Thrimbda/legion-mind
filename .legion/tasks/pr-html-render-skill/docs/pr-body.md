## Summary

- Add `pr-html-render` as a support skill for rendered PR previews of existing HTML artifacts such as `docs/report-walkthrough.html`.
- Update `report-walkthrough` so PR-backed HTML reports hand off to `pr-html-render` for a rendered preview path or explicit bypass/blocker.
- Install and test the new support skill through OpenCode/OpenClaw skill surface regression.

## Evidence

- RFC: `.legion/tasks/pr-html-render-skill/docs/rfc.md`
- RFC review: `.legion/tasks/pr-html-render-skill/docs/review-rfc.md`
- Test report: `.legion/tasks/pr-html-render-skill/docs/test-report.md`
- Change review: `.legion/tasks/pr-html-render-skill/docs/review-change.md`
- Walkthrough: `.legion/tasks/pr-html-render-skill/docs/report-walkthrough.html`

## Verification

- `git diff --check` PASS
- `npm run test:regression` PASS, 10/10
- `pr-html-render` smoke assertions PASS

## Render handoff

Current walkthrough HTML uses artifact-only/local fallback. This PR adds the `pr-html-render` skill and templates but does not enable this repository's GitHub Pages workflow, which is out of scope.

## Lifecycle note

This PR body is an input to PR creation only. Checks, review, merge, cleanup, and main workspace refresh remain under `git-worktree-pr`.
