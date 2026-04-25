# RFC: 加固 `verify --strict` 安装完整性校验

## 摘要 / 动机

当前 `scripts/setup-opencode.ts verify --strict` 只验证少量必需文件是否存在，不能证明安装内容仍等同于仓库源文件，也不能发现安装阶段因未管理文件冲突而 safe-skip 的必需资产。结果是：安装资产被截空或被本地漂移污染时仍可能输出 `READY`，削弱 `install -> verify --strict` 作为公开安装验收路径的可信度。

本 RFC 建议将 strict verify 从 presence check 升级为基于安装清单、源文件指纹、目标内容/链接形态与所有权状态的完整性检查；保持 copy/symlink 安装策略、rollback 成功路径和旧安装的可恢复性不变。

## 目标

- `verify --strict` 对所有必需安装资产执行内容完整性校验，而不是只检查文件存在。
- 能检测已管理文件被截空、修改、替换为错误类型、symlink 指向漂移等本地漂移。
- 能检测安装时因 unmanaged existing target safe-skip 而未被接管的必需资产。
- 输出稳定错误码和可执行修复提示，指向 `install --force`、重新安装或清理冲突文件。
- 保持正常 install + strict verify、force reinstall、rollback 后再 verify 的兼容性。

## 非目标

- 不调整 workflow 阶段语义、subagent dispatch matrix、benchmark harness、package publishing 或 README。
- 不改变安装资产集合的大范围定义；只围绕现有 `.opencode/agents`、可选 plugins、`INSTALLED_SKILLS` 与当前 required checks 设计。
- 不删除或覆盖用户文件；verify 只报告问题，修复仍由 install/force reinstall/用户手动处理。
- 不修复 npm pack 边界问题，也不引入新的发布时 manifest 产物。

## 定义

- **源资产（source asset）**：仓库内由安装脚本同步到目标目录的文件，例如 `.opencode/agents/**` 与 `skills/<skill>/**`。
- **目标资产（target asset）**：安装后位于 `--config-dir` 或 `--opencode-home` 下的文件或 symlink。
- **必需资产（required asset）**：strict verify 必须验证通过的目标资产；至少覆盖当前 `runVerify` 的 required checks，并应从同步清单推导完整列表。
- **managed manifest**：`<configDir>/.legionmind/managed-files.v1.json`，当前记录 targetPath/sourcePath/checksum/installedAt/lastAction。
- **source fingerprint**：安装时对源资产计算的期望指纹；copy 为 sha256，symlink 为 `symlink:<resolved source path>`。
- **unmanaged conflict**：目标路径存在，但 manifest 中没有对应 managed 记录，安装为避免覆盖用户文件执行 safe-skip。

## 当前行为证据与失败模式

证据来自 `scripts/setup-opencode.ts`：

- `runVerify` 维护固定 `checks` 列表，并在每个 check 中仅执行 `existsSync(check.target)`；存在即 `OK_VERIFY ... present`，缺失才在 strict 下计入 `E_VERIFY_STRICT`（约第 609-668 行）。
- install 已有 `sourceFingerprint` 与 `managed-files.v1.json` 记录能力；copy 使用 sha256，symlink 使用源路径指纹（约第 207-212、515-521 行），但 verify 没有读取或使用它。
- install 遇到 unmanaged existing target 时会 `W_SAFE_SKIP` 并保留用户文件（约第 433-481 行）；verify 只看目标是否存在，因此会把未被接管的同名文件误判为通过。

已知失败模式：

1. **内容损坏误报 READY**：截空已安装的 `legion-workflow/SKILL.md` 后，目标仍存在，strict verify 仍输出 `READY`。
2. **unmanaged conflict 误报 READY**：预先放置未管理的 `config/agents/legion.md` 导致 install safe-skip，strict verify 因文件存在仍输出 `READY`。
3. **symlink 漂移未发现**：symlink 安装后若链接被改到其他路径，只要目标路径存在即可通过。
4. **manifest 缺失语义不清**：旧安装或手工拷贝没有 manifest 时，strict verify 无法区分“可接受的 legacy 存在”与“未管理冲突”。

