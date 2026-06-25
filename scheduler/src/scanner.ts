import { normalizeSnapshot, stableHash } from './sqlite-store.ts';
import type { ContractState, NormalizedSnapshot, RiskLevel, RunRow, SchedulerStore, WorkItemSnapshotInput } from './sqlite-store.ts';
import { resourceLockKeysForIssue } from './resource-locks.ts';
import { taskIdFromLinearIdentifier } from './task-id.ts';

export type SkippedReason =
  | 'state_not_candidate'
  | 'agent_ready_missing'
  | 'contract_not_stable'
  | 'contract_conflict'
  | 'human_gate'
  | 'dependency_blocked'
  | 'dependency_cycle'
  | 'repo_mapping_missing'
  | 'repo_mapping_ambiguous'
  | 'repo_paused'
  | 'project_paused'
  | 'active_run_exists'
  | 'already_terminal'
  | 'resource_conflict'
  | 'stale_snapshot'
  | 'risk_missing'
  | 'risk_conflict';

export interface ScannerIssueInput {
  linearIssueId: string;
  identifier: string;
  title: string;
  projectId: string;
  projectName?: string;
  url?: string;
  stateName: string;
  stateType: string;
  labels: string[];
  priority: number;
  assignee?: { id: string; name?: string | null; email?: string | null } | null;
  blockerIdentifiers?: string[];
  createdAt?: string;
  updatedAt: string;
  taskId?: string;
  resourceHints?: string[];
  staleSnapshotChangedFields?: string[];
  commentsSummary?: string | null;
  relations?: unknown;
}

export interface LinearProjectSnapshotInput {
  project: {
    id: string;
    name: string;
    key?: string | null;
    url?: string | null;
  };
  observedAt?: string;
  issues: ScannerIssueInput[];
}

export interface StateMappingConfig {
  candidateTypes: string[];
  candidateNames: string[];
  doneTypes: string[];
  doneNames: string[];
}

export interface ScannerConfig {
  stateMapping?: Partial<StateMappingConfig>;
  knownRepoKeys?: string[];
  defaultRepoKey?: string;
  pausedProjectIds?: string[];
  projectControls?: Record<string, { state: 'paused' | 'security_blocked'; reason?: string | null }>;
  pausedRepoKeys?: string[];
  delegateAppUserId?: string | null;
  schedulerRunUrlBase?: string;
  taskIdPrefix?: string;
  parallelRepoKeys?: string[];
}

export interface NativeActionPreview {
  delegate: string | null;
  agentSession: 'create_or_find';
  agentSessionKey: string;
  initialActivity: {
    kind: 'thought';
    message: string;
  };
  externalUrls: Array<{ label: string; url: string }>;
}

export interface ReadyCandidate {
  linearIssueId: string;
  identifier: string;
  title: string;
  projectId: string;
  stateName: string;
  stateType: string;
  labels: string[];
  priority: number;
  repoKey: string;
  risk: RiskLevel;
  contractState: ContractState;
  taskId: string;
  blockerIdentifiers: string[];
  resourceHints: string[];
  createdAt?: string;
  updatedAt: string;
  downstreamCount: number;
  dependencyDepth: number;
  locks: string[];
  snapshotHash: string;
  linearUpdatedAt: string;
  nativePreview: NativeActionPreview;
}

export interface SkippedItem {
  identifier: string;
  taskId: string;
  title: string;
  reason: SkippedReason;
  details: Record<string, unknown>;
  snapshotHash: string;
  linearUpdatedAt: string;
}

export interface DependencyCycle {
  path: string[];
}

export interface ScannerReport {
  project: {
    id: string;
    name: string;
    key?: string | null;
  };
  observedAt: string;
  ready: ReadyCandidate[];
  skipped: SkippedItem[];
  cycles: DependencyCycle[];
}

export interface DependencyGraph {
  nodes: Map<string, ScannerIssueInput>;
  outgoing: Map<string, string[]>;
  incoming: Map<string, string[]>;
}

export interface BlockerSatisfaction {
  satisfied: boolean;
  reason:
    | 'run_terminal_success'
    | 'admin_override'
    | 'run_terminal_non_success'
    | 'inconsistent_terminal_state'
    | 'run_not_terminal'
    | 'run_missing'
    | 'manual_done'
    | 'manual_done_conflict'
    | 'linear_not_done';
  runId?: string;
}

