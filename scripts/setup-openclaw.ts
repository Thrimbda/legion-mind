#!/usr/bin/env node --experimental-strip-types

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'fs';
import { dirname, join, relative, resolve } from 'path';
import { homedir } from 'os';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import {
  type BackupBatch,
  type BackupIndex,
  type Command,
  type InstallStateBase,
  type ManagedState,
  Reporter,
  type Strategy,
  type SyncItem,
  type VerifyManagedState,
  createManagedRootSet,
  emptyBackupIndex,
  emptyManagedState,
  loadJsonOrDefault,
  rollbackCore,
  syncOneFileCore,
  uninstallCore,
  validateBackupIndexFile,
  validateManagedStateFile,
  verifyStrictItemCore,
  writeJsonAtomic,
} from './lib/setup-core.ts';

interface CliOptions {
  command: Command;
  strict: boolean;
  dryRun: boolean;
  force: boolean;
  json: boolean;
  strategy: Strategy;
  toBackupId: string | null;
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

interface InstallState extends InstallStateBase {
  code: string;
  configPath: string;
  openclawHome: string;
  sourceSkillsDir: string;
  targetSkillsDir: string;
}

const MANAGED_FILE_ACTIONS = new Set(['install', 'update', 'rollback', 'uninstall']);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);

const MANAGED_DIR_NAME = '.legionmind';
const INSTALL_STATE_FILE = 'install-state.v1.json';
const MANAGED_FILES_FILE = 'managed-files.v1.json';
const BACKUP_INDEX_FILE = 'backup-index.v1.json';

const SENSITIVE_BASENAMES = new Set(['openclaw.json', 'opencode.json', 'antigravity-accounts.json']);

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

  const configDir = resolve(getValue('--config-dir') ?? join(homedir(), '.openclaw'));
  const openclawHome = resolve(getValue('--openclaw-home') ?? configDir);

  return {
    command,
    strict: argv.includes('--strict'),
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    json: argv.includes('--json'),
    strategy: strategyValue,
    toBackupId: getValue('--to'),
    configureExtraDir: !argv.includes('--no-extra-dir'),
    configDir,
    openclawHome,
    sourceSkillsDir: resolve(getValue('--skills-dir') ?? join(PROJECT_ROOT, 'skills')),
  };
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

function managedRootPaths(opts: CliOptions): string[] {
  return [join(opts.openclawHome, 'skills')];
}

function loadManagedStateForVerify(opts: CliOptions): VerifyManagedState {
  const path = join(opts.openclawHome, MANAGED_DIR_NAME, MANAGED_FILES_FILE);
  return validateManagedStateFile(path, MANAGED_FILE_ACTIONS);
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

  const managedState = loadJsonOrDefault<ManagedState>(managedFilePath, emptyManagedState());
  const backupIndex = loadJsonOrDefault<BackupIndex>(backupIndexPath, emptyBackupIndex());

  const backupBatch: BackupBatch = {
    backupId: `${Date.now()}-${runId.slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    entries: [],
  };

  configureExtraSkillsDir(opts, reporter);

  const syncItems = collectExpectedSyncItems(opts);
  const counters = { copied: 0, linked: 0, skipped: 0 };
  const lifecycleContext = { projectRoot: PROJECT_ROOT, strategy: opts.strategy, dryRun: opts.dryRun, force: opts.force, managedRoots: createManagedRootSet(managedRootPaths(opts)) };
  for (const item of syncItems) {
    syncOneFileCore(item, lifecycleContext, managedState, backupBatch, reporter, counters);
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
        hardFailures += verifyStrictItemCore(item, verifyManifest.state, reporter, PROJECT_ROOT, 'setup-openclaw');
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

function runRollback(opts: CliOptions, runId: string, reporter: Reporter): InstallState {
  const stateDir = join(opts.openclawHome, MANAGED_DIR_NAME);
  const managedFilePath = join(stateDir, MANAGED_FILES_FILE);
  const backupIndexPath = join(stateDir, BACKUP_INDEX_FILE);

  const base = {
    version: 1 as const,
    timestamp: new Date().toISOString(),
    runId,
    command: 'rollback' as const,
    configPath: join(opts.configDir, 'openclaw.json'),
    openclawHome: opts.openclawHome,
    sourceSkillsDir: opts.sourceSkillsDir,
    targetSkillsDir: join(opts.openclawHome, 'skills'),
  };

  const managedState = loadJsonOrDefault<ManagedState>(managedFilePath, emptyManagedState());
  const backupIndexResult = validateBackupIndexFile(backupIndexPath);
  if (backupIndexResult.kind !== 'ok') {
    reporter.emit('E_PRECHECK', 'rollback', 'backup-index', backupIndexResult.path, backupIndexResult.kind === 'missing' ? 'backup index missing' : `backup index invalid (${backupIndexResult.error})`);
    return { ...base, code: 'E_PRECHECK', summary: { copied: 0, linked: 0, skipped: 0, warnings: reporter.warnings, failures: 1 } };
  }
  const result = rollbackCore({ managedState, backupIndex: backupIndexResult.index, backupIndexPath, toBackupId: opts.toBackupId, ctx: { projectRoot: PROJECT_ROOT, strategy: opts.strategy, dryRun: opts.dryRun, force: opts.force, managedRoots: createManagedRootSet(managedRootPaths(opts)) }, reporter });
  if (!result.code.startsWith('E_')) {
    writeJsonAtomic(managedFilePath, result.managedState, opts.dryRun);
    writeJsonAtomic(backupIndexPath, result.backupIndex, opts.dryRun);
  }
  return { ...base, code: result.code, summary: { copied: result.restored, linked: 0, skipped: result.skipped, warnings: reporter.warnings, failures: result.code.startsWith('E_') ? 1 : reporter.failures } };
}

function runUninstall(opts: CliOptions, runId: string, reporter: Reporter): InstallState {
  const stateDir = join(opts.openclawHome, MANAGED_DIR_NAME);
  const managedFilePath = join(stateDir, MANAGED_FILES_FILE);
  const managedState = loadJsonOrDefault<ManagedState>(managedFilePath, emptyManagedState());
  const result = uninstallCore({ managedState, ctx: { projectRoot: PROJECT_ROOT, strategy: opts.strategy, dryRun: opts.dryRun, force: opts.force, managedRoots: createManagedRootSet(managedRootPaths(opts)) }, reporter });
  if (!result.code.startsWith('E_')) {
    writeJsonAtomic(managedFilePath, result.managedState, opts.dryRun);
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    runId,
    command: 'uninstall',
    code: result.code,
    configPath: join(opts.configDir, 'openclaw.json'),
    openclawHome: opts.openclawHome,
    sourceSkillsDir: opts.sourceSkillsDir,
    targetSkillsDir: join(opts.openclawHome, 'skills'),
    summary: { copied: result.removed, linked: 0, skipped: result.skipped, warnings: reporter.warnings, failures: result.code.startsWith('E_') ? 1 : reporter.failures },
  };
}

function run() {
  let opts: CliOptions | null = null;
  try {
    opts = parseArgs(process.argv.slice(2));
    const runId = randomUUID();
    const reporter = new Reporter(runId, opts.json);
    const installStatePath = join(opts.openclawHome, MANAGED_DIR_NAME, INSTALL_STATE_FILE);

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
