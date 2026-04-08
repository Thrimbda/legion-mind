#!/usr/bin/env node --experimental-strip-types

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { globSync } from 'node:fs';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const allowlisted = new Set([
  'skills/legionmind/references/REF_TOOLS.md',
  'scripts/setup-opencode.ts',
]);

const patterns = [
  'skills/legionmind/**/*.md',
  '.opencode/**/*.md',
  'README.md',
  'scripts/setup-opencode.ts',
];

const banned = [
  /优先使用\s*MCP/,
  /必须通过\s*MCP/,
  /mcp\.legionmind/i,
  /legion_(init|create_task|get_status|read_context|update_context|update_tasks|respond_review)/,
];

function matchBanned(line: string): boolean {
  return banned.some((regex) => regex.test(line));
}

function runSelfTest() {
  const sample = [
    'legion_init should be flagged',
    'legion_init should still be flagged on the next line',
  ];
  const count = sample.filter((line) => matchBanned(line)).length;
  if (count !== 2) {
    throw new Error(`self-test failed: expected 2 hits, got ${count}`);
  }
}

runSelfTest();

const hits: string[] = [];
for (const pattern of patterns) {
  for (const absolute of globSync(pattern, { cwd: repoRoot, withFileTypes: false })) {
    if (allowlisted.has(absolute)) {
      continue;
    }
    const content = readFileSync(resolve(repoRoot, absolute), 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (/historical compatibility|历史兼容|兼容信息/i.test(line)) {
        return;
      }
      if (matchBanned(line)) {
        hits.push(`${absolute}:${index + 1}: ${line.trim()}`);
      }
    });
  }
}

if (hits.length > 0) {
  console.error(hits.join('\n'));
  process.exit(1);
}

console.log('OK');
