#!/usr/bin/env node

import { access, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillRoot = resolve(scriptDir, '..');
const schemaPath = join(skillRoot, 'references', 'report-data.schema.json');
const templatePath = join(skillRoot, 'templates', 'report-walkthrough.html');
const outputNames = ['report-walkthrough.html', 'report-walkthrough.md', 'pr-body.md'];

function usage() {
  return `用法：
  node skills/report-walkthrough/scripts/render-report.mjs --input <docs/report-data.json> [--check]

参数：
  --input <path>  唯一报告数据文件；产物写入它所在的目录
  --check         只校验并在内存中渲染，不写文件
  --help          显示帮助
`;
}

function parseArgs(argv) {
  const result = { input: '', check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') return { help: true };
    if (argument === '--check') {
      result.check = true;
      continue;
    }
    if (argument === '--input') {
      result.input = argv[index + 1] ?? '';
      index += 1;
      continue;
    }
    throw new Error(`未知参数：${argument}`);
  }
  if (!result.input) throw new Error('缺少必填参数 --input');
  return result;
}

function jsonPointer(root, reference) {
  if (!reference.startsWith('#/')) throw new Error(`只支持本地 schema 引用：${reference}`);
  return reference.slice(2).split('/').reduce((value, token) => {
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    return value?.[key];
  }, root);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function matchesType(value, type) {
  if (type === 'object') return isObject(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'string') return typeof value === 'string';
  if (type === 'boolean') return typeof value === 'boolean';
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'null') return value === null;
  return true;
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateSchema(value, current, root, path = '$', errors = []) {
  if (current === true) return errors;
  if (current === false) {
    errors.push(`${path} 不被 schema 允许`);
    return errors;
  }
  if (current.$ref) {
    const target = jsonPointer(root, current.$ref);
    if (!target) throw new Error(`schema 引用不存在：${current.$ref}`);
    return validateSchema(value, target, root, path, errors);
  }

  if (current.const !== undefined && !sameValue(value, current.const)) {
    errors.push(`${path} 必须等于 ${JSON.stringify(current.const)}`);
  }
  if (current.enum && !current.enum.some((candidate) => sameValue(value, candidate))) {
    errors.push(`${path} 必须是 ${current.enum.map((item) => JSON.stringify(item)).join('、')} 之一`);
  }
  if (current.type && !matchesType(value, current.type)) {
    errors.push(`${path} 类型必须是 ${current.type}`);
    return errors;
  }

  for (const child of current.allOf ?? []) validateSchema(value, child, root, path, errors);
  if (current.anyOf) {
    const valid = current.anyOf.some((child) => validateSchema(value, child, root, path, []).length === 0);
    if (!valid) errors.push(`${path} 不满足 anyOf 中的任何分支`);
  }
  if (current.oneOf) {
    const count = current.oneOf.filter((child) => validateSchema(value, child, root, path, []).length === 0).length;
    if (count !== 1) errors.push(`${path} 必须且只能满足 oneOf 的一个分支`);
  }
  if (current.not && validateSchema(value, current.not, root, path, []).length === 0) {
    errors.push(`${path} 命中了禁止分支`);
  }
  if (current.if) {
    const branch = validateSchema(value, current.if, root, path, []).length === 0 ? current.then : current.else;
    if (branch) validateSchema(value, branch, root, path, errors);
  }

  if (typeof value === 'string') {
    if (current.minLength !== undefined && [...value].length < current.minLength) errors.push(`${path} 不能为空`);
    if (current.maxLength !== undefined && [...value].length > current.maxLength) errors.push(`${path} 超过长度上限 ${current.maxLength}`);
    if (current.pattern && !(new RegExp(current.pattern, 'u')).test(value)) errors.push(`${path} 格式不合法`);
  }

  if (Array.isArray(value)) {
    if (current.minItems !== undefined && value.length < current.minItems) errors.push(`${path} 至少需要 ${current.minItems} 项`);
    if (current.maxItems !== undefined && value.length > current.maxItems) errors.push(`${path} 最多允许 ${current.maxItems} 项`);
    if (current.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) errors.push(`${path} 不允许重复项`);
    }
    if (current.items) value.forEach((item, index) => validateSchema(item, current.items, root, `${path}[${index}]`, errors));
    if (current.contains) {
      const count = value.filter((item, index) => validateSchema(item, current.contains, root, `${path}[${index}]`, []).length === 0).length;
      const minimum = current.minContains ?? 1;
      const maximum = current.maxContains ?? Number.POSITIVE_INFINITY;
      if (count < minimum || count > maximum) errors.push(`${path} 没有满足 contains 要求的项目`);
    }
  }

  if (isObject(value)) {
    for (const key of current.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push(`${path}.${key} 为必填字段`);
    }
    for (const [key, child] of Object.entries(current.properties ?? {})) {
      if (Object.hasOwn(value, key)) validateSchema(value[key], child, root, `${path}.${key}`, errors);
    }
    if (current.additionalProperties === false) {
      const allowed = new Set(Object.keys(current.properties ?? {}));
      for (const key of Object.keys(value)) {
        if (!allowed.has(key)) errors.push(`${path}.${key} 是未声明字段`);
      }
    }
  }
  return errors;
}

function walkStrings(value, visitor, path = '$') {
  if (typeof value === 'string') {
    visitor(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, visitor, `${path}[${index}]`));
    return;
  }
  if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) walkStrings(item, visitor, `${path}.${key}`);
  }
}

