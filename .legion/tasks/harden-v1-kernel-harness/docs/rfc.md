# RFC: harden v1 kernel harness surface

## 1. 状态与结论

- **任务**: `harden-v1-kernel-harness`
- **阶段**: spec-rfc / medium-risk design gate
- **结论**: 采用“共享 setup core + OpenCode/OpenClaw thin adapter + docs current-truth convergence + focused regression suite”的方案。
- **实现前置条件**: 本 RFC 通过 `review-rfc` 后再进入 `engineer`；本阶段不实现代码。

本次不是扩展 LegionMind 到更多运行时，而是把当前可运行内核硬化到 v1 前可审计状态：README 只承认 OpenCode 与 OpenClaw，安装脚本语义一致，旧 `docs/` 叙事退出，回归测试覆盖最容易漂移的 setup / skill surface / CLI 文件系统不变量。

## 2. Contract 摘要

来自 `plan.md` / `tasks.md` 的稳定约束：

- 删除过时 `docs/`，current truth 收敛到 `README.md`、`.legion/wiki/**`、`skills/**` 与 `vibe-harness-bench/README.md`。
- OpenClaw setup 与 OpenCode 对齐：rollback / uninstall / strict verify / managed manifest / shared core。
- 新增 regression suite，聚焦 setup automation、OpenCode/OpenClaw skill surface 一致性、Legion CLI 文件系统不变量，并提供 `package.json` 脚本入口。
- README 状态改为 `可运行内核 / v1 前硬化中`；移除 Claude / Codex / Cursor / Gemini 泛化叙事及多运行时暗示。
- 只支持 OpenCode 与 OpenClaw；不处理 repo hygiene / worktree cleanup；CLI 保持薄文件工具，不实现 runtime orchestrator。

## 3. 现状观察

### 3.1 文档面

- `README.md` 已包含较完整的 workflow / setup / verification 叙事，但状态仍为 `早期 / 内核成形中`，且“适用对象”仍点名 Claude / OpenCode / Codex / 多智能体，容易被解读为多运行时承诺。
- `README.md` 的“相关文档”仍引用 `docs/legionmind-usage.md`。
- 根目录 `docs/` 内有历史说明、旧 benchmark 说明和已被 wiki / skills 取代的设计材料：
  - `docs/benchmark.md` 已与当前 `vibe-harness-bench/README.md` 事实冲突。
  - `docs/legionmind-usage.md` 包含已过时的本地 PR / 重型模式叙事，和当前 `git-worktree-pr` lifecycle envelope 不一致。
  - `docs/skill-split-plan.md` 与 `docs/legion-context-management-raw-wiki-schema.md` 明确标注历史设计，不应继续作为 current truth 入口。
- `.legion/wiki/patterns.md` 已保存当前 durable patterns，适合承接 docs 删除后的导航与当前真源说明。

### 3.2 setup 面

- `scripts/setup-opencode.ts` 已支持 `install | verify | rollback | uninstall`，具备 managed manifest、backup index、strict verify、safe-skip、force overwrite、copy/symlink 策略。
- `scripts/setup-openclaw.ts` 当前只支持 `install | verify`，但已经具备 local skills root、managed manifest、backup index、strict verify、safe-skip、force overwrite、copy/symlink 和 `skills.load.extraDirs` 更新。
- 两个脚本存在大量相同逻辑：Reporter、manifest schema、backup schema、checksum/symlink fingerprint、atomic JSON、safe overwrite、strict verify、sync loop 等。继续复制会让 OpenCode/OpenClaw 行为再次漂移。

### 3.3 test 面

- 当前 `package.json` 只有安装与 verify 脚本，没有 regression 入口。
- 最需要锁住的是：安装脚本生命周期不变量、OpenCode/OpenClaw skill surface 一致性、Legion CLI 文件系统不变量；不需要端到端 agent 执行或真实用户 home 目录测试。

## 4. 设计目标

1. **文档真源单一化**: 根 `docs/` 不再承载当前产品真相；README 负责产品入口，wiki 负责 durable 当前知识，skills 负责 workflow 真源，benchmark README 负责 benchmark 使用说明。
2. **setup lifecycle parity**: OpenClaw 与 OpenCode 在用户可见命令、退出码、manifest / backup 语义、strict verify 失败模型上对齐。
3. **共享核心优先**: 抽出可复用 setup core，避免把 OpenClaw parity 写成第二份复制脚本。
4. **测试聚焦不变量**: regression suite 只覆盖可在临时目录内稳定复现的行为，不依赖真实 OpenCode/OpenClaw 安装、不写 repo 外持久状态。
5. **运行时边界收紧**: README 只描述 OpenCode 与 OpenClaw；不承诺 Claude / Codex / Cursor / Gemini 或通用 runtime matrix。

