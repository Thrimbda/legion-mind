#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {


  backupPathFor,
  createManagedRootSet,
  emptyBackupIndex,
  emptyManagedState,
  formatInstallStateSummary,


  Reporter,
  rollbackCore,
  sha256,

  syncOneFileCore,
  validateBackupIndexFile,
  validateManagedStateFile,
  verifyStrictItemCore,
} from './lib/setup-core.js';
import {
  assertExistingLegionPiPackageLayoutSafe,
  assertRealDirectoryPath,
  assertSafeLegionPiProfileRoot,
  credentialFreeEnvironment,
  defaultLegionPiProfileDir,
  jsonFingerprint,


  loadLegionPiConfig,
  PI_CORE_TOOLS,
  PI_EXTENSION_PACKAGES,
  PI_EXTENSION_TOOL_SENTINELS,
  PI_RUNTIME_PACKAGE,
  renderActiveConfig,
  renderPiSettings,
  renderRestrictedSubagentConfig,
  resolveLegionPiProfilePaths,
  validateInstalledLegionPiExtension,
  validateInstalledLegionPiPackages,
  validateInstalledLegionPiRuntime,
} from './lib/pi-distro.js';


























const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = dirname(__dirname);
const DEFAULT_CONFIG_PATH = join(PROJECT_ROOT, 'legion-pi', 'legion-pi.json');
const MANAGED_FILE_ACTIONS = new Set(['install', 'update', 'rollback', 'uninstall']);
const VALUE_OPTIONS = new Set(['--profile-dir', '--config', '--to']);
const FLAG_OPTIONS = new Set(['--force', '--verbose', '--json', '--help', '-h', '--version', '-v']);
const COMMANDS = new Set           (['install', 'verify', 'rollback']);

function packageVersion()         {
  try {
    const value = JSON.parse(readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf-8'))                         ;
    return typeof value.version === 'string' ? value.version : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function printHelp() {
  console.log(`setup-pi ${packageVersion()}

Install, verify, or roll back an isolated Legion Pi profile.

Usage:
  setup-pi [install|verify|rollback] [options]

Commands:
  install      Install or update Legion Pi from one config file (default)
  verify       Verify managed files, exact package versions, and extension startup
  rollback     Restore the latest backup batch, or --to <backup-id>

Options:
  --profile-dir <path>  Legion Pi profile root (default: ~/.legion-pi)
  --config <path>       Single source config (default: packaged legion-pi.json)
  --to <backup-id>      Backup id for rollback
  --force               Back up and replace drifted managed files
  --verbose             Show lifecycle and package command details
  --json                Emit machine-readable events and result
  --help, -h            Show this help
  --version, -v         Print the CLI version

Legion Pi requires Node.js 24 or newer. The reviewed default and enabled model
policy is managed by legion-pi.json. Provider credentials remain in Pi login
state or environment-backed runtime references and are never managed here.
`);
}

function getValue(argv          , name        )                {
  const exact = argv.find((arg) => arg.startsWith(`${name}=`));
  if (exact) {
    const value = exact.slice(name.length + 1);
    if (!value) throw new Error(`${name} requires a value`);
    return value;
  }
  const index = argv.indexOf(name);
  if (index >= 0) {
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    return value;
  }
  return null;
}

function findCommandArg(argv          )                {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg || arg.startsWith('--')) continue;
    if (index > 0 && VALUE_OPTIONS.has(argv[index - 1])) continue;
    return arg;
  }
  return null;
}

function parseArgs(argv          )             {
  const positional           = [];
  const seenOptions = new Set        ();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (VALUE_OPTIONS.has(arg)) {
      if (seenOptions.has(arg)) throw new Error(`Duplicate option: ${arg}`);
      seenOptions.add(arg);
      index += 1;
      continue;
    }
    const valueOption = [...VALUE_OPTIONS].find((name) => arg.startsWith(`${name}=`));
    if (valueOption) {
      if (seenOptions.has(valueOption)) throw new Error(`Duplicate option: ${valueOption}`);
      seenOptions.add(valueOption);
      continue;
    }
    if (FLAG_OPTIONS.has(arg)) {
      if (seenOptions.has(arg)) throw new Error(`Duplicate option: ${arg}`);
      seenOptions.add(arg);
      continue;
    }
    if (arg.startsWith('-')) throw new Error(`Unsupported option: ${arg}`);
    positional.push(arg);
  }
  if (positional.length > 1) throw new Error(`Unexpected positional argument: ${positional[1]}`);

  const command = (findCommandArg(argv) ?? 'install')             ;
  if (!COMMANDS.has(command)) throw new Error(`Unsupported command: ${command}`);
  const configValue = getValue(argv, '--config');
  const toBackupId = getValue(argv, '--to');
  if (toBackupId && command !== 'rollback') throw new Error('--to is only valid with rollback');
  if (argv.includes('--force') && command === 'verify') throw new Error('--force is not valid with verify');
  if (configValue && command === 'rollback') throw new Error('--config is not valid with rollback');
  return {
    command,
    profileDir: resolve(getValue(argv, '--profile-dir') ?? defaultLegionPiProfileDir()),
    configPath: resolve(configValue ?? DEFAULT_CONFIG_PATH),
    configExplicit: configValue !== null,
    force: argv.includes('--force'),
    json: argv.includes('--json'),
    verbose: argv.includes('--verbose'),
    toBackupId,
  };
}

