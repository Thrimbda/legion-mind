## Summary

- Refresh README `当前现实` and v1 sections to match the repo’s actual current state after the v1 kernel hardening work.
- Keep support boundaries explicit: no runtime expansion beyond OpenCode / OpenClaw, CLI remains a thin local `.legion/tasks/**` helper, and VibeHarnessBench remains local-first v0.1.
- Clarify unfinished v1 gaps around release / CI, real-project pressure testing, low-friction onboarding, and benchmark maturity.

## Verification

- README static support-boundary/current-reality checks PASS.
- Scope check PASS: tracked changed files limited to `README.md`; no setup scripts, tests, GitHub Actions, package metadata, or lockfiles changed.
- `npm run test:regression` PASS: 10 tests / 10 pass / 0 fail.
- `docs/review-change.md` review PASS with no blocking findings.

## Boundaries

- Documentation-only implementation change.
- Does not expand runtime support beyond OpenCode / OpenClaw.
- Does not change CLI, setup, regression, benchmark, CI, or release behavior.
- Does not claim VibeHarnessBench is a full sandbox/full-stack/production isolation platform.
