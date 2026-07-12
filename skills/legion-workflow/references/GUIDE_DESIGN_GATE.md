# 设计门禁

本规则只适用于已进入 Legion 的修改任务；入口前的明确微操作不在此列。原则是稳定 contract 后再编码，批准优先集中在 PR。

## 风险与产物

| 风险 | 信号 | 实现前门禁 |
|---|---|---|
| Low | 局部、可回滚；无安全/数据迁移/基础设施/外部合约 | 稳定 `plan.md` + `docs/rfc.md` 中 design-lite；可延迟到 PR merge 批准 |
| Medium | 公共 API、核心流程、新依赖/配置、多模块 | 标准 RFC 含 Options/Decision/Verification；`review-rfc PASS` |
| High | 权限/密钥/支付/合规、数据迁移、难回滚、关键基础设施 | 完整 RFC；`review-rfc PASS`；PR 标注高风险及回滚 |

Low 的 Fast Track 只省正式 RFC：大致不超过 50 行、3 文件，无合约/依赖/关键路径变化，且 `git revert` 可安全回滚；仍需 scope、假设、验收、design-lite、验证和 closing stages。条件不全即升级。

## RFC Heavy

High 或规模信号（跨服务、2+ 里程碑、明显未知项）使用 Heavy：`plan.md + docs/research.md + docs/rfc.md + docs/review-rfc.md`。可用仅设计 Draft PR 集中评审；设计 PR merge 后以 approved-design continuation 实现。

## 批准与漂移

- 显式批准：用户或 PR 明确批准设计。
- 延迟批准：RFC 自检/审查已满足后继续实现，PR merge 作为最终批准；`decide` 仍须先取得决定。
- 实现发现假设或设计错误时停止扩展，更新 RFC，在 `log.md` 记录；风险升级或实质设计变化须重跑 `review-rfc`。