## 5. 非目标

- 不实现 runtime orchestrator、状态注册表、agent runtime adapter 层或跨运行时抽象。
- 不引入除 Node.js 与现有 Python benchmark 之外的新运行时要求。
- 不测试真实 `~/.config/opencode`、`~/.opencode`、`~/.openclaw`。
- 不清理本任务 worktree 以外的 repo hygiene / 旧 worktree / superpowers 等事项。
- 不把 VibeHarnessBench 升级为 npm regression harness；本次只更新其 README current-truth 文案（如需要）。
- 不保留根 `docs/` 作为历史归档入口；历史材料已经由 git history 与 task docs 承载。

## 6. 方案比较

### A. 继续复制 OpenCode setup 逻辑到 OpenClaw

- 优点：局部改动最少，短期快。
- 缺点：重复逻辑巨大，后续 strict verify / rollback bug fix 必须双写；最容易违反本任务“shared core”要求。
- 结论：拒绝。

### B. 抽出 shared setup core，两个 runtime adapter 只声明路径与资产枚举

- 优点：生命周期语义统一；OpenClaw parity 可复用 OpenCode 已成熟逻辑；regression suite 能直接覆盖 core 不变量。
- 缺点：中等重构风险，需要谨慎保持 OpenCode 现有行为。
- 结论：采用。

### C. 引入 runtime orchestrator / plugin registry

- 优点：未来可承载更多 runtime。
- 缺点：超出 contract，会重新引入多运行时泛化叙事；CLI 薄层边界被破坏。
- 结论：拒绝，仅在 README/维护债务中可保留“未来若需要，单独设计 runtime orchestrator”的短注，不实现。

## 7. 目标架构

### 7.1 文件边界

建议实现落点：

```text
scripts/
  setup-opencode.ts          # OpenCode thin adapter / CLI entry
  setup-openclaw.ts          # OpenClaw thin adapter / CLI entry
  lib/
    setup-core.ts            # shared install/verify/rollback/uninstall primitives
    regression/              # optional: shared test helpers for temp dirs / subprocesses
tests/
  regression/
    setup-opencode.test.ts
    setup-openclaw.test.ts
    skill-surface.test.ts
    legion-cli.test.ts
```

若项目不想引入 test runner 依赖，可用 Node built-in `node:test` + `node:assert/strict`，通过 `node --test --experimental-strip-types tests/regression/*.test.ts` 执行。这样符合 Node `>=22.6.0` 约束，不新增外部依赖。

### 7.2 shared setup core 职责

`setup-core.ts` 应承载纯通用安装语义：

- 类型：`Command = install | verify | rollback | uninstall`，`Strategy = copy | symlink`。
- managed state：`managed-files.v1.json`、`backup-index.v1.json`、`install-state.v1.json` 的读写、schema 校验与 atomic write。
- 文件枚举：由 adapter 提供 `SyncItem[]` 与 source-missing 检查；core 不硬编码 OpenCode/OpenClaw 路径。
- 安全边界：canonical path、managed root 检查、sensitive filename ignore、safe-skip、`--force` backup overwrite。
- lifecycle：install sync、strict verify、rollback latest / `--to <backupId>`、uninstall managed files。
- reporting：统一 `Reporter` payload、warning/failure 计数、JSON 与 text 输出。

Core 不应知道 OpenClaw `openclaw.json` 结构，也不应知道 OpenCode `.opencode/agents` 含义；这些由 adapter 声明。

### 7.3 adapter 职责

OpenCode adapter：

- 保留当前 CLI flags：`--config-dir`、`--opencode-home`、`--strategy`、`--strict`、`--dry-run`、`--force`、`--json`、`--to`。
- 声明 managed roots：`configDir/agents`、`configDir/plugins`、`opencodeHome/skills/<installed-skill>`。
- 声明 sync source：`.opencode/agents`、可选 `.opencode/plugins`、固定 `INSTALLED_SKILLS`。
- 保留 MCP optional verify warning，不让 MCP 变成 required path。

OpenClaw adapter：

- 扩展命令为 `install | verify | rollback | uninstall`。
- 保留 flags：`--config-dir`、`--openclaw-home`、`--skills-dir`、`--no-extra-dir`、`--strategy`、`--strict`、`--dry-run`、`--force`、`--json`，新增 `--to` 用于 rollback parity。
- 声明 managed root：`openclawHome/skills`，manifest 位于 `openclawHome/.legionmind`。
- 声明 sync source：动态发现 `skills/<name>/SKILL.md` 的 skill 目录。
- 保留 OpenClaw 专有配置步骤：默认把 source skills dir 写入 `configDir/openclaw.json` 的 `skills.load.extraDirs`；`--no-extra-dir` 跳过。

