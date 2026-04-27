import { createHash } from 'crypto';
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, join, resolve, sep } from 'path';

export type Command = 'install' | 'verify' | 'rollback' | 'uninstall';
export type Strategy = 'copy' | 'symlink';
export type ManagedFileAction = 'install' | 'update' | 'rollback' | 'uninstall';

export interface ManagedFile {
  targetPath: string;
  sourcePath: string;
  checksum: string;
  installedAt: string;
  lastAction: ManagedFileAction;
}

export interface ManagedState {
  version: 1;
  updatedAt: string;
  files: Record<string, ManagedFile>;
}

export interface BackupEntry {
  targetPath: string;
  backupPath: string;
  reason: string;
  preManaged: ManagedFile | null;
}

export interface BackupBatch {
  backupId: string;
  createdAt: string;
  entries: BackupEntry[];
}

export interface BackupIndex {
  version: 1;
  updatedAt: string;
  backups: BackupBatch[];
}

export interface InstallStateSummary {
  copied: number;
  linked: number;
  skipped: number;
  warnings: number;
  failures: number;
}

export interface InstallStateBase {
  version: 1;
  timestamp: string;
  runId: string;
  command: Command;
  code: string;
  summary: InstallStateSummary;
}

export interface SyncItem {
  sourcePath: string;
  targetPath: string;
}

export type VerifyManagedState =
  | { kind: 'ok'; path: string; state: ManagedState }
  | { kind: 'missing'; path: string }
  | { kind: 'invalid'; path: string; error: string };

export type VerifyBackupIndex =
  | { kind: 'ok'; path: string; index: BackupIndex }
  | { kind: 'missing'; path: string }
  | { kind: 'invalid'; path: string; error: string };

export interface ManagedRootSet {
  textualRoots: string[];
  canonicalRoots: string[];
}

export interface LifecycleContext {
  projectRoot: string;
  strategy: Strategy;
  dryRun: boolean;
  force: boolean;
  managedRoots: ManagedRootSet;
}

