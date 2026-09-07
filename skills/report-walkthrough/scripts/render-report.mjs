#!/usr/bin/env node

import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadReportDataSchema, resolveInputFile, validateReportData } from './report-data-validation.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(scriptDir, '..', 'templates', 'report-walkthrough.html');
const outputNames = ['report-walkthrough.html', 'report-walkthrough.md', 'pr-body.md'];

function usage() {
  return `Usage:\n  node skills/report-walkthrough/scripts/render-report.mjs --input <report-data.json> [--check]\n\n--check validates and renders in memory without writing files.\n`;
}

function parseArgs(argv) {
  const result = { input: '', check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') return { help: true };
    if (argument === '--check') {
      result.check = true;
      continue;
    }
    if (argument === '--input') {
      result.input = argv[index + 1] ?? '';
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  if (!result.input) throw new Error('Missing required --input');
  return result;
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
  return String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('*', '\\*')
    .replaceAll('_', '\\_')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('|', '\\|');
}

function values(value) {
  return Array.isArray(value) ? value : [];
}

function htmlList(items, emptyText) {
  return items.length === 0
    ? `<p class="empty">${html(emptyText)}</p>`
    : `<ul>${items.map((item) => `<li>${html(item)}</li>`).join('')}</ul>`;
}

function markdownList(items, emptyText) {
  return items.length === 0 ? `- ${markdown(emptyText)}` : items.map((item) => `- ${markdown(item)}`).join('\n');
}

function evidenceReference(item, output) {
  if (item.url) return output === 'html' ? `<a href="${html(item.url)}">${html(item.url)}</a>` : markdown(item.url);
  if (item.locator) return output === 'html' ? `<code>${html(item.locator)}</code>` : `\`${markdown(item.locator)}\``;
  return '';
}

function evidenceHtml(items) {
  if (items.length === 0) return '<p class="empty">No evidence entries were supplied.</p>';
  const rows = items.map((item) => `<tr><td>${html(item.label)}</td><td><span class="pill status-${html(item.status)}">${html(item.status)}</span></td><td>${html(item.detail ?? '')}</td><td>${evidenceReference(item, 'html')}</td></tr>`).join('');
  return `<table><thead><tr><th>Evidence</th><th>Status</th><th>Detail</th><th>Reference</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function risksHtml(items) {
  if (items.length === 0) return '<p class="empty">No additional risks were supplied.</p>';
  return `<ul>${items.map((item) => `<li><strong>${html(item.severity ?? 'unspecified')}</strong> - ${html(item.summary)}${item.mitigation ? `<br><span class="muted">Mitigation: ${html(item.mitigation)}</span>` : ''}</li>`).join('')}</ul>`;
}

function applyTemplate(template, replacements) {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) output = output.replaceAll(`{{${key}}}`, value);
  return output;
}

export function renderHtml(data, template) {
  const scope = data.scope ?? {};
  const preview = data.render?.url ? `<p>Preview: <a href="${html(data.render.url)}">${html(data.render.url)}</a></p>` : '';
  return applyTemplate(template, {
    DOCUMENT_TITLE: html(data.title),
    KICKER: html(data.render?.kicker ?? 'Review walkthrough'),
    TITLE: html(data.title),
    SUMMARY: html(data.summary).replaceAll('\n', '<br>'),
    STATUS: html(data.status),
    REVIEWER: html(data.render?.reviewer ?? 'Not specified'),
    PREVIEW: preview,
    SCOPE_INCLUDED: htmlList(values(scope.included), 'No included scope was supplied.'),
    SCOPE_EXCLUDED: htmlList(values(scope.excluded), 'No excluded scope was supplied.'),
    CHANGES: htmlList(values(data.changes), 'No changes were supplied.'),
    DECISIONS: htmlList(values(data.decisions), 'No decisions were supplied.'),
    EVIDENCE: evidenceHtml(values(data.evidence)),
    RISKS: risksHtml(values(data.risks)),
    NEXT_STEPS: htmlList(values(data.nextSteps), 'No next steps were supplied.'),
  });
}

function evidenceMarkdown(items) {
  if (items.length === 0) return '- No evidence entries were supplied.';
  const header = '| Evidence | Status | Detail | Reference |\n|---|---|---|---|';
  const rows = items.map((item) => `| ${markdown(item.label)} | ${markdown(item.status)} | ${markdown(item.detail ?? '')} | ${evidenceReference(item, 'markdown')} |`);
  return [header, ...rows].join('\n');
}

function risksMarkdown(items) {
  if (items.length === 0) return '- No additional risks were supplied.';
  return items.map((item) => `- **${markdown(item.severity ?? 'unspecified')}** - ${markdown(item.summary)}${item.mitigation ? `; mitigation: ${markdown(item.mitigation)}` : ''}`).join('\n');
}

export function renderMarkdown(data, { prBody = false } = {}) {
  const scope = data.scope ?? {};
  const prefix = prBody ? '> Generated from the same standalone report data. This document does not prove checks, review, merge, release, or deployment status.\n\n' : '';
  const preview = data.render?.url ? `\n- Preview: ${markdown(data.render.url)}` : '';
  return `${prefix}# ${markdown(data.title)}\n\n- Status: \`${markdown(data.status)}\`\n- Reviewer: ${markdown(data.render?.reviewer ?? 'Not specified')}${preview}\n\n${markdown(data.summary)}\n\n## Scope\n\n### Included\n\n${markdownList(values(scope.included), 'No included scope was supplied.')}\n\n### Excluded\n\n${markdownList(values(scope.excluded), 'No excluded scope was supplied.')}\n\n## Changes\n\n${markdownList(values(data.changes), 'No changes were supplied.')}\n\n## Decisions\n\n${markdownList(values(data.decisions), 'No decisions were supplied.')}\n\n## Evidence\n\n${evidenceMarkdown(values(data.evidence))}\n\n## Risks and limits\n\n${risksMarkdown(values(data.risks))}\n\n## Next steps\n\n${markdownList(values(data.nextSteps), 'No next steps were supplied.')}\n`;
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
  const configured = process.env.REPORT_WALKTHROUGH_FAIL_AT;
  if (!configured) return;
  if (process.env.NODE_ENV !== 'test') throw new Error('REPORT_WALKTHROUGH_FAIL_AT is test-only');
  if (configured === point) throw new Error(`Injected render failure: ${point}`);
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
    if (rollbackErrors.length > 0) throw new AggregateError([error, ...rollbackErrors], 'Render failed and rollback was incomplete');
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
  const inputPath = resolveInputFile(args.input);
  const [template, source] = await Promise.all([readFile(templatePath, 'utf8'), readFile(inputPath, 'utf8')]);
  const data = JSON.parse(source);
  const errors = validateReportData(data, loadReportDataSchema());
  if (errors.length > 0) throw new Error(`report-data.json validation failed:\n- ${errors.join('\n- ')}`);
  const outputs = {
    'report-walkthrough.html': renderHtml(data, template),
    'report-walkthrough.md': renderMarkdown(data),
    'pr-body.md': renderMarkdown(data, { prBody: true }),
  };
  if (!args.check) await writeTransaction(dirname(inputPath), outputs);
  process.stdout.write(`${args.check ? 'CHECK_OK' : 'RENDER_OK'} ${data.title}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`ERROR ${error.message}\n`);
    process.exitCode = 1;
  });
}
