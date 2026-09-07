---
name: report-walkthrough
description: 当已有事实和证据需要被整理成一致的 HTML、Markdown 与 PR body 审阅材料时使用。输入是 standalone JSON，不要求任何任务系统或阶段产物。
---

# report-walkthrough

从一个数据源确定性生成三份审阅材料。它不补造验证、不决定 Git lifecycle，也不要求 `.legion`、profile、attention 或固定上游文档。

## 使用

1. 将已确认的事实整理为符合 `references/report-data.schema.json` 的 JSON。
2. 运行：

```bash
node skills/report-walkthrough/scripts/render-report.mjs --input <report-data.json>
```

3. 脚本在输入文件目录原子生成：
   - `report-walkthrough.html`
   - `report-walkthrough.md`
   - `pr-body.md`

使用 `--check` 时只校验并在内存中渲染。要修改内容就修改 JSON 后重新生成；不要手工修补派生产物。

## 证据边界

- `complete`、`partial`、`blocked`、`informational` 必须符合现有证据；
- 每项检查单独标明 `pass`、`fail`、`info` 或 `not-run`；
- locator 是可选引用，不因缺少仓库 task 路径而拒绝报告；
- 风险和未验证内容保持可见，不把生成成功冒充实现、review、PR 或发布完成；
- 输入和 URL 不得包含 secret，HTML 内容必须转义。

HTML 需要对外预览时，可独立使用 `pr-html-render`。
