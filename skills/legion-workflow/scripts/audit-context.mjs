#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../../..');
const manifestPath = resolve(scriptDir, '../references/context-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const shouldCheck = process.argv.includes('--check');

function characters(content) {
  return [...content].length;
}

function readEntry(entry) {
  const absolute = resolve(repoRoot, entry.path);
  if (absolute !== repoRoot && !absolute.startsWith(`${repoRoot}/`)) {
    throw new Error(`路径越界：${entry.path}`);
  }
  const source = readFileSync(absolute, 'utf8');
  return { ...entry, characters: characters(source), source };
}

function percentage(before, after) {
  return Number((((before - after) / before) * 100).toFixed(2));
}

function uniqueEntries(groups) {
  const byPath = new Map();
  for (const entry of groups.flat()) {
    if (byPath.has(entry.path)) throw new Error(`清单路径重复：${entry.path}`);
    byPath.set(entry.path, readEntry(entry));
  }
  return [...byPath.values()];
}

function requiredReferences(entries) {
  const required = new Set();
  for (const entry of entries) {
    for (const line of entry.source.split('\n')) {
      if (!/(?:必须.*(?:读取|遵循)|完整遵循|只认)/.test(line)) continue;
      for (const match of line.matchAll(/`((?:\.\.\/|\.\/)[A-Za-z0-9_./-]+\.md)`/g)) {
        const base = dirname(resolve(repoRoot, entry.path));
        const absolute = resolve(base, match[1]);
        required.add(absolute.slice(repoRoot.length + 1));
      }
    }
  }
  return [...required].sort();
}

const allEntries = uniqueEntries([manifest.hot, manifest.mediumAdditional]);
const hotPathSet = new Set(manifest.hot.map((entry) => entry.path));
const hot = allEntries.filter((entry) => hotPathSet.has(entry.path));
const mediumAdditional = allEntries.filter((entry) => !hotPathSet.has(entry.path));
const mediumPaths = new Set([...hot, ...mediumAdditional].map((entry) => entry.path));
const required = requiredReferences(hot);
const unbudgetedRequiredReferences = required.filter((path) => !mediumPaths.has(path));
const hotCharacters = hot.reduce((sum, entry) => sum + entry.characters, 0);
const mediumClosureCharacters = hotCharacters + mediumAdditional.reduce((sum, entry) => sum + entry.characters, 0);
const fileFailures = [...hot, ...mediumAdditional]
  .filter((entry) => entry.characters > entry.maxCharacters)
  .map((entry) => ({ path: entry.path, characters: entry.characters, maxCharacters: entry.maxCharacters }));
const failures = [
  ...fileFailures.map((item) => `${item.path}: ${item.characters} > ${item.maxCharacters}`),
  ...(hotCharacters > manifest.budgets.hotCharacters ? [`hot: ${hotCharacters} > ${manifest.budgets.hotCharacters}`] : []),
  ...(mediumClosureCharacters > manifest.budgets.mediumClosureCharacters
    ? [`medium: ${mediumClosureCharacters} > ${manifest.budgets.mediumClosureCharacters}`]
    : []),
  ...unbudgetedRequiredReferences.map((path) => `未计入预算的强制 reference：${path}`),
];

const result = {
  version: manifest.version,
  counter: manifest.counter,
  baselineRevision: manifest.baseline.revision,
  hot: {
    baseline: manifest.baseline.hotCharacters,
    current: hotCharacters,
    budget: manifest.budgets.hotCharacters,
    reductionPercent: percentage(manifest.baseline.hotCharacters, hotCharacters),
  },
  mediumClosure: {
    baseline: manifest.baseline.mediumClosureCharacters,
    current: mediumClosureCharacters,
    budget: manifest.budgets.mediumClosureCharacters,
    reductionPercent: percentage(manifest.baseline.mediumClosureCharacters, mediumClosureCharacters),
  },
  requiredReferences: required,
  unbudgetedRequiredReferences,
  files: [...hot, ...mediumAdditional].map(({ source: _source, ...entry }) => entry),
  failures,
};

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
if (shouldCheck && failures.length > 0) process.exitCode = 1;
