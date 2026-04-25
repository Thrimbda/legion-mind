# RFC 审查报告

## 结论

PASS

修订后的 RFC 已关闭上一轮 FAIL 的关键空洞：strict 范围明确为 `collectExpectedSyncItems(opts)` 的完整期望同步清单；现有安装策略以 `manifest.checksum` 前缀判定而不是依赖 `--strategy`；legacy 迁移选择 same-content adoption；rollback 后 strict 通过标准收敛为“当前源等价 + manifest ownership”；manifest loader 也明确区分 `ok/missing/invalid`。整体设计可实现、可验证、可回滚，复杂度基本集中在 `scripts/setup-opencode.ts` 的 helper 抽取与 strict verifier 内。

## 阻塞问题

- 无。

## 非阻塞建议

- **收紧 copy 通过条件的文字一致性。**正文第 90、92 行已经说明 copy 目标 sha256 与 manifest checksum 都要匹配当前源；第 143 行“并与 manifest checksum 一致或可由当前源重新计算验证”略有“二选一”歧义。建议实现时按更严格且更简单的规则执行：`target sha256 == current source sha256` 且 `manifest.checksum == current source sha256`，否则报 `E_VERIFY_CHECKSUM`。
- **全量 strict 输出可能偏多，但不应阻塞实现。**RFC 已明确本任务不引入第二档校验；实现时保持每个失败 target 一行 + 最终 `E_VERIFY_STRICT` 汇总即可，避免先做复杂聚合。
- **same-content adoption 只做 ownership 补记，不做修复器。**实现时不要借 adoption 顺手修正内容、重写 symlink 或创建 backup；内容/链接已等价才补 manifest，否则保持 safe-skip/force 路径。
- **manifest invalid 的修复提示保持保守。**JSON 损坏时不要尝试自动修复或部分读取；strict 直接报 `E_VERIFY_MANIFEST`，提示重新 install/force，更符合最小复杂度。

## 修复指导

实现可直接按 RFC 落地，注意保持以下最小化边界：

1. `collectExpectedSyncItems(opts)` 只负责枚举当前安装会同步的源资产与目标路径，不复制 install 的覆盖/backup 决策。
2. strict verifier 的主循环只以 expected items 驱动；manifest 只能按 expected target 做 ownership 佐证，不能驱动额外文件遍历。
3. `verify --strict` 不写 manifest、不修复目标、不根据 CLI `--strategy` 推断既有安装形态。
4. 普通 `install` 的 same-content adoption 是本 RFC 唯一允许的迁移写入：仅当目标内容/链接已等于源时补写 managed 记录。
5. 回滚本次代码变更可通过 revert strict integrity helper 回到 presence check；manifest 格式不变，无需数据迁移。

## Heavy RFC 检查

本任务未声明 `rfcProfile=heavy`，内容也属于单文件脚本加固的中等风险变更；本次按 standard RFC 审查，未强制执行 heavy checklist。
