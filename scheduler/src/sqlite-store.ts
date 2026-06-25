import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { findResourceLockConflicts, resourceLockKeysForIssue, uniqueSortedLockKeys } from './resource-locks.ts';
import {
  ACTIVE_RUN_STATES,
  RUN_STATES,
  assertValidRunTransition,
  isTerminalNonSuccessRunState,
  isTerminalRunState,
} from './state-machine.ts';
import type { RunState } from './state-machine.ts';

export type RunKind = 'implementation' | 'design_only' | 'brainstorm_only';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ContractState = 'stable' | 'needs-review' | 'unknown';
export type DeliveryGateStatus = 'pending' | 'passed' | 'blocked' | 'failed';
export type EvidenceStatus = 'unknown' | 'pending' | 'passed' | 'missing' | 'stale';
export type OutboxKind = 'native_agent' | 'worker_dispatch' | 'scheduler';
export type OutboxState = 'pending' | 'sent' | 'retrying' | 'failed';
export type SchedulerActor = 'scheduler' | 'worker' | 'webhook' | 'admin' | 'test';
export type AttemptResultKind = 'success' | 'blocked' | 'failed' | 'timeout' | 'cancelled';
export type ProjectControlState = 'active' | 'paused' | 'security_blocked';

export interface WorkItemSnapshotInput {
  id?: string;
  linearIssueId: string;
  linearIdentifier: string;
  linearProjectId: string;
  title: string;
  stateName: string;
  stateType: string;
  labels: string[];
  blockers: string[];
  repoKey: string;
  risk: RiskLevel;
  contractState: ContractState;
  resourceHints?: string[];
  relations?: unknown;
  snapshotHash?: string;
  linearUpdatedAt: string;
  observedVersion?: number;
  observedAt?: string;
}

export interface NormalizedSnapshot extends Required<Omit<WorkItemSnapshotInput, 'relations' | 'resourceHints' | 'snapshotHash' | 'observedVersion' | 'observedAt'>> {
  relations: unknown;
  resourceHints: string[];
  snapshotHash: string;
  observedVersion: number;
  observedAt: string;
}

export interface ClaimNativeAgentInput {
  agentSessionId?: string | null;
  delegateAppUserId?: string | null;
  promptContextHash?: string | null;
}

export interface ClaimWorkItemInput {
  readySnapshot: WorkItemSnapshotInput;
  currentSnapshot: WorkItemSnapshotInput;
  taskId: string;
  claimKey?: string;
  runKind?: RunKind;
  priority?: number;
  branch?: string | null;
  worktreePath?: string | null;
  lockKeys?: string[];
  lockTtlMs?: number;
  lockExpiresAt?: string | null;
  nativeAgent?: ClaimNativeAgentInput;
  traceId?: string;
  now?: string;
}

export type ClaimResult =
  | {
      ok: true;
      runId: string;
      attemptId: string;
      outboxIds: string[];
      lockKeys: string[];
      state: 'queued';
    }
  | {
      ok: false;
      reason: 'stale_snapshot';
      changedFields: string[];
    }
  | {
      ok: false;
      reason: 'active_run_exists';
      existingRunId: string;
    }
  | {
      ok: false;
      reason: 'resource_conflict';
      lockConflicts: Array<{ lockKey: string; runId: string }>;
    };

export interface RunRow {
  id: string;
  linear_issue_id: string;
  linear_identifier: string;
  linear_project_id: string;
  task_id: string;
  state: RunState;
  run_kind: RunKind;
  claim_key: string;
  priority: number;
  repo_key: string;
  branch: string | null;
  worktree_path: string | null;
  pr_url: string | null;
  linear_agent_session_id: string | null;
  linear_delegate_app_user_id: string | null;
  linear_prompt_context_hash: string | null;
  last_agent_activity_id: string | null;
  last_agent_activity_at: string | null;
  native_stop_requested_at: string | null;
  native_state_observed: string | null;
  evaluated_snapshot_hash: string;
  evaluated_issue_updated_at: string;
  delivery_gate_status: DeliveryGateStatus;
  evidence_status: EvidenceStatus;
  failure_type: string | null;
  failure_reason: string | null;
  started_at: string | null;
  finished_at: string | null;
  heartbeat_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchedulerEventRow {
  id: string;
  run_id: string | null;
  event_type: string;
  actor: SchedulerActor;
  payload_json: string;
  trace_id: string | null;
  linear_identifier: string | null;
  task_id: string | null;
  created_at: string;
}

export interface WorkItemSnapshotRow {
  id: string;
  linear_issue_id: string;
  linear_identifier: string;
  linear_project_id: string;
  title: string;
  state_name: string;
  state_type: string;
  labels_json: string;
  relations_json: string;
  repo_key: string;
  risk: RiskLevel;
  contract_state: ContractState;
  resource_hints_json: string;
  blockers_hash: string;
  snapshot_hash: string;
  linear_updated_at: string;
  observed_version: number;
  created_at: string;
  observed_at: string;
}

export interface OutboxRow {
  id: string;
  outbox_kind: OutboxKind;
  run_id: string | null;
  attempt_id: string | null;
  idempotency_key: string;
  side_effect: string;
  payload_json: string;
  state: OutboxState;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface RunAttemptRow {
  id: string;
  run_id: string;
  attempt_number: number;
  worker_runtime: 'opencode';
  prompt_hash: string;
  exit_code: number | null;
  result_kind: AttemptResultKind | null;
  log_uri: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface ResourceLockRow {
  id: string;
  lock_key: string;
  run_id: string;
  state: 'held' | 'released' | 'stale';
  expires_at: string | null;
  metadata_json: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectControlRow {
  project_id: string;
  project_key: string | null;
  state: ProjectControlState;
  reason: string;
  actor: SchedulerActor;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface HeldLockSummary {
  lockKey: string;
  runId: string;
  expiresAt: string | null;
}

export interface WebhookEventRecordResult {
  id: string;
  duplicate: boolean;
}

export interface RetryAttemptResult {
  attemptId: string;
  attemptNumber: number;
  outboxId: string;
}

interface InitialOutboxEntry {
  outboxKind: OutboxKind;
  sideEffect: string;
  idempotencyKey: string;
  payload: unknown;
}

const CORE_TABLES = [
  'runs',
  'run_attempts',
  'work_item_snapshots',
  'resource_locks',
  'scheduler_events',
  'webhook_events',
  'native_outbox',
  'project_controls',
] as const;

const ACTIVE_RUN_STATE_SQL = ACTIVE_RUN_STATES.map((state) => `'${state}'`).join(', ');
const RUN_STATE_SQL = RUN_STATES.map((state) => `'${state}'`).join(', ');

function nowIso(): string {
  return new Date().toISOString();
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableJsonValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, stableJsonValue(item)]));
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value));
}