const DEFAULT_STATE_MAPPING: StateMappingConfig = {
  candidateTypes: ['backlog', 'unstarted'],
  candidateNames: ['Ready', 'Backlog'],
  doneTypes: ['completed'],
  doneNames: ['Done'],
};

const ACTIVE_AGENT_LABELS = ['agent:queued', 'agent:running', 'agent:blocked', 'agent:needs-human'];
const TERMINAL_RUN_STATES = ['done', 'failed', 'cancelled', 'abandoned'];

function nowIso(): string {
  return new Date().toISOString();
}

function uniqueSorted(values: string[] = []): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function normalizeIssue(issue: ScannerIssueInput): ScannerIssueInput {
  return {
    ...issue,
    labels: uniqueSorted(issue.labels),
    blockerIdentifiers: uniqueSorted(issue.blockerIdentifiers ?? []),
    resourceHints: uniqueSorted(issue.resourceHints ?? []),
  };
}

function mapping(config: ScannerConfig = {}): StateMappingConfig {
  return {
    candidateTypes: config.stateMapping?.candidateTypes ?? DEFAULT_STATE_MAPPING.candidateTypes,
    candidateNames: config.stateMapping?.candidateNames ?? DEFAULT_STATE_MAPPING.candidateNames,
    doneTypes: config.stateMapping?.doneTypes ?? DEFAULT_STATE_MAPPING.doneTypes,
    doneNames: config.stateMapping?.doneNames ?? DEFAULT_STATE_MAPPING.doneNames,
  };
}

function labelValues(labels: string[], prefix: string): string[] {
  return labels.filter((label) => label.startsWith(prefix)).map((label) => label.slice(prefix.length)).filter(Boolean).sort();
}

function hasLabel(issue: ScannerIssueInput, label: string): boolean {
  return issue.labels.includes(label);
}

function taskIdForIssue(issue: ScannerIssueInput, config: ScannerConfig): string {
  return issue.taskId ?? taskIdFromLinearIdentifier(issue.identifier, config.taskIdPrefix ?? 'linear');
}

function stateMatches(issue: ScannerIssueInput, types: string[], names: string[]): boolean {
  return types.includes(issue.stateType) || names.includes(issue.stateName);
}

function isCandidateState(issue: ScannerIssueInput, config: ScannerConfig): boolean {
  const state = mapping(config);
  return stateMatches(issue, state.candidateTypes, state.candidateNames);
}

function isDoneState(issue: ScannerIssueInput, config: ScannerConfig): boolean {
  const state = mapping(config);
  return stateMatches(issue, state.doneTypes, state.doneNames);
}

function parseContractState(labels: string[]): { state: ContractState; conflict: boolean } {
  const stable = labels.includes('contract:stable');
  const needsReview = labels.includes('contract:needs-review');
  if (stable && needsReview) {
    return { state: 'needs-review', conflict: true };
  }
  if (stable) {
    return { state: 'stable', conflict: false };
  }
  if (needsReview) {
    return { state: 'needs-review', conflict: false };
  }
  return { state: 'unknown', conflict: false };
}

function parseRisk(labels: string[]): { risk: RiskLevel; reason?: SkippedReason; values: string[] } {
  const values = labelValues(labels, 'risk:');
  if (values.length === 0) {
    return { risk: 'medium', reason: 'risk_missing', values };
  }
  const valid = values.filter((value): value is RiskLevel => value === 'low' || value === 'medium' || value === 'high');
  if (valid.length !== 1 || values.length !== 1) {
    return { risk: 'medium', reason: 'risk_conflict', values };
  }
  return { risk: valid[0], values };
}

function parseRepo(labels: string[], config: ScannerConfig): { repoKey?: string; reason?: SkippedReason; values: string[] } {
  const values = labelValues(labels, 'repo:');
  if (values.length > 1) {
    return { reason: 'repo_mapping_ambiguous', values };
  }
  const repoKey = values[0] ?? config.defaultRepoKey;
  if (!repoKey) {
    return { reason: 'repo_mapping_missing', values };
  }
  if (config.knownRepoKeys && !config.knownRepoKeys.includes(repoKey)) {
    return { reason: 'repo_mapping_missing', values: [repoKey] };
  }
  return { repoKey, values: [repoKey] };
}

