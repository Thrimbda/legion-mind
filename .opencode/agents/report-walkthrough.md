---
name: report-walkthrough
mode: subagent
hidden: true
description: 生成 walkthrough 报告与 PR body
permission:
  edit:
    "*": deny
    ".legion/tasks/**/docs/*.md": allow
  webfetch: deny
  skill:
    report-walkthrough: allow
---

加载 `report-walkthrough` skill 并按该 skill 执行。
