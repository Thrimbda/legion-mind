import { lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, parse, resolve, sep } from 'node:path';

export const PI_RUNTIME_PACKAGE = '@earendil-works/pi-coding-agent';
export const PI_EXTENSION_PACKAGES = ['pi-subagents', 'pi-mcp-adapter', 'pi-lens']         ;
export const PI_CORE_TOOLS = ['read', 'bash', 'edit', 'write']         ;
export const PI_EXTENSION_TOOL_SENTINELS                                                                    = {
  'pi-subagents': ['subagent', 'subagent_wait'],
  'pi-mcp-adapter': ['mcpScript', 'mcp'],
  'pi-lens': ['lens_diagnostics'],
};
export const PI_EXTENSION_ENTRYPOINTS                                                         = {
  'pi-subagents': 'index.ts',
  'pi-mcp-adapter': 'index.ts',
  'pi-lens': 'dist/index.js',
};

export const LEGION_PI_MODEL_POLICY = {
  defaultProvider: 'openai-codex',
  defaultModel: 'gpt-5.6-sol',
  enabledModels: [
    'openai-codex/*',
    'deepseek/*',
    'kimi-coding/k3',
    'kimi-coding/k3-256k',
  ],
}         ;






































const TOP_LEVEL_FIELDS_V1 = new Set(['schemaVersion', 'reviewedAt', 'packages', 'skills']);
const TOP_LEVEL_FIELDS_V2 = new Set([...TOP_LEVEL_FIELDS_V1, 'models']);
const PACKAGE_FIELDS = new Set(['pi', 'extensions']);
const MODEL_FIELDS = new Set(['defaultProvider', 'defaultModel', 'enabledModels']);
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

function isRecord(value         )                                   {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function lstatIfPresent(path        )                                      {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null;
    throw error;
  }
}

export function assertRealDirectoryPath(path        , label = 'Legion Pi owned path')          {
  const absolute = resolve(path);
  const stat = lstatIfPresent(absolute);
  if (!stat) return false;
  if (stat.isSymbolicLink() || !stat.isDirectory() || realpathSync(absolute) !== absolute) {
    throw new Error(`${label} must be a real directory without symlink traversal: ${absolute}`);
  }
  return true;
}

export function assertSafeLegionPiProfileRoot(profileDir        , projectRoot        , create         ) {
  const absolute = resolve(profileDir);
  const filesystemRoot = parse(absolute).root;
  if (absolute === filesystemRoot || absolute === resolve(homedir()) || absolute === resolve(projectRoot)) {
    throw new Error(`Refusing unsafe Legion Pi profile root: ${absolute}`);
  }

  if (!assertRealDirectoryPath(absolute, 'Legion Pi profile')) {
    if (!create) throw new Error(`Legion Pi profile does not exist: ${absolute}`);
    let ancestor = dirname(absolute);
    while (!assertRealDirectoryPath(ancestor, 'Legion Pi profile ancestor')) {
      const parent = dirname(ancestor);
      if (parent === ancestor) throw new Error(`No safe ancestor exists for Legion Pi profile: ${absolute}`);
      ancestor = parent;
    }
    mkdirSync(absolute, { recursive: true });
    assertRealDirectoryPath(absolute, 'Legion Pi profile');
  }
}

export function credentialFreeEnvironment(env                   )                    {
  const isolated                    = {};
  const allowed = new Set([
    'PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'SHELL',
    'LANG', 'LANGUAGE', 'LC_ALL', 'LC_CTYPE', 'TERM', 'COLORTERM', 'TZ',
    'HOME', 'TMPDIR', 'TMP', 'TEMP',
    'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'XDG_CACHE_HOME',
    'PI_CODING_AGENT_DIR', 'PI_CODING_AGENT_SESSION_DIR', 'PI_LENS_HOME',
    'PI_SUBAGENT_PI_BINARY', 'PI_OFFLINE', 'PI_SKIP_VERSION_CHECK', 'PI_TELEMETRY',
    'npm_config_cache', 'npm_config_ignore_scripts', 'npm_config_update_notifier',
    'npm_config_audit', 'npm_config_fund',
  ]);
  for (const name of allowed) {
    if (env[name] !== undefined) isolated[name] = env[name];
  }
  return isolated;
}

export function isPathWithin(path        , root        ) {
  return path === root || path.startsWith(`${root}${sep}`);
}

