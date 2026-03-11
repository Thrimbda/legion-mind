import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'fs';
import { dirname, join, relative, resolve, sep } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

export interface DatasetConfig {
  key: string;
  datasetVersion: string;
  runner: 'harbor-run' | 'harbor-jobs-start';
  required: { smoke: boolean; full: boolean };
  enabledByDefault: { smoke: boolean; full: boolean };
  weight: number;
}

export interface BenchmarkConfig {
  schemaVersion: number;
  profileId: string;
  sampleSetId: { smoke: string; full: string };
  defaults: {
    model: string;
    concurrency: number;
    outDir: string;
  };
  datasets: DatasetConfig[];
}

export interface PreflightItem {
  name: string;
  ok: boolean;
  detail: string;
  suggestedFix: string;
  code?: string;
}

export interface DatasetSummary {
  dataset: string;
  datasetVersion: string;
  status: 'ok' | 'skipped' | 'error';
  casesTotal: number;
  casesPassed: number;
  casesFailed: number;
  passRate: number;
  durationSec: number;
  normalizationReason?: string;
}

export interface HarborResultStats {
  total: number;
  passed: number;
  passRate: number;
  errorCount: number;
  resultPath: string;
}

export interface Scorecard {
  schemaVersion: string;
  overallScore: number;
  datasetScores: Array<{
    dataset: string;
    datasetVersion: string;
    status: 'ok' | 'skipped' | 'error';
    score: number;
    weight: number;
    includedInDenominator: boolean;
    reason?: string;
  }>;
  weights: Record<string, number>;
  normalization: {
    range: '[0,100]';
    skippedExcludedFromDenominator: true;
    errorIncludedWithZero: true;
  };
  generatedAt: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const REPO_ROOT = resolve(__dirname, '..', '..');
const RUN_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

export function loadConfig(configPath?: string): BenchmarkConfig {
  const candidate = resolve(configPath ?? join(REPO_ROOT, 'scripts', 'benchmark', 'config.default.json'));
  const content = readFileSync(candidate, 'utf-8');
  return JSON.parse(content) as BenchmarkConfig;
}

export function parseFlag(argv: string[], name: string, fallback: string | null = null): string | null {
  const exact = argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) {
    return exact.slice(name.length + 1);
  }
  const index = argv.indexOf(name);
  if (index >= 0 && argv[index + 1] && !argv[index + 1].startsWith('--')) {
    return argv[index + 1];
  }
  return fallback;
}

export function parseIntOr(defaultValue: number, raw: string | null): number {
  if (!raw) {
    return defaultValue;
  }
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return defaultValue;
  }
  return value;
}

