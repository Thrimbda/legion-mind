# Legion Wiki

## 这是什么

- `.legion/wiki/**` 是跨任务当前知识层。
- `.legion/tasks/**` 仍然保存任务原始证据；需要过程细节时回到 raw docs。

## 导航

- `patterns.md`：可复用模式、约定、常见坑。
- `maintenance.md`：需要后续独立验证、迁移或清理的开放事项。
- `tasks/`：任务级综合摘要，链接回 raw task docs。
- `log.md`：wiki 层 durable writeback 记录。

## 当前重点

- CLI 相关的 durable 约定见 `patterns.md`。
- `task create` 现在采用 staging + rename 物化模式，见 `patterns.md`。
- `setup-opencode verify --strict` 现在必须校验安装资产内容与 managed ownership，见 `patterns.md` 与 `tasks/harden-strict-verify-integrity.md`。
