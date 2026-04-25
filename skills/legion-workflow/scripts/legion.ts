#!/usr/bin/env node --experimental-strip-types

import {
  CliError,
  createContext,
  createTask,
  currentTaskId,
  generateDashboard,
  getFlag,
  getStatus,
  hasFlag,
  initLegion,
  listReviews,
  listTasks,
  parseCsv,
  parseJsonFlag,
  printError,
  printSuccess,
  readContextCommand,
  readTasksCommand,
  respondReview,
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

function removedCommand(commandLabel: string): never {
  throw new CliError('UNSUPPORTED_COMMAND', `命令已移除：${commandLabel}`, '改用显式 task-id 的文件系统驱动命令；详情见 REF_TOOLS.md');
}

try {
  validateRequestedFormat();
  switch (command) {
    case 'init': {
      initLegion(ctx);
      printSuccess({ cwd: ctx.cwd, legionRoot: ctx.legionRoot });
      break;
    }
    case 'propose':
      removedCommand('propose');
    case 'proposal': {
      removedCommand(['proposal', subcommand].filter(Boolean).join(' '));
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
        removedCommand('task switch');
      }
      if (subcommand === 'archive') {
        removedCommand('task archive');
      }
      throw new Error('unsupported task subcommand');
    }
    case 'status': {
      printSuccess(getStatus(ctx, getFlag(args, '--task-id')));
      break;
    }
    case 'log': {
      if (subcommand === 'read') {
        const taskId = currentTaskId(ctx, getFlag(args, '--task-id'));
        printSuccess(readContextCommand(ctx, taskId, getFlag(args, '--section') ?? 'all', getFlag(args, '--include-reviews') !== 'false'));
        break;
      }
      if (subcommand === 'update') {
        printSuccess(updateContextCommand(ctx, parseJsonFlag(args)));
        break;
      }
      throw new Error('unsupported log subcommand');
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
        removedCommand('ledger query');
      }
      removedCommand(['ledger', subcommand].filter(Boolean).join(' '));
    }
    default: {
      if (hasFlag(args, '--help') || !command) {
        printSuccess({
          usage: 'legion.ts <init|task|status|log|tasks|plan|review|dashboard> ...',
          example: 'node --experimental-strip-types skills/legion-workflow/scripts/legion.ts init --cwd /path/to/repo',
        });
        break;
      }
      throw new Error(`unsupported command: ${[command, subcommand, maybeThird].filter(Boolean).join(' ')}`);
    }
  }
} catch (error) {
  printError(error);
  process.exit(error instanceof Error && error.message.startsWith('unsupported') ? 1 : 2);
}
