# 0XC-293 Legion Pi distribution skeleton 当前快照独立验证报告

- **验证者**: `verify-change-glowing-lynx`
- **Agent type**: `verify-change`
- **验证日期**: 2026-08-18
- **工作树**: `/home/c1/Work/legion-mind/.worktrees/pi-distro-skeleton`
- **分支**: `legion/pi-distro-skeleton-legion-pi`
- **基线 HEAD**: `12f60baf69a39c8c20b825d1dc0019c91ffb80c6`
- **当前实现快照**: 17 个实现文件，聚合 SHA-256 `57cc195ed2bad11cf10ac593247790b1c5cd770916296e75a602aac3753f3c14`
- **环境**: Linux `6.12.103`，Node `v26.7.0`，npm `11.19.0`
- **结论摘要**: `PASS`。当前 hash 已直接关闭 stale review 的三个 P1 blocker 家族：setup/verify/matrix 共用完整包前缀 canonical、外链和 hardlink 门；owned-root explicit verify config 在任何 mutation 前拒绝；matrix 拒绝 config/output 同 inode 并以同目录随机 exclusive temp + rename 原子写 output；setup 1 次和 matrix 8 次 probe child 捕获均只含最小 allowlist，不含标准 credential locator 或 Node injection variable。其余指定负例、真实 install 两次、`READY`、真实 8/8、targeted 11/11、full 59/59、72-file pack、7/7 runtime JS 和 frozen scope 全部通过。

本报告以当前 plan、设计真源、完整实现 diff、当前仓库验证协议和本轮直接执行结果建立新基线。现存 `review-change.md` 与被替换的旧 `test-report.md` 只用于登记必须主动重放的旧 blocker；不继承它们的 Verdict 或旧实现 hash 上的测试结论。

## 验证范围与方法选择

### 当前真源与输入

| 类型 | Locator / 标识 | 本轮直接读取结果 |
|---|---|---|
| Contract | `.legion/tasks/pi-distro-skeleton/plan.md`，SHA-256 `38ab2b6219de3b953d9021df6521c3289aadb84248595744fb26d67cf18a7711` | 六项验收：四包 exact pin、单配置、install/verify/rollback、真实 8-combination matrix、隔离复现、frozen scope |
| Linear contract | `0XC-293`，updated `2026-08-17T07:39:42.417Z` | 直接 `get_issue`；status `Backlog`，labels 含 `contract:stable`，验收和 scope 与 plan 一致 |
| Linear comments | `0XC-293` | 直接 `list_comments`；`count=0`，`hasNextPage=false` |
| Linear 北极星 | document `35b1df5a-f092-419c-a1bc-a4252d92e353`，updated `2026-08-17T07:29:19.668Z` | 直接 `get_document`；OpenCode 冻结、pin + fail-closed matrix、fresh verifier 与 credential minimization 边界 |
| 设计 RFC | `.legion/tasks/evaluate-pi-control-plane/docs/rfc.md`，SHA-256 `10903600f4c395c5ccc5972491894a85a9b75a3af9b605700904c6c29788da8b` | 隔离 profile、exact pins、真实启动矩阵、回滚和防 agent 失控边界 |
| Research | `.legion/tasks/evaluate-pi-control-plane/docs/research.md`，SHA-256 `77daa1b0dc75781bdbf7716c09212e9e302e8c0bba475040cc11042764d43642` | Pi loader/package/config 事实、重名工具 fail-closed 和 2026-08-16 pin 快照 |
| Pin review | `.legion/tasks/pi-distro-skeleton/docs/version-review.md`，SHA-256 `b785d811673fbb07078658ed340c577142d8c7f8eb49f6c5ac407cdfe861b03f` | `pi-lens 4.0.0 -> 4.0.1`；本轮另行直接查询 registry |
| Verification protocol | `skills/verify-change/SKILL.md`，SHA-256 `4eaf5e921b6ced514c7e7bba0c655e3c43b3bfc1ee72bab37f8776262c10d97d` | claim 预注册、主动反例、证据映射、精确 Verdict 和五字段 handoff |
| Cognitive protocol | `skills/verify-change/references/REF_COGNITIVE_VERIFICATION.md`，SHA-256 `fe9b4bf0247e169b76c9a2d4b2f2a977d83105884476e35dab525e0dd1064bc3` | 三轴、五状态、provenance、authority 与聚合门 |
| Attention protocol | `skills/legion-workflow/references/REF_HUMAN_ATTENTION.md`，SHA-256 `fa3cef52313ecd436c79b744f0bb5b31d242c7825d4fcc029e3b7bed303bb5f3` | `none/skim/review/decide` 和 lifecycle 门 |
| Stale review | `.legion/tasks/pi-distro-skeleton/docs/review-change.md`，SHA-256 `b5264e076972a4a2c2b6ab85838f957e511fbe392c97dacc7135a3d4609e4079` | 只提取 package final-file、explicit verify config、matrix hardlink output 和 credential locator blocker；旧 `29c04526...` hash/Verdict 不作证据 |
| Replaced report | 覆盖前 SHA-256 `1c944cc6b8db54a4000af81efe64d6388220c8b02357ec2676ff4d0ef1d9ad3f` | 只提取旧验证面与 raw locator 结构；旧 PASS 不作证据 |

