#!/usr/bin/env node --experimental-strip-types

import {
  existsSync,
  lstatSync,
  realpathSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'path';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export class CliError extends Error {
  code: string;
  hint?: string;

  constructor(code: string, message: string, hint?: string) {
    super(message);
    this.code = code;
    this.hint = hint;
  }
}

export interface CliContext {
  cwd: string;
  repoRoot: string;
  repoRealRoot: string;
  legionRoot: string;
  rawArgs: string[];
}

export interface TaskPhaseTask {
  description: string;
  acceptance: string;
  completed: boolean;
  current: boolean;
}

export interface TaskPhase {
  name: string;
  tasks: TaskPhaseTask[];
}

interface Proposal {
  id: string;
  taskId: string;
  name: string;
  goal: string;
  rationale: string;
  problem?: string;
  acceptance?: string[];
  assumptions?: string[];
  constraints?: string[];
  risks?: string[];
  points: string[];
  scope: string[];
  designIndex?: string;
  designSummary?: string[];
  phases: Array<{ name: string; tasks: Array<{ description: string; acceptance: string }> }>;
  proposedBy: string;
  proposedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  decidedAt?: string;
  decidedBy?: string;
  reason?: string;
  createdTaskId?: string;
}

interface ConfigTaskEntry {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface LegionConfig {
  version: string;
  currentTask: string | null;
  settings: {
    autoRemind: boolean;
    remindBeforeReset: boolean;
    taskCreationPolicy: string;
  };
  tasks: ConfigTaskEntry[];
  pendingProposals: Proposal[];
}

interface ContextState {
  completed: string[];
  inProgress: string[];
  blocked: string[];
  files: Array<{ path: string; purpose: string; status: string; notes: string }>;
  decisions: Array<{ decision: string; reason: string; alternatives: string; date: string }>;
  handoffNext: string[];
  handoffNotes: string[];
}

interface ParsedTaskList {
  title: string;
  phases: TaskPhase[];
  discovered: Array<{ description: string; source: string }>;
}

interface TaskContractSeed {
  problem?: string;
  acceptance?: string[];
  assumptions?: string[];
  constraints?: string[];
  risks?: string[];
  designIndex?: string;
  designSummary?: string[];
}

export function createContext(rawArgs: string[]): CliContext {
  const cwd = resolve(getFlag(rawArgs, '--cwd') ?? process.cwd());
  const ctx = {
    cwd,
    repoRoot: cwd,
    repoRealRoot: realpathSync(cwd),
    legionRoot: join(cwd, '.legion'),
    rawArgs,
  };
  assertRepoControlledPath(ctx, ctx.legionRoot, { allowMissingLeaf: true, rejectManagedSymlink: true });
  return ctx;
}

export function getFlag(args: string[], name: string): string | undefined {
  const exact = args.find((arg) => arg.startsWith(`${name}=`));
  if (exact) {
    return exact.slice(name.length + 1);
  }
  const index = args.indexOf(name);
  if (index >= 0 && args[index + 1] && !args[index + 1].startsWith('--')) {
    return args[index + 1];
  }
  return undefined;
}

export function hasFlag(args: string[], name: string): boolean {
  return args.includes(name) || args.some((arg) => arg.startsWith(`${name}=`));
}

export function parseJsonFlag(args: string[], name = '--json'): Record<string, unknown> {
  const value = getFlag(args, name);
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (!parsed || Array.isArray(parsed)) {
      throw new Error('payload must be object');
    }
    return parsed;
  } catch (error) {
    throw new CliError('SCHEMA_INVALID', `无法解析 ${name} JSON`, error instanceof Error ? error.message : undefined);
  }
}

export function parseCsv(value?: string): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ensureInitialized(ctx: CliContext) {
  if (!existsSync(ctx.legionRoot)) {
    throw new CliError('NOT_INITIALIZED', '未检测到 .legion 目录', '先运行 init');
  }
  assertRepoControlledPath(ctx, ctx.legionRoot, { allowMissingLeaf: false, rejectManagedSymlink: true });
}

export function initLegion(ctx: CliContext) {
  assertRepoControlledPath(ctx, ctx.legionRoot, { allowMissingLeaf: true, rejectManagedSymlink: true });
  mkdirSync(join(ctx.legionRoot, 'tasks'), { recursive: true });
  const configPath = join(ctx.legionRoot, 'config.json');
  if (!existsSync(configPath)) {
    writeJsonAtomic(ctx, configPath, {
      version: '1.0.0',
      currentTask: null,
      settings: {
        autoRemind: true,
        remindBeforeReset: true,
        taskCreationPolicy: 'direct-create',
      },
      tasks: [],
      pendingProposals: [],
    } satisfies LegionConfig);
  }
  const ledgerPath = join(ctx.legionRoot, 'ledger.csv');
  if (!existsSync(ledgerPath)) {
    writeTextAtomic(ctx, ledgerPath, 'timestamp,action,task_id,task_name,user,params_summary,result\n');
  }
}

export function loadConfig(ctx: CliContext): LegionConfig {
  ensureInitialized(ctx);
  return JSON.parse(readFileSync(join(ctx.legionRoot, 'config.json'), 'utf-8')) as LegionConfig;
}

export function saveConfig(ctx: CliContext, config: LegionConfig) {
  writeJsonAtomic(ctx, join(ctx.legionRoot, 'config.json'), config);
}

export function currentTaskId(ctx: CliContext, explicit?: string): string {
  const config = loadConfig(ctx);
  const taskId = explicit ?? config.currentTask;
  if (!taskId) {
    throw new CliError('NO_ACTIVE_TASK', '当前没有活跃任务', '传入 --task-id 或先切换任务');
  }
  return taskId;
}

export function taskRoot(ctx: CliContext, taskId: string): string {
  validateTaskId(taskId);
  const root = join(ctx.legionRoot, 'tasks', taskId);
  assertRepoControlledPath(ctx, root, { allowMissingLeaf: true, rejectManagedSymlink: true });
  return root;
}

export function safeRepoPath(ctx: CliContext, maybePath: string): string {
  if (!maybePath) {
    throw new CliError('SCHEMA_INVALID', '路径不能为空');
  }
  const absolute = isAbsolute(maybePath) ? resolve(maybePath) : resolve(ctx.repoRoot, maybePath);
  const rel = relative(ctx.repoRoot, absolute);
  if (rel.startsWith('..') || isAbsolute(rel) || rel.split(sep).includes('..')) {
    throw new CliError('OUT_OF_SCOPE', `路径越界: ${maybePath}`);
  }
  assertRepoControlledPath(ctx, absolute, { allowMissingLeaf: true, rejectManagedSymlink: false });
  return absolute;
}

export function repoRelative(ctx: CliContext, path: string): string {
  const absolute = safeRepoPath(ctx, path);
  return relative(ctx.repoRoot, absolute) || '.';
}

export function createTask(ctx: CliContext, input: Record<string, unknown>, fromProposal?: Proposal) {
  validateFields(input, ['taskId', 'name', 'goal', 'rationale', 'problem', 'acceptance', 'assumptions', 'constraints', 'risks', 'points', 'scope', 'designIndex', 'designSummary', 'phases']);
  const config = loadConfig(ctx);
  const draft = prepareTaskDraft(ctx, input, fromProposal, config);
  writeTaskDraft(draft);
  try {
    applyTaskToConfig(config, draft.taskId, draft.name);
    saveConfig(ctx, config);
  } catch (error) {
    rmSync(draft.root, { recursive: true, force: true });
    throw error;
  }
  appendLedger(ctx, 'legion_create_task', draft.taskId, draft.name, summarizeAuditFields(['taskId', 'goal', 'points', 'scope', 'phases']), 'success');
  return { taskId: draft.taskId, path: draft.root };
}

export function appendLedger(
  ctx: CliContext,
  action: string,
  taskId: string,
  taskName: string,
  paramsSummary: string,
  result: string,
) {
  ensureInitialized(ctx);
  const row = [new Date().toISOString(), action, taskId, taskName, 'Claude', paramsSummary, result]
    .map(csvEscape)
    .join(',');
  const ledgerPath = join(ctx.legionRoot, 'ledger.csv');
  assertRepoControlledPath(ctx, ledgerPath, { allowMissingLeaf: false, rejectManagedSymlink: true });
  writeFileSync(ledgerPath, `${readFileSync(ledgerPath, 'utf-8')}${row}\n`);
}

export function appendFailureAudit(ctx: CliContext, action: string, error: unknown, taskId = '', taskName = '') {
  try {
    if (!existsSync(ctx.legionRoot) || !existsSync(join(ctx.legionRoot, 'ledger.csv'))) {
      return;
    }
    const code = error instanceof CliError ? error.code : 'INTERNAL_ERROR';
    appendLedger(ctx, action, taskId, taskName, 'failure', `error:${code}`);
  } catch {
    // best effort only
  }
}

export function createProposal(ctx: CliContext, input: Record<string, unknown>) {
  validateFields(input, ['taskId', 'name', 'goal', 'rationale', 'problem', 'acceptance', 'assumptions', 'constraints', 'risks', 'points', 'scope', 'designIndex', 'designSummary', 'phases']);
  const proposal: Proposal = {
    id: `proposal-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`,
    taskId: asTaskId(input.taskId, 'taskId'),
    name: asString(input.name, 'name'),
    goal: asString(input.goal, 'goal'),
    rationale: asString(input.rationale, 'rationale'),
    problem: asOptionalString(input.problem),
    acceptance: asOptionalStringArray(input.acceptance, 'acceptance'),
    assumptions: asOptionalStringArray(input.assumptions, 'assumptions'),
    constraints: asOptionalStringArray(input.constraints, 'constraints'),
    risks: asOptionalStringArray(input.risks, 'risks'),
    points: asStringArray(input.points ?? []),
    scope: asStringArray(input.scope ?? []),
    designIndex: asOptionalString(input.designIndex),
    designSummary: asOptionalStringArray(input.designSummary, 'designSummary'),
    phases: normalizePhases(input.phases ?? []),
    proposedBy: 'Claude',
    proposedAt: new Date().toISOString(),
    status: 'pending',
  };
  const config = loadConfig(ctx);
  config.pendingProposals.push(proposal);
  saveConfig(ctx, config);
  appendLedger(ctx, 'legion_propose_task', '', '', summarizeAuditFields(['taskId', 'name', 'goal', `points:${proposal.points.length}`, `scope:${proposal.scope.length}`, `phases:${proposal.phases.length}`]), 'success');
  return proposal;
}

export function listProposals(ctx: CliContext, status: Proposal['status'] | 'all' = 'pending') {
  const config = loadConfig(ctx);
  return config.pendingProposals.filter((proposal) => status === 'all' || proposal.status === status);
}

export function approveProposal(ctx: CliContext, proposalId: string) {
  const config = loadConfig(ctx);
  const proposal = config.pendingProposals.find((item) => item.id === proposalId);
  if (!proposal) {
    throw new CliError('PROPOSAL_NOT_FOUND', `未找到提案: ${proposalId}`);
  }
  const decidedAt = new Date().toISOString();
  const draft = prepareTaskDraft(ctx, {
    taskId: proposal.taskId,
    name: proposal.name,
    goal: proposal.goal,
    rationale: proposal.rationale,
    problem: proposal.problem,
    acceptance: proposal.acceptance,
    assumptions: proposal.assumptions,
    constraints: proposal.constraints,
    risks: proposal.risks,
    points: proposal.points,
    scope: proposal.scope,
    designIndex: proposal.designIndex,
    designSummary: proposal.designSummary,
    phases: proposal.phases,
  }, proposal, config);
  writeTaskDraft(draft);
  try {
    proposal.status = 'approved';
    proposal.decidedAt = decidedAt;
    proposal.decidedBy = 'Claude';
    proposal.createdTaskId = draft.taskId;
    applyTaskToConfig(config, draft.taskId, proposal.name);
    saveConfig(ctx, config);
  } catch (error) {
    rmSync(draft.root, { recursive: true, force: true });
    throw error;
  }
  appendLedger(ctx, 'legion_approve_proposal', draft.taskId, proposal.name, summarizeAuditFields(['proposalId']), 'success');
  return { taskId: draft.taskId, path: draft.root };
}

export function rejectProposal(ctx: CliContext, proposalId: string, reason?: string) {
  const config = loadConfig(ctx);
  const proposal = config.pendingProposals.find((item) => item.id === proposalId);
  if (!proposal) {
    throw new CliError('PROPOSAL_NOT_FOUND', `未找到提案: ${proposalId}`);
  }
  proposal.status = 'rejected';
  proposal.reason = reason;
  proposal.decidedAt = new Date().toISOString();
  proposal.decidedBy = 'Claude';
  saveConfig(ctx, config);
  appendLedger(ctx, 'legion_reject_proposal', '', '', summarizeAuditFields(['proposalId', reason ? 'reason' : 'no-reason']), 'success');
  return proposal;
}

export function listTasks(ctx: CliContext) {
  return loadConfig(ctx).tasks;
}

export function switchTask(ctx: CliContext, taskId: string) {
  validateTaskId(taskId);
  const config = loadConfig(ctx);
  const hit = config.tasks.find((task) => task.id === taskId);
  if (!hit) {
    throw new CliError('NO_ACTIVE_TASK', `未找到任务: ${taskId}`);
  }
  config.currentTask = taskId;
  config.tasks = config.tasks.map((task) => ({
    ...task,
    status: task.id === taskId ? 'active' : task.status === 'archived' ? 'archived' : 'paused',
    updatedAt: task.id === taskId ? new Date().toISOString() : task.updatedAt,
  }));
  saveConfig(ctx, config);
  appendLedger(ctx, 'legion_switch_task', taskId, hit.name, summarizeAuditFields(['taskId']), 'success');
  return hit;
}

export function archiveTask(ctx: CliContext, taskId: string) {
  validateTaskId(taskId);
  const config = loadConfig(ctx);
  const hit = config.tasks.find((task) => task.id === taskId);
  if (!hit) {
    throw new CliError('NO_ACTIVE_TASK', `未找到任务: ${taskId}`);
  }
  hit.status = 'archived';
  hit.updatedAt = new Date().toISOString();
  if (config.currentTask === taskId) {
    config.currentTask = null;
  }
  saveConfig(ctx, config);
  appendLedger(ctx, 'legion_archive_task', taskId, hit.name, summarizeAuditFields(['taskId']), 'success');
  return hit;
}

export function getStatus(ctx: CliContext, explicitTaskId?: string) {
  const taskId = currentTaskId(ctx, explicitTaskId);
  const config = loadConfig(ctx);
  const task = config.tasks.find((item) => item.id === taskId);
  if (!task) {
    throw new CliError('NO_ACTIVE_TASK', `未找到任务: ${taskId}`);
  }
  const tasksState = parseTasks(readFile(join(taskRoot(ctx, taskId), 'tasks.md')));
  const total = tasksState.phases.reduce((sum, phase) => sum + phase.tasks.length, 0);
  const done = tasksState.phases.reduce((sum, phase) => sum + phase.tasks.filter((item) => item.completed).length, 0);
  const current = tasksState.phases.flatMap((phase) => phase.tasks).find((item) => item.current);
  return {
    taskId,
    name: task.name,
    status: task.status,
    currentTask: current?.description ?? null,
    progress: { completed: done, total },
  };
}

export function readContextCommand(ctx: CliContext, taskId: string, section: string, includeReviews: boolean) {
  const root = taskRoot(ctx, taskId);
  const content = readFile(join(root, 'log.md'));
  const result = section === 'all' ? content : extractHeadingSection(content, sectionToHeading(section));
  return includeReviews ? { content: result, reviews: listReviews(ctx, taskId, 'all', 'all') } : { content: result };
}

export function updateContextCommand(ctx: CliContext, payload: Record<string, unknown>) {
  validateFields(payload, ['taskId', 'progress', 'addFile', 'addDecision', 'addConstraint', 'handoff']);
  const taskId = currentTaskId(ctx, asOptionalString(payload.taskId));
  const root = taskRoot(ctx, taskId);
  const contextPath = join(root, 'log.md');
  const original = readFile(contextPath);
  const title = titleFromHeading(original).replace(/ - 日志$/, '');
  const state = parseContext(original);
  const progress = payload.progress as Record<string, unknown> | undefined;
  if (progress) {
    validateFields(progress, ['completed', 'inProgress', 'blocked']);
    state.completed.push(...asStringArray(progress.completed ?? []));
    state.inProgress.push(...asStringArray(progress.inProgress ?? []));
    state.blocked.push(...asStringArray(progress.blocked ?? []));
  }
  const addFile = payload.addFile as Record<string, unknown> | undefined;
  if (addFile) {
    validateFields(addFile, ['path', 'purpose', 'status', 'notes']);
    const path = repoRelative(ctx, asString(addFile.path, 'addFile.path'));
    state.files.push({
      path,
      purpose: asMarkdownLine(addFile.purpose, 'addFile.purpose'),
      status: assertEnum(asString(addFile.status, 'addFile.status'), 'addFile.status', ['completed', 'in_progress', 'pending', 'deleted']),
      notes: addFile.notes == null ? '' : asMarkdownLine(addFile.notes, 'addFile.notes'),
    });
  }
  const addDecision = payload.addDecision as Record<string, unknown> | undefined;
  if (addDecision) {
    validateFields(addDecision, ['decision', 'reason', 'alternatives', 'date']);
    state.decisions.push({
      decision: asMarkdownLine(addDecision.decision, 'addDecision.decision'),
      reason: asMarkdownLine(addDecision.reason, 'addDecision.reason'),
      alternatives: asMarkdownLine(addDecision.alternatives, 'addDecision.alternatives'),
      date: asMarkdownLine(addDecision.date, 'addDecision.date'),
    });
  }
  if (payload.addConstraint) {
    state.blocked.push(`约束: ${asMarkdownLine(payload.addConstraint, 'addConstraint')}`);
  }
  const handoff = payload.handoff as Record<string, unknown> | undefined;
  if (handoff) {
    validateFields(handoff, ['nextSteps', 'notes']);
    state.handoffNext.push(...asStringArray(handoff.nextSteps ?? []).map((item) => asMarkdownLine(item, 'handoff.nextSteps[]')));
    state.handoffNotes.push(...asStringArray(handoff.notes ?? []).map((item) => asMarkdownLine(item, 'handoff.notes[]')));
  }
  let updated = original;
  updated = replaceSubSectionBody(updated, '✅ 已完成', mergeBulletSubSection(state.completed));
  updated = replaceSubSectionBody(updated, '🟡 进行中', mergeBulletSubSection(state.inProgress));
  updated = replaceSubSectionBody(updated, '⚠️ 阻塞/待定', mergeBulletSubSection(state.blocked));
  updated = replaceSectionBody(updated, '关键文件', mergeFreeformSection(renderContextFiles(state.files), filterContextFilesExtras));
  updated = replaceSectionBody(updated, '关键决策', mergeFreeformSection(renderDecisionTable(state.decisions), filterDecisionExtras));
  updated = replaceSectionBody(updated, '快速交接', mergeFreeformSection(renderHandoffSection(state.handoffNext, state.handoffNotes), filterHandoffExtras));
  updated = replaceFooterTimestamp(updated, 'by Legion CLI');
  writeTextAtomic(ctx, contextPath, updated);
  appendLedger(ctx, 'legion_update_log', taskId, title, summarizeAuditFields(Object.keys(payload)), 'success');
  return { taskId };
}

export function readTasksCommand(ctx: CliContext, taskId: string) {
  return { content: readFile(join(taskRoot(ctx, taskId), 'tasks.md')) };
}

export function updateTasksCommand(ctx: CliContext, payload: Record<string, unknown>) {
  validateFields(payload, ['taskId', 'completeTask', 'setCurrentTask', 'addTask', 'addDiscoveredTask']);
  const taskId = currentTaskId(ctx, asOptionalString(payload.taskId));
  const root = taskRoot(ctx, taskId);
  const tasksPath = join(root, 'tasks.md');
  const original = readFile(tasksPath);
  const parsed = parseTasks(original);

  if (payload.completeTask) {
    const item = payload.completeTask as Record<string, unknown>;
    validateFields(item, ['phase', 'taskIndex', 'taskDescription']);
    const task = locateTask(parsed, item);
    task.completed = true;
    if (task.current) {
      task.current = false;
    }
  }
  if (payload.addTask) {
    const item = payload.addTask as Record<string, unknown>;
    validateFields(item, ['phase', 'description', 'acceptance']);
    const phase = locatePhase(parsed, item.phase);
    phase.tasks.push({
      description: asString(item.description, 'addTask.description'),
      acceptance: asMarkdownLine(item.acceptance, 'addTask.acceptance'),
      completed: false,
      current: phase.tasks.length === 0,
    });
  }
  if (payload.setCurrentTask) {
    const item = payload.setCurrentTask as Record<string, unknown>;
    validateFields(item, ['phase', 'taskIndex', 'taskDescription']);
    clearCurrent(parsed);
    locateTask(parsed, item).current = true;
  }
  if (payload.addDiscoveredTask) {
    const item = payload.addDiscoveredTask as Record<string, unknown>;
    validateFields(item, ['description', 'source']);
    parsed.discovered.push({
      description: asMarkdownLine(item.description, 'addDiscoveredTask.description'),
      source: asMarkdownLine(item.source, 'addDiscoveredTask.source'),
    });
  }
  if (!parsed.phases.some((phase) => phase.tasks.some((task) => task.current && !task.completed))) {
    const fallback = parsed.phases.flatMap((phase) => phase.tasks).find((task) => !task.completed);
    if (fallback) {
      fallback.current = true;
    }
  }
  let updated = original;
  updated = replaceSectionBody(updated, '快速恢复', mergeFreeformSection(renderQuickRecovery(parsed), filterQuickRecoveryExtras));
  parsed.phases.forEach((phase, index) => {
    updated = replacePhaseSectionBody(updated, index + 1, phase.name, mergeFreeformSection(renderPhaseTasks(phase.tasks), filterTaskSectionExtras));
  });
  updated = replaceSectionBody(updated, '发现的新任务', mergeFreeformSection(renderDiscovered(parsed.discovered), filterTaskSectionExtras));
  updated = replaceFooterTimestamp(updated);
  writeTextAtomic(ctx, tasksPath, updated);
  appendLedger(ctx, 'legion_update_tasks', taskId, parsed.title, summarizeAuditFields(Object.keys(payload)), 'success');
  return { taskId };
}

export function updatePlanCommand(ctx: CliContext, payload: Record<string, unknown>) {
  validateFields(payload, ['taskId', 'goal', 'points', 'scope', 'phases']);
  const taskId = currentTaskId(ctx, asOptionalString(payload.taskId));
  const root = taskRoot(ctx, taskId);
  const planPath = join(root, 'plan.md');
  let current = readFile(planPath);
  const title = titleFromHeading(current);
  if (payload.goal) {
    current = replaceSectionBody(current, '目标', mergeFreeformSection(asString(payload.goal, 'goal'), filterSimpleSectionExtras));
  }
  if (payload.points) {
    current = replaceSectionBody(current, '要点', mergeFreeformSection(renderBullets(asStringArray(payload.points)), filterBulletExtras));
  }
  if (payload.scope) {
    current = replaceSectionBody(current, '范围', mergeFreeformSection(renderBullets(asStringArray(payload.scope)), filterBulletExtras));
  }
  if (payload.phases) {
    current = replaceSectionBody(current, '阶段概览', mergeFreeformSection(renderRawLines(asStringArray(payload.phases)), filterOrderedExtras));
  }
  current = replaceUpdatedDate(current);
  writeTextAtomic(ctx, planPath, current);
  appendLedger(ctx, 'legion_update_plan', taskId, title, summarizeAuditFields(Object.keys(payload)), 'success');
  return { taskId };
}

export function listReviews(ctx: CliContext, taskId: string, status: string, type: string) {
  const files = ['plan.md', 'log.md', 'tasks.md'] as const;
  const results: Array<Record<string, Json>> = [];
  for (const file of files) {
    const fullPath = join(taskRoot(ctx, taskId), file);
    const lines = readFile(fullPath).split('\n');
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const match = line.match(/^> \[REVIEW(?::([a-z-]+))?\] ?(.*)$/i);
      if (!match) {
        continue;
      }
      let response: string | null = null;
      let reviewStatus = 'open';
      let cursor = index + 1;
      while (cursor < lines.length && lines[cursor].startsWith('> ')) {
        const responseMatch = lines[cursor].match(/^> \[RESPONSE\] ?(.*)$/i);
        if (responseMatch) {
          response = responseMatch[1];
        }
        const statusMatch = lines[cursor].match(/^> \[STATUS:([a-z-]+)\]$/i);
        if (statusMatch) {
          reviewStatus = statusMatch[1];
        }
        cursor += 1;
      }
      const reviewType = match[1] ?? 'general';
      if ((status === 'all' || reviewStatus === status) && (type === 'all' || reviewType === type)) {
        results.push({
          file,
          reviewId: `${file}:L${index + 1}`,
          line: index + 1,
          type: reviewType,
          status: reviewStatus,
          content: match[2],
          response,
        });
      }
      index = cursor - 1;
    }
  }
  return results;
}

