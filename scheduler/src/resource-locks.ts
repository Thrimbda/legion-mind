export type ResourceLockKind = 'repo' | 'area' | 'mutex';

export interface ParsedResourceLockKey {
  kind: ResourceLockKind;
  name: string;
  key: string;
}

export interface DescribedResourceLockKey extends ParsedResourceLockKey {
  repoKey?: string;
  areaName?: string;
}

export interface HeldResourceLock {
  lockKey: string;
  runId: string;
}

export interface ResourceLockConflict {
  lockKey: string;
  runId: string;
  requestedLockKey: string;
}

export interface IssueResourceLockInput {
  repoKey: string;
  labels?: string[];
  resourceHints?: string[];
  allowRepoParallel?: boolean;
}

const LOCK_PATTERN = /^(repo|area|mutex):([a-z0-9][a-z0-9._/-]{0,127})$/;

export function normalizeResourceLockName(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (!normalized || !/^[a-z0-9][a-z0-9._/-]{0,127}$/.test(normalized)) {
    throw new Error(`Invalid resource lock name: ${name}`);
  }
  return normalized;
}

export function parseResourceLockKey(value: string): ParsedResourceLockKey {
  const normalized = value.trim().toLowerCase();
  const match = LOCK_PATTERN.exec(normalized);
  if (!match) {
    throw new Error(`Invalid resource lock key: ${value}`);
  }
  const kind = match[1] as ResourceLockKind;
  const name = normalizeResourceLockName(match[2]);
  return { kind, name, key: `${kind}:${name}` };
}

export function isResourceLockKey(value: string): boolean {
  try {
    parseResourceLockKey(value);
    return true;
  } catch {
    return false;
  }
}

export function scopedAreaLockKey(repoKey: string, areaName: string): string {
  const repo = normalizeResourceLockName(repoKey);
  const area = normalizeResourceLockName(areaName);
  return `area:${repo}/${area}`;
}

export function describeResourceLockKey(value: string): DescribedResourceLockKey {
  const parsed = parseResourceLockKey(value);
  if (parsed.kind !== 'area') {
    return parsed;
  }
  const slashIndex = parsed.name.indexOf('/');
  if (slashIndex <= 0 || slashIndex === parsed.name.length - 1) {
    return { ...parsed, areaName: parsed.name };
  }
  return {
    ...parsed,
    repoKey: parsed.name.slice(0, slashIndex),
    areaName: parsed.name.slice(slashIndex + 1),
  };
}

export function resourceLocksConflict(leftValue: string, rightValue: string): boolean {
  const left = describeResourceLockKey(leftValue);
  const right = describeResourceLockKey(rightValue);
  if (left.key === right.key) {
    return true;
  }
  if (left.kind === 'mutex' || right.kind === 'mutex') {
    return left.kind === 'mutex' && right.kind === 'mutex' && left.name === right.name;
  }
  if (left.kind === 'repo' && right.kind === 'repo') {
    return left.name === right.name;
  }
  if (left.kind === 'repo' && right.kind === 'area') {
    return right.repoKey === left.name;
  }
  if (left.kind === 'area' && right.kind === 'repo') {
    return left.repoKey === right.name;
  }
  if (left.kind === 'area' && right.kind === 'area') {
    if (left.repoKey || right.repoKey) {
      return Boolean(left.repoKey && right.repoKey && left.repoKey === right.repoKey && left.areaName === right.areaName);
    }
    return left.areaName === right.areaName;
  }
  return false;
}

export function findResourceLockConflicts(requestedLockKeys: string[], heldLocks: HeldResourceLock[]): ResourceLockConflict[] {
  const conflicts: ResourceLockConflict[] = [];
  for (const requested of uniqueSortedLockKeys(requestedLockKeys)) {
    for (const held of heldLocks) {
      if (resourceLocksConflict(requested, held.lockKey)) {
        conflicts.push({ requestedLockKey: requested, lockKey: held.lockKey, runId: held.runId });
      }
    }
  }
  return conflicts.sort((left, right) => left.requestedLockKey.localeCompare(right.requestedLockKey) || left.lockKey.localeCompare(right.lockKey) || left.runId.localeCompare(right.runId));
}

export function uniqueSortedLockKeys(values: string[]): string[] {
  return [...new Set(values.map((value) => parseResourceLockKey(value).key))].sort();
}

export function resourceLockKeysForIssue(input: IssueResourceLockInput): string[] {
  const repoKey = normalizeResourceLockName(input.repoKey);
  const explicitHints = [
    ...(input.labels ?? []).map((value) => ({ value: value.trim(), source: 'label' as const })),
    ...(input.resourceHints ?? []).map((value) => ({ value: value.trim(), source: 'hint' as const })),
  ].filter((entry) => /^(repo|area|mutex):/i.test(entry.value));
  const lockKeys: string[] = [];

  for (const hint of explicitHints) {
    const parsed = parseResourceLockKey(hint.value);
    if (parsed.kind === 'area') {
      lockKeys.push(scopedAreaLockKey(repoKey, parsed.name));
    } else if (parsed.kind === 'repo') {
      if (!input.allowRepoParallel || hint.source === 'hint') {
        lockKeys.push(parsed.key);
      }
    } else {
      lockKeys.push(parsed.key);
    }
  }

  if (!input.allowRepoParallel) {
    lockKeys.push(`repo:${repoKey}`);
  }

  return uniqueSortedLockKeys(lockKeys);
}
