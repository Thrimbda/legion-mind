## What

Tighten one verifier message in `scripts/setup-opencode.ts` and trim `docs/benchmark.md` to current repo truth.
This PR is limited to wording/doc drift and related reviewer artifacts; it does not add runtime enforcement or benchmark implementation.

## Why

The repo already treats `legion-workflow` as the control-plane entry and the local CLI as optional filesystem-backed tooling.
The old verifier hint and benchmark doc had drifted from that reality and could mislead reviewers or users about current capabilities.

## How

Update the verify hint so it no longer suggests the local CLI is the default path.
Rewrite `docs/benchmark.md` to explicitly describe what exists today, while labeling earlier benchmark ideas as planned/historical only.

## Testing

See `.legion/tasks/tighten-cli-doc-drift/docs/test-report.md`.

- isolated `install + verify --strict`: PASS
- benchmark doc vs repo-truth checks: PASS
- wording regression scan in current-truth docs: PASS

## Risk / Rollback

Low risk: wording and documentation only.
Rollback is a simple revert of `scripts/setup-opencode.ts` and `docs/benchmark.md`.

## Links

- Plan / design-lite: `.legion/tasks/tighten-cli-doc-drift/plan.md`
- Review: `.legion/tasks/tighten-cli-doc-drift/docs/review-change.md`
- Test report: `.legion/tasks/tighten-cli-doc-drift/docs/test-report.md`
- Walkthrough: `.legion/tasks/tighten-cli-doc-drift/docs/report-walkthrough.md`
