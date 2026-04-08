# 将 legionmind skill 从 MCP 改写为 scripts - 任务清单

## 快速恢复

**当前阶段**: 已完成
**当前任务**: (none)
**进度**: 6/6 任务完成

---

## 阶段 1: 阶段 1 - 调研与设计 ✅ COMPLETE

- [x] 盘点 legionmind skill 中所有 MCP 相关入口、引用与文档约束，并查找 skill-creator 规范来源。 | 验收: 形成可执行的问题定义、范围、约束与风险分级结论。
- [x] 输出 plan.md 摘要契约，并根据风险级别补齐 RFC 设计。 | 验收: plan.md 与 rfc.md（如需要）能够指导后续实现，无待决阻塞。

---

## 阶段 2: 阶段 2 - 实现改造 ✅ COMPLETE

- [x] 将 skill 文档中的 MCP 使用方式改写为 scripts 工作流，并实现对应脚本。 | 验收: skills/legionmind 可在无 MCP 前提下完成原有核心能力，脚本入口与说明一致。
- [x] 同步更新引用文档、示例与必要的项目级说明。 | 验收: 仓库内相关文档/配置不再误导使用 MCP，且符合 skill-creator 规范。

---

## 阶段 3: 阶段 3 - 验证与交付 ✅ COMPLETE

- [x] 运行测试/检查并完成代码、安全（按需）评审。 | 验收: 产出 test-report、review-code，若触发安全条件则补充 review-security。
- [x] 生成 walkthrough 与 PR body，并同步上下文/任务状态。 | 验收: 任务目录 docs 下产物齐全，可直接用于提交 PR。

---

## 发现的新任务

- [x] 确认并清理 scripts/setup-opencode.ts 中对 mcp.legionmind 的默认依赖提示。 | 来源: research.md
- [x] 在根级 scripts/legionmind/ 固定 smoke harness 与 no-default-mcp 扫描入口。 | 来源: review-rfc.md
- [x] 保持 legion-rfc-heavy 命令与 CLI-first 默认入口一致。 | 来源: final review-code
- [x] 补一次最终代码复审，确保 legion-rfc-heavy 也切到 CLI-first 默认入口。 | 来源: review-code
- [x] 将 scripts-first CLI 的 break-glass 限制同步到 skill / commands 文案。 | 来源: review-security
- [ ] 后续加固：继续处理 review-security 的剩余项（ledger query 读取策略、dashboard 输出边界、scan fixture）。 | 来源: final review-security


---

*最后更新: 2026-04-08 18:14*