## 方案选项

### 方案 A：只扩大 required check 列表

做法：继续 presence check，但检查更多文件。

放弃原因：无法检测截空、内容漂移、symlink 指向漂移或 unmanaged conflict；只降低漏检概率，不解决完整性问题。

### 方案 B：verify 只按当前源文件 sha256 比对目标内容

做法：遍历源资产，计算源 sha256，与目标文件 sha256 比对。

优点：实现简单，能发现 copy 内容损坏。

放弃原因：不能正确表达 symlink 策略；无法判断目标是否由 installer 管理；对 safe-skip 的 unmanaged conflict 仍可能误报为“内容相同即可通过”，丢失所有权语义。

### 方案 C（推荐）：manifest + 当前源指纹 + 目标形态 + 所有权联合校验

做法：verify 复用 install 的同步资产枚举与 `sourceFingerprint` 规则，加载 managed manifest，对每个必需资产同时验证存在性、manifest ownership、目标内容/链接形态、源路径与指纹一致性。

选择原因：覆盖内容损坏、symlink 漂移、本地修改、safe-skip 未接管与旧 manifest 降级；与现有 install/rollback 状态模型一致，改动集中在 `scripts/setup-opencode.ts`。

## 推荐设计

### 端到端流程

1. **构建期望资产清单**：在 verify 内复用 install 的 source discovery：
   - `.opencode/agents` -> `<configDir>/agents`
   - `.opencode/plugins` -> `<configDir>/plugins`（仍可选；不存在源目录时不纳入必需）
   - `skills/<skill>` -> `<opencodeHome>/skills/<skill>`，skill 集合沿用 `INSTALLED_SKILLS`
2. **标记 strict 必需集合**：
   - `verify --strict` 对 `collectExpectedSyncItems(opts)` 枚举到的**全部同步源资产** hard-fail 校验，包括 agents、存在的 optional plugins、每个 `INSTALLED_SKILLS` 下的 `SKILL.md`、references 与 scripts。
   - 当前 `runVerify` 中的 required targets 继续保留为可读 checkId 分组和兼容输出锚点，但不再是 strict 的唯一校验集合。
   - 本任务不引入“只校验部分 required 子集”的第二档；若未来认为全量 strict 噪声过大，另开任务设计聚合/采样输出。
3. **加载 manifest**：读取 `<configDir>/.legionmind/managed-files.v1.json`，使用只读 loader 返回可区分状态：`ok | missing | invalid`。
   - `ok`：进入严格 ownership 校验。
   - `missing` / `invalid`：strict 先报 `E_VERIFY_MANIFEST`，不把空对象伪装成 manifest；非 strict 可继续作为 warning。
4. **逐项验证**：对每个 expected item 按 manifest 记录决定现有安装策略，并检查：
   - 源资产存在且可读；否则源侧 `E_VERIFY_SOURCE_MISSING`。
   - 目标存在；否则 `E_VERIFY_MISSING`。
   - strict 且 manifest 可用时，manifest 中存在 targetPath 记录；否则 `E_VERIFY_UNMANAGED`。
   - **策略判定顺序**：有 manifest 记录时只以 `manifest.checksum` 前缀判定现有安装形态：`symlink:` 前缀表示 symlink，其他 sha256 表示 copy；`verify --strict` 的 CLI `--strategy` 参数不参与证明现有安装。
   - copy 目标必须是 regular file，当前 sha256 必须等于当前源 sha256；若 manifest sourcePath 已过期但内容等于当前源，不单独失败，因为 strict 的通过标准是“当前目标等于当前源且 manifest 证明 target ownership”。
   - symlink 目标必须是 symlink，`resolvedLinkTarget(target)` 必须等于当前 expected sourcePath 的 resolved path；否则 `E_VERIFY_LINK_DRIFT` / `E_VERIFY_TYPE_MISMATCH`。
   - manifest checksum 与当前源期望不一致时同样报 drift：copy 使用 `E_VERIFY_CHECKSUM`，symlink 使用 `E_VERIFY_LINK_DRIFT`。
