# llm-wiki skill Walkthrough

## 目标与范围

- 目标：把仓库内 `llm-wiki.md` 的模式收敛为一个可复用的 `llm-wiki` skill，让 agent 能稳定执行 ingest / query / lint 三类工作流，而不是每次临时重建理解。
- 范围：严格限定在 `skills/llm-wiki/**`。
- 本次交付不扩展脚本、依赖或跨目录实现；只沉淀 skill 契约与必要 references。

## 设计摘要

- 设计来源见 [RFC](./rfc.md)；RFC 评审结论见 [review-rfc](./review-rfc.md)，已通过并允许进入实现。
- 设计核心是按 skill-creator 约束拆分：`SKILL.md` 保持轻量入口，长说明下沉到 `references/`，避免把 skill 写成大型说明书。
- 语义核心覆盖三层架构（raw sources / wiki / schema）与三类操作（ingest / query / lint）。
- 关键安全门禁是：`query` 默认严格只读；仅当“用户明确要求沉淀”且“宿主 schema 已显式定义写回流程”同时成立时才允许写回。
- 关键审计约束是：`log.md` 只做最小化、追加式、安全摘要记录，默认脱敏，不复制敏感原文或内部路径。

## 改动清单

### 入口文件

- `skills/llm-wiki/SKILL.md`
  - 定义 skill 使用时机与 baseline 原则。
  - 给出 ingest / query / lint 三类操作入口。
  - 明确 `index.md` / `log.md` 同步维护要求。
  - 将 query 写回门禁固定为“默认只读 + 显式授权例外”。

### 参考文档

- `skills/llm-wiki/references/architecture.md`
  - 定义 raw sources / wiki / schema 三层职责。
  - 明确本 skill 只提供 schema baseline，不替代宿主规则。

- `skills/llm-wiki/references/workflows.md`
  - 细化 ingest / query / lint 的标准步骤与最小产物。
  - 落实 query 授权写回的唯一条件与写回后必做动作。

- `skills/llm-wiki/references/conventions.md`
  - 固化 `index.md` / `log.md` 的最小契约。
  - 明确页面命名、互链、证据与断言、自检要求。

## 如何验证

详细结果见 [test-report](./test-report.md)，结论为 **PASS**。

### 验证命令

```bash
git status --short -- "skills/llm-wiki"
git diff --check -- "skills/llm-wiki"
git diff --name-only
git diff --cached --name-only
git ls-files --others --exclude-standard
```

### 预期结果

- `skills/llm-wiki/**` 下只包含 `SKILL.md` 与 3 个 references 文件。
- 不出现 `scripts/`、`README`、`CHANGELOG`、`INSTALLATION_GUIDE` 等超 scope 产物。
- `SKILL.md` frontmatter 仅包含 `name` / `description`。
- 文本内容完整覆盖三层架构、三类操作、`index.md` / `log.md` 约定。
- `query` 保持默认严格只读，只有显式授权时才允许写回。
- `log.md` 约定满足最小化记录、脱敏、只追加不覆盖。

### 评审结果

- [review-rfc](./review-rfc.md)：PASS，设计可实现、可验证、可回滚。
- [review-code](./review-code.md)：PASS，无阻塞问题，仅有轻微术语一致性建议。
- [review-security](./review-security.md)：PASS，确认只读默认、显式授权写回、日志最小化/脱敏三项关键安全约束成立。

## 风险与回滚

### 主要风险

- 若后续宿主 schema 对“授权写回”定义不清，集成方可能误把普通 query 升级为写操作。
- `query` / `analysis` 日志术语仍有轻微漂移空间，后续维护时需避免再次不一致。
- 本 skill 只提供 baseline；宿主若未补齐页面类型、落点、字段权限等规则，实际落地仍可能过松或过严。

### 回滚策略

- 回滚边界限定在 `skills/llm-wiki/**`。
- 若 query 写回边界出现歧义，立即收紧回“彻底只读”，直到宿主 schema 明确授权流程。
- 若 `SKILL.md` 过重，继续把细节下沉到 references；若 references 过碎，则在 scope 内合并整理。
- 若日志约定误记敏感信息，通过追加更正/撤销记录修复，并回到“仅安全 ID + 动作摘要”的最低基线。

## 未决项与下一步

- 非阻塞未决项：统一 `query` / `analysis` 日志术语，减少后续 drift。
- 建议宿主接入时提供“授权写回”最小 schema 模板，显式列出维护者、落点、允许字段与记账要求。
- 本 PR 合入后，可在真实宿主 wiki 中验证一次 ingest、一次只读 query、一次授权写回 query、一次 lint，检查指令可执行性与集成摩擦。
