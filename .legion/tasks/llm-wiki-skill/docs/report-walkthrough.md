# llm-wiki skill 细化迭代 Walkthrough

## 目标与范围

- 目标：基于现有 `llm-wiki` skill 做一轮**细化迭代**，把“正确但偏抽象”的 baseline 收敛成更可执行的公共契约，而不是首次创建新 skill。
- 范围：绑定 `skills/llm-wiki/**` 与对应任务文档；本次说明仅聚焦 `scope` 内成果，不扩展到其他仓库文件。
- 交付形态：继续保持 `SKILL.md` 轻入口，把具体 guidance 下沉到 `references/`，当前共 **4 个 references 文件**：`architecture.md`、`page-types.md`、`workflows.md`、`conventions.md`。

## 设计摘要

- 设计来源见 [RFC](./rfc.md)；RFC 评审见 [review-rfc](./review-rfc.md)。本轮定位是对既有 skill 的 refinement，不是重做目录或改名。
- 本轮新增的具体化内容主要有：
  - **bootstrap**：把首次接管时要确认的 raw/wiki/schema/写权限/导航与日志机制盘点前置为 session 入口。
  - **page families**：显式给出推荐页面家族，并新增 `references/page-types.md` 作为页面落点基线。
  - **决策矩阵**：在 workflows 中补齐 ingest / query / lint 的最小判定矩阵，明确何时只读、何时建议沉淀、何时允许授权写回。
  - **4 段式 query 输出**：统一 query 的默认输出为“答案 / 关键依据 / 冲突与不确定性 / 缺口与下一步”。
  - **等价导航/日志机制的可写前提**：明确只有宿主显式声明、目标位于可写 scope、且允许字段与写法已定义时，`index.md` / `log.md` 的等价机制才允许写回。
  - **Mermaid 状态机**：在 `SKILL.md` 中补了 query 三岔路与 ingest 第一落点两个 Mermaid `stateDiagram-v2` 状态机，降低快速扫读时的跨文件跳读成本，并让执行 agent 更容易按 guard 做状态迁移。

## 改动清单

### 入口文件

- `skills/llm-wiki/SKILL.md`
  - 从“抽象说明”细化为 session-level operating rules。
  - 新增 bootstrap、query 默认输出结构、authorized writeback 前提与等价导航/日志机制口径。
  - 新增 2 个 Mermaid 状态机：query durable writeback 判断、ingest 第一落点判断。

### 参考文档（4 个）

- `skills/llm-wiki/references/architecture.md`
  - 细化三层职责、host-schema handshake、默认基线与宿主覆盖边界。

- `skills/llm-wiki/references/page-types.md`
  - 新增页面家族基线：source summary、entity、topic/concept、comparison、synthesis/overview、maintenance。
  - 说明 query/ingest 结果应优先落到哪类页面。

- `skills/llm-wiki/references/workflows.md`
  - 补齐 bootstrap / ingest / query / lint 的逐步流程、最小决策矩阵与自检动作。
  - 固化 query 三岔路：只读、建议沉淀、授权写回。

- `skills/llm-wiki/references/conventions.md`
  - 统一 `index.md` / `log.md` 或宿主等价机制的约定、citation/状态标记/命名/互链与日志安全基线。

## 如何验证

- 详细结果见 [test-report](./test-report.md)。
- **当前测试结论：PASS。** skill 主体结构、文本契约与任务文档引用一致性均已收口。
- 状态机 validate 因环境缺少 Mermaid 渲染器，采用“Mermaid 结构检查 + 前后场景对照”的替代方案；结论仍为 PASS。

### 验证命令

```bash
python3 "/Users/c1/.opencode/skills/skill-creator/scripts/quick_validate.py" "/Users/c1/Work/legion-mind/skills/llm-wiki"
git diff --check -- "skills/llm-wiki"
python3 - <<'PY'
from pathlib import Path
import json
root = Path('/Users/c1/Work/legion-mind')
skill = root / 'skills/llm-wiki'
text = (skill / 'SKILL.md').read_text()
parts = text.split('---', 2)
front = parts[1]
keys = [line.split(':',1)[0].strip() for line in front.splitlines() if line.strip() and ':' in line]
print('frontmatter_keys=', keys)
print('references=', sorted(p.name for p in (skill/'references').iterdir() if p.is_file()))
checks = {
    'readonly_query': 'query 默认严格只读' in text and '用户明确要求沉淀 + 宿主 schema 显式定义写回流程' in text,
    'index_log_equiv_skill': '宿主等价机制' in text,
}
for name in ['architecture.md','page-types.md','workflows.md','conventions.md']:
    t = (skill/'references'/name).read_text()
    if name in ('architecture.md','workflows.md','conventions.md'):
        checks[f'equiv_{name}'] = '等价' in t
print('checks=', json.dumps(checks, ensure_ascii=False, sort_keys=True))
PY
```

### 预期结果

- `quick_validate.py` 返回 `Skill is valid!`。
- `SKILL.md` frontmatter 仅保留 `name` / `description`。
- `references/` 为 **4 个文件**，且包含新增 `page-types.md`。
- `SKILL.md` 中存在 2 个 Mermaid `stateDiagram-v2` 状态机，且都能直接推导出 guard 条件与终态动作。
- 文本中能直接推导出 bootstrap、page families、决策矩阵、4 段式 query 输出，以及等价导航/日志机制的可写前提。
- task 文档与当前 skill 实现保持一致，不再遗留旧数量表述或 `page-types.md` 缺失问题。

### 评审结果

- [review-rfc](./review-rfc.md)：PASS，确认本轮 refinement 已回应“过于简单”的反馈，并补足决策矩阵与行为级门槛。
- [review-code](./review-code.md)：PASS，确认这不是把旧内容简单写长，而是把落点判断、写回门禁、可写前提和自检动作具体化。
- [review-security](./review-security.md)：PASS，确认 query 仍 secure-by-default，且等价导航/日志机制写回受三重前提约束。

## 风险与回滚

### 主要风险

- 若后续文档再次漂移，任务产物可能再次落后于 skill 实际状态，尤其是 references 集合与 `page-types.md` 的引用。
- 若宿主 schema 未明确写回流程，集成方仍可能误解“结构化回答”或“沉淀建议”即可写回。
- 若等价导航/日志机制的可写前提被简化，可能把任意宿主文件误判为可写落点。
- 若后续把 Mermaid 状态机和文字规则分开修改，可能再次出现 guard 条件漂移。

### 回滚策略

- 回滚边界限定在 `skills/llm-wiki/**` 与对应任务文档。
- 若 refinement 造成边界歧义，优先回退到更保守口径：query 彻底只读、只保留默认 `index.md` / `log.md` 或明确声明的等价机制。
- 若页面家族或决策矩阵被误读为强制模板，则回退为“推荐 baseline”措辞，不改变宿主 schema 优先原则。

## 未决项与下一步

- 当前首要收口项已完成；后续需要继续保持任务文档与 skill 实际状态同步，避免再次出现旧数量表述。
- 后续可继续统一多份文档中的“可写前提”短句，降低术语漂移。
- 若未来补更多状态机，优先补“容易误判的 guard”，不要把每个 workflow 都图形化。
- 合入后建议在真实宿主场景验证一次 bootstrap、一次只读 query、一次授权写回判定、一次 lint，确认具体 guidance 足够稳定。