5. **汇总结果**：任一 `E_VERIFY_*` 在 strict 下导致最终 code 为 `E_VERIFY_STRICT` 且进程非零退出；无 hard failure 时保持 `READY`。

### 组件边界

- `collectExpectedSyncItems(opts)`：从现有 install discovery 抽出可复用函数，避免 verify 与 install 的资产列表分叉。
- `loadManagedStateForVerify(opts)`：封装 manifest 路径与 JSON 读取，返回 `{ kind: 'ok' | 'missing' | 'invalid', state?, path }`，不得沿用吞错 fallback。
- `verifyExpectedItem(item, opts, managedState, mode)`：返回结构化 result，Reporter 负责文本/json 输出。
- `runVerify`：保留 MCP optional check 与最终 `READY/E_VERIFY_STRICT` 汇总语义，只替换 strict 资产检查逻辑。

## 数据模型 / 接口

现有 `ManagedFile` 可继续使用：

- `targetPath`: 目标绝对路径，作为 manifest key 与定位信息。
- `sourcePath`: 安装时源文件路径；用于审计与诊断。copy 安装不因 sourcePath 单独漂移失败；symlink 安装通过链接目标是否等于当前 expected source 来验证。
- `checksum`: copy 策略下为源 sha256；symlink 策略下为 `symlink:<resolved source path>`。
- `lastAction`: install/update/rollback/uninstall；verify 不应修改它。

兼容策略：

- 不要求新增 manifest version；若需要记录 strategy，可通过 checksum 前缀推断 symlink，纯 hex sha256 推断 copy。
- verify 不写 manifest、不修复 manifest、不改变 install-state，除现有 `run()` 统一写入 verify 结果外保持只读。
- JSON 输出继续使用 `Reporter.emit` 的字段：`code/phase/checkId/target/hint`，新增错误码必须稳定且可被脚本消费。

## 错误语义与修复提示

建议错误码与 hint：

- `E_VERIFY_MISSING`：目标缺失。提示：`run setup-opencode install to restore missing asset`。
- `E_VERIFY_CHECKSUM`：copy 目标内容与源 sha256 不一致。提示：`local drift detected; run setup-opencode install --force to overwrite after reviewing local changes`。
- `E_VERIFY_LINK_DRIFT`：symlink 目标不指向 expected source。提示：`symlink target drifted; rerun install --strategy=symlink --force`。
- `E_VERIFY_TYPE_MISMATCH`：目标不是期望的 regular file/symlink。提示：`target type differs from managed install; remove or force reinstall after backup`。
- `E_VERIFY_UNMANAGED`：目标存在但 manifest 无记录。提示：`required asset is not managed; run install --force to back up unmanaged file and install Legion asset`。
- `E_VERIFY_MANIFEST`：strict 需要 manifest 但 manifest 缺失/不可解析，且无法安全证明所有权。提示：`run install to create managed-files.v1.json; use --force if conflicts are reported`。
- `E_VERIFY_SOURCE_MISSING`：仓库源资产缺失。提示：`repository install source is incomplete; reinstall package or run from complete checkout`。

可恢复性：verify 本身不修改文件；所有错误均可通过重新安装、force reinstall、清理冲突或恢复完整仓库来修复。非 strict verify 可继续降级为 warnings，以保持当前轻量健康检查用途。

## 安全考虑

- **权限与范围**：verify 只读取由 `--config-dir`、`--opencode-home` 与仓库源路径推导出的文件，不应遍历用户任意目录。rollback/uninstall 的 managed roots 防护不应放松。
- **输入校验**：manifest 中 targetPath/sourcePath 不能驱动 verify 访问任意路径；verify 的主循环应以当前 expected items 为准，只用 manifest 做佐证。
- **资源耗尽**：hash 文件时只处理同步资产集合，继续沿用 ignored sensitive/path filters，避免递归 `.git`、`node_modules` 或敏感文件。
- **TOCTOU**：verify 不是安全沙箱，只提供安装完整性信号；若读文件期间目标被并发修改，允许报告 drift 或在下一次 verify 重试。
- **敏感信息**：错误输出只包含路径与修复建议，不打印文件内容或 hash 全量差异。

