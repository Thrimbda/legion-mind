#!/usr/bin/env node --experimental-strip-types

import {
  existsSync,
  readdirSync,
  readFileSync,
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
  configDir: string;
  opencodeHome: string;
}

type InstallState = InstallStateBase;

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
  'git-worktree-pr',
  'spec-rfc',
  'review-rfc',
  'engineer',
  'verify-change',
  'review-change',
  'report-walkthrough',
] as const;

const SENSITIVE_BASENAMES = new Set(['opencode.json', 'antigravity-accounts.json']);

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

function managedRootPaths(opts: CliOptions): string[] {
  return [
    join(opts.configDir, 'agents'),
    join(opts.configDir, 'plugins'),
    ...INSTALLED_SKILLS.map((skill) => join(opts.opencodeHome, 'skills', skill)),
  ];
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
  return validateManagedStateFile(path, MANAGED_FILE_ACTIONS);
}

function runInstall(opts: CliOptions, runId: string, reporter: Reporter): InstallState {
  const stateDir = join(opts.configDir, MANAGED_DIR_NAME);
  const managedFilePath = join(stateDir, MANAGED_FILES_FILE);
  const backupIndexPath = join(stateDir, BACKUP_INDEX_FILE);

  const managedState = loadJsonOrDefault<ManagedState>(managedFilePath, emptyManagedState());
  const backupIndex = loadJsonOrDefault<BackupIndex>(backupIndexPath, emptyBackupIndex());

  const backupBatch: BackupBatch = {
    backupId: `${Date.now()}-${runId.slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    entries: [],
  };

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
        hardFailures += verifyStrictItemCore(item, verifyManifest.state, reporter, PROJECT_ROOT, 'setup-opencode');
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

  const managedState = loadJsonOrDefault<ManagedState>(managedFilePath, emptyManagedState());
  const backupIndexResult = validateBackupIndexFile(backupIndexPath);
  if (backupIndexResult.kind !== 'ok') {
    reporter.emit('E_PRECHECK', 'rollback', 'backup-index', backupIndexResult.path, backupIndexResult.kind === 'missing' ? 'backup index missing' : `backup index invalid (${backupIndexResult.error})`);
    return { version: 1, timestamp: new Date().toISOString(), runId, command: 'rollback', code: 'E_PRECHECK', summary: { copied: 0, linked: 0, skipped: 0, warnings: reporter.warnings, failures: 1 } };
  }
  const result = rollbackCore({
    managedState,
    backupIndex: backupIndexResult.index,
    backupIndexPath,
    toBackupId: opts.toBackupId,
    ctx: { projectRoot: PROJECT_ROOT, strategy: opts.strategy, dryRun: opts.dryRun, force: opts.force, managedRoots: createManagedRootSet(managedRootPaths(opts)) },
    reporter,
  });
  if (!result.code.startsWith('E_')) {
    writeJsonAtomic(managedFilePath, result.managedState, opts.dryRun);
    writeJsonAtomic(backupIndexPath, result.backupIndex, opts.dryRun);
  }

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    runId,
    command: 'rollback',
    code: result.code,
    summary: { copied: result.restored, linked: 0, skipped: result.skipped, warnings: reporter.warnings, failures: result.code.startsWith('E_') ? 1 : reporter.failures },
  };
}

function runUninstall(opts: CliOptions, runId: string, reporter: Reporter): InstallState {
  const stateDir = join(opts.configDir, MANAGED_DIR_NAME);
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
    summary: { copied: result.removed, linked: 0, skipped: result.skipped, warnings: reporter.warnings, failures: result.code.startsWith('E_') ? 1 : reporter.failures },
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
