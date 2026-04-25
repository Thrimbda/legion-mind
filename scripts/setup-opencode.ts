#!/usr/bin/env node --experimental-strip-types

import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, join, relative, resolve, sep } from 'path';
import { homedir } from 'os';
import { createHash, randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

type Command = 'install' | 'verify' | 'rollback' | 'uninstall';
type Strategy = 'copy' | 'symlink';

interface CliOptions {
  command: Command;
  strict: boolean;
  dryRun: boolean;
  force: boolean;
  json: boolean;
  strategy: Strategy;
  toBackupId: string | null;
  configDir: string;
  opencodeHome: string;
}

interface ManagedFile {
  targetPath: string;
  sourcePath: string;
  checksum: string;
  installedAt: string;
  lastAction: 'install' | 'update' | 'rollback' | 'uninstall';
}

interface ManagedState {
  version: 1;
  updatedAt: string;
  files: Record<string, ManagedFile>;
}

interface BackupEntry {
  targetPath: string;
  backupPath: string;
  reason: string;
  preManaged: ManagedFile | null;
}

interface BackupBatch {
  backupId: string;
  createdAt: string;
  entries: BackupEntry[];
}

interface BackupIndex {
  version: 1;
  updatedAt: string;
  backups: BackupBatch[];
}

interface InstallState {
  version: 1;
  timestamp: string;
  runId: string;
  command: Command;
  code: string;
  summary: {
    copied: number;
    linked: number;
    skipped: number;
    warnings: number;
    failures: number;
  };
}

interface SyncItem {
  sourcePath: string;
  targetPath: string;
}

type VerifyManagedState =
  | { kind: 'ok'; path: string; state: ManagedState }
  | { kind: 'missing'; path: string }
  | { kind: 'invalid'; path: string; error: string };

const MANAGED_FILE_ACTIONS = new Set(['install', 'update', 'rollback', 'uninstall']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);

const MANAGED_DIR_NAME = '.legionmind';
const INSTALL_STATE_FILE = 'install-state.v1.json';
const MANAGED_FILES_FILE = 'managed-files.v1.json';
const BACKUP_INDEX_FILE = 'backup-index.v1.json';

const SOURCE_TARGETS = [
  { sourceRoot: '.opencode/agents', targetRoot: 'agents' },
  { sourceRoot: '.opencode/plugins', targetRoot: 'plugins', optional: true },
] as const;

const INSTALLED_SKILLS = [
  'brainstorm',
  'legion-docs',
  'legion-wiki',
  'legion-workflow',
  'spec-rfc',
  'review-rfc',
  'engineer',
  'verify-change',
  'review-change',
  'report-walkthrough',
] as const;

const SENSITIVE_BASENAMES = new Set(['opencode.json', 'antigravity-accounts.json']);

class Reporter {
  warnings = 0;
  failures = 0;
  private readonly runId: string;
  private readonly json: boolean;

  constructor(runId: string, json: boolean) {
    this.runId = runId;
    this.json = json;
  }

  emit(code: string, phase: string, checkId: string, target: string, hint: string) {
    const payload = {
      timestamp: new Date().toISOString(),
      runId: this.runId,
      code,
      phase,
      checkId,
      target,
      hint,
    };

    if (code.startsWith('W_')) {
      this.warnings += 1;
    }
    if (code.startsWith('E_')) {
      this.failures += 1;
    }

    if (this.json) {
      console.log(JSON.stringify(payload));
      return;
    }

    console.log(`${payload.code} [${payload.phase}/${payload.checkId}] ${payload.target} :: ${payload.hint}`);
  }
}

function parseArgs(argv: string[]): CliOptions {
  const commandArg = argv.find((arg) => !arg.startsWith('--'));
  const command = (commandArg as Command | undefined) ?? 'install';
  if (!['install', 'verify', 'rollback', 'uninstall'].includes(command)) {
    throw new Error(`Unsupported command: ${command}`);
  }

  const getValue = (name: string): string | null => {
    const exact = argv.find((arg) => arg.startsWith(`${name}=`));
    if (exact) {
      return exact.slice(name.length + 1);
    }
    const index = argv.indexOf(name);
    if (index >= 0 && argv[index + 1] && !argv[index + 1].startsWith('--')) {
      return argv[index + 1];
    }
    return null;
  };

  const strategyValue = (getValue('--strategy') ?? 'copy') as Strategy;
  if (!['copy', 'symlink'].includes(strategyValue)) {
    throw new Error(`Unsupported strategy: ${strategyValue}`);
  }

  const configDir = resolve(getValue('--config-dir') ?? join(homedir(), '.config', 'opencode'));
  const opencodeHome = resolve(getValue('--opencode-home') ?? join(homedir(), '.opencode'));

  return {
    command,
    strict: argv.includes('--strict'),
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    json: argv.includes('--json'),
    strategy: strategyValue,
    toBackupId: getValue('--to'),
    configDir,
    opencodeHome,
  };
}

function sha256(path: string): string {
  const hash = createHash('sha256');
  hash.update(readFileSync(path));
  return hash.digest('hex');
}

function resolvedLinkTarget(path: string): string {
  return resolve(dirname(path), readlinkSync(path));
}

function sourceFingerprint(path: string, strategy: Strategy): string {
  if (strategy === 'symlink') {
    return `symlink:${resolve(path)}`;
  }
  return sha256(path);
}

function canonicalFilePath(path: string): string {
  const absolute = resolve(path);
  const parent = dirname(absolute);
  if (!existsSync(parent)) {
    return absolute;
  }

  try {
    return join(realpathSync(parent), basename(absolute));
  } catch {
    return absolute;
  }
}

function canonicalDirectoryPath(path: string): string {
  const absolute = resolve(path);
  if (!existsSync(absolute)) {
    return absolute;
  }

  try {
    return realpathSync(absolute);
  } catch {
    return absolute;
  }
}

function isWithinRoot(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}${sep}`);
}

function managedRoots(opts: CliOptions): string[] {
  return [
    join(opts.configDir, 'agents'),
    join(opts.configDir, 'plugins'),
    ...INSTALLED_SKILLS.map((skill) => join(opts.opencodeHome, 'skills', skill)),
  ].map(canonicalDirectoryPath);
}

function isManagedTargetPath(path: string, opts: CliOptions): boolean {
  const canonicalTarget = canonicalFilePath(path);
  return managedRoots(opts).some((root) => isWithinRoot(canonicalTarget, root));
}

function writeJsonAtomic(path: string, data: unknown, dryRun: boolean) {
  if (dryRun) {
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(tmp, path);
}

function loadJsonOrDefault<T>(path: string, fallback: T): T {
  if (!existsSync(path)) {
    return fallback;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function isIgnoredRelativePath(relPath: string): boolean {
  const normalized = relPath.split(/[/\\]/g);
  if (normalized.includes('.git') || normalized.includes('node_modules')) {
    return true;
  }

  const basename = normalized[normalized.length - 1] ?? '';
  if (SENSITIVE_BASENAMES.has(basename)) {
    return true;
  }

  if (/\.env($|\.)/i.test(basename)) {
    return true;
  }

  if (/(credential|secret|token)/i.test(basename)) {
    return true;
  }

  return false;
}

function collectFilesRecursive(sourceRoot: string, targetRoot: string): SyncItem[] {
  const files: SyncItem[] = [];

  const walk = (currentSource: string) => {
    const entries = readdirSync(currentSource, { withFileTypes: true });
    for (const entry of entries) {
      const sourcePath = join(currentSource, entry.name);
      const rel = relative(sourceRoot, sourcePath);
      if (isIgnoredRelativePath(rel)) {
        continue;
      }

      if (entry.isDirectory()) {
        walk(sourcePath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }

      files.push({
        sourcePath,
        targetPath: join(targetRoot, rel),
      });
    }
  };

  if (existsSync(sourceRoot)) {
    walk(sourceRoot);
  }

  return files;
}

function collectExpectedSyncItems(opts: CliOptions): SyncItem[] {
  const syncItems: SyncItem[] = [];
  for (const map of SOURCE_TARGETS) {
    const src = join(PROJECT_ROOT, map.sourceRoot);
    if (!existsSync(src) && map.optional) {
      continue;
    }
    syncItems.push(...collectFilesRecursive(src, join(opts.configDir, map.targetRoot)));
  }

  for (const skill of INSTALLED_SKILLS) {
    const skillSource = join(PROJECT_ROOT, 'skills', skill);
    if (!existsSync(skillSource)) {
      continue;
    }
    syncItems.push(...collectFilesRecursive(skillSource, join(opts.opencodeHome, 'skills', skill)));
  }

  return syncItems;
}

function collectMissingExpectedSourceRoots(): string[] {
  const missing: string[] = [];
  for (const map of SOURCE_TARGETS) {
    const src = join(PROJECT_ROOT, map.sourceRoot);
    if (!existsSync(src) && !map.optional) {
      missing.push(src);
    }
  }
  for (const skill of INSTALLED_SKILLS) {
    const skillSource = join(PROJECT_ROOT, 'skills', skill);
    if (!existsSync(skillSource)) {
      missing.push(skillSource);
    }
  }
  return missing;
}

function loadManagedStateForVerify(opts: CliOptions): VerifyManagedState {
  const path = join(opts.configDir, MANAGED_DIR_NAME, MANAGED_FILES_FILE);
  if (!existsSync(path)) {
    return { kind: 'missing', path };
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { kind: 'invalid', path, error: 'unexpected manifest shape' };
    }

    const candidate = parsed as Partial<ManagedState>;
    if (candidate.version !== 1 || typeof candidate.updatedAt !== 'string' || !candidate.files || typeof candidate.files !== 'object' || Array.isArray(candidate.files)) {
      return { kind: 'invalid', path, error: 'unexpected manifest shape' };
    }

    for (const [target, record] of Object.entries(candidate.files)) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        return { kind: 'invalid', path, error: `invalid managed file record for ${target}` };
      }
      const managed = record as Partial<ManagedFile>;
      if (typeof managed.targetPath !== 'string') {
        return { kind: 'invalid', path, error: `invalid managed file record for ${target}: targetPath must be a string` };
      }
      if (typeof managed.sourcePath !== 'string') {
        return { kind: 'invalid', path, error: `invalid managed file record for ${target}: sourcePath must be a string` };
      }
      if (typeof managed.checksum !== 'string') {
        return { kind: 'invalid', path, error: `invalid managed file record for ${target}: checksum must be a string` };
      }
      if (typeof managed.installedAt !== 'string') {
        return { kind: 'invalid', path, error: `invalid managed file record for ${target}: installedAt must be a string` };
      }
      if (typeof managed.lastAction !== 'string' || !MANAGED_FILE_ACTIONS.has(managed.lastAction)) {
        return { kind: 'invalid', path, error: `invalid managed file record for ${target}: lastAction must be install, update, rollback, or uninstall` };
      }
    }

    return { kind: 'ok', path, state: candidate as ManagedState };
  } catch (error) {
    return { kind: 'invalid', path, error: error instanceof Error ? error.message : 'invalid json' };
  }
}

function ensureParentDir(targetPath: string, dryRun: boolean) {
  if (dryRun) {
    return;
  }
  mkdirSync(dirname(targetPath), { recursive: true });
}

function removeTarget(path: string, dryRun: boolean) {
  if (!existsSync(path)) {
    return;
  }
  if (dryRun) {
    return;
  }

  const stat = lstatSync(path);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    rmSync(path, { recursive: true, force: true });
    return;
  }
  rmSync(path, { force: true });
}

function backupPathFor(targetPath: string, backupId: string): string {
  return `${targetPath}.backup-${backupId}`;
}

function safeOverwriteHint(reason: string): string {
  switch (reason) {
    case 'user-modified':
      return 'managed file was modified locally; rerun with --force to overwrite';
    case 'unmanaged-existing':
      return 'existing target is not managed by legion-mind; rerun with --force to back up and overwrite';
    case 'non-file-target':
      return 'existing target is not a regular file; rerun with --force to remove it';
    default:
      return `skipped to avoid overwriting existing content (${reason})`;
  }
}

function canOverwrite(
  targetPath: string,
  sourceFingerprintValue: string,
  strategy: Strategy,
  managedState: ManagedState,
  force: boolean,
): { allowed: boolean; reason: string } {
  if (!existsSync(targetPath)) {
    return { allowed: true, reason: 'missing-target' };
  }

  const stat = lstatSync(targetPath);
  if (stat.isDirectory()) {
    if (!force) {
      return { allowed: false, reason: 'unmanaged-existing' };
    }
    return { allowed: true, reason: 'force-overwrite-directory' };
  }

  if (stat.isFile() && strategy === 'copy' && sha256(targetPath) === sourceFingerprintValue) {
    return { allowed: false, reason: 'same-content' };
  }

  if (stat.isSymbolicLink() && strategy === 'symlink') {
    const current = `symlink:${resolvedLinkTarget(targetPath)}`;
    if (current === sourceFingerprintValue) {
      return { allowed: false, reason: 'same-content' };
    }
  }

  const managed = managedState.files[targetPath];

  if (stat.isSymbolicLink() && managed) {
    const current = `symlink:${resolvedLinkTarget(targetPath)}`;
    if (current === managed.checksum) {
      return { allowed: true, reason: 'managed-unchanged' };
    }
    if (!force) {
      return { allowed: false, reason: 'user-modified' };
    }
    return { allowed: true, reason: 'force-overwrite-managed' };
  }

  if (stat.isSymbolicLink() && !managed) {
    if (!force) {
      return { allowed: false, reason: 'unmanaged-existing' };
    }
    return { allowed: true, reason: 'force-overwrite-unmanaged' };
  }

  if (stat.isFile() && strategy === 'copy' && managed && sha256(targetPath) === managed.checksum) {
    return { allowed: true, reason: 'managed-unchanged' };
  }

  if (!managed) {
    if (!force) {
      return { allowed: false, reason: 'unmanaged-existing' };
    }
    return { allowed: true, reason: 'force-overwrite-unmanaged' };
  }

  if (!stat.isFile()) {
    if (!force) {
      return { allowed: false, reason: 'user-modified' };
    }
    return { allowed: true, reason: 'force-overwrite-managed' };
  }

  const currentChecksum = sha256(targetPath);
  if (currentChecksum === managed.checksum) {
    return { allowed: true, reason: 'managed-unchanged' };
  }

  if (!force) {
    return { allowed: false, reason: 'user-modified' };
  }

  return { allowed: true, reason: 'force-overwrite-managed' };
}

function syncOneFile(
  item: SyncItem,
  opts: CliOptions,
  managedState: ManagedState,
  backupBatch: BackupBatch,
  reporter: Reporter,
  counters: { copied: number; linked: number; skipped: number },
) {
  const existedBefore = existsSync(item.targetPath);
  const previousManaged = managedState.files[item.targetPath] ?? null;
  const sourceChecksum = sourceFingerprint(item.sourcePath, opts.strategy);
  const decision = canOverwrite(item.targetPath, sourceChecksum, opts.strategy, managedState, opts.force);

  if (!decision.allowed) {
    if (decision.reason === 'same-content') {
      managedState.files[item.targetPath] = {
        targetPath: item.targetPath,
        sourcePath: item.sourcePath,
        checksum: sourceChecksum,
        installedAt: previousManaged?.installedAt ?? new Date().toISOString(),
        lastAction: previousManaged ? 'update' : 'install',
      };

      if (!previousManaged) {
        counters.skipped += 1;
        reporter.emit('OK_ADOPT', 'sync', 'same-content', item.targetPath, 'already matches source; recorded as managed without overwrite');
        return;
      }

      counters.skipped += 1;
      reporter.emit('OK_VERIFY', 'sync', 'same-content', item.targetPath, 'already managed and up-to-date');
      return;
    }

    counters.skipped += 1;
    reporter.emit('W_SAFE_SKIP', 'sync', decision.reason, item.targetPath, safeOverwriteHint(decision.reason));
    return;
  }

  if (existsSync(item.targetPath)) {
    const backupPath = backupPathFor(item.targetPath, backupBatch.backupId);
    if (existsSync(backupPath)) {
      removeTarget(backupPath, opts.dryRun);
    }
    if (!opts.dryRun) {
      renameSync(item.targetPath, backupPath);
    }
    backupBatch.entries.push({
      targetPath: item.targetPath,
      backupPath,
      reason: decision.reason,
      preManaged: previousManaged ? { ...previousManaged } : null,
    });
    reporter.emit('OK_BACKUP', 'sync', 'backup-created', item.targetPath, backupPath);
  }

  ensureParentDir(item.targetPath, opts.dryRun);

  if (opts.strategy === 'copy') {
    if (!opts.dryRun) {
      copyFileSync(item.sourcePath, item.targetPath);
    }
    counters.copied += 1;
  } else {
    if (!opts.dryRun) {
      symlinkSync(item.sourcePath, item.targetPath);
    }
    counters.linked += 1;
  }

  managedState.files[item.targetPath] = {
    targetPath: item.targetPath,
    sourcePath: item.sourcePath,
    checksum: sourceChecksum,
    installedAt: new Date().toISOString(),
    lastAction: existedBefore ? 'update' : 'install',
  };

  reporter.emit('OK_SYNC', 'sync', opts.strategy, item.targetPath, relative(PROJECT_ROOT, item.sourcePath));
}

function runInstall(opts: CliOptions, runId: string, reporter: Reporter): InstallState {
  const stateDir = join(opts.configDir, MANAGED_DIR_NAME);
  const managedFilePath = join(stateDir, MANAGED_FILES_FILE);
  const backupIndexPath = join(stateDir, BACKUP_INDEX_FILE);

  const managedState = loadJsonOrDefault<ManagedState>(managedFilePath, {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    files: {},
  });
  const backupIndex = loadJsonOrDefault<BackupIndex>(backupIndexPath, {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    backups: [],
  });

  const backupBatch: BackupBatch = {
    backupId: `${Date.now()}-${runId.slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    entries: [],
  };

  const syncItems = collectExpectedSyncItems(opts);

  const counters = { copied: 0, linked: 0, skipped: 0 };
  for (const item of syncItems) {
    syncOneFile(item, opts, managedState, backupBatch, reporter, counters);
  }

  managedState.updatedAt = new Date().toISOString();
  backupIndex.updatedAt = new Date().toISOString();
  if (backupBatch.entries.length > 0) {
    backupIndex.backups.push(backupBatch);
  }

  writeJsonAtomic(managedFilePath, managedState, opts.dryRun);
  writeJsonAtomic(backupIndexPath, backupIndex, opts.dryRun);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    runId,
    command: 'install',
    code: reporter.failures > 0 ? 'E_SYNC_PARTIAL' : 'OK_INSTALL',
    summary: {
      copied: counters.copied,
      linked: counters.linked,
      skipped: counters.skipped,
      warnings: reporter.warnings,
      failures: reporter.failures,
    },
  };
}

