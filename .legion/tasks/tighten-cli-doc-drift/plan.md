# Tighten CLI wording and benchmark doc drift

## 目标

移除一处仍把本地 CLI 误写成默认路径的校验文案，并把 benchmark 文档收敛到当前仓库真实存在的 surface。

## 问题陈述

当前仓库已经明确区分了控制面与数据面：`legion-workflow` 是入口门禁与阶段语义真源，本地 CLI 只是文件系统驱动的薄工具层。但 `scripts/setup-opencode.ts` 的一条校验提示仍会暗示 CLI 是默认路径，重新制造入口语义漂移。与此同时，`docs/benchmark.md` 仍把不存在的 `benchmark:*` npm scripts、`scripts/benchmark/` 路径与 artifact contract 当作当前现实来描述，和当前仓库表面不一致。

## 验收标准

- [ ] 当前真源文件不再把本地 CLI 描述成 workflow 的默认路径或默认入口
- [ ] `docs/benchmark.md` 不再把当前仓库中不存在的脚本、路径或 artifact contract 写成现行能力
- [ ] `README`、`setup-opencode` 校验输出与相关文档对当前架构的说法保持一致

## 假设 / 约束 / 风险

- **风险等级**: **Low**。理由：只涉及一条校验提示与一份文档收敛，不改 workflow 主干，也不改运行时 phase enforcement。
- **假设**: 当前 benchmark surface 仅剩 `shell.nix` 中的 Harbor wrapper，可作为唯一现实锚点保留。
- **约束**: 不扩 Scope 到 runtime 强门禁、新 benchmark 实现或额外验证框架。
- **约束**: 只修正文案与当前现实漂移，不发明缺失实现。
- **风险**: 若 benchmark 文档改得过头，可能把仍有价值的未来意图也一起抹掉；因此只能保留为明确标注的 planned / historical intent。

## 要点

- CLI 角色收口到“filesystem-backed thin tool”
- benchmark 文档只描述当前 repo truth
- 未来 benchmark 设想必须显式标注为 planned / historical

## 范围

- `scripts/setup-opencode.ts`
- `docs/benchmark.md`
- `.legion/tasks/tighten-cli-doc-drift/**`

## 设计索引 (Design Index)

> **Design Source of Truth**: design-lite in `plan.md`

**摘要**:
- 核心流程: 修正 `setup-opencode` 的 verifier 提示，使其与 control-plane / data-plane 拆分一致；然后重写 benchmark 文档，使其只描述当前 checked-in repo surface。
- 验证策略: 重跑隔离目录 `install + verify --strict`，并 grep 当前真源文件中的旧措辞；同时把 benchmark 文档中的命令/路径声称与 `package.json` 和文件系统对照。

## 阶段概览

1. **Phase 1** - 对齐 verifier wording 与 benchmark 文档
2. **Phase 2** - 验证当前真源一致性并生成 reviewer-facing 产物

---

*创建于: 2026-04-23 | 最后更新: 2026-04-23*
