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
  statSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, join, relative, resolve, sep } from 'path';
import { homedir } from 'os';
import { createHash, randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

type Command = 'install' | 'verify';
type Strategy = 'copy' | 'symlink';

interface CliOptions {
  command: Command;
  strict: boolean;
  dryRun: boolean;
  force: boolean;
  json: boolean;
  strategy: Strategy;
  configureExtraDir: boolean;
  configDir: string;
  openclawHome: string;
  sourceSkillsDir: string;
}

interface OpenClawConfig {
  skills?: {
    load?: {
      extraDirs?: string[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface ManagedFile {
  targetPath: string;
  sourcePath: string;
  checksum: string;
  installedAt: string;
  lastAction: 'install' | 'update';
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
  configPath: string;
  openclawHome: string;
  sourceSkillsDir: string;
  targetSkillsDir: string;
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

const MANAGED_FILE_ACTIONS = new Set(['install', 'update']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);

const MANAGED_DIR_NAME = '.legionmind';
const INSTALL_STATE_FILE = 'install-state.v1.json';
const MANAGED_FILES_FILE = 'managed-files.v1.json';
const BACKUP_INDEX_FILE = 'backup-index.v1.json';

const SENSITIVE_BASENAMES = new Set(['openclaw.json', 'opencode.json', 'antigravity-accounts.json']);

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
  if (!['install', 'verify'].includes(command)) {
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

  const configDir = resolve(getValue('--config-dir') ?? join(homedir(), '.openclaw'));
  const openclawHome = resolve(getValue('--openclaw-home') ?? configDir);

  return {
    command,
    strict: argv.includes('--strict'),
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    json: argv.includes('--json'),
    strategy: strategyValue,
    configureExtraDir: !argv.includes('--no-extra-dir'),
    configDir,
    openclawHome,
    sourceSkillsDir: resolve(getValue('--skills-dir') ?? join(PROJECT_ROOT, 'skills')),
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

function assertDirectory(path: string, label: string) {
  if (!existsSync(path)) {
    throw new Error(`${label} does not exist: ${path}`);
  }

  if (!statSync(path).isDirectory()) {
    throw new Error(`${label} is not a directory: ${path}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function loadConfig(configPath: string): OpenClawConfig {
  if (!existsSync(configPath)) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse existing OpenClaw config JSON: ${message}`);
  }

  if (!isRecord(parsed)) {
    throw new Error(`OpenClaw config must be a JSON object: ${configPath}`);
  }

  return parsed as OpenClawConfig;
}

function getExtraDirs(config: OpenClawConfig, configPath: string): string[] {
  if (config.skills !== undefined && !isRecord(config.skills)) {
    throw new Error(`OpenClaw config has a non-object skills value: ${configPath}`);
  }

  if (config.skills?.load !== undefined && !isRecord(config.skills.load)) {
    throw new Error(`OpenClaw config has a non-object skills.load value: ${configPath}`);
  }

  const extraDirs = config.skills?.load?.extraDirs;

  if (extraDirs === undefined) {
    return [];
  }

  if (!Array.isArray(extraDirs) || extraDirs.some((item) => typeof item !== 'string')) {
    throw new Error(`OpenClaw config has a non-string skills.load.extraDirs value: ${configPath}`);
  }

  return extraDirs;
}

function withSkillsDir(config: OpenClawConfig, skillsDir: string, configPath: string): { config: OpenClawConfig; changed: boolean } {
  const extraDirs = getExtraDirs(config, configPath);
  if (extraDirs.includes(skillsDir)) {
    return { config, changed: false };
  }

  const nextSkills = isRecord(config.skills) ? { ...config.skills } : {};
  const nextLoad = isRecord(nextSkills.load) ? { ...nextSkills.load } : {};

  nextLoad.extraDirs = [...extraDirs, skillsDir];
  nextSkills.load = nextLoad;

  return {
    config: {
      ...config,
      skills: nextSkills,
    },
    changed: true,
  };
}

function writeJsonAtomic(path: string, value: unknown, dryRun: boolean) {
  if (dryRun) {
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`);
  renameSync(tempPath, path);
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

  const name = normalized[normalized.length - 1] ?? '';
  if (SENSITIVE_BASENAMES.has(name)) {
    return true;
  }

  if (/\.env($|\.)/i.test(name)) {
    return true;
  }

  if (/(credential|secret|token)/i.test(name)) {
    return true;
  }

  return false;
}

function discoverSkillNames(sourceSkillsDir: string): string[] {
  if (!existsSync(sourceSkillsDir) || !statSync(sourceSkillsDir).isDirectory()) {
    return [];
  }

  return readdirSync(sourceSkillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => existsSync(join(sourceSkillsDir, name, 'SKILL.md')))
    .sort();
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
  for (const skill of discoverSkillNames(opts.sourceSkillsDir)) {
    const skillSource = join(opts.sourceSkillsDir, skill);
    syncItems.push(...collectFilesRecursive(skillSource, join(opts.openclawHome, 'skills', skill)));
  }
  return syncItems;
}

function collectMissingExpectedSourceRoots(opts: CliOptions): string[] {
  const missing: string[] = [];
  if (!existsSync(opts.sourceSkillsDir) || !statSync(opts.sourceSkillsDir).isDirectory()) {
    missing.push(opts.sourceSkillsDir);
    return missing;
  }

  if (discoverSkillNames(opts.sourceSkillsDir).length === 0) {
    missing.push(join(opts.sourceSkillsDir, '<skill>/SKILL.md'));
  }

  return missing;
}

function managedRoots(opts: CliOptions): string[] {
  return [join(opts.openclawHome, 'skills')].map(canonicalDirectoryPath);
}

function isManagedTargetPath(path: string, opts: CliOptions): boolean {
  const canonicalTarget = canonicalFilePath(path);
  return managedRoots(opts).some((root) => isWithinRoot(canonicalTarget, root));
}

function loadManagedStateForVerify(opts: CliOptions): VerifyManagedState {
  const path = join(opts.openclawHome, MANAGED_DIR_NAME, MANAGED_FILES_FILE);
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
        return { kind: 'invalid', path, error: `invalid managed file record for ${target}: lastAction must be install or update` };
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
  if (!existsSync(path) || dryRun) {
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
      return 'managed file was modified locally; rerun with --force to overwrite after reviewing local changes';
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
      return { allowed: false, reason: 'non-file-target' };
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
  if (!isManagedTargetPath(item.targetPath, opts)) {
    reporter.emit('E_PRECHECK', 'sync', 'invalid-target', item.targetPath, 'target path is outside OpenClaw managed skills root');
    return;
  }

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

      counters.skipped += 1;
      reporter.emit(previousManaged ? 'OK_VERIFY' : 'OK_ADOPT', 'sync', 'same-content', item.targetPath, previousManaged ? 'already managed and up-to-date' : 'already matches source; recorded as managed without overwrite');
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

function configureExtraSkillsDir(opts: CliOptions, reporter: Reporter): boolean {
  if (!opts.configureExtraDir) {
    reporter.emit('OK_CONFIG', 'config', 'extra-dir-skipped', opts.sourceSkillsDir, 'skipped because --no-extra-dir was provided');
    return false;
  }

  const configPath = join(opts.configDir, 'openclaw.json');
  const existing = loadConfig(configPath);
  const { config, changed } = withSkillsDir(existing, opts.sourceSkillsDir, configPath);

  if (changed) {
    writeJsonAtomic(configPath, config, opts.dryRun);
  }

  reporter.emit('OK_CONFIG', 'config', changed ? 'extra-dir-updated' : 'extra-dir-present', configPath, changed ? 'OpenClaw config includes the source skills directory' : 'OpenClaw config already includes the source skills directory');
  return changed;
}

function runInstall(opts: CliOptions, runId: string, reporter: Reporter): InstallState {
  assertDirectory(opts.sourceSkillsDir, 'Source skills directory');
  const skillNames = discoverSkillNames(opts.sourceSkillsDir);
  if (skillNames.length === 0) {
    throw new Error(`Source skills directory does not contain any skill with SKILL.md: ${opts.sourceSkillsDir}`);
  }

  const stateDir = join(opts.openclawHome, MANAGED_DIR_NAME);
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

  configureExtraSkillsDir(opts, reporter);

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
    configPath: join(opts.configDir, 'openclaw.json'),
    openclawHome: opts.openclawHome,
    sourceSkillsDir: opts.sourceSkillsDir,
    targetSkillsDir: join(opts.openclawHome, 'skills'),
    summary: {
      copied: counters.copied,
      linked: counters.linked,
      skipped: counters.skipped,
      warnings: reporter.warnings,
      failures: reporter.failures,
    },
  };
}

function verifyConfigExtraDir(opts: CliOptions, reporter: Reporter): number {
  if (!opts.configureExtraDir) {
    reporter.emit('OK_VERIFY', 'verify', 'config.extra-dir-skipped', opts.sourceSkillsDir, 'skipped because --no-extra-dir was provided');
    return 0;
  }

  const configPath = join(opts.configDir, 'openclaw.json');
  if (!existsSync(configPath)) {
    reporter.emit('W_VERIFY_CONFIG', 'verify', 'config.openclaw-json', configPath, 'OpenClaw config not found; managed/local skills may still be discoverable from openclaw home');
    return 0;
  }

  const config = loadConfig(configPath);
  const configured = getExtraDirs(config, configPath).includes(opts.sourceSkillsDir);
  if (configured) {
    reporter.emit('OK_VERIFY', 'verify', 'config.extra-dir', configPath, 'source skills directory configured in skills.load.extraDirs');
    return 0;
  }

  reporter.emit('W_VERIFY_CONFIG', 'verify', 'config.extra-dir', configPath, 'source skills directory is not configured; run install to update openclaw.json or verify with --no-extra-dir');
  return 0;
}

function requiredVerifyChecks(opts: CliOptions) {
  return discoverSkillNames(opts.sourceSkillsDir).map((skill) => ({
    checkId: `assets.skill.${skill}`,
    target: join(opts.openclawHome, 'skills', skill, 'SKILL.md'),
  }));
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
    reporter.emit('E_VERIFY_MISSING', 'verify', checkId, item.targetPath, 'run setup-openclaw install to restore missing asset');
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
    reporter.emit('E_VERIFY_CHECKSUM', 'verify', checkId, item.targetPath, 'local drift detected; run setup-openclaw install --force to overwrite after reviewing local changes');
    return 1;
  }
  reporter.emit('OK_VERIFY', 'verify', checkId, item.targetPath, 'managed copy matches source');
  return 0;
}

function runVerify(opts: CliOptions, runId: string, reporter: Reporter): InstallState {
  let hardFailures = 0;

  hardFailures += verifyConfigExtraDir(opts, reporter);

  const missingSources = collectMissingExpectedSourceRoots(opts);
  for (const sourceRoot of missingSources) {
    reporter.emit(opts.strict ? 'E_VERIFY_SOURCE_MISSING' : 'W_VERIFY_SOURCE_MISSING', 'verify', `source.${relative(PROJECT_ROOT, sourceRoot)}`, sourceRoot, 'repository install source is incomplete; reinstall package or run from complete checkout');
    if (opts.strict) {
      hardFailures += 1;
    }
  }

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
        reporter.emit('E_VERIFY_MISSING', 'verify', `asset.${relative(PROJECT_ROOT, item.sourcePath)}`, item.targetPath, 'run setup-openclaw install to restore missing asset');
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

  const strictFailed = opts.strict && hardFailures > 0;
  const code = strictFailed ? 'E_VERIFY_STRICT' : 'READY';
  if (opts.json) {
    reporter.emit(code, 'verify', 'result', opts.openclawHome, strictFailed ? 'run install to repair assets' : 'all checks passed');
  } else {
    console.log(code);
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    runId,
    command: 'verify',
    code,
    configPath: join(opts.configDir, 'openclaw.json'),
    openclawHome: opts.openclawHome,
    sourceSkillsDir: opts.sourceSkillsDir,
    targetSkillsDir: join(opts.openclawHome, 'skills'),
    summary: {
      copied: 0,
      linked: 0,
      skipped: 0,
      warnings: reporter.warnings,
      failures: strictFailed ? 1 : 0,
    },
  };
}

function run() {
  let opts: CliOptions | null = null;
  try {
    opts = parseArgs(process.argv.slice(2));
    const runId = randomUUID();
    const reporter = new Reporter(runId, opts.json);
    const installStatePath = join(opts.openclawHome, MANAGED_DIR_NAME, INSTALL_STATE_FILE);

    const result = opts.command === 'install'
      ? runInstall(opts, runId, reporter)
      : runVerify(opts, runId, reporter);

    writeJsonAtomic(installStatePath, result, opts.dryRun);

    if (opts.json) {
      console.log(JSON.stringify(result));
    }

    if (result.code === 'E_VERIFY_STRICT' || result.code.startsWith('E_')) {
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (opts?.json) {
      console.log(JSON.stringify({ ok: false, command: opts.command, message }));
    } else {
      console.error(message);
    }
    process.exit(1);
  }
}

run();