function parseMcpConfigured(configPath: string): boolean {
  if (!existsSync(configPath)) {
    return false;
  }
  try {
    const parsed = JSON.parse(readFileSync(configPath, 'utf-8')) as {
      mcp?: Record<string, unknown>;
    };
    return !!parsed.mcp?.legionmind;
  } catch {
    return false;
  }
}

function requiredVerifyChecks(opts: CliOptions) {
  return [
    {
      checkId: 'assets.agents',
      target: join(opts.configDir, 'agents', 'legion.md'),
      required: true,
    },
    {
      checkId: 'assets.skill-workflow',
      target: join(opts.opencodeHome, 'skills', 'legion-workflow', 'SKILL.md'),
      required: true,
    },
    {
      checkId: 'assets.skill-docs',
      target: join(opts.opencodeHome, 'skills', 'legion-docs', 'SKILL.md'),
      required: true,
    },
    {
      checkId: 'assets.legion-cli',
      target: join(opts.opencodeHome, 'skills', 'legion-workflow', 'scripts', 'legion.ts'),
      required: true,
    },
    {
      checkId: 'fallback.filesystem',
      target: join(opts.opencodeHome, 'skills', 'legion-docs', 'references', 'REF_SCHEMAS.md'),
      required: true,
    },
    {
      checkId: 'assets.subagents',
      target: join(opts.opencodeHome, 'skills', 'spec-rfc', 'SKILL.md'),
      required: true,
    },
    ...INSTALLED_SKILLS.filter((skill) => !['legion-docs', 'legion-workflow', 'spec-rfc'].includes(skill)).map((skill) => ({
      checkId: `assets.skill.${skill}`,
      target: join(opts.opencodeHome, 'skills', skill, 'SKILL.md'),
      required: true,
    })),
  ];
}

