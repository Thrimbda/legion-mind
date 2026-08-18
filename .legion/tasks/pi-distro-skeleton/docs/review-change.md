# 0XC-293 Legion Pi distribution skeleton 当前实现独立审查

## Findings

### Blocking findings

无。未发现可在批准的 0XC-293 合同、Linux Node `>=24` 验证面与可信单用户、单 writer profile 边界内复现的 correctness、maintainability、scope 或 security 缺陷。

### Non-blocking observations

- `.legion/tasks/pi-distro-skeleton/tasks.md` 与 `log.md` 仍是初始化状态；这是后续 orchestrator 的 lifecycle writeback，不反驳当前 implementation，也不构成本阶段 blocker。
- 当前结论不扩张到恶意并发 writer、其他 OS/runtime、跨进程事务式 package acquisition、credentialed provider prompt、供应链签名或未来增强；这些均是已知残余或后续任务，不是 0XC-293 当前合同缺口。

## 审查身份与快照

- **Reviewer**: `review-change-clever-panda`
- **Agent type**: `review-change`
- **审查日期**: 2026-08-18
- **工作树**: `/home/c1/Work/legion-mind/.worktrees/pi-distro-skeleton`
- **分支**: `legion/pi-distro-skeleton-legion-pi`
- **基线 HEAD**: `12f60baf69a39c8c20b825d1dc0019c91ffb80c6`
- **当前实现快照**: 17 个 implementation files，聚合 SHA-256 `57cc195ed2bad11cf10ac593247790b1c5cd770916296e75a602aac3753f3c14`
- **被审 test report**: `.legion/tasks/pi-distro-skeleton/docs/test-report.md`，SHA-256 `1c6a28bd7a85f2aad70be25807154451d0ceca3c7a0a2c9cb0a9310a6fe3ff54`，Verdict `PASS`
- **被替换 stale review**: SHA-256 `b5264e076972a4a2c2b6ab85838f957e511fbe392c97dacc7135a3d4609e4079`；其 `29c04526...` Verdict 不作为当前证据

## Contract 与 frozen scope

本轮按 `plan.md -> design RFC/research -> log.md -> tasks.md` 恢复合同，并直接重读 Linear `0XC-293`、空 comments 与北极星 document `35b1df5a-f092-419c-a1bc-a4252d92e353`。Linear issue 仍为 `contract:stable`，updated `2026-08-17T07:39:42.417Z`；其验收与 plan 一致：四包 exact pins、单一用户配置、install/verify/rollback、真实 8-combination matrix、隔离复现及 frozen scope。

Git 机械重查仍是 23 个 changed paths：4 tracked、19 untracked、0 cached；其中 17 个 implementation paths、6 个 task evidence paths。`git diff --check` 无输出。实现没有触碰 `.opencode/**`、`skills/**`、`scheduler/**`、`pi-web/**`、`opencode.json` 或 `.github/workflows/opencode.yml`；OpenCode 冻结线、skills 内容、scheduler worker 与 pi-web 集成边界保持不变。

实现路径全部落在批准范围：`legion-pi/` 资产、独立 `setup-pi`/matrix/runtime JS 入口、最小 package/build allowlist、README 和回归测试。未发现顺手扩张 runtime router、Web、FRP、Legion role glue、pi-goal 或 browser/computer-use。

## 关键实现重查

