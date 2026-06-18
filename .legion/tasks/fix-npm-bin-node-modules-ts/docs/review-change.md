# Change review: fix-npm-bin-node-modules-ts

## Verdict

PASS.

## Scope compliance

- In scope: 修复 npm package bin 在 `node_modules` 内执行 `.ts` runtime 的发布 bug。
- In scope: 增加 published/installed package 形态的 regression。
- In scope: bump patch version 到 `0.2.1`。
- 未新增 CLI 行为；只改变 package runtime 执行载体。
- 未引入 npm token、secret 或本地 OTP 发布路径。

## Correctness

- `bin/lgmind.js` 与 `bin/setup-opencode.js` 现在分别执行 `scripts/lgmind.js` 与 `scripts/setup-opencode.js`，不再传入 `--experimental-strip-types`。
- `scripts/lgmind.js` dispatch runtime script 时使用 `setup-opencode.js` / `setup-openclaw.js`，不再引用 `.ts` runtime。
- `package.json#files` 发布 JS runtime 文件，并排除 `scripts/lgmind.ts`、`scripts/setup-opencode.ts`、`scripts/setup-openclaw.ts`、`scripts/lib/setup-core.ts` 作为 npm runtime。
- `prepack` 会在 pack/publish 前执行 `build:runtime-js`，降低 TS source 与 committed JS runtime 漂移风险。
- 新 regression 在 `node_modules/lgmind` 形态下执行 package bins，直接覆盖用户报告的失败边界。

## Verification evidence reviewed

- `docs/test-report.md` records:
  - `npm run build:runtime-js`: PASS
  - `npm run test:regression`: PASS, 16/16
  - `npm run pack:dry-run`: PASS, `lgmind@0.2.1`, 62 packed entries
  - static grep over runtime JS: no `.ts` runtime references and no `--experimental-strip-types`

## Security / supply-chain lens

Applied because this changes published npm runtime surface.

- No dependency was added.
- No token, credential, registry auth path, or workflow secret was added.
- Published package still uses explicit `files` allowlist.
- Runtime generation uses Node built-in `stripTypeScriptTypes` at pack time only; published bin execution does not rely on experimental type stripping.
- Package behavior remains local filesystem setup only and existing lifecycle safety checks remain unchanged.

## Blocking findings

None.

## Non-blocking follow-ups

- `setup-openclaw --help` currently falls through to default install when run directly; it is not a published bin today, but should be fixed in a separate UX hardening task if direct OpenClaw CLI is made public.
