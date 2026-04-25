# 变更审查：harden-strict-verify-integrity

## 结论

PASS。

复审确认 follow-up 修复已补齐先前阻塞点：`loadManagedStateForVerify` 会在返回 `ok` 前校验每条 managed file record 的必需字段与类型，非法 `checksum` 等字段现在稳定降级为 `E_VERIFY_MANIFEST`，最终输出 `E_VERIFY_STRICT`，不会触发未捕获 `TypeError`。

## 阻塞问题

无。

## 复审验证

- 代码检查：`loadManagedStateForVerify` 已校验 `targetPath/sourcePath/checksum/installedAt/lastAction`，并限制 `lastAction` 为 `install/update/rollback/uninstall`。
- 针对性复测：在隔离临时目录执行 copy install 后，将 `home/skills/legion-workflow/SKILL.md` 对应 manifest record 的 `checksum` 改为数字；`verify --strict` 返回 `rc=1`，输出 `E_VERIFY_MANIFEST` 与最终 `E_VERIFY_STRICT`，未出现 `TypeError`。
- 测试报告：`docs/test-report.md` 已刷新并包含同类 invalid managed record 场景，结论 PASS。

## 非阻塞备注

- `verify --strict` 的主逻辑以当前 expected items 驱动，而不是由 manifest 任意路径驱动，符合 RFC 的安全边界。
- same-content adoption、unmanaged safe-skip、copy 内容漂移、symlink 类型/链接漂移、force repair 与 rollback 后不误报 READY 的测试证据充分。
- 非 strict 模式现在会在 manifest 缺失/非法时输出 `W_VERIFY_MANIFEST`，仍保持 READY 风格；这是合理兼容行为。
- manifest 中每条记录的 `targetPath` 当前只做类型校验，不驱动 verify 访问路径；这符合安全边界。若未来需要更强审计一致性，可另行要求 `record.targetPath === manifest key`，但不阻塞本任务。

## 范围合规

- 审查范围内的生产代码变更集中在 `scripts/setup-opencode.ts`。
- 任务文档位于 `.legion/tasks/harden-strict-verify-integrity/**`。
- 未发现本任务范围外的实现改动需要纳入本审查结论。
