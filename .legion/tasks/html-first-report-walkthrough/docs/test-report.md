# Test Report: HTML-first report-walkthrough output

## 结论

PASS。

本次验证覆盖 `report-walkthrough` skill 的 HTML-first 输出协议、HTML template reference、description 触发关键词、实际 HTML artifact smoke check、格式检查和仓库 regression。所有已执行验证均通过。

## 验证范围

- `skills/report-walkthrough/SKILL.md`
- `skills/report-walkthrough/references/TEMPLATE_REPORT_WALKTHROUGH_HTML.md`
- 仓库 regression 测试：`tests/regression/*.test.ts`

## 命令与结果

### 1. HTML-first skill 文本断言

**命令**:

```bash
python - <<'PY'
from pathlib import Path
root = Path('.')
skill = (root/'skills/report-walkthrough/SKILL.md').read_text()
template = (root/'skills/report-walkthrough/references/TEMPLATE_REPORT_WALKTHROUGH_HTML.md').read_text()
description_line = next(line for line in skill.splitlines() if line.startswith('description:'))
checks = [
    ('description mentions html artifact', 'docs/report-walkthrough.html' in description_line),
    ('skill declares html artifact', 'docs/report-walkthrough.html' in skill),
    ('skill declares html-first', 'HTML-first' in skill),
    ('skill keeps markdown fallback', 'compact source / fallback' in skill),
    ('skill has communication pass', '## Communication Pass' in skill),
    ('skill mentions clean-doc reader logic', 'Reader:' in skill and 'Evidence selection' in skill),
    ('skill has html requirements', '## HTML Walkthrough Requirements' in skill),
    ('skill bans external resources', '不依赖外部 CDN' in skill or 'external' in skill),
    ('skill requires OKLCH', 'OKLCH' in skill),
    ('skill requires print-friendly', 'print-friendly' in skill),
    ('skill references html template', 'TEMPLATE_REPORT_WALKTHROUGH_HTML.md' in skill),
    ('template has required sections', '## Required sections' in template),
    ('template has quality gate', '## HTML quality gate' in template),
    ('template has absolute bans', '## Absolute bans' in template),
    ('template has minimal skeleton', '<!doctype html>' in template and '{{taskTitle}}' in template),
    ('template has validation checklist', '## Validation checklist' in template),
    ('template requires no external resources', '外部网络资源' in template),
    ('template requires evidence map', 'Evidence Map' in template),
    ('template requires delivery path', 'Delivery Path' in template),
]
failed = [name for name, ok in checks if not ok]
for name, ok in checks:
    print(('PASS' if ok else 'FAIL') + ' - ' + name)
if failed:
    raise SystemExit('failed assertions: ' + ', '.join(failed))
PY
```

**结果**: PASS。

通过断言：

- skill 声明 `docs/report-walkthrough.html` 为输出 artifact。
- frontmatter description 包含 `docs/report-walkthrough.html`，避免 HTML walkthrough 请求触发不足。
- skill 声明 HTML-first，并保留 Markdown fallback。
- skill 包含 communication pass、clean-doc reader/evidence 逻辑和 HTML requirements。
- skill 要求 standalone、OKLCH、print-friendly 和 HTML template reference。
- template 包含 required sections、quality gate、absolute bans、minimal skeleton、validation checklist、evidence map 和 delivery path。

### 2. diff whitespace 检查

**命令**:

```bash
git diff --check
```

**结果**: PASS。命令无输出。

### 3. 仓库 regression 测试

**命令**:

```bash
npm run test:regression
```

**结果**: PASS。

输出摘要：

```text
tests 10
pass 10
fail 0
cancelled 0
skipped 0
todo 0
duration_ms 1432.727386
```

## 为什么这些验证可信

- 文本断言直接覆盖 RFC acceptance：HTML-first 输出、Markdown fallback、clean-doc selection、impeccable quality gate、HTML template reference 和 evidence path。
- `git diff --check` 覆盖本次 Markdown 文档和 template 的基本格式风险。
- `npm run test:regression` 覆盖当前仓库 skill surface 与 setup/CLI regression，确认新增 reference 不破坏现有测试面。

## HTML artifact smoke check

生成 `docs/report-walkthrough.html` 后执行追加 smoke check。

**命令**:

```bash
python - <<'PY'
from html.parser import HTMLParser
from pathlib import Path
path = Path('.legion/tasks/html-first-report-walkthrough/docs/report-walkthrough.html')
text = path.read_text()
HTMLParser().feed(text)
checks = [
    ('doctype present', text.lstrip().lower().startswith('<!doctype html>')),
    ('language set', 'lang="zh-CN"' in text),
    ('viewport present', 'name="viewport"' in text),
    ('oklch colors used', 'oklch(' in text),
    ('no black white hex', '#000' not in text and '#fff' not in text),
    ('no gradient text', 'background-clip: text' not in text),
    ('no side stripe css', 'border-left' not in text and 'border-right' not in text),
    ('no em dash', '—' not in text),
    ('no external resources', 'http://' not in text and 'https://' not in text and '<script' not in text),
    ('evidence map present', 'Evidence Map' in text),
    ('delivery path present', 'Delivery Path' in text),
    ('final state present', 'Final State / Next Stage' in text),
    ('print css present', '@media print' in text),
]
failed = [name for name, ok in checks if not ok]
for name, ok in checks:
    print(('PASS' if ok else 'FAIL') + ' - ' + name)
if failed:
    raise SystemExit('failed assertions: ' + ', '.join(failed))
PY
```

**结果**: PASS。所有 13 项 HTML artifact smoke assertions 均通过。

## 未执行或跳过项

无。

## 结论与下一步

验证通过。交给 `review-change` 做只读交付审查。

## 追加验证

审查前发现 frontmatter description 未包含 `docs/report-walkthrough.html` 触发关键词。已补充 description，并重跑 targeted assertions 与 `git diff --check`：

- description mentions html artifact: PASS
- 其余 HTML-first / template assertions: PASS
- `git diff --check`: PASS

## 追加验证 2

生成 HTML walkthrough artifact 后，执行 HTML smoke check 与 `git diff --check`：

- HTML parser smoke: PASS
- doctype / lang / viewport: PASS
- OKLCH / no `#000` / no `#fff`: PASS
- no gradient text / no side-stripe CSS / no em dash / no external resources: PASS
- Evidence Map / Delivery Path / Final State / print CSS: PASS
- `git diff --check`: PASS