export class Reporter {
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

export function sha256(path: string): string {
  const hash = createHash('sha256');
  hash.update(readFileSync(path));
  return hash.digest('hex');
}

export function resolvedLinkTarget(path: string): string {
  return resolve(dirname(path), readlinkSync(path));
}

export function sourceFingerprint(path: string, strategy: Strategy): string {
  if (strategy === 'symlink') {
    return `symlink:${resolve(path)}`;
  }
  return sha256(path);
}

export function canonicalFilePath(path: string): string {
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

export function canonicalDirectoryPath(path: string): string {
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

export function isWithinRoot(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}${sep}`);
}

export function createManagedRootSet(roots: string[]): ManagedRootSet {
  const textualRoots = [...new Set(roots.map((root) => resolve(root)))];
  const canonicalRoots = [...new Set(textualRoots.map(canonicalDirectoryPath))];
  return { textualRoots, canonicalRoots };
}

export function targetWithinManagedRoots(path: string, roots: ManagedRootSet, options: { allowRoot: boolean; requireCanonicalInside: boolean; rejectSymlinkRoot: boolean }): boolean {
  const resolved = resolve(path);
  const textualHit = roots.textualRoots.some((root) => (options.allowRoot ? isWithinRoot(resolved, root) : resolved !== root && isWithinRoot(resolved, root)));
  if (!textualHit) {
    return false;
  }
  if (options.rejectSymlinkRoot && roots.textualRoots.some((root, index) => existsSync(root) && roots.canonicalRoots[index] !== root)) {
    return false;
  }
  if (!options.requireCanonicalInside) {
    return true;
  }
  const canonical = canonicalFilePath(path);
  return roots.canonicalRoots.some((root) => (options.allowRoot ? isWithinRoot(canonical, root) : canonical !== root && isWithinRoot(canonical, root)));
}

export function writeJsonAtomic(path: string, data: unknown, dryRun: boolean) {
  if (dryRun) {
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
  renameSync(tmp, path);
}

export function loadJsonOrDefault<T>(path: string, fallback: T): T {
  if (!existsSync(path)) {
    return fallback;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return fallback;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateManagedStateFile(path: string, allowedActions: ReadonlySet<string>): VerifyManagedState {
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
      if (typeof managed.lastAction !== 'string' || !allowedActions.has(managed.lastAction)) {
        return { kind: 'invalid', path, error: `invalid managed file record for ${target}: lastAction must be ${[...allowedActions].join(', ')}` };
      }
    }

    return { kind: 'ok', path, state: candidate as ManagedState };
  } catch (error) {
    return { kind: 'invalid', path, error: error instanceof Error ? error.message : 'invalid json' };
  }
}

function validateManagedFileRecord(value: unknown): ManagedFile | null {
  if (!isRecord(value)) return null;
  if (typeof value.targetPath !== 'string') return null;
  if (typeof value.sourcePath !== 'string') return null;
  if (typeof value.checksum !== 'string') return null;
  if (typeof value.installedAt !== 'string') return null;
  if (typeof value.lastAction !== 'string') return null;
  return value as unknown as ManagedFile;
}

export function validateBackupIndexFile(path: string): VerifyBackupIndex {
  if (!existsSync(path)) {
    return { kind: 'missing', path };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as unknown;
    if (!isRecord(parsed) || parsed.version !== 1 || typeof parsed.updatedAt !== 'string' || !Array.isArray(parsed.backups)) {
      return { kind: 'invalid', path, error: 'unexpected backup index shape' };
    }
    for (const [batchIndex, batch] of parsed.backups.entries()) {
      if (!isRecord(batch) || typeof batch.backupId !== 'string' || typeof batch.createdAt !== 'string' || !Array.isArray(batch.entries)) {
        return { kind: 'invalid', path, error: `invalid backup batch at index ${batchIndex}` };
      }
      for (const [entryIndex, entry] of batch.entries.entries()) {
        if (!isRecord(entry) || typeof entry.targetPath !== 'string' || typeof entry.backupPath !== 'string' || typeof entry.reason !== 'string') {
          return { kind: 'invalid', path, error: `invalid backup entry at ${batchIndex}.${entryIndex}` };
        }
        if (entry.preManaged !== null && validateManagedFileRecord(entry.preManaged) === null) {
          return { kind: 'invalid', path, error: `invalid preManaged record at ${batchIndex}.${entryIndex}` };
        }
      }
    }
    return { kind: 'ok', path, index: parsed as BackupIndex };
  } catch (error) {
    return { kind: 'invalid', path, error: error instanceof Error ? error.message : 'invalid json' };
  }
}

export function emptyManagedState(): ManagedState {
  return { version: 1, updatedAt: new Date(0).toISOString(), files: {} };
}

export function emptyBackupIndex(): BackupIndex {
  return { version: 1, updatedAt: new Date(0).toISOString(), backups: [] };
}

export function backupPathFor(targetPath: string, backupId: string): string {
  return `${targetPath}.backup-${backupId}`;
}

export function removeTarget(path: string, dryRun: boolean) {
  if (!existsSync(path) || dryRun) return;
  const stat = lstatSync(path);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    rmSync(path, { recursive: true, force: true });
    return;
  }
  rmSync(path, { force: true });
}

export function ensureParentDir(targetPath: string, dryRun: boolean) {
  if (!dryRun) mkdirSync(dirname(targetPath), { recursive: true });
}

export function safeOverwriteHint(reason: string): string {
  switch (reason) {
    case 'user-modified': return 'managed file was modified locally; rerun with --force to overwrite';
    case 'unmanaged-existing': return 'existing target is not managed by legion-mind; rerun with --force to back up and overwrite';
    case 'non-file-target': return 'existing target is not a regular file; rerun with --force to remove it';
    default: return `skipped to avoid overwriting existing content (${reason})`;
  }
}

export function canOverwrite(targetPath: string, sourceFingerprintValue: string, strategy: Strategy, managedState: ManagedState, force: boolean): { allowed: boolean; reason: string } {
  if (!existsSync(targetPath)) return { allowed: true, reason: 'missing-target' };
  const stat = lstatSync(targetPath);
  if (stat.isDirectory()) return force ? { allowed: true, reason: 'force-overwrite-directory' } : { allowed: false, reason: 'unmanaged-existing' };
  if (stat.isFile() && strategy === 'copy' && sha256(targetPath) === sourceFingerprintValue) return { allowed: false, reason: 'same-content' };
  if (stat.isSymbolicLink() && strategy === 'symlink') {
    const current = `symlink:${resolvedLinkTarget(targetPath)}`;
    if (current === sourceFingerprintValue) return { allowed: false, reason: 'same-content' };
  }
  const managed = managedState.files[targetPath];
  if (stat.isSymbolicLink() && managed) {
    const current = `symlink:${resolvedLinkTarget(targetPath)}`;
    if (current === managed.checksum) return { allowed: true, reason: 'managed-unchanged' };
    return force ? { allowed: true, reason: 'force-overwrite-managed' } : { allowed: false, reason: 'user-modified' };
  }
  if (stat.isSymbolicLink() && !managed) return force ? { allowed: true, reason: 'force-overwrite-unmanaged' } : { allowed: false, reason: 'unmanaged-existing' };
  if (stat.isFile() && strategy === 'copy' && managed && sha256(targetPath) === managed.checksum) return { allowed: true, reason: 'managed-unchanged' };
  if (!managed) return force ? { allowed: true, reason: 'force-overwrite-unmanaged' } : { allowed: false, reason: 'unmanaged-existing' };
  if (!stat.isFile()) return force ? { allowed: true, reason: 'force-overwrite-managed' } : { allowed: false, reason: 'non-file-target' };
  return sha256(targetPath) === managed.checksum || force ? { allowed: true, reason: sha256(targetPath) === managed.checksum ? 'managed-unchanged' : 'force-overwrite-managed' } : { allowed: false, reason: 'user-modified' };
}

export function syncOneFileCore(item: SyncItem, ctx: LifecycleContext, managedState: ManagedState, backupBatch: BackupBatch, reporter: Reporter, counters: { copied: number; linked: number; skipped: number }) {
  if (!targetWithinManagedRoots(item.targetPath, ctx.managedRoots, { allowRoot: false, requireCanonicalInside: false, rejectSymlinkRoot: false })) {
    reporter.emit('E_PRECHECK', 'sync', 'invalid-target', item.targetPath, 'target path is outside managed roots');
    return;
  }
  const existedBefore = existsSync(item.targetPath);
  const previousManaged = managedState.files[item.targetPath] ?? null;
  const sourceChecksum = sourceFingerprint(item.sourcePath, ctx.strategy);
  const decision = canOverwrite(item.targetPath, sourceChecksum, ctx.strategy, managedState, ctx.force);
  if (!decision.allowed) {
    if (decision.reason === 'same-content') {
      managedState.files[item.targetPath] = { targetPath: item.targetPath, sourcePath: item.sourcePath, checksum: sourceChecksum, installedAt: previousManaged?.installedAt ?? new Date().toISOString(), lastAction: previousManaged ? 'update' : 'install' };
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
    if (!targetWithinManagedRoots(backupPath, ctx.managedRoots, { allowRoot: false, requireCanonicalInside: false, rejectSymlinkRoot: false })) {
      reporter.emit('E_PRECHECK', 'sync', 'invalid-backup', backupPath, 'backup path is outside managed roots');
      return;
    }
    if (existsSync(backupPath)) removeTarget(backupPath, ctx.dryRun);
    if (!ctx.dryRun) renameSync(item.targetPath, backupPath);
    backupBatch.entries.push({ targetPath: item.targetPath, backupPath, reason: decision.reason, preManaged: previousManaged ? { ...previousManaged } : null });
    reporter.emit('OK_BACKUP', 'sync', 'backup-created', item.targetPath, backupPath);
  }
  ensureParentDir(item.targetPath, ctx.dryRun);
  if (ctx.strategy === 'copy') {
    if (!ctx.dryRun) copyFileSync(item.sourcePath, item.targetPath);
    counters.copied += 1;
  } else {
    if (!ctx.dryRun) symlinkSync(item.sourcePath, item.targetPath);
    counters.linked += 1;
  }
  managedState.files[item.targetPath] = { targetPath: item.targetPath, sourcePath: item.sourcePath, checksum: sourceChecksum, installedAt: new Date().toISOString(), lastAction: existedBefore ? 'update' : 'install' };
  reporter.emit('OK_SYNC', 'sync', ctx.strategy, item.targetPath, relativeHint(ctx.projectRoot, item.sourcePath));
}

function relativeHint(root: string, path: string): string {
  return path.startsWith(root) ? path.slice(root.length + 1) : path;
}

export function verifyStrictItemCore(item: SyncItem, managedState: ManagedState, reporter: Reporter, projectRoot: string, scriptName: string): number {
  const checkId = `asset.${relativeHint(projectRoot, item.sourcePath)}`;
  if (!existsSync(item.sourcePath)) {
    reporter.emit('E_VERIFY_SOURCE_MISSING', 'verify', checkId, item.sourcePath, 'repository install source is incomplete; reinstall package or run from complete checkout');
    return 1;
  }
  let stat;
  try { stat = lstatSync(item.targetPath); } catch {
    reporter.emit('E_VERIFY_MISSING', 'verify', checkId, item.targetPath, `run ${scriptName} install to restore missing asset`);
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
    reporter.emit('E_VERIFY_CHECKSUM', 'verify', checkId, item.targetPath, 'local drift detected; run install --force to overwrite after reviewing local changes');
    return 1;
  }
  reporter.emit('OK_VERIFY', 'verify', checkId, item.targetPath, 'managed copy matches source');
  return 0;
}

export function rollbackCore(input: { managedState: ManagedState; backupIndex: BackupIndex; backupIndexPath: string; toBackupId: string | null; ctx: LifecycleContext; reporter: Reporter }): { code: string; restored: number; skipped: number; backupIndex: BackupIndex; managedState: ManagedState } {
  const batch = input.toBackupId ? input.backupIndex.backups.find((item) => item.backupId === input.toBackupId) : input.backupIndex.backups[input.backupIndex.backups.length - 1];
  if (!batch) {
    input.reporter.emit('E_PRECHECK', 'rollback', 'backup-id', input.toBackupId ?? '(latest)', 'no backup entries found');
    return { code: 'E_PRECHECK', restored: 0, skipped: 0, backupIndex: input.backupIndex, managedState: input.managedState };
  }
  for (const entry of batch.entries) {
    if (!targetWithinManagedRoots(entry.targetPath, input.ctx.managedRoots, { allowRoot: false, requireCanonicalInside: true, rejectSymlinkRoot: true })) {
      input.reporter.emit('E_PRECHECK', 'rollback', 'invalid-target', entry.targetPath, 'outside managed roots or managed root is symlinked');
      return { code: 'E_PRECHECK', restored: 0, skipped: 0, backupIndex: input.backupIndex, managedState: input.managedState };
    }
    const expectedBackupPath = backupPathFor(entry.targetPath, batch.backupId);
    if (resolve(entry.backupPath) !== resolve(expectedBackupPath) || !targetWithinManagedRoots(entry.backupPath, input.ctx.managedRoots, { allowRoot: false, requireCanonicalInside: true, rejectSymlinkRoot: true })) {
      input.reporter.emit('E_PRECHECK', 'rollback', 'invalid-backup', entry.backupPath, `expected ${expectedBackupPath} under non-symlinked managed roots`);
      return { code: 'E_PRECHECK', restored: 0, skipped: 0, backupIndex: input.backupIndex, managedState: input.managedState };
    }
  }
  let restored = 0;
  let skipped = 0;
  for (const entry of batch.entries) {
    if (!existsSync(entry.backupPath)) {
      skipped += 1;
      input.reporter.emit('W_ROLLBACK_SKIP', 'rollback', 'missing-backup', entry.targetPath, entry.backupPath);
      continue;
    }
    ensureParentDir(entry.targetPath, input.ctx.dryRun);
    removeTarget(entry.targetPath, input.ctx.dryRun);
    if (!input.ctx.dryRun) renameSync(entry.backupPath, entry.targetPath);
    if (entry.preManaged) input.managedState.files[entry.targetPath] = entry.preManaged;
    else delete input.managedState.files[entry.targetPath];
    restored += 1;
    input.reporter.emit('OK_ROLLBACK', 'rollback', 'restored', entry.targetPath, entry.backupPath);
  }
  input.managedState.updatedAt = new Date().toISOString();
  input.backupIndex.backups = input.backupIndex.backups.filter((item) => item.backupId !== batch.backupId);
  input.backupIndex.updatedAt = new Date().toISOString();
  return { code: input.reporter.failures > 0 ? 'E_ROLLBACK_PARTIAL' : 'OK_ROLLBACK', restored, skipped, backupIndex: input.backupIndex, managedState: input.managedState };
}

export function uninstallCore(input: { managedState: ManagedState; ctx: LifecycleContext; reporter: Reporter }): { code: string; removed: number; skipped: number; managedState: ManagedState } {
  let removed = 0;
  let skipped = 0;
  for (const [targetPath, meta] of Object.entries(input.managedState.files)) {
    if (!targetWithinManagedRoots(targetPath, input.ctx.managedRoots, { allowRoot: false, requireCanonicalInside: true, rejectSymlinkRoot: true })) {
      input.reporter.emit('E_PRECHECK', 'uninstall', 'invalid-target', targetPath, 'outside managed roots or managed root is symlinked');
      return { code: 'E_PRECHECK', removed, skipped, managedState: input.managedState };
    }
    if (!existsSync(targetPath)) {
      delete input.managedState.files[targetPath];
      continue;
    }
    const stat = lstatSync(targetPath);
    if (stat.isSymbolicLink()) {
      const current = `symlink:${resolvedLinkTarget(targetPath)}`;
      if (current !== meta.checksum && !input.ctx.force) {
        skipped += 1;
        input.reporter.emit('W_SAFE_SKIP', 'uninstall', 'user-modified', targetPath, 'use --force to remove');
        continue;
      }
    } else if (stat.isFile()) {
      const current = sha256(targetPath);
      if (current !== meta.checksum && !input.ctx.force) {
        skipped += 1;
        input.reporter.emit('W_SAFE_SKIP', 'uninstall', 'user-modified', targetPath, 'use --force to remove');
        continue;
      }
    } else if (!input.ctx.force) {
      skipped += 1;
      input.reporter.emit('W_SAFE_SKIP', 'uninstall', 'non-file-target', targetPath, 'use --force to remove');
      continue;
    }
    removeTarget(targetPath, input.ctx.dryRun);
    delete input.managedState.files[targetPath];
    removed += 1;
    input.reporter.emit('OK_UNINSTALL', 'uninstall', 'removed', targetPath, 'managed file removed');
  }
  input.managedState.updatedAt = new Date().toISOString();
  return { code: input.reporter.failures > 0 ? 'E_SYNC_PARTIAL' : 'OK_UNINSTALL', removed, skipped, managedState: input.managedState };
}
