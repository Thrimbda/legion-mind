# Test report: harden-v1-kernel-harness

## Verdict

PASS.

Final verification after engineer blocker fixes passes. The regression suite now reports 10/10 passing tests, the shared setup core owns real lifecycle/destructive operations, both setup adapters delegate to the core, destructive rollback/uninstall path handling is covered by regression tests, regression temp roots remain repo-local under `.cache/regression`, and docs/README/CLI boundary checks remain valid.

## Commands and evidence

### 1. Final regression suite

Command:

```bash
npm run test:regression
```

Result: PASS.

Exact result summary:

```text
✔ Legion CLI preserves filesystem invariants for init/create/status/list (367.523333ms)
✔ OpenCode setup lifecycle works in isolated directories (712.964458ms)
✔ rollback --to selects requested backup batch (311.314167ms)
✔ uninstall safe-skips drift and force removes managed drift (233.193625ms)
✔ tampered manifest and backup paths are rejected safely (286.090375ms)
✔ symlinked managed root destructive operations are refused (64.24525ms)
✔ invalid backup-index schema blocks rollback (145.687917ms)
✔ OpenClaw setup lifecycle matches managed manifest semantics without owning openclaw.json (648.70975ms)
✔ OpenCode installed skill list exists on disk and includes required phase skills (1.532417ms)
✔ OpenClaw dynamic skill surface is an OpenCode superset (0.529208ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 2505.912416
```

Why this proves the claims:

- Setup lifecycle coverage now includes OpenCode/OpenClaw install, strict verify, force repair, rollback, uninstall, and OpenClaw config non-ownership.
- Destructive path safety coverage includes `rollback --to`, uninstall drift safe-skip/force, tampered manifest/backup paths, symlinked managed roots, and invalid backup-index schema.
- Skill surface coverage still verifies OpenCode required phase skills and OpenClaw dynamic superset behavior.
- CLI filesystem coverage still verifies the thin `init/create/status/list` behavior and no `.tmp-*` staging residue.

Note: npm emitted `npm warn Unknown env config "tmp"`; the suite still exited 0 and all assertions passed.

### 2. Shared setup core owns lifecycle operations; adapters delegate

Command:

```bash
node -e 'const fs=require("fs"); const core=fs.readFileSync("scripts/lib/setup-core.ts","utf8"); const adapters=["scripts/setup-opencode.ts","scripts/setup-openclaw.ts"]; const requiredCore=["export function syncOneFileCore","export function verifyStrictItemCore","export function rollbackCore","export function uninstallCore","copyFileSync","renameSync","rmSync","symlinkSync","targetWithinManagedRoots","validateBackupIndexFile"]; const bad=[]; for (const r of requiredCore) if (!core.includes(r)) bad.push("setup-core missing "+r); for (const forbidden of ["OpenClaw","OpenCode","openclaw","opencode"]) if (core.includes(forbidden)) bad.push("setup-core leaks runtime term "+forbidden); for (const f of adapters) { const s=fs.readFileSync(f,"utf8"); for (const r of ["syncOneFileCore","verifyStrictItemCore","rollbackCore","uninstallCore","validateBackupIndexFile","createManagedRootSet"]) if (!s.includes(r)) bad.push(f+" missing delegate/core symbol "+r); for (const own of ["function removeTarget","function backupPathFor","function canOverwrite","function targetWithinManagedRoots"]) if (s.includes(own)) bad.push(f+" still owns core lifecycle helper "+own); } if (bad.length) { console.error(bad.join("\n")); process.exit(1); } console.log("OK shared setup core owns lifecycle operations and adapters delegate");'
```

Result: PASS.

Exact output:

```text
OK shared setup core owns lifecycle operations and adapters delegate
```

Why this proves the claim:

- Confirms `scripts/lib/setup-core.ts` exports real lifecycle operations: `syncOneFileCore`, `verifyStrictItemCore`, `rollbackCore`, and `uninstallCore`.
- Confirms the core contains actual filesystem lifecycle primitives used by those operations (`copyFileSync`, `renameSync`, `rmSync`, `symlinkSync`) plus destructive-path guards (`targetWithinManagedRoots`, `validateBackupIndexFile`).
- Confirms both `scripts/setup-opencode.ts` and `scripts/setup-openclaw.ts` import/call the shared core operations.
- Confirms adapters no longer define key lifecycle helpers (`removeTarget`, `backupPathFor`, `canOverwrite`, `targetWithinManagedRoots`) locally.
- Confirms shared core remains runtime-agnostic by checking it does not contain OpenCode/OpenClaw names.

### 3. Destructive rollback/uninstall path handling regression coverage

Command:

```bash
node -e 'const fs=require("fs"); const s=fs.readFileSync("tests/regression/setup-lifecycle.test.ts","utf8"); const bad=[]; const required=["tampered manifest and backup paths are rejected safely","symlinked managed root destructive operations are refused","invalid backup-index schema blocks rollback","rollback --to selects requested backup batch","uninstall safe-skips drift and force removes managed drift","--to","outside-backup","backup-index.v1.json","--force","symlinkSync"]; for (const r of required) if (!s.includes(r)) bad.push("setup lifecycle regression missing "+r); if (bad.length) { console.error(bad.join("\n")); process.exit(1); } console.log("OK destructive rollback/uninstall path handling covered by regression tests");'
```

Result: PASS.

Exact output:

```text
OK destructive rollback/uninstall path handling covered by regression tests
```

Why this proves the claim:

- Confirms named regression tests exist for tampered manifest/backup paths, symlinked managed roots, invalid backup index, `rollback --to`, and uninstall drift safe-skip/force.
- Confirms the test source includes the key mechanisms being exercised: `--to`, tampered outside backup path, `backup-index.v1.json`, `--force`, and `symlinkSync`.
- Combined with `npm run test:regression` passing, these tests are not only present but executed successfully.