export function respondReview(ctx: CliContext, payload: Record<string, unknown>) {
  validateFields(payload, ['taskId', 'file', 'reviewId', 'response', 'status']);
  const taskId = currentTaskId(ctx, asOptionalString(payload.taskId));
  const reviewId = asString(payload.reviewId, 'reviewId');
  const parsedReviewTarget = parseStableReviewId(reviewId);
  const file = parsedReviewTarget?.file ?? asString(payload.file, 'file');
  if (!['plan.md', 'log.md', 'tasks.md'].includes(file)) {
    throw new CliError('SCHEMA_INVALID', `不支持的 review 文件: ${file}`);
  }
  const root = taskRoot(ctx, taskId);
  const fullPath = join(root, file);
  const lines = readFile(fullPath).split('\n');
  const statusValue = assertEnum(asString(payload.status, 'status'), 'status', ['resolved', 'wontfix', 'need-info']);
  const lineNo = parsedReviewTarget?.line ?? Number(reviewId);
  if (!lineNo || !lines[lineNo - 1]?.startsWith('> [REVIEW')) {
    throw new CliError('REVIEW_NOT_FOUND', `未找到 Review: ${reviewId}`);
  }
  let cursor = lineNo;
  while (cursor < lines.length && lines[cursor].startsWith('> ')) {
    if (/^> \[(RESPONSE|STATUS:)/.test(lines[cursor])) {
      lines.splice(cursor, 1);
      continue;
    }
    cursor += 1;
  }
  lines.splice(cursor, 0, `> [RESPONSE] ${asMarkdownLine(payload.response, 'response')}`, `> [STATUS:${statusValue}]`);
  writeTextAtomic(ctx, fullPath, `${lines.join('\n').replace(/\n+$/, '')}\n`);
  appendLedger(ctx, 'legion_respond_review', taskId, titleFromHeading(readFile(fullPath)), summarizeAuditFields(['file', 'reviewId', 'status']), 'success');
  return { taskId, file, reviewId };
}

export function generateDashboard(ctx: CliContext, taskId: string, format: 'markdown' | 'html', sections: string[], outputPath?: string) {
  const status = getStatus(ctx, taskId);
  const contextContent = readFile(join(taskRoot(ctx, taskId), 'log.md'));
  const decisions = parseContext(contextContent).decisions;
  const bodyMd = [
    `# ${status.name} Dashboard`,
    '',
    sections.includes('status') ? `- 状态: ${status.status}` : '',
    sections.includes('progress') ? `- 进度: ${status.progress.completed}/${status.progress.total}` : '',
    sections.includes('blockers') ? '## Blockers\n' + (parseContext(contextContent).blocked.map((item) => `- ${item}`).join('\n') || '- (none)') : '',
    sections.includes('decisions') ? '## Decisions\n' + (decisions.map((item) => `- ${item.date}｜${item.decision}`).join('\n') || '- (none)') : '',
    sections.includes('recent_activity') ? '## Recent Activity\n- 查看 ledger query 获取最近写操作。' : '',
  ].filter(Boolean).join('\n');
  const body = format === 'html'
    ? `<html><body><pre>${escapeHtml(bodyMd)}</pre></body></html>\n`
    : `${bodyMd}\n`;
  let savedTo: string | null = null;
  if (outputPath) {
    const absolute = safeRepoPath(ctx, outputPath);
    mkdirSync(dirname(absolute), { recursive: true });
    writeTextAtomic(ctx, absolute, body);
    savedTo = relative(ctx.repoRoot, absolute);
  }
  appendLedger(ctx, 'legion_generate_dashboard', taskId, status.name, summarizeAuditFields(['format', outputPath ? 'output' : 'stdout']), 'success');
  return { taskId, format, content: body, outputPath: savedTo };
}

export function queryLedger(ctx: CliContext, filters: {
  taskId?: string;
  action?: string;
  since?: string;
  until?: string;
  limit?: number;
}) {
  const limit = filters.limit == null ? 100 : ensurePositiveLimit(filters.limit, 500);
  const rows = parseCsvRows(readFile(join(ctx.legionRoot, 'ledger.csv'))).slice(1).map((row) => ({
    timestamp: row[0] ?? '',
    action: row[1] ?? '',
    task_id: row[2] ?? '',
    task_name: row[3] ?? '',
    user: row[4] ?? '',
    params_summary: row[5] ?? '',
    result: row[6] ?? '',
  }));
  return rows
    .filter((row) => !filters.taskId || row.task_id === filters.taskId)
    .filter((row) => !filters.action || row.action === filters.action)
    .filter((row) => !filters.since || row.timestamp >= filters.since)
    .filter((row) => !filters.until || row.timestamp <= filters.until)
    .slice(0, limit);
}

export function printSuccess(data: Json, hint?: string) {
  const payload = hint ? { success: true, data, hint } : { success: true, data };
  console.log(JSON.stringify(payload, null, 2));
}

export function printError(error: unknown) {
  const payload = error instanceof CliError
    ? { success: false, error: { code: error.code, message: error.message, ...(error.hint ? { hint: error.hint } : {}) } }
    : { success: false, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : String(error) } };
  console.log(JSON.stringify(payload, null, 2));
}

