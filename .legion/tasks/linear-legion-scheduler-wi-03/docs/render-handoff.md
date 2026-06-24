# Render Handoff: WI-03 report walkthrough

## Artifact

- HTML artifact: `.legion/tasks/linear-legion-scheduler-wi-03/docs/report-walkthrough.html`
- Entrypoint: `report-walkthrough.html`
- Source / fallback: `.legion/tasks/linear-legion-scheduler-wi-03/docs/report-walkthrough.md`

## Sensitivity

Artifact is reviewer-facing task evidence. It contains paths, test commands, Linear issue identifiers and implementation summary. It does not contain secrets, tokens, customer data, private logs or screenshots.

## Render decision

Rendered preview is **blocked for now** because the PR has not been created yet and repository Pages / preview policy has not been confirmed in this task. Adding a new Pages workflow solely for this WI would be broader than the scanner implementation scope.

## Recovery condition

After PR creation, the PR lifecycle owner should choose one of:

1. Use an existing repository preview mechanism, if available, to render `report-walkthrough.html`.
2. Attach the HTML as a PR artifact / reviewer-download fallback.
3. If the repository wants persistent PR previews, open a separate scoped change to add a hardened `pr-html-render` workflow.

Until one of those is available, reviewers can open the committed HTML artifact directly from the PR branch.
