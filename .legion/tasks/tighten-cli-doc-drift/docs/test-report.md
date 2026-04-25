# Test Report — tighten-cli-doc-drift

## Scope

Validate the low-risk wording/doc drift changes in:

- `scripts/setup-opencode.ts`
- `docs/benchmark.md`

## Why these checks

Used the lowest-cost checks that directly prove the acceptance criteria:

1. isolated `install + verify --strict` to capture the real verifier wording
2. targeted repo-truth checks for benchmark script/path claims
3. targeted wording search in current-truth docs to catch regression on default-path language

## Commands run

### 1) Isolated install + strict verify

```bash
tmpdir=$(mktemp -d "/tmp/legion-cli-test.XXXXXX") && config="$tmpdir/config" && home="$tmpdir/home" && node --experimental-strip-types scripts/setup-opencode.ts install --config-dir "$config" --opencode-home "$home" && node --experimental-strip-types scripts/setup-opencode.ts verify --strict --config-dir "$config" --opencode-home "$home"
```

### 2) Benchmark doc truth check against repo surface

```bash
rg -n "benchmark:|scripts/benchmark|artifact contract|scorecard" docs/benchmark.md package.json && test ! -d scripts/benchmark
```

### 3) Default-path/default-entry wording regression scan

- searched `README.md` for `default path|default entry|默认路径|默认入口`
- searched `docs/*.md` for `default path|default entry|默认路径|默认入口`
- searched `scripts/setup-opencode.ts` for `filesystem-backed CLI remains optional tooling|control-plane entry`

## Results

### 1) Verifier wording

**PASS**

The strict verify run completed with `READY`.

Observed verifier output:

> `not configured; filesystem-backed CLI remains optional tooling, while legion-workflow stays the control-plane entry`

This no longer implies the local CLI is the workflow default path.

### 2) Benchmark docs vs repo truth

**PASS**

`docs/benchmark.md` now explicitly says:

- no `benchmark:*` npm scripts exist
- no committed `scripts/benchmark/` implementation exists
- no current artifact contract / scorecard format is enforced here

Cross-checks matched current repo state:

- `package.json` has no `benchmark:*` scripts
- `scripts/benchmark/` does not exist
- `shell.nix` does include the Harbor wrapper referenced by the doc

### 3) Current-truth doc wording regression

**PASS**

No `default path` / `default entry` wording was found in `README.md` or `docs/*.md` for this topic.

Current wording remains consistent with the intended architecture:

- `README.md` describes `legion-workflow` as the workflow source/control-plane entry and the local CLI as a thin local tool
- `docs/benchmark.md` uses the same control-plane vs thin-tool wording
- `scripts/setup-opencode.ts` verify output matches that framing

## Residual risk

- Validation was intentionally scoped and did not exercise publish/install entrypoints such as `bunx legion-mind-opencode install`.
- The wording regression scan covered current-truth repo docs (`README.md`, `docs/*.md`, changed files) rather than every historical task artifact under `.legion/tasks/**`.

## Conclusion

Acceptance criteria validated with direct evidence. No implementation gap found within task scope.
