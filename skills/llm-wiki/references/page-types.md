# 页面类型

baseline durable pages 只保留五类。

## 1. entity

用于承载对象页：人物、公司、产品、项目、系统、地点、文档对象等。

建议接口：

- 对象定义 / 边界
- 关键事实
- 关系与上下文
- 争议 / 缺口 / 待验证项
- raw refs

## 2. topic

用于承载概念、议题、方法、机制、主题脉络。

建议接口：

- 主题定义
- 核心观点 / 机制
- 子主题 / 相关页
- 限制、争议、open questions
- raw refs

## 3. comparison

用于回答横向比较问题。

建议接口：

- 比较对象与问题
- 比较维度
- 主要结论
- 限制 / 例外 / 冲突
- raw refs

## 4. synthesis

用于承载跨多页、多来源的阶段性综合。

建议接口：

- 综合问题
- 核心结论
- 支撑页 / 相关 raw refs
- 竞争解释或争议点
- open questions

## 5. maintenance

用于承载维护债务、证据缺口、结构冲突、待处理事项。

建议接口：

- issue
- severity / status
- 触发来源
- 受影响页
- 建议动作

## lifecycle 规则

五类 page 都可能经历以下生命周期动作：

- `split`
- `merge`
- `archive`
- `supersede`

执行这些动作时必须满足：

1. 不破坏 raw ref 可追溯性
2. 不制造导航断裂
3. index 能反映 canonical 去向

## 非 baseline 页型

以下内容不再是 baseline durable page family：

- `source summary`

兼容语义：

- 现有 `source summary` 页面可读取
- 它们不是 canonical 证据中转层
- 默认不新建、不更新
- 不做破坏性清理