Linear issue、comments 与 document 由本 verifier 直接读取；object id、updatedAt、labels、正文和空 comments 来自本轮成功调用，不来自旧报告转述。

### 完整变更面与实现 hash

本轮读取完整 tracked diff、cached diff、全部 untracked 文件、17 个实现文件的完整内容，以及共享 dependency `scripts/lib/setup-core.ts`。最终机械结果为 23 个 changed paths：4 tracked、19 untracked、0 cached；其中 6 个 task evidence paths、17 个 implementation paths，无其他路径。

17 个实现文件为：

```text
README.md
bin/setup-pi.js
legion-pi/README.md
legion-pi/legion-pi.json
legion-pi/startup-matrix.md
package.json
scripts/build-runtime-js.mjs
scripts/lib/pi-distro.js
scripts/lib/pi-distro.ts
scripts/pi-startup-probe.mjs
scripts/setup-pi.js
scripts/setup-pi.ts
scripts/verify-pi-startup-matrix.js
scripts/verify-pi-startup-matrix.ts
tests/regression/pi-startup-matrix.test.ts
tests/regression/setup-lifecycle.test.ts
tests/regression/setup-pi.test.ts
```

实现 hash 算法：path 排序后，将每个 `path + NUL + raw content + NUL` 连续输入 SHA-256。task docs、stale review 和本报告不进入 hash。`npm run test:regression` 与两次 `npm pack` 触发 runtime rebuild 后重算仍为 `57cc195ed2bad11cf10ac593247790b1c5cd770916296e75a602aac3753f3c14`。

当前关键修复面为：

- `scripts/lib/pi-distro.ts:99-115` 从 allowlist 构造 probe child env；`125-232` 对完整 runtime/extension package prefix 递归拒绝 external/broken symlink 与 `nlink != 1` 文件，并验证 exact manifest、entrypoint 与 Pi bin。
- `scripts/setup-pi.ts:404-461` 在 package command 前后使用共享门；`652-679` 在 explicit verify 读 active config 或写 install-state 前复用 owned-root config 门。
- `scripts/verify-pi-startup-matrix.ts:112-153` 比较 config/output `dev+ino` 并原子写 output；`259` 使用同一 package validator；`296-315` 通过共享 allowlist 启动每个 child。

本轮不以静态阅读替代 E1/E2 的 fresh packaged-JS direct replay。

### 方法选择理由与隔离

执行顺序预先固定为：claim 登记 -> registry/schema -> stale P1 blocker 与所有历史安全负例 -> fresh real install/idempotency/READY/real matrix -> targeted -> full regression -> pack/runtime -> scope/final hash。安全、数据保全和 evidence binding 反例先于多数 happy paths，避免用通过数量掩盖直接反例。

所有 fixture、npm cache、HOME、XDG、TMPDIR、真实 profile 和原始输出均位于 `.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/`。成功的真实安装使用运行前不存在的 `real-current-fresh3/`，其整个父进程环境由 21 个显式非凭证变量构造；未向真实 HOME、系统 prefix、provider/model login state 或系统配置写入数据。custom fixture 只注入字面值 `redacted`，持久化内容只记录环境变量名称，不记录值。

## Claim 预注册

以下字段在主动反例和主要命令前由验收、设计、完整 diff 与 stale blockers 固定。初始状态均为 `INCONCLUSIVE（等待当前 hash 证据）`；执行后没有缩小 scope、降低 criticality 或改变 blocking policy。