export function snapshotInputForIssue(issue: ScannerIssueInput, repoKey: string, risk: RiskLevel, contractState: ContractState): WorkItemSnapshotInput {
  return {
    linearIssueId: issue.linearIssueId,
    linearIdentifier: issue.identifier,
    linearProjectId: issue.projectId,
    title: issue.title,
    stateName: issue.stateName,
    stateType: issue.stateType,
    labels: issue.labels,
    blockers: issue.blockerIdentifiers ?? [],
    repoKey,
    risk,
    contractState,
    resourceHints: issue.resourceHints ?? [],
    relations: issue.relations ?? { blockers: issue.blockerIdentifiers ?? [] },
    linearUpdatedAt: issue.updatedAt,
  };
}

function repoAllowsParallel(repoKey: string, config: ScannerConfig): boolean {
  return (config.parallelRepoKeys ?? []).includes(repoKey);
}

function downstreamReach(graph: DependencyGraph, identifier: string): number {
  const seen = new Set<string>();
  const visit = (current: string) => {
    for (const next of graph.outgoing.get(current) ?? []) {
      if (seen.has(next)) {
        continue;
      }
      seen.add(next);
      visit(next);
    }
  };
  visit(identifier);
  return seen.size;
}

function dependencyDepth(graph: DependencyGraph, identifier: string, visiting = new Set<string>()): number {
  if (visiting.has(identifier)) {
    return 0;
  }
  visiting.add(identifier);
  const blockers = graph.incoming.get(identifier) ?? [];
  if (blockers.length === 0) {
    visiting.delete(identifier);
    return 0;
  }
  const depth = 1 + Math.max(...blockers.map((blocker) => dependencyDepth(graph, blocker, visiting)));
  visiting.delete(identifier);
  return depth;
}

function isTerminalRun(run: RunRow): boolean {
  return TERMINAL_RUN_STATES.includes(run.state);
}

export function buildDependencyGraph(issues: ScannerIssueInput[]): DependencyGraph {
  const normalized = issues.map(normalizeIssue);
  const nodes = new Map(normalized.map((issue) => [issue.identifier, issue]));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const issue of normalized) {
    outgoing.set(issue.identifier, outgoing.get(issue.identifier) ?? []);
    incoming.set(issue.identifier, uniqueSorted(issue.blockerIdentifiers ?? []));
    for (const blocker of issue.blockerIdentifiers ?? []) {
      if (!nodes.has(blocker)) {
        continue;
      }
      outgoing.set(blocker, uniqueSorted([...(outgoing.get(blocker) ?? []), issue.identifier]));
    }
  }

  return { nodes, outgoing, incoming };
}

export function detectCycles(graph: DependencyGraph): DependencyCycle[] {
  const visited = new Set<string>();
  const onPath = new Set<string>();
  const stack: string[] = [];
  const cycles: DependencyCycle[] = [];
  const seen = new Set<string>();

  const visit = (identifier: string) => {
    if (onPath.has(identifier)) {
      const start = stack.indexOf(identifier);
      const path = [...stack.slice(start), identifier];
      const key = uniqueSorted([...new Set(path)]).join('>');
      if (!seen.has(key)) {
        seen.add(key);
        cycles.push({ path });
      }
      return;
    }
    if (visited.has(identifier)) {
      return;
    }
    visited.add(identifier);
    onPath.add(identifier);
    stack.push(identifier);
    for (const next of graph.outgoing.get(identifier) ?? []) {
      visit(next);
    }
    stack.pop();
    onPath.delete(identifier);
  };

  for (const identifier of [...graph.nodes.keys()].sort()) {
    visit(identifier);
  }

  return cycles;
}

export function isBlockerSatisfied(blocker: ScannerIssueInput, options: { store?: SchedulerStore; config?: ScannerConfig } = {}): BlockerSatisfaction {
  const issue = normalizeIssue(blocker);
  const run = options.store?.latestRunForIssue(issue.linearIssueId);
  if (run) {
    const result = options.store?.isBlockerSatisfiedByRun(run.id) ?? { satisfied: false, reason: 'run_missing' };
    return { ...result, runId: run.id } as BlockerSatisfaction;
  }

  if (isDoneState(issue, options.config ?? {})) {
    const activeAgentLabels = ACTIVE_AGENT_LABELS.filter((label) => issue.labels.includes(label));
    if (activeAgentLabels.length > 0) {
      return { satisfied: false, reason: 'manual_done_conflict' };
    }
    return { satisfied: true, reason: 'manual_done' };
  }

  return { satisfied: false, reason: 'linear_not_done' };
}