export function validateFields(payload: Record<string, unknown>, allowed: string[]) {
  const extras = Object.keys(payload).filter((key) => !allowed.includes(key));
  if (extras.length > 0) {
    throw new CliError('SCHEMA_INVALID', `存在未知字段: ${extras.join(', ')}`);
  }
}

function summarizeAuditFields(fields: string[]): string {
  return fields.filter(Boolean).join('|');
}

function titleFromHeading(content: string): string {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? 'Untitled';
}

interface TaskDraft {
  ctx: CliContext;
  taskId: string;
  root: string;
  name: string;
  goal: string;
  plan: string;
  context: string;
  tasks: string;
}

function prepareTaskDraft(ctx: CliContext, input: Record<string, unknown>, fromProposal: Proposal | undefined, config: LegionConfig): TaskDraft {
  const taskId = resolveTaskId(input, fromProposal);
  const name = asString(input.name, 'name');
  const goal = asString(input.goal, 'goal');
  const contractSeed = normalizeTaskContractSeed(input, fromProposal);
  const points = asStringArray(input.points ?? []);
  const scope = asStringArray(input.scope ?? []);
  const phases = normalizePhases(input.phases ?? []);
  if (config.tasks.some((task) => task.id === taskId)) {
    throw new CliError('TASK_ALREADY_EXISTS', `任务已存在: ${taskId}`);
  }
  const root = taskRoot(ctx, taskId);
  if (existsSync(root)) {
    throw new CliError('TASK_ALREADY_EXISTS', `任务目录已存在: ${taskId}`);
  }
  return {
    ctx,
    taskId,
    root,
    name,
    goal,
    plan: renderPlan({
      title: name,
      goal,
      problem: contractSeed.problem ?? fromProposal?.rationale ?? '待补充问题陈述。',
      acceptance: contractSeed.acceptance ?? [
        'CLI/流程能够在当前范围内完成约定交付。',
        '相关文档与脚本入口保持一致。',
      ],
      assumptions: contractSeed.assumptions ?? ['若无额外说明，则沿用当前仓库约定与工作语言。'],
      constraints: contractSeed.constraints ?? ['实现必须严格遵守任务 Scope。'],
      risks: contractSeed.risks ?? ['如脚本/文档入口不一致，可能导致工作流漂移。'],
      points,
      scope,
      designIndex: contractSeed.designIndex ?? (fromProposal ? '.legion/tasks/<task-id>/docs/rfc.md' : '（暂无）'),
      designSummary: contractSeed.designSummary ?? [
        '核心流程: 先恢复任务契约，再按阶段推进实现。',
        '验证策略: 运行已有 smoke/test/check 命令并记录结果。',
      ],
      phases: phases.map((phase, index) => `${index + 1}. **${phase.name}** - ${phase.tasks[0]?.description ?? '待补充任务'}`),
    }),
    context: renderContext({
      completed: [],
      inProgress: ['初始化任务日志。'],
      blocked: [],
      files: [],
      decisions: [],
      handoffNext: ['按计划推进当前阶段任务。'],
      handoffNotes: ['subagent 不直接改写 .legion 三文件。'],
    }, name),
    tasks: renderTasks({
      title: name,
      phases: phases.map((phase, phaseIndex) => ({
        name: phase.name,
        tasks: phase.tasks.map((task, taskIndex) => ({
          description: task.description,
          acceptance: task.acceptance,
          completed: false,
          current: phaseIndex === 0 && taskIndex === 0,
        })),
      })),
      discovered: [],
    }),
  };
}

