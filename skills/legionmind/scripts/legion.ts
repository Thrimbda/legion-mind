#!/usr/bin/env node --experimental-strip-types

import {
  CliError,
  approveProposal,
  appendFailureAudit,
  archiveTask,
  createContext,
  createProposal,
  createTask,
  currentTaskId,
  generateDashboard,
  getFlag,
  getStatus,
  hasFlag,
  initLegion,
  listProposals,
  listReviews,
  listTasks,
  parseCsv,
  parseJsonFlag,
  printError,
  printSuccess,
  queryLedger,
  readContextCommand,
  readTasksCommand,
  rejectProposal,
  respondReview,
  switchTask,
  updateContextCommand,
  updatePlanCommand,
  updateTasksCommand,
} from './lib/cli.ts';

const args = process.argv.slice(2);
const ctx = createContext(args);
const [command, subcommand, maybeThird] = args.filter((arg) => !arg.startsWith('--'));

function validateRequestedFormat() {
  const format = getFlag(args, '--format');
  if (!format) {
    return;
  }
  if (command === 'dashboard' && subcommand === 'generate') {
    if (!['markdown', 'html'].includes(format)) {
      throw new CliError('SCHEMA_INVALID', 'dashboard generate 仅支持 --format markdown|html');
    }
    return;
  }
  if (format !== 'json') {
    throw new CliError('SCHEMA_INVALID', '当前 CLI 仅支持 --format json');
  }
}

function currentActionLabel() {
  return [command, subcommand].filter(Boolean).join(':') || 'unknown';
}

try {
  validateRequestedFormat();
  switch (command) {
    case 'init': {
      initLegion(ctx);
      printSuccess({ cwd: ctx.cwd, legionRoot: ctx.legionRoot });
      break;
    }
    case 'propose': {
      const proposal = createProposal(ctx, parseJsonFlag(args));
      printSuccess(proposal);
      break;
    }
    case 'proposal': {
      if (subcommand === 'list') {
        printSuccess(listProposals(ctx, (getFlag(args, '--status') as 'pending' | 'approved' | 'rejected' | 'all' | undefined) ?? 'pending'));
        break;
      }
      if (subcommand === 'approve') {
        printSuccess(approveProposal(ctx, getFlag(args, '--proposal-id') ?? ''));
        break;
      }
      if (subcommand === 'reject') {
        printSuccess(rejectProposal(ctx, getFlag(args, '--proposal-id') ?? '', getFlag(args, '--reason')));
        break;
      }
      throw new Error('unsupported proposal subcommand');
    }
    case 'task': {
      if (subcommand === 'create') {
        printSuccess(createTask(ctx, parseJsonFlag(args)));
        break;
      }
      if (subcommand === 'list') {
        printSuccess(listTasks(ctx));
        break;
      }
      if (subcommand === 'switch') {
        printSuccess(switchTask(ctx, getFlag(args, '--task-id') ?? ''));
        break;
      }
      if (subcommand === 'archive') {
        printSuccess(archiveTask(ctx, getFlag(args, '--task-id') ?? ''));
        break;
      }
      throw new Error('unsupported task subcommand');
    }
    case 'status': {
      printSuccess(getStatus(ctx, getFlag(args, '--task-id')));
      break;
    }
    case 'context': {
      if (subcommand === 'read') {
        const taskId = currentTaskId(ctx, getFlag(args, '--task-id'));
        printSuccess(readContextCommand(ctx, taskId, getFlag(args, '--section') ?? 'all', getFlag(args, '--include-reviews') !== 'false'));
        break;
      }
      if (subcommand === 'update') {
        printSuccess(updateContextCommand(ctx, parseJsonFlag(args)));
        break;
      }
      throw new Error('unsupported context subcommand');
    }
    case 'tasks': {
      if (subcommand === 'read') {
        const taskId = currentTaskId(ctx, getFlag(args, '--task-id'));
        printSuccess(readTasksCommand(ctx, taskId));
        break;
      }
      if (subcommand === 'update') {
        printSuccess(updateTasksCommand(ctx, parseJsonFlag(args)));
        break;
      }
      throw new Error('unsupported tasks subcommand');
    }
    case 'plan': {
      if (subcommand === 'update') {
        printSuccess(updatePlanCommand(ctx, parseJsonFlag(args)));
        break;
      }
      throw new Error('unsupported plan subcommand');
    }
    case 'review': {
      if (subcommand === 'list') {
        const taskId = currentTaskId(ctx, getFlag(args, '--task-id'));
        printSuccess(listReviews(ctx, taskId, getFlag(args, '--status') ?? 'open', getFlag(args, '--type') ?? 'all'));
        break;
      }
      if (subcommand === 'respond') {
        const payload = parseJsonFlag(args);
        if (!Object.keys(payload).length) {
          printSuccess(respondReview(ctx, {
            taskId: getFlag(args, '--task-id'),
            file: getFlag(args, '--file'),
            reviewId: getFlag(args, '--review-id'),
            response: getFlag(args, '--response'),
            status: getFlag(args, '--status'),
          }));
        } else {
          printSuccess(respondReview(ctx, payload));
        }
        break;
      }
      throw new Error('unsupported review subcommand');
    }
    case 'dashboard': {
      if (subcommand === 'generate') {
        const taskId = currentTaskId(ctx, getFlag(args, '--task-id'));
        printSuccess(generateDashboard(
          ctx,
          taskId,
          (getFlag(args, '--format') as 'markdown' | 'html' | undefined) ?? 'markdown',
          parseCsv(getFlag(args, '--sections')).length ? parseCsv(getFlag(args, '--sections')) : ['status', 'progress', 'blockers', 'decisions', 'recent_activity'],
          getFlag(args, '--output'),
        ));
        break;
      }
      throw new Error('unsupported dashboard subcommand');
    }
    case 'ledger': {
      if (subcommand === 'query') {
        printSuccess(queryLedger(ctx, {
          taskId: getFlag(args, '--task-id'),
          action: getFlag(args, '--action'),
          since: getFlag(args, '--since'),
          until: getFlag(args, '--until'),
          limit: getFlag(args, '--limit') ? Number(getFlag(args, '--limit')) : undefined,
        }));
        break;
      }
      throw new Error('unsupported ledger subcommand');
    }
    default: {
      if (hasFlag(args, '--help') || !command) {
        printSuccess({
          usage: 'legion.ts <init|propose|proposal|task|status|context|tasks|plan|review|dashboard|ledger> ...',
          example: 'node --experimental-strip-types skills/legionmind/scripts/legion.ts init --cwd /path/to/repo',
        });
        break;
      }
      throw new Error(`unsupported command: ${[command, subcommand, maybeThird].filter(Boolean).join(' ')}`);
    }
  }
} catch (error) {
  appendFailureAudit(ctx, currentActionLabel(), error, getFlag(args, '--task-id') ?? '', '');
  printError(error);
  process.exit(error instanceof Error && error.message.startsWith('unsupported') ? 1 : 2);
}