function nativePreview(issue: ScannerIssueInput, config: ScannerConfig): NativeActionPreview {
  const runUrlBase = config.schedulerRunUrlBase ?? 'scheduler://runs';
  return {
    delegate: config.delegateAppUserId ?? null,
    agentSession: 'create_or_find',
    agentSessionKey: `linear-issue:${issue.linearIssueId}:agent-session`,
    initialActivity: {
      kind: 'thought',
      message: `Scheduler would claim ${issue.identifier} after ready graph checks pass.`,
    },
    externalUrls: [
      { label: 'Scheduler run', url: `${runUrlBase}/pending/${issue.identifier}` },
      ...(issue.url ? [{ label: 'Linear issue', url: issue.url }] : []),
    ],
  };
}

function sortReadyCandidates(candidates: ReadyCandidate[]): ReadyCandidate[] {
  return [...candidates].sort((left, right) => {
    const leftPriority = left.priority > 0 ? left.priority : Number.MAX_SAFE_INTEGER;
    const rightPriority = right.priority > 0 ? right.priority : Number.MAX_SAFE_INTEGER;
    return leftPriority - rightPriority || left.identifier.localeCompare(right.identifier);
  });
}

function buildSkippedItem(issue: ScannerIssueInput, reason: SkippedReason, details: Record<string, unknown>, snapshot: NormalizedSnapshot, taskId: string): SkippedItem {
  return {
    identifier: issue.identifier,
    taskId,
    title: issue.title,
    reason,
    details,
    snapshotHash: snapshot.snapshotHash,
    linearUpdatedAt: issue.updatedAt,
  };
}