function semanticErrors(data) {
  const errors = [];
  walkStrings(data, (value, path) => {
    if (value.includes('—')) errors.push(`${path} 含禁止的 em dash 字符`);
  });
  for (const [index, claim] of data.claims.entries()) {
    if ((claim.expertise === 'domain' || claim.expertise === 'authority') && claim.verifier?.kind !== claim.expertise) {
      errors.push(`$.claims[${index}].verifier.kind 必须与 expertise 一致`);
    }
  }
  if (data.render.url) {
    try {
      const url = new URL(data.render.url);
      if (url.protocol !== 'https:' || url.username || url.password) errors.push('$.render.url 只允许无凭据的 https URL');
    } catch {
      errors.push('$.render.url 不是有效 URL');
    }
  }
  return errors;
}

function html(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function markdown(value) {
  let escaped = String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\\', '\\\\');
  for (const marker of ['|', '`', '*', '_', '[', ']', '(', ')', '{', '}', '#', '!', '+', '-', '.', '~']) {
    escaped = escaped.replaceAll(marker, `\\${marker}`);
  }
  return escaped
    .replaceAll('\r\n', '<br>')
    .replaceAll('\n', '<br>');
}

function htmlList(items, ordered = false) {
  if (items.length === 0) return '<p class="empty">无。</p>';
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${items.map((item) => `<li>${html(item)}</li>`).join('')}</${tag}>`;
}

function markdownList(items, checked = false) {
  if (items.length === 0) return '- 无';
  return items.map((item) => `- ${checked ? '[ ] ' : ''}${markdown(item)}`).join('\n');
}

function htmlTable(headers, rows) {
  const head = headers.map((header) => `<th scope="col">${html(header)}</th>`).join('');
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.map(markdown).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(markdown).join(' | ')} |`),
  ].join('\n');
}

function claimDetails(claim) {
  if (claim.status === 'INCONCLUSIVE') return `证据缺口：${claim.evidenceGap}；升级路径：${claim.escalation}`;
  if (claim.status === 'DEFERRED') return `触发条件：${claim.trigger}；届时方法：${claim.method}；停止条件：${claim.stopCondition}`;
  return `选项：${claim.options.join(' / ')}；推荐：${claim.recommendation}；取舍：${claim.tradeoff}；决定状态：${claim.decisionStatus}；decision owner：${claim.decisionOwner}`;
}