function writeTaskDraft(draft: TaskDraft) {
  assertRepoControlledPath(draft.ctx, join(draft.root, 'docs'), { allowMissingLeaf: true, rejectManagedSymlink: true });
  mkdirSync(join(draft.root, 'docs'), { recursive: true });
  writeTextAtomic(draft.ctx, join(draft.root, 'plan.md'), draft.plan);
  writeTextAtomic(draft.ctx, join(draft.root, 'log.md'), draft.context);
  writeTextAtomic(draft.ctx, join(draft.root, 'tasks.md'), draft.tasks);
}

function applyTaskToConfig(config: LegionConfig, taskId: string, name: string) {
  const now = new Date().toISOString();
  config.tasks.push({ id: taskId, name, status: 'active', createdAt: now, updatedAt: now });
  config.tasks = config.tasks.map((task) => ({ ...task, status: task.id === taskId ? 'active' : task.status === 'archived' ? 'archived' : 'paused' }));
  config.currentTask = taskId;
}

function renderPlan(input: {
  title: string;
  goal: string;
  problem: string;
  acceptance: string[];
  assumptions: string[];
  constraints: string[];
  risks: string[];
  points: string[];
  scope: string[];
  designIndex: string;
  designSummary: string[];
  phases: string[];
}) {
  return `# ${input.title}\n\n## 目标\n\n${input.goal}\n\n## 问题陈述\n\n${input.problem}\n\n## 验收标准\n\n${input.acceptance.map((item) => `- [ ] ${item}`).join('\n') || '- [ ] 待补充'}\n\n## 假设 / 约束 / 风险\n\n${renderConstraintSection(input.assumptions, input.constraints, input.risks)}\n\n## 要点\n\n${input.points.map((item) => `- ${item}`).join('\n') || '- 待补充'}\n\n## 范围\n\n${input.scope.map((item) => `- ${item}`).join('\n') || '- 待补充'}\n\n## 设计索引 (Design Index)\n\n> **Design Source of Truth**: ${input.designIndex}\n\n**摘要**:\n${input.designSummary.map((item) => `- ${item}`).join('\n') || '- 待补充'}\n\n## 阶段概览\n\n${input.phases.join('\n') || '1. **阶段 1** - 待补充'}\n\n---\n\n*创建于: ${today()} | 最后更新: ${today()}*\n`;
}

