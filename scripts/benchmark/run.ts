#!/usr/bin/env node --experimental-strip-types

import { writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { DatasetConfig, DatasetSummary, HarborResultStats } from './lib.ts';
import {
  appendLog,
  detectGitCommit,
  ensureDir,
  loadConfig,
  parseHarborResultStats,
  parseCaseStats,
  parseFlag,
  parseIntOr,
  resolveRunDir,
  resolveOutputRoot,
  runCommand,
  sanitizeRunId,
  toRunId,
  writeJsonAtomic,
} from './lib.ts';
import { executePreflight } from './preflight.ts';
import { writeBenchmarkReport } from './report.ts';
import { computeScore } from './score.ts';

interface RunMeta {
  runId: string;
  mode: 'smoke' | 'full';
  profileId: string;
  sampleSetId: string;
  startedAt: string;
  endedAt: string;
  gitCommit: string;
  datasets: Array<{
    dataset: string;
    datasetVersion: string;
    required: boolean;
    enabled: boolean;
    status: 'ok' | 'skipped' | 'error';
  }>;
  model: string;
  concurrency: number;
}

function buildHarborArgs(dataset: DatasetConfig, model: string, concurrency: number): string[] {
  if (dataset.runner === 'harbor-run') {
    return ['run', '-d', dataset.datasetVersion, '-a', 'opencode', '-m', model, '--n-concurrent', String(concurrency)];
  }
  return ['jobs', 'start', '-d', dataset.datasetVersion, '-a', 'opencode', '-m', model];
}

function toSummary(
  dataset: DatasetConfig,
  status: 'ok' | 'skipped' | 'error',
  durationSec: number,
  stats: { total: number; passed: number; passRate: number } | null,
  reason?: string,
): DatasetSummary {
  if (status === 'skipped') {
    return {
      dataset: dataset.key,
      datasetVersion: dataset.datasetVersion,
      status: 'skipped',
      casesTotal: 0,
      casesPassed: 0,
      casesFailed: 0,
      passRate: 0,
      durationSec,
      normalizationReason: reason ?? 'disabled_or_dry_run',
    };
  }

  if (!stats || stats.total <= 0) {
    return {
      dataset: dataset.key,
      datasetVersion: dataset.datasetVersion,
      status: 'error',
      casesTotal: 0,
      casesPassed: 0,
      casesFailed: 0,
      passRate: 0,
      durationSec,
      normalizationReason: reason ?? 'empty_or_error',
    };
  }

  if (status === 'error') {
    const normalizedPassRate = Math.max(0, Math.min(1, stats.passRate));
    const normalizedPassed = Math.max(0, Math.min(stats.total, stats.passed));
    return {
      dataset: dataset.key,
      datasetVersion: dataset.datasetVersion,
      status: 'error',
      casesTotal: stats.total,
      casesPassed: normalizedPassed,
      casesFailed: Math.max(0, stats.total - normalizedPassed),
      passRate: normalizedPassRate,
      durationSec,
      normalizationReason: reason ?? 'error_zero_included',
    };
  }

  return {
    dataset: dataset.key,
    datasetVersion: dataset.datasetVersion,
    status: 'ok',
    casesTotal: stats.total,
    casesPassed: stats.passed,
    casesFailed: Math.max(0, stats.total - stats.passed),
    passRate: Math.max(0, Math.min(1, stats.passRate)),
    durationSec,
  };
}

function run() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help')) {
    console.log('Usage: node --experimental-strip-types scripts/benchmark/run.ts --mode <smoke|full> [--run-id <id>] [--dry-run] [--model <id>] [--concurrency <n>] [--out-dir <path>]');
    process.exit(0);
  }

  try {
    const modeRaw = parseFlag(argv, '--mode', 'smoke');
    const mode = modeRaw === 'full' ? 'full' : 'smoke';
    const config = loadConfig(parseFlag(argv, '--config'));
    const model = parseFlag(argv, '--model') ?? process.env.BENCHMARK_MODEL ?? config.defaults.model;
    const concurrency = parseIntOr(config.defaults.concurrency, parseFlag(argv, '--concurrency') ?? process.env.BENCHMARK_CONCURRENCY ?? null);
    const dryRun = argv.includes('--dry-run');
    const runId = sanitizeRunId(parseFlag(argv, '--run-id') ?? toRunId(mode));
    const outRoot = resolveOutputRoot(parseFlag(argv, '--out-dir') ?? process.env.BENCHMARK_OUT_DIR ?? null, config.defaults.outDir);
    const runDir = resolveRunDir(outRoot, runId);
    const logPath = join(runDir, 'stdout.log');

    ensureDir(runDir);
    writeFileSync(logPath, '', 'utf-8');
    appendLog(logPath, `[${new Date().toISOString()}] benchmark start runId=${runId} mode=${mode} dryRun=${dryRun}`);

    const preflight = executePreflight({
      outDirOverride: parseFlag(argv, '--out-dir') ?? process.env.BENCHMARK_OUT_DIR ?? null,
      modelOverride: model,
    });
    writeJsonAtomic(join(runDir, 'preflight.json'), preflight);
    if (!preflight.ok) {
      appendLog(logPath, `[${new Date().toISOString()}] preflight failed`);
      console.error(`E_PREFLIGHT: preflight failed, see ${join(runDir, 'preflight.json')}`);
      process.exit(1);
    }

    const datasetResults: RunMeta['datasets'] = [];
    const summaries: DatasetSummary[] = [];

    const startedAt = new Date().toISOString();
    for (const dataset of config.datasets) {
      const enabledByMode = mode === 'full' ? dataset.enabledByDefault.full : dataset.enabledByDefault.smoke;
      const enableProjectInterview = process.env.BENCHMARK_ENABLE_PROJECT_INTERVIEW === '1';
      const enabled = dataset.key === 'project-interview' ? enabledByMode && enableProjectInterview : enabledByMode;
      const required = mode === 'full' ? dataset.required.full : dataset.required.smoke;

      const datasetDir = join(runDir, 'datasets', dataset.key);
      const rawDir = join(datasetDir, 'raw');
      ensureDir(rawDir);

      if (!enabled) {
        const summary = toSummary(dataset, 'skipped', 0, null, 'disabled_by_profile');
        writeJsonAtomic(join(datasetDir, 'summary.json'), summary);
        summaries.push(summary);
        datasetResults.push({
          dataset: dataset.key,
          datasetVersion: dataset.datasetVersion,
          required,
          enabled,
          status: 'skipped',
        });
        continue;
      }

      const args = buildHarborArgs(dataset, model, concurrency);
      writeJsonAtomic(join(rawDir, 'command.json'), { command: 'harbor', args });

      if (dryRun) {
        const summary = toSummary(dataset, 'skipped', 0, null, 'dry_run');
        writeJsonAtomic(join(datasetDir, 'summary.json'), summary);
        summaries.push(summary);
        datasetResults.push({
          dataset: dataset.key,
          datasetVersion: dataset.datasetVersion,
          required,
          enabled,
          status: 'skipped',
        });
        appendLog(logPath, `[${new Date().toISOString()}] dry-run skip dataset=${dataset.key}`);
        continue;
      }

      const datasetStart = Date.now();
      appendLog(logPath, `[${new Date().toISOString()}] dataset start=${dataset.key}`);
      const res = runCommand('harbor', args, { timeoutMs: 2 * 60 * 60 * 1000 });
      writeFileSync(join(rawDir, 'stdout.log'), res.stdout, 'utf-8');
      writeFileSync(join(rawDir, 'stderr.log'), res.stderr, 'utf-8');
      writeJsonAtomic(join(rawDir, 'exit.json'), { ok: res.ok, exitCode: res.exitCode, error: res.error });
      const durationSec = Number(((Date.now() - datasetStart) / 1000).toFixed(2));

      const commandOutput = `${res.stdout}\n${res.stderr}`;
      const harborStats = parseHarborResultStats(commandOutput);
      if (harborStats) {
        writeJsonAtomic(join(rawDir, 'harbor-result-stats.json'), harborStats);
      }
      const parsed = toCaseStats(harborStats) ?? parseCaseStats(commandOutput);

      let summary: DatasetSummary;
      if (!res.ok) {
        summary = toSummary(dataset, 'error', durationSec, parsed, 'command_failed');
      } else if (harborStats && harborStats.errorCount > 0) {
        summary = toSummary(
          dataset,
          'error',
          durationSec,
          parsed,
          `harbor_runtime_errors:${harborStats.errorCount}/${harborStats.total}`,
        );
      } else if (parsed) {
        summary = toSummary(dataset, 'ok', durationSec, parsed);
      } else {
        summary = toSummary(dataset, 'error', durationSec, null, 'empty_or_error');
      }

      writeJsonAtomic(join(datasetDir, 'summary.json'), summary);
      summaries.push(summary);
      datasetResults.push({
        dataset: dataset.key,
        datasetVersion: dataset.datasetVersion,
        required,
        enabled,
        status: summary.status,
      });
      appendLog(logPath, `[${new Date().toISOString()}] dataset end=${dataset.key} status=${summary.status}`);
    }

    const endedAt = new Date().toISOString();
    const meta: RunMeta = {
      runId,
      mode,
      profileId: config.profileId,
      sampleSetId: mode === 'full' ? config.sampleSetId.full : config.sampleSetId.smoke,
      startedAt,
      endedAt,
      gitCommit: detectGitCommit(),
      datasets: datasetResults,
      model,
      concurrency,
    };
    writeJsonAtomic(join(runDir, 'run-meta.json'), meta);

    const scoreResult = computeScore(runId, outRoot);
    appendLog(logPath, `[${new Date().toISOString()}] score overall=${scoreResult.scorecard.overallScore}`);
    const reportResult = writeBenchmarkReport(runId, outRoot);
    appendLog(logPath, `[${new Date().toISOString()}] report path=${reportResult.reportPath}`);

    const hasErrors = summaries.some((summary) => summary.status === 'error');
    const payload = {
      runId,
      runDir: resolve(runDir),
      mode,
      profileId: meta.profileId,
      sampleSetId: meta.sampleSetId,
      overallScore: scoreResult.scorecard.overallScore,
      reportPath: reportResult.reportPath,
      datasetStatuses: summaries.map((summary) => ({ dataset: summary.dataset, status: summary.status })),
    };

    console.log(JSON.stringify(payload, null, 2));
    process.exit(hasErrors ? 2 : 0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function toCaseStats(harborStats: HarborResultStats | null): { total: number; passed: number; passRate: number } | null {
  if (!harborStats) {
    return null;
  }
  return {
    total: harborStats.total,
    passed: harborStats.passed,
    passRate: harborStats.passRate,
  };
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : '';
if (entrypoint === fileURLToPath(import.meta.url)) {
  run();
}
