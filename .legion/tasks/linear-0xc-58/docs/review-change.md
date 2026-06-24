# Review Change: Linear WI-04 OpenCode Legion Worker Runner

> **Task**: `linear-0xc-58`  
> **Date**: 2026-06-25  
> **Reviewer**: review-change subagent / OpenAI  
> **Security lens**: Applied (worker process launch, native side effects, env/secret handling, prompt/result/evidence trust boundary)

## Verdict

PASS

## Blocking Findings

None remaining.

## Review Iterations

### Iteration 1 — FAIL

Blocking issues found:

1. Worker result / evidence verifier trusted worker self-attestation too broadly.
2. OpenCode launch passed full prompt through argv and inherited scheduler env.
3. Timeout / cancel did not guarantee worker process group termination before terminal state.
4. Native startup ordering did not stop after failed prerequisites.

Applied fixes:

- Strict result block parsing, single block enforcement, DB identity checks and repo-contained task-local evidence paths.
- Prompt artifact path passed via argv instead of full prompt; prompt file written owner-only; child env allowlisted.
- Process group launch with TERM -> KILL grace and close-wait before terminal attempt result.
- Native startup side effects processed in ordered prerequisites.

### Iteration 2 — FAIL

Blocking issues found:

1. Worker dispatch still trusted mutable outbox payload identity rather than DB row truth before launch.
2. Stop/cancel could still allow pending native startup side effects.

Applied fixes:

- Dispatch rejects mismatched outbox row / payload / run / attempt / task / Linear identity before prompt rendering or launch, and derives prompt identity from `runs.task_id` / `runs.linear_identifier`.
- Native startup rows are failed/skipped after stop/cancel, while `final_response` remains allowed.

### Iteration 3 — PASS

Re-check results:

- DB / outbox / payload identity before worker launch: PASS.
- Stop/cancel preventing pending native startup side effects: PASS.
- Evidence path containment and explicit PASS verdict checks: PASS.
- OpenCode argv / env handling: PASS.
- Process termination behavior: PASS.

## Verification Reviewed

- `npm --prefix scheduler test` PASS (29/29 tests).
- `npm --prefix scheduler run health -- --db :memory:` PASS.
- `npm run test:regression` PASS (18/18 tests).
- `npm run pack:dry-run` PASS.
- `git diff --check` PASS.

## Non-blocking Suggestions

1. Persist or derive gate-affecting Linear context such as `risk` / `contractState` from the evaluated snapshot rather than dispatch payload before using it in evidence verification.
2. On dispatch identity rejection, consider transitioning the run to blocked/failed so a corrupted dispatch row cannot leave a queued active run requiring manual cleanup.
3. Consider owner-only mode or redaction for worker stdout/stderr log artifacts, since worker output may accidentally contain sensitive text.
