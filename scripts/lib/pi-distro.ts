import { lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, parse, resolve, sep } from 'node:path';

export const PI_RUNTIME_PACKAGE = '@earendil-works/pi-coding-agent';
export const PI_EXTENSION_PACKAGES = ['pi-subagents', 'pi-mcp-adapter', 'pi-lens'] as const;
export const PI_CORE_TOOLS = ['read', 'bash', 'edit', 'write'] as const;
export const PI_EXTENSION_TOOL_SENTINELS: Record<(typeof PI_EXTENSION_PACKAGES)[number], readonly string[]> = {
  'pi-subagents': ['subagent', 'subagent_wait'],
  'pi-mcp-adapter': ['mcpScript', 'mcp'],
  'pi-lens': ['lens_diagnostics'],
};
export const PI_EXTENSION_ENTRYPOINTS: Record<(typeof PI_EXTENSION_PACKAGES)[number], string> = {
  'pi-subagents': 'index.ts',
  'pi-mcp-adapter': 'index.ts',
  'pi-lens': 'dist/index.js',
};

export interface ExactPackage {
  name: string;
  version: string;
  spec: string;
}

export interface LegionPiConfig {
  schemaVersion: 1;
  reviewedAt: string;
  packages: {
    pi: ExactPackage;
    extensions: ExactPackage[];
  };
  skills: string[];
}

export interface LegionPiProfilePaths {
  profileDir: string;
  runtimeDir: string;
  agentDir: string;
  sessionDir: string;
  stateDir: string;
  generatedDir: string;
  npmCacheDir: string;
  managedFilePath: string;
  backupIndexPath: string;
  installStatePath: string;
  activeConfigPath: string;
  settingsPath: string;
  subagentConfigPath: string;
}

const TOP_LEVEL_FIELDS = new Set(['schemaVersion', 'reviewedAt', 'packages', 'skills']);
const PACKAGE_FIELDS = new Set(['pi', 'extensions']);
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function lstatIfPresent(path: string): ReturnType<typeof lstatSync> | null {
  try {
    return lstatSync(path);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null;
    throw error;
  }
}

export function assertRealDirectoryPath(path: string, label = 'Legion Pi owned path'): boolean {
  const absolute = resolve(path);
  const stat = lstatIfPresent(absolute);
  if (!stat) return false;
  if (stat.isSymbolicLink() || !stat.isDirectory() || realpathSync(absolute) !== absolute) {
    throw new Error(`${label} must be a real directory without symlink traversal: ${absolute}`);
  }
  return true;
}

