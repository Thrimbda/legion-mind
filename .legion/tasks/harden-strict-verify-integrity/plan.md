# Harden strict verify integrity

## 目标

让 setup-opencode 的 verify --strict 能检测安装资产内容损坏、未管理冲突和本地漂移，而不是只检查文件存在。

## 问题陈述

审视发现当前 scripts/setup-opencode.ts 的 strict verify 只做 presence check：已安装 skill 被截空、或 unmanaged legion.md 阻止安装后，verify --strict 仍会输出 READY。这削弱 README 中 install / verify / rollback 作为可信安装验收路径的承诺。

## 验收标准

- [ ] verify --strict 能对已安装资产校验 manifest/checksum 或等价内容完整性，而不只看文件存在
- [ ] 安装时 safe-skip 的必需资产不会被 verify --strict 误判为 READY
- [ ] 本地修改或截空已管理资产会让 verify --strict 非零退出并给出可执行修复提示
- [ ] 正常 install + verify --strict 与 force reinstall 修复路径通过；rollback 后 verify 能忠实反映恢复状态，不再误报 READY
- [ ] 变更限定在安装/校验脚本及本任务文档，不引入新的 benchmark harness 或发布配置改动

## 假设 / 约束 / 风险

- **假设**: 当前安装策略仍以 copy/symlink 同步 .opencode/agents 与 skills 列表为准
- **假设**: managed-files.v1.json 可作为已安装资产的 manifest 基础，但 verify 也必须能处理缺失 manifest 的降级场景
- **假设**: 用户当前要求聚焦 strict verify，不同时修 npm pack 发布边界
- **约束**: 不得改动工作流阶段语义或 subagent dispatch matrix
- **约束**: 不得改变 README 声称的 CLI 薄工具定位
- **约束**: 不得删除用户已有本地文件；只能检测并提示 --force/install 修复
- **风险**: verify 过严可能误伤合法 symlink 安装或旧安装状态
- **风险**: checksum 逻辑若与 install 的 sourceFingerprint 不一致，会造成 false positive/false negative
- **风险**: 错误提示不清楚会降低安装可恢复性

## 要点

- strict verify 从 presence check 升级为 integrity check
- 覆盖 corrupted managed asset 与 unmanaged conflict 负向场景
- 保持 install/rollback 主路径兼容

## 范围

- scripts/setup-opencode.ts
- .legion/tasks/harden-strict-verify-integrity/**

## 设计索引 (Design Index)

> **Design Source of Truth**: .legion/tasks/harden-strict-verify-integrity/docs/rfc.md

**摘要**:
- 核心流程: 基于安装 manifest 与当前源文件重新计算必需资产期望指纹，verify --strict 同时检查存在性、内容完整性、managed ownership 与 conflict drift；install 对 same-content legacy 资产补写 ownership。
- 验证策略: 隔离目录跑正常 install/verify、截空资产负向、unmanaged conflict 负向、same-content adoption、manifest invalid、symlink repair 与 force reinstall 修复路径。

## 阶段概览

1. **Design** - 生成 strict verify 修复 RFC
2. **Implementation** - 实现 strict verify 完整性检测
3. **Validation** - 运行正向与负向验证

---

*创建于: 2026-04-25 | 最后更新: 2026-04-25*