| claim-id | 单一主张与验收/风险关系 | 三轴 | domain-id / required capability / method | 所需原始证据 | criticality / risk-if-wrong / blocking-policy / owner |
|---|---|---|---|---|---|
| C1-config | 唯一用户 config 只接受 schema v1、复核日期、四包 exact pins 与唯一 skill paths，并确定性生成三份 runtime artifacts；AC1/AC2 | objective / now / routine | N/A / Node+JSON+npm registry / schema one-mutation negatives、renderer、registry | config、8 个拒绝结果、registry metadata、renderers | high / 浮动版本或第二配置源漂移 / block-stage / engineer |
| C2-lifecycle | 隔离 profile 可 pristine install、幂等 reinstall、strict `READY`；startup probe 不能被 skip-like env 绕过；AC2/AC3/AC5 | objective / now / routine | N/A / Node+npm+Pi SDK / real install twice、missing-entrypoint negative、strict verify | command status、summaries、manifests、probe payload | high / 零状态不可复现或误报 READY / block-stage / engineer |
| C3-path-package-safety | config、generated/state、profile/probe/managed 路径和完整 package prefix 均 fail closed；setup install/verify/matrix 拒绝 canonical escape 与 hardlink，且不损坏唯一 source 或外部 victim；AC3/AC5 | objective / now / routine | N/A / filesystem+process / lexical+canonical、lstat、nlink、sentinel、snapshot negatives | child status、profile snapshots、link target、victim bytes、package marker | critical / 外写、外部代码执行、源配置损坏 / block-stage / engineer |
| C4-rollback | post-backup drift 默认保留，`--force` 先建 recovery backup，missing backup 非零且保留 batch；AC3 | objective / now / routine | N/A / lifecycle+filesystem / fresh two-profile rollback fixture | target/index bytes、backup reason/content、status | critical / 用户修改或唯一备份丢失 / block-stage / engineer |
| C5-matrix | matrix 绑定 active config、exact manifests、canonical package roots、child 最终状态与 required tools；config/output/scratch 不重叠或同 inode，output 原子替换；AC4/AC5 | objective / now / routine | N/A / Pi SDK+filesystem / identity、overlap、one-mutation negatives、synthetic+real rows | rows、manifests、realpaths、inodes、sentinels、child status | critical / 配置被销毁或 drifted runtime 被批准 / block-stage / engineer |
| C6-probe-boundary | setup 与 matrix child probes 从最小 allowlist 启动，不含标准 credential locators/Node injection vars，并实际要求 4 个 core 与 5 个 extension tool sentinels；AC2/AC4 | objective / now / routine | N/A / child env+SDK payload / explicit capture、逐 tool omission、duplicate/status negatives | setup capture、8 matrix captures、tool/status outcomes | critical / secret locator 暴露或缺工具仍误报可用 / block-stage / engineer |
| C7-package-regression | targeted/full regression、72-file pack 与 7 组 runtime JS 精确匹配当前发布面；AC5 | objective / now / routine | N/A / Node test+npm pack+TS strip / direct commands、in-memory rebuild | TAP/log、pack JSON、runtime hashes | high / 发布缺入口或 stale runtime / block-stage / engineer |
| C8-scope | 当前实现未修改 OpenCode、skills、scheduler、pi-web 或其他 frozen surface；AC6 | formal / now / routine | N/A / Git / complete changed-path allowlist、diff hygiene、hash | tracked/untracked/cached paths、guard、hash | high / 冻结线破坏或 scope 扩张 / block-stage / engineer |

## Claim 状态与证据映射

| claim-id | 状态 | 当前证据结论 | Evidence | 独立性 / 置信度 | 残余不确定性与失效条件 |
|---|---|---|---|---|---|
| C1-config | PASS | 四个 exact pins 与 2026-08-18 registry name/version/latest/license 一致；8 个 schema mutations 全拒绝；三 renderer 可重算 | E0 | high / high | registry/tag/config/schema 变化即失效；未做 signature/legal audit |
| C2-lifecycle | PASS | 第三个全新 root 首次 install、再次 install、strict verify 与 mandatory startup probe 通过；missing runtime 在两个 skip-like env 下 install/verify 均非零 | E1、E3、E4、E5 | high / high | Linux Node 26；package acquisition 仍非跨进程事务 |
| C3-path-package-safety | PASS | 四类任意包内 external symlink/hardlink 在 setup install/verify/matrix 均被拒；4 个 explicit verify owned-root config 和 5 个 linked config cases 在 mutation 前拒绝；8 个 path symlink victims 与 6 个 temp victims 保留 | E1、E2、E4 | high / high | 不覆盖恶意并发 TOCTOU；可信单用户、单 writer threat model |
| C4-rollback | PASS | default drift refusal 保留 target/index；force 恢复旧内容并保存 recovery；missing backup 非零且 target/index/batch 保留 | E1、E4 | high / high | 未做断电、进程 crash 或 filesystem fault injection |
| C5-matrix | PASS | 6 个 overlap/identity cases、14 个 exact/canonical mutations、loaded redirect、duplicate tools与 post-payload nonzero 均 fail closed；原子 output 保留 hardlink alias；synthetic 与 real 8/8 正向控制成立 | E1、E2、E3、E4 | high / high | pin、Pi loader、entrypoint、Node FS 语义或并发 threat model 变化即失效 |
| C6-probe-boundary | PASS | setup 1 capture、matrix 8 captures 均无 forbidden/unexpected names；setup 9/9 omissions非零，matrix core omissions 8 rows FAIL、extension omissions 4 selected rows FAIL，child nonzero与 duplicate均被拒 | E1、E2、E3、E4 | high / high | 只证明明确 allowlist；不声称 PATH 指向程序本身无风险 |
| C7-package-regression | PASS | targeted 11/11、full 59/59、pack 72/72、7/7 runtime JS exact | E4、E5、E6 | high / high | builder、npm pack rules或 allowlist 变化即失效 |
| C8-scope | PASS | 17-file allowlist完整，cached/unexpected/frozen/missing均为空，`git diff --check` 无输出，pack 后 hash 不变 | E7 | high / high | 后续任一 changed path/content 变化即失效 |