export function assertSafeLegionPiProfileRoot(profileDir: string, projectRoot: string, create: boolean) {
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

export function credentialFreeEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const isolated: NodeJS.ProcessEnv = {};
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

export function isPathWithin(path: string, root: string) {
  return path === root || path.startsWith(`${root}${sep}`);
}

export function packageRootPath(base: string, name: string) {
  return join(base, 'node_modules', ...name.split('/'));
}

export function assertCanonicalFileWithin(path: string, root: string, label: string, allowFinalSymlink: boolean) {
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

function assertPackageTreeSafe(root: string, label: string) {
  if (!assertRealDirectoryPath(root, label)) return;
  const canonicalRoot = realpathSync(root);
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop()!;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      const stat = lstatSync(path);
      if (stat.isSymbolicLink()) {
        let canonical: string;
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

function readExactManifest(root: string, expected: ExactPackage) {
  const manifestPath = join(root, 'package.json');
  assertCanonicalFileWithin(manifestPath, root, `Package manifest for ${expected.name}`, false);
  let manifest: { name?: unknown; version?: unknown };
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as { name?: unknown; version?: unknown };
  } catch (error) {
    throw new Error(`Failed to read installed package ${expected.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (manifest.name !== expected.name || manifest.version !== expected.version) {
    throw new Error(`Installed package does not match ${expected.spec}`);
  }
}

export function assertExistingLegionPiPackageLayoutSafe(paths: LegionPiProfilePaths) {
  assertPackageTreeSafe(paths.runtimeDir, 'Legion Pi runtime prefix');
  const runtimeRoot = packageRootPath(paths.runtimeDir, PI_RUNTIME_PACKAGE);
  const piBinary = join(paths.runtimeDir, 'node_modules', '.bin', process.platform === 'win32' ? 'pi.cmd' : 'pi');
  if (lstatIfPresent(piBinary)) assertCanonicalFileWithin(piBinary, runtimeRoot, 'Pi executable', true);
  const packageStore = join(paths.agentDir, 'npm');
  assertPackageTreeSafe(packageStore, 'Legion Pi extension package prefix');
}

export function validateInstalledLegionPiRuntime(config: LegionPiConfig, paths: LegionPiProfilePaths) {
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

export function validateInstalledLegionPiExtension(extension: ExactPackage, paths: LegionPiProfilePaths) {
  const root = packageRootPath(join(paths.agentDir, 'npm'), extension.name);
  if (!assertRealDirectoryPath(root, `Legion Pi extension ${extension.name}`)) {
    throw new Error(`Installed package is missing: ${extension.spec}`);
  }
  assertPackageTreeSafe(root, `Legion Pi extension ${extension.name}`);
  readExactManifest(root, extension);
  const relativeEntrypoint = PI_EXTENSION_ENTRYPOINTS[extension.name as keyof typeof PI_EXTENSION_ENTRYPOINTS];
  if (!relativeEntrypoint) throw new Error(`No reviewed extension entrypoint for ${extension.name}`);
  const entrypoint = assertCanonicalFileWithin(join(root, relativeEntrypoint), root, `Extension entrypoint for ${extension.name}`, false);
  return { root: realpathSync(root), entrypoint };
}

export function validateInstalledLegionPiPackages(config: LegionPiConfig, paths: LegionPiProfilePaths) {
  assertExistingLegionPiPackageLayoutSafe(paths);
  const runtime = validateInstalledLegionPiRuntime(config, paths);
  const packageStore = join(paths.agentDir, 'npm');
  if (!assertRealDirectoryPath(packageStore, 'Legion Pi extension package store')) {
    throw new Error(`Legion Pi package store is missing: ${packageStore}`);
  }
  const extensionRoots = new Map<string, string>();
  const extensionEntrypoints = new Map<string, string>();
  for (const extension of config.packages.extensions) {
    const validated = validateInstalledLegionPiExtension(extension, paths);
    extensionRoots.set(extension.name, validated.root);
    extensionEntrypoints.set(extension.name, validated.entrypoint);
  }
  return { ...runtime, packageStore, extensionRoots, extensionEntrypoints };
}

function rejectUnknownFields(value: Record<string, unknown>, allowed: Set<string>, label: string) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new Error(`${label} contains unsupported fields: ${unknown.join(', ')}`);
  }
}

export function parseExactPackageSpec(value: unknown, label: string): ExactPackage {
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

function parseReviewedAt(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('reviewedAt must use YYYY-MM-DD');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error('reviewedAt must be a valid calendar date');
  }
  return value;
}

export function validateLegionPiConfig(value: unknown): LegionPiConfig {
  if (!isRecord(value)) {
    throw new Error('Legion Pi config must be a JSON object');
  }
  rejectUnknownFields(value, TOP_LEVEL_FIELDS, 'Legion Pi config');
  if (value.schemaVersion !== 1) {
    throw new Error('schemaVersion must be 1');
  }
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
    return [parsed.name, parsed] as const;
  }));
  if (value.packages.extensions.length !== PI_EXTENSION_PACKAGES.length
    || byName.size !== PI_EXTENSION_PACKAGES.length
    || PI_EXTENSION_PACKAGES.some((name) => !byName.has(name))) {
    throw new Error(`packages.extensions must pin exactly: ${PI_EXTENSION_PACKAGES.join(', ')}`);
  }

  if (!Array.isArray(value.skills) || value.skills.some((item) => typeof item !== 'string' || !item.trim())) {
    throw new Error('skills must be an array of non-empty paths');
  }
  const skills = value.skills.map((item) => (item as string).trim());
  if (new Set(skills).size !== skills.length) {
    throw new Error('skills must not contain duplicate paths');
  }

  return {
    schemaVersion: 1,
    reviewedAt: parseReviewedAt(value.reviewedAt),
    packages: {
      pi,
      extensions: PI_EXTENSION_PACKAGES.map((name) => byName.get(name)!),
    },
    skills,
  };
}

export function loadLegionPiConfig(path: string): LegionPiConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf-8')) as unknown;
  } catch (error) {
    throw new Error(`Failed to read Legion Pi config at ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return validateLegionPiConfig(parsed);
}

export function renderActiveConfig(config: LegionPiConfig) {
  return {
    schemaVersion: config.schemaVersion,
    reviewedAt: config.reviewedAt,
    packages: {
      pi: config.packages.pi.spec,
      extensions: config.packages.extensions.map((item) => item.spec),
    },
    skills: [...config.skills],
  };
}

export function renderPiSettings(config: LegionPiConfig) {
  return {
    packages: config.packages.extensions.map((item) => `npm:${item.spec}`),
    ...(config.skills.length > 0 ? { skills: [...config.skills] } : {}),
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

export function resolveLegionPiProfilePaths(profileDir: string): LegionPiProfilePaths {
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

export function jsonFingerprint(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}
