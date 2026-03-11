#!/usr/bin/env node --experimental-strip-types

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { DatasetSummary, HarborResultStats, Scorecard } from './lib.ts';
import {
  loadConfig,
  parseHarborResultStats,
  parseFlag,
  readSummaryIfExists,
  resolveOutputRoot,
  resolveRunDir,
} from './lib.ts';

interface RunMetaDataset {
  dataset: string;
  datasetVersion: string;
  required: boolean;
  enabled: boolean;
  status: 'ok' | 'skipped' | 'error';
}

interface RunMeta {
  runId: string;
  mode: 'smoke' | 'full';
  profileId: string;
  sampleSetId: string;
  startedAt: string;
  endedAt: string;
  gitCommit: string;
  datasets: RunMetaDataset[];
  model: string;
  concurrency: number;
}

interface PreflightResult {
  ok: boolean;
  code: string;
  checks: Array<{
    name: string;
    ok: boolean;
    detail: string;
    code?: string;
  }>;
}

interface DatasetEvaluation {
  dataset: RunMetaDataset;
  summary: DatasetSummary | null;
  scorecardEntry: Scorecard['datasetScores'][number] | null;
  harborStats: HarborResultStats | null;
  effectiveStatus: 'ok' | 'skipped' | 'error';
  effectiveTotal: number;
  effectivePassed: number;
  effectivePassRate: number;
  durationSec: number;
  note: string;
  mismatch: string | null;
}