AC1 -> C1；AC2 -> C1+C2+C6；AC3 -> C2+C3+C4；AC4 -> C5+C6；AC5 -> C2+C3+C5+C7；AC6 -> C8。所有 `block-stage` claims 均为 PASS，无核心 `INCONCLUSIVE`、`DEFERRED` 或未决 judgmental claim，因此阶段 Verdict 为 PASS。

## 执行记录与原始结果

原始机器输出位于 `.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/`。以下同时内嵌关键结果，避免 gitignored cache 成为唯一结论来源。

### E0 - Registry、schema 与 deterministic renderers

命令：

```bash
node /tmp/opencode/pi-registry-check-57cc195e.mjs "$PWD" "$PWD/.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/npm-registry-cache" "$PWD/.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e0-registry.json"
node /tmp/opencode/pi-schema-check-57cc195e.mjs "$PWD" "$PWD/.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e0-schema-renderers.json"
```

Registry harness 实际逐项执行：

```bash
npm view @earendil-works/pi-coding-agent@0.84.2 name version license engines dist-tags --json
npm view pi-subagents@0.50.0 name version license engines dist-tags --json
npm view pi-mcp-adapter@2.26.0 name version license engines dist-tags --json
npm view pi-lens@4.0.1 name version license engines dist-tags --json
```

全部 status `0`。`checkedAt=2026-08-18T06:29:54.712Z`；四项 `allExact=true`、`allLatest=true`、`allLicenseMIT=true`。Pi core engine 为 `>=22.19.0`，pi-mcp-adapter 为 `>=20`；发行版自身 gate 为 Node `>=24`。

Schema 正向解析与三 renderer 通过；以下 8 个单变更均被拒绝：`unknown-top-level`、`schema-version`、`invalid-date`、`floating-runtime`、`missing-extension`、`duplicate-extension`、`wrong-extension`、`duplicate-skill`。

Raw locators：`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e0-registry.json`、`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e0-schema-renderers.json`。

### E1 - Setup、package prefix、config、rollback、tool 与 child env 负例

命令：

```bash
REPO_ROOT="$PWD" node /tmp/opencode/pi-setup-negatives-57cc195e.mjs "$PWD/.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/setup-negatives" "$PWD/.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e1-setup-negatives.json"
```

Harness 对当前 `bin/setup-pi.js` 建立 fresh fake npm/Pi/SDK profiles，每个 fail-closed case 检查 status、完整 profile snapshot 或 victim bytes、symlink identity 和 package-call marker。

最新修复直接结果：

```json
{
  "sharedPackagePrefixValidation": {
    "runtime-external-symlink": {"install": 1, "verify": 1, "matrix": 1},
    "runtime-hardlink": {"install": 1, "verify": 1, "matrix": 1},
    "extension-external-symlink": {"install": 1, "verify": 1, "matrix": 1},
    "extension-hardlink": {"install": 1, "verify": 1, "matrix": 1},
    "packageCommandCalled": false,
    "allVictimsAndMatrixOutputsUnchanged": true
  },
  "explicitVerifyOwnedConfig": {
    "runtime": 1,
    "agent": 1,
    "sessions": 1,
    ".legionmind/install-state.v1.json": 1,
    "allCompleteProfileSnapshotsUnchanged": true
  },
  "setupProbeEnvironment": {
    "captures": 1,
    "forbiddenRetained": [],
    "unexpectedOutsideAllowlist": []
  }
}
```

