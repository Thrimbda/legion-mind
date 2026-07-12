# Legion CLI 索引

CLI 是 `.legion/tasks/<task-id>/` 的本地文件工具，不拥有 workflow 语义。参数、payload 与错误码以 CLI 自身帮助为唯一真源：

```sh
node --experimental-strip-types skills/legion-workflow/scripts/legion.ts --help
node --experimental-strip-types skills/legion-workflow/scripts/legion.ts <command> --help
```

命令族：`init`、`task create/list`、`status`、`tasks read/update`、`log read/update`、`plan update`、`review list/respond`、`dashboard generate`。新任务主干为 `brainstorm -> task create`；CLI 不从名称推导 `taskId`。

已移除的 proposal/approval、switch/archive、ledger 命令返回 `UNSUPPORTED_COMMAND`。MCP 若存在仅是可选兼容层，不改变 CLI 或 skill 真源。
