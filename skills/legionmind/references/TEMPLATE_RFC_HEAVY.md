# RFC: <Title>

> **Profile**: RFC Heavy (Epic/High-risk)  
> **Status**: Draft  
> **Owners**: (agent/user)  
> **Created**: YYYY-MM-DD  
> **Last Updated**: YYYY-MM-DD

---

## Executive Summary（<= 20 行）
- **Problem**: ...
- **Decision**: ...
- **Why now**: ...
- **Impact**: ...
- **Risks**: ...
- **Rollout**: ...
- **Rollback**: ...

---

## 1. Background / Motivation
- 现状：...
- 痛点：...
- 影响范围：...
- 相关背景链接：见 References

## 2. Goals
- ...

## 3. Non-goals
- ...

## 4. Constraints（硬约束）
- Compatibility / API contract:
- Performance / SLO:
- Security / privacy:
- Operational:
- Dependency / rollout constraints:

## 5. Definitions / Glossary（如需要）
- ...

---

## 6. Proposed Design（端到端）
### 6.1 High-level Architecture
- 组件/模块边界：
- 数据/控制流：
- 关键状态：

### 6.2 Detailed Design（关键细节）
- APIs / Interfaces（含示例）
- Data model / schema（含兼容策略）
- Error semantics（重试/幂等/可恢复性）
- Concurrency / ordering（如需要）

> 约束：细节要“可实现、可测试、可回滚”。

---

## 7. Alternatives Considered（>= 2）
### Option A: ...
- Pros:
- Cons:
- Why not:

### Option B: ...
- Pros:
- Cons:
- Why not:

### Decision
- 选择：Option ...
- 原因（2-5 条 bullet）：
  - ...
- 放弃的东西（明确写出）：
  - ...

---

## 8. Migration / Rollout / Rollback（强制）
### 8.1 Migration Plan
- 是否有数据迁移：是/否
- 迁移步骤：
- Backfill/双写/读写切换策略：

### 8.2 Rollout Plan
- Feature flags / 配置项：
- 灰度策略：
- 验收指标：

### 8.3 Rollback Plan（必须可执行）
- 回滚条件（触发器）：
- 回滚步骤：
- 回滚后的数据一致性处理：

---

## 9. Observability（强制）
- Logs（关键字段、采样策略）
- Metrics（建议至少：成功率、延迟、错误类型、关键队列长度/重试次数）
- Alerts（阈值与应急流程）
- Debug playbook（排障入口）

---

## 10. Security & Privacy（强制）
- Threat model（滥用面/攻击面）
- 权限边界（谁能做什么）
- 输入校验、资源耗尽（DoS）
- Secrets / key handling（如涉及）
- Data retention / PII（如涉及）

---

## 11. Testing Strategy（强制）
- Unit tests:
- Integration tests:
- Regression tests:
- Migration tests（如有）:
- Manual validation（必要时）:

---

## 12. Milestones（可验收的最小增量，强制）
> 每个 Milestone 必须能：构建/测试/部署（至少在 CI）并可验收。

- Milestone 1: ...
  - Scope:
  - Acceptance:
  - Rollback impact:
- Milestone 2: ...
  - ...
- Milestone 3（可选）: ...

---

## 13. Open Questions（仅阻塞级）
- [ ] ...

---

## 14. Implementation Notes（落地提示）
- 预计改动文件/模块：
- 关键实现顺序（建议）：
- 需要新增的配置/文档：

---

## 15. References（证据索引）
- Task brief: `docs/task-brief.md`
- Research: `docs/research.md`
- Relevant files:
  - `...`
- Historical ADR/RFC:
  - `...`