function assertNode24() {
  const major = Number(process.versions.node.split('.')[0]);
  if (!Number.isInteger(major) || major < 24) {
    throw new Error(`Legion Pi requires Node.js 24 or newer; current runtime is ${process.versions.node}`);
  }
}

function assertSafeProfile(paths                      , create         ) {
  assertSafeLegionPiProfileRoot(paths.profileDir, PROJECT_ROOT, create);

  const probeRoot = join(paths.stateDir, 'startup-probe');
  const ownedDirectories = [
    paths.runtimeDir,
    join(paths.runtimeDir, 'node_modules'),
    join(paths.runtimeDir, 'node_modules', '.bin'),
    join(paths.runtimeDir, 'node_modules', ...PI_RUNTIME_PACKAGE.split('/').slice(0, -1)),
    join(paths.runtimeDir, 'node_modules', ...PI_RUNTIME_PACKAGE.split('/')),
    paths.agentDir,
    join(paths.agentDir, 'npm'),
    join(paths.agentDir, 'npm', 'node_modules'),
    ...PI_EXTENSION_PACKAGES.map((name) => join(paths.agentDir, 'npm', 'node_modules', name)),
    join(paths.agentDir, 'extensions'),
    dirname(paths.subagentConfigPath),
    paths.sessionDir,
    paths.stateDir,
    paths.generatedDir,
    paths.npmCacheDir,
    probeRoot,
    join(probeRoot, 'home'),
    join(probeRoot, 'xdg'),
    join(probeRoot, 'xdg', 'config'),
    join(probeRoot, 'xdg', 'data'),
    join(probeRoot, 'xdg', 'cache'),
    join(probeRoot, 'workspace'),
    join(probeRoot, 'lens'),
    join(probeRoot, 'tmp'),
  ];
  for (const path of ownedDirectories) {
    assertRealDirectoryPath(path);
  }
}

function generatedItems(paths                      )             {
  return [
    { sourcePath: join(paths.generatedDir, 'active-config.v1.json'), targetPath: paths.activeConfigPath },
    { sourcePath: join(paths.generatedDir, 'settings.json'), targetPath: paths.settingsPath },
    { sourcePath: join(paths.generatedDir, 'subagent-config.json'), targetPath: paths.subagentConfigPath },
  ];
}

function writePiJsonAtomic(path        , data         ) {
  const parent = dirname(path);
  mkdirSync(parent, { recursive: true });
  const temporaryPath = join(parent, `.legion-pi-${process.pid}-${randomUUID()}.tmp`);
  try {
    writeFileSync(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, {
      encoding: 'utf-8',
      flag: 'wx',
      mode: 0o600,
    });
    renameSync(temporaryPath, path);
  } finally {
    rmSync(temporaryPath, { recursive: true, force: true });
  }
}

function assertManagedTargetsAreNotSymlinks(paths                      ) {
  for (const item of generatedItems(paths)) {
    let stat                              ;
    try {
      stat = lstatSync(item.targetPath);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') continue;
      throw error;
    }
    if (stat.isSymbolicLink()) {
      throw new Error(`Legion Pi managed target must not be a symlink: ${item.targetPath}`);
    }
  }
}

