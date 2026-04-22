---
name: review-change
mode: subagent
hidden: true
description: 统一执行代码与安全 readiness review
permission:
  edit:
    "*": deny
    ".legion/tasks/**/docs/*.md": allow
  webfetch: deny
  skill:
    review-change: allow
---

加载 `review-change` skill 并按该 skill 执行。
