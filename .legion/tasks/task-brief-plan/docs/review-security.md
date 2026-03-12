# Security Review Report

## 结论
PASS

## Blocking Issues
- [ ] 无。基于本次对 `.legion/config.json`、`plan.md` 与核心契约文档的复核，未发现会打破 `plan.md` 唯一人类可读 Scope 真源、越界审批边界或 `.legion` 单写责任的新增安全阻断问题。

## 建议（非阻塞）
- 建议为 `plan.md` 与 `.legion/config.json` 的 Scope mirror 增加自动一致性校验，持续降低因契约漂移引发的 `[STRIDE:Tampering]` 风险；重点参考 `skills/legionmind/references/REF_SCHEMAS.md:95` 与 `skills/legionmind/references/REF_SCHEMAS.md:99`。
- 建议在审批留痕中引入稳定的 `approval reference` / `decision id`，把“越界先升级并获确认”的自然语言痕迹升级为可关联证据，增强 `Repudiation` 审计边界；重点参考 `skills/legionmind/references/REF_ENVELOPE.md:39` 与 `.opencode/agents/legion.md:61`。
- 建议继续把 `config.json` 明确限制为 machine-readable mirror，并在文档与模板回归检查中扫描旧 `task-brief` 术语，避免审阅者被历史残留误导，降低 `Spoofing` 与契约绕过风险；重点参考 `docs/legionmind-usage.md:29` 与 `docs/legionmind-usage.md:38`。
- 建议后续把 scope enforcement、`.legion` 单写责任、输出路径约束纳入固定 lint / review checklist，持续降低状态机绕过和协议歧义被重新引入的概率；重点参考 `skills/legionmind/references/REF_ENVELOPE.md:40` 与 `skills/legionmind/references/REF_ENVELOPE.md:41`。

## 修复指导
1. 继续坚持 `plan.md` 为唯一人类可读契约，任何 `config.json` 或模板更新都只能镜像，不得独立扩展、收紧或否定 Scope。
2. 继续坚持“越界修改先升级并获确认，再执行并留痕”的 secure-by-default 门禁，避免子代理或模板文案形成默认放权。
3. 继续坚持仅 orchestrator 写回 `.legion` 三文件，并将审批、Scope 来源、最终输出路径作为固定审查项。
