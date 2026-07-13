/**
 * 解析阶段文档的唯一当前 Verdict。
 *
 * 历史叙述中的 PASS/FAIL 不参与判断；只有唯一的二级标题 `## Verdict`
 * 后第一条有效内容可以给出当前结论。
 */
export function parseCurrentVerdict(source) {
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const headings = [];
  let fence = null;
  let headingCommentOpen = false;

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trimStart();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fence) {
      if (fenceMatch) {
        const marker = fenceMatch[1];
        if (marker[0] === fence[0] && marker.length >= fence.length && trimmed.slice(marker.length).trim() === '') {
          fence = null;
        }
      }
      continue;
    }
    if (headingCommentOpen) {
      if (lines[index].includes('-->')) headingCommentOpen = false;
      continue;
    }
    const commentStart = lines[index].indexOf('<!--');
    if (commentStart !== -1) {
      if (lines[index].indexOf('-->', commentStart + 4) === -1) headingCommentOpen = true;
      continue;
    }
    if (fenceMatch) {
      const marker = fenceMatch[1];
      fence = marker;
      continue;
    }
    if (lines[index].match(/^## Verdict\s*$/)) headings.push(index);
  }

  if (headings.length === 0) return { verdict: null, error: '缺少唯一的 `## Verdict` 二级标题' };
  if (headings.length !== 1) return { verdict: null, error: '存在多个 `## Verdict` 二级标题' };

  let commentOpen = false;
  for (let index = headings[0] + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (commentOpen) {
      const close = line.indexOf('-->');
      if (close === -1) continue;
      commentOpen = false;
      if (line.slice(close + 3).trim() === '') continue;
      return { verdict: null, error: '`## Verdict` 后的首条有效内容必须单独为 PASS 或 FAIL' };
    }
    if (line.trim() === '') continue;
    const trimmed = line.trimStart();
    if (trimmed.startsWith('<!--')) {
      const close = trimmed.indexOf('-->');
      if (close === -1) {
        commentOpen = true;
        continue;
      }
      if (trimmed.slice(close + 3).trim() === '') continue;
      return { verdict: null, error: '`## Verdict` 后的首条有效内容必须单独为 PASS 或 FAIL' };
    }
    if (line === 'PASS' || line === 'FAIL') return { verdict: line, error: null };
    return { verdict: null, error: '`## Verdict` 后的首条有效内容必须单独为 PASS 或 FAIL' };
  }

  return { verdict: null, error: '`## Verdict` 后缺少 PASS 或 FAIL' };
}

export function currentVerdictIsPass(source) {
  return parseCurrentVerdict(source).verdict === 'PASS';
}
