# RFC 审查报告

## 结论
PASS WITH CHANGES

结论原因：上轮 4 个 blocking 基本都已收敛。RFC 现在已经具备可实施的命令等价表、可执行验证契约、明确里程碑/发布回滚门槛，以及可检查的 skill-creator MUST/MUST NOT。剩余问题主要是少量措辞和执行细节，还不构成阻塞。

## 阻塞问题

- 无。

## 重要问题（Major）

- [ ] **smoke harness 的建议入口路径仍有歧义。**
  - 现状：正文默认 CLI 入口是 `skills/legionmind/scripts/legion.ts`，但 smoke 示例写成 `scripts/legionmind/smoke.ts` 或 `npm run legionmind:smoke`。
  - 风险：实现时可能把测试脚本放在仓库根 `scripts/`，也可能放在 skill 内 `skills/legionmind/scripts/`，导致 README / package.json / verify 文案再次分叉。
  - 最小化复杂度建议：在 RFC 中固定一个唯一位置，并同步说明 `npm run legionmind:smoke` 只是该文件的 alias。

## 非阻塞建议（Minor）

- 建议在 parity matrix 里给 `proposal list` 明确写出 `status=pending|approved|rejected|all`，避免实现时默认值理解不一致。
- 建议在“回归扫描”里补一句：历史映射表允许出现 `legion_*` 名称，但必须位于 `REF_TOOLS.md` 或明确的兼容章节，进一步减少误报争议。
- 建议把 “JSON 错误结构” 的 `hint` 是否必填写清楚；目前表述为 `hint?`，实现时可能导致不同命令风格不一致。

## 重点复核结果

### 1. parity matrix 是否完整
PASS

依据：已覆盖 init / create / propose / proposal list/approve/reject / status / list tasks / read context / list reviews / respond review / update plan / update context / update tasks / switch / archive / dashboard / ledger query，并明确了 `section/includeReviews`、`since/until`、`need-info`、`updatePhaseStatus` 等上轮关注点。

### 2. smoke / 回归是否已变为可执行契约
PASS

依据：已补固定入口建议、临时目录夹具、逐步断言、返回码约定，以及回归扫描命令/脚本规则，不再只是概念性步骤列表。

### 3. 里程碑、发布/回滚门槛、排障入口是否足够明确
PASS

依据：
- M1/M2/M3 已有明确范围与 DoD；
- 发布切换门槛与 M3 绑定；
- 回滚触发条件、优先回滚对象、保留 CLI 代码的原则已明确；
- verify → smoke → ledger 的排障顺序已成文。

### 4. skill-creator 规范是否已落成 MUST/MUST NOT
PASS

依据：已把 `SKILL.md` 的保留内容、禁止内容、references 承担的职责写成可审查条款，不再只是原则性提及。

## Heavy Profile 检查

| 检查项 | 结果 | 依据 |
| --- | --- | --- |
| Executive Summary（<= 20 行） | PASS | 已补显式 Executive Summary，6 条内可快速读懂。 |
| Alternatives >= 2，且说明放弃原因 | PASS | 方案 A/B/C 齐全，放弃原因明确。 |
| Migration / Rollout / Rollback 可执行 | PASS | 已补阶段门槛、触发条件与回滚优先级。 |
| Observability（日志/指标/告警/排障入口） | PASS | 以 verify / smoke / ledger / JSON 错误结构构成最小排障闭环。 |
| Milestones（可验收最小增量） | PASS | 已拆 M1/M2/M3，并各自定义 DoD。 |
| 易膨胀细节已外移，主文不过长 | PASS | 主文仍偏长，但关键边界已收敛，且不再缺主干决策。 |

## 修复指导

建议只做一轮小修，不必重写 RFC：

1. 固定 smoke harness 的唯一文件位置；
2. 补齐 `proposal list` 的状态枚举；
3. 说明历史映射命中回归扫描时的豁免边界；
4. 明确 `hint` 字段是否可选及何时返回。

## 最终建议

RFC 已可进入实现。

实施时建议严格按 M1 → M2 → M3 推进，不要跨阶段并行扩 scope。若完成上述小修，可视为进入稳定可执行状态。