function verifyStrictItem(
  item: SyncItem,
  managedState: ManagedState,
  reporter: Reporter,
): number {
  const checkId = `asset.${relative(PROJECT_ROOT, item.sourcePath)}`;
  if (!existsSync(item.sourcePath)) {
    reporter.emit('E_VERIFY_SOURCE_MISSING', 'verify', checkId, item.sourcePath, 'repository install source is incomplete; reinstall package or run from complete checkout');
    return 1;
  }

  let stat;
  try {
    stat = lstatSync(item.targetPath);
  } catch {
    reporter.emit('E_VERIFY_MISSING', 'verify', checkId, item.targetPath, 'run setup-opencode install to restore missing asset');
    return 1;
  }

  const managed = managedState.files[item.targetPath];
  if (!managed) {
    reporter.emit('E_VERIFY_UNMANAGED', 'verify', checkId, item.targetPath, 'required asset is not managed; run install --force to back up unmanaged file and install Legion asset');
    return 1;
  }

  if (managed.checksum.startsWith('symlink:')) {
    const expected = sourceFingerprint(item.sourcePath, 'symlink');
    if (!stat.isSymbolicLink()) {
      reporter.emit('E_VERIFY_TYPE_MISMATCH', 'verify', checkId, item.targetPath, 'target type differs from managed install; remove or force reinstall after backup');
      return 1;
    }
    const current = `symlink:${resolvedLinkTarget(item.targetPath)}`;
    if (current !== expected || managed.checksum !== expected) {
      reporter.emit('E_VERIFY_LINK_DRIFT', 'verify', checkId, item.targetPath, 'symlink target drifted; rerun install --strategy=symlink --force');
      return 1;
    }
    reporter.emit('OK_VERIFY', 'verify', checkId, item.targetPath, 'managed symlink matches source');
    return 0;
  }

  if (!stat.isFile()) {
    reporter.emit('E_VERIFY_TYPE_MISMATCH', 'verify', checkId, item.targetPath, 'target type differs from managed install; remove or force reinstall after backup');
    return 1;
  }
  const expected = sourceFingerprint(item.sourcePath, 'copy');
  if (sha256(item.targetPath) !== expected || managed.checksum !== expected) {
    reporter.emit('E_VERIFY_CHECKSUM', 'verify', checkId, item.targetPath, 'local drift detected; run setup-opencode install --force to overwrite after reviewing local changes');
    return 1;
  }
  reporter.emit('OK_VERIFY', 'verify', checkId, item.targetPath, 'managed copy matches source');
  return 0;
}