### 4. Regression temp roots remain repo-local

Command:

```bash
node -e 'const fs=require("fs"); const path=require("path"); const root="tests/regression"; const bad=[]; for (const f of fs.readdirSync(root)) { if (!f.endsWith(".test.ts")) continue; const p=path.join(root,f); const s=fs.readFileSync(p,"utf8"); for (const pattern of ["node:os","tmpdir()","os.tmpdir","/tmp"]) if (s.includes(pattern)) bad.push(p+" contains "+pattern); if (s.includes("mkdtempSync") && !s.includes("regressionCacheRoot")) bad.push(p+" uses mkdtempSync without regressionCacheRoot"); if (s.includes("mkdtempSync") && !(s.includes(".cache") && s.includes("regression"))) bad.push(p+" lacks repo-local .cache/regression root"); } if (!fs.existsSync(".cache/regression")) bad.push(".cache/regression was not created by regression run"); if (bad.length) { console.error(bad.join("\n")); process.exit(1); } console.log("OK regression temp roots are repo-local under .cache/regression and avoid system temp");'
```

Result: PASS.

Exact output:

```text
OK regression temp roots are repo-local under .cache/regression and avoid system temp
```

Why this proves the claim:

- Confirms no regression test imports `node:os`, calls `tmpdir()` / `os.tmpdir`, or embeds `/tmp`.
- Confirms tests using `mkdtempSync` go through `regressionCacheRoot` and contain `.cache/regression` as the root.
- Confirms `.cache/regression` exists after the regression run.

### 5. Docs/current-truth stale reference check

Command:

```bash
node -e 'const fs=require("fs"); const surfaces=["README.md","package.json","vibe-harness-bench/README.md",".legion/wiki/index.md",".legion/wiki/patterns.md"]; const deleted=["docs/benchmark.md","docs/legionmind-usage.md","docs/skill-split-plan.md","docs/legion-context-management-raw-wiki-schema.md"]; const bad=[]; for (const f of deleted) if (fs.existsSync(f)) bad.push(f+" still exists"); if (fs.existsSync("docs")) { const entries=fs.readdirSync("docs"); if (entries.length) bad.push("docs directory not empty: "+entries.join(",")); } for (const p of surfaces.filter(fs.existsSync)) { const s=fs.readFileSync(p,"utf8"); for (const x of deleted) if (s.includes(x)) bad.push(p+" references "+x); } if (bad.length) { console.error(bad.join("\n")); process.exit(1); } console.log("OK deleted docs absent and current surfaces have no stale deleted-doc references");'
```

Result: PASS.

Exact output:

```text
OK deleted docs absent and current surfaces have no stale deleted-doc references
```

Why this proves the claim:

- Confirms the deleted root docs are absent.
- Confirms README, package metadata, benchmark README, and current wiki index/patterns do not reference those deleted docs.
- If a root `docs/` directory exists locally, it is empty and contains no current-truth docs.

### 6. README runtime boundary and thin CLI check

Command:

```bash
node -e "const fs=require('fs'); const readme=fs.readFileSync('README.md','utf8'); const cli=fs.readFileSync('skills/legion-workflow/scripts/legion.ts','utf8'); const bad=[]; for (const term of ['Claude','Codex','Cursor','Gemini']) if (readme.includes(term)) bad.push('README still mentions '+term); if (!readme.includes('可运行内核 / v1 前硬化中')) bad.push('README missing hardened status'); if (!readme.includes('其他运行时不在当前支持面')) bad.push('README missing limited support statement'); if (readme.includes('通用 runtime matrix')) bad.push('README retains runtime matrix wording'); for (const term of ['OpenClaw','OpenCode','runtime orchestrator','agent runtime adapter']) if (cli.includes(term)) bad.push('CLI contains runtime orchestration term '+term); if (bad.length) { console.error(bad.join('\n')); process.exit(1); } console.log('OK README runtime boundary and CLI thin static check');"
```

Result: PASS.

Exact output:

```text
OK README runtime boundary and CLI thin static check
```

Why this proves the claim:

- Confirms README status is `可运行内核 / v1 前硬化中`.
- Confirms README no longer names Claude/Codex/Cursor/Gemini as supported runtime surfaces.
- Confirms README explicitly limits support to current maintained paths and avoids runtime-matrix language.
- Confirms `skills/legion-workflow/scripts/legion.ts` does not contain OpenCode/OpenClaw/runtime-orchestrator terminology, supporting the claim that the CLI remains a thin filesystem tool.

## Claim-by-claim summary

1. **`npm run test:regression` PASS with 10 tests**: PASS.
2. **Shared setup core contains real lifecycle operations and both adapters delegate to it**: PASS.
3. **Destructive rollback/uninstall path handling covered by regression tests**: PASS.
4. **Regression temp roots remain repo-local `.cache/regression`**: PASS.
5. **Docs/current truth/README boundary checks still pass**: PASS.
6. **CLI remains thin; no runtime orchestrator implemented**: PASS.

## Failures, skips, and limitations

- No final verification command failed.
- No regression test was skipped.
- npm emitted `npm warn Unknown env config "tmp"`; it did not affect exit status or assertions.
- One docs check attempt had a shell quoting typo and failed before executing the intended check; it was immediately rerun with corrected quoting and passed. This is command-construction noise, not an implementation failure.
- Historical `.legion/wiki/tasks/harden-legion-workflow-gate.md` still references `docs/eval-entry-gate.md`; this path is outside this task's deleted-doc set and is not one of the current truth surfaces checked here.

## Return-to-engineer needs

None.