export function packageRootPath(base        , name        ) {
  return join(base, 'node_modules', ...name.split('/'));
}

export function assertCanonicalFileWithin(path        , root        , label        , allowFinalSymlink         ) {
  const entry = lstatIfPresent(path);
  if (!entry) throw new Error(`${label} is missing: ${path}`);
  if (!allowFinalSymlink && entry.isSymbolicLink()) throw new Error(`${label} must not be a symlink: ${path}`);
  const canonicalRoot = realpathSync(root);
  const canonical = realpathSync(path);
  const file = statSync(canonical);
  if (!file.isFile() || file.nlink !== 1 || !isPathWithin(canonical, canonicalRoot)) {
    throw new Error(`${label} must resolve to a single-link file inside ${canonicalRoot}: ${path}`);
  }
  return canonical;
}

function assertPackageTreeSafe(root        , label        ) {
  if (!assertRealDirectoryPath(root, label)) return;
  const canonicalRoot = realpathSync(root);
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop() ;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) {
        let canonical        ;
        try {
          canonical = realpathSync(path);
        } catch {
          throw new Error(`${label} contains a broken symlink: ${path}`);
        }
        if (!isPathWithin(canonical, canonicalRoot)) throw new Error(`${label} contains an external symlink: ${path}`);
      } else if (stat.isDirectory()) {
        pending.push(path);
      } else if (stat.isFile() && stat.nlink !== 1) {
        throw new Error(`${label} contains a hardlinked file: ${path}`);
      }
    }
  }
}