function renderConstraintSection(assumptions: string[], constraints: string[], risks: string[]) {
  const rows = [
    ...assumptions.map((value) => `- **假设**: ${value}`),
    ...constraints.map((value) => `- **约束**: ${value}`),
    ...risks.map((value) => `- **风险**: ${value}`),
  ];
  return rows.join('\n') || '- **假设**: 待补充';
}

function renderContext(state: ContextState, title: string) {
  return `# ${title} - 日志\n\n## 会话进展 (${today()})\n\n### ✅ 已完成\n\n${renderBullets(state.completed)}\n\n### 🟡 进行中\n\n${renderBullets(state.inProgress)}\n\n### ⚠️ 阻塞/待定\n\n${renderBullets(state.blocked)}\n\n---\n\n## 关键文件\n\n${renderContextFiles(state.files)}\n\n---\n\n## 关键决策\n\n${renderDecisionTable(state.decisions)}\n\n---\n\n## 快速交接\n\n${renderHandoffSection(state.handoffNext, state.handoffNotes)}\n\n---\n\n*最后更新: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} by Legion CLI*\n`;
}

function renderTasks(parsed: ParsedTaskList) {
  const phaseSections = parsed.phases.map((phase, index) => {
    const status = taskPhaseStatus(phase.tasks);
    return `## 阶段 ${index + 1}: ${phase.name} ${status.icon} ${status.label}\n\n${renderPhaseTasks(phase.tasks)}\n`;
  }).join('\n---\n\n');
  return `# ${parsed.title} - 任务清单\n\n## 快速恢复\n\n${renderQuickRecovery(parsed)}\n\n---\n\n${phaseSections}\n\n---\n\n## 发现的新任务\n\n${renderDiscovered(parsed.discovered)}\n\n\n---\n\n*最后更新: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}*\n`;
}

