# 设计门禁

本规则只适用于已进入 Legion 的修改任务；入口前的明确微操作不在此列。原则是稳定 contract 后再编码，批准优先集中在 PR。

## 风险与产物

| 风险 / profile | 信号 | 实现前门禁 |
|---|---|---|
| Low / Lite | 局部、可逆、contract 稳定；无安全/数据/外部合约边界 | 不强制 RFC；出现真实设计分叉时补短 RFC |
| Medium / Standard | 公共 API/配置、核心流程、新依赖、跨模块取舍或回滚歧义 | 触发上述设计问题时先做标准 RFC 与 `review-rfc PASS` |
| High / Strict | 权限/密钥/支付/合规、持久数据/schema、外部协议兼容、难回滚 | 完整 RFC；`review-rfc PASS`；PR 标注高风险及回滚 |

风险只按错误代价、边界与可回滚性判断。LOC、文件数、耗时或执行者自报不能降级；安全/权限、持久数据、外部协议、秘密/签名、破坏性动作和困难回滚必须升级。

## RFC Heavy

High 或规模信号（跨服务、2+ 里程碑、明显未知项）使用 Heavy：`plan.md + docs/research.md + docs/rfc.md + docs/review-rfc.md`。可用仅设计 Draft PR 集中评审；设计 PR merge 后以 approved-design continuation 实现。

## 批准与漂移

- 显式批准：用户或 PR 明确批准设计。
- 延迟批准：RFC 自检/审查已满足后继续实现，PR merge 作为最终批准；`decide` 仍须先取得决定。
- 实现发现假设或设计错误时停止扩展，更新 RFC，在 `log.md` 记录；风险升级或实质设计变化须重跑 `review-rfc`。
