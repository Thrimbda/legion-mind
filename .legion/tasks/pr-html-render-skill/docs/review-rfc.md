# RFC Review: pr-html-render skill 与 report-walkthrough 渲染交接

## 结论

PASS

RFC 足够支撑实现。设计明确选择“新增独立 `pr-html-render` skill，并让 `report-walkthrough` 在 HTML artifact 完成后交接渲染路径”，避免把发布/预览能力塞回 walkthrough 阶段，也没有把 PR lifecycle 扩张成第四种 Legion 模式。

## Blocking findings

无。

## 审查要点

### Scope 清晰

- 新 skill 负责已有 HTML artifact 的 rendered preview 路径。
- `report-walkthrough` 仍负责生成证据型 HTML artifact。
- `git-worktree-pr` 仍负责 PR 终态、checks/review、cleanup 与主工作区刷新。

这三者职责没有明显重叠，足以进入实现。

### 安全边界可实现

RFC 保留了 zip 中最关键的权限分离规则：PR code build job 只读，publish/comment job 不执行 PR head code，public/fork PR 不默认发布 Pages，敏感报告不发 public Pages。这些规则可以直接写入 `pr-html-render`。

### 验证路径充分

验证计划覆盖：

- `git diff --check`
- `npm run test:regression`
- skill/frontmatter/template/report-walkthrough/setup 的文本 smoke checks

对本次 skill 文档与模板迁移来说，这些检查足以证明交付没有明显 surface drift。

### Rollback 可执行

Rollback 明确列出删除新 skill、回退安装 list/test、回退 `report-walkthrough` 引用。这满足可回滚要求。

## 非阻塞建议

- 实现时避免彻底禁止旧名 `pr-html-report-preview` 出现在文档中；它可以作为 zip 来源或迁移说明出现，但不能作为 active skill name、marker 或 workflow identity。
- `report-walkthrough` 的 return condition 应写成“PR-backed rendered preview path 缺失且没有 explicit bypass/blocker 时，交给 `pr-html-render`”，避免把非 PR 场景也强制渲染。
- 模板中的 `rm -rf` 是 GitHub Actions workflow 内容，不是本地执行命令；保留时建议通过注释强调 cleanup workflow 不 checkout / execute PR code。

## 下一步

进入 `engineer` 阶段，在 worktree 内实现 RFC。