| 审查面 | 独立结论 | 关键定位与重算证据 |
|---|---|---|
| 共享 package validator | PASS | `scripts/lib/pi-distro.ts:125-232` 对完整 runtime/extension prefix 递归拒绝 broken/external symlink 与 `nlink != 1` 文件，并绑定 exact manifest、runtime entrypoint、Pi bin 与三个 reviewed extension entrypoints。`scripts/setup-pi.ts:404-461` 在 package 操作前检查既有 prefix、每次安装后验证目标并最终全量验证；matrix 在 `scripts/verify-pi-startup-matrix.ts:259` 复用同一 validator。fresh E1 重放中 runtime/extension external symlink 与 hardlink 在 install/verify/matrix 均 status 1，package command 未执行，victim/output 未变。 |
| Explicit verify config guard | PASS | `scripts/setup-pi.ts:652-679` 在读取 active config、验证 manifest/probe及最终写 `install-state` 前，对 explicit config 复用 `assertInstallConfigOutsideOwnedRoots()`。fresh E1 的 `runtime/agent/sessions/.legionmind/install-state` 四例均 status 1 且完整 profile/config 不变；五个 canonical-outside linked config 也在 package command 前拒绝。 |
| Matrix identity 与 atomic output | PASS | `scripts/verify-pi-startup-matrix.ts:112-153` 先检查 config/output `dev+ino`，再以同目录 random `wx` temp + `rename` 替换 output。fresh E2 中 config/output hardlink 与 output symlink 均 status 1且原内容保留；正向 atomic control 为 8 PASS，旧 hardlink alias 保留、output inode 被替换。 |
| Minimal probe child environment | PASS | `scripts/lib/pi-distro.ts:99-115` 从固定 allowlist 构造 child env；setup 在 `scripts/setup-pi.ts:464-500`、matrix 在 `scripts/verify-pi-startup-matrix.ts:292-315` 使用。fresh E1 的 1 个 setup capture 与 E2 的 8 个 matrix captures 均无标准 credential locator、credential helper、`NODE_OPTIONS`/`NODE_PATH` 等 injection variable，也无 allowlist 外名称。 |
| Rollback/data preservation | PASS | `scripts/setup-pi.ts:717-870` 先完整 preflight target、backup 与 drift；默认 drift fail closed，`--force` 先建 recovery batch，missing backup 不消费原 batch。fresh E1 重放确认 default target/index 保留、force 恢复 pre-backup 内容并保存 post-backup drift、missing backup 非零且 target/index/batch 全保留。 |
| Exact pins、单配置与 8-row matrix | PASS | `legion-pi/legion-pi.json` 仅含 schema/review date、四个 exact specs 与 skills；renderer 生成 active/settings/subagent 三份 managed artifacts。四次 registry 直查仍返回 selected=latest、name/version 精确、MIT；当前 pin 为 Pi `0.84.2`、subagents `0.50.0`、MCP adapter `2.26.0`、lens `4.0.1`。test report 的 fresh real install 两次、strict `READY` 与真实 matrix 8/8 raw evidence可重开；fresh E2 synthetic matrix也为 8/8。 |
| Pack 与 runtime JS | PASS | reviewer 直接执行 `npm pack --dry-run --json --ignore-scripts` 得 `lgmind@0.5.0`、72 files、required Pi assets全在、runtime TS/`.legion`/tests/cache全不在。按 `scripts/build-runtime-js.mjs` 规则内存重算 7 对 TS/JS，全部 byte-exact；Pi 三个 runtime JS hashes与 test report 一致。 |
| Maintainability | PASS | package identity/path/env 语义集中在 `scripts/lib/pi-distro.ts`，setup 与 matrix 共用；runtime JS由现有单一 builder派生；新增发布面和测试面均为合同直接所需。未发现必须在交付前拆分的重复状态机、隐式兼容层或不可维护分叉。 |

## Claim 重新聚合

Reviewer 未继承 test report 的 Verdict，而是重查其预注册字段、blocking policy、raw locator 与当前实现后重新聚合：

| claim-id | 独立状态 | 依据 |
|---|---|---|
| C1-config | PASS | schema v1、四个 exact pins、唯一 source 与三 renderer 均有正反例和 registry evidence |
| C2-lifecycle | PASS | fresh real install/reinstall、strict `READY`、mandatory probe 与 persistent lifecycle tests |
| C3-path-package-safety | PASS | setup/verify/matrix 共享完整 prefix 门；owned-root config、symlink/hardlink、managed target 与 temp negatives fail closed |
| C4-rollback | PASS | default drift preservation、force recovery 与 missing-backup retention均直接重放 |
| C5-matrix | PASS | active config、exact/canonical packages、process status、tools、identity/overlap与 atomic output全部绑定；8/8正向控制成立 |
| C6-probe-boundary | PASS | setup/matrix child env只含 allowlist；core/extension required tools、duplicate tools与 child nonzero均 fail closed |
| C7-package-regression | PASS | reviewer 11/11 targeted、72-file pack、7/7 runtime exact；verifier full 59/59 raw log可重开 |
| C8-scope | PASS | 17-file implementation allowlist、0 cached、frozen guard、diff hygiene与最终 hash一致 |

所有 `block-stage` objective/formal claims 均为 PASS；无核心 `INCONCLUSIVE`、`FAIL`、`DEFERRED` 或 `RECOMMENDATION`。Verifier 没有缩小合同领域、降低 criticality、替换 required method 或用多数通过掩盖反例。

## 验证充分性

证据充分，可支持当前 hash 的交付判断：