包前缀四个 cases 都在 setup install package command 前拒绝，package marker 不存在；setup verify 与 matrix 也均 status 1。External victim 与 matrix output bytes 均未变化。Persistent targeted suite 另覆盖 runtime entrypoint、Pi bin 和 extension entrypoint final symlink cases。

Setup child 唯一可见名称为：

```text
HOME LANG PATH PI_CODING_AGENT_DIR PI_CODING_AGENT_SESSION_DIR PI_LENS_HOME
PI_OFFLINE PI_SKIP_VERSION_CHECK PI_TELEMETRY SHELL TEMP TERM TMP TMPDIR
XDG_CACHE_HOME XDG_CONFIG_HOME XDG_DATA_HOME npm_config_audit npm_config_cache
npm_config_fund npm_config_ignore_scripts npm_config_update_notifier
```

注入但不可见的标准 locator 与 Node injection names 包含：`OPENAI_API_KEY`、`SSH_AUTH_SOCK`、`KUBECONFIG`、`DOCKER_CONFIG`、`NPM_CONFIG_USERCONFIG`、`GNUPGHOME`、`GPG_AGENT_INFO`、`PGPASSFILE`、`CI_JOB_JWT`、`AZURE_CONFIG_DIR`、`AWS_SHARED_CREDENTIALS_FILE`、`GOOGLE_APPLICATION_CREDENTIALS`、`CLOUDSDK_CONFIG`、`NETRC`、`NODE_OPTIONS`、`NODE_PATH`、`NODE_REPL_HISTORY`、`NODE_EXTRA_CA_CERTS`、`NODE_TLS_REJECT_UNAUTHORIZED`、`NODE_DEBUG`。

历史 setup negatives：

| 家族 | 直接结果 |
|---|---|
| lexical-inside/canonical-outside config links | `runtime`、`agent`、`sessions`、`.legionmind`、`.legionmind/generated/settings.json` 均 status 1；完整 profile、link、target、external config 保留；package command 未调用 |
| setup path symlinks | `profile-ancestor`、`owned-agent`、`startup-probe`、`target-active`、`target-settings`、`target-subagent`、`runtime-package`、`extension-package` 均 status 1；outside victims 保留 |
| predictable temp writes | install status 0；6 个旧 `.tmp` symlink sentinels 与 external bytes 全保留；随机 exclusive temp 无残留 |
| mandatory no-skip startup | runtime entrypoint 缺失，`LEGION_PI_SKIP_STARTUP_PROBE=1` 与 `PI_SKIP_STARTUP_PROBE=1` 下 install status 1、verify status 1 |
| required tools | `read/bash/edit/write/subagent/subagent_wait/mcpScript/mcp/lens_diagnostics` 逐项省略均使 setup verify status 1 |
| child final status / loaded redirect | structured payload 后 child exit 7 -> status 1；loaded pi-lens path redirected outside reviewed root -> status 1 |
| rollback | default drift status 1 且 target/index 保留；force status 0，恢复 pre-backup drift并以 reason `rollback-force-current-drift` 保存 post-backup drift；missing backup status 1 且 target/index/batch 保留 |

Raw locator：`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e1-setup-negatives.json`。

### E2 - Matrix identity、atomic output、exact/canonical、tools、status 与 child env

命令：

```bash
REPO_ROOT="$PWD" node /tmp/opencode/pi-matrix-negatives-57cc195e.mjs "$PWD/.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/matrix-negatives" "$PWD/.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e2-matrix-negatives.json"
```

核心结果：

```json
{
  "baseline": {"status": 0, "pass": 8, "fail": 0, "credentialCaptureRows": 8, "forbiddenRetained": [], "unexpectedOutsideAllowlist": []},
  "overlapStatuses": {
    "configInScratch": 1,
    "outputInScratch": 1,
    "outputEqualsConfig": 1,
    "outputInsideProfile": 1,
    "configOutputHardlink": 1,
    "outputSymlink": 1
  },
  "atomicOutput": {"status": 0, "pass": 8, "fail": 0, "hardlinkAliasPreserved": true, "outputIdentityReplaced": true},
  "loadedExtensionRedirect": {"status": 1, "pass": 4, "fail": 4},
  "postPayloadChildStatus": {"status": 1, "pass": 0, "fail": 8},
  "duplicateTools": {"status": 1, "pass": 0, "fail": 8}
}
```

