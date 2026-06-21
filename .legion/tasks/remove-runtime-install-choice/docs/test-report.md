# Test report: remove-runtime-install-choice

## 结论

PASS。验证覆盖了本次核心 claim：`lgmind install` 的交互输出只出现 project/global scope prompt，不再出现 OpenCode/OpenClaw runtime prompt；回归套件和 npm package dry-run 也通过，发布包版本为 `lgmind@0.3.1`。

## 选择这些验证的原因

- 交互 smoke 直接证明用户截图里的 runtime prompt 已从默认交互路径移除。
- `npm run test:regression` 是当前 setup lifecycle、CLI prompt、package bin 与 installed-package regression 的主验证面。
- `npm run pack:dry-run` 证明待发布 package id、version、bin/runtime JS 与文件集仍符合 npm 发布预期。

## Commands

```bash
node bin/lgmind.js install --interactive --dry-run --verbose <<< $'1\n'
```

Result: PASS。

Key evidence:

```text
Choose an install scope:
  1) Project - install under /home/c1/Work/legion-mind/.worktrees/remove-runtime-install-choice/.legionmind
  2) Global  - install to global agent defaults
Install scope [1/project]:
OK_INSTALL opencode copied=42 linked=0 skipped=0 warnings=0 failures=0
```

`Choose an agent runtime to configure:` did not appear.

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run test:regression
```

Result: PASS。

Summary:

```text
tests 18
pass 18
fail 0
```

Notable covered tests:

- `lgmind interactive install prompts for project scope only`
- `lgmind project scope maps runtime installs to project-local roots`
- `lgmind selects OpenClaw runtime non-interactively`
- `packed npm package bins run from node_modules without TypeScript stripping`

```bash
npm_config_cache=.cache/npm npm_config_loglevel=silent npm_config_update_notifier=false npm run pack:dry-run
```

Result: PASS。

Key package evidence:

```text
id: lgmind@0.3.1
version: 0.3.1
entryCount: 62
included runtime JS: scripts/lgmind.js, scripts/setup-opencode.js, scripts/setup-openclaw.js, scripts/lib/setup-core.js
excluded runtime TS paths verified by regression
```

## Failures / skipped

- No failures.
- No skipped verification required for this change.
