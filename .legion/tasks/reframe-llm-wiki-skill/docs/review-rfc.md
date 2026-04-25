# RFC 审查报告

## 结论
PASS WITH NOTES

总体判断：本次修订已经把之前两项 blocking **按最小复杂度基本修正到位**，RFC 现在满足“**可实现 / 可验证 / 可回滚**”的进入实施门槛。

- **host contract 收边**：`5.3.1` 与 `5.3.2` 已从“完整声明集合”收敛为“最低写回前提 + baseline fallback / blocked-by-host 降级”，方向正确，且比上一版明显更可执行。
- **legacy source summary 兼容**：`5.11` 已补上“可读但非 canonical / 默认不新建不要求更新 / 不做破坏性清理 / 回滚语义简单”，兼容语义清楚且可回滚。
- **新复杂度风险**：当前没有发现新的 blocking 级膨胀；raw model、page lifecycle、protected scope 优先级都已比上一版更收边。

结论因此从上一版的 **BLOCKING** 调整为 **PASS WITH NOTES**。

## 阻塞问题
- 无。

## 非阻塞问题
- [ ] **`host contract` 的字段表述还有一处轻微不一致，建议再收一刀，避免实现时回摆成“完整声明集合”。**
  - 依据：`5.3.1` 已把最低写回前提收敛为“可发现 `wiki_root` / 可判定 target / 未命中 protected scope / 可执行 baseline citation”；但 `7.1` 仍把 `writable_scopes`、`protected_scopes` 标成“最低写回前提”，同时 `8` 又说明它们缺失时可回退到 baseline。
  - 风险：虽然现在不构成阻塞，但这类措辞不齐很容易让后续实施者重新理解成“宿主必须先写全字段”。
  - 最小化复杂度建议：把 `7.1` 的字段标签改成和 `5.3.1/5.3.2/8` 一致——明确“**显式声明优先；缺失时按 baseline fallback；只有 `wiki_root` 无法发现或 target 无法安全判定时才是真阻断**”。

- [ ] **`wiki_root` 的 baseline 发现规则仍略宽，建议加一句“多候选即阻断，不猜”。**
  - 依据：`5.3.2` 允许把“当前工作目录本身就是 wiki 根”或“存在唯一可识别导航面”视为已发现，这是合理的最小发现算法；但若同时存在多个候选导航面，当前 RFC 还没有把“不猜测”写成硬规则。
  - 风险：不写死这一条时，agent 可能在多候选宿主里临场拍板，增加越权写回风险。
  - 最小化复杂度建议：补一句即可——**若 `wiki_root` 或 canonical target 出现两个及以上同等候选，直接进入 `blocked-by-host`，不得猜测。**

- [ ] **legacy `source summary` 的兼容语义已经成立，但建议再给一个最小 scenario，降低实施歧义。**
  - 依据：`5.11` 已清楚规定 legacy 页“可读但非 canonical、默认不新建不更新、不可替代 raw 证据、回滚简单”。
  - 风险：规则本身够了，但如果 `scenarios.md` 没有一个对应例子，后续实施时仍可能出现“读 legacy 页后是否要顺手补写/迁移”的分歧。
  - 最小化复杂度建议：在 scenarios 中补 **1 个** 例子即可：宿主已有 legacy `source summary`，新 query/ingest 只把它当辅助上下文读取，新的 canonical 结论仍直引 raw ref，且不新建/不迁移 legacy 页。

## 建议修改
1. **保持当前总体结构不变**，不要再发明新机制；这版 RFC 已经足够接近可实施状态。
2. **统一 `host contract` 的文字语义**：把 `7.1` 和 `8` 完全对齐到 `5.3.1/5.3.2` 的“最低前提 + fallback”模型。
3. **补一条“不猜测”规则**：多候选 `wiki_root` / target 一律 `blocked-by-host`。
4. **给 legacy `source summary` 增加 1 个最小 scenario**，只做示例，不扩机制。

## 最终一句话建议
可以按当前 RFC 进入实施；先再收紧一刀措辞一致性与一个 legacy 场景示例，就能把这版设计稳定在“默认可沉淀、但不越界”的最小复杂度状态。