`configOutputHardlink` 使用两个不同 pathname 指向同一 `dev+ino`，运行前后两个 path、inode 和 config bytes 全保留。Atomic positive control 让 output 与无关 alias 初始 hardlink；成功运行后 alias 仍为原 sentinel/inode，output 成为新 inode 的 8-PASS report，证明不是原地 truncate。

14 个 preflight mutation 均 status 1，既有 output 与 external tree 均保留：`runtime-version`、`extension-version`、`runtime-manifest-symlink`、`extension-manifest-symlink`、`runtime-entrypoint-symlink`、`runtime-bin-redirect`、`runtime-root-symlink`、`extension-root-symlink`、`package-store-symlink`、`profile-symlink`、`matrix-root-symlink`、`active-config-mismatch`、`active-config-symlink`、`config-symlink`。

逐 tool 结果：`read/bash/edit/write` 各为 `0 PASS / 8 FAIL`；`subagent/subagent_wait/mcpScript/mcp/lens_diagnostics` 各为 `4 PASS / 4 FAIL`，总进程 status 均为 1。

Matrix child 的 8 个 captures 全相同且只含：

```text
HOME LANG PATH PI_CODING_AGENT_DIR PI_CODING_AGENT_SESSION_DIR PI_LENS_HOME
PI_OFFLINE PI_SKIP_VERSION_CHECK PI_SUBAGENT_PI_BINARY PI_TELEMETRY SHELL
TEMP TERM TMP TMPDIR XDG_CACHE_HOME XDG_CONFIG_HOME XDG_DATA_HOME
npm_config_cache npm_config_ignore_scripts
```

Raw locator：`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e2-matrix-negatives.json`。

### E3 - Fresh real install 两次、READY 与真实 8/8

成功 root `real-current-fresh3/` 在运行前不存在。Verifier 使用 `env -i` 等价的显式环境对象，只提供 PATH、repo-local HOME/XDG/TMP/npm cache/prefix、locale、CA locator 与 npm retry transport settings；不提供 provider/model credential。执行命令为：

```bash
node bin/setup-pi.js install --profile-dir "$ROOT/profile" --config "$PWD/legion-pi/legion-pi.json"
node bin/setup-pi.js install --profile-dir "$ROOT/profile" --config "$PWD/legion-pi/legion-pi.json"
node bin/setup-pi.js verify --profile-dir "$ROOT/profile" --config "$PWD/legion-pi/legion-pi.json" --verbose
node scripts/verify-pi-startup-matrix.js --profile-dir "$ROOT/profile" --config "$PWD/legion-pi/legion-pi.json" --output "$ROOT/startup-matrix.md"
```

四条 status 均为 `0`：

```text
OK_INSTALL legion-pi copied=3 linked=0 skipped=0 warnings=0 failures=0
OK_INSTALL legion-pi copied=0 linked=0 skipped=3 warnings=0 failures=0
OK_VERIFY [verify/startup-probe] ... :: 3 extensions and 22 unique tools loaded
READY legion-pi copied=0 linked=0 skipped=0 warnings=0 failures=0
```

真实 matrix：

```text
000 core=4 PASS
001 pi-lens=18 PASS
010 pi-mcp-adapter=6 PASS
011 pi-mcp-adapter+pi-lens=20 PASS
100 pi-subagents=6 PASS
101 pi-subagents+pi-lens=20 PASS
110 pi-subagents+pi-mcp-adapter=8 PASS
111 pi-subagents+pi-mcp-adapter+pi-lens=22 PASS
```

独立 post-check 确认：active config 与 source 结构相等；managed outputs 恰为 3；四个 installed manifests 的 name/version 精确匹配；runtime entrypoint、Pi bin 与三个 extension entrypoints canonical 地位于各自预期 package root，所有最终文件 `nlink=1`。

Raw locators：`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e3-real-install-fresh3.json`、`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/real-current-fresh3/startup-matrix.md`、`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/real-current-fresh3/{install-1.log,install-2.log,verify.log,matrix.log}`。

### E4 - Targeted 11/11

```bash
node --test --experimental-strip-types --test-reporter=tap --test-reporter-destination=.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e4-targeted.tap tests/regression/setup-pi.test.ts tests/regression/pi-startup-matrix.test.ts
```

Exit `0`：

```text
tests 11
pass 11
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 2624.696036
```

该 suite 当前持久覆盖 package final-file containment、owned-root explicit verify config、matrix hardlink identity、credential/Node env exclusion、lifecycle、rollback、predictable temp、mandatory probe、profile/managed path symlinks、exact manifests、scratch overlap与 child status。

Raw locator：`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e4-targeted.tap`。

### E5 - Full 59/59

