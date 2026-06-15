# Review RFC: 全仓库 Skill 中文输出约束

## 结论

PASS。当前 RFC 足以进入实现阶段。

## 审查输入

- `plan.md`
- `docs/rfc.md`

## 审查视角

| Lens | 结论 |
|---|---|
| Scope clarity | PASS：scope 限定为 `skills/*/SKILL.md` 与任务证据，明确不改全局安装副本和可执行脚本。 |
| Alternatives | PASS：比较了统一段落、按职责定制和全局规则三种方案；推荐方案能解释为什么不采用模板化硬插入。 |
| Verification | PASS：包含 per-skill 静态 smoke、`git diff --check` 与现有 regression。 |
| Rollback | PASS：无数据迁移，`git revert` 可回退。 |
| Risk boundary | PASS：保留 frontmatter description、技术 token、机器可读内容和流程语义，能控制触发/执行回退风险。 |

## Blocking findings

无。

## Non-blocking suggestions

- 实现时不要为了“定制”而大幅重写 skill 主体，避免把语言约束任务扩大成文案重构。
- 验证时用脚本列出未命中中文输出约束的 `SKILL.md`，避免人工漏掉某个 skill。

## 实现准入

允许进入 `engineer`。实现需严格遵守 RFC 的 per-skill 落点，不修改 frontmatter discovery 字段或安装脚本。