function renderHtml(data, template) {
  const claimRows = data.claims.map((claim) => [
    `<code>${html(claim.claimId)}</code><br>${html(claim.statement)}`,
    `${html(claim.status)}<br>${html(claim.expertise)}`,
    html(claim.impact),
    `${html(claim.owner)}<br>${html(claimDetails(claim))}`,
    html(claim.mitigation),
    `<code>${html(claim.evidence)}</code>`,
  ]);
  const verifierRows = data.claims.filter((claim) => claim.verifier).map((claim) => {
    const verifier = claim.verifier;
    return [
      `<code>${html(claim.claimId)}</code>`,
      `<code>${html(verifier.source)}</code><br>${html(verifier.version)}`,
      html(verifier.method),
      `${html(verifier.independence)}：${html(verifier.independenceReason)}`,
      html(verifier.confidence),
      `${html(verifier.conclusion)}<br>未证明：${html(verifier.unproven)}`,
      `${html(verifier.residualUncertainty)}<br>失效条件：${html(verifier.failureConditions)}`,
      `<code>${html(verifier.rawEvidence)}</code>`,
    ];
  });
  const renderUrl = data.render.url
    ? `<p>预览：<a href="${html(data.render.url)}" rel="noopener noreferrer">${html(data.render.url)}</a></p>`
    : '';
  const replacements = {
    DOCUMENT_TITLE: html(`${data.task.title} | 交付审阅`),
    KICKER: html(`${data.task.id} · 交付审阅`),
    TASK_TITLE: html(data.task.title),
    PURPOSE: html(data.task.purpose),
    REVIEWER: html(data.task.reviewer),
    PROFILE: html(data.profile),
    STAGE_CONCLUSION: html(data.stageConclusion),
    REVIEW_STATUS: html(data.reviewStatus),
    ATTENTION_LEVEL: html(data.attention.level),
    HUMAN_ACTION: html(data.attention.humanAction),
    STOP_POINT: html(data.attention.stopPoint ?? data.attention.lifecycleBoundary),
    FINAL_STATE: html(data.final.state),
    SUMMARY: `<p>${html(data.summary)}</p>`,
    ATTENTION: `<p>${html(data.attention.summary)}</p><p><strong>当前唯一人类动作：</strong>${html(data.attention.humanAction)}</p><p class="boundary"><strong>lifecycle 边界：</strong>${html(data.attention.lifecycleBoundary)}</p><p><strong>证据：</strong>${data.attention.evidence.map((item) => `<code>${html(item)}</code>`).join('、')}</p>`,
    CLAIMS: claimRows.length === 0 ? '<p class="empty">当前证据未登记需要单独聚合的未解决 claim。</p>' : htmlTable(['主张', '状态 / 门槛', '影响', '负责人 / 状态字段', '当前缓解', '证据'], claimRows),
    VERIFIERS: verifierRows.length === 0 ? '<p class="empty">当前证据未登记领域或权威 verifier。</p>' : htmlTable(['claim-id', '来源 / 版本', '方法', '独立性', '置信度', '结论 / 未证明', '残余不确定性', '原始证据'], verifierRows),
    SCOPE: `<h3>范围内</h3>${htmlList(data.scope.included)}<h3>范围外</h3>${htmlList(data.scope.excluded)}`,
    EVIDENCE: htmlTable(['证据', '类型', '状态', 'locator'], data.evidence.map((item) => [html(item.label), html(item.kind), html(item.status), `<code>${html(item.locator)}</code>`])),
    DELIVERY_PATH: htmlList(data.deliveryPath, true),
    CHANGES: htmlList(data.changes),
    VERIFICATION: htmlTable(['检查', '状态', '证据'], data.verification.map((item) => [html(item.label), html(item.status), `<code>${html(item.evidence)}</code>`])),
    RISKS: data.risks.length === 0 ? '<p class="empty">当前证据未登记额外风险。</p>' : htmlTable(['风险', '缓解'], data.risks.map((item) => [html(item.risk), html(item.mitigation)])),
    CHECKLIST: htmlList(data.checklist),
    RENDER: `<p><strong>PR-backed：</strong>${data.render.prBacked ? '是' : '否'}</p><p><strong>状态：</strong>${html(data.render.state)}</p><p>${html(data.render.note)}</p>${renderUrl}`,
    FINAL: `<p><strong>当前状态：</strong>${html(data.final.state)}</p><p><strong>下一阶段：</strong>${html(data.final.nextStage)}</p><p class="boundary">${html(data.final.lifecycleDisclaimer)}</p>`,
  };
  const rendered = template.replace(/\{\{([A-Z_]+)\}\}/g, (marker, key) => {
    if (!Object.hasOwn(replacements, key)) throw new Error(`HTML 模板含未知占位符：${marker}`);
    return replacements[key];
  });
  if (/\{\{[A-Z_]+\}\}/.test(rendered)) throw new Error('HTML 模板仍有未替换占位符');
  const required = ['<!doctype html>', 'lang="zh-CN"', 'name="viewport"', '<main>', '<nav ', '<section ', '<table>', 'oklch(', '@media (max-width:', '@media print'];
  for (const token of required) if (!rendered.includes(token)) throw new Error(`HTML 质量门缺少：${token}`);
  for (const forbidden of ['#000', '#fff', 'background-clip: text', '<script', '<link', '<img', '<iframe', '—']) {
    if (rendered.toLowerCase().includes(forbidden.toLowerCase())) throw new Error(`HTML 质量门禁止：${forbidden}`);
  }
  return `${rendered.trimEnd()}\n`;
}

