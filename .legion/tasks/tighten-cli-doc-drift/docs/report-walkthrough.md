# Walkthrough — tighten-cli-doc-drift

## Goal and scope

This task is scoped to wording/doc drift only for:

- `scripts/setup-opencode.ts`
- `docs/benchmark.md`
- reviewer evidence under `.legion/tasks/tighten-cli-doc-drift/**`

It does **not** add runtime enforcement, new benchmark automation, or a benchmark artifact contract.

## Design summary

Design source of truth: `.legion/tasks/tighten-cli-doc-drift/plan.md`

- Keep `legion-workflow` framed as the control-plane entry.
- Keep the local CLI/setup path framed as optional filesystem-backed tooling.
- Reduce `docs/benchmark.md` to current repo truth, with future benchmark ideas labeled as planned or historical only.

## Change list

### `scripts/setup-opencode.ts`

- Tightens the optional MCP verifier hint so it no longer implies the local CLI is the default workflow path.
- Current observed wording from validation: `filesystem-backed CLI remains optional tooling, while legion-workflow stays the control-plane entry`.

### `docs/benchmark.md`

- Rewrites the benchmark note around current checked-in repo surface.
- Explicitly states there are no `benchmark:*` npm scripts, no committed `scripts/benchmark/` implementation, and no enforced artifact contract/scorecard format in this repo today.
- Preserves future benchmark intent only as planned/historical context.

## How to validate

Reference: `.legion/tasks/tighten-cli-doc-drift/docs/test-report.md`

1. Isolated install + strict verify
   - Command:
     ```bash
     tmpdir=$(mktemp -d "/tmp/legion-cli-test.XXXXXX") && config="$tmpdir/config" && home="$tmpdir/home" && node --experimental-strip-types scripts/setup-opencode.ts install --config-dir "$config" --opencode-home "$home" && node --experimental-strip-types scripts/setup-opencode.ts verify --strict --config-dir "$config" --opencode-home "$home"
     ```
   - Expected: command completes with `READY`, and verifier output includes the optional-tooling/control-plane wording above.

2. Benchmark doc truth check
   - Command:
     ```bash
     rg -n "benchmark:|scripts/benchmark|artifact contract|scorecard" docs/benchmark.md package.json && test ! -d scripts/benchmark
     ```
   - Expected: doc matches repo truth; `package.json` has no `benchmark:*` scripts and `scripts/benchmark/` is absent.

3. Wording regression scan
   - Expected: no `default path` / `default entry` wording for this topic in `README.md` or `docs/*.md`; changed files remain aligned with the current control-plane/thin-tool framing.

## Risk and rollback

- Risk remains low because the change is documentation/verifier wording only.
- Main residual caveat: validation was intentionally narrow and did not cover publish-path entrypoints such as `bunx legion-mind-opencode install`.
- Rollback is straightforward: revert the wording/doc updates in `scripts/setup-opencode.ts` and `docs/benchmark.md`.

## Open items and next steps

- No blocking open items were identified in `.legion/tasks/tighten-cli-doc-drift/docs/review-change.md`.
- If benchmark automation is revived later, add implementation first, then expand `docs/benchmark.md` to describe the real in-repo surface.