## 兼容性、迁移与回滚

### copy vs symlink

- copy 安装：目标必须是 regular file，当前 sha256 必须等于当前源 sha256，并与 manifest checksum 一致或可由当前源重新计算验证。
- symlink 安装：目标必须是 symlink，`resolvedLinkTarget(target)` 必须等于 expected sourcePath 的 resolved path；不应追随链接后只 hash 内容，否则会漏掉链接漂移。
- 混合/历史状态：若 manifest checksum 是 `symlink:` 前缀但目标是 regular file，strict 报 `E_VERIFY_TYPE_MISMATCH`；反之亦然。

### legacy/no-manifest 安装

- 非 strict：保持尽量兼容，只将 manifest 缺失/损坏作为 warning，并继续执行轻量存在性检查。
- strict：manifest 缺失/损坏时不能证明 ownership；先报 `E_VERIFY_MANIFEST`，不继续把空 manifest 当成有效 ownership 依据。
- 迁移路径选择 **same-content adoption**：普通 `install` 遇到目标内容/链接已经等于源资产但 manifest 无记录时，不覆盖文件、不创建 backup，而是补写 managed manifest 记录并输出 `OK_ADOPT`。这让手工复制但内容正确的 legacy 安装可通过普通 install 迁移。
- 若目标内容不同或类型不匹配，普通 `install` 仍 safe-skip，strict 后续报 `E_VERIFY_UNMANAGED`；用户需审阅后运行 `install --force` 让 installer 备份并接管。

### rollback 路径

- rollback 恢复 `preManaged` 或删除 manifest 条目。strict verify 应忠实反映 rollback 后状态：
  - strict verify 的唯一通过标准是：目标等于**当前源**期望状态，且 manifest 证明该 target 由 installer 管理。
  - 若 rollback 恢复到旧 managed 资产但内容已不等于当前源，strict 报 `E_VERIFY_CHECKSUM` / `E_VERIFY_LINK_DRIFT`，提示重新 install。
  - 若 rollback 恢复到 unmanaged 用户文件并删除 managed 条目，则 strict 报 `E_VERIFY_UNMANAGED` / `E_VERIFY_MANIFEST`，而不是 READY。
- 本设计不改变 backup-index 或 rollback 行为；只确保 verify 对 rollback 结果给出真实完整性信号。

### 回滚本次代码变更

- 若新 strict verify 在真实用户环境中误报，可回滚 `scripts/setup-opencode.ts` 中 strict integrity 校验逻辑到 presence check；manifest 文件格式不变，无需数据迁移。
- 实施时应将新增逻辑集中在 helper 函数，便于 revert，不触碰 install/rollback 主流程语义。

## 验证计划 / 矩阵

所有验证使用临时 `--config-dir` 与 `--opencode-home`，避免污染真实用户环境。

