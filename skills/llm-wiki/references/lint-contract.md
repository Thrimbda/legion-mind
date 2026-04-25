# Lint contract

lint 的目标是检查 wiki 是否还能持续可靠生长，而不是把全库重写当成默认动作。

## 1. lint 模式

### quick-lint

适合 touched pages、局部 query writeback、局部 ingest 后复查。

检查：

- index 是否仍能发现相关 canonical pages
- 关键结论是否有 raw ref
- 是否存在明显 broken links / orphan page / 状态标记缺失
- 是否误把一次性回答写成 durable knowledge
- 是否错误创建或依赖新的 `source summary`

### full-lint

适合维护 pass。

检查：

- navigation / index
- logging hygiene
- raw ref 可追溯性
- duplicate / orphan / overgrown pages
- contested / superseded / needs-verification 状态
- maintenance 页面是否承接结构债与证据缺口
- lifecycle 是否造成 canonical 断裂

## 2. hard checks

### 2.1 wiki root 可发现

必须能可靠识别 `wiki_root`。

- 唯一候选：继续
- 多候选：`blocked-by-host`
- 完全无法发现：`blocked-by-host`

### 2.2 index covers canonical pages

`index.md` 或宿主等价导航面应能发现 canonical pages。

缺失时：

- 若允许更新 index，则补齐
- 若 index 不可写且影响 canonical discoverability，则标记 `blocked-by-host`

### 2.3 no orphan durable pages

`entity`、`topic`、`comparison`、`synthesis`、`maintenance` 页面应至少满足一项：

- 出现在 index
- 被其他 durable page 合理链接
- 被 maintenance / lifecycle 状态明确引用

否则标记 orphan，并补互链或加 maintenance 项。

### 2.4 strong claims need raw refs

以下内容若缺 raw ref，不应以确定事实出现：

- 数字、日期、版本、价格
- “最新 / 当前 / 最强 / 最好 / 第一”
- 法律、医疗、财务、政策、决策建议
- 与既有结论冲突的新内容

修复：

- 补 raw ref；或
- 降级为 `needs-verification` / `contested` / `superseded`；或
- 写入 maintenance

### 2.5 no `source summary` dependency

不得把以下情况视为正常基线：

- “每个重要 raw source 都必须有 source summary”
- “durable page 必须通过 source summary 才算有来源”
- “缺少 source summary 就自动判为 lint failure”

legacy `source summary` 仅可读兼容，不是 lint 必修项。

### 2.6 evidence states are controlled

推荐状态：

- `needs-verification`
- `contested`
- `superseded`
- `archived`
- `merged`

发现其他临时状态时：

- 能归一化则归一化
- 不能确定则写入 maintenance

### 2.7 contested claims remain visible

冲突结论不能被静默删掉。

若只保留新结论而无旧结论痕迹：

- 恢复或重述旧 claim
- 标记 `contested` / `superseded`
- 补 raw refs

### 2.8 lifecycle leaves canonical path intact

`split / merge / archive / supersede` 后必须满足：

- index 仍能发现 canonical 去向
- 不产生导航断裂
- raw ref 仍可追溯

### 2.9 log stays a safe timeline

若宿主允许写 log：

- 应记录 ingest / query writeback / lint / blocked-by-host
- 仅写安全摘要

若 log 不可写：

- 标记 `logging degraded`
- 不得改写其他文件代偿

## 3. auto-fix policy

### 可自动修复

- 补 index entry
- 补互链
- 补 evidence gap 标记并降级为 `needs-verification`
- 为结构债、证据缺口、冲突写 maintenance 项
- 小范围 broken links 修复
- 小范围状态归一化

### 需要 review

- 删除页面
- 大规模 rename / merge / archive
- 改写重要综合结论
- 处理高风险领域内容
- 扩展 page family 或宿主契约

## 4. lint 输出模板

```md
# Lint report

- Scope:
- Mode: quick-lint / full-lint
- Date:

## Fixed

| issue | action | pages |
| ----- | ------ | ----- |
| <issue> | <action> | <pages> |

## Needs review

| issue | why not auto-fixed | suggested action |
| ----- | ------------------ | ---------------- |
| <issue> | <reason> | <action> |

## Maintenance added

| item | severity | page |
| ---- | -------- | ---- |
| <item> | low / medium / high | <page> |

## Evidence / Lifecycle risks

| issue | status | page | next action |
| ----- | ------ | ---- | ----------- |
| <issue> | needs-verification / contested / superseded / archived / merged | <page> | <action> |

## Next pass

- <suggested next maintenance action>
```
