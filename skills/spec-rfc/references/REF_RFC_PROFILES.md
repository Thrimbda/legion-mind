# RFC 深度选择

选择文档深度是为了服务当前决策，不是按风险自动进入固定流程。

## Short design note

适合局部、可逆且边界明确的设计分歧。通常只需问题、选择、理由、影响和验证方式。

## Standard RFC

适合跨模块、公共接口或存在多个真实方案的设计。通常包含 context、goals/non-goals、现状、options、decision、详细设计、验证和 rollback。

## Research-backed RFC

适合关键事实尚未核实、外部生态快速变化、数据迁移、安全边界或难回滚设计。先记录一手证据、版本/日期和 unknowns，再形成 RFC；按需补 observability、rollout、threat model 和 milestones。

不要因为文档较短就省略真实风险，也不要为了符合档位而制造章节、备选方案或里程碑。