| 场景 | 步骤 | 期望 |
| --- | --- | --- |
| 正常 copy install + strict verify | `install --strategy=copy` 后运行 `verify --strict` | 输出 `READY`，退出码 0，核心 assets 均 `OK_VERIFY` |
| 正常 symlink install + strict verify | `install --strategy=symlink` 后运行 `verify --strict` | 输出 `READY`，退出码 0，symlink target 指向源路径 |
| corrupted managed file | copy 安装后截空 `<opencodeHome>/skills/legion-workflow/SKILL.md`，运行 `verify --strict` | 非零退出，最终 `E_VERIFY_STRICT`，单项 `E_VERIFY_CHECKSUM`，hint 指向 `install --force` |
| symlink drift | symlink 安装后将某 required symlink 改到其他路径，运行 `verify --strict` | 非零退出，`E_VERIFY_LINK_DRIFT` 或 `E_VERIFY_TYPE_MISMATCH` |
| unmanaged conflict safe-skip | 预置未管理 `<configDir>/agents/legion.md`，运行 install（无 force）再 strict verify | install 报 `W_SAFE_SKIP`；verify 非零，`E_VERIFY_UNMANAGED`，hint 指向审阅后 `install --force` |
| missing manifest legacy | 手工复制 required 文件但无 `.legionmind/managed-files.v1.json`，运行 `verify --strict` | 非零退出，`E_VERIFY_MANIFEST`/`E_VERIFY_UNMANAGED`，提示运行 install 建 manifest |
| force reinstall repair | 在 corrupted/unmanaged 场景后运行 `install --force` 再 `verify --strict` | 重新通过，必要时 backup 被创建 |
| legacy same-content adoption | 手工复制与源内容相同的 required 文件但无 manifest，运行普通 `install` 再 `verify --strict` | install 输出 `OK_ADOPT` 或等价 adoption 记录；strict verify 通过 |
| manifest JSON 损坏 | 安装后破坏 managed-files JSON，运行 `verify --strict` | 非零退出，`E_VERIFY_MANIFEST`，hint 指向重新 install/force 修复 |
| rollback path | force 覆盖前创建 backup，执行 `rollback`，再运行 `verify --strict` | 只有恢复后目标仍等于当前源且 manifest 仍证明 ownership 时 READY；恢复 unmanaged 或旧内容时非零，不误报 READY |
| non-strict compatibility | 旧安装或缺文件运行 `verify`（无 strict） | 保持 warning/READY 风格，不把 warning 升级为进程失败 |

关键行为映射：内容损坏 -> checksum 测试；safe-skip -> unmanaged 测试；symlink 策略 -> link drift 测试；旧安装 -> manifest 降级测试；rollback -> managed state 恢复测试。

## 风险

- **误报旧安装**：strict 对 no-manifest 变严格会让旧用户第一次 verify 失败。缓解：hint 明确运行 install 迁移，并保持非 strict 兼容。
- **copy/symlink 指纹不一致**：若 install 与 verify 使用不同路径规范化，可能 false positive。缓解：抽出并复用 `sourceFingerprint`、`canonicalFilePath`、source discovery。
- **输出过多**：对所有同步资产校验可能产生大量错误行。缓解：每个失败 target 输出一行，最终汇总仍为单个 `E_VERIFY_STRICT`；后续可加 JSON 消费。
- **并发修改**：verify 期间文件变化可能导致不稳定结果。缓解：提示重试；不引入锁，避免改变安装工具复杂度。

## 落地计划

文件变更点：

- `scripts/setup-opencode.ts`
  - 抽取 install/verify 共用的 expected sync item 枚举函数。
  - 增加 managed state 加载与 manifest parse 状态区分。
  - 增加 same-content adoption：内容/链接已等于源但 manifest 缺记录时，install 补写 ownership 记录而不覆盖文件。
  - 增加 strict integrity verifier：存在性、ownership、source fingerprint、target type、checksum/link target。
  - 增加上述 `E_VERIFY_*` 错误码与 actionable hints。
  - 保留 MCP optional check、最终 `READY/E_VERIFY_STRICT` 与非 strict 兼容语义。
- `.legion/tasks/harden-strict-verify-integrity/docs/rfc.md`
  - 本 RFC，作为实现设计依据。

验证步骤：

1. 在临时目录运行 copy 正常安装与 `verify --strict`。
2. 在临时目录运行 symlink 正常安装与 `verify --strict`。
3. 截空 managed required file，确认 strict verify 非零且提示可修复。
4. 预置 unmanaged conflict，确认 install safe-skip 后 strict verify 非零。
5. 对 corrupted/unmanaged 场景运行 `install --force` 修复并再次 strict verify。
6. 覆盖 legacy same-content adoption 与 manifest JSON 损坏。
7. 覆盖 rollback 后 verify 的 managed/unmanaged 两种结果。