export function stableHash(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

export function normalizeSnapshot(input: WorkItemSnapshotInput, observedAt = nowIso()): NormalizedSnapshot {
  const labels = uniqueSorted(input.labels);
  const blockers = uniqueSorted(input.blockers);
  const resourceHints = uniqueSorted(input.resourceHints ?? []);
  const relations = input.relations ?? { blockers };
  const observedVersion = input.observedVersion ?? 1;
  const base = {
    linearIssueId: input.linearIssueId,
    linearIdentifier: input.linearIdentifier,
    linearProjectId: input.linearProjectId,
    title: input.title,
    stateName: input.stateName,
    stateType: input.stateType,
    labels,
    blockers,
    repoKey: input.repoKey,
    risk: input.risk,
    contractState: input.contractState,
    resourceHints,
    relations,
    linearUpdatedAt: input.linearUpdatedAt,
    observedVersion,
  };
  return {
    id: input.id ?? randomUUID(),
    ...base,
    snapshotHash: input.snapshotHash ?? stableHash(base),
    observedAt: input.observedAt ?? observedAt,
  };
}

function changedSnapshotFields(ready: NormalizedSnapshot, current: NormalizedSnapshot): string[] {
  const changed: string[] = [];
  const checks: Array<[string, unknown, unknown]> = [
    ['snapshot_hash', ready.snapshotHash, current.snapshotHash],
    ['linear_updated_at', ready.linearUpdatedAt, current.linearUpdatedAt],
    ['labels', ready.labels, current.labels],
    ['blockers', ready.blockers, current.blockers],
    ['contract_state', ready.contractState, current.contractState],
    ['repo_key', ready.repoKey, current.repoKey],
    ['resource_hints', ready.resourceHints, current.resourceHints],
  ];

  for (const [field, left, right] of checks) {
    if (stableStringify(left) !== stableStringify(right)) {
      changed.push(field);
    }
  }
  return changed;
}

function sqlitePath(path: string): string {
  return path === ':memory:' ? path : resolve(path);
}

function ensureDatabaseParent(path: string) {
  if (path === ':memory:') {
    return;
  }
  const parent = dirname(path);
  if (!existsSync(parent)) {
    mkdirSync(parent, { recursive: true });
  }
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function placeholders(values: unknown[]): string {
  return values.map(() => '?').join(', ');
}

export class SchedulerStore {
  private readonly db: DatabaseSync;
  private readonly dbPath: string;

  constructor(dbPath = ':memory:', options: { timeoutMs?: number } = {}) {
    this.dbPath = sqlitePath(dbPath);
    ensureDatabaseParent(this.dbPath);
    this.db = new DatabaseSync(this.dbPath, { timeout: options.timeoutMs ?? 5000 });
    this.db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    if (this.dbPath !== ':memory:') {
      this.db.exec('PRAGMA journal_mode = WAL;');
    }
  }

  migrate() {
    this.db.exec(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS work_item_snapshots (
        id TEXT PRIMARY KEY,
        linear_issue_id TEXT NOT NULL,
        linear_identifier TEXT NOT NULL,
        linear_project_id TEXT NOT NULL,
        title TEXT NOT NULL,
        state_name TEXT NOT NULL,
        state_type TEXT NOT NULL,
        labels_json TEXT NOT NULL,
        relations_json TEXT NOT NULL,
        repo_key TEXT NOT NULL,
        risk TEXT NOT NULL CHECK (risk IN ('low', 'medium', 'high')),
        contract_state TEXT NOT NULL CHECK (contract_state IN ('stable', 'needs-review', 'unknown')),
        resource_hints_json TEXT NOT NULL,
        blockers_hash TEXT NOT NULL,
        snapshot_hash TEXT NOT NULL,
        linear_updated_at TEXT NOT NULL,
        observed_version INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        observed_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        linear_issue_id TEXT NOT NULL,
        linear_identifier TEXT NOT NULL,
        linear_project_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN (${RUN_STATE_SQL})),
        run_kind TEXT NOT NULL CHECK (run_kind IN ('implementation', 'design_only', 'brainstorm_only')),
        claim_key TEXT NOT NULL UNIQUE,
        priority INTEGER NOT NULL DEFAULT 0,
        repo_key TEXT NOT NULL,
        branch TEXT,
        worktree_path TEXT,
        pr_url TEXT,
        linear_agent_session_id TEXT,
        linear_delegate_app_user_id TEXT,
        linear_prompt_context_hash TEXT,
        last_agent_activity_id TEXT,
        last_agent_activity_at TEXT,
        native_stop_requested_at TEXT,
        native_state_observed TEXT,
        evaluated_snapshot_hash TEXT NOT NULL,
        evaluated_issue_updated_at TEXT NOT NULL,
        delivery_gate_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_gate_status IN ('pending', 'passed', 'blocked', 'failed')),
        evidence_status TEXT NOT NULL DEFAULT 'unknown' CHECK (evidence_status IN ('unknown', 'pending', 'passed', 'missing', 'stale')),
        failure_type TEXT,
        failure_reason TEXT,
        started_at TEXT,
        finished_at TEXT,
        heartbeat_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS run_attempts (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        attempt_number INTEGER NOT NULL,
        worker_runtime TEXT NOT NULL CHECK (worker_runtime IN ('opencode')),
        prompt_hash TEXT NOT NULL,
        exit_code INTEGER,
        result_kind TEXT CHECK (result_kind IN ('success', 'blocked', 'failed', 'timeout', 'cancelled')),
        log_uri TEXT,
        started_at TEXT,
        ended_at TEXT,
        created_at TEXT NOT NULL,
        UNIQUE (run_id, attempt_number)
      ) STRICT;

      CREATE TABLE IF NOT EXISTS resource_locks (
        id TEXT PRIMARY KEY,
        lock_key TEXT NOT NULL,
        run_id TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        state TEXT NOT NULL CHECK (state IN ('held', 'released', 'stale')),
        expires_at TEXT,
        metadata_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS scheduler_events (
        id TEXT PRIMARY KEY,
        run_id TEXT REFERENCES runs(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL CHECK (actor IN ('scheduler', 'worker', 'webhook', 'admin', 'test')),
        payload_json TEXT NOT NULL,
        trace_id TEXT,
        linear_identifier TEXT,
        task_id TEXT,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS project_controls (
        project_id TEXT PRIMARY KEY,
        project_key TEXT,
        state TEXT NOT NULL CHECK (state IN ('active', 'paused', 'security_blocked')),
        reason TEXT NOT NULL,
        actor TEXT NOT NULL CHECK (actor IN ('scheduler', 'worker', 'webhook', 'admin', 'test')),
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS webhook_events (
        id TEXT PRIMARY KEY,
        linear_webhook_id TEXT,
        delivery_id TEXT,
        signature_hash TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        action TEXT NOT NULL,
        processed_at TEXT,
        raw_payload_uri TEXT,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;

      CREATE TABLE IF NOT EXISTS native_outbox (
        id TEXT PRIMARY KEY,
        outbox_kind TEXT NOT NULL CHECK (outbox_kind IN ('native_agent', 'worker_dispatch', 'scheduler')),
        run_id TEXT REFERENCES runs(id) ON DELETE CASCADE,
        attempt_id TEXT REFERENCES run_attempts(id) ON DELETE CASCADE,
        idempotency_key TEXT NOT NULL UNIQUE,
        side_effect TEXT NOT NULL CHECK (side_effect IN (
          'create_or_find_session',
          'set_delegate',
          'create_activity',
          'update_plan',
          'update_external_urls',
          'create_comment',
          'update_issue_labels',
          'update_issue_state',
          'final_response',
          'dispatch_worker',
          'reconcile_project',
          'permission_change',
          'native_session_event',
          'retry_worker'
        )),
        payload_json TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sent', 'retrying', 'failed')),
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;

      CREATE INDEX IF NOT EXISTS snapshots_issue_observed_idx ON work_item_snapshots(linear_issue_id, observed_version DESC, observed_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS runs_one_active_issue_idx ON runs(linear_issue_id) WHERE state IN (${ACTIVE_RUN_STATE_SQL});
      CREATE UNIQUE INDEX IF NOT EXISTS runs_one_active_task_idx ON runs(task_id) WHERE state IN (${ACTIVE_RUN_STATE_SQL});
      CREATE INDEX IF NOT EXISTS runs_project_state_idx ON runs(linear_project_id, state, updated_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS resource_locks_held_key_idx ON resource_locks(lock_key) WHERE state = 'held';
      CREATE INDEX IF NOT EXISTS scheduler_events_run_timeline_idx ON scheduler_events(run_id, created_at, id);
      CREATE INDEX IF NOT EXISTS project_controls_state_idx ON project_controls(state, updated_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_delivery_idx ON webhook_events(delivery_id) WHERE delivery_id IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_signature_idx ON webhook_events(signature_hash);
      CREATE INDEX IF NOT EXISTS native_outbox_pending_idx ON native_outbox(state, created_at, id);
    `);

    this.ensureNativeOutboxSideEffectCheck();

    this.db.prepare('INSERT OR IGNORE INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)').run(1, 'wi02_sqlite_scheduler_core', nowIso());
    this.db.prepare('INSERT OR IGNORE INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)').run(2, 'wi05_delivery_writeback_side_effects', nowIso());
    this.db.prepare('INSERT OR IGNORE INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)').run(3, 'wi07_webhook_retry_recovery_outbox', nowIso());
    this.db.prepare('INSERT OR IGNORE INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)').run(4, 'wi08_project_controls_admin_observability', nowIso());
  }

  private ensureNativeOutboxSideEffectCheck() {
    const table = this.db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'native_outbox'").get() as { sql: string } | undefined;
    if (!table || (table.sql.includes("'update_issue_state'") && table.sql.includes("'reconcile_project'") && table.sql.includes("'scheduler'"))) {
      return;
    }
    this.db.exec(`
      ALTER TABLE native_outbox RENAME TO native_outbox_old;
      CREATE TABLE native_outbox (
        id TEXT PRIMARY KEY,
        outbox_kind TEXT NOT NULL CHECK (outbox_kind IN ('native_agent', 'worker_dispatch', 'scheduler')),
        run_id TEXT REFERENCES runs(id) ON DELETE CASCADE,
        attempt_id TEXT REFERENCES run_attempts(id) ON DELETE CASCADE,
        idempotency_key TEXT NOT NULL UNIQUE,
        side_effect TEXT NOT NULL CHECK (side_effect IN (
          'create_or_find_session',
          'set_delegate',
          'create_activity',
          'update_plan',
          'update_external_urls',
          'create_comment',
          'update_issue_labels',
          'update_issue_state',
          'final_response',
          'dispatch_worker',
          'reconcile_project',
          'permission_change',
          'native_session_event',
          'retry_worker'
        )),
        payload_json TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sent', 'retrying', 'failed')),
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
      INSERT INTO native_outbox(id, outbox_kind, run_id, attempt_id, idempotency_key, side_effect, payload_json, state, last_error, created_at, updated_at)
      SELECT id, outbox_kind, run_id, attempt_id, idempotency_key, side_effect, payload_json, state, last_error, created_at, updated_at FROM native_outbox_old;
      DROP TABLE native_outbox_old;
      CREATE INDEX IF NOT EXISTS native_outbox_pending_idx ON native_outbox(state, created_at, id);
    `);
  }

  close() {
    const close = (this.db as unknown as { close?: () => void }).close;
    if (typeof close === 'function') {
      close.call(this.db);
      return;
    }
    const dispose = (this.db as unknown as { [Symbol.dispose]?: () => void })[Symbol.dispose];
    if (typeof dispose === 'function') {
      dispose.call(this.db);
    }
  }

  health() {
    const tables = this.db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders([...CORE_TABLES])}) ORDER BY name`).all(...CORE_TABLES) as Array<{ name: string }>;
    const activeRuns = this.db.prepare(`SELECT COUNT(*) AS count FROM runs WHERE state IN (${ACTIVE_RUN_STATE_SQL})`).get() as { count: number };
    const pendingOutbox = this.db.prepare("SELECT COUNT(*) AS count FROM native_outbox WHERE state = 'pending'").get() as { count: number };
    const projectControls = this.db.prepare("SELECT COUNT(*) AS count FROM project_controls WHERE state IN ('paused', 'security_blocked')").get() as { count: number };
    return {
      ok: tables.length === CORE_TABLES.length,
      dbPath: this.dbPath,
      tables: tables.map((row) => row.name),
      activeRuns: activeRuns.count,
      pendingOutbox: pendingOutbox.count,
      projectControls: projectControls.count,
    };
  }

  recordSnapshot(input: WorkItemSnapshotInput): NormalizedSnapshot {
    const snapshot = normalizeSnapshot(input);
    const createdAt = nowIso();
    this.db.prepare(`
      INSERT INTO work_item_snapshots(
        id, linear_issue_id, linear_identifier, linear_project_id, title, state_name, state_type,
        labels_json, relations_json, repo_key, risk, contract_state, resource_hints_json,
        blockers_hash, snapshot_hash, linear_updated_at, observed_version, created_at, observed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        state_name = excluded.state_name,
        state_type = excluded.state_type,
        labels_json = excluded.labels_json,
        relations_json = excluded.relations_json,
        repo_key = excluded.repo_key,
        risk = excluded.risk,
        contract_state = excluded.contract_state,
        resource_hints_json = excluded.resource_hints_json,
        blockers_hash = excluded.blockers_hash,
        snapshot_hash = excluded.snapshot_hash,
        linear_updated_at = excluded.linear_updated_at,
        observed_version = excluded.observed_version,
        observed_at = excluded.observed_at
    `).run(
      snapshot.id,
      snapshot.linearIssueId,
      snapshot.linearIdentifier,
      snapshot.linearProjectId,
      snapshot.title,
      snapshot.stateName,
      snapshot.stateType,
      stableStringify(snapshot.labels),
      stableStringify(snapshot.relations),
      snapshot.repoKey,
      snapshot.risk,
      snapshot.contractState,
      stableStringify(snapshot.resourceHints),
      stableHash(snapshot.blockers),
      snapshot.snapshotHash,
      snapshot.linearUpdatedAt,
      snapshot.observedVersion,
      createdAt,
      snapshot.observedAt,
    );
    return snapshot;
  }

  claimReadyWorkItem(input: ClaimWorkItemInput): ClaimResult {
    const now = input.now ?? nowIso();
    const ready = normalizeSnapshot(input.readySnapshot, now);
    const current = normalizeSnapshot(input.currentSnapshot, now);
    const changedFields = changedSnapshotFields(ready, current);
    const lockKeys = input.lockKeys
      ? uniqueSortedLockKeys(input.lockKeys)
      : resourceLockKeysForIssue({ repoKey: current.repoKey, labels: current.labels, resourceHints: current.resourceHints });
    const traceId = input.traceId ?? randomUUID();
    const lockExpiresAt = input.lockExpiresAt !== undefined
      ? input.lockExpiresAt
      : input.lockTtlMs
        ? new Date(Date.parse(now) + input.lockTtlMs).toISOString()
        : null;

    return this.transaction(() => {
      this.recordSnapshot(current);

      if (changedFields.length > 0) {
        this.insertEvent({
          eventType: 'skipped',
          actor: 'scheduler',
          payload: { reason: 'stale_snapshot', changedFields, readySnapshotHash: ready.snapshotHash, currentSnapshotHash: current.snapshotHash },
          traceId,
          linearIdentifier: current.linearIdentifier,
          taskId: input.taskId,
          createdAt: now,
        });
        return { ok: false, reason: 'stale_snapshot', changedFields };
      }

      const active = this.findActiveRun(current.linearIssueId, input.taskId);
      if (active) {
        this.insertEvent({
          eventType: 'skipped',
          actor: 'scheduler',
          payload: { reason: 'active_run_exists', existingRunId: active.id },
          traceId,
          linearIdentifier: current.linearIdentifier,
          taskId: input.taskId,
          createdAt: now,
        });
        return { ok: false, reason: 'active_run_exists', existingRunId: active.id };
      }

      const lockConflicts = this.findHeldLocks(lockKeys);
      if (lockConflicts.length > 0) {
        this.insertEvent({
          eventType: 'skipped',
          actor: 'scheduler',
          payload: { reason: 'resource_conflict', lockConflicts },
          traceId,
          linearIdentifier: current.linearIdentifier,
          taskId: input.taskId,
          createdAt: now,
        });
        return { ok: false, reason: 'resource_conflict', lockConflicts };
      }

      const runId = randomUUID();
      const attemptId = randomUUID();
      const promptContextHash = input.nativeAgent?.promptContextHash ?? stableHash({ taskId: input.taskId, snapshotHash: current.snapshotHash });
      const claimKey = input.claimKey ?? `linear:${current.linearIssueId}:snapshot:${current.snapshotHash}`;
      this.db.prepare(`
        INSERT INTO runs(
          id, linear_issue_id, linear_identifier, linear_project_id, task_id, state, run_kind,
          claim_key, priority, repo_key, branch, worktree_path, linear_agent_session_id,
          linear_delegate_app_user_id, linear_prompt_context_hash, evaluated_snapshot_hash,
          evaluated_issue_updated_at, delivery_gate_status, evidence_status, heartbeat_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unknown', ?, ?, ?)
      `).run(
        runId,
        current.linearIssueId,
        current.linearIdentifier,
        current.linearProjectId,
        input.taskId,
        input.runKind ?? 'implementation',
        claimKey,
        input.priority ?? 0,
        current.repoKey,
        input.branch ?? null,
        input.worktreePath ?? null,
        input.nativeAgent?.agentSessionId ?? null,
        input.nativeAgent?.delegateAppUserId ?? null,
        promptContextHash,
        current.snapshotHash,
        current.linearUpdatedAt,
        now,
        now,
        now,
      );

      this.db.prepare(`
        INSERT INTO run_attempts(id, run_id, attempt_number, worker_runtime, prompt_hash, created_at)
        VALUES (?, ?, 1, 'opencode', ?, ?)
      `).run(attemptId, runId, promptContextHash, now);

      for (const lockKey of lockKeys) {
        this.db.prepare(`
          INSERT INTO resource_locks(id, lock_key, run_id, state, expires_at, metadata_json, created_at, updated_at)
          VALUES (?, ?, ?, 'held', ?, ?, ?, ?)
        `).run(randomUUID(), lockKey, runId, lockExpiresAt, stableStringify({ source: 'claim', traceId }), now, now);
      }

      this.insertEvent({
        runId,
        eventType: 'claimed',
        actor: 'scheduler',
        payload: { claimKey, lockKeys, snapshotHash: current.snapshotHash, linearUpdatedAt: current.linearUpdatedAt },
        traceId,
        linearIdentifier: current.linearIdentifier,
        taskId: input.taskId,
        createdAt: now,
      });

      const outboxIds = this.enqueueInitialOutbox(runId, attemptId, current, input, promptContextHash, traceId, now);
      return { ok: true, runId, attemptId, outboxIds, lockKeys, state: 'queued' };
    });
  }

  transitionRun(runId: string, nextState: RunState, options: {
    actor?: SchedulerActor;
    traceId?: string;
    deliveryGateStatus?: DeliveryGateStatus;
    evidenceStatus?: EvidenceStatus;
    failureType?: string | null;
    failureReason?: string | null;
    now?: string;
  } = {}) {
    const run = this.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }
    assertValidRunTransition(run.state, nextState);
    const now = options.now ?? nowIso();
    const terminal = nextState === 'done' || isTerminalNonSuccessRunState(nextState);
    const hasFailureType = Object.prototype.hasOwnProperty.call(options, 'failureType');
    const hasFailureReason = Object.prototype.hasOwnProperty.call(options, 'failureReason');
    this.transaction(() => {
      this.db.prepare(`
        UPDATE runs SET
          state = ?,
          delivery_gate_status = COALESCE(?, delivery_gate_status),
          evidence_status = COALESCE(?, evidence_status),
          failure_type = ?,
          failure_reason = ?,
          started_at = CASE WHEN ? = 'running' AND started_at IS NULL THEN ? ELSE started_at END,
          finished_at = CASE WHEN ? = 1 THEN ? ELSE finished_at END,
          heartbeat_at = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        nextState,
        options.deliveryGateStatus ?? null,
        options.evidenceStatus ?? null,
        hasFailureType ? options.failureType ?? null : run.failure_type,
        hasFailureReason ? options.failureReason ?? null : run.failure_reason,
        nextState,
        now,
        terminal ? 1 : 0,
        now,
        now,
        now,
        runId,
      );
      this.insertEvent({
        runId,
        eventType: 'state_transition',
        actor: options.actor ?? 'scheduler',
        payload: { from: run.state, to: nextState, deliveryGateStatus: options.deliveryGateStatus, evidenceStatus: options.evidenceStatus, failureType: options.failureType },
        traceId: options.traceId,
        linearIdentifier: run.linear_identifier,
        taskId: run.task_id,
        createdAt: now,
      });
    });
  }

  releaseLocksForRun(runId: string, options: { actor?: SchedulerActor; reason: string; traceId?: string; now?: string; confirmedDeadWorker?: boolean; adminOverride?: boolean }) {
    const run = this.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }
    const safeRelease = isTerminalRunState(run.state) || options.confirmedDeadWorker === true || options.adminOverride === true || options.actor === 'admin';
    if (!safeRelease) {
      throw new Error(`Unsafe lock release for non-terminal run ${runId}: terminal run, confirmed dead worker, or admin action is required.`);
    }
    const now = options.now ?? nowIso();
    this.transaction(() => {
      const result = this.db.prepare("UPDATE resource_locks SET state = 'released', updated_at = ? WHERE run_id = ? AND state = 'held'").run(now, runId);
      this.insertEvent({
        runId,
        eventType: 'locks_released',
        actor: options.actor ?? 'scheduler',
        payload: { reason: options.reason, releasedCount: result.changes, confirmedDeadWorker: options.confirmedDeadWorker ?? false, adminOverride: options.adminOverride ?? false },
        traceId: options.traceId,
        linearIdentifier: run.linear_identifier,
        taskId: run.task_id,
        createdAt: now,
      });
    });
  }

  releaseLockForRun(runId: string, lockKey: string, options: { actor?: SchedulerActor; reason: string; traceId?: string; now?: string; confirmedDeadWorker?: boolean; adminOverride?: boolean }) {
    const run = this.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }
    const lock = this.db.prepare("SELECT * FROM resource_locks WHERE run_id = ? AND lock_key = ? AND state = 'held'").get(runId, lockKey) as ResourceLockRow | undefined;
    if (!lock) {
      throw new Error(`Held lock not found for run ${runId}: ${lockKey}`);
    }
    const safeRelease = isTerminalRunState(run.state) || options.confirmedDeadWorker === true || options.adminOverride === true || options.actor === 'admin';
    if (!safeRelease) {
      throw new Error(`Unsafe lock release for non-terminal run ${runId}: terminal run, confirmed dead worker, or admin action is required.`);
    }
    const now = options.now ?? nowIso();
    this.transaction(() => {
      const result = this.db.prepare("UPDATE resource_locks SET state = 'released', updated_at = ? WHERE run_id = ? AND lock_key = ? AND state = 'held'").run(now, runId, lockKey);
      this.insertEvent({
        runId,
        eventType: 'locks_released',
        actor: options.actor ?? 'scheduler',
        payload: { reason: options.reason, lockKey, releasedCount: result.changes, confirmedDeadWorker: options.confirmedDeadWorker ?? false, adminOverride: options.adminOverride ?? false },
        traceId: options.traceId,
        linearIdentifier: run.linear_identifier,
        taskId: run.task_id,
        createdAt: now,
      });
    });
  }

  enqueueOutbox(entry: {
    outboxKind: OutboxKind;
    runId?: string | null;
    attemptId?: string | null;
    idempotencyKey: string;
    sideEffect: string;
    payload: unknown;
    now?: string;
  }): string {
    const now = entry.now ?? nowIso();
    const existing = this.db.prepare('SELECT id FROM native_outbox WHERE idempotency_key = ?').get(entry.idempotencyKey) as { id: string } | undefined;
    if (existing) {
      return existing.id;
    }
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO native_outbox(id, outbox_kind, run_id, attempt_id, idempotency_key, side_effect, payload_json, state, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(id, entry.outboxKind, entry.runId ?? null, entry.attemptId ?? null, entry.idempotencyKey, entry.sideEffect, stableStringify(entry.payload), now, now);
    return id;
  }

  enqueueSchedulerOutbox(entry: {
    sideEffect: 'reconcile_project' | 'permission_change' | 'native_session_event' | 'retry_worker';
    idempotencyKey: string;
    payload: unknown;
    runId?: string | null;
    attemptId?: string | null;
    now?: string;
  }): string {
    return this.enqueueOutbox({
      outboxKind: 'scheduler',
      runId: entry.runId ?? null,
      attemptId: entry.attemptId ?? null,
      idempotencyKey: entry.idempotencyKey,
      sideEffect: entry.sideEffect,
      payload: entry.payload,
      now: entry.now,
    });
  }

  markOutboxSent(idempotencyKey: string, options: { now?: string } = {}) {
    const now = options.now ?? nowIso();
    this.db.prepare("UPDATE native_outbox SET state = 'sent', last_error = NULL, updated_at = ? WHERE idempotency_key = ?").run(now, idempotencyKey);
  }

  markOutboxFailed(idempotencyKey: string, error: string, options: { retry?: boolean; now?: string } = {}) {
    const now = options.now ?? nowIso();
    this.db.prepare('UPDATE native_outbox SET state = ?, last_error = ?, updated_at = ? WHERE idempotency_key = ?').run(options.retry ? 'retrying' : 'failed', error, now, idempotencyKey);
  }

  pendingOutbox(): OutboxRow[] {
    return this.db.prepare("SELECT * FROM native_outbox WHERE state IN ('pending', 'retrying') ORDER BY created_at, id").all() as OutboxRow[];
  }

  outboxForRun(runId: string): OutboxRow[] {
    return this.db.prepare('SELECT * FROM native_outbox WHERE run_id = ? ORDER BY created_at, id').all(runId) as OutboxRow[];
  }

  getAttempt(attemptId: string): RunAttemptRow | null {
    return (this.db.prepare('SELECT * FROM run_attempts WHERE id = ?').get(attemptId) as RunAttemptRow | undefined) ?? null;
  }

  listAttemptsForRun(runId: string): RunAttemptRow[] {
    return this.db.prepare('SELECT * FROM run_attempts WHERE run_id = ? ORDER BY attempt_number, created_at, id').all(runId) as RunAttemptRow[];
  }

  latestAttemptForRun(runId: string): RunAttemptRow | null {
    return (this.db.prepare('SELECT * FROM run_attempts WHERE run_id = ? ORDER BY attempt_number DESC, created_at DESC, id DESC LIMIT 1').get(runId) as RunAttemptRow | undefined) ?? null;
  }

  createRetryAttempt(runId: string, options: {
    failureType: string;
    failureReason: string;
    notBefore?: string | null;
    traceId?: string | null;
    now?: string;
  }): RetryAttemptResult {
    const run = this.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }
    if (isTerminalRunState(run.state)) {
      throw new Error(`Cannot create retry attempt for terminal run ${runId}.`);
    }
    const now = options.now ?? nowIso();
    const latest = this.latestAttemptForRun(runId);
    const evaluated = this.evaluatedSnapshotForRun(runId);
    const evaluatedRelations = evaluated ? parseJson<{ blockers?: string[] }>(evaluated.relations_json) : null;
    const evaluatedLinear = evaluated
      ? {
          issueId: run.linear_issue_id,
          identifier: run.linear_identifier,
          projectId: run.linear_project_id,
          title: evaluated.title,
          labels: parseJson<string[]>(evaluated.labels_json),
          blockers: Array.isArray(evaluatedRelations?.blockers) ? evaluatedRelations.blockers : [],
          repoKey: evaluated.repo_key,
          risk: evaluated.risk,
          contractState: evaluated.contract_state,
          linearUpdatedAt: evaluated.linear_updated_at,
        }
      : undefined;
    const attemptNumber = (latest?.attempt_number ?? 0) + 1;
    const attemptId = randomUUID();
    const promptHash = stableHash({ retryOf: runId, attemptNumber, failureType: options.failureType, notBefore: options.notBefore ?? null });
    return this.transaction(() => {
      this.db.prepare(`
        INSERT INTO run_attempts(id, run_id, attempt_number, worker_runtime, prompt_hash, created_at)
        VALUES (?, ?, ?, 'opencode', ?, ?)
      `).run(attemptId, runId, attemptNumber, promptHash, now);
      const outboxId = this.enqueueOutbox({
        outboxKind: 'worker_dispatch',
        runId,
        attemptId,
        idempotencyKey: `run:${runId}:attempt:${attemptId}:dispatch-worker`,
        sideEffect: 'dispatch_worker',
        payload: {
          runId,
          attemptId,
          taskId: run.task_id,
          linearIdentifier: run.linear_identifier,
          traceId: options.traceId ?? null,
          linear: evaluatedLinear,
          retry: {
            attemptNumber,
            failureType: options.failureType,
            failureReason: options.failureReason,
            notBefore: options.notBefore ?? null,
          },
        },
        now,
      });
      this.insertEvent({
        runId,
        eventType: 'retry_attempt_created',
        actor: 'scheduler',
        payload: { attemptId, attemptNumber, failureType: options.failureType, failureReason: options.failureReason, notBefore: options.notBefore ?? null },
        traceId: options.traceId,
        linearIdentifier: run.linear_identifier,
        taskId: run.task_id,
        createdAt: now,
      });
      return { attemptId, attemptNumber, outboxId };
    });
  }

  markAttemptStarted(attemptId: string, options: { promptHash?: string; logUri?: string | null; now?: string } = {}) {
    const attempt = this.getAttempt(attemptId);
    if (!attempt) {
      throw new Error(`Attempt not found: ${attemptId}`);
    }
    const now = options.now ?? nowIso();
    this.transaction(() => {
      this.db.prepare(`
        UPDATE run_attempts SET
          prompt_hash = COALESCE(?, prompt_hash),
          log_uri = COALESCE(?, log_uri),
          started_at = COALESCE(started_at, ?)
        WHERE id = ?
      `).run(options.promptHash ?? null, options.logUri ?? null, now, attemptId);
      this.heartbeatRun(attempt.run_id, { now });
    });
  }

  markAttemptFinished(attemptId: string, options: { exitCode: number | null; resultKind: AttemptResultKind; logUri?: string | null; now?: string }) {
    const attempt = this.getAttempt(attemptId);
    if (!attempt) {
      throw new Error(`Attempt not found: ${attemptId}`);
    }
    const now = options.now ?? nowIso();
    this.transaction(() => {
      this.db.prepare(`
        UPDATE run_attempts SET
          exit_code = ?,
          result_kind = ?,
          log_uri = COALESCE(?, log_uri),
          ended_at = ?,
          started_at = COALESCE(started_at, ?)
        WHERE id = ?
      `).run(options.exitCode, options.resultKind, options.logUri ?? null, now, now, attemptId);
      this.heartbeatRun(attempt.run_id, { now });
    });
  }

  heartbeatRun(runId: string, options: { now?: string } = {}) {
    const now = options.now ?? nowIso();
    this.db.prepare('UPDATE runs SET heartbeat_at = ?, updated_at = ? WHERE id = ?').run(now, now, runId);
  }

  updateRunMetadata(runId: string, input: {
    prUrl?: string | null;
    deliveryGateStatus?: DeliveryGateStatus;
    evidenceStatus?: EvidenceStatus;
    failureType?: string | null;
    failureReason?: string | null;
    nativeStateObserved?: string | null;
    now?: string;
  }) {
    const now = input.now ?? nowIso();
    this.db.prepare(`
      UPDATE runs SET
        pr_url = COALESCE(?, pr_url),
        delivery_gate_status = COALESCE(?, delivery_gate_status),
        evidence_status = COALESCE(?, evidence_status),
        failure_type = COALESCE(?, failure_type),
        failure_reason = COALESCE(?, failure_reason),
        native_state_observed = COALESCE(?, native_state_observed),
        heartbeat_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      input.prUrl ?? null,
      input.deliveryGateStatus ?? null,
      input.evidenceStatus ?? null,
      input.failureType ?? null,
      input.failureReason ?? null,
      input.nativeStateObserved ?? null,
      now,
      now,
      runId,
    );
  }

  updateNativeRunContext(runId: string, input: {
    agentSessionId?: string | null;
    delegateAppUserId?: string | null;
    promptContextHash?: string | null;
    lastAgentActivityId?: string | null;
    lastAgentActivityAt?: string | null;
    nativeStateObserved?: string | null;
    now?: string;
  }) {
    const now = input.now ?? nowIso();
    this.db.prepare(`
      UPDATE runs SET
        linear_agent_session_id = COALESCE(?, linear_agent_session_id),
        linear_delegate_app_user_id = COALESCE(?, linear_delegate_app_user_id),
        linear_prompt_context_hash = COALESCE(?, linear_prompt_context_hash),
        last_agent_activity_id = COALESCE(?, last_agent_activity_id),
        last_agent_activity_at = COALESCE(?, last_agent_activity_at),
        native_state_observed = COALESCE(?, native_state_observed),
        updated_at = ?
      WHERE id = ?
    `).run(
      input.agentSessionId ?? null,
      input.delegateAppUserId ?? null,
      input.promptContextHash ?? null,
      input.lastAgentActivityId ?? null,
      input.lastAgentActivityAt ?? null,
      input.nativeStateObserved ?? null,
      now,
      runId,
    );
  }

  getRun(runId: string): RunRow | null {
    return (this.db.prepare('SELECT * FROM runs WHERE id = ?').get(runId) as RunRow | undefined) ?? null;
  }

  findRunByAgentSessionId(agentSessionId: string): RunRow | null {
    return (this.db.prepare(`
      SELECT * FROM runs
      WHERE linear_agent_session_id = ?
      ORDER BY CASE WHEN state IN (${ACTIVE_RUN_STATE_SQL}) THEN 0 ELSE 1 END, updated_at DESC, created_at DESC
      LIMIT 1
    `).get(agentSessionId) as RunRow | undefined) ?? null;
  }

  listRuns(): RunRow[] {
    return this.db.prepare('SELECT * FROM runs ORDER BY created_at DESC, id DESC').all() as RunRow[];
  }

  listSnapshots(): WorkItemSnapshotRow[] {
    return this.db.prepare('SELECT * FROM work_item_snapshots ORDER BY observed_at DESC, linear_identifier ASC').all() as WorkItemSnapshotRow[];
  }

  latestRunForIssue(linearIssueId: string): RunRow | null {
    return (this.db.prepare('SELECT * FROM runs WHERE linear_issue_id = ? ORDER BY created_at DESC, id DESC LIMIT 1').get(linearIssueId) as RunRow | undefined) ?? null;
  }

  evaluatedSnapshotForRun(runId: string): WorkItemSnapshotRow | null {
    const run = this.getRun(runId);
    if (!run) {
      return null;
    }
    return (this.db.prepare(`
      SELECT * FROM work_item_snapshots
      WHERE linear_issue_id = ? AND snapshot_hash = ?
      ORDER BY observed_at DESC, id DESC
      LIMIT 1
    `).get(run.linear_issue_id, run.evaluated_snapshot_hash) as WorkItemSnapshotRow | undefined) ?? null;
  }

  findActiveRunForIssue(linearIssueId: string, taskId?: string): RunRow | null {
    return this.findActiveRun(linearIssueId, taskId ?? '');
  }

  heldLockConflicts(lockKeys: string[]): Array<{ lockKey: string; runId: string }> {
    return this.findHeldLocks(uniqueSortedLockKeys(lockKeys)).map(({ lockKey, runId }) => ({ lockKey, runId }));
  }

  listHeldLocks(): HeldLockSummary[] {
    return (this.db.prepare("SELECT lock_key AS lockKey, run_id AS runId, expires_at AS expiresAt FROM resource_locks WHERE state = 'held' ORDER BY lock_key, run_id").all() as HeldLockSummary[]);
  }

  listResourceLocks(options: { runId?: string; states?: Array<ResourceLockRow['state']> } = {}): ResourceLockRow[] {
    const clauses: string[] = [];
    const values: unknown[] = [];
    if (options.runId) {
      clauses.push('run_id = ?');
      values.push(options.runId);
    }
    if (options.states?.length) {
      clauses.push(`state IN (${placeholders(options.states)})`);
      values.push(...options.states);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return this.db.prepare(`SELECT * FROM resource_locks ${where} ORDER BY state, lock_key, run_id`).all(...values) as ResourceLockRow[];
  }

  listStaleHeldLocks(options: { now?: string } = {}): HeldLockSummary[] {
    const now = options.now ?? nowIso();
    return this.listHeldLocks().filter((lock) => Boolean(lock.expiresAt) && String(lock.expiresAt) <= now);
  }

  setProjectControl(input: {
    projectId: string;
    projectKey?: string | null;
    state: ProjectControlState;
    reason: string;
    actor: SchedulerActor;
    source: string;
    traceId?: string | null;
    now?: string;
  }): ProjectControlRow {
    const projectId = input.projectId.trim();
    const reason = input.reason.trim();
    if (!projectId) {
      throw new Error('Project control requires projectId.');
    }
    if (!reason) {
      throw new Error('Project control requires reason.');
    }
    const now = input.now ?? nowIso();
    this.transaction(() => {
      this.db.prepare(`
        INSERT INTO project_controls(project_id, project_key, state, reason, actor, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(project_id) DO UPDATE SET
          project_key = excluded.project_key,
          state = excluded.state,
          reason = excluded.reason,
          actor = excluded.actor,
          source = excluded.source,
          updated_at = excluded.updated_at
      `).run(projectId, input.projectKey ?? null, input.state, reason, input.actor, input.source, now, now);
      this.insertEvent({
        runId: null,
        eventType: input.state === 'active' ? 'project_resumed' : input.state === 'paused' ? 'project_paused' : 'project_security_blocked',
        actor: input.actor,
        payload: { projectId, projectKey: input.projectKey ?? null, state: input.state, reason, source: input.source },
        traceId: input.traceId ?? null,
        linearIdentifier: null,
        taskId: null,
        createdAt: now,
      });
    });
    return this.getProjectControl(projectId) as ProjectControlRow;
  }

  getProjectControl(projectId: string): ProjectControlRow | null {
    return (this.db.prepare('SELECT * FROM project_controls WHERE project_id = ?').get(projectId) as ProjectControlRow | undefined) ?? null;
  }

  listProjectControls(states?: ProjectControlState[]): ProjectControlRow[] {
    if (states?.length) {
      return this.db.prepare(`SELECT * FROM project_controls WHERE state IN (${placeholders(states)}) ORDER BY updated_at DESC, project_id`).all(...states) as ProjectControlRow[];
    }
    return this.db.prepare('SELECT * FROM project_controls ORDER BY updated_at DESC, project_id').all() as ProjectControlRow[];
  }

  pausedOrBlockedProjectIds(): string[] {
    return this.listProjectControls(['paused', 'security_blocked']).map((control) => control.project_id);
  }

  listStaleActiveRuns(options: { staleAfterMs: number; now?: string }): RunRow[] {
    const now = options.now ?? nowIso();
    const cutoff = new Date(Date.parse(now) - options.staleAfterMs).toISOString();
    return this.db.prepare(`
      SELECT * FROM runs
      WHERE state IN (${ACTIVE_RUN_STATE_SQL})
        AND heartbeat_at IS NOT NULL
        AND heartbeat_at <= ?
      ORDER BY heartbeat_at ASC, created_at ASC, id ASC
    `).all(cutoff) as RunRow[];
  }

  recordStaleLockDetection(lock: { lockKey: string; runId: string; expiresAt?: string | null }, options: { actor?: SchedulerActor; traceId?: string; now?: string } = {}) {
    const run = this.getRun(lock.runId);
    this.insertEvent({
      runId: lock.runId,
      eventType: 'stale_lock_detected',
      actor: options.actor ?? 'scheduler',
      payload: { lockKey: lock.lockKey, expiresAt: lock.expiresAt ?? null, action: 'inspection_only_no_auto_release' },
      traceId: options.traceId,
      linearIdentifier: run?.linear_identifier ?? null,
      taskId: run?.task_id ?? null,
      createdAt: options.now ?? nowIso(),
    });
  }

  timelineForRun(runId: string): Array<SchedulerEventRow & { payload: unknown }> {
    return (this.db.prepare('SELECT * FROM scheduler_events WHERE run_id = ? ORDER BY created_at, id').all(runId) as SchedulerEventRow[])
      .map((event) => ({ ...event, payload: parseJson(event.payload_json) }));
  }

  listSchedulerEvents(): Array<SchedulerEventRow & { payload: unknown }> {
    return (this.db.prepare('SELECT * FROM scheduler_events ORDER BY created_at, id').all() as SchedulerEventRow[])
      .map((event) => ({ ...event, payload: parseJson(event.payload_json) }));
  }

  recordSchedulerEvent(input: {
    runId?: string | null;
    eventType: string;
    actor: SchedulerActor;
    payload: unknown;
    traceId?: string | null;
    linearIdentifier?: string | null;
    taskId?: string | null;
    createdAt?: string;
  }): string {
    return this.insertEvent(input);
  }

  recordAdminOverride(runId: string, reason: string, options: { actor?: SchedulerActor; traceId?: string; now?: string } = {}) {
    const run = this.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }
    this.insertEvent({
      runId,
      eventType: 'admin_override',
      actor: options.actor ?? 'admin',
      payload: { reason, effect: 'blocker_satisfied_for_dependency_calculation_only' },
      traceId: options.traceId,
      linearIdentifier: run.linear_identifier,
      taskId: run.task_id,
      createdAt: options.now ?? nowIso(),
    });
  }

  requestNativeStop(runId: string, reason: string, options: { actor?: SchedulerActor; traceId?: string; now?: string } = {}) {
    const run = this.getRun(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }
    const now = options.now ?? nowIso();
    this.transaction(() => {
      this.db.prepare(`
        UPDATE runs SET
          native_stop_requested_at = COALESCE(native_stop_requested_at, ?),
          native_state_observed = 'stop_requested',
          updated_at = ?
        WHERE id = ?
      `).run(now, now, runId);

      this.insertEvent({
        runId,
        eventType: 'stop_requested',
        actor: options.actor ?? 'webhook',
        payload: { reason },
        traceId: options.traceId,
        linearIdentifier: run.linear_identifier,
        taskId: run.task_id,
        createdAt: now,
      });

      if (!isTerminalRunState(run.state)) {
        assertValidRunTransition(run.state, 'cancelled');
        this.db.prepare(`
          UPDATE runs SET
            state = 'cancelled',
            failure_type = 'native_stop_requested',
            failure_reason = ?,
            finished_at = ?,
            heartbeat_at = ?,
            updated_at = ?
          WHERE id = ?
        `).run(reason, now, now, now, runId);
        this.insertEvent({
          runId,
          eventType: 'state_transition',
          actor: options.actor ?? 'webhook',
          payload: { from: run.state, to: 'cancelled', failureType: 'native_stop_requested' },
          traceId: options.traceId,
          linearIdentifier: run.linear_identifier,
          taskId: run.task_id,
          createdAt: now,
        });
        const released = this.db.prepare("UPDATE resource_locks SET state = 'released', updated_at = ? WHERE run_id = ? AND state = 'held'").run(now, runId);
        this.insertEvent({
          runId,
          eventType: 'locks_released',
          actor: options.actor ?? 'webhook',
          payload: { reason: 'native_stop_requested', releasedCount: released.changes, terminalKind: 'run_terminal_non_success' },
          traceId: options.traceId,
          linearIdentifier: run.linear_identifier,
          taskId: run.task_id,
          createdAt: now,
        });
      }

      this.enqueueOutbox({
        outboxKind: 'native_agent',
        runId,
        attemptId: null,
        idempotencyKey: `run:${runId}:native-stop:final-response`,
        sideEffect: 'final_response',
        payload: { reason, result: 'run_terminal_non_success', traceId: options.traceId ?? null },
        now,
      });
    });
  }

  isBlockerSatisfiedByRun(runId: string): { satisfied: boolean; reason: string } {
    const run = this.getRun(runId);
    if (!run) {
      return { satisfied: false, reason: 'run_missing' };
    }
    if (run.state === 'done' && run.delivery_gate_status === 'passed' && run.evidence_status === 'passed') {
      return { satisfied: true, reason: 'run_terminal_success' };
    }
    const override = this.db.prepare("SELECT id FROM scheduler_events WHERE run_id = ? AND event_type = 'admin_override' LIMIT 1").get(runId) as { id: string } | undefined;
    if (override) {
      return { satisfied: true, reason: 'admin_override' };
    }
    if (isTerminalNonSuccessRunState(run.state)) {
      return { satisfied: false, reason: 'run_terminal_non_success' };
    }
    if (run.state === 'done') {
      return { satisfied: false, reason: 'inconsistent_terminal_state' };
    }
    return { satisfied: false, reason: 'run_not_terminal' };
  }

  recordWebhookEvent(input: {
    linearWebhookId?: string | null;
    deliveryId?: string | null;
    signatureHash: string;
    resourceType: string;
    action: string;
    rawPayloadUri?: string | null;
    payload: unknown;
    now?: string;
  }): WebhookEventRecordResult {
    const now = input.now ?? nowIso();
    const existing = this.db.prepare('SELECT id FROM webhook_events WHERE signature_hash = ? OR (delivery_id IS NOT NULL AND delivery_id = ?)').get(input.signatureHash, input.deliveryId ?? null) as { id: string } | undefined;
    if (existing) {
      return { id: existing.id, duplicate: true };
    }
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO webhook_events(id, linear_webhook_id, delivery_id, signature_hash, resource_type, action, raw_payload_uri, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.linearWebhookId ?? null, input.deliveryId ?? null, input.signatureHash, input.resourceType, input.action, input.rawPayloadUri ?? null, stableStringify(input.payload), now);
    return { id, duplicate: false };
  }

  private transaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  private findActiveRun(linearIssueId: string, taskId: string): RunRow | null {
    return (this.db.prepare(`
      SELECT * FROM runs
      WHERE state IN (${ACTIVE_RUN_STATE_SQL})
        AND (linear_issue_id = ? OR task_id = ?)
      ORDER BY created_at DESC
      LIMIT 1
    `).get(linearIssueId, taskId) as RunRow | undefined) ?? null;
  }

  private findHeldLocks(lockKeys: string[]): Array<{ lockKey: string; runId: string }> {
    if (lockKeys.length === 0) {
      return [];
    }
    return findResourceLockConflicts(lockKeys, this.listHeldLocks()).map((conflict) => ({
      lockKey: conflict.lockKey,
      runId: conflict.runId,
    }));
  }

  private insertEvent(input: {
    runId?: string | null;
    eventType: string;
    actor: SchedulerActor;
    payload: unknown;
    traceId?: string | null;
    linearIdentifier?: string | null;
    taskId?: string | null;
    createdAt?: string;
  }): string {
    const id = randomUUID();
    this.db.prepare(`
      INSERT INTO scheduler_events(id, run_id, event_type, actor, payload_json, trace_id, linear_identifier, task_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.runId ?? null,
      input.eventType,
      input.actor,
      stableStringify(input.payload),
      input.traceId ?? null,
      input.linearIdentifier ?? null,
      input.taskId ?? null,
      input.createdAt ?? nowIso(),
    );
    return id;
  }

  private enqueueInitialOutbox(runId: string, attemptId: string, snapshot: NormalizedSnapshot, input: ClaimWorkItemInput, promptContextHash: string, traceId: string, now: string): string[] {
    const nativeAgent = input.nativeAgent ?? {};
    const entries: InitialOutboxEntry[] = [
      {
        outboxKind: 'native_agent',
        sideEffect: 'create_or_find_session',
        idempotencyKey: `run:${runId}:agent-session:create-or-find`,
        payload: { linearIssueId: snapshot.linearIssueId, linearIdentifier: snapshot.linearIdentifier, agentSessionId: nativeAgent.agentSessionId ?? null, promptContextHash, traceId },
      },
      {
        outboxKind: 'native_agent',
        sideEffect: 'create_activity',
        idempotencyKey: `run:${runId}:activity:initial-thought`,
        payload: { kind: 'thought', message: 'Scheduler claimed the WI and is preparing worker dispatch.', traceId },
      },
      {
        outboxKind: 'native_agent',
        sideEffect: 'update_plan',
        idempotencyKey: `run:${runId}:agent-plan:update`,
        payload: { steps: ['claim', 'create native session', 'dispatch worker', 'await PR evidence'], traceId },
      },
      {
        outboxKind: 'native_agent',
        sideEffect: 'update_external_urls',
        idempotencyKey: `run:${runId}:external-urls:update`,
        payload: { urls: [{ label: 'Scheduler run', url: `scheduler://runs/${runId}` }], traceId },
      },
      {
        outboxKind: 'worker_dispatch',
        sideEffect: 'dispatch_worker',
        idempotencyKey: `run:${runId}:attempt:${attemptId}:dispatch-worker`,
        payload: {
          runId,
          attemptId,
          taskId: input.taskId,
          linearIdentifier: snapshot.linearIdentifier,
          traceId,
          linear: {
            issueId: snapshot.linearIssueId,
            identifier: snapshot.linearIdentifier,
            projectId: snapshot.linearProjectId,
            title: snapshot.title,
            labels: snapshot.labels,
            blockers: snapshot.blockers,
            repoKey: snapshot.repoKey,
            risk: snapshot.risk,
            contractState: snapshot.contractState,
            linearUpdatedAt: snapshot.linearUpdatedAt,
          },
        },
      },
    ];

    if (nativeAgent.delegateAppUserId) {
      entries.splice(1, 0, {
        outboxKind: 'native_agent',
        sideEffect: 'set_delegate',
        idempotencyKey: `run:${runId}:delegate:set`,
        payload: { linearIssueId: snapshot.linearIssueId, delegateAppUserId: nativeAgent.delegateAppUserId, traceId },
      });
    }

    return entries.map((entry) => this.enqueueOutbox({
      outboxKind: entry.outboxKind,
      runId,
      attemptId: entry.outboxKind === 'worker_dispatch' ? attemptId : null,
      idempotencyKey: entry.idempotencyKey,
      sideEffect: entry.sideEffect,
      payload: entry.payload,
      now,
    }));
  }
}

export function openSchedulerStore(dbPath = ':memory:'): SchedulerStore {
  const store = new SchedulerStore(dbPath);
  store.migrate();
  return store;
}

export function createDebugService(dbPath = ':memory:') {
  const store = openSchedulerStore(dbPath);
  return {
    health: () => store.health(),
    listRuns: () => store.listRuns(),
    timeline: (runId: string) => store.timelineForRun(runId),
    close: () => store.close(),
  };
}