export function writeBenchmarkReport(runId: string, outRootOverride?: string | null): { reportPath: string; markdown: string } {
  const argv = process.argv.slice(2);
  const config = loadConfig(parseFlag(argv, '--config'));
  const outRoot = resolveOutputRoot(outRootOverride ?? parseFlag(argv, '--out-dir') ?? process.env.BENCHMARK_OUT_DIR ?? null, config.defaults.outDir);
  const runDir = resolveRunDir(outRoot, runId);

  const runMetaPath = join(runDir, 'run-meta.json');
  if (!existsSync(runMetaPath)) {
    throw new Error(`E_REPORT_META_MISSING: ${runMetaPath}`);
  }

  const runMeta = JSON.parse(readFileSync(runMetaPath, 'utf-8')) as RunMeta;
  const preflight = readJsonIfExists<PreflightResult>(join(runDir, 'preflight.json'));
  const scorecard = readJsonIfExists<Scorecard>(join(runDir, 'scorecard.json'));
  const evaluations = buildDatasetEvaluations(runDir, runMeta, scorecard);

  const effectiveOverall = computeEffectiveOverall(evaluations, scorecard, config);
  const scorecardOverall = scorecard?.overallScore ?? null;
  const integrityWarnings = evaluations
    .filter((item) => item.mismatch)
    .map((item) => `${item.dataset.datasetVersion}: ${item.mismatch}`);

  const lines: string[] = [];
  lines.push(`# Benchmark Report - ${runMeta.runId}`);
  lines.push('');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Snapshot');
  lines.push(`- Mode: \`${runMeta.mode}\` (profile: \`${runMeta.profileId}\`, sampleSet: \`${runMeta.sampleSetId}\`)`);
  lines.push(`- Model: \`${runMeta.model}\`, concurrency: \`${runMeta.concurrency}\``);
  lines.push(`- Time: ${runMeta.startedAt} -> ${runMeta.endedAt} (${formatDurationSec(secondsBetween(runMeta.startedAt, runMeta.endedAt))})`);
  lines.push(`- Commit: \`${runMeta.gitCommit}\``);
  lines.push(`- Overall score (scorecard): **${scorecardOverall === null ? 'N/A' : scorecardOverall.toFixed(2)}**`);
  lines.push(`- Overall score (effective from raw logs): **${effectiveOverall.toFixed(2)}**`);
  if (scorecardOverall !== null && Math.abs(scorecardOverall - effectiveOverall) > 0.01) {
    lines.push('- ⚠️ Scorecard and raw-log-derived score differ. Treat this run as needing manual review/recompute.');
  }
  lines.push('');

  lines.push('## Preflight');
  if (!preflight) {
    lines.push('- Missing `preflight.json`.');
  } else {
    lines.push(`- Result: **${preflight.ok ? 'PASS' : 'FAIL'}** (${preflight.code})`);
    const failedChecks = preflight.checks.filter((item) => !item.ok);
    if (failedChecks.length === 0) {
      lines.push('- All checks passed.');
    } else {
      for (const item of failedChecks) {
        lines.push(`- ${item.name}: ${item.detail} (${item.code ?? 'NO_CODE'})`);
      }
    }
  }
  lines.push('');

  lines.push('## Dataset Results');
  lines.push('| Dataset | Status (summary->effective) | Passed/Total (effective) | PassRate (effective) | Duration | Scorecard | Notes |');
  lines.push('|---|---|---:|---:|---:|---:|---|');
  for (const item of evaluations) {
    const summaryStatus = item.summary?.status ?? item.dataset.status;
    const statusText = summaryStatus === item.effectiveStatus
      ? item.effectiveStatus
      : `${summaryStatus} -> ${item.effectiveStatus}`;
    const passed = `${item.effectivePassed}/${item.effectiveTotal}`;
    const passRate = `${(item.effectivePassRate * 100).toFixed(2)}%`;
    const duration = formatDurationSec(item.durationSec);
    const scorecardText = item.scorecardEntry
      ? `${item.scorecardEntry.score.toFixed(2)} (w=${item.scorecardEntry.weight})`
      : 'N/A';
    lines.push(`| ${item.dataset.datasetVersion} | ${statusText} | ${passed} | ${passRate} | ${duration} | ${scorecardText} | ${item.note} |`);
  }
  lines.push('');

  if (integrityWarnings.length > 0) {
    lines.push('## Data Integrity Warnings');
    for (const warning of integrityWarnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  lines.push('## Interpretation');
  const errorDatasets = evaluations.filter((item) => item.effectiveStatus === 'error');
  if (errorDatasets.length === 0) {
    lines.push('- No dataset is marked as `error` after raw log reconciliation.');
  } else {
    lines.push(`- ${errorDatasets.length} dataset(s) are in \`error\` status and count as zero in denominator scoring.`);
  }

  const dockerIssue = evaluations.some((item) => item.note.includes('Docker daemon unavailable'));
  if (dockerIssue) {
    lines.push('- Docker daemon connectivity issues were detected in dataset stderr logs.');
    lines.push('- This indicates environment/runtime failure, not model reasoning failure.');
  }

  lines.push('');
  lines.push('## Next Steps');
  lines.push('- Ensure `docker info` succeeds before running benchmark.');
  lines.push('- Re-run `npm run benchmark:score -- --run <RUN_ID>` after any manual artifact fixes.');
  lines.push('- Keep comparing runs with the same `mode/profileId/sampleSetId` tuple only.');

  const markdown = `${lines.join('\n')}\n`;
  const reportPath = join(runDir, 'report.md');
  writeFileSync(reportPath, markdown, 'utf-8');
  return { reportPath, markdown };
}

function buildDatasetEvaluations(runDir: string, runMeta: RunMeta, scorecard: Scorecard | null): DatasetEvaluation[] {
  const result: DatasetEvaluation[] = [];
  for (const dataset of runMeta.datasets) {
    const summary = readSummaryIfExists(join(runDir, 'datasets', dataset.dataset, 'summary.json'));
    const scorecardEntry = scorecard?.datasetScores.find(
      (entry) => entry.dataset === dataset.dataset && entry.datasetVersion === dataset.datasetVersion,
    ) ?? null;
    const harborStats = readHarborStatsFromRaw(runDir, dataset.dataset);
    const baseStatus = summary?.status ?? dataset.status;

    let effectiveStatus: 'ok' | 'skipped' | 'error' = baseStatus;
    if (harborStats && harborStats.errorCount > 0) {
      effectiveStatus = 'error';
    }

    let effectiveTotal = summary?.casesTotal ?? 0;
    let effectivePassed = summary?.casesPassed ?? 0;
    let effectivePassRate = summary?.passRate ?? 0;
    if (harborStats) {
      effectiveTotal = harborStats.total;
      effectivePassed = harborStats.passed;
      effectivePassRate = harborStats.passRate;
    }

    const durationSec = summary?.durationSec ?? 0;
    const note = inferDatasetNote(runDir, dataset.dataset, summary, harborStats);
    const mismatch = inferMismatch(baseStatus, effectiveStatus, summary, harborStats);

    result.push({
      dataset,
      summary,
      scorecardEntry,
      harborStats,
      effectiveStatus,
      effectiveTotal,
      effectivePassed,
      effectivePassRate,
      durationSec,
      note,
      mismatch,
    });
  }
  return result;
}

function readHarborStatsFromRaw(runDir: string, dataset: string): HarborResultStats | null {
  const stdoutPath = join(runDir, 'datasets', dataset, 'raw', 'stdout.log');
  const stderrPath = join(runDir, 'datasets', dataset, 'raw', 'stderr.log');
  if (!existsSync(stdoutPath)) {
    return null;
  }
  const stdout = readFileSync(stdoutPath, 'utf-8');
  const stderr = existsSync(stderrPath) ? readFileSync(stderrPath, 'utf-8') : '';
  return parseHarborResultStats(`${stdout}\n${stderr}`);
}

function inferDatasetNote(
  runDir: string,
  dataset: string,
  summary: DatasetSummary | null,
  harborStats: HarborResultStats | null,
): string {
  const stderrPath = join(runDir, 'datasets', dataset, 'raw', 'stderr.log');
  if (existsSync(stderrPath)) {
    const stderr = readFileSync(stderrPath, 'utf-8');
    if (stderr.includes('Cannot connect to the Docker daemon')) {
      return 'Docker daemon unavailable';
    }
    if (stderr.includes('unknown certificate verification error')) {
      return 'TLS/certificate validation failed';
    }
  }

  if (harborStats && harborStats.errorCount > 0) {
    return `Harbor runtime errors: ${harborStats.errorCount}/${harborStats.total}`;
  }

  if (!summary) {
    return 'summary missing';
  }
  if (summary.normalizationReason) {
    return summary.normalizationReason;
  }
  return '-';
}

function inferMismatch(
  summaryStatus: 'ok' | 'skipped' | 'error',
  effectiveStatus: 'ok' | 'skipped' | 'error',
  summary: DatasetSummary | null,
  harborStats: HarborResultStats | null,
): string | null {
  if (!summary) {
    return 'summary.json missing';
  }
  if (harborStats && harborStats.errorCount > 0 && summaryStatus !== 'error') {
    return `summary status=${summaryStatus}, but harbor reports runtime errors ${harborStats.errorCount}/${harborStats.total}`;
  }
  if (effectiveStatus !== summaryStatus) {
    return `status mismatch: summary=${summaryStatus}, effective=${effectiveStatus}`;
  }
  return null;
}

function computeEffectiveOverall(
  evaluations: DatasetEvaluation[],
  scorecard: Scorecard | null,
  config: ReturnType<typeof loadConfig>,
): number {
  const weights = scorecard?.weights ?? buildWeightMap(config);
  let numerator = 0;
  let denominator = 0;

  for (const item of evaluations) {
    const weight = weights[item.dataset.datasetVersion] ?? 0;
    if (item.effectiveStatus === 'skipped') {
      continue;
    }
    denominator += weight;
    if (item.effectiveStatus === 'ok') {
      numerator += Math.max(0, Math.min(100, item.effectivePassRate * 100)) * weight;
    }
  }

  if (denominator <= 0) {
    return 0;
  }
  return Number((numerator / denominator).toFixed(2));
}

function buildWeightMap(config: ReturnType<typeof loadConfig>): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const dataset of config.datasets) {
    weights[dataset.datasetVersion] = dataset.weight;
  }
  return weights;
}

function readJsonIfExists<T>(path: string): T | null {
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

function secondsBetween(startIso: string, endIso: string): number {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 0;
  }
  return Math.round((end - start) / 1000);
}

function formatDurationSec(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}

function run() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help')) {
    console.log('Usage: node --experimental-strip-types scripts/benchmark/report.ts --run <RUN_ID> [--out-dir <path>]');
    process.exit(0);
  }

  const runId = parseFlag(argv, '--run');
  if (!runId) {
    console.error('E_REPORT_ARGS: missing --run <RUN_ID>');
    process.exit(1);
  }

  try {
    const result = writeBenchmarkReport(runId);
    console.log(JSON.stringify({ runId, reportPath: result.reportPath }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : '';
if (entrypoint === fileURLToPath(import.meta.url)) {
  run();
}
