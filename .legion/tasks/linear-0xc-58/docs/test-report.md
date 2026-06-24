# Test Report: Linear WI-04 OpenCode Legion Worker Runner

> **Task**: `linear-0xc-58`  
> **Date**: 2026-06-25  
> **Verifier**: OpenAI / Legion agent

## Summary

PASS. The targeted scheduler suite covers the new worker runner path, and the existing root regression / packaging smoke still pass.

## Commands Run

| Command | Result | Evidence |
|---|---:|---|
| `npm --prefix scheduler test` | PASS | 29/29 tests pass. Covers scanner/core regressions plus WI-04 taskId mapping, prompt hard gates, native startup outbox, fake OpenCode success / malformed / nonzero / cancel paths, strict result parser / identity checks, dispatch payload consistency, stop-before-native-startup behavior, environment sanitizer and evidence verifier. |
| `npm --prefix scheduler run health -- --db :memory:` | PASS | Scheduler DB migrations apply; health reports all seven core tables and zero active runs / pending outbox. |
| `npm run test:regression` | PASS | 18/18 root regression tests pass. Confirms existing Legion CLI / setup / packaging invariants are unchanged. |
| `npm run pack:dry-run` | PASS | npm dry-run package builds runtime JS and still includes root CLI / skill assets only; scheduler prototype remains outside root published package. |
| `git diff --check` | PASS | No whitespace errors. |

## Why these commands

- `npm --prefix scheduler test` is the strongest direct evidence for this WI because the change lives in the standalone `scheduler/` project and adds dedicated `linear-worker-runner` tests.
- `scheduler run health` proves the updated store / migration surface still opens cleanly through the documented debug CLI path.
- Root regression and pack dry-run are included because this repository also publishes `lgmind`; even though scheduler is a local prototype, these commands verify the change did not leak scheduler artifacts into the npm package or break existing CLI behavior.
- `git diff --check` catches formatting issues before review.

## Coverage Highlights

- Deterministic Linear identifier mapping: `ENG-123 -> linear-eng-123`, `0XC-58 -> linear-0xc-58`.
- OpenCode prompt contains Linear context, AgentSession / delegate / stop signal context, Legion hard gates, result schema and evidence verifier path.
- Native startup outbox is ordered and must be sent before worker dispatch; fake adapter verifies create/find session, delegate, activity, plan and external URL calls.
- Worker dispatch handles success, malformed result, nonzero exit and native stop without incorrectly marking non-success runs as Done.
- Result parser rejects multiple result blocks; dispatch rejects run/task/attempt identity mismatches before evidence verification.
- Dispatch rejects tampered worker outbox payloads before launch and derives worker identity from Scheduler DB rows.
- Environment sanitizer excludes Linear / GitHub / scheduler secrets while allowing OpenCode / model provider settings.
- Native startup processing stops after failed prerequisites, skips startup side effects after stop/cancel, still emits final response, and dispatch remains blocked until required native startup rows are sent.
- Evidence verifier rejects PR-only results, absolute/out-of-task evidence paths and lifecycle-incomplete PR-backed results; it passes complete high-risk implementation evidence with explicit `Verdict: PASS` review docs.

## Skipped / Residual

- No real OpenCode worker was launched against a live Linear WI. The launcher contract is covered with fake OpenCode tests and current OpenCode CLI docs; a manual dry-run with real credentials remains an operator smoke before production use.
- No real Linear native Agent API calls were made. WI-04 intentionally implements the adapter boundary and fake tests; production API wiring / permission hardening remains later operational work.
- GitHub PR checks / review / merge tracking remains out of scope for WI-04 and is assigned to WI-05.
