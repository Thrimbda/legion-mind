#!/usr/bin/env node --experimental-strip-types

import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { DatasetSummary, Scorecard } from './lib.ts';
import {
  loadConfig,
  parseHarborResultStats,
  parseFlag,
  readSummaryIfExists,
  resolveOutputRoot,
  resolveRunDir,
  writeJsonAtomic,
} from './lib.ts';

interface RunMetaDataset {
  dataset: string;
  datasetVersion: string;
  required: boolean;
  enabled: boolean;
  status: 'ok' | 'skipped' | 'error';
}

interface RunMeta {
  datasets: RunMetaDataset[];
}

interface ScoreResult {
  scorecard: Scorecard;
  summaries: DatasetSummary[];
  runDir: string;
}

export function computeScore(runId: string, outRootOverride?: string | null): ScoreResult {
  const argv = process.argv.slice(2);
  const config = loadConfig(parseFlag(argv, '--config'));
  const outRoot = resolveOutputRoot(outRootOverride ?? parseFlag(argv, '--out-dir') ?? process.env.BENCHMARK_OUT_DIR ?? null, config.defaults.outDir);
  const runDir = resolveRunDir(outRoot, runId);
  if (!existsSync(runDir)) {
    throw new Error(`E_SCORE_RUN_NOT_FOUND: ${runDir}`);
  }

  const runMetaPath = join(runDir, 'run-meta.json');
  if (!existsSync(runMetaPath)) {
    throw new Error(`E_SCORE_META_MISSING: ${runMetaPath}`);
  }

  const runMeta = JSON.parse(readFileSync(runMetaPath, 'utf-8')) as RunMeta;
  if (!Array.isArray(runMeta.datasets)) {
    throw new Error(`E_SCORE_META_INVALID: ${runMetaPath}`);
  }

  const summaries: DatasetSummary[] = [];
  for (const dataset of runMeta.datasets) {
    const summaryPath = join(runDir, 'datasets', dataset.dataset, 'summary.json');
    const summary = readSummaryIfExists(summaryPath);
    const harborStats = readHarborStatsFromRaw(runDir, dataset.dataset);

    if (harborStats) {
      summaries.push({
        dataset: dataset.dataset,
        datasetVersion: dataset.datasetVersion,
        status: harborStats.errorCount > 0 ? 'error' : 'ok',
        casesTotal: harborStats.total,
        casesPassed: harborStats.passed,
        casesFailed: Math.max(0, harborStats.total - harborStats.passed),
        passRate: harborStats.passRate,
        durationSec: summary?.durationSec ?? 0,
        normalizationReason: harborStats.errorCount > 0
          ? `harbor_runtime_errors:${harborStats.errorCount}/${harborStats.total}`
          : undefined,
      });
      continue;
    }

    if (summary) {
      summaries.push(summary);
      continue;
    }

    summaries.push({
      dataset: dataset.dataset,
      datasetVersion: dataset.datasetVersion,
      status: dataset.enabled ? 'error' : 'skipped',
      casesTotal: 0,
      casesPassed: 0,
      casesFailed: 0,
      passRate: 0,
      durationSec: 0,
      normalizationReason: dataset.enabled ? 'missing_summary' : 'disabled_by_run_meta',
    });
  }

  const weights: Record<string, number> = {};
  for (const dataset of config.datasets) {
    weights[dataset.datasetVersion] = dataset.weight;
  }

  const datasetScores: Scorecard['datasetScores'] = [];
  let numerator = 0;
  let denominator = 0;

  for (const summary of summaries) {
    const weight = weights[summary.datasetVersion] ?? 0;
    if (summary.status === 'skipped') {
      datasetScores.push({
        dataset: summary.dataset,
        datasetVersion: summary.datasetVersion,
        status: summary.status,
        score: 0,
        weight,
        includedInDenominator: false,
        reason: 'skipped_excluded',
      });
      continue;
    }

    if (summary.status === 'error') {
      denominator += weight;
      datasetScores.push({
        dataset: summary.dataset,
        datasetVersion: summary.datasetVersion,
        status: summary.status,
        score: 0,
        weight,
        includedInDenominator: true,
        reason: summary.normalizationReason ?? 'error_zero_included',
      });
      continue;
    }

    const score = Math.max(0, Math.min(100, summary.passRate * 100));
    numerator += score * weight;
    denominator += weight;
    datasetScores.push({
      dataset: summary.dataset,
      datasetVersion: summary.datasetVersion,
      status: summary.status,
      score,
      weight,
      includedInDenominator: true,
    });
  }

  const scorecard: Scorecard = {
    schemaVersion: 'v1',
    overallScore: denominator > 0 ? Number((numerator / denominator).toFixed(2)) : 0,
    datasetScores,
    weights,
    normalization: {
      range: '[0,100]',
      skippedExcludedFromDenominator: true,
      errorIncludedWithZero: true,
    },
    generatedAt: new Date().toISOString(),
  };

  writeJsonAtomic(join(runDir, 'scorecard.json'), scorecard);
  return { scorecard, summaries, runDir };
}

function readHarborStatsFromRaw(runDir: string, dataset: string) {
  const stdoutPath = join(runDir, 'datasets', dataset, 'raw', 'stdout.log');
  const stderrPath = join(runDir, 'datasets', dataset, 'raw', 'stderr.log');
  if (!existsSync(stdoutPath)) {
    return null;
  }

  const stdout = readFileSync(stdoutPath, 'utf-8');
  const stderr = existsSync(stderrPath) ? readFileSync(stderrPath, 'utf-8') : '';
  return parseHarborResultStats(`${stdout}\n${stderr}`);
}

function run() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help')) {
    console.log('Usage: node --experimental-strip-types scripts/benchmark/score.ts --run <RUN_ID> [--out-dir <path>]');
    process.exit(0);
  }

  const runId = parseFlag(argv, '--run');
  if (!runId) {
    console.error('E_SCORE_ARGS: missing --run <RUN_ID>');
    process.exit(1);
  }

  try {
    const result = computeScore(runId);
    console.log(JSON.stringify({
      runId,
      scorecard: result.scorecard,
      scorecardPath: join(result.runDir, 'scorecard.json'),
    }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : '';
if (entrypoint === fileURLToPath(import.meta.url)) {
  run();
}