- Test report 完整记录 contract/design/protocol locators、C1-C8 预注册、E0-E7 命令/参数/结果、raw locator、主动 negatives、独立性、置信度与失效条件；报告 SHA-256 与当前文件一致。
- Reviewer 直接重算 17-file aggregate hash 为 `57cc195e...`，重开 E0-E7 raw summaries、real install logs/TAP/full regression/pack/scope evidence，并 fresh 重放 E1 setup negatives、E2 matrix negatives和 targeted tests。fresh targeted 结果为 11/11，关键 blocker family 的状态、victim bytes、inode/alias 与 environment-name captures均与 test report一致。
- Reviewer 另行直查四个 npm exact metadata，执行 ignore-scripts 72-file pack，并以内存 builder重算 7/7 runtime JS；这些检查未修改 implementation。`git status` 与 `git diff --check` 在重算后保持预期。
- Fresh real package acquisition没有由 reviewer重复制造第二份网络证据；当前 verifier 的全新 root、显式 21-key非凭证父环境、两次 install、strict verify、真实 8/8、canonical/single-link postcheck及原始日志均可读且绑定同一 implementation hash。结合 reviewer 的静态重查、fresh安全负例与 synthetic正向控制，证据不存在核心缺口。

## Provenance / Authority

- C1-C8 都是 routine objective/formal engineering claims；无需 domain verifier。Reviewer 名称、实现作者自述、stale review 或 test report 的 PASS 本身均未被当作证明。
- Linear issue、comments 与北极星 document由本 reviewer直接读取；首次并行读取遇到 certificate error，随后逐项重试成功。当前判断只使用成功响应。npm registry metadata也由本 reviewer直接查询。
- 原始机器证据位于 `.cache/pi-distro-skeleton/verifier-glowing-lynx-57cc195e/`；reviewer fresh重放输出位于 `.cache/pi-review-clever-panda/`。关键结果已内嵌本报告，gitignored cache不是唯一 Verdict载体。
- 本任务没有法律、合规、审计签署或资质 authority claim。Registry metadata是 package name/version/license 的直接来源，不是 authority sign-off；未宣称 signature、maintainer identity、tarball attestation、漏洞扫描或法律许可证意见已完成。

## 安全视角

**已展开。** `--profile-dir`、`--config`、`--output`、package roots、rollback state、child environment 与第三方 runtime/extension loading跨越文件 mutation和 execution trust boundary。

当前合同边界内的适用控制通过：

- Profile/owned roots与 managed targets有 lexical/canonical和 symlink控制；完整 package prefixes、entrypoints与 Pi bin另有 hardlink/单 inode约束。setup、verify与 matrix对同一 package safety语义共用 validator。
- Explicit verify在任何 state mutation前拒绝 installer-owned config；matrix拒绝 config/output同 inode，并用 exclusive same-parent temp + rename避免原地截断 alias。
- Probe children不从 ambient environment做 denylist复制，而是使用最小 allowlist；required tools、duplicate names、loader errors、loaded-root redirect和 child最终 status全部 fail closed。
- Rollback mutation前验证完整 batch，默认保留 drift，force先保存 recovery；四包以 argv exact spec安装，npm lifecycle scripts禁用。

残余风险不改变 Verdict：

- Static precheck不防恶意并发 writer在 check 与 write/rename/rm之间实施 TOCTOU；批准的 profile边界是可信单用户、单 writer。
- npm/Pi package acquisition、rollback reconciliation、断电与进程 crash不是跨进程事务；失败会非零并允许 fresh root或同 profile治理，但不承诺事务回滚。
- 其他 Linux、macOS、Windows、恰好 Node 24、credentialed provider/model prompt、供应链签名/漏洞/法律审计均未覆盖，也未被当前合同要求。
- `PATH` 内程序本身、未来 package/loader/config变化与未来 Web/FRP/role glue仍需各自任务和新 hash验证。

## Verdict
PASS

## 会话注意力摘要

| 字段 | 内容 |
|---|---|
| 阶段 | review-change |
| 阶段结论 | PASS |
| 注意力等级 | skim |
| 判断变化 | 不继承 stale `29c04526...` FAIL；独立重查确认当前 `57cc195e...` 已关闭旧 package final-file、explicit verify config、matrix hardlink output与 ambient credential locator blocker。 |
| 关键发现 | 1. setup/verify/matrix共用完整 package prefix validator且关键 symlink/hardlink负例全 fail closed；2. explicit verify mutation guard、matrix inode门与 atomic output直接通过；3. exact pins、真实 8/8、11/11、59/59、72-file pack、7/7 runtime JS与 frozen scope均有充分证据。 |
| 阻塞项 | 无。 |
| 残余风险 | 可信 single-writer边界外的并发 TOCTOU、非事务 package/crash、其他 OS/runtime、credentialed prompt与供应链审计未覆盖。 |
| 人类动作 | 知悉即可；无需风险接受、权限或方案决定。 |
| 自动下一步 | 交回 `legion-workflow` 进入 `report-walkthrough`；orchestrator在 lifecycle完成声明前同步 task/log状态。 |
| 完整证据 | `.legion/tasks/pi-distro-skeleton/docs/review-change.md` |