function runVerify(opts: CliOptions, runId: string, reporter: Reporter): InstallState {
  let hardFailures = 0;

  const verifyManifest = loadManagedStateForVerify(opts);
  if (verifyManifest.kind !== 'ok') {
    const hint = verifyManifest.kind === 'missing'
      ? 'managed manifest missing; run install to create managed-files.v1.json; use --force if conflicts are reported'
      : `managed manifest invalid (${verifyManifest.error}); run install to recreate it, or use --force if conflicts are reported`;
    reporter.emit(opts.strict ? 'E_VERIFY_MANIFEST' : 'W_VERIFY_MANIFEST', 'verify', 'manifest', verifyManifest.path, hint);
    if (opts.strict) {
      hardFailures += 1;
    }
  }

  if (opts.strict) {
    for (const sourceRoot of collectMissingExpectedSourceRoots()) {
      reporter.emit('E_VERIFY_SOURCE_MISSING', 'verify', `source.${relative(PROJECT_ROOT, sourceRoot)}`, sourceRoot, 'repository install source is incomplete; reinstall package or run from complete checkout');
      hardFailures += 1;
    }

    const syncItems = collectExpectedSyncItems(opts);
    for (const item of syncItems) {
      if (verifyManifest.kind === 'ok') {
        hardFailures += verifyStrictItem(item, verifyManifest.state, reporter);
        continue;
      }

      if (!existsSync(item.sourcePath)) {
        reporter.emit('E_VERIFY_SOURCE_MISSING', 'verify', `asset.${relative(PROJECT_ROOT, item.sourcePath)}`, item.sourcePath, 'repository install source is incomplete; reinstall package or run from complete checkout');
        hardFailures += 1;
      } else if (!existsSync(item.targetPath)) {
        reporter.emit('E_VERIFY_MISSING', 'verify', `asset.${relative(PROJECT_ROOT, item.sourcePath)}`, item.targetPath, 'run setup-opencode install to restore missing asset');
        hardFailures += 1;
      }
    }
  } else {
    for (const check of requiredVerifyChecks(opts)) {
      if (existsSync(check.target)) {
        reporter.emit('OK_VERIFY', 'verify', check.checkId, check.target, 'present');
      } else {
        reporter.emit('W_VERIFY_MISSING', 'verify', check.checkId, check.target, 'missing required file');
      }
    }
  }

  const mcpConfigured = parseMcpConfigured(join(opts.configDir, 'opencode.json'))
    || parseMcpConfigured(join(opts.opencodeHome, 'opencode.json'));
  if (!mcpConfigured) {
    reporter.emit('W_MCP_OPTIONAL', 'verify', 'mcp.optional', 'mcp.legionmind', 'not configured; filesystem-backed CLI remains optional tooling, while legion-workflow stays the control-plane entry');
  } else {
    reporter.emit('OK_VERIFY', 'verify', 'mcp.optional', 'mcp.legionmind', 'configured as historical compatibility');
  }

  const strictFailed = opts.strict && hardFailures > 0;
  const code = strictFailed ? 'E_VERIFY_STRICT' : 'READY';
  if (opts.json) {
    reporter.emit(code, 'verify', 'result', opts.configDir, strictFailed ? 'run install to repair assets' : 'all strict checks passed');
  } else {
    console.log(code);
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    runId,
    command: 'verify',
    code,
    summary: {
      copied: 0,
      linked: 0,
      skipped: 0,
      warnings: reporter.warnings,
      failures: strictFailed ? 1 : 0,
    },
  };
}