### 7.4 OpenClaw rollback / uninstall 细节

OpenClaw 文件资产 rollback/uninstall 应与 OpenCode 一致：

- rollback 只处理 backup index 中记录的 target，并验证 target 仍在 managed roots 内。
- rollback 后恢复 `preManaged` 或删除 manifest entry；移除已消费 backup batch。
- uninstall 遍历 manifest 中 managed files；默认只删除未 drift 的 managed copy/symlink；本地修改或非文件目标 safe-skip，`--force` 才删除。
- `install-state.v1.json` 记录 command 与 summary。

OpenClaw `openclaw.json` 的回滚策略应保持保守：

- 本次不把用户整个 `openclaw.json` 纳入 managed file manifest，避免误删用户配置。
- install 只在缺失时追加 `skills.load.extraDirs`，不重排或覆盖其他字段。
- uninstall 默认不移除 `extraDirs` 项，除非实现时增加明确 `--remove-extra-dir` 且 regression 覆盖；当前建议不加该 flag，避免扩大范围。
- verify 在 `--no-extra-dir` 时跳过 config 检查；否则缺失或未配置继续按当前行为给 warning，不作为 strict hard failure，防止 local skills root 已可用时被 config 兼容项阻塞。

## 8. README / docs / wiki convergence

### 8.1 删除根 `docs/`

删除：

- `docs/benchmark.md`
- `docs/legionmind-usage.md`
- `docs/skill-split-plan.md`
- `docs/legion-context-management-raw-wiki-schema.md`

删除后不保留 README 指向 `docs/` 的 current link。历史设计引用如必须出现，应指向 `.legion/tasks/**` 或 wiki summary，不指向根 `docs/`。

### 8.2 README 必改点

- 状态改为：`当前状态：可运行内核 / v1 前硬化中`。
- 快速开始明确：当前维护 OpenCode 与 OpenClaw 两条入口；其它运行时不在当前支持面。
- OpenClaw 小节增加 rollback / uninstall parity：`npm run openclaw:rollback`、`npm run openclaw:uninstall`。
- 常用脚本增加 regression：例如 `npm run test:regression`。
- “适用对象”移除 Claude / Codex / Cursor / Gemini / 泛化多智能体运行时表达，改成“已经使用 OpenCode 或 OpenClaw 承载工程代理工作流的人”。
- “相关文档”改为 README / wiki / skills / benchmark README 四个 current truth 入口，不再引用 `docs/legionmind-usage.md`。
- 若保留未来方向，只写成维护债务：未来 runtime orchestrator 需要独立 contract / RFC，不属于当前 v1 hardening。

### 8.3 wiki / skills / benchmark README

- `.legion/wiki/index.md` / `patterns.md` 在 closing writeback 阶段更新：记录 docs 删除后的 current truth 入口、OpenClaw parity 与 regression suite pattern。
- `skills/**` 仅在发现与 README/current truth 冲突时做最小同步；workflow 真源仍以 `skills/legion-workflow/SKILL.md` 与 dispatch matrix 为主。
- `vibe-harness-bench/README.md` 保持 benchmark v0.1 的当前使用说明，可追加一句说明它是 benchmark current truth，不再由根 `docs/benchmark.md` 代理。

## 9. Regression suite 设计

### 9.1 测试原则

- 使用 `node:test` 与临时目录，禁止写真实 home。
- 子进程执行 setup 脚本时显式传入 `--config-dir`、`--opencode-home`、`--openclaw-home`、`--skills-dir`。
- 每个测试只断言持久不变量，不断言易变日志全文。
- JSON 输出测试优先断言最终 state file 和 exit code。

### 9.2 setup automation 覆盖

OpenCode：

- isolated install 后 `verify --strict` 返回 `READY`。
- idempotent reinstall 不产生 hard failure。
- checksum drift 后 strict verify 失败；`install --force` repair 后恢复 READY。
- unmanaged conflict 默认 safe-skip 并导致 strict verify 失败；`--force` 创建 backup。
- rollback 恢复最近 backup，manifest 回到 preManaged 或删除 entry。
- uninstall 删除 managed files，drift 时 safe-skip，`--force` 可删除。

OpenClaw：

- isolated install 写入 `openclawHome/skills/<skill>/...` 与 manifest。
- strict verify 校验 managed ownership / checksum / symlink drift。
- `--no-extra-dir` install/verify 不要求 config extraDirs。
- rollback / uninstall 与 OpenCode 行为对齐。
- `openclaw.json` 已存在用户字段时，install 只追加 extraDirs，不破坏其它字段。

