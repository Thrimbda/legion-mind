---
name: engineer
description: 当已存在批准的 task contract 和必要设计门，需要在明确范围内开始有界实现时使用。
---

# engineer

只在已批准范围内实现核心路径。默认中文交接；代码、命令、日志和标识符保持原样。

## 硬门

- 必须先读稳定 `plan.md`。
- 存在 RFC/design source 时必须先读，且设计门已通过。
- contract 漂移或设计前提失效时不得编码。

## 流程

1. 从 contract 与设计确认授权 scope、验收和边界。
2. 实现满足验收的最小完整改动；scope 外问题停止并升级。
3. 运行与改动直接相关的最小本地检查，不在此阶段展开正式验证。
4. 用五字段短 handoff 返回：`结果 / 变化 / 风险 / 下一步 / 证据`；变化最多三条、证据最多三个 locator，不复制 contract、diff 或长日志。

## 禁止与退出

- 不顺手扩 scope、不重写 contract、不用大重构替代有界实现、不补做 `verify-change` 的证据工作。
- scope 不稳：`brainstorm`；设计有缺口：`spec-rfc`；实现完成：`verify-change`。
