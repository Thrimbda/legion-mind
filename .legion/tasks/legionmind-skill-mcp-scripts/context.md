# 将 legionmind skill 从 MCP 改写为 scripts - 上下文

## 会话进展 (2026-04-08)

### ✅ 已完成

- 完成仓库内 LegionMind MCP 依赖点盘点，并整理到 docs/research.md。
- 将 plan.md 升级为完整任务契约，补齐问题陈述、验收、约束、风险与设计索引。
- 完成 research、plan、RFC 与 review-rfc 收敛，确认按 M1 → M2 → M3 推进 scripts-first 迁移。
- 补齐 RFC 中的 parity matrix、里程碑、可执行 smoke/回归计划与排障入口。
- 实现 `skills/legionmind/scripts/legion.ts` 与共享 helper，交付 scripts-first Legion CLI，并补齐 addFile/addConstraint/addTask 等 schema 缺口。
- 新增根级 `scripts/legionmind/smoke.ts` 与 `check-no-default-mcp.ts`，固定验证入口并通过直接命令与 npm alias 双路径验证。
- 完成 skill / references / commands / agent / setup / README 的 CLI-first 改写；review-code 最终 PASS，review-security 为 PASS WITH CHANGES。
- 生成 `docs/report-walkthrough.md` 与 `docs/pr-body.md`，汇总 scripts-first 迁移的交付说明。
- 同步最终任务状态，确认主线 6/6 完成，review-code PASS、review-security PASS WITH CHANGES。
- 吸收额外代码审查反馈，修复安装后 CLI 路径错误：默认入口改为 `${OPENCODE_HOME:-$HOME/.opencode}/skills/legionmind/scripts/legion.ts`。
- 使用 skill-creator 的 `package_skill.py` 对新的 legionmind skill 做校验与打包，验证通过并生成 `legionmind.skill`。
- 按用户反馈保留 `skills/legionmind/SKILL.md` 的原有主体结构，只把 MCP/tool 调用表述改为 CLI 用法。
- 按 writing-skills 的“小而有用的决策流图”原则，在 `skills/legionmind/SKILL.md` 中加入 mermaid 快速决策图。


### 🟡 进行中

(暂无)


### ⚠️ 阻塞/待定

(暂无)


---

## 关键文件

(暂无)

---

## 关键决策

| 决策 | 原因 | 替代方案 | 日期 |
|------|------|----------|------|
| 按 Medium 风险执行 scripts-first 迁移，并先补 RFC 再实施。 | 本次改动会替换 skill 的默认执行面并波及命令/安装校验，但仍局部可回滚；需要先收敛参数协议与文档边界。 | Low/design-lite：无法充分覆盖 scripts API、命令文档和安装校验联动；High/heavy：风险不涉及 auth/支付/数据迁移，成本过高。 | 2026-04-08 |
| 固定 smoke harness 在根级 scripts/legionmind/，并用 npm alias 暴露。 | review-rfc 指出若 smoke 入口位置不唯一，会导致 README/package.json/verify 再次分叉。 | 放在 skills/legionmind/scripts 内：更贴近 skill，但会与仓库级验证脚本和 npm alias 分离。 | 2026-04-08 |
| 对 plan/context/tasks update 采用 section 级更新而非整文件重渲染。 | review-code 指出整文件重渲染会抹掉 Review block 与人工补充内容；section 级更新能在不扩展 schema 的前提下保留 review/extras。 | 继续整文件重渲染并回填 review：实现更简单，但仍容易覆盖未知段落；引入独立 state 文件：会扩张 `.legion` 契约。 | 2026-04-08 |
| 将 security review 剩余项降级为 follow-up，不阻塞本次 scripts-first 交付。 | 当前 blocking 已修复，剩余主要是 ledger 读取方式与 dashboard 输出边界的进一步加固，不影响本次默认入口替换。 | 继续在本次任务内扩大范围：会推高改动面并拖慢交付；完全忽略：会丢失后续加固线索。 | 2026-04-08 |
| 默认 CLI 路径改为从 `${OPENCODE_HOME:-$HOME/.opencode}` 解析已安装 skill，而不是引用仓库内 `skills/legionmind/...` 相对路径。 | 额外 review 指出 install 后 skill 实际落在 opencodeHome 下；继续使用仓库内相对路径会导致真实用户仓库找不到 CLI。 | 继续引用仓库内路径：仅开发仓可用；新增独立 wrapper 命令：需要额外安装入口，当前不必扩大范围。 | 2026-04-08 |
| SKILL.md 继续保留较完整的说明结构；本轮仅做 MCP → CLI 术语与调用方式替换。 | 用户明确指出此前删改过多，不符合预期；当前目标是修正执行入口而非压缩内容。 | 继续维持精简版 SKILL.md：更接近极简风格，但与用户期望冲突。 | 2026-04-10 |
| LegionMind skill 中的流程图采用“小型 mermaid 决策图”，只服务于恢复/初始化/break-glass 的非显然判断。 | writing-skills 强调流程图只用于非显然决策点，避免把线性说明或参考材料过度图形化。 | 把整套工作流都画成大图：信息过载；完全不加图：不利于快速判断入口路径。 | 2026-04-10 |

---

## 快速交接

**下次继续从这里开始：**

1. 如需，我可以继续把这次 SKILL.md 修订提交到当前 PR 分支。

**注意事项：**

- 当前新增的是 mermaid 图，不影响原有章节顺序与主体内容。

---

*最后更新: 2026-04-10 15:51 by Claude*