```bash
npm run test:regression
```

Exit `0`：

```text
tests 59
suites 0
pass 59
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 4649.314708
```

输出包含认知/注意力协议、CLI/lifecycle、npm package/bin、8 个 setup-pi tests 与 3 个 matrix tests。Raw locator：`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e5-full-regression.log`。

### E6 - 72-file pack 与 7/7 runtime JS

Pack harness 完整执行：

```bash
npm pack --dry-run --json
npm pack --dry-run --json --ignore-scripts
```

两次 status `0`；with-scripts run 执行 `prepack -> build:runtime-js`。

```json
{
  "pack": {
    "name": "lgmind",
    "version": "0.5.0",
    "withScriptsFileCount": 72,
    "ignoreScriptsFileCount": 72,
    "pathsEqual": true,
    "missingRequired": [],
    "runtimeTs": [],
    "forbidden": []
  },
  "runtimeJs": {"files": 7, "allExact": true}
}
```

In-memory comparator 严格复现当前 builder 的 TypeScript strip、shebang/import/runtime substitutions 与 trailing whitespace 规则。Pi 新增 runtime JS hashes 为：

```text
scripts/lib/pi-distro.js                 7ff6c0dfd9aab42ad2d78af0020af6951f12140fb9cc502e481b6659ed98f51f
scripts/setup-pi.js                       462f26ed8e703a5a2679948d05a5a85aa2b2d988571d291a2524cb2d37d23143
scripts/verify-pi-startup-matrix.js       f0e8b565187378e0c32cca388fd5fb8a0639cec483f7f4c3019a26bb86fe2c0f
```

Raw locators：`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e6-pack-runtime.json`、`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/pack-runtime/pack-with-scripts.stdout.json`、`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/pack-runtime/pack-ignore-scripts.stdout.json`。

### E7 - Frozen scope、hygiene 与最终 hash

命令/方法：`git diff --name-only --no-ext-diff --text`、cached diff、`git ls-files --others --exclude-standard`、changed-path allowlist、`git diff --check` 和 17-file hash harness。全部 exit `0`。

```json
{
  "changedPaths": 23,
  "trackedPaths": 4,
  "untrackedPaths": 19,
  "cachedPaths": 0,
  "implementationPaths": 17,
  "taskEvidencePaths": 6,
  "unexpected": [],
  "frozen": [],
  "missingExpected": [],
  "diffCheck": "",
  "implementationSha256": "57cc195ed2bad11cf10ac593247790b1c5cd770916296e75a602aac3753f3c14"
}
```

Frozen guard 覆盖 `.opencode/**`、`skills/**`、`scheduler/**`、`pi-web/**`、`opencode.json` 与 `.github/workflows/opencode.yml`。Raw locator：`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/e7-scope-hash.json`。

## Domain verifier provenance

**不适用。** C1-C8 均为 routine objective/formal engineering claims；contract 已指定可直接执行的 JSON schema、filesystem lifecycle、Pi SDK loader、npm registry/pack、Node test 与 Git 方法。没有 domain-id、专门资质或外部专家方法要求，也没有以 Agent 名称、模型自信或多数共识替代证据。

当前 verifier 与实现作者、旧 report 和 stale review 判断分离。Linear objects、npm metadata、child statuses、profile snapshots、sentinel bytes、lstat/readlink/dev/ino/nlink、real manifests/paths、matrix rows、TAP 与 Git 都由本轮直接读取或执行。Custom harness 原始机器摘要位于 repo-local cache；persistent tests 为关键 shipped behavior 提供第二条可重开证据。

敏感信息处理：fake fixtures 只注入字面值 `redacted`，原始证据只记录环境变量名称列表；setup capture 和 8 个 matrix captures 均不含 forbidden names。成功真实安装的父环境从显式非凭证字段构造，不读取用户 credential store。

## Authority evidence

**不适用。** 本任务没有法律、合规、审计签署或资质背书 claim。Linear issue/document 是 contract/design 的直接来源，npm registry 是 package metadata 的直接来源，但两者都没有被提升为 authority sign-off。

本轮只确认 exact name/version/latest/license、installed manifests 和运行行为；未宣称 npm signature、maintainer identity、tarball attestation、漏洞扫描或法律许可证意见已验证。不存在 authority negative-path 需要聚合。

## DEFERRED / RECOMMENDATION

无。所有预注册 claims 均为 `now` 且已执行；contract 没有延后验收，当前也没有需要 owner 做价值取舍的 judgmental claim。

## 失败、跳过与残余不确定性

### 实现与验收失败

