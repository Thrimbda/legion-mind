# Test report: fix-npm-bin-node-modules-ts

## 结论

PASS。当前 hotfix 已覆盖用户报告的 npm installed package 失败模式：package bin 不再执行 `node_modules/lgmind/scripts/*.ts`，而是执行已发布的 JavaScript runtime 文件。

## 已执行命令

### 生成 runtime JavaScript

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run build:runtime-js
```

- 结果：PASS。
- 证明力：确认 committed JS runtime 可以由现有 TS source 生成，且 `prepack` 会在 pack/publish 前刷新 runtime JS。

### Regression suite

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
```

- 结果：PASS。
- 测试数：16/16 pass。
- 新增关键覆盖：`packed npm package bins run from node_modules without TypeScript stripping`。
- 该测试将 npm dry-run package 文件复制到 `node_modules/lgmind` 形态，然后用 plain Node 执行：
  - `bin/lgmind.js --version`
  - `bin/setup-opencode.js --help`
  - `bin/lgmind.js install --dry-run ...`
  - `bin/lgmind.js setup --agent opencode --dry-run ...`
  - `bin/lgmind.js setup --agent openclaw --dry-run ...`
- 证明力：旧版 `0.2.0` 的失败路径正是从 `node_modules/lgmind/bin/lgmind.js` 跳到 `scripts/lgmind.ts`；该测试会在同类路径下触发并捕获 `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`。

### Package dry run

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

- 结果：PASS。
- Package id：`lgmind@0.2.1`
- Filename：`lgmind-0.2.1.tgz`
- Packed entries：62
- 关键 runtime 文件包含：
  - `bin/lgmind.js`
  - `bin/setup-opencode.js`
  - `scripts/lgmind.js`
  - `scripts/setup-opencode.js`
  - `scripts/setup-openclaw.js`
  - `scripts/lib/setup-core.js`
  - `scripts/build-runtime-js.mjs`
- 关键 runtime TS 文件不再作为 npm runtime 发布：
  - `scripts/lgmind.ts`
  - `scripts/setup-opencode.ts`
  - `scripts/setup-openclaw.ts`
  - `scripts/lib/setup-core.ts`

## 额外静态检查

```text
Grep scripts/*.js for experimental-strip-types / runtime .ts references: no matches.
```

- 结果：PASS。
- 证明力：发布 runtime JS 不再引用 `setup-opencode.ts`、`setup-openclaw.ts` 或 `setup-core.ts`，也不再需要 `--experimental-strip-types`。

## 已知注意事项

- `setup-openclaw --help` 当前会落到默认 install 行为；本任务未扩展 direct `setup-openclaw` help 语义，因为该 script 不是 npm bin surface。一次 smoke 误触发默认 OpenClaw install 后已立即执行 `setup-openclaw uninstall --force` 清理。
- 发布验证仍需 PR merge 后通过 GitHub Actions trusted publishing 发布 `0.2.1` 并验证 npm registry。
