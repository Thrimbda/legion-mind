# What

- 加固 `scripts/setup-opencode.ts verify --strict`，从“只看文件存在”升级为基于 expected sync item、manifest ownership、checksum/type/symlink target 的完整性校验。
- 增加 manifest `ok/missing/invalid` 加载语义、非法 managed record 校验、same-content adoption、unmanaged conflict/type drift/link drift 检测。
- 本任务拥有的生产代码变更仅为 `scripts/setup-opencode.ts`；当前 worktree 中若有其他生产代码差异，属于预先存在的无关变更。

# Why

- 旧 strict verify 会把截空资产、未管理冲突或 rollback 后漂移误报为 `READY`。
- 这会削弱 `install -> verify --strict` 作为安装验收路径的可信度。
- 新行为让 strict verify 能真实反映安装资产是否仍由 installer 管理且等同于当前源资产。

# How

- verify 复用 install 的资产枚举，对所有期望同步资产执行 strict integrity check。
- copy 校验 regular file 与 sha256；symlink 校验链接类型和 resolved source target；manifest 缺失/非法或无 ownership 时在 strict 下失败。
- 普通 install 对 same-content legacy 资产补写 ownership；`install --force` 继续作为 corrupted/unmanaged/type drift 的修复路径。

# Testing

- PASS：见 [`docs/test-report.md`](./test-report.md)。
- 覆盖 8 个隔离场景：copy 正常路径、内容损坏、unmanaged safe-skip、same-content adoption、invalid manifest、symlink/type drift + force repair、rollback 后不误报 READY、JSON-valid 但 record 非法的 manifest。
- 代码审查 PASS：见 [`docs/review-change.md`](./review-change.md)，无阻塞问题。

# Risk / Rollback

- 风险：strict 对 legacy/no-manifest 安装更严格，首次 strict verify 可能要求用户重新 install 或 `--force` 修复。
- 缓解：非 strict verify 保持兼容 warning 风格；same-content adoption 提供无覆盖迁移路径；错误 hint 指向具体修复命令。
- 回滚：可回滚 `scripts/setup-opencode.ts` 中 strict integrity 校验逻辑；manifest 格式未变，无需数据迁移。

# Links

- Plan: [`../plan.md`](../plan.md)
- RFC: [`docs/rfc.md`](./rfc.md)
- Test report: [`docs/test-report.md`](./test-report.md)
- Review: [`docs/review-change.md`](./review-change.md)
- Walkthrough: [`docs/report-walkthrough.md`](./report-walkthrough.md)
