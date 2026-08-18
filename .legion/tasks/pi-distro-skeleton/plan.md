# 0XC-293 Legion Pi distribution skeleton

## 目标

建设可从零复现的 Legion Pi 发行版骨架，以单一用户配置完成精确版本 pin、Pi settings、限制性 subagent 配置、安装验证回滚和扩展启动矩阵。

## 问题陈述

当前仓库只有 Pi 迁移评估和一次性 smoke 证据，没有可发布的 Legion Pi 目录、单配置源或安全安装生命周期；版本与扩展配置分散会导致漂移，也无法为后续常驻 Web 后端和完整发行版验收提供稳定基线。

## 验收标准

- [x] legion-pi/ 中存在带复核日期的四包精确 pin，实施时复核 2026-08-16 快照并记录版本变化。
- [x] 用户只需维护一个 legion-pi.json；Pi settings 与 pi-subagents 所需 runtime config 均由安装器生成且可验证。
- [x] setup-pi 支持 install、verify、rollback，并保持 managed manifest、备份和安全覆盖纪律。
- [x] 固定 Pi core 下三个扩展的全部 8 个组合均通过无凭证启动探针，任何重名工具或加载失败都 fail closed。
- [x] HOME、XDG、npm prefix 与 Pi agent/session 目录全重定向时可从零复现，且 npm pack 与回归测试覆盖发布面。
- [x] OpenCode 冻结线、skills 内容、pi-web 安装和后续 Legion 角色胶水不被修改。

## 假设 / 约束 / 风险

- **假设**: Legion Pi 是产品名，仓库发行版目录为 legion-pi/，默认安装 profile 与现有 OpenCode 路径完全隔离。
- **假设**: 单配置指唯一用户维护的 source of truth；上游强制要求的 settings.json 与 subagent config 可以作为 managed generated artifacts。
- **假设**: 0XC-302 负责常驻 Web 后端，优先评估 jmfederico/pi-web，agegr/pi-web 为轻量回退；FRP、手机浏览器与断线续跑在 D2 验收。
- **约束**: 安装器优先 Node 24，因为必须复用 TypeScript setup-core；本任务不重复实现 Rust 生命周期。
- **约束**: 用户配置不包含 provider 凭证，provider/model 继续由登录、环境或 CLI 选择。
- **约束**: 所有真实安装与验证只写入 repo 内隔离目录，不写真实 HOME 或系统全局 prefix。
- **约束**: 开发仅在 .worktrees/pi-distro-skeleton/ 完成并通过 PR lifecycle 交付。
- **风险**: Pi 生态版本快速漂移，尤其 pi-lens 已从 4.0.0 更新到 4.0.1，必须先核查 changelog 与组合兼容性。
- **风险**: pi-subagents 使用独立 config 文件；单配置生成若缺少 schema 校验会静默失效。
- **风险**: npm 与 Pi package manager 可能越过 profile 写入全局目录，安装前后必须检查路径边界。
- **风险**: 跨扩展工具重名会令 Pi 启动失败，启动矩阵必须使用真实 pin 包执行。

## 要点

- legion-pi.json 承载 schemaVersion、reviewedAt、packages 与 skills；required tools 和受限 subagent runtime 由安装器生成并验证，不接受 provider/model/credential/tool override。
- 生成文件不是第二个用户配置源，verify 必须证明其内容与 legion-pi.json 一致。
- 非目标：pi-web 安装、FRP、Legion skills/角色、pi-goal、browser/computer-use、OpenCode 与 scheduler 路径。
- 若必须修改 setup-core schema 或现有 lgmind 公共语义，风险升级并先走 spec-rfc 与 review-rfc。

## 范围

- legion-pi/ 发行版资产与复现文档
- scripts/setup-pi.ts 及发布时使用的 runtime JS/bin 入口
- package.json、build runtime 脚本与打包 allowlist 的最小增量
- Pi 安装生命周期、pin/config consistency、启动矩阵与隔离回归测试
- 任务本地验证、review、walkthrough 与 wiki pin writeback

## 设计索引 (Design Index)

> **Design Source of Truth**: Linear 0XC-293；Linear 北极星文档；.legion/tasks/evaluate-pi-control-plane/docs/rfc.md 与 research.md

**摘要**:
- 一个用户配置源生成上游运行时文件，避免让用户同时维护 Pi settings 与 extension config。
- Pi runtime 安装在隔离 npm prefix，配置与 sessions 绑定到同一 Legion Pi profile，删除 profile 即可退场。
- setup-core 继续负责文件 ownership、backup、safe-skip 与 rollback；Pi 特有的版本和启动核验留在 setup-pi。
- Web 只预留常驻后端兼容边界，实际 jmfederico/pi-web 集成留在 0XC-302。

## 阶段概览

1. **Contract and version review** - Materialize the approved contract and recheck all upstream pins
2. **Legion Pi assets** - Add the single source configuration and deterministic generated runtime templates
3. **Installer lifecycle** - Implement setup-pi install verify rollback with isolated paths
4. **Startup matrix and reproduction** - Run all eight extension combinations and document zero-state reproduction
5. **Verification and delivery** - Complete regression packaging review walkthrough wiki and PR lifecycle

---

*创建于: 2026-08-17 | 最后更新: 2026-08-18*