function readExactManifest(root        , expected              ) {
  const manifestPath = join(root, 'package.json');
  assertCanonicalFileWithin(manifestPath, root, `Package manifest for ${expected.name}`, false);
  let manifest                                       ;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))                                         ;
  } catch (error) {
    throw new Error(`Failed to read installed package ${expected.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (manifest.name !== expected.name || manifest.version !== expected.version) {
    throw new Error(`Installed package does not match ${expected.spec}`);
  }
}

export function assertExistingLegionPiPackageLayoutSafe(paths                      ) {
  assertPackageTreeSafe(paths.runtimeDir, 'Legion Pi runtime prefix');
  const runtimeRoot = packageRootPath(paths.runtimeDir, PI_RUNTIME_PACKAGE);
  const piBinary = join(paths.runtimeDir, 'node_modules', '.bin', process.platform === 'win32' ? 'pi.cmd' : 'pi');
  if (lstatIfPresent(piBinary)) assertCanonicalFileWithin(piBinary, runtimeRoot, 'Pi executable', true);
  const packageStore = join(paths.agentDir, 'npm');
  assertPackageTreeSafe(packageStore, 'Legion Pi extension package prefix');
}

export function validateInstalledLegionPiRuntime(config                , paths                      ) {
  const runtimeRoot = packageRootPath(paths.runtimeDir, config.packages.pi.name);
  if (!assertRealDirectoryPath(runtimeRoot, 'Legion Pi runtime package')) {
    throw new Error(`Installed package is missing: ${config.packages.pi.spec}`);
  }
  assertPackageTreeSafe(runtimeRoot, 'Legion Pi runtime package');
  readExactManifest(runtimeRoot, config.packages.pi);
  const runtimeEntrypoint = assertCanonicalFileWithin(join(runtimeRoot, 'dist', 'index.js'), runtimeRoot, 'Pi runtime entrypoint', false);
  const piBinary = assertCanonicalFileWithin(
    join(paths.runtimeDir, 'node_modules', '.bin', process.platform === 'win32' ? 'pi.cmd' : 'pi'),
    runtimeRoot,
    'Pi executable',
    true,
  );
  return { runtimeRoot: realpathSync(runtimeRoot), runtimeEntrypoint, piBinary };
}

export function validateInstalledLegionPiExtension(extension              , paths                      ) {
  const root = packageRootPath(join(paths.agentDir, 'npm'), extension.name);
  if (!assertRealDirectoryPath(root, `Legion Pi extension ${extension.name}`)) {
    throw new Error(`Installed package is missing: ${extension.spec}`);
  }
  assertPackageTreeSafe(root, `Legion Pi extension ${extension.name}`);
  readExactManifest(root, extension);
  const relativeEntrypoint = PI_EXTENSION_ENTRYPOINTS[extension.name                                         ];
  if (!relativeEntrypoint) throw new Error(`No reviewed extension entrypoint for ${extension.name}`);
  const entrypoint = assertCanonicalFileWithin(join(root, relativeEntrypoint), root, `Extension entrypoint for ${extension.name}`, false);
  return { root: realpathSync(root), entrypoint };
}

export function validateInstalledLegionPiPackages(config                , paths                      ) {
  assertExistingLegionPiPackageLayoutSafe(paths);
  const runtime = validateInstalledLegionPiRuntime(config, paths);
  const packageStore = join(paths.agentDir, 'npm');
  if (!assertRealDirectoryPath(packageStore, 'Legion Pi extension package store')) {
    throw new Error(`Legion Pi package store is missing: ${packageStore}`);
  }
  const extensionRoots = new Map                ();
  const extensionEntrypoints = new Map                ();
  for (const extension of config.packages.extensions) {
    const validated = validateInstalledLegionPiExtension(extension, paths);
    extensionRoots.set(extension.name, validated.root);
    extensionEntrypoints.set(extension.name, validated.entrypoint);
  }
  return { ...runtime, packageStore, extensionRoots, extensionEntrypoints };
}

function rejectUnknownFields(value                         , allowed             , label        ) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new Error(`${label} contains unsupported fields: ${unknown.join(', ')}`);
  }
}

export function parseExactPackageSpec(value         , label        )               {
  if (typeof value !== 'string' || !value.trim() || value.startsWith('npm:')) {
    throw new Error(`${label} must be an exact npm package spec without the npm: prefix`);
  }

  const spec = value.trim();
  const separator = spec.lastIndexOf('@');
  if (separator <= 0 || separator === spec.length - 1) {
    throw new Error(`${label} must include an exact version`);
  }

  const name = spec.slice(0, separator);
  const version = spec.slice(separator + 1);
  if (!PACKAGE_NAME.test(name) || !EXACT_VERSION.test(version)) {
    throw new Error(`${label} must use package@x.y.z syntax`);
  }
  return { name, version, spec: `${name}@${version}` };
}

function parseReviewedAt(value         )         {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('reviewedAt must use YYYY-MM-DD');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error('reviewedAt must be a valid calendar date');
  }
  return value;
}

export function validateLegionPiConfig(value         )                 {
  if (!isRecord(value)) {
    throw new Error('Legion Pi config must be a JSON object');
  }
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2) {
    throw new Error('schemaVersion must be 1 or 2');
  }
  const schemaVersion = value.schemaVersion;
  rejectUnknownFields(value, schemaVersion === 1 ? TOP_LEVEL_FIELDS_V1 : TOP_LEVEL_FIELDS_V2, 'Legion Pi config');
  if (!isRecord(value.packages)) {
    throw new Error('packages must be a JSON object');
  }
  rejectUnknownFields(value.packages, PACKAGE_FIELDS, 'packages');

  const pi = parseExactPackageSpec(value.packages.pi, 'packages.pi');
  if (pi.name !== PI_RUNTIME_PACKAGE) {
    throw new Error(`packages.pi must pin ${PI_RUNTIME_PACKAGE}`);
  }
  if (!Array.isArray(value.packages.extensions)) {
    throw new Error('packages.extensions must be an array');
  }
  const byName = new Map(value.packages.extensions.map((item, index) => {
    const parsed = parseExactPackageSpec(item, `packages.extensions[${index}]`);
    return [parsed.name, parsed]         ;
  }));
  if (value.packages.extensions.length !== PI_EXTENSION_PACKAGES.length
    || byName.size !== PI_EXTENSION_PACKAGES.length
    || PI_EXTENSION_PACKAGES.some((name) => !byName.has(name))) {
    throw new Error(`packages.extensions must pin exactly: ${PI_EXTENSION_PACKAGES.join(', ')}`);
  }

  if (!Array.isArray(value.skills) || value.skills.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error('skills must be an array of non-empty paths');
  }
  const skills = value.skills.map((item) => (item          ).trim());
  if (new Set(skills).size !== skills.length) {
    throw new Error('skills must not contain duplicate paths');
  }

  let models                          ;
  if (schemaVersion === 2) {
    if (!isRecord(value.models)) {
      throw new Error('models must be a JSON object for schemaVersion 2');
    }
    rejectUnknownFields(value.models, MODEL_FIELDS, 'models');
    if (value.models.defaultProvider !== LEGION_PI_MODEL_POLICY.defaultProvider) {
      throw new Error(`models.defaultProvider must be ${LEGION_PI_MODEL_POLICY.defaultProvider}`);
    }
    if (value.models.defaultModel !== LEGION_PI_MODEL_POLICY.defaultModel) {
      throw new Error(`models.defaultModel must be ${LEGION_PI_MODEL_POLICY.defaultModel}`);
    }
    if (!Array.isArray(value.models.enabledModels)
      || value.models.enabledModels.length !== LEGION_PI_MODEL_POLICY.enabledModels.length
      || value.models.enabledModels.some((item, index) => item !== LEGION_PI_MODEL_POLICY.enabledModels[index])) {
      throw new Error(`models.enabledModels must exactly match: ${LEGION_PI_MODEL_POLICY.enabledModels.join(', ')}`);
    }
    models = {
      defaultProvider: LEGION_PI_MODEL_POLICY.defaultProvider,
      defaultModel: LEGION_PI_MODEL_POLICY.defaultModel,
      enabledModels: [...LEGION_PI_MODEL_POLICY.enabledModels],
    };
  }

  return {
    schemaVersion,
    reviewedAt: parseReviewedAt(value.reviewedAt),
    packages: {
      pi,
      extensions: PI_EXTENSION_PACKAGES.map((name) => byName.get(name) ),
    },
    skills,
    ...(models ? { models } : {}),
  };
}

export function loadLegionPiConfig(path        )                 {
  let parsed         ;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf-8'))           ;
  } catch (error) {
    throw new Error(`Failed to read Legion Pi config at ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return validateLegionPiConfig(parsed);
}

export function renderActiveConfig(config                ) {
  return {
    schemaVersion: config.schemaVersion,
    reviewedAt: config.reviewedAt,
    packages: {
      pi: config.packages.pi.spec,
      extensions: config.packages.extensions.map((item) => item.spec),
    },
    skills: [...config.skills],
    ...(config.models ? {
      models: {
        defaultProvider: config.models.defaultProvider,
        defaultModel: config.models.defaultModel,
        enabledModels: [...config.models.enabledModels],
      },
    } : {}),
  };
}

export function renderPiSettings(config                ) {
  return {
    packages: config.packages.extensions.map((item) => `npm:${item.spec}`),
    ...(config.skills.length > 0 ? { skills: [...config.skills] } : {}),
    ...(config.models ? {
      defaultProvider: config.models.defaultProvider,
      defaultModel: config.models.defaultModel,
      enabledModels: [...config.models.enabledModels],
    } : {}),
  };
}

export function renderRestrictedSubagentConfig() {
  return {
    asyncByDefault: false,
    maxSubagentDepth: 1,
    maxSubagentSpawnsPerSession: 4,
    maxSubagentSpawnsPerRun: 2,
    maxActiveAsyncRunsPerSession: 1,
    scheduledRuns: { enabled: false },
    missions: { enabled: false, globalIndex: false },
    authorityPolicy: {
      discardWorktree: 'confirm',
      destructiveCleanup: 'confirm',
      spawnBudgetGrant: 'confirm',
      scheduleCreate: 'forbid',
    },
  };
}

export function resolveLegionPiProfilePaths(profileDir        )                       {
  const root = resolve(profileDir);
  const stateDir = join(root, '.legionmind');
  return {
    profileDir: root,
    runtimeDir: join(root, 'runtime'),
    agentDir: join(root, 'agent'),
    sessionDir: join(root, 'sessions'),
    stateDir,
    generatedDir: join(stateDir, 'generated'),
    npmCacheDir: join(stateDir, 'npm-cache'),
    managedFilePath: join(stateDir, 'managed-files.v1.json'),
    backupIndexPath: join(stateDir, 'backup-index.v1.json'),
    installStatePath: join(stateDir, 'install-state.v1.json'),
    activeConfigPath: join(stateDir, 'active-config.v1.json'),
    settingsPath: join(root, 'agent', 'settings.json'),
    subagentConfigPath: join(root, 'agent', 'extensions', 'subagent', 'config.json'),
  };
}

export function defaultLegionPiProfileDir() {
  return join(homedir(), '.legion-pi');
}

export function jsonFingerprint(value         )         {
  return `${JSON.stringify(value, null, 2)}\n`;
}
