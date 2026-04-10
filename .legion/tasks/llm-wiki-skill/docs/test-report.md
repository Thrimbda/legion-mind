# 测试报告

## 目标

验证本轮把 `llm-wiki` 的流程图从 DOT/graphviz 改为 Mermaid 状态机后，是否同时满足：

- skill 结构仍合法；
- Mermaid 状态机具备最小可用结构；
- query / ingest 的关键状态迁移仍能被执行 agent 快速扫读；
- 任务文档与当前实现保持一致。

## 执行命令

`python "/Users/c1/Work/agents/.claude/skills/skill-creator/scripts/quick_validate.py" "/Users/c1/Work/legion-mind/skills/llm-wiki"`

`git diff --check -- "skills/llm-wiki" ".legion/tasks/llm-wiki-skill"`

`python - <<'PY'
from pathlib import Path
import re, json
root = Path('/Users/c1/Work/legion-mind')
skill = root / 'skills/llm-wiki'
text = (skill/'SKILL.md').read_text()
blocks = re.findall(r'```mermaid\n(.*?)\n```', text, re.S)
checks = {
  'mermaid_blocks': len(blocks),
  'no_graphviz_blocks': '```graphviz' not in text and '```dot' not in text,
  'has_query_state_machine': 'stateDiagram-v2' in text and 'CheckHostWritebackFlow' in text,
  'has_ingest_state_machine': 'UpdateBaselineSourceSummary' in text and 'CheckHostEquivalentSourcePage' in text,
  'explicit_persist_rule': '只有明确的持久化指令' in text,
}
assert len(blocks) == 2
for i, block in enumerate(blocks, 1):
    assert 'stateDiagram-v2' in block, f'block {i} missing stateDiagram-v2'
    assert '[*]' in block, f'block {i} missing start/end marker'
    assert '-->' in block, f'block {i} missing transitions'
print(json.dumps(checks, ensure_ascii=False, indent=2))
PY`

## 基线测试（无状态机）

在上一轮无图版本中，探索代理的结论是：

- `query` 的三岔路虽然正确，但要在 `SKILL.md`、`workflows.md`、`page-types.md` 之间来回确认；
- ingest 的“第一落点先 source summary / 宿主等价页型”也需要跨文件跳读；
- 最适合用图形化补强的点正是：`query` 的授权判断、ingest 的第一落点。

## 后测（Mermaid 状态机）

加上 Mermaid 状态机后，再用只读探索代理快速扫读，结论是：

- `query` 状态机已能明确区分 `read-only / suggest-persist / authorized-writeback` 三条路径；
- ingest 状态机已能明确区分 `host-ban / host-equivalent / baseline-source-summary` 三条路径；
- Mermaid 版比 DOT/graphviz 更接近“命中 guard 才能迁移”的执行状态机；
- 仍最容易误判的自然语言边界是：什么表达算“user explicitly asked to persist”，因此已在 query 状态机后补充显式说明。

## RED / GREEN 摘要

- RED：无状态机时，agent 在 query 写回判定与 ingest 第一落点上需要跨文件跳读，容易误判。
- GREEN：补入 Mermaid 状态机后，agent 更容易区分只读 / 建议沉淀 / 授权写回，以及 host-equivalent / baseline-source-summary 路径。
- 本轮改动因此聚焦于提升执行可扫读性，而不是扩张默认写权限。

## 结果

PASS

## 摘要

- `quick_validate.py` 返回 `Skill is valid!`，skill 结构仍符合 skill-creator 约束。
- `git diff --check -- "skills/llm-wiki" ".legion/tasks/llm-wiki-skill"` 无输出，scope 内未发现 diff 格式问题。
- 本轮新增的 `Use when ...` metadata、workflow 目录、输出载体说明与安全 ID 示例均为文案级轻量改动，未改变原有写权限门禁与 page family 边界。
- `SKILL.md` 中存在 2 个 Mermaid `stateDiagram-v2` 代码块，且已移除旧的 graphviz/dot 代码块。
- Mermaid 状态机结构检查通过：代码块数量正确、`stateDiagram-v2` 存在、包含起止标记与状态迁移。
- 前后场景对照表明：Mermaid 状态机显著降低了 query / ingest 的跨文件跳读成本，更符合“给执行 agent 看的状态机”这一目标。
- `report-walkthrough.md`、`pr-body.md`、`context.md`、`tasks.md` 已同步到 Mermaid 状态机与当前验证结论。

## 已知限制

- 当前环境缺少 Mermaid CLI / 渲染器，因此未执行图形渲染级校验。
- 本轮改用“Mermaid 结构检查 + 前后场景对照”作为 validate 替代，以验证状态机既存在、也确实改善了可扫读性。

## 备注

- 之所以仍只保留 2 个状态机，是因为 `writing-skills` 建议图形化只用于非显然决策点；当前 query 与 ingest 符合该条件，而 lint 更适合保留为文字规则。
