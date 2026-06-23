## Summary

- Amend the Linear + Legion scheduler RFC to model Linear Native Agent as a presentation/control plane: delegate, AgentSession, Activities, Plan, externalUrls, stop/cancel and permission changes.
- Split `run_terminal_success` from `run_terminal_non_success`; only success unlocks downstream by default.
- Add `lifecycle_blocked` so PR merged without `git-worktree-pr` cleanup/main refresh cannot be marked done.
- Add AgentSession/native outbox idempotency and claim-time snapshot revalidation.
- Update all 8 WI docs; no WI-09, OpenCode-only remains unchanged.

## Evidence

- Task plan: `.legion/tasks/amend-linear-native-scheduler-rfc/plan.md`
- Research: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/research.md`
- Amendment RFC: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/rfc.md`
- RFC review: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/review-rfc.md` — PASS after lifecycle gate fix
- Verification: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/test-report.md` — PASS
- Change review: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/review-change.md` — PASS after WI-06 dependency fix
- Walkthrough: `.legion/tasks/amend-linear-native-scheduler-rfc/docs/report-walkthrough.md`

## Validation

- `git diff --check`
- targeted `rg` checks for terminal/lifecycle/native wording and old done-gate wording
- `legion.ts status --task-id amend-linear-native-scheduler-rfc`

## Notes

- This is docs/design only; no scheduler runtime code is implemented.
- Existing Linear issues should be synced from the merged docs in a follow-up writeback if needed.
