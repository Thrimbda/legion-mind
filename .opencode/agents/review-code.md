---
name: review-code
mode: subagent
hidden: true
description: 代码正确性 / 可维护性 Review
permission:
  edit:
    "*": deny
    ".legion/tasks/**/docs/*.md": allow
  webfetch: deny
  skill:
    review-code: allow
---

加载 `review-code` skill 并按该 skill 执行。
