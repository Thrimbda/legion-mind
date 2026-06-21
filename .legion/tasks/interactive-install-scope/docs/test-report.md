# Test report: interactive-install-scope

## 结论

PASS。`lgmind install` / `lgmind setup` 已具备交互式 runtime + project/global scope 选择；脚本/CI 的非 TTY 路径仍保持非交互、确定性默认；package dry-run 指向 `lgmind@0.3.0`。

## 已执行命令

### 生成 runtime JavaScript

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run build:runtime-js
```

- 结果：PASS。
- 证明力：确认发布 runtime JS 已从更新后的 TS source 重新生成。

### Regression suite

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
```

- 结果：PASS。
- 测试数：18/18 pass。
- 新增/更新关键覆盖：
  - `lgmind interactive install prompts for runtime and project scope`
  - `lgmind project scope maps runtime installs to project-local roots`
  - packed `node_modules/lgmind` bin execution still passes without TypeScript stripping
- 证明力：覆盖 `--interactive` 多步 prompt、`--scope project` 对 OpenCode/OpenClaw 的 project-local 路径映射，以及已有非交互 package bin 执行路径。

### Package dry run

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

- 结果：PASS。
- Package id：`lgmind@0.3.0`
- Filename：`lgmind-0.3.0.tgz`
- Packed entries：62
- Critical runtime files include:
  - `bin/lgmind.js`
  - `bin/setup-opencode.js`
  - `scripts/lgmind.js`
  - `scripts/setup-opencode.js`
  - `scripts/setup-openclaw.js`
  - `scripts/lib/setup-core.js`
  - `scripts/build-runtime-js.mjs`

## 行为说明

- TTY / `--interactive` install-like commands prompt for missing runtime and scope.
- Project scope maps to:
  - OpenCode: `<project>/.legionmind/opencode/config` and `<project>/.legionmind/opencode/home`
  - OpenClaw: `<project>/.legionmind/openclaw`
- Non-TTY invocation remains deterministic and non-interactive unless `--interactive` is explicitly passed.

## 待发布验证

- PR merge 后需要通过 `publish-npm.yml` 发布 `lgmind@0.3.0`。
- 发布后需要运行 real `npx lgmind@latest install` smoke，确认真实 npm latest 进入交互路径。