function claimMarkdownRows(data) {
  return data.claims.map((claim) => [claim.claimId, `${claim.statement}；${claim.status}；${claim.expertise}`, claim.impact, `${claim.owner}；${claimDetails(claim)}`, claim.mitigation, claim.evidence]);
}

function verifierMarkdownRows(data) {
  return data.claims.filter((claim) => claim.verifier).map((claim) => {
    const verifier = claim.verifier;
    return [claim.claimId, `${verifier.source}；${verifier.version}`, verifier.method, `${verifier.independence}：${verifier.independenceReason}`, verifier.confidence, `${verifier.conclusion}；未证明：${verifier.unproven}`, `${verifier.residualUncertainty}；失效条件：${verifier.failureConditions}`, verifier.rawEvidence];
  });
}

function renderMarkdown(data, { prBody = false } = {}) {
  const title = prBody
    ? (data.profile === 'implementation' ? '# 实现交付审查' : '# RFC 审查（仅设计交付）')
    : `# ${markdown(data.task.title)}：交付审阅指南`;
  const disclaimer = prBody
    ? `> ${markdown(data.final.lifecycleDisclaimer)}\n> 本文只是 PR 创建或更新输入，不证明 checks、review、merge、cleanup 或主工作区刷新已完成。\n`
    : '';
  const claims = claimMarkdownRows(data);
  const verifiers = verifierMarkdownRows(data);
  const renderUrl = data.render.url ? `\n- 预览 URL：${markdown(data.render.url)}` : '';
  return `${title}

${disclaimer}
## 交付视角与结论

- Profile：\`${data.profile}\`
- 阶段结论：\`${data.stageConclusion}\`
- 审查状态：\`${data.reviewStatus}\`
- 最终状态：${markdown(data.final.state)}

${markdown(data.summary)}

## 人类注意力与当前动作

- 聚合注意力：\`${data.attention.level}\`
- 当前唯一人类动作：${markdown(data.attention.humanAction)}
- lifecycle 边界：${markdown(data.attention.lifecycleBoundary)}
- 停止点：${markdown(data.attention.stopPoint ?? data.attention.lifecycleBoundary)}
- 摘要：${markdown(data.attention.summary)}
- 证据：${data.attention.evidence.map(markdown).join('、')}

## 未解决的认知状态

${claims.length === 0 ? '当前证据未登记需要单独聚合的未解决 claim。' : markdownTable(['claim-id', '主张 / 状态 / 门槛', '影响', '负责人 / 状态字段', '当前缓解', '证据'], claims)}

## 领域验证摘要

${verifiers.length === 0 ? '当前证据未登记领域或权威 verifier。' : markdownTable(['claim-id', '来源 / 版本', '方法', '独立性', '置信度', '结论 / 未证明', '残余不确定性', '原始证据'], verifiers)}

## 范围

### 范围内

${markdownList(data.scope.included)}

### 范围外

${markdownList(data.scope.excluded)}

## 证据地图

${markdownTable(['证据', '类型', '状态', 'locator'], data.evidence.map((item) => [item.label, item.kind, item.status, item.locator]))}

## 交付路径

${data.deliveryPath.map((item, index) => `${index + 1}. ${markdown(item)}`).join('\n')}

## 变更与决定

${markdownList(data.changes)}

## 验证与审查状态

${markdownTable(['检查', '状态', '证据'], data.verification.map((item) => [item.label, item.status, item.evidence]))}

## 风险与限制

${data.risks.length === 0 ? '- 当前证据未登记额外风险。' : data.risks.map((item) => `- ${markdown(item.risk)}；缓解：${markdown(item.mitigation)}`).join('\n')}

## 审阅清单

${markdownList(data.checklist, true)}

## 渲染交接

- PR-backed：${data.render.prBacked ? '是' : '否'}
- 状态：\`${data.render.state}\`
- 说明：${markdown(data.render.note)}${renderUrl}

## 最终状态与下一阶段

- 当前状态：${markdown(data.final.state)}
- 下一阶段：${markdown(data.final.nextStage)}
- lifecycle 声明：${markdown(data.final.lifecycleDisclaimer)}
`;
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function injectedFailure(point) {
  const configured = process.env.LEGION_REPORT_RENDER_FAIL_AT;
  if (!configured) return;
  if (process.env.NODE_ENV !== 'test') throw new Error('LEGION_REPORT_RENDER_FAIL_AT 只能在 NODE_ENV=test 时使用');
  if (configured === point) throw new Error(`测试注入失败：${point}`);
}

async function writeTransaction(outputDir, outputs) {
  await mkdir(outputDir, { recursive: true });
  const transactionDir = await mkdtemp(join(outputDir, '.report-render-'));
  const installed = [];
  const backups = [];
  try {
    for (const name of outputNames) await writeFile(join(transactionDir, `new-${name}`), outputs[name], 'utf8');
    injectedFailure('after-temp');

    for (const name of outputNames) {
      const target = join(outputDir, name);
      if (await exists(target)) {
        const backup = join(transactionDir, `old-${name}`);
        await rename(target, backup);
        backups.push({ target, backup });
      }
    }
    injectedFailure('after-backup');

    for (const name of outputNames) {
      const target = join(outputDir, name);
      await rename(join(transactionDir, `new-${name}`), target);
      installed.push(target);
      if (installed.length === 1) injectedFailure('after-first-install');
    }
  } catch (error) {
    const rollbackErrors = [];
    for (const target of installed.reverse()) {
      try { await rm(target, { force: true }); } catch (rollbackError) { rollbackErrors.push(rollbackError); }
    }
    for (const { target, backup } of backups.reverse()) {
      try { await rename(backup, target); } catch (rollbackError) { rollbackErrors.push(rollbackError); }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError([error, ...rollbackErrors], '报告生成失败，且旧产物恢复不完整');
    }
    throw error;
  } finally {
    await rm(transactionDir, { recursive: true, force: true });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(usage());
    return;
  }
  const executionRoot = await realpath(process.cwd());
  const inputPath = await realpath(resolve(args.input));
  const inputRelative = relative(executionRoot, inputPath);
  if (inputRelative.startsWith('..') || isAbsolute(inputRelative)) {
    throw new Error('输入与输出目录必须位于当前仓库内');
  }
  const [schemaSource, template, inputSource] = await Promise.all([
    readFile(schemaPath, 'utf8'),
    readFile(templatePath, 'utf8'),
    readFile(inputPath, 'utf8'),
  ]);
  const schema = JSON.parse(schemaSource);
  const data = JSON.parse(inputSource);
  const errors = [...validateSchema(data, schema, schema), ...semanticErrors(data)];
  if (errors.length > 0) throw new Error(`report-data.json 校验失败：\n- ${errors.join('\n- ')}`);

  const outputs = {
    'report-walkthrough.html': renderHtml(data, template),
    'report-walkthrough.md': renderMarkdown(data),
    'pr-body.md': renderMarkdown(data, { prBody: true }),
  };
  if (!args.check) await writeTransaction(dirname(inputPath), outputs);
  process.stdout.write(`${args.check ? 'CHECK_OK' : 'RENDER_OK'} ${data.task.id}\n`);
}

main().catch((error) => {
  process.stderr.write(`ERROR ${error.message}\n`);
  process.exitCode = 1;
});
