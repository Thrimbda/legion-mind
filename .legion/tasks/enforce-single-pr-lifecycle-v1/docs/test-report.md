# Independent verification report

Task: `enforce-single-pr-lifecycle-v1`
Verifier: `verify-change-lively-otter`
Date: 2026-07-31

## Previous verdict invalidation

The earlier verifier PASS was produced against a prior diff and was subsequently
invalidated by an independent `review-change` FAIL. That review identified two
blocking gaps: historical completed PRs could be backfilled as open, and a merged PR
with missing repository evidence could remain repairable by the original task.

This report is a fresh verification after both fixes. It supersedes the old report;
the earlier PASS must not be treated as evidence for the current verdict.

## Scope and method

Verification was independent of implementation. It combined:

- the complete Scheduler and repository regression suites;
- a real v5-to-v6 SQLite migration fixture;
- active counterexample probes for both prior blockers;
- a static audit of every current Legion and Scheduler policy surface;
- context-budget, packaging, and patch-hygiene checks.

No implementation, task contract, RFC, or wiki files were changed by this verifier.
Only this report and its verifier-owned evidence files were written.

## Claim under verification

| Field | Value |
| --- | --- |
| Claim ID | `ONE-PR-001` |
| Objective | One Legion task owns at most one (`0..1`) immutable delivery PR identity for its whole lifecycle. |
| Now claim | Fresh tasks bind open; historical-done legacy bindings become merged; ambiguous legacy bindings become unknown and fail closed until the tracker observes the same PR. |
| Routine claim | A merged, closed, conflicted, or unknown binding cannot launch repository work that could create a second PR. Terminal missing-evidence recovery requires a user-created new task. |
| Domain | `legion-pr-lifecycle` |
| Required capability | Independent state-transition, migration, worker-gate, and policy-surface verification |
| Verification method | Full automated suites, targeted migration fixture, adversarial runtime probes, and static policy audit |
| Criticality | High |
| Failure policy | Block merge |
| Owner | Independent verifier |
| Status | PASS |

## Closure of the prior review blockers

| Prior blocker | Current evidence | Result |
| --- | --- | --- |
| A legacy completed PR could backfill as open and let a worker launch. | A fresh binding is `open`. A legacy binding with any historical `done` run migrates/backfills to `merged` and is rejected before launcher invocation. An ambiguous legacy binding becomes `unknown`, is rejected before launch, and can resume only after the tracker observes the same bound PR as `open`. The regression recreates an actual v5 table and exercises migration 6. | Closed |
| A merged PR with missing repository evidence remained active and docs authorized repair. | The tracker emits final non-success, marks the run `failed`, releases all locks, does not satisfy the blocker, emits no downstream event, and writes both final response and comment. The task remains bound `merged`; a retry cannot invoke the launcher. Current docs prohibit repair on the original task and require a user-created new task. | Closed |

## Test execution

| Check | Result | Evidence |
| --- | --- | --- |
| `npm --prefix scheduler test` | PASS — 73/73 | `docs/evidence/test-matrix.txt` |
| `npm run test:regression` | PASS — 48/48 | `docs/evidence/test-matrix.txt` |
| Real v5-to-v6 migration fixture | PASS | `docs/evidence/adversarial-probes.txt` |
| Legacy binding counterexamples | PASS | `docs/evidence/adversarial-probes.txt` |
| Merged/missing-evidence counterexample | PASS | `docs/evidence/adversarial-probes.txt` |
| Static one-PR policy audit | PASS — no forbidden matches | `docs/evidence/static-audit.txt` |
| `npm run audit:context` | PASS | `docs/evidence/test-matrix.txt` |
| `npm run pack:dry-run` | PASS | `docs/evidence/test-matrix.txt` |
| `git diff --check` | PASS | `docs/evidence/test-matrix.txt` |

## Verification boundaries

- Domain-specific business verifier: not applicable; this is workflow and
  Scheduler lifecycle enforcement rather than a separate product-domain claim.
- Authority or canon verifier: not applicable.
- Deferred claims: none.
- Recommendations: none required for readiness.

The real GitHub terminal transition, branch protection, squash merge, cleanup, and
main-workspace refresh remain external protocol steps. They are not deferred
correctness claims: the implementation now fails closed when required evidence is
absent. A different storage implementation or a material change to GitHub/base
configuration must be independently reverified.

## Verdict

PASS

## Human-attention summary

- Attention level: `skim`
- Judgment change: the two blockers from the independent review FAIL are closed by
  current runtime and migration evidence.
- Blocking issues: none.
- Human action: know; no intervention is required before the next review gate.
- Automatic next step: run a fresh independent `review-change` against this exact
  diff and evidence set.

## Evidence

- `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/evidence/test-matrix.txt`
- `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/evidence/adversarial-probes.txt`
- `.legion/tasks/enforce-single-pr-lifecycle-v1/docs/evidence/static-audit.txt`
- Current tracked diff SHA-256:
  `3e0a0852e00b00d7788be888a62ae19eef4425592df9c5cb461c5dfc1a28b718`
