# Test Report: 全仓库 Skill 中文输出约束

## 结论

PASS。所有目标 skill 均已加入中文输出与文档产物约束，Markdown diff 无 whitespace 问题，现有 regression 全部通过。

## 验证命令

```bash
git diff --check && node --input-type=module -e "import fs from 'node:fs'; import path from 'node:path'; const root='skills'; const files=fs.readdirSync(root,{withFileTypes:true}).filter((d)=>d.isDirectory()).map((d)=>path.join(root,d.name,'SKILL.md')).filter((f)=>fs.existsSync(f)); const failures=[]; for (const f of files) { const s=fs.readFileSync(f,'utf8'); if (!s.includes('## 输出语言与文档产物')) failures.push(f+': missing section'); if (!s.includes('默认用中文')) failures.push(f+': missing default Chinese'); if (!s.includes('文档产物')) failures.push(f+': missing doc artifact term'); } console.log(JSON.stringify({skillFiles: files.length, failures}, null, 2)); if (files.length !== 13 || failures.length) process.exit(1);" && npm run test:regression
```

## 结果摘要

- `git diff --check`：PASS。
- 静态 skill smoke check：PASS，`skillFiles: 13`，`failures: []`。
- `npm run test:regression`：PASS，13 tests passed，0 failed。

## 选择理由

- `git diff --check` 能覆盖 Markdown whitespace 与 patch 格式风险。
- 静态 smoke check 直接证明本任务核心验收：仓库 13 个 `SKILL.md` 均包含“输出语言与文档产物”小节、默认中文约束和文档产物约束。
- regression 测试覆盖安装/验证/打包 surface，能发现 skill 文档修改是否破坏 OpenCode/OpenClaw 管理面或 package 内容。

## 跳过项

- 未为每个 skill 新增单独 subagent pressure eval。本任务是统一文档约束补充，已用 RFC 限定不引入大规模 eval；后续若发现某个 skill 仍不遵守中文输出，可针对该 skill 单独补 eval。

## 原始输出摘录

```text
{
  "skillFiles": 13,
  "failures": []
}

tests 13
pass 13
fail 0
```

## 收口后复验

在生成 walkthrough 与 wiki writeback 后重新执行最终检查：

```bash
git diff --check && <skill static smoke> && <html walkthrough smoke> && npm run test:regression
```

结果：

- `git diff --check`：PASS。
- skill static smoke：PASS，`skillFiles: 13`，`failures: []`。
- HTML walkthrough smoke：PASS，doctype、`lang="zh-CN"`、viewport、required sections、OKLCH、print CSS、无 banned tokens。
- `npm run test:regression`：PASS，13/13。