function runRollback(opts: CliOptions, runId: string, reporter: Reporter): InstallState {
  const stateDir = join(opts.configDir, MANAGED_DIR_NAME);
  const managedFilePath = join(stateDir, MANAGED_FILES_FILE);
  const backupIndexPath = join(stateDir, BACKUP_INDEX_FILE);

  const managedState = loadJsonOrDefault<ManagedState>(managedFilePath, {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    files: {},
  });
  const backupIndex = loadJsonOrDefault<BackupIndex>(backupIndexPath, {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    backups: [],
  });

  const batch = opts.toBackupId
    ? backupIndex.backups.find((item) => item.backupId === opts.toBackupId)
    : backupIndex.backups[backupIndex.backups.length - 1];

  if (!batch) {
    reporter.emit('E_PRECHECK', 'rollback', 'backup-id', opts.toBackupId ?? '(latest)', 'no backup entries found');
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      runId,
      command: 'rollback',
      code: 'E_PRECHECK',
      summary: { copied: 0, linked: 0, skipped: 0, warnings: reporter.warnings, failures: 1 },
    };
  }

  for (const entry of batch.entries) {
    if (!isManagedTargetPath(entry.targetPath, opts)) {
      reporter.emit('E_PRECHECK', 'rollback', 'invalid-target', entry.targetPath, 'outside managed roots');
      return {
        version: 1,
        timestamp: new Date().toISOString(),
        runId,
        command: 'rollback',
        code: 'E_PRECHECK',
        summary: { copied: 0, linked: 0, skipped: 0, warnings: reporter.warnings, failures: 1 },
      };
    }

    const expectedBackupPath = backupPathFor(entry.targetPath, batch.backupId);
    if (canonicalFilePath(entry.backupPath) !== canonicalFilePath(expectedBackupPath)) {
      reporter.emit('E_PRECHECK', 'rollback', 'invalid-backup', entry.backupPath, `expected ${expectedBackupPath}`);
      return {
        version: 1,
        timestamp: new Date().toISOString(),
        runId,
        command: 'rollback',
        code: 'E_PRECHECK',
        summary: { copied: 0, linked: 0, skipped: 0, warnings: reporter.warnings, failures: 1 },
      };
    }
  }

  let restored = 0;
  for (const entry of batch.entries) {
    if (!existsSync(entry.backupPath)) {
      reporter.emit('W_ROLLBACK_SKIP', 'rollback', 'missing-backup', entry.targetPath, entry.backupPath);
      continue;
    }

    ensureParentDir(entry.targetPath, opts.dryRun);
    removeTarget(entry.targetPath, opts.dryRun);
    if (!opts.dryRun) {
      renameSync(entry.backupPath, entry.targetPath);
    }
    if (entry.preManaged) {
      managedState.files[entry.targetPath] = entry.preManaged;
    } else {
      delete managedState.files[entry.targetPath];
    }
    restored += 1;
    reporter.emit('OK_ROLLBACK', 'rollback', 'restored', entry.targetPath, entry.backupPath);
  }

  managedState.updatedAt = new Date().toISOString();
  backupIndex.backups = backupIndex.backups.filter((item) => item.backupId !== batch.backupId);
  backupIndex.updatedAt = new Date().toISOString();
  writeJsonAtomic(managedFilePath, managedState, opts.dryRun);
  writeJsonAtomic(backupIndexPath, backupIndex, opts.dryRun);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    runId,
    command: 'rollback',
    code: reporter.failures > 0 ? 'E_ROLLBACK_PARTIAL' : 'OK_ROLLBACK',
    summary: { copied: restored, linked: 0, skipped: 0, warnings: reporter.warnings, failures: reporter.failures },
  };
}

