---
name: legion-wiki
description: 当仓库已经使用 `.legion/wiki` 作为 Markdown 知识库，需要查询、整理或更新其中的当前决定、模式和维护事项时使用。普通项目或任务状态记录不使用。
---

# legion-wiki

这是 `.legion/wiki` 布局的可选适配能力，不是 Legion 工作流或任务 closeout 阶段。它与 `llm-wiki` 共享“raw evidence 与 durable knowledge 分离”的原则，但可以独立使用。

## 查询

先读 `.legion/wiki/index.md`，再读与问题直接相关的 decisions、patterns、maintenance 或 task summary；只有需要核对来源时才回到 raw 文档。若页面声明 historical 或 superseded，不把它当作当前规则。

## 写回

只有信息跨任务仍然有效、目标页面可判定且证据充分时才写回：

- 当前强约束或架构决定写入 decisions；
- 可复用方法写入 patterns；
- 未完成的维护工作写入 maintenance；
- 导航变化同步 index。

没有 durable knowledge 时直接回答，不创建占位页。用户或宿主未授权写入时保持只读。不要创建任务台账、阶段状态、固定 handoff，或为了记录 PR/发布终态而制造额外提交。

需要调整既有 `.legion/wiki` 布局时，可按需读取 `references/REF_WIKI_LAYOUT.md`、`REF_WRITEBACK_RULES.md` 或 `TEMPLATE_TASK_SUMMARY.md`，并先移除其中与当前宿主不相容的历史假设。