### 9.3 skill surface 一致性覆盖

- OpenCode `INSTALLED_SKILLS` 中的每个 skill 都存在 `skills/<name>/SKILL.md`。
- OpenClaw 动态发现的 skill surface 至少包含 OpenCode 固定列表；如 OpenClaw 安装全部 skills，测试应明确这是超集关系，不要求二者 manifest 文件数完全相同。
- 必要阶段 skills 存在：`brainstorm`、`legion-workflow`、`git-worktree-pr`、`spec-rfc`、`review-rfc`、`engineer`、`verify-change`、`review-change`、`report-walkthrough`、`legion-wiki`、`legion-docs`。

### 9.4 CLI 文件系统不变量覆盖

聚焦 `skills/legion-workflow/scripts/legion.ts` 薄 CLI：

- `init` 只保证 `.legion/tasks/` 存在，不要求预建 wiki skeleton。
- `task create --json ...` 成功后任务目录完整包含 `plan.md`、`log.md`、`tasks.md`、`docs/`。
- 成功路径后 `.legion/tasks/` 下无 `.tmp-*` staging 残留。
- `status --task-id <id> --format json` 与 `task list --format json` 可读刚创建任务。
- 不测试 workflow phase decision；CLI 不拥有阶段真源。

### 9.5 package scripts

建议新增：

```json
{
  "openclaw:rollback": "node --experimental-strip-types scripts/setup-openclaw.ts rollback",
  "openclaw:uninstall": "node --experimental-strip-types scripts/setup-openclaw.ts uninstall",
  "test:regression": "node --test --experimental-strip-types tests/regression/*.test.ts"
}
```

可选拆分：`test:setup`、`test:cli`，但 `test:regression` 必须存在作为验收入口。

## 10. Verification plan

实现阶段完成后，`verify-change` 至少记录：

1. `npm run test:regression`
2. isolated OpenCode lifecycle smoke：install -> verify --strict -> rollback/uninstall（可由 regression 覆盖时说明覆盖路径）
3. isolated OpenClaw lifecycle smoke：install -> verify --strict -> rollback -> uninstall（可由 regression 覆盖时说明覆盖路径）
4. README/docs reference check：确认 README 不再引用 `docs/`，根 `docs/` 已删除。
5. CLI invariant check：如未被 regression 单独覆盖，手动执行 `init -> task create -> status -> task list`。

若环境限制导致某项无法执行，必须在 `test-report.md` 中记录命令、失败原因、替代证据和是否阻塞。

## 11. Rollback plan

- 代码层：如果 shared core 重构导致 OpenCode 行为回退，优先回退 `scripts/lib/setup-core.ts` 与两个 adapter 到上一提交；OpenClaw parity 可拆小 PR 重做。
- 文档层：README / wiki 文案可直接 git revert；根 `docs/` 删除可通过 git 恢复，但默认不建议恢复为 current truth。
- 测试层：若 regression suite 有环境敏感误报，先标记具体 flaky test 并收窄断言，不移除 setup lifecycle 核心覆盖。
- 用户安装层：由于 regression 使用隔离目录，不应影响真实用户 home；真实安装脚本仍提供 rollback/uninstall 作为最终用户恢复路径。

## 12. 实施顺序建议

1. 抽取 `scripts/lib/setup-core.ts`，保持 OpenCode 行为等价。
2. 将 OpenClaw adapter 接入 shared core，并补齐 rollback / uninstall / `--to`。
3. 增加 regression suite 与 package scripts，先覆盖 OpenCode 等价，再覆盖 OpenClaw parity。
4. 删除根 `docs/` 并更新 README / `vibe-harness-bench/README.md`。
5. 最后进行 wiki closing writeback（由后续 `legion-wiki` 阶段完成）。

## 13. Review-rfc 关注点

- OpenClaw `openclaw.json` 是否应纳入 rollback/uninstall？本 RFC 建议不纳入，只做追加兼容项，避免误删用户配置。
- OpenClaw 动态安装全部 skills 与 OpenCode 固定 skill 列表是否接受为“surface 超集”？本 RFC 建议接受，并用测试锁定 OpenCode 固定列表是 OpenClaw 子集。
- Regression suite 是否允许只使用 Node built-in `node:test`？本 RFC 建议允许，以避免新增依赖。
- README 删除多运行时叙事后，是否还需要一句未来 runtime orchestrator note？本 RFC 允许短注，但禁止实现或承诺支持矩阵。

## 14. Blockers

当前未发现会阻塞进入 `review-rfc` 的 contract 漂移。需要 review 裁决的只有第 13 节设计取舍。