function parseContext(content: string): ContextState {
  const completed = extractBulletsBySubHeading(content, '✅ 已完成');
  const inProgress = extractBulletsBySubHeading(content, '🟡 进行中');
  const blocked = extractBulletsBySubHeading(content, '⚠️ 阻塞/待定');
  const filesSection = extractHeadingSection(content, '关键文件');
  const fileMatches = [...filesSection.matchAll(/- \*\*`([^`]+)`\*\* \[([^\]]+)\]\n  - 作用: (.+)\n  - 备注: (.+)/g)];
  const decisionsSection = extractHeadingSection(content, '关键决策');
  const decisionLines = decisionsSection.split('\n').filter((line) => /^\| .*\|$/.test(line) && !line.includes('------') && !line.includes('(暂无)'));
  const handoff = extractHeadingSection(content, '快速交接');
  return {
    completed,
    inProgress,
    blocked,
    files: fileMatches.map((match) => ({ path: match[1], status: match[2], purpose: match[3], notes: match[4] })),
    decisions: decisionLines.map((line) => {
      const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
      return {
        decision: cells[0] ?? '',
        reason: cells[1] ?? '',
        alternatives: cells[2] ?? '',
        date: cells[3] ?? '',
      };
    }),
    handoffNext: extractOrderedFromBlock(handoff),
    handoffNotes: extractBulletsFromBlock(handoff),
  };
}

function parseTasks(content: string): ParsedTaskList {
  const title = titleFromHeading(content).replace(/ - 任务清单$/, '');
  const sections = [...content.matchAll(/## 阶段 (\d+): (.+?) (⏳|🟡|✅) (NOT STARTED|IN PROGRESS|COMPLETE)\n\n([\s\S]*?)(?=\n---\n\n## 阶段|\n---\n\n## 发现的新任务)/g)];
  const phases = sections.map((match) => ({
    name: match[2],
    tasks: match[5].split('\n').filter((line) => line.startsWith('- [')).map((line) => {
      const taskMatch = line.match(/^- \[([ x])\] (.+?) \| 验收: (.+?)( ← CURRENT)?$/);
      if (!taskMatch) {
        throw new CliError('SCHEMA_INVALID', 'tasks.md 结构无法解析');
      }
      return {
        completed: taskMatch[1] === 'x',
        description: taskMatch[2],
        acceptance: taskMatch[3],
        current: Boolean(taskMatch[4]),
      };
    }),
  }));
  const discoveredSection = extractHeadingSection(content, '发现的新任务');
  const discovered = discoveredSection.split('\n').filter((line) => line.startsWith('- [ ] ')).map((line) => {
    const match = line.match(/^- \[ \] (.+?) \| 来源: (.+)$/);
    return { description: match?.[1] ?? line, source: match?.[2] ?? '' };
  });
  return { title, phases, discovered };
}

function extractHeadingSection(content: string, heading: string): string {
  const escaped = escapeRegex(heading);
  const match = content.match(new RegExp(`## ${escaped}(?: \(.*?\))?\\n\\n([\\s\\S]*?)(?=\\n## |\\n---\\n\\n\*最后更新|$)`));
  return match?.[1]?.trim() ?? '';
}

function replaceSectionBody(content: string, heading: string, updater: (oldBody: string) => string): string {
  return replaceNamedSection(content, heading, '##', updater);
}

function replaceSubSectionBody(content: string, heading: string, updater: (oldBody: string) => string): string {
  return replaceNamedSection(content, heading, '###', updater);
}

