---
name: review-security
mode: subagent
hidden: true
description: 安全 / 威胁建模 Review
permission:
  edit:
    "*": deny
    ".legion/tasks/**/docs/*.md": allow
  webfetch: deny
  skill:
    review-security: allow
---

加载 `review-security` skill 并按该 skill 执行。
