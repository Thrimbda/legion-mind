# Configure Legion Pi model access - 任务清单

## 快速恢复

**当前阶段**: 阶段 5 - Delivery closeout
**当前检查项**: Generate walkthrough, write Wiki disposition, and complete PR lifecycle
**进度**: 4/5 任务完成
---

## 阶段 1: Design gate ✅ COMPLETE

- [x] Write and independently review the Standard RFC for model policy ownership and credential boundaries | 验收: RFC defines schema, merge/overwrite semantics, runtime auth references, OAuth flow, verification, and rollback; independent review returns PASS
---

## 阶段 2: Implementation ✅ COMPLETE

- [x] Implement the narrow manifest model policy and setup lifecycle with regression coverage | 验收: Generated settings and validation tests enforce only the approved fields/patterns and existing setup tests pass
---

## 阶段 3: Runtime configuration ✅ COMPLETE

- [x] Apply model policy, configure non-secret DeepSeek/Kimi references, and complete dedicated Codex OAuth | 验收: Active profile auth/settings have correct non-secret structure and Pi lists the exact approved model set
---

## 阶段 4: Verification and review ✅ COMPLETE

- [x] Verify idempotence, PI WEB default/switch behavior, bounded provider smokes, and secret exclusion | 验收: Independent verify-change and security-aware review-change return PASS with no unresolved blocker
---

## 阶段 5: Delivery closeout ⏳ NOT STARTED

- [ ] Generate walkthrough, write Wiki disposition, and complete PR lifecycle | 验收: PR reaches terminal state, worktree is removed, and main workspace is refreshed without touching existing untracked files ← CURRENT
---

## 发现的新任务

(暂无)
---

*最后更新: 2026-08-19 05:10*