export function scanLinearProject(input: LinearProjectSnapshotInput, options: { store?: SchedulerStore; config?: ScannerConfig } = {}): ScannerReport {
  const config = options.config ?? {};
  const observedAt = input.observedAt ?? nowIso();
  const issues = input.issues.map((issue) => normalizeIssue({ ...issue, projectId: issue.projectId || input.project.id, projectName: issue.projectName ?? input.project.name }));
  const graph = buildDependencyGraph(issues);
  const cycles = detectCycles(graph);
  const cycleMembers = new Set(cycles.flatMap((cycle) => cycle.path));
  const ready: ReadyCandidate[] = [];
  const skipped: SkippedItem[] = [];
  const projectControl = config.projectControls?.[input.project.id] ?? null;
  const projectPaused = (config.pausedProjectIds ?? []).includes(input.project.id) || Boolean(projectControl);

  for (const issue of issues) {
    const repo = parseRepo(issue.labels, config);
    const risk = parseRisk(issue.labels);
    const contract = parseContractState(issue.labels);
    const snapshot = options.store?.recordSnapshot(snapshotInputForIssue(issue, repo.repoKey ?? '', risk.risk, contract.state))
      ?? normalizeSnapshot(snapshotInputForIssue(issue, repo.repoKey ?? '', risk.risk, contract.state), observedAt);

    const skip = (reason: SkippedReason, details: Record<string, unknown> = {}) => skipped.push(buildSkippedItem(issue, reason, details, snapshot, taskIdForIssue(issue, config)));

    if (projectPaused) {
      skip('project_paused', { projectId: input.project.id, controlState: projectControl?.state ?? 'paused', reason: projectControl?.reason ?? null });
      continue;
    }
    if (!isCandidateState(issue, config)) {
      skip('state_not_candidate', { stateName: issue.stateName, stateType: issue.stateType });
      continue;
    }
    if (hasLabel(issue, 'agent:needs-human')) {
      skip('human_gate', { label: 'agent:needs-human' });
      continue;
    }
    if (!hasLabel(issue, 'agent:ready')) {
      skip('agent_ready_missing', { missingLabel: 'agent:ready' });
      continue;
    }
    if (contract.conflict) {
      skip('contract_conflict', { labels: issue.labels.filter((label) => label.startsWith('contract:')) });
      continue;
    }
    if (contract.state !== 'stable') {
      skip('contract_not_stable', { contractState: contract.state });
      continue;
    }

    const activeRun = options.store?.findActiveRunForIssue(issue.linearIssueId, taskIdForIssue(issue, config));
    if (activeRun) {
      skip('active_run_exists', { runId: activeRun.id, state: activeRun.state });
      continue;
    }
    const latestRun = options.store?.latestRunForIssue(issue.linearIssueId);
    if (latestRun && isTerminalRun(latestRun)) {
      skip('already_terminal', { runId: latestRun.id, state: latestRun.state });
      continue;
    }
    if (repo.reason) {
      skip(repo.reason, { repoLabels: repo.values });
      continue;
    }
    if (!repo.repoKey) {
      skip('repo_mapping_missing', { repoLabels: repo.values });
      continue;
    }
    if ((config.pausedRepoKeys ?? []).includes(repo.repoKey)) {
      skip('repo_paused', { repoKey: repo.repoKey });
      continue;
    }
    if (risk.reason) {
      skip(risk.reason, { riskLabels: risk.values });
      continue;
    }
    if (cycleMembers.has(issue.identifier)) {
      skip('dependency_cycle', { cycles: cycles.filter((cycle) => cycle.path.includes(issue.identifier)).map((cycle) => cycle.path) });
      continue;
    }

    const unresolvedBlockers: Array<{ identifier: string; reason: string; runId?: string }> = [];
    for (const blockerIdentifier of graph.incoming.get(issue.identifier) ?? []) {
      const blocker = graph.nodes.get(blockerIdentifier);
      if (!blocker) {
        unresolvedBlockers.push({ identifier: blockerIdentifier, reason: 'blocker_missing_from_snapshot' });
        continue;
      }
      const satisfaction = isBlockerSatisfied(blocker, { store: options.store, config });
      if (!satisfaction.satisfied) {
        unresolvedBlockers.push({ identifier: blockerIdentifier, reason: satisfaction.reason, runId: satisfaction.runId });
      }
    }
    if (unresolvedBlockers.length > 0) {
      skip('dependency_blocked', { blockers: unresolvedBlockers });
      continue;
    }

    const locks = resourceLockKeysForIssue({
      repoKey: repo.repoKey,
      labels: issue.labels,
      resourceHints: issue.resourceHints ?? [],
      allowRepoParallel: repoAllowsParallel(repo.repoKey, config),
    });
    const lockConflicts = options.store?.heldLockConflicts(locks) ?? [];
    if (lockConflicts.length > 0) {
      skip('resource_conflict', { lockConflicts });
      continue;
    }
    if ((issue.staleSnapshotChangedFields ?? []).length > 0) {
      skip('stale_snapshot', { changedFields: issue.staleSnapshotChangedFields });
      continue;
    }

    ready.push({
      linearIssueId: issue.linearIssueId,
      identifier: issue.identifier,
      title: issue.title,
      projectId: issue.projectId,
      stateName: issue.stateName,
      stateType: issue.stateType,
      labels: issue.labels,
      priority: issue.priority,
      repoKey: repo.repoKey,
      risk: risk.risk,
      contractState: contract.state,
      taskId: taskIdForIssue(issue, config),
      blockerIdentifiers: issue.blockerIdentifiers ?? [],
      resourceHints: issue.resourceHints ?? [],
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      downstreamCount: downstreamReach(graph, issue.identifier),
      dependencyDepth: dependencyDepth(graph, issue.identifier),
      locks,
      snapshotHash: snapshot.snapshotHash,
      linearUpdatedAt: issue.updatedAt,
      nativePreview: nativePreview(issue, config),
    });
  }

  return {
    project: { id: input.project.id, name: input.project.name, key: input.project.key ?? null },
    observedAt,
    ready: sortReadyCandidates(ready),
    skipped: skipped.sort((left, right) => left.identifier.localeCompare(right.identifier)),
    cycles,
  };
}

interface LinearGraphQLConnection<T> {
  nodes?: T[];
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
}

interface LinearIssueNode {
  id: string;
  identifier: string;
  title: string;
  url?: string | null;
  priority?: number | null;
  createdAt?: string | null;
  updatedAt: string;
  project?: { id: string; name: string; key?: string | null; url?: string | null } | null;
  state?: { name?: string | null; type?: string | null } | null;
  labels?: LinearGraphQLConnection<{ name: string }> | null;
  assignee?: { id: string; name?: string | null; email?: string | null } | null;
  relations?: LinearGraphQLConnection<Record<string, unknown>> | null;
}

interface LinearGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