function runUninstall(opts: CliOptions, runId: string, reporter: Reporter): InstallState {
  const stateDir = join(opts.configDir, MANAGED_DIR_NAME);
  const managedFilePath = join(stateDir, MANAGED_FILES_FILE);
  const managedState = loadJsonOrDefault<ManagedState>(managedFilePath, {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    files: {},
  });

  let removed = 0;
  let skipped = 0;
  for (const [targetPath, meta] of Object.entries(managedState.files)) {
    if (!isManagedTargetPath(targetPath, opts)) {
      reporter.emit('E_PRECHECK', 'uninstall', 'invalid-target', targetPath, 'outside managed roots');
      return {
        version: 1,
        timestamp: new Date().toISOString(),
        runId,
        command: 'uninstall',
        code: 'E_PRECHECK',
        summary: { copied: removed, linked: 0, skipped, warnings: reporter.warnings, failures: 1 },
      };
    }

    if (!existsSync(targetPath)) {
      delete managedState.files[targetPath];
      continue;
    }

    const stat = lstatSync(targetPath);
    if (stat.isFile()) {
      const current = sha256(targetPath);
      if (current !== meta.checksum && !opts.force) {
        skipped += 1;
        reporter.emit('W_SAFE_SKIP', 'uninstall', 'user-modified', targetPath, 'use --force to remove');
        continue;
      }
    } else if (!opts.force) {
      skipped += 1;
      reporter.emit('W_SAFE_SKIP', 'uninstall', 'non-file-target', targetPath, 'use --force to remove');
      continue;
    }

    removeTarget(targetPath, opts.dryRun);
    delete managedState.files[targetPath];
    removed += 1;
    reporter.emit('OK_UNINSTALL', 'uninstall', 'removed', targetPath, 'managed file removed');
  }

  managedState.updatedAt = new Date().toISOString();
  writeJsonAtomic(managedFilePath, managedState, opts.dryRun);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    runId,
    command: 'uninstall',
    code: reporter.failures > 0 ? 'E_SYNC_PARTIAL' : 'OK_UNINSTALL',
    summary: { copied: removed, linked: 0, skipped, warnings: reporter.warnings, failures: reporter.failures },
  };
}

function run() {
  const opts = parseArgs(process.argv.slice(2));
  const runId = randomUUID();
  const reporter = new Reporter(runId, opts.json);

  const stateDir = join(opts.configDir, MANAGED_DIR_NAME);
  const installStatePath = join(stateDir, INSTALL_STATE_FILE);

  let result: InstallState;
  if (opts.command === 'install') {
    result = runInstall(opts, runId, reporter);
  } else if (opts.command === 'verify') {
    result = runVerify(opts, runId, reporter);
  } else if (opts.command === 'rollback') {
    result = runRollback(opts, runId, reporter);
  } else {
    result = runUninstall(opts, runId, reporter);
  }

  writeJsonAtomic(installStatePath, result, opts.dryRun);

  if (opts.json) {
    console.log(JSON.stringify(result));
  }

  if (result.code === 'E_VERIFY_STRICT' || result.code.startsWith('E_')) {
    process.exit(1);
  }
}

run();