无。所有预注册 `block-stage` claims 均为 PASS；所有主动 negative 的非零结果都是预期 fail-closed 行为。

### 验证器与运行环境事件

| 事件 | 处理 | 是否支持 claim |
|---|---|---|
| 第一个 real root 的 wrapper 对 install-1 设置 180 秒 timeout；子进程被终止时 `status=null` 且无成功输出，留下 partial profile | 保留 `real-current/` 为事件证据；不复用 profile；将 timeout 提高并新建 root | 不支持任何 PASS claim |
| 第二个全新 root 在 `pi-lens@4.0.1` package acquisition 时返回 `E_PACKAGE` | npm raw log 显示 registry 三次 `ECONNRESET`，属于网络 transport；不复用 profile；第三个全新 root 增加 npm retry transport settings后完整重跑 | 失败本身只支持安装器 fail-closed；E3 PASS 只使用第三个 root |
| 首个 pack comparator 把 `skills/legion-workflow/scripts/*.ts` 错当禁止 runtime TS | 收窄为 builder 的 7 个 runtime source TS 后，两次 pack 与 comparator 完整重跑 | 错误断言不支持 claim；E6 只使用重跑结果 |

第二次 real install 的 transport log：`.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/real-current-fresh2/profile/.legionmind/npm-cache/_logs/2026-08-18T06_37_17_326Z-debug-0.log`，关键原始结果为三次 `ECONNRESET` 和 `Client network socket disconnected before secure TLS connection was established`。

### 有意跳过

- 未运行 credentialed provider/model prompt；contract 要求 credential-free SDK startup，本轮覆盖真实 loader/session creation、显式 child env capture 与 required tools。
- 未安装 pi-web、FRP、browser/computer-use、pi-goal 或 Legion role glue；均属 out-of-scope/frozen surface。
- 未在 macOS、Windows、其他 Linux 或恰好 Node 24 上运行；当前 Linux Node 26 满足 `>=24` gate。
- 未执行 npm signature/vulnerability/legal audit、syscall-level 全进程 I/O audit、恶意并发置换、断电或进程 crash fault injection。

### 残余风险与失效条件

- Static precheck 不覆盖恶意并发进程在检查与 write/rename/rm 之间实施 TOCTOU。当前设计 threat model 是可信单用户、单 writer profile；若扩展到不可信并发 writer，需新的设计门与 fd-relative/no-follow 原语。
- Package acquisition 和 rollback reconciliation 不是跨多个 npm/Pi process 的事务。前两个真实 root 展示了 timeout/network failure可留下 partial profile；当前安装器会非零退出，fresh root 和同 profile 重试路径仍需调用方治理。
- Probe env 已从 allowlist 构造并排除标准 locator 与 Node injection variables；本轮不声称受控 `PATH` 内的可执行文件或显式允许的 HOME/XDG 路径本身可信。
- 当前 registry、tarball、Pi loader、Node filesystem、builder、pack allowlist、任一 implementation file 或 changed-path set 变化都会使本报告失效并要求新 hash 验证。
- `.cache/**` 是可删除的辅助 raw evidence；Verdict 所需关键机器摘要已内嵌本报告，但重新审查精确原始输出前应保留当前 cache locator。

## Verdict
PASS

## 会话注意力摘要

| 字段 | 内容 |
|---|---|
| 阶段 | verify-change |
| 阶段结论 | PASS |
| 注意力等级 | skim |
| 判断变化 | 不继承 stale review 的 FAIL；当前 `57cc195e...` hash 已直接关闭 package final-file、explicit verify config、matrix hardlink output 与 ambient credential locator blockers，建立新的 PASS 基线。 |
| 关键发现 | 1. setup install/verify/matrix 对完整 runtime/extension package prefix 的 external symlink 与 hardlink 全 fail closed；2. explicit verify 四个 owned roots 无 mutation，matrix hardlink identity被拒且 atomic output 保留 alias；3. child env 只含 allowlist，且真实 install两次、READY、8/8、11/11、59/59、72/72、7/7 与 frozen scope 全通过。 |
| 阻塞项 | 无。 |
| 残余风险 | 可信单 writer 边界外的并发 TOCTOU、package/crash非事务性、其他 OS / 恰好 Node 24与供应链审计未覆盖。 |
| 人类动作 | 知悉本轮网络 transport 事件与残余风险即可；无需风险接受、权限或方案决定。 |
| 自动下一步 | 交给新的只读 `review-change`，按当前实现 hash 独立重查交付判断。 |
| 完整证据 | `.legion/tasks/pi-distro-skeleton/docs/test-report.md` |