function relationIssueIdentifier(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const record = value as Record<string, unknown>;
  const direct = record.identifier;
  return typeof direct === 'string' ? direct : null;
}

function blockerIdentifiersFromRelations(relations: LinearGraphQLConnection<Record<string, unknown>> | null | undefined): string[] {
  const blockers: string[] = [];
  for (const relation of relations?.nodes ?? []) {
    const type = String(relation.type ?? relation.relationType ?? '').toLowerCase().replace(/-/g, '_');
    if (!['blocked_by', 'blocks_blocked_by', 'is_blocked_by'].includes(type)) {
      continue;
    }
    const related = relationIssueIdentifier(relation.relatedIssue) ?? relationIssueIdentifier(relation.issue) ?? relationIssueIdentifier(relation.targetIssue);
    if (related) {
      blockers.push(related);
    }
  }
  return uniqueSorted(blockers);
}

function normalizeLinearIssueNode(node: LinearIssueNode, projectFallback: LinearProjectSnapshotInput['project']): ScannerIssueInput {
  const project = node.project ?? projectFallback;
  return {
    linearIssueId: node.id,
    identifier: node.identifier,
    title: node.title,
    projectId: project.id,
    projectName: project.name,
    url: node.url ?? undefined,
    stateName: node.state?.name ?? 'Unknown',
    stateType: node.state?.type ?? 'unknown',
    labels: uniqueSorted((node.labels?.nodes ?? []).map((label) => label.name)),
    priority: node.priority ?? 0,
    assignee: node.assignee ?? null,
    blockerIdentifiers: blockerIdentifiersFromRelations(node.relations),
    createdAt: node.createdAt ?? undefined,
    updatedAt: node.updatedAt,
    relations: node.relations ?? null,
  };
}

async function linearGraphQL<T>(options: { apiKey: string; endpoint?: string; query: string; variables: Record<string, unknown> }): Promise<T> {
  const response = await fetch(options.endpoint ?? 'https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: options.apiKey,
    },
    body: JSON.stringify({ query: options.query, variables: options.variables }),
  });
  if (!response.ok) {
    throw new Error(`Linear GraphQL request failed: ${response.status} ${response.statusText}`);
  }
  const payload = await response.json() as LinearGraphQLResponse<T>;
  if (payload.errors?.length) {
    throw new Error(`Linear GraphQL returned errors: ${payload.errors.map((error) => error.message).join('; ')}`);
  }
  if (!payload.data) {
    throw new Error('Linear GraphQL response did not include data.');
  }
  return payload.data;
}

export async function fetchLinearProjectSnapshot(options: { apiKey: string; projectId: string; endpoint?: string; pageSize?: number; observedAt?: string }): Promise<LinearProjectSnapshotInput> {
  const query = `
    query SchedulerProjectIssues($projectId: String!, $after: String, $first: Int!) {
      issues(first: $first, after: $after, orderBy: updatedAt, filter: { project: { id: { eq: $projectId } } }) {
        nodes {
          id
          identifier
          title
          url
          priority
          createdAt
          updatedAt
          project { id name key url }
          state { name type }
          labels { nodes { name } }
          assignee { id name email }
          relations { nodes { type relatedIssue { id identifier } } }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;
  const issues: LinearIssueNode[] = [];
  let after: string | null = null;
  let project: LinearProjectSnapshotInput['project'] = { id: options.projectId, name: options.projectId };

  do {
    const data = await linearGraphQL<{ issues: LinearGraphQLConnection<LinearIssueNode> }>({
      apiKey: options.apiKey,
      endpoint: options.endpoint,
      query,
      variables: { projectId: options.projectId, after, first: options.pageSize ?? 50 },
    });
    const pageIssues = data.issues.nodes ?? [];
    if (pageIssues[0]?.project) {
      project = pageIssues[0].project;
    }
    issues.push(...pageIssues);
    after = data.issues.pageInfo?.hasNextPage ? data.issues.pageInfo.endCursor ?? null : null;
  } while (after);

  return {
    project,
    observedAt: options.observedAt ?? nowIso(),
    issues: issues.map((issue) => normalizeLinearIssueNode(issue, project)),
  };
}

export function scannerReportHash(report: ScannerReport): string {
  return stableHash({ project: report.project, observedAt: report.observedAt, ready: report.ready, skipped: report.skipped, cycles: report.cycles });
}
