# Remove config/ledger from Legion CLI - 任务清单

## 快速恢复

**当前阶段**: 阶段 3 - 验证与交付
**当前检查项**: 无（已完成）
**进度**: 8/8 任务完成

---

## 阶段 1: 设计收敛 ✅ COMPLETE

- [x] 起草 CLI 去 config/ledger 的 RFC | 验收: RFC 明确保留命令、删除命令、task-id 解析策略与兼容性影响
- [x] 完成 RFC 对抗审查并吸收结论 | 验收: review-rfc 无 blocking 问题

---

## 阶段 2: 实现与文档 ✅ COMPLETE

- [x] 重构 `lib/cli.ts` 为文件系统驱动模型 | 验收: 不再读写 `.legion/config.json` / `.legion/ledger.csv`
- [x] 精简 `legion.ts` 命令路由 | 验收: 删除旧命令分支且 help/usage 更新
- [x] 更新 CLI 参考与 README/usage | 验收: 文档与实现一致

---

## 阶段 3: 验证与交付 ✅ COMPLETE

- [x] 运行针对性验证 | 验收: 至少覆盖 CLI 主干与受影响文档
- [x] 完成代码审查 | 验收: review-code 产出并无 blocking 问题
- [x] 生成 walkthrough / PR body 摘要 | 验收: reviewer 可直接阅读主要结论

---

## 发现的新任务

- (暂无)

---

*最后更新: 2026-04-23 01:00*
