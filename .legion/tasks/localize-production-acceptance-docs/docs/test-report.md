# 测试报告：生产验收文档中文化

## 结论

PASS。

本次改动是文档/模板/任务记录中文化，没有修改 scheduler runtime code，没有执行 live Linear / GitHub / OpenCode acceptance，也没有使用真实 secret。

## 为什么选择这些验证

- `git diff --check`：确认大规模 Markdown 改写没有 whitespace / patch 格式问题。
- 标题残留扫描：直接验证用户要求的“文档中文化”，确保目标文件中不再残留普通英文标题。
- Fixture scan / dispatch / health / scheduler tests：确认文档改写没有破坏已交付的 scheduler package、fixtures 和命令示例路径。

## 已执行命令

### Markdown diff 检查

```bash
git diff --check
```

结果：PASS。

### 普通英文标题残留检查

对以下目标路径做了标题残留扫描：

- `scheduler/docs/**/*.md`
- `.legion/tasks/prepare-linear-scheduler-production-acceptance/**/*.md`
- `.legion/tasks/localize-production-acceptance-docs/**/*.md`
- `docs/linear-legion-scheduler/production-acceptance-runbook.md`

结果：PASS。未发现 `Purpose`、`Goal`、`Summary`、`Verification`、`Stop Conditions`、`Runbook` 等普通英文标题残留。

说明：命令、路径、env var、JSON/YAML key、状态枚举、labels、URL、代码符号、产品名和必要技术术语按任务契约保留英文。

### Fixture scanner smoke

```bash
npm --prefix scheduler run debug -- scan fixture --fixture tests/fixtures/project.json --db :memory:
```

结果：PASS。

关键观察：ready / skipped / cycles 输出与既有 fixture 语义一致。

### Fixture dispatcher smoke

```bash
npm --prefix scheduler run debug -- dispatch fixture --fixture tests/fixtures/project.json --db .cache/linear-scheduler/localize-fixture.sqlite --parallel-repos legion-mind --global-concurrency 4 --per-repo-concurrency 4
```

结果：PASS。

关键观察：claimed / waiting_for_lock / waiting_for_blocker 输出符合预期；没有启动 workers。

### Health smoke

```bash
npm --prefix scheduler run health -- --db :memory:
```

结果：PASS。输出 `ok: true`，核心 tables 存在，`activeRuns: 0`，`pendingOutbox: 0`。

### Full scheduler regression

```bash
npm --prefix scheduler test
```

结果：PASS。

```text
tests 57
pass 57
fail 0
duration_ms 388.864848
```

## 未执行

- 未执行 live Linear `scan project`。
- 未执行 live GitHub `delivery track --pr-url`。
- 未执行 OpenCode `worker dispatch`。
- 未使用或解密真实 secrets。

这些都不是本次中文化修正的验证范围。
