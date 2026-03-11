#!/usr/bin/env node --experimental-strip-types

import { accessSync, constants, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import type { PreflightItem } from './lib.ts';
import {
  loadConfig,
  parseFlag,
  resolveRepoWriteTarget,
  resolveOutputRoot,
  runCommand,
  writeJsonAtomic,
} from './lib.ts';

export interface PreflightResult {
  ok: boolean;
  checks: PreflightItem[];
  code: string;
  generatedAt: string;
}

export function executePreflight(options?: { outDirOverride?: string | null; modelOverride?: string | null }): PreflightResult {
  const config = loadConfig(parseFlag(process.argv.slice(2), '--config'));
  const checks: PreflightItem[] = [];

  const [nodeMajorRaw, nodeMinorRaw] = process.versions.node.split('.');
  const nodeMajor = Number.parseInt(nodeMajorRaw ?? '0', 10);
  const nodeMinor = Number.parseInt(nodeMinorRaw ?? '0', 10);
  const nodeVersionOk = nodeMajor > 22 || (nodeMajor === 22 && nodeMinor >= 6);
  checks.push({
    name: 'node-version',
    ok: nodeVersionOk,
    detail: `node=${process.versions.node}`,
    suggestedFix: 'Install Node.js >=22.6.0.',
    code: nodeVersionOk ? 'OK' : 'E_PREFLIGHT_NODE_VERSION',
  });

  const dockerVersionCheck = runCommand('docker', ['--version']);
  const dockerInfoCheck = dockerVersionCheck.ok
    ? runCommand('docker', ['info', '--format', '{{.ServerVersion}}'])
    : { ok: false, exitCode: 1, stdout: '', stderr: '', error: 'docker unavailable' };
  const dockerOk = dockerVersionCheck.ok && dockerInfoCheck.ok;
  checks.push({
    name: 'docker',
    ok: dockerOk,
    detail: dockerOk
      ? `docker=${dockerVersionCheck.stdout.trim()} daemon=${dockerInfoCheck.stdout.trim()}`
      : (dockerVersionCheck.ok
        ? (dockerInfoCheck.error ?? (dockerInfoCheck.stderr.trim() || 'docker daemon unavailable'))
        : (dockerVersionCheck.error ?? (dockerVersionCheck.stderr.trim() || 'docker unavailable'))),
    suggestedFix: dockerVersionCheck.ok
      ? 'Start Docker daemon (or Docker Desktop) and rerun preflight.'
      : 'Install Docker Desktop (or Docker engine) and ensure docker is in PATH.',
    code: dockerOk ? 'OK' : (dockerVersionCheck.ok ? 'E_PREFLIGHT_DOCKER_UNAVAILABLE' : 'E_PREFLIGHT_DOCKER_MISSING'),
  });

  const harborHelp = runCommand('harbor', ['--help']);
  if (!harborHelp.ok) {
    checks.push({
      name: 'harbor-cli',
      ok: false,
      detail: harborHelp.error ?? (harborHelp.stderr.trim() || 'harbor unavailable'),
      suggestedFix: 'Install Harbor CLI via `uv tool install harbor` or `pip install harbor`.',
      code: 'E_PREFLIGHT_HARBOR_MISSING',
    });
    checks.push({
      name: 'harbor-health',
      ok: false,
      detail: 'Skipped because Harbor CLI is missing.',
      suggestedFix: 'Install Harbor CLI first, then rerun preflight.',
      code: 'E_PREFLIGHT_HARBOR_UNAVAILABLE',
    });
  } else {
    checks.push({
      name: 'harbor-cli',
      ok: true,
      detail: 'harbor CLI found',
      suggestedFix: 'none',
      code: 'OK',
    });

    const healthPrimary = runCommand('harbor', ['datasets', 'list'], { timeoutMs: 15000 });
    if (healthPrimary.ok) {
      checks.push({
        name: 'harbor-health',
        ok: true,
        detail: 'harbor datasets list succeeded',
        suggestedFix: 'none',
        code: 'OK',
      });
    } else {
      const healthFallback = runCommand('harbor', ['run', '--help']);
      const output = `${healthFallback.stdout}\n${healthFallback.stderr}`;
      const hasSignal = healthFallback.ok && /\bharbor\b|\brun\b|-d\b/.test(output);
      checks.push({
        name: 'harbor-health',
        ok: hasSignal,
        detail: hasSignal
          ? 'datasets list failed; fallback help probe passed'
          : `datasets list failed: ${(healthPrimary.stderr || healthPrimary.error || '').trim() || 'unknown error'}`,
        suggestedFix: 'Ensure Harbor service is reachable and current account has dataset access.',
        code: hasSignal ? 'OK' : 'E_PREFLIGHT_HARBOR_UNAVAILABLE',
      });
    }
  }

  const selectedModel = options?.modelOverride
    ?? parseFlag(process.argv.slice(2), '--model')
    ?? process.env.BENCHMARK_MODEL
    ?? config.defaults.model;

  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
  let opencodeProbeOk = false;
  let opencodeProbeDetail = 'not executed';
  if (!hasApiKey) {
    const opencodeProbe = runCommand(
      'opencode',
      ['run', '--model', selectedModel, '--format=json', '--', 'Reply with exactly: probe-ok'],
      { timeoutMs: 30000 },
    );
    opencodeProbeOk = opencodeProbe.ok;
    if (opencodeProbe.ok) {
      opencodeProbeDetail = `opencode model probe passed (${selectedModel})`;
    } else {
      opencodeProbeDetail = opencodeProbe.error ?? (opencodeProbe.stderr.trim() || 'opencode probe failed');
    }
  }

  const authOk = hasApiKey || opencodeProbeOk;
  checks.push({
    name: 'model-auth',
    ok: authOk,
    detail: hasApiKey
      ? 'Detected ANTHROPIC_API_KEY/OPENAI_API_KEY in environment.'
      : opencodeProbeDetail,
    suggestedFix: `Either export ANTHROPIC_API_KEY/OPENAI_API_KEY or make sure \`opencode run --model ${selectedModel}\` works in this environment.`,
    code: authOk ? 'OK' : 'E_PREFLIGHT_MODEL_AUTH',
  });

  const outOverride = options?.outDirOverride ?? parseFlag(process.argv.slice(2), '--out-dir') ?? process.env.BENCHMARK_OUT_DIR ?? null;
  try {
    const outRoot = resolveOutputRoot(outOverride, config.defaults.outDir);
    const probe = join(outRoot, '.write-probe');
    writeFileSync(probe, 'ok\n', 'utf-8');
    accessSync(probe, constants.R_OK | constants.W_OK);
    rmSync(probe, { force: true });
    checks.push({
      name: 'output-dir',
      ok: true,
      detail: `Writable output root: ${outRoot}`,
      suggestedFix: 'none',
      code: 'OK',
    });
  } catch (error) {
    checks.push({
      name: 'output-dir',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      suggestedFix: 'Use BENCHMARK_OUT_DIR under repo root and ensure write permissions.',
      code: 'E_IO_OUTPUT_DIR',
    });
  }

  const requiredDatasets = config.datasets.filter((d) => d.required.smoke || d.required.full).map((d) => d.datasetVersion);
  const datasetContractOk = requiredDatasets.includes('terminal-bench@2.0') && requiredDatasets.includes('swebenchpro');
  checks.push({
    name: 'dataset-contract',
    ok: datasetContractOk,
    detail: `required=${requiredDatasets.join(',')}`,
    suggestedFix: 'Restore deterministic config mapping for terminal-bench@2.0 and swebenchpro.',
    code: datasetContractOk ? 'OK' : 'E_PREFLIGHT_DATASET_CONTRACT',
  });

  const ok = checks.every((check) => check.ok);
  return {
    ok,
    checks,
    code: ok ? 'OK' : 'E_PREFLIGHT',
    generatedAt: new Date().toISOString(),
  };
}

function run() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help')) {
    console.log('Usage: node --experimental-strip-types scripts/benchmark/preflight.ts [--json] [--write <path>] [--out-dir <path>] [--model <provider/model>]');
    process.exit(0);
  }

  const result = executePreflight();
  const writePath = parseFlag(argv, '--write');
  if (writePath) {
    try {
      const target = resolveRepoWriteTarget(writePath);
      writeJsonAtomic(target, result);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  if (argv.includes('--json') || !process.stdout.isTTY) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Preflight ${result.ok ? 'OK' : 'FAILED'} (${result.code})`);
    for (const item of result.checks) {
      console.log(`- [${item.ok ? 'ok' : 'x'}] ${item.name}: ${item.detail}`);
      if (!item.ok) {
        console.log(`  fix: ${item.suggestedFix}`);
      }
    }
  }

  process.exit(result.ok ? 0 : 1);
}

const entrypoint = process.argv[1] ? resolve(process.argv[1]) : '';
if (entrypoint === fileURLToPath(import.meta.url)) {
  run();
}