function replaceNamedSection(content: string, heading: string, marker: '##' | '###', updater: (oldBody: string) => string): string {
  const lines = content.split('\n');
  const headingLine = `${marker} ${heading}`;
  const start = lines.findIndex((line) => line === headingLine || (marker === '##' && line.startsWith(`${headingLine} (`)));
  if (start < 0) {
    return content;
  }
  let bodyStart = start + 1;
  if (lines[bodyStart] === '') {
    bodyStart += 1;
  }
  let end = bodyStart;
  while (end < lines.length) {
    const line = lines[end];
    if (marker === '###' && (/^### /.test(line) || /^## /.test(line) || line === '---')) {
      break;
    }
    if (marker === '##' && (/^## /.test(line) || line === '---')) {
      break;
    }
    end += 1;
  }
  const oldBody = lines.slice(bodyStart, end).join('\n').trim();
  const newBody = updater(oldBody).trimEnd();
  const replacement = [lines[start], '', ...newBody.split('\n')];
  lines.splice(start, end - start, ...replacement);
  return lines.join('\n');
}

function replacePhaseSectionBody(content: string, phaseNumber: number, phaseName: string, updater: (oldBody: string) => string): string {
  const lines = content.split('\n');
  const start = lines.findIndex((line) => line.startsWith(`## 阶段 ${phaseNumber}: ${phaseName} `));
  if (start < 0) {
    return content;
  }
  let bodyStart = start + 1;
  if (lines[bodyStart] === '') {
    bodyStart += 1;
  }
  let end = bodyStart;
  while (end < lines.length && lines[end] !== '---') {
    end += 1;
  }
  const oldBody = lines.slice(bodyStart, end).join('\n').trim();
  const newBody = updater(oldBody).trimEnd();
  const status = taskPhaseStatus(parseTaskLinesFromBody(newBody));
  const header = `## 阶段 ${phaseNumber}: ${phaseName} ${status.icon} ${status.label}`;
  lines.splice(start, end - start, header, '', ...newBody.split('\n'));
  return lines.join('\n');
}

function mergeBulletSubSection(items: string[]): (oldBody: string) => string {
  return (oldBody) => mergeFreeformSection(renderBullets(items), filterBulletExtras)(oldBody);
}

function mergeFreeformSection(managed: string, filterExtras: (oldBody: string) => string[]): (oldBody: string) => string {
  return (oldBody) => {
    const extras = filterExtras(oldBody);
    return extras.length ? `${managed}\n\n${extras.join('\n')}` : managed;
  };
}

function filterBulletExtras(oldBody: string): string[] {
  return oldBody.split('\n').filter((line) => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('- ');
  });
}

function filterContextFilesExtras(oldBody: string): string[] {
  const lines = oldBody.split('\n');
  const extras: string[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (/^- \*\*`[^`]+`\*\* \[[^\]]+\]$/.test(lines[index]) && lines[index + 1]?.startsWith('  - 作用: ') && lines[index + 2]?.startsWith('  - 备注: ')) {
      index += 2;
      continue;
    }
    if (lines[index].trim() === '(暂无)' || lines[index].trim() === '') {
      continue;
    }
    extras.push(lines[index]);
  }
  return extras;
}

function filterDecisionExtras(oldBody: string): string[] {
  return oldBody.split('\n').filter((line) => line.trim() && !line.startsWith('|'));
}

function filterHandoffExtras(oldBody: string): string[] {
  return oldBody.split('\n').filter((line) => {
    const trimmed = line.trim();
    return trimmed && !/^\*\*/.test(trimmed) && !/^\d+\. /.test(trimmed) && !trimmed.startsWith('- ');
  });
}

function filterSimpleSectionExtras(oldBody: string): string[] {
  const extras: string[] = [];
  let preserving = false;
  oldBody.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (preserving) {
        extras.push(line);
      }
      return;
    }
    if (!preserving && trimmed.startsWith('> ')) {
      preserving = true;
    }
    if (preserving) {
      extras.push(line);
    }
  });
  return extras.filter((line) => line.trim());
}

function filterOrderedExtras(oldBody: string): string[] {
  return oldBody.split('\n').filter((line) => line.trim() && !/^\d+\. /.test(line.trim()));
}

function filterQuickRecoveryExtras(oldBody: string): string[] {
  return oldBody.split('\n').filter((line) => line.trim() && !line.startsWith('**当前阶段**:') && !line.startsWith('**当前任务**:') && !line.startsWith('**进度**:'));
}

function filterTaskSectionExtras(oldBody: string): string[] {
  return oldBody.split('\n').filter((line) => {
    const trimmed = line.trim();
    return trimmed && trimmed !== '(暂无)' && !trimmed.startsWith('- [');
  });
}

function renderContextFiles(files: ContextState['files']): string {
  return files.length
    ? files.map((file) => `- **\`${file.path}\`** [${file.status}]\n  - 作用: ${file.purpose}\n  - 备注: ${file.notes || '(none)'}`).join('\n')
    : '(暂无)';
}

function renderDecisionTable(decisions: ContextState['decisions']): string {
  const rows = decisions.length
    ? decisions.map((item) => `| ${escapeTable(item.decision)} | ${escapeTable(item.reason)} | ${escapeTable(item.alternatives)} | ${escapeTable(item.date)} |`).join('\n')
    : '| (暂无) | - | - | - |';
  return `| 决策 | 原因 | 替代方案 | 日期 |\n|------|------|----------|------|\n${rows}`;
}

function renderHandoffSection(nextSteps: string[], notes: string[]): string {
  return `**下次继续从这里开始：**\n\n${renderOrdered(nextSteps)}\n\n**注意事项：**\n\n${renderBullets(notes)}`;
}

function renderQuickRecovery(parsed: ParsedTaskList): string {
  const flat = parsed.phases.flatMap((phase) => phase.tasks);
  const done = flat.filter((task) => task.completed).length;
  const total = flat.length;
  const currentPhaseIndex = parsed.phases.findIndex((phase) => phase.tasks.some((task) => task.current));
  const currentTask = flat.find((task) => task.current)?.description ?? '(none)';
  return `**当前阶段**: ${currentPhaseIndex >= 0 ? `阶段 ${currentPhaseIndex + 1} - ${parsed.phases[currentPhaseIndex]?.name}` : '(none)'}\n**当前任务**: ${currentTask}\n**进度**: ${done}/${total} 任务完成`;
}

function renderPhaseTasks(tasks: TaskPhaseTask[]): string {
  return tasks.map((task) => `- [${task.completed ? 'x' : ' '}] ${task.description} | 验收: ${task.acceptance}${task.current ? ' ← CURRENT' : ''}`).join('\n') || '(暂无)';
}

function renderDiscovered(discovered: ParsedTaskList['discovered']): string {
  return discovered.length ? discovered.map((task) => `- [ ] ${task.description} | 来源: ${task.source}`).join('\n') : '(暂无)';
}

function renderRawLines(lines: string[]): string {
  return lines.join('\n') || '(暂无)';
}

function taskPhaseStatus(tasks: TaskPhaseTask[]) {
  const completed = tasks.filter((task) => task.completed).length;
  if (completed === 0) {
    return { icon: '⏳', label: 'NOT STARTED' };
  }
  if (completed === tasks.length) {
    return { icon: '✅', label: 'COMPLETE' };
  }
  return { icon: '🟡', label: 'IN PROGRESS' };
}

function parseTaskLinesFromBody(body: string): TaskPhaseTask[] {
  return body.split('\n').filter((line) => line.startsWith('- [')).map((line) => {
    const taskMatch = line.match(/^- \[([ x])\] (.+?) \| 验收: (.+?)( ← CURRENT)?$/);
    return {
      completed: taskMatch?.[1] === 'x',
      description: taskMatch?.[2] ?? '',
      acceptance: taskMatch?.[3] ?? '',
      current: Boolean(taskMatch?.[4]),
    };
  });
}

function replaceFooterTimestamp(content: string, suffix = ''): string {
  return content.replace(/\*最后更新: .*?\*/g, `*最后更新: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}${suffix ? ` ${suffix}` : ''}*`);
}

function replaceUpdatedDate(content: string): string {
  return content.replace(/\*创建于: ([^|]+) \| 最后更新: .*\*/g, `*创建于: $1 | 最后更新: ${today()}*`);
}

function parseStableReviewId(reviewId: string): { file: string; line: number } | null {
  const match = reviewId.match(/^(plan\.md|log\.md|tasks\.md):L(\d+)$/);
  return match ? { file: match[1], line: Number(match[2]) } : null;
}

function nearestExistingAncestor(path: string): string {
  let current = resolve(path);
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return current;
}

function ensurePositiveLimit(value: number, max: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new CliError('SCHEMA_INVALID', 'limit 必须是正整数');
  }
  if (value > max) {
    throw new CliError('SCHEMA_INVALID', `limit 不能超过 ${max}`);
  }
  return value;
}

function assertRepoControlledPath(
  ctx: CliContext,
  absolutePath: string,
  options: { allowMissingLeaf: boolean; rejectManagedSymlink: boolean; startPath?: string },
) {
  const absolute = resolve(absolutePath);
  const rel = relative(ctx.repoRoot, absolute);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new CliError('OUT_OF_SCOPE', `路径越界: ${absolutePath}`);
  }
  const existingAncestor = options.startPath ? resolve(options.startPath) : nearestExistingAncestor(absolute);
  const realAncestor = realpathSync(existingAncestor);
  const realRel = relative(ctx.repoRealRoot, realAncestor);
  if (realRel.startsWith('..') || isAbsolute(realRel)) {
    throw new CliError('OUT_OF_SCOPE', `真实路径越界: ${absolutePath}`);
  }
  const segments = relative(ctx.repoRoot, absolute).split(sep).filter(Boolean);
  let cursor = ctx.repoRoot;
  for (const segment of segments) {
    cursor = join(cursor, segment);
    if (!existsSync(cursor)) {
      if (options.allowMissingLeaf && cursor === absolute) {
        break;
      }
      continue;
    }
    if (lstatSync(cursor).isSymbolicLink()) {
      throw new CliError('OUT_OF_SCOPE', `拒绝符号链接路径: ${relative(ctx.repoRoot, cursor)}`);
    }
    const realCursorRel = relative(ctx.repoRealRoot, realpathSync(cursor));
    if (realCursorRel.startsWith('..') || isAbsolute(realCursorRel)) {
      throw new CliError('OUT_OF_SCOPE', `真实路径越界: ${absolutePath}`);
    }
  }
  if (options.rejectManagedSymlink && existsSync(absolute) && lstatSync(absolute).isSymbolicLink()) {
    throw new CliError('OUT_OF_SCOPE', `拒绝符号链接路径: ${relative(ctx.repoRoot, absolute)}`);
  }
}

function extractListSection(content: string, heading: string): string[] {
  return extractHeadingSection(content, heading).split('\n').map((line) => line.trim()).filter((line) => line.startsWith('- ')).map((line) => line.slice(2));
}

function extractBulletValues(content: string, heading: string): string[] {
  return extractListSection(content, heading).map((line) => line.replace(/^- /, '').trim());
}

function extractOrderedValues(content: string, heading: string): string[] {
  return extractHeadingSection(content, heading).split('\n').map((line) => line.trim()).filter((line) => /^\d+\. /.test(line));
}

function extractDesignIndex(content: string): string {
  return content.match(/> \*\*Design Source of Truth\*\*: (.+)$/m)?.[1]?.trim() ?? '（暂无）';
}