function writeGeneratedSources(config                , paths                      ) {
  writePiJsonAtomic(join(paths.generatedDir, 'active-config.v1.json'), renderActiveConfig(config));
  writePiJsonAtomic(join(paths.generatedDir, 'settings.json'), renderPiSettings(config));
  writePiJsonAtomic(join(paths.generatedDir, 'subagent-config.json'), renderRestrictedSubagentConfig());
}

function assertInstallConfigOutsideOwnedRoots(configPath        , paths                      ) {
  const lexicalConfig = resolve(configPath);
  let canonicalConfig        ;
  try {
    canonicalConfig = realpathSync(configPath);
  } catch (error) {
    throw new Error(`Legion Pi config must be an existing file: ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const ownedRoots = [paths.runtimeDir, paths.agentDir, paths.sessionDir, paths.stateDir];
  if (ownedRoots.some((root) => isWithin(lexicalConfig, resolve(root)) || isWithin(canonicalConfig, resolve(root)))) {
    throw new Error(`Legion Pi config must be outside installer-owned profile paths: ${configPath}`);
  }
}

function loadManagedStateForInstall(paths                      , reporter          )                      {
  const result = validateManagedStateFile(paths.managedFilePath, MANAGED_FILE_ACTIONS);
  if (result.kind === 'missing') return emptyManagedState();
  if (result.kind === 'invalid') {
    reporter.emit('E_PRECHECK', 'install', 'managed-manifest', result.path, result.error);
    return null;
  }
  return result.state;
}

function loadBackupIndexForInstall(paths                      , reporter          )                     {
  const result = validateBackupIndexFile(paths.backupIndexPath);
  if (result.kind === 'missing') return emptyBackupIndex();
  if (result.kind === 'invalid') {
    reporter.emit('E_PRECHECK', 'install', 'backup-index', result.path, result.error);
    return null;
  }
  return result.index;
}

function managedContext(paths                      , force         ) {
  return {
    projectRoot: PROJECT_ROOT,
    strategy: 'copy'         ,
    dryRun: false,
    force,
    managedRoots: createManagedRootSet([paths.profileDir]),
  };
}

function packagePath(root        , packageName        ) {
  return join(root, 'node_modules', ...packageName.split('/'), 'package.json');
}

function piBinaryPath(paths                      ) {
  return join(paths.runtimeDir, 'node_modules', '.bin', process.platform === 'win32' ? 'pi.cmd' : 'pi');
}

function packageEnvironment(paths                      ) {
  return {
    ...process.env,
    PI_CODING_AGENT_DIR: paths.agentDir,
    PI_CODING_AGENT_SESSION_DIR: paths.sessionDir,
    PI_OFFLINE: '1',
    PI_SKIP_VERSION_CHECK: '1',
    PI_TELEMETRY: '0',
    npm_config_cache: paths.npmCacheDir,
    npm_config_ignore_scripts: 'true',
    npm_config_update_notifier: 'false',
    npm_config_audit: 'false',
    npm_config_fund: 'false',
  };
}

function processFailureHint(result                              )         {
  if (result.error) return result.error.message;
  const stderr = typeof result.stderr === 'string' ? result.stderr.trim().split(/\r?\n/).at(-1) : '';
  return stderr || `process exited with status ${result.status ?? 'unknown'}`;
}

function runPackageCommand(input








 )          {
  const result = spawnSync(input.executable, input.args, {
    cwd: input.cwd,
    env: input.env,
    encoding: 'utf-8',
    stdio: input.verbose ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  if (result.error || result.status !== 0) {
    input.reporter.emit('E_PACKAGE', 'packages', input.checkId, input.target, processFailureHint(result));
    return false;
  }
  input.reporter.emit('OK_PACKAGE', 'packages', input.checkId, input.target, 'exact package installed');
  return true;
}

function verifyPackageVersions(config                , paths                      , reporter          )         {
  try {
    validateInstalledLegionPiPackages(config, paths);
    reporter.emit('OK_VERIFY', 'verify', 'package.pi', config.packages.pi.spec, 'exact runtime package installed');
    for (const extension of config.packages.extensions) {
      reporter.emit('OK_VERIFY', 'verify', `package.${extension.name}`, extension.spec, 'exact extension package installed');
    }
    return 0;
  } catch (error) {
    reporter.emit('E_VERIFY_PACKAGE', 'verify', 'package-layout', paths.profileDir, error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function installPackages(config                , paths                      , reporter          , verbose         )          {
  try {
    assertExistingLegionPiPackageLayoutSafe(paths);
  } catch (error) {
    reporter.emit('E_PACKAGE', 'packages', 'existing-layout', paths.profileDir, error instanceof Error ? error.message : String(error));
    return false;
  }
  mkdirSync(paths.runtimeDir, { recursive: true });
  mkdirSync(paths.agentDir, { recursive: true });
  mkdirSync(paths.sessionDir, { recursive: true });
  mkdirSync(paths.npmCacheDir, { recursive: true });

  const env = packageEnvironment(paths);
  const npmBin = process.env.LEGION_PI_NPM_BIN || 'npm';
  if (!runPackageCommand({
    executable: npmBin,
    args: ['install', '--prefix', paths.runtimeDir, '--no-package-lock', '--no-save', '--ignore-scripts', config.packages.pi.spec],
    cwd: paths.profileDir,
    env,
    reporter,
    checkId: 'runtime',
    target: config.packages.pi.spec,
    verbose,
  })) return false;

  try {
    validateInstalledLegionPiRuntime(config, paths);
  } catch (error) {
    reporter.emit('E_PACKAGE', 'packages', 'runtime-layout', config.packages.pi.spec, error instanceof Error ? error.message : String(error));
    return false;
  }

  const piBinary = piBinaryPath(paths);
  if (!existsSync(piBinary)) {
    reporter.emit('E_PACKAGE', 'packages', 'runtime-bin', piBinary, 'installed runtime did not expose the pi executable');
    return false;
  }

  for (const extension of config.packages.extensions) {
    if (!runPackageCommand({
      executable: piBinary,
      args: ['install', `npm:${extension.spec}`],
      cwd: paths.profileDir,
      env,
      reporter,
      checkId: extension.name,
      target: extension.spec,
      verbose,
    })) return false;
    try {
      validateInstalledLegionPiExtension(extension, paths);
    } catch (error) {
      reporter.emit('E_PACKAGE', 'packages', `layout.${extension.name}`, extension.spec, error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  return verifyPackageVersions(config, paths, reporter) === 0;
}

function probeEnvironment(paths                      ) {
  const probeRoot = join(paths.stateDir, 'startup-probe');
  mkdirSync(join(probeRoot, 'home'), { recursive: true });
  mkdirSync(join(probeRoot, 'xdg', 'config'), { recursive: true });
  mkdirSync(join(probeRoot, 'xdg', 'data'), { recursive: true });
  mkdirSync(join(probeRoot, 'xdg', 'cache'), { recursive: true });
  mkdirSync(join(probeRoot, 'workspace'), { recursive: true });
  mkdirSync(join(probeRoot, 'tmp'), { recursive: true });
  return {
    cwd: join(probeRoot, 'workspace'),
    env: credentialFreeEnvironment({
      ...packageEnvironment(paths),
      HOME: join(probeRoot, 'home'),
      XDG_CONFIG_HOME: join(probeRoot, 'xdg', 'config'),
      XDG_DATA_HOME: join(probeRoot, 'xdg', 'data'),
      XDG_CACHE_HOME: join(probeRoot, 'xdg', 'cache'),
      TMPDIR: join(probeRoot, 'tmp'),
      TMP: join(probeRoot, 'tmp'),
      TEMP: join(probeRoot, 'tmp'),
      PI_LENS_HOME: join(probeRoot, 'lens'),
    }),
  };
}

function isWithin(path        , root        ) {
  return path === root || path.startsWith(`${root}${sep}`);
}

function runStartupProbe(config                , paths                      , reporter          )         {
  const probeScript = join(PROJECT_ROOT, 'scripts', 'pi-startup-probe.mjs');
  const isolated = probeEnvironment(paths);
  const result = spawnSync(process.execPath, [probeScript, paths.runtimeDir, paths.agentDir], {
    cwd: isolated.cwd,
    env: isolated.env,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error || result.status !== 0) {
    reporter.emit('E_VERIFY_STARTUP', 'verify', 'startup-probe', paths.profileDir, processFailureHint(result));
    return 1;
  }
  const marker = String(result.stdout).split(/\r?\n/).find((line) => line.startsWith('LEGION_PI_PROBE='));
  if (!marker) {
    reporter.emit('E_VERIFY_STARTUP', 'verify', 'startup-probe', paths.profileDir, 'probe did not return a structured result');
    return 1;
  }

  let payload              ;
  try {
    payload = JSON.parse(marker.slice('LEGION_PI_PROBE='.length))                ;
  } catch {
    reporter.emit('E_VERIFY_STARTUP', 'verify', 'startup-probe', paths.profileDir, 'probe returned invalid JSON');
    return 1;
  }
  const extensionRoots = new Map(config.packages.extensions.map((item) => [
    item.name,
    realpathSync(dirname(packagePath(join(paths.agentDir, 'npm'), item.name))),
  ]));
  const loadedNames = new Set        ();
  const unexpected           = [];
  for (const path of payload.extensions) {
    try {
      const canonical = realpathSync(path);
      if (!statSync(canonical).isFile()) throw new Error('extension entrypoint is not a file');
      const matched = config.packages.extensions.find((item) => isWithin(canonical, extensionRoots.get(item.name) ));
      if (matched) loadedNames.add(matched.name);
      else unexpected.push(path);
    } catch {
      unexpected.push(path);
    }
  }
  const missing = config.packages.extensions.filter((item) => !loadedNames.has(item.name));
  const requiredTools = [
    ...PI_CORE_TOOLS,
    ...config.packages.extensions.flatMap((item) => PI_EXTENSION_TOOL_SENTINELS[item.name                                            ]),
  ];
  const missingTools = requiredTools.filter((name) => !payload.tools.includes(name));
  if (payload.errors.length > 0 || payload.duplicates.length > 0 || missing.length > 0 || unexpected.length > 0 || missingTools.length > 0) {
    const parts = [
      payload.errors.length > 0 ? `${payload.errors.length} loader error(s)` : '',
      payload.duplicates.length > 0 ? `duplicate tools: ${payload.duplicates.join(', ')}` : '',
      missing.length > 0 ? `missing extensions: ${missing.map((item) => item.name).join(', ')}` : '',
      unexpected.length > 0 ? `unexpected extensions: ${unexpected.join(', ')}` : '',
      missingTools.length > 0 ? `missing tools: ${missingTools.join(', ')}` : '',
    ].filter(Boolean);
    reporter.emit('E_VERIFY_STARTUP', 'verify', 'startup-probe', paths.profileDir, parts.join('; '));
    return 1;
  }
  reporter.emit('OK_VERIFY', 'verify', 'startup-probe', paths.profileDir, `${payload.extensions.length} extensions and ${payload.tools.length} unique tools loaded`);
  return 0;
}

function baseState(opts            , command           , runId        , code        , summary                           )                 {
  return {
    version: 1,
    timestamp: new Date().toISOString(),
    runId,
    command,
    code,
    profileDir: opts.profileDir,
    configPath: opts.configPath,
    summary,
  };
}

function runInstall(opts            , runId        , reporter          )                 {
  const paths = resolveLegionPiProfilePaths(opts.profileDir);
  assertSafeProfile(paths, true);
  assertManagedTargetsAreNotSymlinks(paths);
  assertInstallConfigOutsideOwnedRoots(opts.configPath, paths);
  const config = loadLegionPiConfig(opts.configPath);
  assertExistingLegionPiPackageLayoutSafe(paths);
  const managedState = loadManagedStateForInstall(paths, reporter);
  const backupIndex = loadBackupIndexForInstall(paths, reporter);
  if (!managedState || !backupIndex) {
    return baseState(opts, 'install', runId, 'E_PRECHECK', { copied: 0, linked: 0, skipped: 0, warnings: reporter.warnings, failures: reporter.failures });
  }

  writeGeneratedSources(config, paths);
  const items = generatedItems(paths);
  const backupBatch              = {
    backupId: `${Date.now()}-${runId.slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    entries: [],
  };
  const counters = { copied: 0, linked: 0, skipped: 0 };
  const context = managedContext(paths, opts.force);
  for (const item of items) syncOneFileCore(item, context, managedState, backupBatch, reporter, counters);

  let syncFailed = reporter.failures > 0 || reporter.warnings > 0;
  for (const item of items) {
    if (!existsSync(item.targetPath) || sha256(item.targetPath) !== sha256(item.sourcePath)) {
      reporter.emit('E_SYNC_PARTIAL', 'sync', 'generated-drift', item.targetPath, 'managed output does not match legion-pi.json; review drift or rerun with --force');
      syncFailed = true;
    }
  }

  managedState.updatedAt = new Date().toISOString();
  backupIndex.updatedAt = new Date().toISOString();
  if (backupBatch.entries.length > 0) backupIndex.backups.push(backupBatch);
  writePiJsonAtomic(paths.managedFilePath, managedState);
  writePiJsonAtomic(paths.backupIndexPath, backupIndex);

  if (syncFailed) {
    return baseState(opts, 'install', runId, 'E_SYNC_PARTIAL', {
      copied: counters.copied,
      linked: 0,
      skipped: counters.skipped,
      warnings: reporter.warnings,
      failures: Math.max(1, reporter.failures),
    });
  }

  const packagesReady = installPackages(config, paths, reporter, opts.verbose);
  const probeFailures = packagesReady ? runStartupProbe(config, paths, reporter) : 1;
  const code = packagesReady && probeFailures === 0 ? 'OK_INSTALL' : 'E_PACKAGE';
  return baseState(opts, 'install', runId, code, {
    copied: counters.copied,
    linked: 0,
    skipped: counters.skipped,
    warnings: reporter.warnings,
    failures: code.startsWith('E_') ? Math.max(1, reporter.failures) : 0,
  });
}

function readJson(path        )          {
  return JSON.parse(readFileSync(path, 'utf-8'))           ;
}

function verifyRenderedConfig(config                , paths                      , reporter          )         {
  const expected = [
    { path: paths.activeConfigPath, value: renderActiveConfig(config), checkId: 'config.active' },
    { path: paths.settingsPath, value: renderPiSettings(config), checkId: 'config.settings' },
    { path: paths.subagentConfigPath, value: renderRestrictedSubagentConfig(), checkId: 'config.subagents' },
  ];
  let failures = 0;
  for (const item of expected) {
    try {
      if (jsonFingerprint(readJson(item.path)) !== jsonFingerprint(item.value)) throw new Error('content mismatch');
      reporter.emit('OK_VERIFY', 'verify', item.checkId, item.path, 'generated content matches active Legion Pi config');
    } catch {
      reporter.emit('E_VERIFY_CONFIG', 'verify', item.checkId, item.path, 'missing, invalid, or inconsistent generated config');
      failures += 1;
    }
  }
  return failures;
}

function runVerify(opts            , runId        , reporter          )                 {
  const paths = resolveLegionPiProfilePaths(opts.profileDir);
  assertSafeProfile(paths, false);
  if (opts.configExplicit) assertInstallConfigOutsideOwnedRoots(opts.configPath, paths);
  const activeConfig = loadLegionPiConfig(paths.activeConfigPath);
  let failures = 0;

  if (opts.configExplicit) {
    const requested = loadLegionPiConfig(opts.configPath);
    if (jsonFingerprint(renderActiveConfig(requested)) !== jsonFingerprint(renderActiveConfig(activeConfig))) {
      reporter.emit('E_VERIFY_CONFIG', 'verify', 'config.requested', opts.configPath, 'requested config differs from the active profile');
      failures += 1;
    }
  }

  const manifest = validateManagedStateFile(paths.managedFilePath, MANAGED_FILE_ACTIONS);
  if (manifest.kind !== 'ok') {
    reporter.emit('E_VERIFY_MANIFEST', 'verify', 'manifest', manifest.path, manifest.kind === 'missing' ? 'managed manifest is missing' : manifest.error);
    failures += 1;
  } else {
    for (const item of generatedItems(paths)) failures += verifyStrictItemCore(item, manifest.state, reporter, PROJECT_ROOT, 'setup-pi');
  }

  failures += verifyRenderedConfig(activeConfig, paths, reporter);
  const packageFailures = verifyPackageVersions(activeConfig, paths, reporter);
  failures += packageFailures;
  if (packageFailures === 0) failures += runStartupProbe(activeConfig, paths, reporter);
  const code = failures > 0 ? 'E_VERIFY_STRICT' : 'READY';
  return baseState(opts, 'verify', runId, code, {
    copied: 0,
    linked: 0,
    skipped: 0,
    warnings: reporter.warnings,
    failures: failures > 0 ? failures : 0,
  });
}

function packageSignature(config                       )         {
  if (!config) return '';
  return [config.packages.pi.spec, ...config.packages.extensions.map((item) => item.spec)].join('\n');
}

function tryLoadConfig(path        )                        {
  try {
    return loadLegionPiConfig(path);
  } catch {
    return null;
  }
}

function lstatIfPresent(path        )                                      {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null;
    throw error;
  }
}

function selectRollbackBatch(index             , backupId               )                     {
  return backupId
    ? index.backups.find((item) => item.backupId === backupId) ?? null
    : index.backups[index.backups.length - 1] ?? null;
}

function preflightRollback(
  paths                      ,
  managedState              ,
  backupIndex             ,
  backupId               ,
  force         ,
  reporter          ,
)                                                                        {
  const batch = selectRollbackBatch(backupIndex, backupId);
  if (!batch) {
    reporter.emit('E_PRECHECK', 'rollback', 'backup-id', backupId ?? '(latest)', 'no backup entries found');
    return null;
  }

  const allowedTargets = new Set(generatedItems(paths).map((item) => resolve(item.targetPath)));
  const driftedEntries                         = [];
  for (const entry of batch.entries) {
    const targetPath = resolve(entry.targetPath);
    const expectedBackupPath = backupPathFor(targetPath, batch.backupId);
    if (!allowedTargets.has(targetPath) || resolve(entry.backupPath) !== resolve(expectedBackupPath)) {
      reporter.emit('E_PRECHECK', 'rollback', 'invalid-entry', entry.targetPath, 'backup entry is not a Legion Pi managed target');
      return null;
    }

    const backupStat = lstatIfPresent(entry.backupPath);
    if (!backupStat || backupStat.isSymbolicLink()) {
      reporter.emit('E_PRECHECK', 'rollback', 'missing-backup', entry.targetPath, `required backup is missing or unsafe: ${entry.backupPath}`);
      return null;
    }

    const targetStat = lstatIfPresent(entry.targetPath);
    if (!targetStat) continue;
    if (targetStat.isSymbolicLink()) {
      reporter.emit('E_PRECHECK', 'rollback', 'symlink-target', entry.targetPath, 'rollback target must not be a symlink');
      return null;
    }
    const managed = managedState.files[entry.targetPath];
    const drifted = !targetStat.isFile()
      || !managed
      || managed.checksum.startsWith('symlink:')
      || sha256(entry.targetPath) !== managed.checksum;
    if (!drifted) continue;
    if (!force) {
      reporter.emit('E_ROLLBACK_DRIFT', 'rollback', 'current-drift', entry.targetPath, 'target changed after the backup; rerun with --force to preserve it before rollback');
      return null;
    }
    driftedEntries.push(entry);
  }
  return { batch, driftedEntries };
}

function createRollbackSafetyBatch(
  managedState              ,
  entries                        ,
  runId        ,
  reporter          ,
)                     {
  if (entries.length === 0) return null;
  const batch              = {
    backupId: `rollback-${Date.now()}-${runId.slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    entries: [],
  };
  try {
    for (const entry of entries) {
      const backupPath = backupPathFor(entry.targetPath, batch.backupId);
      if (lstatIfPresent(backupPath)) throw new Error(`rollback safety backup already exists: ${backupPath}`);
      const stat = lstatSync(entry.targetPath);
      cpSync(entry.targetPath, backupPath, {
        recursive: stat.isDirectory(),
        errorOnExist: true,
        force: false,
        preserveTimestamps: true,
      });
      batch.entries.push({
        targetPath: entry.targetPath,
        backupPath,
        reason: 'rollback-force-current-drift',
        preManaged: managedState.files[entry.targetPath] ? { ...managedState.files[entry.targetPath] } : null,
      });
      reporter.emit('OK_BACKUP', 'rollback', 'current-drift', entry.targetPath, backupPath);
    }
    return batch;
  } catch (error) {
    for (const entry of batch.entries) rmSync(entry.backupPath, { recursive: true, force: true });
    throw error;
  }
}

function runRollback(opts            , runId        , reporter          )                 {
  const paths = resolveLegionPiProfilePaths(opts.profileDir);
  assertSafeProfile(paths, false);
  const beforeConfig = tryLoadConfig(paths.activeConfigPath);
  const manifest = validateManagedStateFile(paths.managedFilePath, MANAGED_FILE_ACTIONS);
  const backupIndex = validateBackupIndexFile(paths.backupIndexPath);
  if (manifest.kind !== 'ok' || backupIndex.kind !== 'ok') {
    const target = manifest.kind !== 'ok' ? manifest.path : backupIndex.path;
    reporter.emit('E_PRECHECK', 'rollback', 'state', target, 'valid managed manifest and backup index are required');
    return baseState(opts, 'rollback', runId, 'E_PRECHECK', { copied: 0, linked: 0, skipped: 0, warnings: reporter.warnings, failures: 1 });
  }

  const preflight = preflightRollback(paths, manifest.state, backupIndex.index, opts.toBackupId, opts.force, reporter);
  if (!preflight) {
    return baseState(opts, 'rollback', runId, 'E_PRECHECK', { copied: 0, linked: 0, skipped: 0, warnings: reporter.warnings, failures: Math.max(1, reporter.failures) });
  }
  const safetyBatch = createRollbackSafetyBatch(manifest.state, preflight.driftedEntries, runId, reporter);

  const result = rollbackCore({
    managedState: manifest.state,
    backupIndex: backupIndex.index,
    backupIndexPath: paths.backupIndexPath,
    toBackupId: preflight.batch.backupId,
    ctx: managedContext(paths, opts.force),
    reporter,
  });
  if (result.code.startsWith('E_')) {
    if (safetyBatch) {
      for (const entry of safetyBatch.entries) rmSync(entry.backupPath, { recursive: true, force: true });
    }
    return baseState(opts, 'rollback', runId, result.code, { copied: result.restored, linked: 0, skipped: result.skipped, warnings: reporter.warnings, failures: 1 });
  }

  if (safetyBatch) {
    result.backupIndex.backups.push(safetyBatch);
    result.backupIndex.updatedAt = new Date().toISOString();
  }

  writePiJsonAtomic(paths.managedFilePath, result.managedState);
  writePiJsonAtomic(paths.backupIndexPath, result.backupIndex);
  const restoredConfig = tryLoadConfig(paths.activeConfigPath);
  if (!restoredConfig) {
    reporter.emit('E_ROLLBACK_CONFIG', 'rollback', 'restored-config', paths.activeConfigPath, 'restored user content is not a valid Legion Pi config; package reconciliation was skipped');
    return baseState(opts, 'rollback', runId, 'E_ROLLBACK_PARTIAL', {
      copied: result.restored,
      linked: 0,
      skipped: result.skipped,
      warnings: reporter.warnings,
      failures: Math.max(1, reporter.failures),
    });
  }
  writeGeneratedSources(restoredConfig, paths);

  let code = result.code;
  if (packageSignature(beforeConfig) !== packageSignature(restoredConfig)) {
    const packagesReady = installPackages(restoredConfig, paths, reporter, opts.verbose);
    if (!packagesReady || runStartupProbe(restoredConfig, paths, reporter) > 0) code = 'E_ROLLBACK_PARTIAL';
  }
  return baseState(opts, 'rollback', runId, code, {
    copied: result.restored,
    linked: 0,
    skipped: result.skipped,
    warnings: reporter.warnings,
    failures: code.startsWith('E_') ? Math.max(1, reporter.failures) : 0,
  });
}

function run() {
  const argv = process.argv.slice(2);
  const commandArg = findCommandArg(argv);
  if (argv.includes('--help') || argv.includes('-h') || commandArg === 'help') {
    printHelp();
    return;
  }
  if (argv.includes('--version') || argv.includes('-v') || commandArg === 'version') {
    console.log(packageVersion());
    return;
  }

  let opts                    = null;
  try {
    assertNode24();
    opts = parseArgs(argv);
    const runId = randomUUID();
    const reporter = new Reporter(runId, { json: opts.json, verbose: opts.verbose });
    let result                ;
    if (opts.command === 'install') result = runInstall(opts, runId, reporter);
    else if (opts.command === 'verify') result = runVerify(opts, runId, reporter);
    else result = runRollback(opts, runId, reporter);

    const paths = resolveLegionPiProfilePaths(opts.profileDir);
    writePiJsonAtomic(paths.installStatePath, result);
    if (opts.json) console.log(JSON.stringify(result));
    else console.log(formatInstallStateSummary(result, 'legion-pi'));
    if (result.code.startsWith('E_')) process.exit(1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (opts?.json) console.log(JSON.stringify({ ok: false, command: opts.command, message }));
    else console.error(message);
    process.exit(1);
  }
}

run();
