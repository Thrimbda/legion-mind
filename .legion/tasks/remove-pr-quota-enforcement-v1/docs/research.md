# 现状研究：PR 配额纠正

## 已验证现状

- merge commit `4adb93d` 引入了 `task_pr_bindings`、migration 5/6、`compareAndBindTaskPr()`、`TaskPrState`、worker dispatch terminal gate 和 `PR 配额 0..1` 规范。
- 同一提交也修复了另一个独立问题：repo evidence 使用 `delivery-ready`，PR terminal 后的 lifecycle 事实不再要求写回 task/wiki/report。
- 自动第二 PR 的根因是 post-terminal repo writeback/closeout 需求；数字配额不是消除该根因的必要条件。

## 必须区分

1. **应撤销**：PR 数量上限、task-level identity、跨 run binding、legacy migration、replacement/extra PR 硬禁令。
2. **应保留**：不得自动为 merge/cleanup/refresh/publish/deploy 状态写回创建 PR；这些事实保存在外部 lifecycle。
3. **仍可默认**：一个正在开发的 open PR 继续在同一 branch 更新，但这只是常规流程，不是不可覆盖配额。

## 未验证项

- 无领域或权威主张；实现后由 routine regression 和静态扫描验证。