function extractBulletsBySubHeading(content: string, heading: string): string[] {
  const match = content.match(new RegExp(`### ${escapeRegex(heading)}\\n\\n([\\s\\S]*?)(?=\\n### |\\n---|$)`));
  return extractBulletsFromBlock(match?.[1] ?? '');
}

function extractBulletsFromBlock(content: string): string[] {
  return content.split('\n').map((line) => line.trim()).filter((line) => line.startsWith('- ')).map((line) => line.slice(2));
}

function extractOrderedFromBlock(content: string): string[] {
  return content.split('\n').map((line) => line.trim()).filter((line) => /^\d+\. /.test(line)).map((line) => line.replace(/^\d+\. /, ''));
}

function sectionToHeading(section: string): string {
  const map: Record<string, string> = {
    progress: '会话进展',
    decisions: '关键决策',
    files: '关键文件',
    handoff: '快速交接',
  };
  return map[section] ?? section;
}

function locatePhase(parsed: ParsedTaskList, selector: unknown): TaskPhase {
  if (typeof selector === 'number') {
    const hit = parsed.phases[selector - 1];
    if (hit) {
      return hit;
    }
  }
  if (typeof selector === 'string') {
    const asNumber = Number(selector);
    if (!Number.isNaN(asNumber) && parsed.phases[asNumber - 1]) {
      return parsed.phases[asNumber - 1];
    }
    const byName = parsed.phases.find((phase) => phase.name === selector);
    if (byName) {
      return byName;
    }
  }
  throw new CliError('SCHEMA_INVALID', `未找到阶段: ${String(selector)}`);
}

function locateTask(parsed: ParsedTaskList, selector: Record<string, unknown>): TaskPhaseTask {
  const phase = locatePhase(parsed, selector.phase);
  const byIndex = selector.taskIndex ? phase.tasks[Number(selector.taskIndex) - 1] : undefined;
  if (byIndex) {
    return byIndex;
  }
  if (selector.taskDescription) {
    const byDescription = phase.tasks.find((task) => task.description === selector.taskDescription);
    if (byDescription) {
      return byDescription;
    }
  }
  throw new CliError('SCHEMA_INVALID', '未找到目标任务');
}

function clearCurrent(parsed: ParsedTaskList) {
  parsed.phases.forEach((phase) => phase.tasks.forEach((task) => {
    task.current = false;
  }));
}

function normalizePhases(value: unknown): Array<{ name: string; tasks: Array<{ description: string; acceptance: string }> }> {
  if (!Array.isArray(value)) {
    throw new CliError('SCHEMA_INVALID', 'phases 必须是数组');
  }
  return value.map((phase, phaseIndex) => {
    const record = asRecord(phase, `phases[${phaseIndex}]`);
    validateFields(record, ['name', 'tasks']);
    if (!Array.isArray(record.tasks)) {
      throw new CliError('SCHEMA_INVALID', `phases[${phaseIndex}].tasks 必须是数组`);
    }
    return {
      name: asString(record.name, `phases[${phaseIndex}].name`),
      tasks: record.tasks.map((task, taskIndex) => {
        const taskRecord = asRecord(task, `phases[${phaseIndex}].tasks[${taskIndex}]`);
        validateFields(taskRecord, ['description', 'acceptance']);
        return {
          description: asString(taskRecord.description, `phases[${phaseIndex}].tasks[${taskIndex}].description`),
          acceptance: asString(taskRecord.acceptance, `phases[${phaseIndex}].tasks[${taskIndex}].acceptance`),
        };
      }),
    };
  });
}

function validateTaskId(taskId: string) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(taskId) || taskId.includes('..')) {
    throw new CliError('SCHEMA_INVALID', `非法 taskId: ${taskId}`);
  }
}

function asTaskId(value: unknown, field: string): string {
  const taskId = asString(value, field);
  validateTaskId(taskId);
  return taskId;
}

function resolveTaskId(input: Record<string, unknown>, fromProposal?: Proposal): string {
  const taskId = input.taskId ?? fromProposal?.taskId;
  if (taskId == null) {
    throw new CliError('SCHEMA_INVALID', 'taskId 必须由上游 LLM/编排层显式提供');
  }
  return asTaskId(taskId, 'taskId');
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new CliError('SCHEMA_INVALID', `${field} 必须是非空字符串`);
  }
  return sanitizeSingleLine(value, field);
}

function asOptionalString(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new CliError('SCHEMA_INVALID', '字段必须是字符串');
  }
  return sanitizeSingleLine(value, 'field');
}

function asOptionalStringArray(value: unknown, field: string): string[] | undefined {
  if (value == null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new CliError('SCHEMA_INVALID', `${field} 必须是字符串数组`);
  }
  return value.map((item, index) => asString(item, `${field}[${index}]`));
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new CliError('SCHEMA_INVALID', '字段必须是字符串数组');
  }
  return value.map((item, index) => asString(item, `array[${index}]`));
}

function normalizeTaskContractSeed(input: Record<string, unknown>, fromProposal?: TaskContractSeed): TaskContractSeed {
  return {
    problem: asOptionalString(input.problem) ?? fromProposal?.problem,
    acceptance: asOptionalStringArray(input.acceptance, 'acceptance') ?? fromProposal?.acceptance,
    assumptions: asOptionalStringArray(input.assumptions, 'assumptions') ?? fromProposal?.assumptions,
    constraints: asOptionalStringArray(input.constraints, 'constraints') ?? fromProposal?.constraints,
    risks: asOptionalStringArray(input.risks, 'risks') ?? fromProposal?.risks,
    designIndex: asOptionalString(input.designIndex) ?? fromProposal?.designIndex,
    designSummary: asOptionalStringArray(input.designSummary, 'designSummary') ?? fromProposal?.designSummary,
  };
}

function asMarkdownLine(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new CliError('SCHEMA_INVALID', `${field} 必须是非空字符串`);
  }
  return sanitizeSingleLine(value, field);
}

function assertEnum(value: string, field: string, allowed: string[]): string {
  if (!allowed.includes(value)) {
    throw new CliError('SCHEMA_INVALID', `${field} 仅支持 ${allowed.join(' / ')}`);
  }
  return value;
}

function sanitizeSingleLine(value: string, field: string): string {
  if (/\r|\n/.test(value)) {
    throw new CliError('SCHEMA_INVALID', `${field} 不允许换行`);
  }
  if (containsReservedMarkup(value)) {
    throw new CliError('SCHEMA_INVALID', `${field} 不允许包含保留语法`);
  }
  return value.replace(/[|]/g, '\\|').trim();
}

function containsReservedMarkup(value: string): boolean {
  return /(\[REVIEW(?::[a-z-]+)?\]|\[RESPONSE\]|\[STATUS:[^\]]+\])/i.test(value);
}

function asRecord(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CliError('SCHEMA_INVALID', `${field} 必须是对象`);
  }
  return value as Record<string, unknown>;
}

function readFile(path: string): string {
  return readFileSync(path, 'utf-8');
}

function writeJsonAtomic(ctx: CliContext, path: string, data: unknown) {
  writeTextAtomic(ctx, path, `${JSON.stringify(data, null, 2)}\n`);
}

function writeTextAtomic(ctx: CliContext, path: string, data: string) {
  assertRepoControlledPath(ctx, path, { allowMissingLeaf: true, rejectManagedSymlink: true });
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, path);
}

function renderBullets(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '(暂无)';
}

function renderOrdered(items: string[]): string {
  return items.length ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. (none)';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }
    if (char === '\n' && !inQuotes) {
      row.push(cell.replace(/^\uFEFF/, ''));
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    if (char !== '\r') {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell.replace(/^\uFEFF/, ''));
    rows.push(row);
  }
  return rows;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