export function toRunId(mode: 'smoke' | 'full') {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  const ss = String(now.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}-${hh}${mm}${ss}-${mode}`;
}

export function sanitizeForFile(input: string): string {
  return input
    .replace(/(sk-[A-Za-z0-9_-]{8,})/g, '***')
    .replace(/((?:api|auth|secret|token|key)[^\n\r=:]{0,20}[=:]\s*)([^\s"']+)/gi, '$1***')
    .replace(/([A-Za-z0-9]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})/g, '***');
}

export function writeJsonAtomic(filePath: string, payload: unknown) {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
  renameSync(tmp, filePath);
}

export function ensureDir(path: string) {
  mkdirSync(path, { recursive: true });
}

export function isWithin(parent: string, candidate: string): boolean {
  const normalizedParent = resolve(parent);
  const normalizedCandidate = resolve(candidate);
  return normalizedCandidate === normalizedParent || normalizedCandidate.startsWith(`${normalizedParent}${sep}`);
}

export function resolveOutputRoot(value: string | null, fallback: string): string {
  const outRoot = resolve(REPO_ROOT, value ?? fallback);
  if (!isWithin(REPO_ROOT, outRoot)) {
    throw new Error(`E_IO_OUTSIDE_REPO: output path escapes repo root (${relative(REPO_ROOT, outRoot)})`);
  }
  ensureDir(outRoot);
  return outRoot;
}

export function sanitizeRunId(rawRunId: string): string {
  const trimmed = rawRunId.trim();
  if (!trimmed) {
    throw new Error('E_RUN_ID_INVALID: run id is empty');
  }
  if (!RUN_ID_PATTERN.test(trimmed)) {
    throw new Error(`E_RUN_ID_INVALID: unsupported run id '${rawRunId}'`);
  }
  return trimmed;
}

export function resolveRunDir(outRoot: string, rawRunId: string): string {
  const runId = sanitizeRunId(rawRunId);
  const runDir = resolve(outRoot, runId);
  if (!isWithin(outRoot, runDir)) {
    throw new Error(`E_IO_OUTSIDE_OUT_ROOT: run directory escapes out root (${relative(outRoot, runDir)})`);
  }
  return runDir;
}

export function resolveRepoWriteTarget(rawPath: string): string {
  const target = resolve(REPO_ROOT, rawPath);
  if (!isWithin(REPO_ROOT, target)) {
    throw new Error(`E_IO_OUTSIDE_REPO: write target escapes repo root (${relative(REPO_ROOT, target)})`);
  }
  return target;
}

export function appendLog(logPath: string, line: string) {
  appendFileSync(logPath, `${line}\n`, 'utf-8');
}

export function runCommand(
  command: string,
  args: string[],
  options?: { timeoutMs?: number; cwd?: string },
): { ok: boolean; exitCode: number; stdout: string; stderr: string; error: string | null } {
  const proc = spawnSync(command, args, {
    cwd: options?.cwd ?? REPO_ROOT,
    encoding: 'utf-8',
    timeout: options?.timeoutMs ?? 0,
    maxBuffer: 20 * 1024 * 1024,
  });
  const stdout = sanitizeForFile(proc.stdout ?? '');
  const stderr = sanitizeForFile(proc.stderr ?? '');
  return {
    ok: proc.status === 0,
    exitCode: proc.status ?? 1,
    stdout,
    stderr,
    error: proc.error ? String(proc.error.message ?? proc.error) : null,
  };
}

export function detectGitCommit(): string {
  const res = runCommand('git', ['rev-parse', 'HEAD']);
  if (!res.ok) {
    return 'unknown';
  }
  return res.stdout.trim() || 'unknown';
}

export function parseHarborResultStats(rawOutput: string): HarborResultStats | null {
  const resultPathMatch = rawOutput.match(/Results written to ([^\s]+result\.json)/);
  if (!resultPathMatch?.[1]) {
    return null;
  }

  const rawPath = resultPathMatch[1];
  const resolvedPath = rawPath.startsWith('/') ? rawPath : resolve(REPO_ROOT, rawPath);
  if (!existsSync(resolvedPath)) {
    return null;
  }

  try {
    const payload = JSON.parse(readFileSync(resolvedPath, 'utf-8')) as Record<string, unknown>;
    const stats = payload.stats as Record<string, unknown> | undefined;
    const total = numberLike(payload.n_total_trials ?? stats?.n_trials);
    const errorCount = numberLike(stats?.n_errors);
    if (total <= 0) {
      return null;
    }

    if (errorCount >= total) {
      return {
        total,
        passed: 0,
        passRate: 0,
        errorCount,
        resultPath: resolvedPath,
      };
    }

    const mean = extractHarborMean(stats?.evals);
    if (mean !== null) {
      const normalized = clamp(mean > 1 ? mean / 100 : mean, 0, 1);
      return {
        total,
        passed: Math.round(normalized * total),
        passRate: normalized,
        errorCount,
        resultPath: resolvedPath,
      };
    }

    if (errorCount > 0) {
      return {
        total,
        passed: 0,
        passRate: 0,
        errorCount,
        resultPath: resolvedPath,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function parseCaseStats(raw: string): { total: number; passed: number; passRate: number } | null {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines.slice().reverse()) {
    if (!line.startsWith('{') || !line.endsWith('}')) {
      continue;
    }
    try {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      const total = numberLike(parsed.casesTotal ?? parsed.total ?? parsed.tests_total);
      const passed = numberLike(parsed.casesPassed ?? parsed.passed ?? parsed.tests_passed ?? parsed.success);
      const passRateRaw = numberLike(parsed.passRate ?? parsed.pass_rate ?? parsed.accuracy);
      if (total > 0) {
        const passRate = passRateRaw > 1 ? passRateRaw / 100 : passRateRaw;
        return { total, passed: Math.min(passed, total), passRate: clamp(passRate, 0, 1) };
      }
    } catch {
      // ignore malformed line
    }
  }

  return null;
}

function extractHarborMean(rawEvals: unknown): number | null {
  if (!rawEvals || typeof rawEvals !== 'object') {
    return null;
  }
  const evalEntries = Object.values(rawEvals as Record<string, unknown>);
  for (const entry of evalEntries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const metrics = (entry as { metrics?: unknown }).metrics;
    if (!Array.isArray(metrics)) {
      continue;
    }
    for (const metric of metrics) {
      if (!metric || typeof metric !== 'object') {
        continue;
      }
      const maybeMean = finiteNumber((metric as { mean?: unknown }).mean);
      if (maybeMean !== null) {
        return maybeMean;
      }
    }
  }
  return null;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function numberLike(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function readSummaryIfExists(path: string): DatasetSummary | null {
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as DatasetSummary;
}
